/**
 * Work in My Education — configurable quality-gate thresholds (Batch 2).
 */

export const QUALITY_GATE_THRESHOLDS = {
  /** Minimum score to accept a primary specialism without clarification */
  minSpecialismConfidence: 0.42,
  /** First must beat second by at least this margin on broad subjects */
  minScoreMargin: 0.12,
  /** On broad subjects, if 2+ specialisms within this window of the top → ambiguous */
  broadSubjectAmbiguityWindow: 0.1,
  /** Minimum absolute score for a candidate to appear in clarification options */
  clarificationMinScore: 0.15,
} as const

/** Subjects that are too broad to force a narrow specialism without discriminating evidence. */
export const BROAD_SUBJECT_KEYS = new Set([
  'law',
  'laws',
  'legal studies',
  'engineering',
  'business',
  'business studies',
  'business management',
  'management',
  'biology',
  'biological sciences',
  'psychology',
  'nursing',
  'computing',
  'computer science',
  'art',
  'arts',
  'fine art',
  'languages',
  'modern languages',
  'education',
  'teaching',
])

export type ClarificationReason =
  | 'missing_subject'
  | 'broad_subject_multiple_valid_specialisms'
  | 'low_confidence'
  | 'close_score_margin'
  | 'registration_scope_unknown'
  | null
