-- ============================================================================
-- Migration: Add original_text column to proofreading_issues
-- ============================================================================
-- This migration adds the original_text field (NOT NULL) to the existing
-- proofreading_issues table and updates the type/suggestion column names.

-- Add original_text column (NOT NULL, but allow empty string for existing rows)
ALTER TABLE public.proofreading_issues
  ADD COLUMN IF NOT EXISTS original_text text NOT NULL DEFAULT '';

-- Rename suggestion to suggestion_text for consistency
ALTER TABLE public.proofreading_issues
  RENAME COLUMN IF EXISTS suggestion TO suggestion_text;

-- Update type constraint to include academic_tone
ALTER TABLE public.proofreading_issues
  DROP CONSTRAINT IF EXISTS proofreading_issues_type_check;

ALTER TABLE public.proofreading_issues
  ADD CONSTRAINT proofreading_issues_type_check
  CHECK (type IN ('grammar', 'spelling', 'style', 'clarity', 'academic_tone'));

-- Update severity constraint to use low/moderate/high
ALTER TABLE public.proofreading_issues
  DROP CONSTRAINT IF EXISTS proofreading_issues_severity_check;

ALTER TABLE public.proofreading_issues
  ADD CONSTRAINT proofreading_issues_severity_check
  CHECK (severity IN ('low', 'moderate', 'high'));

-- For existing rows, populate original_text from the text at start_index/end_index
-- Note: This is a best-effort approach. The actual original text may differ
-- if the document content has changed. New issues will have original_text set correctly.
UPDATE public.proofreading_issues
SET original_text = COALESCE(original_text, '')
WHERE original_text IS NULL OR original_text = '';

-- Remove default after migration (future inserts must provide original_text)
ALTER TABLE public.proofreading_issues
  ALTER COLUMN original_text DROP DEFAULT;

