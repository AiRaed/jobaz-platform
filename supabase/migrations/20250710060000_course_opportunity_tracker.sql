-- Internal admin course opportunity tracker (not public)

CREATE TABLE IF NOT EXISTS public.course_opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_name text NOT NULL,
  short_label text,
  course_purpose text,
  priority integer NOT NULL DEFAULT 50,
  opportunity_status text NOT NULL DEFAULT 'Need provider',
  publish_status text NOT NULL DEFAULT 'Not published',
  importance text,
  notes text,
  next_action text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.course_opportunity_routes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.course_opportunities(id) ON DELETE CASCADE,
  route_key text NOT NULL,
  route_label text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.course_opportunity_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.course_opportunities(id) ON DELETE CASCADE,
  provider_name text NOT NULL,
  provider_status text NOT NULL DEFAULT 'Need check',
  affiliate_status text NOT NULL DEFAULT 'Unknown',
  official_url text,
  referral_url text,
  dashboard_url text,
  commission_type text,
  commission_value text,
  public_offer_label text,
  tracking_method text,
  notes text,
  is_preferred boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_opportunity_routes_opportunity
  ON public.course_opportunity_routes(opportunity_id);

CREATE INDEX IF NOT EXISTS idx_course_opportunity_providers_opportunity
  ON public.course_opportunity_providers(opportunity_id);

ALTER TABLE public.course_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_opportunity_routes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.course_opportunity_providers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS course_opportunities_admin_all ON public.course_opportunities;
CREATE POLICY course_opportunities_admin_all ON public.course_opportunities
  FOR ALL USING (public.is_jobaz_admin()) WITH CHECK (public.is_jobaz_admin());

DROP POLICY IF EXISTS course_opportunity_routes_admin_all ON public.course_opportunity_routes;
CREATE POLICY course_opportunity_routes_admin_all ON public.course_opportunity_routes
  FOR ALL USING (public.is_jobaz_admin()) WITH CHECK (public.is_jobaz_admin());

DROP POLICY IF EXISTS course_opportunity_providers_admin_all ON public.course_opportunity_providers;
CREATE POLICY course_opportunity_providers_admin_all ON public.course_opportunity_providers
  FOR ALL USING (public.is_jobaz_admin()) WITH CHECK (public.is_jobaz_admin());

NOTIFY pgrst, 'reload schema';
