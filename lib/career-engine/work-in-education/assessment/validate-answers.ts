/**
 * Server-side validation for Work in My Education assessment answers.
 */

import {
  getQualificationType,
  listLegacyEducationLevelKeys,
  resolveNormalizedQualification,
} from '@/lib/career-engine/qualification-taxonomy'
import type { AssessmentBlueprint, WorkInEducationAssessmentAnswers } from './types'
import { WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT } from './blueprint'
import { evaluateShowWhen } from './conditions'

const KNOWN_TOP_LEVEL = new Set([
  'education_level',
  'qualification_group',
  'qualification_type',
  'equivalence_status',
  'qualification_title',
  'subject',
  'specialisation',
  'qualification_country',
  'graduation_status',
  'graduation_year',
  'years_relevant_experience',
  'current_job_title',
  'has_uk_experience',
  'registration',
  'licences',
  'skills',
  'english_level',
  'preferences',
  'engineering_registration',
  'qts_status',
  'uk_recognition_confirmed',
])

function getNested(answers: WorkInEducationAssessmentAnswers, key: string): unknown {
  if (!key.includes('.')) return answers[key]
  const [root, child] = key.split('.', 2)
  const obj = answers[root]
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    return (obj as Record<string, unknown>)[child]
  }
  return undefined
}

function isBlank(v: unknown): boolean {
  return v === null || v === undefined || (typeof v === 'string' && v.trim() === '')
}

export type AnswerValidationResult =
  | {
      ok: true
      answers: WorkInEducationAssessmentAnswers
      unknown_keys: string[]
      visible_keys: string[]
    }
  | { ok: false; errors: string[]; unknown_keys: string[]; visible_keys: string[] }

export function validateWorkInEducationAnswers(
  raw: unknown,
  blueprint: AssessmentBlueprint = WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT
): AnswerValidationResult {
  const errors: string[] = []
  const unknown_keys: string[] = []

  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { ok: false, errors: ['answers must be an object'], unknown_keys, visible_keys: [] }
  }

  const answers = { ...(raw as WorkInEducationAssessmentAnswers) }

  for (const key of Object.keys(answers)) {
    if (!KNOWN_TOP_LEVEL.has(key)) {
      unknown_keys.push(key)
      delete answers[key]
    }
  }

  // Derive legacy education_level from taxonomy when missing
  if (
    (!answers.education_level || String(answers.education_level).trim() === '') &&
    answers.qualification_group &&
    answers.qualification_type
  ) {
    const resolved = resolveNormalizedQualification({
      qualification_group: String(answers.qualification_group),
      qualification_type: String(answers.qualification_type),
      equivalence_status: answers.equivalence_status
        ? String(answers.equivalence_status)
        : null,
      uk_recognition_confirmed: answers.uk_recognition_confirmed
        ? String(answers.uk_recognition_confirmed)
        : null,
      qualification_country: answers.qualification_country
        ? String(answers.qualification_country)
        : null,
    })
    answers.education_level = resolved.education_level_legacy
  }

  const visible = blueprint.questions.filter((q) => evaluateShowWhen(q.show_when, answers))
  const visible_keys = visible.map((q) => q.key)

  for (const question of visible) {
    if (!question.required) continue
    if (
      question.key === 'education_level' ||
      question.key === 'qualification_group' ||
      question.key === 'qualification_type'
    ) {
      continue
    }
    const value = getNested(answers, question.key)
    if (isBlank(value) && value !== 0 && value !== false) {
      errors.push(`Required answer missing: ${question.key}`)
    }
  }

  const hasTaxonomy =
    !isBlank(answers.qualification_group) && !isBlank(answers.qualification_type)
  const hasLegacy = !isBlank(answers.education_level)
  if (!hasTaxonomy && !hasLegacy) {
    errors.push('education_level or qualification_group+qualification_type is required')
  }

  if (
    !isBlank(answers.qualification_type) &&
    !getQualificationType(String(answers.qualification_type))
  ) {
    errors.push(`Invalid qualification_type: ${answers.qualification_type}`)
  }

  const level = answers.education_level
  if (level && typeof level === 'string') {
    const allowed = new Set([
      ...(blueprint.questions
        .find((q) => q.key === 'education_level')
        ?.options?.map((o) => o.value) ?? []),
      ...listLegacyEducationLevelKeys(),
    ])
    if (allowed.size && !allowed.has(level)) {
      errors.push(`Invalid education_level: ${level}`)
    }
  }

  if (answers.graduation_status) {
    const allowed = new Set(['completed', 'studying', 'incomplete'])
    if (!allowed.has(String(answers.graduation_status))) {
      errors.push(`Invalid graduation_status: ${answers.graduation_status}`)
    }
  }

  if (answers.graduation_year != null && answers.graduation_year !== undefined) {
    const y = Number(answers.graduation_year)
    if (!Number.isFinite(y) || y < 1950 || y > 2040) {
      errors.push('graduation_year must be between 1950 and 2040')
    }
  }

  if (answers.years_relevant_experience != null && answers.years_relevant_experience !== undefined) {
    const y = Number(answers.years_relevant_experience)
    if (!Number.isFinite(y) || y < 0 || y > 60) {
      errors.push('years_relevant_experience must be between 0 and 60')
    }
  }

  const subject = typeof answers.subject === 'string' ? answers.subject.trim() : ''
  if (!subject) {
    errors.push('subject is required')
  }

  const title =
    typeof answers.qualification_title === 'string' ? answers.qualification_title.trim() : ''
  if (!title) {
    errors.push('qualification_title is required')
  }

  if (!answers.qualification_country || String(answers.qualification_country).trim() === '') {
    errors.push('qualification_country is required')
  }

  if (errors.length) {
    return { ok: false, errors: [...new Set(errors)], unknown_keys, visible_keys }
  }

  return { ok: true, answers, unknown_keys, visible_keys }
}
