-- Run this whole file in the Supabase SQL Editor.
-- Creates parent_inquiries if needed, lets signed-in parents insert rows,
-- and lets admins read every question.

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

ALTER TABLE public.parent_inquiries ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.parent_inquiries ADD COLUMN IF NOT EXISTS name text;
ALTER TABLE public.parent_inquiries ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.parent_inquiries ADD COLUMN IF NOT EXISTS question text;
ALTER TABLE public.parent_inquiries ADD COLUMN IF NOT EXISTS status text;
ALTER TABLE public.parent_inquiries ADD COLUMN IF NOT EXISTS admin_response text;
ALTER TABLE public.parent_inquiries ADD COLUMN IF NOT EXISTS responded_at timestamptz;
ALTER TABLE public.parent_inquiries ADD COLUMN IF NOT EXISTS created_at timestamptz;
ALTER TABLE public.parent_inquiries ADD COLUMN IF NOT EXISTS updated_at timestamptz;

ALTER TABLE public.parent_inquiries ALTER COLUMN status SET DEFAULT 'pending';
ALTER TABLE public.parent_inquiries ALTER COLUMN created_at SET DEFAULT now();
ALTER TABLE public.parent_inquiries ALTER COLUMN updated_at SET DEFAULT now();

UPDATE public.parent_inquiries
SET status = 'pending'
WHERE status IS NULL OR status IN ('new', '');

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
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'parent_inquiries_status_check') THEN
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

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_inquiry_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_parent_inquiries_for_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.submit_parent_inquiry(text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.respond_to_parent_inquiry(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.update_parent_inquiry_status(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_inquiry_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_parent_inquiries_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_parent_inquiry(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.respond_to_parent_inquiry(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_parent_inquiry_status(uuid, text) TO authenticated;

ALTER TABLE public.parent_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_inquiries FORCE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.parent_inquiries TO authenticated;
REVOKE ALL ON public.parent_inquiries FROM anon;
REVOKE DELETE ON public.parent_inquiries FROM authenticated;

DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'parent_inquiries'
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
