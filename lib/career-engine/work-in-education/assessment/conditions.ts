/**
 * Deterministic show_when evaluation for assessment questions.
 */

import type { ShowWhenCondition, ShowWhenGroup, WorkInEducationAssessmentAnswers } from './types'

function getAnswerValue(
  answers: WorkInEducationAssessmentAnswers,
  key: string
): unknown {
  if (key.includes('.')) {
    const [root, child] = key.split('.', 2)
    const obj = answers[root]
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      return (obj as Record<string, unknown>)[child]
    }
    return undefined
  }
  return answers[key]
}

function evalCondition(cond: ShowWhenCondition, answers: WorkInEducationAssessmentAnswers): boolean {
  const raw = getAnswerValue(answers, cond.answer_key)
  const expected = cond.expected_value

  switch (cond.operator) {
    case 'truthy':
      return Boolean(raw) && raw !== 'no' && raw !== 'none' && raw !== 'unsure'
    case 'falsy':
      return raw === null || raw === undefined || raw === '' || raw === false || raw === 'no' || raw === 'none'
    case 'equals':
      return raw === expected || String(raw ?? '') === String(expected ?? '')
    case 'not_equals':
      return raw !== expected && String(raw ?? '') !== String(expected ?? '')
    case 'in':
      return Array.isArray(expected) && expected.map(String).includes(String(raw ?? ''))
    case 'not_in':
      return Array.isArray(expected) && !expected.map(String).includes(String(raw ?? ''))
    case 'contains': {
      const hay = String(raw ?? '').toLowerCase()
      const needle = String(expected ?? '').toLowerCase()
      return Boolean(needle) && hay.includes(needle)
    }
    default:
      return false
  }
}

export function evaluateShowWhen(
  group: ShowWhenGroup | null | undefined,
  answers: WorkInEducationAssessmentAnswers
): boolean {
  if (!group || !group.conditions?.length) return true
  if (group.logic === 'or') {
    return group.conditions.some((c) => evalCondition(c, answers))
  }
  return group.conditions.every((c) => evalCondition(c, answers))
}

/** Heuristic signals from free-text answers for field-aware condition helpers. */
export function answerSuggestsNursing(answers: WorkInEducationAssessmentAnswers): boolean {
  const blob = `${answers.subject ?? ''} ${answers.qualification_title ?? ''} ${answers.specialisation ?? ''}`.toLowerCase()
  return /\bnurs|midwif/.test(blob)
}

export function answerSuggestsMedicine(answers: WorkInEducationAssessmentAnswers): boolean {
  const blob = `${answers.subject ?? ''} ${answers.qualification_title ?? ''}`.toLowerCase()
  return /\bmedicine\b|\bmbbs\b|\bmbchb\b|\bmedical\b/.test(blob)
}

export function answerSuggestsLaw(answers: WorkInEducationAssessmentAnswers): boolean {
  const blob = `${answers.subject ?? ''} ${answers.qualification_title ?? ''}`.toLowerCase()
  return /\blaw\b|\bllb\b|\bllm\b|\blegal\b/.test(blob)
}

export function answerSuggestsEngineering(answers: WorkInEducationAssessmentAnswers): boolean {
  const blob = `${answers.subject ?? ''} ${answers.qualification_title ?? ''}`.toLowerCase()
  return /\bengineer|\bbeng\b|\bmeng\b/.test(blob)
}

export function answerSuggestsTeaching(answers: WorkInEducationAssessmentAnswers): boolean {
  const blob = `${answers.subject ?? ''} ${answers.qualification_title ?? ''}`.toLowerCase()
  return /\bteach|\beducation\b|\bqts\b|\bpgce\b/.test(blob)
}

export function isNonUkCountry(country: string | null | undefined): boolean {
  if (!country) return false
  const c = country.trim().toLowerCase()
  return !['uk', 'united kingdom', 'great britain', 'england', 'scotland', 'wales', 'northern ireland', 'gb'].includes(c)
}
