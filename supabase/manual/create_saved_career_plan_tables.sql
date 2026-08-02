-- Manual script: saved career plan tables (run in Supabase SQL Editor if needed)
-- Mirrors supabase/migrations/20250622000000_create_saved_career_plan.sql

CREATE TABLE IF NOT EXISTS public.saved_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id uuid NOT NULL,
  course_slug text NOT NULL,
  course_title text NOT NULL,
  path_id text,
  route_label text,
  provider_name text,
  price_label text,
  image_url text,
  status text NOT NULL DEFAULT 'saved',
  source text NOT NULL DEFAULT 'career_hub',
  saved_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_courses_user_id ON public.saved_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_courses_course_id ON public.saved_courses(course_id);
CREATE INDEX IF NOT EXISTS idx_saved_courses_course_slug ON public.saved_courses(course_slug);

CREATE TABLE IF NOT EXISTS public.saved_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  path_id text NOT NULL,
  route_label text NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_routes_user_id ON public.saved_routes(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_routes_path_id ON public.saved_routes(path_id);

CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id text NOT NULL,
  job_title text NOT NULL,
  saved_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON public.saved_jobs(user_id);

ALTER TABLE public.saved_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users manage own saved courses" ON public.saved_courses;
CREATE POLICY "users manage own saved courses"
  ON public.saved_courses FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users manage own saved routes" ON public.saved_routes;
CREATE POLICY "users manage own saved routes"
  ON public.saved_routes FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "users manage own saved jobs" ON public.saved_jobs;
CREATE POLICY "users manage own saved jobs"
  ON public.saved_jobs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_courses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_routes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_jobs TO authenticated;
