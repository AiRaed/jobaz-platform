/**
 * Detect hesitation / confusion from recent answers — adapts JAZ tone and question style.
 */

import type { CareerProfile } from './types'

export type UncertaintySignals = {
  isUncertain: boolean
  simplifyLanguage: boolean
  reassuranceNeeded: boolean
  reasons: string[]
}

const UNCERTAIN_TOKENS = [
  'not_sure',
  'not sure',
  'unsure',
  'dont_know',
  "don't know",
  'maybe',
  'confused',
  'unclear',
]

export function detectUncertainty(
  answers: Record<string, unknown>,
  lastQuestionId?: string | null,
  profile?: CareerProfile | null
): UncertaintySignals {
  const reasons: string[] = []
  let isUncertain = false

  const checkValue = (v: unknown) => {
    const s = String(v ?? '').toLowerCase()
    if (UNCERTAIN_TOKENS.some((t) => s.includes(t))) {
      isUncertain = true
      reasons.push(`Answer "${s}" signals uncertainty`)
    }
  }

  if (lastQuestionId && answers[lastQuestionId] !== undefined) {
    checkValue(answers[lastQuestionId])
  }

  for (const key of ['goal_gate', 'intent', 'rel', 'training_openness']) {
    if (answers[key] !== undefined) checkValue(answers[key])
  }

  const simplifyLanguage =
    profile?.ukReadiness.englishLevel === 'basic' ||
    profile?.ukReadiness.englishLevel === 'functional' ||
    profile?.barriers.language === true

  const reassuranceNeeded =
    isUncertain ||
    profile?.barriers.confidence === true ||
    profile?.careerDirection.confidenceLevel === 'low' ||
    profile?.barriers.unclearDirection === true

  if (profile?.barriers.unclearDirection) {
    reasons.push('Career direction still unclear')
  }

  return {
    isUncertain,
    simplifyLanguage,
    reassuranceNeeded,
    reasons: [...new Set(reasons)],
  }
}
