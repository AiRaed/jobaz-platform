-- JobAZ application email + notifications MVP (Resend)
-- Does not replace Supabase Auth confirmation / reset emails.

CREATE TABLE IF NOT EXISTS public.email_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  to_email text NOT NULL,
  subject text NOT NULL,
  template_key text,
  email_type text NOT NULL CHECK (email_type IN ('service', 'marketing')),
  provider text NOT NULL DEFAULT 'resend',
  status text NOT NULL,
  provider_message_id text,
  error_message text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_user_id ON public.email_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_email_logs_to_email ON public.email_logs (to_email);
CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.email_logs (status);

ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.email_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  email text NOT NULL,
  marketing_allowed boolean NOT NULL DEFAULT false,
  service_emails_allowed boolean NOT NULL DEFAULT true,
  unsubscribed_at timestamptz,
  unsubscribe_token text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_preferences_email_lower
  ON public.email_preferences (lower(email));

CREATE UNIQUE INDEX IF NOT EXISTS idx_email_preferences_unsubscribe_token
  ON public.email_preferences (unsubscribe_token)
  WHERE unsubscribe_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_email_preferences_user_id
  ON public.email_preferences (user_id);

ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.user_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL,
  status text NOT NULL DEFAULT 'unread',
  related_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  read_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_user_notifications_user_id
  ON public.user_notifications (user_id);

CREATE INDEX IF NOT EXISTS idx_user_notifications_status
  ON public.user_notifications (user_id, status);

CREATE INDEX IF NOT EXISTS idx_user_notifications_created_at
  ON public.user_notifications (created_at DESC);

ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;

-- Users can read/update their own notifications
DROP POLICY IF EXISTS "user_notifications_select_own" ON public.user_notifications;
CREATE POLICY "user_notifications_select_own"
  ON public.user_notifications FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "user_notifications_update_own" ON public.user_notifications;
CREATE POLICY "user_notifications_update_own"
  ON public.user_notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can read their own email preferences by user_id
DROP POLICY IF EXISTS "email_preferences_select_own" ON public.email_preferences;
CREATE POLICY "email_preferences_select_own"
  ON public.email_preferences FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "email_preferences_update_own" ON public.email_preferences;
CREATE POLICY "email_preferences_update_own"
  ON public.email_preferences FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

COMMENT ON TABLE public.email_logs IS
  'JobAZ application email attempts via Resend (not Supabase Auth emails).';
COMMENT ON TABLE public.email_preferences IS
  'Service vs marketing email preferences. Marketing requires marketing_allowed=true.';
COMMENT ON TABLE public.user_notifications IS
  'In-app notifications for logged-in users.';
