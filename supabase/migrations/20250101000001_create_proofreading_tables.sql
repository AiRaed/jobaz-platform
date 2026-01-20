-- Create proofreading tables for JobAZ Proofreading Workspace
-- Supports project-based workflow with document editing

-- ============================================================================
-- 1. proofreading_projects Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.proofreading_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  category text NOT NULL DEFAULT 'General',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on user_id and updated_at for faster queries
CREATE INDEX IF NOT EXISTS idx_proofreading_projects_user_updated ON public.proofreading_projects(user_id, updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.proofreading_projects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can select their own proofreading projects" ON public.proofreading_projects;
DROP POLICY IF EXISTS "Users can insert their own proofreading projects" ON public.proofreading_projects;
DROP POLICY IF EXISTS "Users can update their own proofreading projects" ON public.proofreading_projects;
DROP POLICY IF EXISTS "Users can delete their own proofreading projects" ON public.proofreading_projects;

-- Policy: Users can only select their own projects
CREATE POLICY "Users can select their own proofreading projects"
  ON public.proofreading_projects
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own projects
CREATE POLICY "Users can insert their own proofreading projects"
  ON public.proofreading_projects
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own projects
CREATE POLICY "Users can update their own proofreading projects"
  ON public.proofreading_projects
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own projects
CREATE POLICY "Users can delete their own proofreading projects"
  ON public.proofreading_projects
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 2. proofreading_documents Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.proofreading_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.proofreading_projects(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  word_count int NOT NULL DEFAULT 0,
  estimated_pages numeric NOT NULL DEFAULT 0,
  analysis jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on user_id, project_id, and updated_at for faster queries
CREATE INDEX IF NOT EXISTS idx_proofreading_documents_user_project_updated ON public.proofreading_documents(user_id, project_id, updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.proofreading_documents ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can select their own proofreading documents" ON public.proofreading_documents;
DROP POLICY IF EXISTS "Users can insert their own proofreading documents" ON public.proofreading_documents;
DROP POLICY IF EXISTS "Users can update their own proofreading documents" ON public.proofreading_documents;
DROP POLICY IF EXISTS "Users can delete their own proofreading documents" ON public.proofreading_documents;

-- Policy: Users can only select their own documents
CREATE POLICY "Users can select their own proofreading documents"
  ON public.proofreading_documents
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own documents
CREATE POLICY "Users can insert their own proofreading documents"
  ON public.proofreading_documents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own documents
CREATE POLICY "Users can update their own proofreading documents"
  ON public.proofreading_documents
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own documents
CREATE POLICY "Users can delete their own proofreading documents"
  ON public.proofreading_documents
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 3. Trigger Function to Update updated_at Timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_proofreading_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_proofreading_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_proofreading_projects_updated_at ON public.proofreading_projects;
DROP TRIGGER IF EXISTS update_proofreading_documents_updated_at ON public.proofreading_documents;

-- Create triggers
CREATE TRIGGER update_proofreading_projects_updated_at
  BEFORE UPDATE ON public.proofreading_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_proofreading_projects_updated_at();

CREATE TRIGGER update_proofreading_documents_updated_at
  BEFORE UPDATE ON public.proofreading_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_proofreading_documents_updated_at();

