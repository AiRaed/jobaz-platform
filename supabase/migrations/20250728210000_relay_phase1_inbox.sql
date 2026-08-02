-- JobAZ Relay Phase 1 — professional work inbox (not full messenger)
-- Safe / repeatable. Does not drop existing messenger tables.

CREATE TABLE IF NOT EXISTS public.relay_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  subject text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  body_preview text,
  preferred_contact_time text,
  related_opportunity_id uuid,
  related_course_id uuid,
  related_job_id text,
  related_feed_post_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.relay_threads DROP CONSTRAINT IF EXISTS relay_threads_type_check;
ALTER TABLE public.relay_threads ADD CONSTRAINT relay_threads_type_check CHECK (
  type IN (
    'opportunity_enquiry',
    'cv_help',
    'course_question',
    'jobaz_support',
    'business_enquiry'
  )
);

ALTER TABLE public.relay_threads DROP CONSTRAINT IF EXISTS relay_threads_status_check;
ALTER TABLE public.relay_threads ADD CONSTRAINT relay_threads_status_check CHECK (
  status IN ('open', 'needs_follow_up', 'closed', 'archived')
);

CREATE TABLE IF NOT EXISTS public.relay_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.relay_threads(id) ON DELETE CASCADE,
  sender_role text NOT NULL,
  sender_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.relay_messages DROP CONSTRAINT IF EXISTS relay_messages_sender_role_check;
ALTER TABLE public.relay_messages ADD CONSTRAINT relay_messages_sender_role_check CHECK (
  sender_role IN ('user', 'admin', 'system')
);

CREATE INDEX IF NOT EXISTS idx_relay_threads_user
  ON public.relay_threads (user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_relay_threads_status
  ON public.relay_threads (status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_relay_threads_type
  ON public.relay_threads (type);

CREATE INDEX IF NOT EXISTS idx_relay_messages_thread
  ON public.relay_messages (thread_id, created_at ASC);

ALTER TABLE public.relay_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relay_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "relay_threads_select_own" ON public.relay_threads;
CREATE POLICY "relay_threads_select_own"
  ON public.relay_threads FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "relay_threads_insert_own" ON public.relay_threads;
CREATE POLICY "relay_threads_insert_own"
  ON public.relay_threads FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "relay_threads_update_own" ON public.relay_threads;
CREATE POLICY "relay_threads_update_own"
  ON public.relay_threads FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "relay_messages_select_own" ON public.relay_messages;
CREATE POLICY "relay_messages_select_own"
  ON public.relay_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.relay_threads t
      WHERE t.id = thread_id AND t.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "relay_messages_insert_own" ON public.relay_messages;
CREATE POLICY "relay_messages_insert_own"
  ON public.relay_messages FOR INSERT
  WITH CHECK (
    sender_role = 'user'
    AND sender_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.relay_threads t
      WHERE t.id = thread_id AND t.user_id = auth.uid()
    )
  );

COMMENT ON TABLE public.relay_threads IS
  'Phase 1 Relay professional inbox threads (support, CV, courses, opportunities). Admin replies via service role.';
COMMENT ON TABLE public.relay_messages IS
  'Messages within Relay threads. sender_role: user | admin | system.';
