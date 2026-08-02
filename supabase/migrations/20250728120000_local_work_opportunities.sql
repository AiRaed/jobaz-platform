-- Local work opportunities MVP (small practical gigs — not course_opportunities)
CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  title text NOT NULL,
  category text,
  location text,
  pay_text text,
  date_text text,
  description text,
  contact_preference text,
  poster_name text,
  status text NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review', 'published', 'rejected', 'filled', 'deleted')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS opportunities_status_created_idx
  ON public.opportunities (status, created_at DESC);

CREATE INDEX IF NOT EXISTS opportunities_user_id_idx
  ON public.opportunities (user_id);

CREATE OR REPLACE FUNCTION public.set_opportunities_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS opportunities_set_updated_at ON public.opportunities;
CREATE TRIGGER opportunities_set_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW
  EXECUTE FUNCTION public.set_opportunities_updated_at();

ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Public can read published listings only
DROP POLICY IF EXISTS "opportunities_public_read_published" ON public.opportunities;
CREATE POLICY "opportunities_public_read_published"
  ON public.opportunities
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Authors can read their own submissions
DROP POLICY IF EXISTS "opportunities_owner_read_own" ON public.opportunities;
CREATE POLICY "opportunities_owner_read_own"
  ON public.opportunities
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Logged-in users can create pending_review rows only (cannot self-publish)
DROP POLICY IF EXISTS "opportunities_authenticated_insert_pending" ON public.opportunities;
CREATE POLICY "opportunities_authenticated_insert_pending"
  ON public.opportunities
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'pending_review'
  );

GRANT SELECT ON public.opportunities TO anon, authenticated;
GRANT INSERT ON public.opportunities TO authenticated;
-- Updates/deletes for moderation go through service role (admin API)
