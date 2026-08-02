-- Pulse professional reactions: boost | support | useful
-- Migrates feed_reactions -> feed_post_reactions (one row per user per type per post)

-- Rename table to match product naming (skip if already migrated)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'feed_reactions'
  ) THEN
    ALTER TABLE public.feed_reactions RENAME TO feed_post_reactions;
  END IF;
END $$;

-- Convert legacy likes to support
UPDATE public.feed_post_reactions
SET reaction_type = 'support'
WHERE reaction_type IS NULL OR reaction_type = 'like';

-- Drop old single-reaction-per-user constraint
ALTER TABLE public.feed_post_reactions
  DROP CONSTRAINT IF EXISTS feed_reactions_post_id_user_id_key;

ALTER TABLE public.feed_post_reactions
  DROP CONSTRAINT IF EXISTS feed_post_reactions_post_id_user_id_key;

-- Enforce professional reaction types
ALTER TABLE public.feed_post_reactions
  DROP CONSTRAINT IF EXISTS feed_post_reactions_type_check;

ALTER TABLE public.feed_post_reactions
  ADD CONSTRAINT feed_post_reactions_type_check
  CHECK (reaction_type IN ('boost', 'support', 'useful'));

ALTER TABLE public.feed_post_reactions
  DROP CONSTRAINT IF EXISTS feed_post_reactions_unique;

ALTER TABLE public.feed_post_reactions
  ADD CONSTRAINT feed_post_reactions_unique
  UNIQUE (post_id, user_id, reaction_type);

CREATE INDEX IF NOT EXISTS idx_feed_post_reactions_post_id ON public.feed_post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_post_reactions_user_id ON public.feed_post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_post_reactions_reaction_type ON public.feed_post_reactions(reaction_type);

-- RLS (recreate under new table name if policies still reference old name)
DROP POLICY IF EXISTS "feed_reactions_select_all" ON public.feed_post_reactions;
DROP POLICY IF EXISTS "feed_reactions_insert_own" ON public.feed_post_reactions;
DROP POLICY IF EXISTS "feed_reactions_delete_own" ON public.feed_post_reactions;
DROP POLICY IF EXISTS "feed_post_reactions_select_all" ON public.feed_post_reactions;
DROP POLICY IF EXISTS "feed_post_reactions_insert_own" ON public.feed_post_reactions;
DROP POLICY IF EXISTS "feed_post_reactions_delete_own" ON public.feed_post_reactions;

CREATE POLICY "feed_post_reactions_select_all"
  ON public.feed_post_reactions FOR SELECT
  USING (true);

CREATE POLICY "feed_post_reactions_insert_own"
  ON public.feed_post_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "feed_post_reactions_delete_own"
  ON public.feed_post_reactions FOR DELETE
  USING (auth.uid() = user_id);

GRANT SELECT ON public.feed_post_reactions TO anon;
GRANT SELECT, INSERT, DELETE ON public.feed_post_reactions TO authenticated;

-- Pulse notifications for reactions (lightweight; UI can consume later)
CREATE TABLE IF NOT EXISTS public.pulse_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES public.feed_profiles(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES public.feed_profiles(id) ON DELETE SET NULL,
  post_id uuid REFERENCES public.feed_posts(id) ON DELETE CASCADE,
  notification_type text NOT NULL
    CHECK (notification_type IN ('post_boost', 'post_support', 'post_useful')),
  title text NOT NULL,
  body text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pulse_notifications_recipient ON public.pulse_notifications(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pulse_notifications_unread ON public.pulse_notifications(recipient_id) WHERE read_at IS NULL;

ALTER TABLE public.pulse_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pulse_notifications_select_own" ON public.pulse_notifications;
DROP POLICY IF EXISTS "pulse_notifications_update_own" ON public.pulse_notifications;
DROP POLICY IF EXISTS "pulse_notifications_insert_auth" ON public.pulse_notifications;

CREATE POLICY "pulse_notifications_select_own"
  ON public.pulse_notifications FOR SELECT
  USING (auth.uid() = recipient_id);

CREATE POLICY "pulse_notifications_update_own"
  ON public.pulse_notifications FOR UPDATE
  USING (auth.uid() = recipient_id);

CREATE POLICY "pulse_notifications_insert_auth"
  ON public.pulse_notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

GRANT SELECT, UPDATE ON public.pulse_notifications TO authenticated;
GRANT INSERT ON public.pulse_notifications TO authenticated;

NOTIFY pgrst, 'reload schema';
