-- Add analysis column to proofreading_documents if it doesn't exist
-- This migration is safe to run multiple times

-- Add analysis column if missing
ALTER TABLE public.proofreading_documents 
ADD COLUMN IF NOT EXISTS analysis jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Update any existing rows that might have NULL analysis
UPDATE public.proofreading_documents 
SET analysis = '{}'::jsonb 
WHERE analysis IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.proofreading_documents.analysis IS 'Stores proofreading analysis results as JSONB';

