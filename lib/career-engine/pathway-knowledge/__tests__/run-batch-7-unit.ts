/**
 * Batch 7 pathway detail unit tests (no DB, no matcher, no LLM).
 *   npx tsx lib/career-engine/pathway-knowledge/__tests__/run-batch-7-unit.ts
 */

import assert from 'node:assert/strict'
import {
  buildMatchExplanationFromContext,
  buildPathwayDetailResponse,
  emptyPathwayKnowledge,
  resolveMatchStatusLabel,
  missingSectionsFromKnowledge,
  roleRowToDetailRole,
} from '../index'
import type { PathwayMatchContextPayload } from '../detail-types'

console.log('\n=== Batch 7 pathway detail unit tests ===\n')

function ctx(partial: Partial<PathwayMatchContextPayload>): PathwayMatchContextPayload {
  return {
    role_id: 'role-1',
    title: 'Test Role',
    field_name: 'Engineering',
    specialism_name: 'Civil Engineering',
    stage_label: 'Graduate',
    category: 'Good Match',
    eligibility_label: 'Eligible now',
    match_score: 0.9,
    lead_in: 'Matched because',
    why: [{ kind: 'positive', text: 'Qualification level fits' }],
    requirements: [],
    next_step: 'Explore this role',
    saved_at: new Date().toISOString(),
    ...partial,
  }
}

// 1. Civil Engineering immediate — Eligible now only when eligibility says so
{
  const status = resolveMatchStatusLabel({
    category: 'Good Match',
    eligibility_label: 'Eligible now',
  })
  assert.equal(status, 'Eligible now')
  const match = buildMatchExplanationFromContext(
    ctx({ category: 'Good Match', eligibility_label: 'Eligible now' })
  )
  assert.equal(match?.assessment_says_accessible_now, true)
  console.log('  ✓ Civil Engineering immediate: eligible now preserved')
}

// 2. Chartered / future — never upgraded to eligible now
{
  const status = resolveMatchStatusLabel({
    category: 'Future Career Option',
    eligibility_label: 'Not yet eligible',
  })
  assert.equal(status, 'Future career option')
  const match = buildMatchExplanationFromContext(
    ctx({
      category: 'Future Career Option',
      eligibility_label: 'Not yet eligible',
      why: [{ kind: 'gap', text: 'Chartership typically required' }],
      requirements: ['Chartered status usually required'],
    })
  )
  assert.equal(match?.assessment_says_accessible_now, false)
  assert.ok(match!.blockers.some((b) => /charter/i.test(b)))
  console.log('  ✓ Chartered/future role: blockers visible, not eligible now')
}

// 3. Registered Nursing — regulated + registration gaps stay visible
{
  const match = buildMatchExplanationFromContext(
    ctx({
      title: 'Staff Nurse',
      field_name: 'Healthcare',
      specialism_name: 'Adult Nursing',
      category: 'Good Match',
      eligibility_label: 'Conditionally eligible',
      why: [
        { kind: 'positive', text: 'Nursing qualification matches' },
        { kind: 'gap', text: 'Active NMC registration required' },
      ],
      requirements: ['NMC registration required'],
    })
  )
  assert.equal(match?.match_status, 'Conditionally eligible')
  assert.equal(match?.assessment_says_accessible_now, false)
  assert.ok(match!.blockers.some((b) => /NMC/i.test(b)))
  console.log('  ✓ Nursing regulated: conditional, blockers visible')
}

// 4. Overseas Medicine review — needs review not converted to eligible
{
  const status = resolveMatchStatusLabel({
    category: 'Needs Review',
    eligibility_label: 'Needs review',
  })
  assert.equal(status, 'Needs review')
  const match = buildMatchExplanationFromContext(
    ctx({
      category: 'Needs Review',
      eligibility_label: 'Needs review',
      why: [{ kind: 'warning', text: 'UK recognition may be required for overseas medicine' }],
      requirements: ['Confirm UK recognition before applying'],
    })
  )
  assert.equal(match?.assessment_says_accessible_now, false)
  assert.ok(match!.warnings.length > 0)
  console.log('  ✓ Overseas Medicine: needs review preserved')
}

// 5. Broad Law / clarification — Good Match without Eligible now ≠ unrestricted access
{
  const status = resolveMatchStatusLabel({
    category: 'Good Match',
    eligibility_label: 'Conditionally eligible',
  })
  assert.equal(status, 'Conditionally eligible')
  // Bucket alone must not become Eligible now
  const statusBucketOnly = resolveMatchStatusLabel({
    category: 'Good Match',
    eligibility_label: '',
  })
  assert.equal(statusBucketOnly, 'Conditionally eligible')
  console.log('  ✓ Broad Law safety: Good Match alone is not Eligible now')
}

// 6. Research / academic option
{
  const status = resolveMatchStatusLabel({
    category: 'Academic / Research',
    eligibility_label: 'Conditionally eligible',
  })
  assert.equal(status, 'Academic / research option')
  console.log('  ✓ Academic/research route labelled correctly')
}

// 7. Missing pathway knowledge — placeholders + missing_sections
{
  const knowledge = emptyPathwayKnowledge('missing-role', {
    role_title: 'Unknown Role',
    field_name: 'Field',
    specialism_name: 'Specialism',
  })
  assert.equal(knowledge.source, 'placeholder')
  assert.equal(knowledge.salary.is_placeholder, true)
  const missing = missingSectionsFromKnowledge(knowledge)
  assert.ok(missing.includes('salary'))
  assert.ok(missing.includes('overview'))
  console.log('  ✓ Missing knowledge: placeholders, no fabrication')
}

// 8. Invalid / unknown role ID → not found detail
{
  const detail = buildPathwayDetailResponse({
    found: false,
    role: null,
    knowledge: null,
    matchContext: null,
    matchContextSource: 'none',
    error_code: 'not_found',
  })
  assert.equal(detail.found, false)
  assert.equal(detail.role, null)
  assert.equal(detail.knowledge, null)
  assert.equal(detail.error_code, 'not_found')
  assert.deepEqual(detail.provenance.missing_sections, ['all'])
  console.log('  ✓ Unknown role ID → not_found detail')
}

// 9. Role row mapping (library fields → public detail role)
{
  const role = roleRowToDetailRole({
    id: 'abc',
    name: 'Graduate Civil Engineer',
    role_category: 'practitioner',
    seniority_level: 'graduate',
    minimum_experience_years: 0,
    experience_requirement_label: null,
    professional_registration_requirement: 'none',
    professional_membership_requirement: null,
    academic_requirement: 'bachelor',
    is_regulated_or_restricted: false,
    is_academic_role: false,
    is_research_role: false,
    status: 'draft',
    active: true,
    field_name: 'Engineering',
    specialism_name: 'Civil Engineering',
    stage_label: 'Graduate',
  })
  assert.equal(role.title, 'Graduate Civil Engineer')
  assert.equal(role.registration_requirement, null) // "none" humanised away
  assert.equal(role.academic_requirement, 'bachelor')
  console.log('  ✓ Role row mapping strips none-registration')
}

// 10. Found detail with match context from assessment session
{
  const knowledge = emptyPathwayKnowledge('r1', {
    role_title: 'Assistant Civil Engineer',
    field_name: 'Engineering',
    specialism_name: 'Civil Engineering',
    stage_label: 'Graduate',
  })
  const detail = buildPathwayDetailResponse({
    found: true,
    role: roleRowToDetailRole({
      id: 'r1',
      name: 'Assistant Civil Engineer',
      field_name: 'Engineering',
      specialism_name: 'Civil Engineering',
      stage_label: 'Graduate',
      is_regulated_or_restricted: false,
    }),
    knowledge,
    matchContext: ctx({ role_id: 'r1', title: 'Assistant Civil Engineer' }),
    matchContextSource: 'assessment_session',
  })
  assert.equal(detail.found, true)
  assert.equal(detail.provenance.match_context_source, 'assessment_session')
  assert.ok(detail.match)
  assert.equal(detail.match?.match_status, 'Eligible now')
  console.log('  ✓ Assessment session match context attached without re-matching')
}

// 11. No Supabase in detail builders (pure functions) — structural check
{
  const src = [
    buildMatchExplanationFromContext.toString(),
    resolveMatchStatusLabel.toString(),
    buildPathwayDetailResponse.toString(),
  ].join('\n')
  assert.ok(!/supabase|createClient|\.from\(/i.test(src))
  console.log('  ✓ Detail builders have no direct Supabase calls')
}

// 12. Blockers never converted to eligible
{
  const match = buildMatchExplanationFromContext(
    ctx({
      category: 'Requirements Still Needed',
      eligibility_label: 'Not yet eligible',
      // Hostile client attempt to claim eligible via score only
      match_score: 0.99,
      why: [{ kind: 'gap', text: 'Professional registration required' }],
      requirements: ['Registration required'],
    })
  )
  assert.equal(match?.assessment_says_accessible_now, false)
  assert.equal(match?.match_status, 'Requirements still needed')
  assert.ok(match!.blockers.length >= 1)
  console.log('  ✓ Blockers remain visible; not converted to eligible')
}

console.log('\nAll Batch 7 unit tests passed.\n')
