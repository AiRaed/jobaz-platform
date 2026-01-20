-- ============================================================================
-- Migration: Add Academic Research / PhD issue types
-- ============================================================================
-- This migration adds new issue types for Academic Research mode:
-- - academic_objectivity
-- - academic_hedging
-- - academic_citation

-- Update type constraint to include new academic research types
ALTER TABLE public.proofreading_issues
  DROP CONSTRAINT IF EXISTS proofreading_issues_type_check;

ALTER TABLE public.proofreading_issues
  ADD CONSTRAINT proofreading_issues_type_check
  CHECK (type IN (
    'grammar', 
    'spelling', 
    'style', 
    'clarity', 
    'academic_tone',
    'academic_objectivity',
    'academic_hedging',
    'academic_citation'
  ));

