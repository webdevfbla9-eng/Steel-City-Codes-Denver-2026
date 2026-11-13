-- Steel City Codes Denver — RBAC migration
-- Review this script, then run it in the Supabase SQL Editor.
-- It is written to be safe on an existing `public.profiles` table:
-- it does not DROP the table, and it only replaces policies named below.
--
-- Admin accounts are approved at sign-up. Volunteers and parents stay pending
-- until an approved admin confirms them. To promote an existing member:
--   UPDATE public.profiles
--   SET role = 'admin', approval_status = 'approved'
--   WHERE email = 'you@example.com';
--
-- Review any extra policies you may already have:
--   SELECT policyname, cmd, qual, with_check
--   FROM pg_policies
--   WHERE tablename = 'profiles';

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  role TEXT NOT NULL DEFAULT 'student',
  approval_status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS approval_status TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

UPDATE public.profiles SET role = 'student' WHERE role IS NULL OR role = '';
UPDATE public.profiles SET approval_status = 'pending' WHERE approval_status IS NULL OR approval_status = '';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_role_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_role_check
      CHECK (role IN ('student', 'volunteer', 'parent', 'admin'));
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_approval_status_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_approval_status_check
      CHECK (approval_status IN ('pending', 'approved', 'rejected'));
  END IF;
END $$;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

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

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  requested_role TEXT;
  final_status TEXT;
BEGIN
  requested_role := lower(coalesce(NEW.raw_user_meta_data->>'role', 'student'));
  IF requested_role NOT IN ('student', 'volunteer', 'parent', 'admin') THEN
    requested_role := 'student';
  END IF;

  -- Students and admins are approved immediately. Volunteers and parents wait for review.
  IF requested_role IN ('student', 'admin') THEN
    final_status := 'approved';
  ELSE
    final_status := 'pending';
  END IF;

  INSERT INTO public.profiles (id, email, full_name, role, approval_status, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    coalesce(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    requested_role,
    final_status,
    coalesce(NEW.created_at, now())
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user();

CREATE OR REPLACE FUNCTION public.protect_profile_privileges()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.id IS DISTINCT FROM OLD.id THEN
    RAISE EXCEPTION 'Profile id cannot be changed';
  END IF;

  IF current_setting('app.bypass_profile_guard', true) = 'on' THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  -- SQL Editor / service role has no JWT.
  IF auth.uid() IS NULL THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF NEW.id = auth.uid()
    AND NEW.role IS NOT DISTINCT FROM OLD.role
    AND OLD.role = 'admin'
    AND OLD.approval_status = 'pending'
    AND NEW.approval_status = 'approved'
  THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF NEW.id = auth.uid()
    AND NEW.role = 'admin'
    AND NEW.approval_status = 'approved'
    AND EXISTS (
      SELECT 1
      FROM auth.users u
      WHERE u.id = auth.uid()
        AND (
          lower(coalesce(u.raw_user_meta_data->>'role', '')) = 'admin'
          OR lower(u.email) = 'webdevfbla9@gmail.com'
        )
    )
  THEN
    NEW.updated_at := now();
    RETURN NEW;
  END IF;

  IF NEW.id = auth.uid() AND (
    NEW.role IS DISTINCT FROM OLD.role
    OR NEW.approval_status IS DISTINCT FROM OLD.approval_status
  ) THEN
    RAISE EXCEPTION 'Users cannot change their own role or approval status';
  END IF;

  IF NOT public.is_admin() THEN
    NEW.role := OLD.role;
    NEW.approval_status := OLD.approval_status;
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileges ON public.profiles;
CREATE TRIGGER protect_profile_privileges
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE PROCEDURE public.protect_profile_privileges();

CREATE OR REPLACE FUNCTION public.claim_admin_if_pending()
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.profiles;
BEGIN
  UPDATE public.profiles
  SET approval_status = 'approved'
  WHERE id = auth.uid()
    AND role = 'admin'
    AND approval_status = 'pending'
  RETURNING * INTO result;

  IF result IS NULL THEN
    SELECT * INTO result FROM public.profiles WHERE id = auth.uid();
  END IF;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_admin_if_pending() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_admin_if_pending() TO authenticated;

DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_admin_only" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert_own_or_admin" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete_admin_only" ON public.profiles;

CREATE POLICY "profiles_select_own_or_admin"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_update_own_or_admin"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid() OR public.is_admin())
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_insert_own_or_admin"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid() OR public.is_admin());

CREATE POLICY "profiles_delete_admin_only"
  ON public.profiles
  FOR DELETE
  TO authenticated
  USING (public.is_admin());

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT INSERT, DELETE ON public.profiles TO authenticated;
