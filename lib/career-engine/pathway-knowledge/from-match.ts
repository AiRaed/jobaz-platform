/**
 * Build deterministic “Why this role matches” lines from matcher eligibility only.
 * No LLM. No scoring changes.
 */

import type { RoleEligibilityResult } from '../work-in-education/types'
import { buildRoleWhyItems, buildFitLeadIn } from '../work-in-education/wizard/explain-why'
import { eligibilityBadge, fitLabel } from '../work-in-education/wizard/labels'
import type { PathwayMatchSummary } from './types'
import type { PublicRoleCard } from '../work-in-education/public-contract'

export function matchSummaryFromEligibility(role: RoleEligibilityResult): PathwayMatchSummary {
  return {
    pathway_id: role.role_id,
    title: role.role_title,
    field_name: role.field.name,
    specialism_name: role.specialism.name,
    stage_label: role.stage.label,
    category: fitLabel(role.effective_fit),
    eligibility_label: eligibilityBadge(role.eligibility.status),
    match_score: role.match_score,
    lead_in: buildFitLeadIn(role),
    why: buildRoleWhyItems(role),
    requirements: role.gaps.slice(0, 4).map((g) => g.message),
    next_step: null,
  }
}

export function matchSummaryFromPublicCard(card: PublicRoleCard): PathwayMatchSummary {
  const whyItems = Array.isArray(card.why) ? card.why : []
  const extras = [
    card.typical_experience_note,
    card.toward_target_note,
    card.progression_hint,
  ].filter((t): t is string => Boolean(t && String(t).trim()))

  const texts = [
    ...whyItems.map((item) =>
      typeof item === 'string' ? item : String((item as { text?: unknown })?.text ?? '')
    ),
    ...extras,
  ].filter(Boolean)

  const seen = new Set<string>()
  const uniqueTexts = texts.filter((t) => {
    const key = t.trim().toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  return {
    pathway_id: card.pathway_id,
    title: card.title,
    field_name: card.field_name,
    specialism_name: card.specialism_name,
    stage_label: card.stage_label,
    category: card.category,
    eligibility_label: card.eligibility_label,
    match_score: typeof card.match_score === 'number' ? card.match_score : 0,
    lead_in: card.lead_in,
    why: uniqueTexts.map((text) => {
      const lower = text.toLowerCase()
      const kind: 'positive' | 'gap' | 'warning' =
        lower.includes('review') || lower.includes('may need')
          ? 'warning'
          : lower.includes('more ') ||
              lower.includes('required') ||
              lower.includes('missing') ||
              lower.includes('may not') ||
              lower.includes('experience:') ||
              lower.includes('not immediate') ||
              lower.includes('typically')
            ? 'gap'
            : 'positive'
      return { kind, text }
    }),
    requirements: Array.isArray(card.requirements) ? card.requirements : [],
    next_step: card.next_step,
  }
}
