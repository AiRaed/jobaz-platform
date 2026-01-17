-- Create saved_jobs table for Job Finder saved jobs persistence
-- This replaces localStorage-based saved jobs with Supabase persistence

CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_key text NOT NULL,
  job jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Ensure one saved job per user per job_key
  UNIQUE(user_id, job_key)
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_id ON public.saved_jobs(user_id);

-- Create index on job_key for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job_key ON public.saved_jobs(job_key);

-- Enable Row Level Security
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only select their own saved jobs
CREATE POLICY "Users can select their own saved jobs"
  ON public.saved_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can only insert their own saved jobs
CREATE POLICY "Users can insert their own saved jobs"
  ON public.saved_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only delete their own saved jobs
CREATE POLICY "Users can delete their own saved jobs"
  ON public.saved_jobs
  FOR DELETE
  USING (auth.uid() = user_id);

