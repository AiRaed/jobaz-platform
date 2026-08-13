-- Optional mobile + message reminder consent on private career identity.
-- Consent storage only — no SMS/WhatsApp provider integration.

ALTER TABLE public.user_career_identity
  ADD COLUMN IF NOT EXISTS mobile_phone text,
  ADD COLUMN IF NOT EXISTS mobile_country_code text,
  ADD COLUMN IF NOT EXISTS message_reminders_opt_in boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS message_reminders_opted_in_at timestamptz,
  ADD COLUMN IF NOT EXISTS message_reminders_opted_out_at timestamptz,
  ADD COLUMN IF NOT EXISTS message_consent_source text DEFAULT 'profile';

-- updated_at already exists on user_career_identity; keep it current via app writes.

COMMENT ON COLUMN public.user_career_identity.mobile_phone IS
  'Optional user mobile for future reminders/alerts. Private — never public.';
COMMENT ON COLUMN public.user_career_identity.message_reminders_opt_in IS
  'Explicit opt-in for career reminder / opportunity messages. Default false.';
COMMENT ON COLUMN public.user_career_identity.message_consent_source IS
  'Where consent was recorded (e.g. profile).';

-- Reaffirm owner-only RLS (policies already exist; recreate for safety).
ALTER TABLE public.user_career_identity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "career_identity_select_own" ON public.user_career_identity;
CREATE POLICY "career_identity_select_own"
  ON public.user_career_identity FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "career_identity_insert_own" ON public.user_career_identity;
CREATE POLICY "career_identity_insert_own"
  ON public.user_career_identity FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "career_identity_update_own" ON public.user_career_identity;
CREATE POLICY "career_identity_update_own"
  ON public.user_career_identity FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
