-- ============================================================================
-- Migration: Add PhD-level issue types
-- ============================================================================
-- This migration adds new issue types for comprehensive PhD-level analysis:
-- - academic_logic
-- - structure
-- - academic_style
-- - methodology
-- - evidence
-- - research_quality

-- Update type constraint to include new PhD-level types
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
    'academic_citation',
    'academic_logic',
    'structure',
    'academic_style',
    'methodology',
    'evidence',
    'research_quality'
  ));

