-- Create proofreading tables for JobAZ Proofreading Workspace
-- Supports project-based workflow with section-based editing

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

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_proofreading_projects_user_id ON public.proofreading_projects(user_id);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_proofreading_projects_updated_at ON public.proofreading_projects(updated_at DESC);

-- Enable Row Level Security
ALTER TABLE public.proofreading_projects ENABLE ROW LEVEL SECURITY;

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
  project_id uuid NOT NULL REFERENCES public.proofreading_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  word_count integer NOT NULL DEFAULT 0,
  estimated_pages integer NOT NULL DEFAULT 0,
  analysis jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on project_id for faster queries
CREATE INDEX IF NOT EXISTS idx_proofreading_documents_project_id ON public.proofreading_documents(project_id);

-- Create index on user_id for security
CREATE INDEX IF NOT EXISTS idx_proofreading_documents_user_id ON public.proofreading_documents(user_id);

-- Enable Row Level Security
ALTER TABLE public.proofreading_documents ENABLE ROW LEVEL SECURITY;

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
-- 3. Trigger to update updated_at timestamp on projects
-- ============================================================================
CREATE OR REPLACE FUNCTION update_proofreading_projects_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proofreading_projects_updated_at
  BEFORE UPDATE ON public.proofreading_projects
  FOR EACH ROW
  EXECUTE FUNCTION update_proofreading_projects_updated_at();

-- ============================================================================
-- 4. Trigger to update updated_at timestamp on documents
-- ============================================================================
CREATE OR REPLACE FUNCTION update_proofreading_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proofreading_documents_updated_at
  BEFORE UPDATE ON public.proofreading_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_proofreading_documents_updated_at();

-- ============================================================================
-- 3. proofreading_issues Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.proofreading_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.proofreading_documents(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('grammar', 'spelling', 'style', 'clarity', 'academic_tone')),
  severity text NOT NULL CHECK (severity IN ('low', 'moderate', 'high')),
  message text NOT NULL,
  original_text text NOT NULL,
  suggestion_text text NOT NULL DEFAULT '',
  start_index integer NOT NULL,
  end_index integer NOT NULL,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'applied', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on document_id for faster queries
CREATE INDEX IF NOT EXISTS idx_proofreading_issues_document_id ON public.proofreading_issues(document_id);

-- Create index on user_id for security
CREATE INDEX IF NOT EXISTS idx_proofreading_issues_user_id ON public.proofreading_issues(user_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_proofreading_issues_status ON public.proofreading_issues(document_id, status);

-- Enable Row Level Security
ALTER TABLE public.proofreading_issues ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only select their own issues
CREATE POLICY "Users can select their own proofreading issues"
  ON public.proofreading_issues
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own issues
CREATE POLICY "Users can insert their own proofreading issues"
  ON public.proofreading_issues
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only update their own issues
CREATE POLICY "Users can update their own proofreading issues"
  ON public.proofreading_issues
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own issues
CREATE POLICY "Users can delete their own proofreading issues"
  ON public.proofreading_issues
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. Trigger to update updated_at timestamp on issues
-- ============================================================================
CREATE OR REPLACE FUNCTION update_proofreading_issues_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proofreading_issues_updated_at
  BEFORE UPDATE ON public.proofreading_issues
  FOR EACH ROW
  EXECUTE FUNCTION update_proofreading_issues_updated_at();

