/**
 * Deterministic “why this role” explanations — prefers Scoring v2 evaluation.
 * No LLM. Contradiction-free when evaluation is present.
 */

import type { RoleEligibilityResult } from '../types'

export type WhyItem = {
  kind: 'positive' | 'gap' | 'warning'
  text: string
}

function humaniseDemotion(reason: string): string {
  const r = reason.toLowerCase()
  if (r.includes('charter') || r.includes('ceng') || r.includes('professional_stage')) {
    return 'Requires chartership or professional registration progress'
  }
  if (r.includes('experience') || r.includes('years')) {
    return 'Requires more relevant experience'
  }
  if (r.includes('registration') || r.includes('nmc') || r.includes('gmc')) {
    return 'Requires specialist or professional registration'
  }
  if (r.includes('scope') || r.includes('branch')) {
    return 'Registration branch / scope does not match this role'
  }
  if (r.includes('senior') || r.includes('stage')) {
    return 'Role seniority is above your current stage'
  }
  if (r.includes('recognition') || r.includes('overseas')) {
    return 'UK qualification recognition may be required'
  }
  return reason
    .replace(/_/g, ' ')
    .replace(/\bdemotion\b/gi, '')
    .trim()
    .replace(/^\w/, (c) => c.toUpperCase())
}

export function buildRoleWhyItems(role: RoleEligibilityResult): WhyItem[] {
  if (role.evaluation?.whyItems?.length) {
    return role.evaluation.whyItems.slice(0, 8)
  }

  // Legacy fallback (pre-v2 fixtures)
  const items: WhyItem[] = []
  const e = role.eligibility

  if (e.education_match) {
    items.push({ kind: 'positive', text: 'Your qualification level matches this role' })
  } else {
    items.push({ kind: 'gap', text: 'Qualification level may not fully meet this role' })
  }

  if (e.experience_match) {
    items.push({ kind: 'positive', text: 'Your experience looks sufficient' })
  } else {
    items.push({ kind: 'gap', text: 'More relevant experience is typically needed' })
  }

  if (e.registration_match) {
    items.push({ kind: 'positive', text: 'Professional registration requirements appear met' })
  } else if (
    role.professional_stage_gate !== 'not_applicable' ||
    role.gaps.some((g) => g.type === 'registration' || g.type === 'professional_status')
  ) {
    items.push({ kind: 'gap', text: 'Professional registration is still required' })
  }

  if (e.licence_match === false) {
    items.push({ kind: 'gap', text: 'A required licence is missing' })
  }

  if (e.country_recognition_review_needed) {
    items.push({ kind: 'warning', text: 'UK recognition of your qualification may need review' })
  }

  for (const d of role.demotion_reasons.slice(0, 3)) {
    items.push({ kind: 'gap', text: humaniseDemotion(d) })
  }

  const seen = new Set<string>()
  return items
    .filter((i) => {
      const key = i.text.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
    .slice(0, 8)
}

export function buildFitLeadIn(role: RoleEligibilityResult): string {
  if (role.evaluation) {
    switch (role.evaluation.eligibilityStatus) {
      case 'eligible_now':
        return 'Eligible now because'
      case 'developing_match':
        return 'Developing match because'
      case 'future_pathway':
        return 'Future career option because'
      case 'requirements_missing':
        return 'Requirements still needed because'
      case 'needs_review':
        return 'Needs review because'
    }
  }
  switch (role.effective_fit) {
    case 'immediate':
      return 'Eligible because'
    case 'realistic_next':
      return 'Developing match because'
    case 'future_progression':
      return 'Future progression because'
    case 'academic_or_research':
      return 'Academic / research route because'
    case 'blocked_until_requirement':
    case 'needs_review':
      return 'Requirements still needed because'
    default:
      return 'Matched because'
  }
}
