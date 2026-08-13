/**
 * User-facing labels for Work in My Education wizard (no internal jargon).
 */

import type { EffectiveFit, EligibilityStatus } from '../types'

export function fitLabel(fit: EffectiveFit): string {
  switch (fit) {
    case 'immediate':
      return 'Eligible now'
    case 'realistic_next':
      return 'Developing match'
    case 'future_progression':
      return 'Future career option'
    case 'academic_or_research':
      return 'Academic / Research'
    case 'blocked_until_requirement':
      return 'Requirements still needed'
    case 'needs_review':
      return 'Needs review'
    default:
      return 'Match'
  }
}

export function fitSectionTitle(fit: EffectiveFit | 'blocked_or_needs_review'): string {
  switch (fit) {
    case 'immediate':
      return 'Immediate Opportunities'
    case 'realistic_next':
      return 'Developing Matches'
    case 'future_progression':
      return 'Future Career Options'
    case 'academic_or_research':
      return 'Academic & Research'
    case 'blocked_until_requirement':
    case 'blocked_or_needs_review':
    case 'needs_review':
      return 'Requirements / Review'
    default:
      return 'Opportunities'
  }
}

export function eligibilityBadge(status: EligibilityStatus): string {
  switch (status) {
    case 'eligible':
      return 'Eligible now'
    case 'conditionally_eligible':
      return 'Conditionally eligible'
    case 'not_yet_eligible':
      return 'Not yet eligible'
    case 'needs_review':
      return 'Needs review'
    default:
      return 'Review needed'
  }
}

export function confidenceLabel(input: {
  needs_clarification: boolean
  confidence: number
}): 'High' | 'Medium' | 'Needs clarification' {
  if (input.needs_clarification) return 'Needs clarification'
  if (input.confidence >= 0.75) return 'High'
  if (input.confidence >= 0.45) return 'Medium'
  return 'Needs clarification'
}

export function nextActionTypeLabel(
  type: 'clarification' | 'registration' | 'recognition' | 'experience' | 'course' | 'review'
): string {
  switch (type) {
    case 'clarification':
      return 'Clarify specialism'
    case 'registration':
      return 'Professional registration'
    case 'recognition':
      return 'UK recognition'
    case 'experience':
      return 'Build experience'
    case 'course':
      return 'Learning'
    case 'review':
      return 'Review required'
    default:
      return 'Next step'
  }
}
