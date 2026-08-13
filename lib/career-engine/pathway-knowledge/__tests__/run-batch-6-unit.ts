/**
 * Batch 6 pathway knowledge unit tests (no DB, no matcher changes).
 *   npx tsx lib/career-engine/pathway-knowledge/__tests__/run-batch-6-unit.ts
 */

import assert from 'node:assert/strict'
import {
  emptyPathwayKnowledge,
  matchSummaryFromEligibility,
  matchSummaryFromPublicCard,
} from '../index'
import type { RoleEligibilityResult } from '../../work-in-education/types'
import type { PublicRoleCard } from '../../work-in-education/public-contract'

console.log('\n=== Batch 6 pathway knowledge unit tests ===\n')

{
  const k = emptyPathwayKnowledge('abc', {
    role_title: 'Graduate Civil Engineer',
    field_name: 'Engineering',
    specialism_name: 'Civil Engineering',
    stage_label: 'Graduate',
  })
  assert.equal(k.source, 'placeholder')
  assert.equal(k.salary.is_placeholder, true)
  assert.equal(k.recommended_courses.is_placeholder, true)
  assert.ok(k.about.items[0].includes('Career Knowledge Library'))
  console.log('  ✓ placeholder knowledge knowledge')
}

{
  const role = {
    role_id: 'r1',
    role_title: 'Graduate Civil Engineer',
    field: { id: 'f', name: 'Engineering', slug: 'engineering' },
    specialism: { id: 's', name: 'Civil Engineering', slug: 'civil' },
    stage: { id: null, key: null, label: 'Graduate' },
    stored_fit: null,
    effective_fit: 'immediate',
    eligibility: {
      status: 'eligible',
      education_match: true,
      experience_match: true,
      registration_match: true,
      licence_match: true,
      country_recognition_review_needed: false,
      qualification_scope_match: 'unknown',
      registration_scope_match: 'unknown',
    },
    gaps: [],
    match_score: 0.88,
    match_reasons: [],
    warnings: [],
    demotion_reasons: [],
    retrieval_source: 'primary_specialism',
    relation_reason: '',
    scope_gate: 'ok',
    professional_stage_gate: 'not_applicable',
  } as RoleEligibilityResult

  const summary = matchSummaryFromEligibility(role)
  assert.equal(summary.pathway_id, 'r1')
  assert.equal(summary.match_score, 0.88)
  assert.ok(summary.why.some((w) => w.kind === 'positive'))
  assert.equal(summary.category, 'Eligible now')
  console.log('  ✓ match summary from eligibility (deterministic why)')
}

{
  const card: PublicRoleCard = {
    pathway_id: 'p1',
    title: 'Staff Nurse',
    field_name: 'Healthcare',
    specialism_name: 'Nursing',
    category: 'Good Match',
    eligibility_label: 'Eligible now',
    stage_label: 'Registered',
    match_score: 0.7,
    why: ['Your qualification level matches this role', 'More relevant experience is typically needed'],
    lead_in: 'Eligible because',
    experience_note: null,
    registration_note: null,
    requirements: [],
    next_step: null,
  }
  const summary = matchSummaryFromPublicCard(card)
  assert.equal(summary.pathway_id, 'p1')
  assert.ok(summary.why.some((w) => w.kind === 'gap'))
  console.log('  ✓ match summary from public card')
}

console.log('\nAll Batch 6 unit tests passed.\n')
