-- Create proofreading tables for JobAZ Proofreading Workspace v2
-- Supports project-based workflow with documents, runs, and issues

-- ============================================================================
-- Helper: Create or replace updated_at trigger function (reusable)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_proofreading_projects_user_id ON public.proofreading_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_proofreading_projects_user_updated ON public.proofreading_projects(user_id, updated_at DESC);

-- Enable RLS
ALTER TABLE public.proofreading_projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own proofreading projects" ON public.proofreading_projects;
DROP POLICY IF EXISTS "Users can insert their own proofreading projects" ON public.proofreading_projects;
DROP POLICY IF EXISTS "Users can update their own proofreading projects" ON public.proofreading_projects;
DROP POLICY IF EXISTS "Users can delete their own proofreading projects" ON public.proofreading_projects;

CREATE POLICY "Users can view their own proofreading projects"
  ON public.proofreading_projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own proofreading projects"
  ON public.proofreading_projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proofreading projects"
  ON public.proofreading_projects FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proofreading projects"
  ON public.proofreading_projects FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_proofreading_projects_updated_at ON public.proofreading_projects;
CREATE TRIGGER trigger_proofreading_projects_updated_at
  BEFORE UPDATE ON public.proofreading_projects
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 2. proofreading_documents Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.proofreading_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.proofreading_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Main Document',
  content text NOT NULL DEFAULT '',
  word_count int NOT NULL DEFAULT 0,
  char_count int NOT NULL DEFAULT 0,
  page_count int NOT NULL DEFAULT 1,
  page_size int NOT NULL DEFAULT 3500,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_proofreading_documents_user_id ON public.proofreading_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_proofreading_documents_project_id ON public.proofreading_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_proofreading_documents_project_updated ON public.proofreading_documents(project_id, updated_at DESC);

-- Enable RLS
ALTER TABLE public.proofreading_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own proofreading documents" ON public.proofreading_documents;
DROP POLICY IF EXISTS "Users can insert their own proofreading documents" ON public.proofreading_documents;
DROP POLICY IF EXISTS "Users can update their own proofreading documents" ON public.proofreading_documents;
DROP POLICY IF EXISTS "Users can delete their own proofreading documents" ON public.proofreading_documents;

CREATE POLICY "Users can view their own proofreading documents"
  ON public.proofreading_documents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own proofreading documents"
  ON public.proofreading_documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proofreading documents"
  ON public.proofreading_documents FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proofreading documents"
  ON public.proofreading_documents FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS trigger_proofreading_documents_updated_at ON public.proofreading_documents;
CREATE TRIGGER trigger_proofreading_documents_updated_at
  BEFORE UPDATE ON public.proofreading_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- ============================================================================
-- 3. proofreading_runs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.proofreading_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.proofreading_projects(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.proofreading_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  model text DEFAULT 'gpt',
  summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_proofreading_runs_document_created ON public.proofreading_runs(document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_proofreading_runs_user_id ON public.proofreading_runs(user_id);

-- Enable RLS
ALTER TABLE public.proofreading_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own proofreading runs" ON public.proofreading_runs;
DROP POLICY IF EXISTS "Users can insert their own proofreading runs" ON public.proofreading_runs;
DROP POLICY IF EXISTS "Users can update their own proofreading runs" ON public.proofreading_runs;
DROP POLICY IF EXISTS "Users can delete their own proofreading runs" ON public.proofreading_runs;

CREATE POLICY "Users can view their own proofreading runs"
  ON public.proofreading_runs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own proofreading runs"
  ON public.proofreading_runs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proofreading runs"
  ON public.proofreading_runs FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proofreading runs"
  ON public.proofreading_runs FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. proofreading_issues Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.proofreading_issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES public.proofreading_runs(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.proofreading_projects(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.proofreading_documents(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('spelling', 'grammar', 'style', 'clarity', 'consistency')),
  severity text NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high')),
  start_index int NOT NULL,
  end_index int NOT NULL,
  original text NOT NULL,
  suggestion text NOT NULL,
  explanation text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'applied', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_proofreading_issues_document_id ON public.proofreading_issues(document_id);
CREATE INDEX IF NOT EXISTS idx_proofreading_issues_run_id ON public.proofreading_issues(run_id);
CREATE INDEX IF NOT EXISTS idx_proofreading_issues_user_id ON public.proofreading_issues(user_id);
CREATE INDEX IF NOT EXISTS idx_proofreading_issues_status ON public.proofreading_issues(status);

-- Enable RLS
ALTER TABLE public.proofreading_issues ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own proofreading issues" ON public.proofreading_issues;
DROP POLICY IF EXISTS "Users can insert their own proofreading issues" ON public.proofreading_issues;
DROP POLICY IF EXISTS "Users can update their own proofreading issues" ON public.proofreading_issues;
DROP POLICY IF EXISTS "Users can delete their own proofreading issues" ON public.proofreading_issues;

CREATE POLICY "Users can view their own proofreading issues"
  ON public.proofreading_issues FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own proofreading issues"
  ON public.proofreading_issues FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proofreading issues"
  ON public.proofreading_issues FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own proofreading issues"
  ON public.proofreading_issues FOR DELETE
  USING (auth.uid() = user_id);

