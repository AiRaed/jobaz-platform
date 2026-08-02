-- JobAZ managed jobs catalogue (admin + unified job search)
-- External jobs (Adzuna/Reed) are not stored here — only JobAZ-managed listings.

CREATE TABLE IF NOT EXISTS public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company_name text NOT NULL,
  location text,
  salary text,
  job_type text,
  description text NOT NULL DEFAULT '',
  requirements text,
  benefits text,
  apply_url text,
  company_website text,
  source text NOT NULL DEFAULT 'jobaz' CHECK (source IN ('jobaz', 'adzuna', 'reed')),
  featured boolean NOT NULL DEFAULT false,
  partner_company boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  archived boolean NOT NULL DEFAULT false,
  expiry_date timestamptz,
  route_tags text[] NOT NULL DEFAULT '{}'::text[],
  -- AI-ready fields (matching not implemented yet)
  priority_score integer NOT NULL DEFAULT 50,
  skills_tags text[] NOT NULL DEFAULT '{}'::text[],
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_jobs_active ON public.jobs(active) WHERE archived = false;
CREATE INDEX IF NOT EXISTS idx_jobs_featured ON public.jobs(featured) WHERE active = true AND archived = false;
CREATE INDEX IF NOT EXISTS idx_jobs_partner ON public.jobs(partner_company) WHERE active = true AND archived = false;
CREATE INDEX IF NOT EXISTS idx_jobs_route_tags ON public.jobs USING gin(route_tags);
CREATE INDEX IF NOT EXISTS idx_jobs_expiry ON public.jobs(expiry_date);
CREATE INDEX IF NOT EXISTS idx_jobs_updated_at ON public.jobs(updated_at DESC);

CREATE OR REPLACE FUNCTION public.set_jobs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_jobs_updated_at ON public.jobs;
CREATE TRIGGER trg_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_jobs_updated_at();

ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Public read: active, non-archived JobAZ listings not expired
CREATE POLICY jobs_public_read ON public.jobs
  FOR SELECT
  USING (
    source = 'jobaz'
    AND active = true
    AND archived = false
    AND (expiry_date IS NULL OR expiry_date > now())
  );

-- Admin full access (uses existing is_jobaz_admin from courses migration)
CREATE POLICY jobs_admin_all ON public.jobs
  FOR ALL
  USING (public.is_jobaz_admin())
  WITH CHECK (public.is_jobaz_admin());
