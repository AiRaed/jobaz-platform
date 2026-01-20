-- Create proofreading_documents table for JobAZ Proofreading Workspace
-- One document per project, stores content and analysis

CREATE TABLE IF NOT EXISTS public.proofreading_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.proofreading_projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text DEFAULT 'Untitled Document',
  content text NOT NULL DEFAULT '',
  word_count integer DEFAULT 0,
  estimated_pages integer DEFAULT 0,
  analysis jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure one document per project
  UNIQUE(project_id)
);

-- Create index on project_id for faster queries
CREATE INDEX IF NOT EXISTS idx_proofreading_documents_project_id ON public.proofreading_documents(project_id);

-- Create index on user_id for security
CREATE INDEX IF NOT EXISTS idx_proofreading_documents_user_id ON public.proofreading_documents(user_id);

-- Create index on updated_at for sorting
CREATE INDEX IF NOT EXISTS idx_proofreading_documents_updated_at ON public.proofreading_documents(updated_at DESC);

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

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_proofreading_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  
  -- Calculate word_count and estimated_pages
  NEW.word_count = array_length(string_to_array(trim(NEW.content), ' '), 1);
  IF NEW.word_count IS NULL THEN
    NEW.word_count = 0;
  END IF;
  NEW.estimated_pages = GREATEST(1, CEIL(NEW.word_count::numeric / 250));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_proofreading_documents_updated_at
  BEFORE UPDATE ON public.proofreading_documents
  FOR EACH ROW
  EXECUTE FUNCTION update_proofreading_documents_updated_at();

-- Also trigger on insert for initial calculation
CREATE OR REPLACE FUNCTION set_proofreading_documents_initial_stats()
RETURNS TRIGGER AS $$
BEGIN
  NEW.word_count = array_length(string_to_array(trim(NEW.content), ' '), 1);
  IF NEW.word_count IS NULL THEN
    NEW.word_count = 0;
  END IF;
  NEW.estimated_pages = GREATEST(1, CEIL(NEW.word_count::numeric / 250));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_proofreading_documents_initial_stats
  BEFORE INSERT ON public.proofreading_documents
  FOR EACH ROW
  EXECUTE FUNCTION set_proofreading_documents_initial_stats();

