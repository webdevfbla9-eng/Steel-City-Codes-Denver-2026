-- Run this whole file in the Supabase SQL Editor.
-- Writes a public.profiles row for student, parent, volunteer, and admin
-- on sign-in, lets admins list and approve accounts, and imports the four
-- known members. Does not confirm emails or change Authentication settings.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Cast text into whatever type profiles.role / approval_status actually are
-- (text in some projects, user_role enum in this one).
CREATE OR REPLACE FUNCTION public.as_profile_role(p text)
RETURNS public.profiles.role%TYPE
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  result public.profiles.role%TYPE;
BEGIN
  IF p IS NULL OR lower(p) NOT IN ('student', 'volunteer', 'parent', 'admin') THEN
    result := 'student';
  ELSE
    result := lower(p);
  END IF;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.as_profile_status(p text)
RETURNS public.profiles.approval_status%TYPE
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  result public.profiles.approval_status%TYPE;
BEGIN
  IF p IS NULL OR lower(p) NOT IN ('pending', 'approved', 'rejected') THEN
    result := 'pending';
  ELSE
    result := lower(p);
  END IF;
  RETURN result;
END;
$$;

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
  final_status text;
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
  final_status := CASE WHEN requested IN ('student', 'admin') THEN 'approved' ELSE 'pending' END;

  INSERT INTO public.profiles (id, email, full_name, role, approval_status, created_at, updated_at)
  VALUES (
    auth.uid(),
    coalesce(auth.jwt() ->> 'email', ''),
    coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', auth.jwt() -> 'user_metadata' ->> 'name', ''),
    public.as_profile_role(requested),
    public.as_profile_status(final_status),
    now(),
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

CREATE OR REPLACE FUNCTION public.claim_admin_from_metadata()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  result public.profiles;
  allowed BOOLEAN := FALSE;
BEGIN
  allowed :=
    lower(coalesce(auth.jwt() -> 'user_metadata' ->> 'role', '')) = 'admin'
    OR lower(coalesce(auth.jwt() ->> 'email', '')) = 'webdevfbla9@gmail.com';

  IF NOT allowed THEN
    SELECT * INTO result FROM public.profiles WHERE id = auth.uid();
    RETURN result;
  END IF;

  PERFORM set_config('app.bypass_profile_guard', 'on', true);

  UPDATE public.profiles
  SET
    role = public.as_profile_role('admin'),
    approval_status = public.as_profile_status('approved'),
    updated_at = now()
  WHERE id = auth.uid()
  RETURNING * INTO result;

  IF result.id IS NULL AND auth.uid() IS NOT NULL THEN
    INSERT INTO public.profiles (id, email, full_name, role, approval_status, created_at, updated_at)
    VALUES (
      auth.uid(),
      coalesce(auth.jwt() ->> 'email', ''),
      coalesce(auth.jwt() -> 'user_metadata' ->> 'full_name', auth.jwt() -> 'user_metadata' ->> 'name', ''),
      public.as_profile_role('admin'),
      public.as_profile_status('approved'),
      now(),
      now()
    )
    ON CONFLICT (id) DO UPDATE
    SET
      role = public.as_profile_role('admin'),
      approval_status = public.as_profile_status('approved'),
      updated_at = now()
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_admin_if_pending()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
DECLARE
  result public.profiles;
BEGIN
  UPDATE public.profiles
  SET approval_status = public.as_profile_status('approved'), updated_at = now()
  WHERE id = auth.uid()
    AND role = public.as_profile_role('admin')
    AND approval_status = public.as_profile_status('pending')
  RETURNING * INTO result;

  IF result IS NULL THEN
    SELECT * INTO result FROM public.profiles WHERE id = auth.uid();
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
    ORDER BY created_at DESC NULLS LAST, email ASC;
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
  SET approval_status = public.as_profile_status(p_status), updated_at = now()
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

  UPDATE public.profiles
  SET role = public.as_profile_role(p_role), updated_at = now()
  WHERE id = p_id
  RETURNING * INTO result;

  IF result.id IS NULL THEN
    RAISE EXCEPTION 'That account could not be found.';
  END IF;

  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.seed_known_profiles()
RETURNS SETOF public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
SET row_security = off
AS $$
DECLARE
  today timestamptz := date_trunc('day', now());
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can import accounts.';
  END IF;

  PERFORM set_config('app.bypass_profile_guard', 'on', true);

  INSERT INTO public.profiles (id, email, full_name, role, approval_status, created_at, updated_at)
  SELECT
    u.id,
    u.email,
    coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1), ''),
    public.as_profile_role(s.role),
    public.as_profile_status(s.approval_status),
    today,
    now()
  FROM auth.users u
  JOIN (
    VALUES
      ('webdevfbla9@gmail.com', 'admin', 'approved'),
      ('yuzechen2010@gmail.com', 'parent', 'pending'),
      ('ychen6@cherrycreekschools.org', 'student', 'approved'),
      ('clucy6075@gmail.com', 'volunteer', 'pending')
  ) AS s(email, role, approval_status)
    ON lower(u.email) = s.email
  ON CONFLICT (id) DO NOTHING;

  RETURN QUERY
    SELECT p.*
    FROM public.profiles p
    WHERE lower(p.email) IN (
      'webdevfbla9@gmail.com',
      'yuzechen2010@gmail.com',
      'ychen6@cherrycreekschools.org',
      'clucy6075@gmail.com'
    )
    ORDER BY p.email;
END;
$$;

REVOKE ALL ON FUNCTION public.as_profile_role(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.as_profile_status(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_own_profile() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_admin_from_metadata() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_admin_if_pending() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_profiles_for_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_profile_approval(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.set_profile_role(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.seed_known_profiles() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.as_profile_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.as_profile_status(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_own_profile() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin_from_metadata() TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_pending() TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_profiles_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_profile_approval(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_profile_role(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.seed_known_profiles() TO authenticated;

DROP POLICY IF EXISTS "profiles_insert_admin_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_insert_own_or_admin"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_admin());

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

SELECT public.seed_known_profiles();

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
