-- Add preposition to proofreading issue types
ALTER TABLE public.proofreading_issues
  DROP CONSTRAINT IF EXISTS proofreading_issues_type_check;

ALTER TABLE public.proofreading_issues
  ADD CONSTRAINT proofreading_issues_type_check
  CHECK (type IN (
    'grammar',
    'spelling',
    'style',
    'clarity',
    'word_form',
    'tense',
    'repetition',
    'preposition',
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
