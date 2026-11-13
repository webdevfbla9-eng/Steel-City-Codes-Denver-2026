-- Run this whole file in the Supabase SQL Editor.

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

CREATE TABLE IF NOT EXISTS public.activity_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  type text NOT NULL,
  audience text,
  role text,
  path text,
  form text,
  name text,
  email text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS activity_events_created_at_idx
  ON public.activity_events (created_at DESC);

DROP FUNCTION IF EXISTS public.log_site_activity(text, text, text, text, text, text, text, jsonb);
DROP FUNCTION IF EXISTS public.log_site_activity(jsonb);

CREATE OR REPLACE FUNCTION public.log_site_activity(p_event jsonb)
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
  IF coalesce(p_event->>'type', '') = '' THEN
    RAISE EXCEPTION 'Missing activity type.';
  END IF;

  INSERT INTO public.activity_events (
    user_id, type, audience, role, path, form, name, email, payload, created_at
  )
  VALUES (
    auth.uid(),
    trim(p_event->>'type'),
    nullif(trim(coalesce(p_event->>'audience', '')), ''),
    nullif(trim(coalesce(p_event->>'role', '')), ''),
    nullif(trim(coalesce(p_event->>'path', '')), ''),
    nullif(trim(coalesce(p_event->>'form', '')), ''),
    nullif(trim(coalesce(p_event->>'name', '')), ''),
    nullif(trim(coalesce(p_event->>'email', '')), ''),
    coalesce(p_event, '{}'::jsonb),
    now()
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_activity_for_admin()
RETURNS SETOF public.activity_events
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
SET row_security = off
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Only administrators can view activity.';
  END IF;
  RETURN QUERY
    SELECT *
    FROM public.activity_events
    ORDER BY created_at DESC
    LIMIT 2000;
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

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.log_site_activity(jsonb) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.list_activity_for_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_site_activity(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.list_activity_for_admin() TO authenticated;

ALTER TABLE public.activity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_events FORCE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.activity_events TO authenticated;
REVOKE ALL ON public.activity_events FROM anon;
REVOKE UPDATE, DELETE ON public.activity_events FROM authenticated;

DROP POLICY IF EXISTS "activity_events_select_admin" ON public.activity_events;
DROP POLICY IF EXISTS "activity_events_insert_own" ON public.activity_events;

CREATE POLICY "activity_events_select_admin"
  ON public.activity_events
  FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "activity_events_insert_own"
  ON public.activity_events
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.activity_events;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
