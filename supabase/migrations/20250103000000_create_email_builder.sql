-- Create email builder tables for JobAZ Email Builder feature
-- Supports email projects and messages with full proofreading integration

-- ============================================================================
-- 1. email_projects Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.email_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_email_projects_user_id ON public.email_projects(user_id);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_email_projects_updated_at ON public.email_projects(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.email_projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only select their own email projects
CREATE POLICY "Users can select their own email projects"
  ON public.email_projects
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own email projects
CREATE POLICY "Users can insert their own email projects"
  ON public.email_projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own email projects
CREATE POLICY "Users can update their own email projects"
  ON public.email_projects
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own email projects
CREATE POLICY "Users can delete their own email projects"
  ON public.email_projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. email_messages Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.email_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT '',
  greeting text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  closing text NOT NULL DEFAULT '',
  signature text NOT NULL DEFAULT '',
  full_text text NOT NULL DEFAULT '',
  source text NOT NULL DEFAULT 'pasted' CHECK (source IN ('generated', 'pasted', 'improved')),
  meta jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on project_id for faster queries
CREATE INDEX IF NOT EXISTS idx_email_messages_project_id ON public.email_messages(project_id);

-- Create index on user_id for security
CREATE INDEX IF NOT EXISTS idx_email_messages_user_id ON public.email_messages(user_id);

-- Enable Row Level Security
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only select their own email messages
CREATE POLICY "Users can select their own email messages"
  ON public.email_messages
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own email messages
CREATE POLICY "Users can insert their own email messages"
  ON public.email_messages
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own email messages
CREATE POLICY "Users can update their own email messages"
  ON public.email_messages
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own email messages
CREATE POLICY "Users can delete their own email messages"
  ON public.email_messages
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. Trigger to update updated_at timestamp on email_projects
-- ============================================================================
CREATE OR REPLACE FUNCTION update_email_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_projects_updated_at
  BEFORE UPDATE ON public.email_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_email_projects_updated_at();

-- ============================================================================
-- 4. Trigger to update updated_at timestamp on email_messages
-- ============================================================================
CREATE OR REPLACE FUNCTION update_email_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_email_messages_updated_at
  BEFORE UPDATE ON public.email_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_email_messages_updated_at();

