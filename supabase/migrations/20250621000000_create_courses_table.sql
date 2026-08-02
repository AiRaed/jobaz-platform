-- JobAZ Admin Courses catalogue
-- Table: public.courses (matches lib/admin/courses/mappers.ts payload)
-- Apply via: supabase db push
-- Or paste into Supabase Dashboard → SQL Editor → Run

-- ---------------------------------------------------------------------------
-- Admin allowlist (for RLS when using authenticated client)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.jobaz_admin_emails (
  email text PRIMARY KEY
);

INSERT INTO public.jobaz_admin_emails (email)
VALUES ('raedmahfoud@hotmail.com')
ON CONFLICT (email) DO NOTHING;

CREATE OR REPLACE FUNCTION public.is_jobaz_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.jobaz_admin_emails
    WHERE lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- ---------------------------------------------------------------------------
-- public.courses
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  short_description text,
  full_description text,
  category text,
  appears_in_routes text[] NOT NULL DEFAULT '{}'::text[],
  provider_name text,
  location text,
  delivery_mode text,
  duration text,
  level text,
  price text,
  funding_type text,
  official_url text,
  referral_url text,
  image_url text,
  commission_type text NOT NULL DEFAULT 'none',
  commission_value text,
  is_partner boolean NOT NULL DEFAULT false,
  is_featured boolean NOT NULL DEFAULT false,
  priority_order integer NOT NULL DEFAULT 50,
  status text NOT NULL DEFAULT 'draft',
  show_in_career_hub boolean NOT NULL DEFAULT false,
  clicks integer NOT NULL DEFAULT 0,
  saves integer NOT NULL DEFAULT 0,
  internal_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_courses_status ON public.courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_category ON public.courses(category);
CREATE INDEX IF NOT EXISTS idx_courses_is_partner ON public.courses(is_partner);
CREATE INDEX IF NOT EXISTS idx_courses_is_featured ON public.courses(is_featured);
CREATE INDEX IF NOT EXISTS idx_courses_show_in_career_hub ON public.courses(show_in_career_hub);
CREATE INDEX IF NOT EXISTS idx_courses_updated_at ON public.courses(updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_courses_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS courses_set_updated_at ON public.courses;
CREATE TRIGGER courses_set_updated_at
  BEFORE UPDATE ON public.courses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_courses_updated_at();

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jobaz admins select courses" ON public.courses;
CREATE POLICY "jobaz admins select courses"
  ON public.courses FOR SELECT
  TO authenticated
  USING (public.is_jobaz_admin());

DROP POLICY IF EXISTS "jobaz admins insert courses" ON public.courses;
CREATE POLICY "jobaz admins insert courses"
  ON public.courses FOR INSERT
  TO authenticated
  WITH CHECK (public.is_jobaz_admin());

DROP POLICY IF EXISTS "jobaz admins update courses" ON public.courses;
CREATE POLICY "jobaz admins update courses"
  ON public.courses FOR UPDATE
  TO authenticated
  USING (public.is_jobaz_admin())
  WITH CHECK (public.is_jobaz_admin());

DROP POLICY IF EXISTS "jobaz admins delete courses" ON public.courses;
CREATE POLICY "jobaz admins delete courses"
  ON public.courses FOR DELETE
  TO authenticated
  USING (public.is_jobaz_admin());

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.courses TO authenticated;
GRANT ALL ON TABLE public.courses TO service_role;

-- Reload PostgREST schema cache (fixes "Could not find table in schema cache")
NOTIFY pgrst, 'reload schema';
