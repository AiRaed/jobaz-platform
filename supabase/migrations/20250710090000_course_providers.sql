-- Affiliate providers / partners registry (admin-only)
CREATE TABLE IF NOT EXISTS public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  website_url text,
  affiliate_dashboard_url text,
  affiliate_status text NOT NULL DEFAULT 'Unknown',
  account_status text NOT NULL DEFAULT 'Unknown',
  default_commission_type text,
  default_commission_value text,
  default_public_offer_label text,
  tracking_method text,
  notes text,
  contact_email text,
  login_notes text,
  payout_notes text,
  estimated_conversion_rate_percent numeric NOT NULL DEFAULT 5,
  average_order_value numeric,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_providers_name ON public.providers (name);
CREATE INDEX IF NOT EXISTS idx_providers_affiliate_status ON public.providers (affiliate_status);
CREATE INDEX IF NOT EXISTS idx_providers_account_status ON public.providers (account_status);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

-- Manual / confirmed earnings from provider dashboards
CREATE TABLE IF NOT EXISTS public.provider_commission_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  report_type text NOT NULL DEFAULT 'Manual',
  clicks integer NOT NULL DEFAULT 0,
  referrals integer NOT NULL DEFAULT 0,
  confirmed_sales integer NOT NULL DEFAULT 0,
  confirmed_commission numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'GBP',
  status text NOT NULL DEFAULT 'Pending',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_provider_commission_reports_provider
  ON public.provider_commission_reports (provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_commission_reports_status
  ON public.provider_commission_reports (status);

ALTER TABLE public.provider_commission_reports ENABLE ROW LEVEL SECURITY;

-- Enrich click analytics with provider + referral URL used at click time
ALTER TABLE public.course_clicks
  ADD COLUMN IF NOT EXISTS provider_name text,
  ADD COLUMN IF NOT EXISTS referral_url text;
