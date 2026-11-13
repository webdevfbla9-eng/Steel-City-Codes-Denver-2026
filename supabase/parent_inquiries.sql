-- Review this file, then run it in the Supabase SQL Editor.
-- Prefer supabase/inquiries.sql if you only need parent questions stored.
-- For empty profiles tables, also run supabase/profiles.sql.

CREATE TABLE IF NOT EXISTS public.parent_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  question text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_response text,
  responded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

UPDATE public.parent_inquiries
SET status = 'pending'
WHERE status IS NULL OR status IN ('new', '');

ALTER TABLE public.parent_inquiries
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS question text,
  ADD COLUMN IF NOT EXISTS status text,
  ADD COLUMN IF NOT EXISTS admin_response text,
  ADD COLUMN IF NOT EXISTS responded_at timestamptz,
  ADD COLUMN IF NOT EXISTS created_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.parent_inquiries
  ALTER COLUMN status SET DEFAULT 'pending';

ALTER TABLE public.parent_inquiries
  ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.parent_inquiries
  ALTER COLUMN updated_at SET DEFAULT now();

DO $$
BEGIN
  ALTER TABLE public.parent_inquiries DROP CONSTRAINT IF EXISTS parent_inquiries_user_id_fkey;
  ALTER TABLE public.parent_inquiries
    ADD CONSTRAINT parent_inquiries_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES auth.users (id) ON DELETE CASCADE;
EXCEPTION
  WHEN undefined_table THEN NULL;
  WHEN undefined_object THEN NULL;
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'parent_inquiries_status_check'
  ) THEN
    ALTER TABLE public.parent_inquiries DROP CONSTRAINT parent_inquiries_status_check;
  END IF;
  ALTER TABLE public.parent_inquiries
    ADD CONSTRAINT parent_inquiries_status_check
    CHECK (status IN ('pending', 'in_progress', 'answered', 'closed'));
END $$;

CREATE OR REPLACE FUNCTION public.touch_parent_inquiry()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS touch_parent_inquiry ON public.parent_inquiries;
CREATE TRIGGER touch_parent_inquiry
  BEFORE UPDATE ON public.parent_inquiries
  FOR EACH ROW
  EXECUTE PROCEDURE public.touch_parent_inquiry();

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT
    auth.uid() IS NOT NULL
    AND (
      EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND (
            (role = 'admin' AND approval_status = 'approved')
            OR lower(coalesce(email, '')) = 'webdevfbla9@gmail.com'
          )
      )
      OR lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'admin'
      OR lower(coalesce(
        auth.jwt() ->> 'email',
        auth.jwt() -> 'user_metadata' ->> 'email',
        ''
      )) = 'webdevfbla9@gmail.com'
    );
$$;

CREATE OR REPLACE FUNCTION public.is_inquiry_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT public.is_admin();
$$;

CREATE OR REPLACE FUNCTION public.list_parent_inquiries_for_admin()
RETURNS SETOF public.parent_inquiries
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NOT public.is_inquiry_admin() THEN
    RAISE EXCEPTION 'Only administrators can view parent questions.';
  END IF;
  RETURN QUERY
    SELECT *
    FROM public.parent_inquiries
    ORDER BY created_at DESC NULLS LAST;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_approved_parent(p_id uuid DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
  SELECT
    p_id IS NOT NULL
    AND p_id = auth.uid()
    AND coalesce(
      (SELECT p.approval_status FROM public.profiles p WHERE p.id = p_id),
      'approved'
    ) <> 'rejected'
    AND (
      EXISTS (
        SELECT 1
        FROM public.profiles p
        WHERE p.id = p_id
          AND p.role = 'parent'
      )
      OR lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'parent'
    );
$$;

CREATE OR REPLACE FUNCTION public.ensure_own_profile()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  result public.profiles;
  requested text;
  requested_role public.profiles.role%TYPE;
  final_status public.profiles.approval_status%TYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be logged in.';
  END IF;

  SELECT * INTO result FROM public.profiles WHERE id = auth.uid();
  IF result.id IS NOT NULL THEN
    RETURN result;
  END IF;

  requested := lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', 'student'));
  IF requested NOT IN ('student', 'volunteer', 'parent', 'admin') THEN
    requested := 'student';
  END IF;
  IF lower(coalesce(auth.jwt() ->> 'email', '')) = 'webdevfbla9@gmail.com' THEN
    requested := 'admin';
  END IF;
  requested_role := requested;
  final_status := CASE WHEN requested IN ('student', 'admin') THEN 'approved' ELSE 'pending' END;

  INSERT INTO public.profiles (id, email, full_name, role, approval_status, created_at)
  VALUES (
    auth.uid(),
    coalesce(auth.jwt() ->> 'email', ''),
    coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', auth.jwt() -> 'user_metadata' ->> 'name', ''),
    requested_role,
    final_status,
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  SELECT * INTO result FROM public.profiles WHERE id = auth.uid();
  IF result.id IS NULL THEN
    RAISE EXCEPTION 'Your profile could not be created.';
  END IF;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_parent_inquiry(p_name text, p_email text, p_question text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'You must be logged in.';
  END IF;
  BEGIN
    PERFORM public.ensure_own_profile();
  EXCEPTION
    WHEN undefined_function THEN NULL;
  END;
  IF length(trim(coalesce(p_name, ''))) = 0
    OR length(trim(coalesce(p_email, ''))) = 0
    OR length(trim(coalesce(p_question, ''))) = 0
  THEN
    RAISE EXCEPTION 'Please complete your name, email, and question.';
  END IF;

  INSERT INTO public.parent_inquiries (user_id, name, email, question, status, created_at, updated_at)
  VALUES (auth.uid(), trim(p_name), trim(p_email), trim(p_question), 'pending', now(), now())
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.respond_to_parent_inquiry(p_id uuid, p_response text)
RETURNS public.parent_inquiries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  result public.parent_inquiries;
BEGIN
  IF NOT public.is_inquiry_admin() THEN
    RAISE EXCEPTION 'Only administrators can respond to parent questions.';
  END IF;
  IF length(trim(coalesce(p_response, ''))) = 0 THEN
    RAISE EXCEPTION 'Write a response first.';
  END IF;

  UPDATE public.parent_inquiries
  SET
    admin_response = trim(p_response),
    responded_at = now(),
    status = 'answered',
    updated_at = now()
  WHERE id = p_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'That question could not be found.';
  END IF;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_parent_inquiry_status(p_id uuid, p_status text)
RETURNS public.parent_inquiries
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  result public.parent_inquiries;
BEGIN
  IF NOT public.is_inquiry_admin() THEN
    RAISE EXCEPTION 'Only administrators can update parent questions.';
  END IF;
  IF p_status IS NULL OR p_status NOT IN ('pending', 'in_progress', 'answered', 'closed') THEN
    RAISE EXCEPTION 'Choose a valid status.';
  END IF;

  UPDATE public.parent_inquiries
  SET status = p_status, updated_at = now()
  WHERE id = p_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'That question could not be found.';
  END IF;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_profiles_for_admin()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can view accounts.';
  END IF;
  RETURN QUERY
    SELECT *
    FROM public.profiles
    ORDER BY created_at DESC NULLS LAST;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_profile_approval(p_id uuid, p_status text)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  result public.profiles;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can update accounts.';
  END IF;
  IF p_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot change your own role or approval status.';
  END IF;
  IF p_status IS NULL OR p_status NOT IN ('pending', 'approved', 'rejected') THEN
    RAISE EXCEPTION 'Choose a valid status.';
  END IF;

  PERFORM set_config('app.bypass_profile_guard', 'on', true);

  UPDATE public.profiles
  SET approval_status = p_status, updated_at = now()
  WHERE id = p_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'That account could not be found.';
  END IF;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_profile_role(p_id uuid, p_role text)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  result public.profiles;
  next_role public.profiles.role%TYPE;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can update accounts.';
  END IF;
  IF p_id = auth.uid() THEN
    RAISE EXCEPTION 'You cannot change your own role or approval status.';
  END IF;
  IF p_role IS NULL OR p_role NOT IN ('student', 'volunteer', 'parent', 'admin') THEN
    RAISE EXCEPTION 'Choose a valid role.';
  END IF;

  PERFORM set_config('app.bypass_profile_guard', 'on', true);
  next_role := p_role;

  UPDATE public.profiles
  SET role = next_role, updated_at = now()
  WHERE id = p_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'That account could not be found.';
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_inquiry_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_approved_parent(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_parent_inquiry(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.respond_to_parent_inquiry(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_parent_inquiry_status(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_parent_inquiries_for_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_profiles_for_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_profile_approval(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_profile_role(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_own_profile() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_inquiry_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_approved_parent(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_parent_inquiry(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_parent_inquiry(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_parent_inquiry_status(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_parent_inquiries_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_profiles_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_profile_approval(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_profile_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_own_profile() TO authenticated;

ALTER TABLE public.parent_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_inquiries FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.parent_inquiries TO authenticated;
REVOKE ALL ON public.parent_inquiries FROM anon;
REVOKE DELETE ON public.parent_inquiries FROM authenticated;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'parent_inquiries'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.parent_inquiries', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "parent_inquiries_select_own_or_admin"
  ON public.parent_inquiries
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_inquiry_admin());

CREATE POLICY "parent_inquiries_insert_own"
  ON public.parent_inquiries
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "parent_inquiries_update_admin_only"
  ON public.parent_inquiries
  FOR UPDATE
  TO authenticated
  USING (public.is_inquiry_admin())
  WITH CHECK (public.is_inquiry_admin());

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.parent_inquiries;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
