/**
 * Multi-select answer encoding for Work in my Experience.
 * Re-exports shared assessment helpers and experience-specific parsers.
 */

export {
  MULTI_SELECT_DELIMITER,
  MULTI_SELECT_HELPER,
  MULTI_SELECT_QUESTION_IDS,
  SINGLE_SELECT_ONLY_IDS,
  PROFESSIONAL_CERTIFICATION_OPTIONS,
  CERT_STATUS_OPTIONS,
  isMultiSelectQuestion,
  parseMultiSelectValue,
  joinMultiSelectValue,
  buildCertificationStatusQuestions,
  parseCertificationStatuses,
  hasQualifiedProfessionalCert,
  inferAccountingBody,
  applyCertificationInference,
  certStatusQuestionId,
  isCertStatusQuestionId,
} from '@/lib/career-engine/shared/assessmentMultiSelect'

import { parseMultiSelectValue } from '@/lib/career-engine/shared/assessmentMultiSelect'

export function parseExperienceSpecialisations(answers: Record<string, string>): string[] {
  const raw = answers.experience_specialisation
  const parsed = parseMultiSelectValue(raw)
  if (parsed.length > 0) return parsed
  if (raw?.trim()) return [raw.trim()]
  return []
}

export function hasMultipleSpecialisations(answers: Record<string, string>): boolean {
  return parseExperienceSpecialisations(answers).length > 1
}

export function formatCombinedLabels(labels: string[]): string {
  if (labels.length === 0) return 'Professional'
  if (labels.length === 1) return labels[0]
  if (labels.length === 2) return `${labels[0]} / ${labels[1]}`
  return `${labels.slice(0, -1).join(', ')} / ${labels[labels.length - 1]}`
}
