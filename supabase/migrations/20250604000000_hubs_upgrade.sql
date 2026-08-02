-- JobAZ Hubs: extend feed_groups, seed official hubs, tighten RLS

ALTER TABLE public.feed_groups
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'private')),
  ADD COLUMN IF NOT EXISTS cover_color text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_feed_groups_visibility ON public.feed_groups(visibility);

-- feed_group_members: joined_at alias (keep created_at for compatibility)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'feed_group_members'
      AND column_name = 'joined_at'
  ) THEN
    ALTER TABLE public.feed_group_members
      ADD COLUMN joined_at timestamptz;
    UPDATE public.feed_group_members SET joined_at = created_at WHERE joined_at IS NULL;
    ALTER TABLE public.feed_group_members
      ALTER COLUMN joined_at SET DEFAULT now(),
      ALTER COLUMN joined_at SET NOT NULL;
  END IF;
END $$;

ALTER TABLE public.feed_group_members
  DROP CONSTRAINT IF EXISTS feed_group_members_role_check;

ALTER TABLE public.feed_group_members
  ADD CONSTRAINT feed_group_members_role_check
  CHECK (role IN ('member', 'moderator', 'admin'));

-- Hub creators and group admins can update hub metadata
DROP POLICY IF EXISTS "feed_groups_update_admin" ON public.feed_groups;
CREATE POLICY "feed_groups_update_admin"
  ON public.feed_groups FOR UPDATE
  USING (
    auth.uid() = created_by
    OR EXISTS (
      SELECT 1 FROM public.feed_group_members m
      WHERE m.group_id = feed_groups.id
        AND m.user_id = auth.uid()
        AND m.role IN ('admin', 'moderator')
    )
  );

-- Public hubs visible to all; private hubs visible to members only
DROP POLICY IF EXISTS "feed_groups_select_all" ON public.feed_groups;
CREATE POLICY "feed_groups_select_public_or_member"
  ON public.feed_groups FOR SELECT
  USING (
    visibility = 'public'
    OR is_official = true
    OR created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.feed_group_members m
      WHERE m.group_id = feed_groups.id AND m.user_id = auth.uid()
    )
  );

-- Posting to a hub requires membership (link row in feed_post_groups)
DROP POLICY IF EXISTS "feed_post_groups_insert_auth" ON public.feed_post_groups;
CREATE POLICY "feed_post_groups_insert_member"
  ON public.feed_post_groups FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.feed_group_members m
      WHERE m.group_id = feed_post_groups.group_id
        AND m.user_id = auth.uid()
    )
  );

-- Additional official hubs (no duplicates)
INSERT INTO public.feed_groups (name, slug, description, category, icon, is_official, visibility)
VALUES
  (
    'Small Business & Services',
    'small-business-services',
    'Freelancers, trades, and local service providers building careers in the UK.',
    'Business',
    '🏪',
    true,
    'public'
  ),
  (
    'Training & Certificates',
    'training-certificates',
    'Courses, NVQs, and certifications that help you qualify for better roles.',
    'Training',
    '📜',
    true,
    'public'
  ),
  (
    'Interview Confidence',
    'interview-confidence',
    'Practice answers, manage nerves, and share interview wins and lessons.',
    'Support',
    '🎯',
    true,
    'public'
  )
ON CONFLICT (slug) DO NOTHING;

NOTIFY pgrst, 'reload schema';
