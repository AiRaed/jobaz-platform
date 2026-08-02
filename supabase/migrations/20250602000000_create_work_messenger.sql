-- JobAZ Work Messenger — professional inbox (profiles, Pulse, opportunities, business)

-- ---------------------------------------------------------------------------
-- conversations
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'direct'
    CHECK (type IN ('direct', 'opportunity', 'business', 'support')),
  title text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  related_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  related_business_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  related_opportunity_post_id uuid REFERENCES public.feed_posts(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_type ON public.conversations(type);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON public.conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_opportunity ON public.conversations(related_opportunity_post_id)
  WHERE related_opportunity_post_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- conversation_participants
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member'
    CHECK (role IN ('member', 'owner', 'business_owner', 'guest')),
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_read_at timestamptz,
  muted boolean NOT NULL DEFAULT false,
  CONSTRAINT conversation_participants_unique UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON public.conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON public.conversation_participants(conversation_id);

-- ---------------------------------------------------------------------------
-- messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL DEFAULT '',
  message_type text NOT NULL DEFAULT 'text'
    CHECK (message_type IN (
      'text', 'system', 'image', 'file', 'appointment_request', 'call_request', 'opportunity_interest'
    )),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);

-- ---------------------------------------------------------------------------
-- message_attachments
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.message_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_type text,
  file_name text,
  file_size integer,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_message_attachments_message ON public.message_attachments(message_id);

-- ---------------------------------------------------------------------------
-- conversation_requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversation_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  related_opportunity_post_id uuid REFERENCES public.feed_posts(id) ON DELETE SET NULL,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT conversation_requests_no_self CHECK (requester_id <> target_user_id)
);

CREATE INDEX IF NOT EXISTS idx_conversation_requests_target ON public.conversation_requests(target_user_id, status);
CREATE INDEX IF NOT EXISTS idx_conversation_requests_requester ON public.conversation_requests(requester_id, status);

-- ---------------------------------------------------------------------------
-- appointment_requests
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.appointment_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  requester_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  proposed_time timestamptz NOT NULL,
  message text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointment_requests_conversation ON public.appointment_requests(conversation_id);

-- ---------------------------------------------------------------------------
-- call_sessions
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  call_type text NOT NULL CHECK (call_type IN ('audio', 'video')),
  status text NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested', 'scheduled', 'active', 'ended', 'declined')),
  scheduled_time timestamptz,
  provider text NOT NULL DEFAULT 'placeholder',
  meeting_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_call_sessions_conversation ON public.call_sessions(conversation_id);

-- ---------------------------------------------------------------------------
-- Helper: participant check for RLS
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.is_conversation_participant(p_conversation_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = p_conversation_id AND cp.user_id = auth.uid()
  );
$$;

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update" ON public.conversations;

CREATE POLICY "conversations_select" ON public.conversations FOR SELECT
  USING (public.is_conversation_participant(id));

CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE
  USING (public.is_conversation_participant(id));

DROP POLICY IF EXISTS "conversation_participants_select" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_insert" ON public.conversation_participants;
DROP POLICY IF EXISTS "conversation_participants_update" ON public.conversation_participants;

CREATE POLICY "conversation_participants_select" ON public.conversation_participants FOR SELECT
  USING (user_id = auth.uid() OR public.is_conversation_participant(conversation_id));

CREATE POLICY "conversation_participants_insert" ON public.conversation_participants FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id AND c.created_by = auth.uid()
    )
  );

CREATE POLICY "conversation_participants_update" ON public.conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "messages_select" ON public.messages;
DROP POLICY IF EXISTS "messages_insert" ON public.messages;
DROP POLICY IF EXISTS "messages_update" ON public.messages;

CREATE POLICY "messages_select" ON public.messages FOR SELECT
  USING (public.is_conversation_participant(conversation_id) AND deleted_at IS NULL);

CREATE POLICY "messages_insert" ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND public.is_conversation_participant(conversation_id)
  );

CREATE POLICY "messages_update" ON public.messages FOR UPDATE
  USING (sender_id = auth.uid());

DROP POLICY IF EXISTS "message_attachments_select" ON public.message_attachments;
DROP POLICY IF EXISTS "message_attachments_insert" ON public.message_attachments;

CREATE POLICY "message_attachments_select" ON public.message_attachments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id AND public.is_conversation_participant(m.conversation_id)
    )
  );

CREATE POLICY "message_attachments_insert" ON public.message_attachments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.messages m
      WHERE m.id = message_id AND m.sender_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "conversation_requests_select" ON public.conversation_requests;
DROP POLICY IF EXISTS "conversation_requests_insert" ON public.conversation_requests;
DROP POLICY IF EXISTS "conversation_requests_update" ON public.conversation_requests;
DROP POLICY IF EXISTS "conversation_requests_delete" ON public.conversation_requests;

CREATE POLICY "conversation_requests_select" ON public.conversation_requests FOR SELECT
  USING (requester_id = auth.uid() OR target_user_id = auth.uid());

CREATE POLICY "conversation_requests_insert" ON public.conversation_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid());

CREATE POLICY "conversation_requests_update" ON public.conversation_requests FOR UPDATE
  USING (requester_id = auth.uid() OR target_user_id = auth.uid());

CREATE POLICY "conversation_requests_delete" ON public.conversation_requests FOR DELETE
  USING (requester_id = auth.uid() OR target_user_id = auth.uid());

DROP POLICY IF EXISTS "appointment_requests_select" ON public.appointment_requests;
DROP POLICY IF EXISTS "appointment_requests_insert" ON public.appointment_requests;
DROP POLICY IF EXISTS "appointment_requests_update" ON public.appointment_requests;

CREATE POLICY "appointment_requests_select" ON public.appointment_requests FOR SELECT
  USING (public.is_conversation_participant(conversation_id));

CREATE POLICY "appointment_requests_insert" ON public.appointment_requests FOR INSERT
  WITH CHECK (requester_id = auth.uid() AND public.is_conversation_participant(conversation_id));

CREATE POLICY "appointment_requests_update" ON public.appointment_requests FOR UPDATE
  USING (public.is_conversation_participant(conversation_id));

DROP POLICY IF EXISTS "call_sessions_select" ON public.call_sessions;
DROP POLICY IF EXISTS "call_sessions_insert" ON public.call_sessions;
DROP POLICY IF EXISTS "call_sessions_update" ON public.call_sessions;

CREATE POLICY "call_sessions_select" ON public.call_sessions FOR SELECT
  USING (public.is_conversation_participant(conversation_id));

CREATE POLICY "call_sessions_insert" ON public.call_sessions FOR INSERT
  WITH CHECK (created_by = auth.uid() AND public.is_conversation_participant(conversation_id));

CREATE POLICY "call_sessions_update" ON public.call_sessions FOR UPDATE
  USING (public.is_conversation_participant(conversation_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.messages TO authenticated;
GRANT SELECT, INSERT ON public.message_attachments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.appointment_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.call_sessions TO authenticated;

NOTIFY pgrst, 'reload schema';
