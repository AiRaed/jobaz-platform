-- JobAZ Email Matching System (admin-controlled campaigns)
-- Extends email MVP; does not replace email_preferences used by sendJobazEmail.
-- Safe / repeatable: CREATE TABLE IF NOT EXISTS before any ALTER / INDEX / COMMENT / FK use.

-- =============================================================================
-- 1) Create tables (order matters for FKs)
-- =============================================================================

-- 1a) Granular user email preferences (consent never assumed)
CREATE TABLE IF NOT EXISTS public.user_email_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  marketing_consent boolean NOT NULL DEFAULT false,
  job_alerts boolean NOT NULL DEFAULT false,
  course_alerts boolean NOT NULL DEFAULT false,
  local_opportunity_alerts boolean NOT NULL DEFAULT false,
  career_tips boolean NOT NULL DEFAULT false,
  plan_reminders boolean NOT NULL DEFAULT true,
  product_updates boolean NOT NULL DEFAULT false,
  unsubscribed_all boolean NOT NULL DEFAULT false,
  consent_source text,
  consented_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 1b) Campaigns
CREATE TABLE IF NOT EXISTS public.email_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  campaign_type text NOT NULL,
  status text NOT NULL DEFAULT 'draft',
  source_type text,
  source_id text,
  audience_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_summary text,
  draft_subject text,
  draft_body text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  sent_at timestamptz
);

-- 1c) Campaign recipients (requires email_campaigns)
CREATE TABLE IF NOT EXISTS public.email_campaign_recipients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.email_campaigns(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  match_score integer NOT NULL DEFAULT 0,
  match_reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  consent_status text NOT NULL,
  status text NOT NULL DEFAULT 'suggested',
  created_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz
);

-- 1d) Email send logs (create base table if MVP migration was never applied)
CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  template_key text,
  email_type text NOT NULL,
  provider text NOT NULL DEFAULT 'resend',
  status text NOT NULL,
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- 2) Extend email_logs with campaign_id (table now guaranteed to exist)
-- =============================================================================

ALTER TABLE public.email_logs
  ADD COLUMN IF NOT EXISTS campaign_id uuid;

-- Add FK only if missing (safe on re-run; does not drop data)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'email_logs_campaign_id_fkey'
      AND conrelid = 'public.email_logs'::regclass
  ) THEN
    ALTER TABLE public.email_logs
      ADD CONSTRAINT email_logs_campaign_id_fkey
      FOREIGN KEY (campaign_id)
      REFERENCES public.email_campaigns(id)
      ON DELETE SET NULL;
  END IF;
END $$;

-- =============================================================================
-- 3) Indexes
-- =============================================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email_prefs_email_lower
  ON public.user_email_preferences (lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_user_email_prefs_user_id
  ON public.user_email_preferences (user_id)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_user_email_prefs_marketing
  ON public.user_email_preferences (marketing_consent)
  WHERE marketing_consent = true AND unsubscribed_all = false;

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status
  ON public.email_campaigns (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_type
  ON public.email_campaigns (campaign_type);

CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_campaign
  ON public.email_campaign_recipients (campaign_id, status);

CREATE INDEX IF NOT EXISTS idx_email_campaign_recipients_user
  ON public.email_campaign_recipients (user_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_user_id
  ON public.email_logs (user_id);

CREATE INDEX IF NOT EXISTS idx_email_logs_to_email
  ON public.email_logs (to_email);

CREATE INDEX IF NOT EXISTS idx_email_logs_created_at
  ON public.email_logs (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_logs_status
  ON public.email_logs (status);

CREATE INDEX IF NOT EXISTS idx_email_logs_campaign_id
  ON public.email_logs (campaign_id);

-- =============================================================================
-- 4) RLS
-- =============================================================================

ALTER TABLE public.user_email_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Admin access for campaigns/recipients/logs via service role only (no public policies)

DROP POLICY IF EXISTS "user_email_prefs_select_own" ON public.user_email_preferences;
CREATE POLICY "user_email_prefs_select_own"
  ON public.user_email_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_email_prefs_update_own" ON public.user_email_preferences;
CREATE POLICY "user_email_prefs_update_own"
  ON public.user_email_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_email_prefs_insert_own" ON public.user_email_preferences;
CREATE POLICY "user_email_prefs_insert_own"
  ON public.user_email_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- 5) Comments
-- =============================================================================

COMMENT ON TABLE public.user_email_preferences IS
  'Granular JobAZ email preferences. Marketing consent must be explicit (default false).';
COMMENT ON TABLE public.email_campaigns IS
  'Admin-reviewed email campaigns. AI suggests; admin must approve send.';
COMMENT ON TABLE public.email_campaign_recipients IS
  'Suggested/approved recipients for a campaign with match + consent status.';
COMMENT ON TABLE public.email_logs IS
  'Application email send log (Resend). campaign_id links optional admin campaigns.';
COMMENT ON COLUMN public.email_logs.campaign_id IS
  'Optional link to email_campaigns when send originated from an admin campaign.';
