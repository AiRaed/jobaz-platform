-- Fix Work Messenger RLS: allow safe conversation creation + secure RPC helpers

-- ---------------------------------------------------------------------------
-- Helpers (SECURITY DEFINER — used by RLS and RPC)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.are_users_connected(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profile_connections pc
    WHERE pc.status = 'connected'
      AND (
        (pc.requester_id = user_a AND pc.target_user_id = user_b)
        OR (pc.requester_id = user_b AND pc.target_user_id = user_a)
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.find_direct_conversation_id(user_a uuid, user_b uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.id
  FROM public.conversations c
  WHERE c.type = 'direct'
    AND c.related_opportunity_post_id IS NULL
    AND (
      SELECT count(*)::int
      FROM public.conversation_participants cp
      WHERE cp.conversation_id = c.id
    ) = 2
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = c.id AND cp.user_id = user_a
    )
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = c.id AND cp.user_id = user_b
    )
  ORDER BY c.updated_at DESC
  LIMIT 1;
$$;

-- ---------------------------------------------------------------------------
-- RPC: create direct conversation between connected users
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_direct_conversation(target_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  conv_id uuid;
  existing_id uuid;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF target_user_id IS NULL OR target_user_id = caller_id THEN
    RAISE EXCEPTION 'Invalid target user';
  END IF;

  IF NOT public.are_users_connected(caller_id, target_user_id) THEN
    RAISE EXCEPTION 'Connect with this user before starting a direct chat';
  END IF;

  existing_id := public.find_direct_conversation_id(caller_id, target_user_id);
  IF existing_id IS NOT NULL THEN
    RETURN existing_id;
  END IF;

  INSERT INTO public.conversations (type, created_by)
  VALUES ('direct', caller_id)
  RETURNING id INTO conv_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id, role, last_read_at)
  VALUES
    (conv_id, caller_id, 'owner', now()),
    (conv_id, target_user_id, 'member', NULL);

  RETURN conv_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: create opportunity conversation (connected users)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_opportunity_conversation(
  target_user_id uuid,
  post_id uuid,
  conv_title text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  conv_id uuid;
  existing_id uuid;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF target_user_id IS NULL OR target_user_id = caller_id THEN
    RAISE EXCEPTION 'Invalid target user';
  END IF;

  IF post_id IS NULL THEN
    RAISE EXCEPTION 'Opportunity post is required';
  END IF;

  IF NOT public.are_users_connected(caller_id, target_user_id) THEN
    RAISE EXCEPTION 'Connect with this user before starting an opportunity chat';
  END IF;

  SELECT c.id INTO existing_id
  FROM public.conversations c
  WHERE c.type = 'opportunity'
    AND c.related_opportunity_post_id = post_id
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = c.id AND cp.user_id = caller_id
    )
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = c.id AND cp.user_id = target_user_id
    )
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RETURN existing_id;
  END IF;

  INSERT INTO public.conversations (type, title, created_by, related_opportunity_post_id)
  VALUES ('opportunity', conv_title, caller_id, post_id)
  RETURNING id INTO conv_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id, role, last_read_at)
  VALUES
    (conv_id, caller_id, 'owner', now()),
    (conv_id, target_user_id, 'member', NULL);

  RETURN conv_id;
END;
$$;

-- ---------------------------------------------------------------------------
-- RPC: create business inquiry conversation
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_business_conversation(
  target_user_id uuid,
  business_profile_id uuid DEFAULT NULL,
  conv_title text DEFAULT 'Business inquiry'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  conv_id uuid;
  existing_id uuid;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF target_user_id IS NULL OR target_user_id = caller_id THEN
    RAISE EXCEPTION 'Invalid target user';
  END IF;

  SELECT c.id INTO existing_id
  FROM public.conversations c
  WHERE c.type = 'business'
    AND c.created_by = caller_id
    AND (
      business_profile_id IS NULL
      OR c.related_business_profile_id = business_profile_id
    )
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = c.id AND cp.user_id = caller_id
    )
    AND EXISTS (
      SELECT 1 FROM public.conversation_participants cp
      WHERE cp.conversation_id = c.id AND cp.user_id = target_user_id
    )
  ORDER BY c.updated_at DESC
  LIMIT 1;

  IF existing_id IS NOT NULL THEN
    RETURN existing_id;
  END IF;

  INSERT INTO public.conversations (
    type, title, created_by, related_business_profile_id
  )
  VALUES ('business', conv_title, caller_id, business_profile_id)
  RETURNING id INTO conv_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id, role, last_read_at)
  VALUES
    (conv_id, caller_id, 'owner', now()),
    (conv_id, target_user_id, 'business_owner', NULL);

  RETURN conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_direct_conversation(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_opportunity_conversation(uuid, uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_business_conversation(uuid, uuid, text) TO authenticated;

-- ---------------------------------------------------------------------------
-- RPC: create conversation when accepting a message request (connection optional)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_conversation_from_request(
  requester_id uuid,
  post_id uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  caller_id uuid := auth.uid();
  conv_id uuid;
  conv_type text;
  existing_id uuid;
BEGIN
  IF caller_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF requester_id IS NULL OR requester_id = caller_id THEN
    RAISE EXCEPTION 'Invalid requester';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.conversation_requests cr
    WHERE cr.status = 'pending'
      AND cr.requester_id = create_conversation_from_request.requester_id
      AND cr.target_user_id = caller_id
      AND (
        post_id IS NULL
        OR cr.related_opportunity_post_id = post_id
        OR cr.related_opportunity_post_id IS NULL
      )
  ) THEN
    RAISE EXCEPTION 'No pending conversation request found';
  END IF;

  IF post_id IS NOT NULL THEN
    RETURN public.create_opportunity_conversation(requester_id, post_id, NULL);
  END IF;

  IF public.are_users_connected(caller_id, requester_id) THEN
    RETURN public.create_direct_conversation(requester_id);
  END IF;

  conv_type := 'direct';
  existing_id := public.find_direct_conversation_id(caller_id, requester_id);
  IF existing_id IS NOT NULL THEN
    RETURN existing_id;
  END IF;

  INSERT INTO public.conversations (type, created_by)
  VALUES (conv_type, caller_id)
  RETURNING id INTO conv_id;

  INSERT INTO public.conversation_participants (conversation_id, user_id, role, last_read_at)
  VALUES
    (conv_id, caller_id, 'owner', now()),
    (conv_id, requester_id, 'member', NULL);

  RETURN conv_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_conversation_from_request(uuid, uuid) TO authenticated;

-- ---------------------------------------------------------------------------
-- RLS policy updates
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "conversations_select" ON public.conversations;
DROP POLICY IF EXISTS "conversations_insert" ON public.conversations;
DROP POLICY IF EXISTS "conversations_update" ON public.conversations;

-- Creator can read immediately after insert (before participant row visible to self in edge cases)
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT
  USING (
    public.is_conversation_participant(id)
    OR created_by = auth.uid()
  );

CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT
  WITH CHECK (
    created_by = auth.uid()
    AND type IN ('direct', 'opportunity', 'business', 'support')
  );

CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE
  USING (public.is_conversation_participant(id));

DROP POLICY IF EXISTS "conversation_participants_insert" ON public.conversation_participants;

CREATE POLICY "conversation_participants_insert" ON public.conversation_participants FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1
      FROM public.conversations c
      WHERE c.id = conversation_id
        AND c.created_by = auth.uid()
        AND (
          c.type IN ('business', 'opportunity', 'support')
          OR public.are_users_connected(auth.uid(), user_id)
        )
    )
  );

DROP POLICY IF EXISTS "messages_insert" ON public.messages;

CREATE POLICY "messages_insert" ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND public.is_conversation_participant(conversation_id)
  );

NOTIFY pgrst, 'reload schema';
