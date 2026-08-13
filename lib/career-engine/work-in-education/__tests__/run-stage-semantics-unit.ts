/**
 * Stage semantics + training item type regression (Anthropology Leadership / 0 years).
 *   npx tsx lib/career-engine/work-in-education/__tests__/run-stage-semantics-unit.ts
 */

import assert from 'node:assert/strict'
import {
  buildWieStageContext,
  estimateCurrentReadiness,
  matchingStageForImmediateRoutes,
  towardTargetNote,
  WIE_LIBRARY_PATH_STAGE_MEANING,
} from '../stage-semantics'
import { inferWieTrainingItemType } from '../course-alignment/training-item-type'
import { toPublicRoleCard } from '../public-contract'
import type { RoleEligibilityResult } from '../types'
import { CAREER_LIBRARY_WIE_METADATA_DEFAULTS, readCareerLibraryWieMetadata } from '@/lib/admin/career-library/types'

console.log('\n=== WIE stage semantics + training type tests ===\n')

{
  assert.equal(WIE_LIBRARY_PATH_STAGE_MEANING, 'target')
  const readiness = estimateCurrentReadiness({
    yearsRelevantExperience: 0,
    completedTrainingCount: 1,
  })
  assert.equal(readiness.band, 'early_career')
  assert.equal(readiness.label, 'Early career')

  const ctx = buildWieStageContext({
    selectedStageLabel: 'Leadership',
    selectedStageKey: 'leadership',
    yearsRelevantExperience: 0,
    completedTrainingCount: 1,
  })
  assert.equal(ctx.stage_meaning, 'target')
  assert.equal(ctx.target_stage_label, 'Leadership')
  assert.equal(ctx.current_stage_label, null)
  assert.equal(ctx.estimated_current_readiness, 'Early career')
  assert.equal(ctx.years_relevant_experience, 0)

  const match = matchingStageForImmediateRoutes(ctx)
  assert.ok(!/leadership/i.test(match.stageKey), 'immediate matching must not use Leadership stage key')
  assert.ok(/graduate|foundation|entry/i.test(`${match.stageKey} ${match.stageLabel}`))

  const note = towardTargetNote(ctx)
  assert.ok(note && /Leadership target/i.test(note))
  console.log('  ✓ Library stage = TARGET; 0 years → Early career readiness for matching')
}

{
  const titles: Array<{ title: string; expect: string }> = [
    { title: 'Data Analysis for Social Research', expect: 'course' },
    { title: 'Charity / NGO Administration', expect: 'career_preparation' },
    { title: 'Public Sector Applications', expect: 'career_preparation' },
    { title: 'Policy Research Basics', expect: 'knowledge_area' },
    { title: 'Research Methods', expect: 'course' },
  ]
  for (const row of titles) {
    const meta = inferWieTrainingItemType({ title: row.title })
    assert.equal(meta.type, row.expect, `${row.title} → ${row.expect}, got ${meta.type}`)
    if (meta.type === 'skill' || meta.type === 'career_preparation' || meta.type === 'knowledge_area') {
      assert.equal(meta.providerEligible, false)
    }
  }
  const unknown = inferWieTrainingItemType({ title: 'Obscure Pathway Topic XYZ' })
  assert.equal(unknown.type, 'knowledge_area')
  assert.equal(unknown.needsAdminReview, true)
  console.log('  ✓ Anthropology training titles classified; default knowledge_area; no forced providers')
}

{
  const meta = readCareerLibraryWieMetadata({})
  assert.equal(meta.stageMeaning, CAREER_LIBRARY_WIE_METADATA_DEFAULTS.stageMeaning)
  assert.equal(meta.trainingItemType, 'knowledge_area')
  assert.equal(meta.providerEligible, false)
  const explicit = readCareerLibraryWieMetadata({
    stageMeaning: 'current',
    trainingItemType: 'course',
    providerEligible: true,
    completionTrackable: true,
  })
  assert.equal(explicit.stageMeaning, 'current')
  assert.equal(explicit.trainingItemType, 'course')
  assert.equal(explicit.providerEligible, true)
  console.log('  ✓ Admin WIE metadata defaults are migration-safe')
}

{
  const stageCtx = buildWieStageContext({
    selectedStageLabel: 'Leadership',
    selectedStageKey: 'leadership',
    yearsRelevantExperience: 0,
  })

  const baseEligibility = {
    status: 'eligible' as const,
    education_match: true,
    experience_match: true,
    registration_match: true,
    licence_match: true,
    country_recognition_review_needed: false,
    qualification_scope_match: 'matched' as const,
    registration_scope_match: 'matched' as const,
  }

  const immediateRole = {
    role_id: 'ra-1',
    role_title: 'Research Assistant',
    match_score: 80,
    field: { id: 'f', name: 'Humanities & Social Sciences', slug: 'humanities-social-sciences' },
    specialism: { id: 's', name: 'Anthropology', slug: 'anthropology' },
    stage: { id: 'st', key: 'graduate', label: 'Graduate Entry' },
    stored_fit: 'immediate',
    effective_fit: 'immediate',
    eligibility: baseEligibility,
    gaps: [],
    match_reasons: ['Specialism matches'],
    warnings: [],
    demotion_reasons: ['safety:best_immediate_route'],
    retrieval_source: 'selected_stage',
    relation_reason: 'specialism',
    scope_gate: 'pass',
    professional_stage_gate: 'pass',
    evaluation: {
      statusLabel: 'Best immediate route',
      qualitativeLabel: 'Good match',
      eligibilityStatus: 'eligible',
      unmetRequirements: [],
      matchedReasons: ['Specialism matches', 'Suitable early-career entry point'],
      scoreBreakdown: { caps_applied: [] },
    },
  } as unknown as RoleEligibilityResult

  const card = toPublicRoleCard(immediateRole, stageCtx)
  assert.ok(
    card.toward_target_note && /Leadership/i.test(card.toward_target_note),
    'immediate card explains route toward target'
  )
  assert.ok(card.why.some((w) => /toward your Leadership target/i.test(w)))
  assert.equal(card.match_type, 'best_immediate_route')

  const progressionRole = {
    ...immediateRole,
    role_id: 'dir-1',
    role_title: 'Director of Anthropology / Head of Research',
    stage: { id: 'st2', key: 'leadership', label: 'Leadership' },
    effective_fit: 'future_progression',
    eligibility: { ...baseEligibility, experience_match: false, status: 'needs_experience' },
    demotion_reasons: ['safety:future_career_option'],
    evaluation: {
      statusLabel: 'Progression route',
      qualitativeLabel: 'Target-level progression role',
      eligibilityStatus: 'needs_experience',
      unmetRequirements: ['Significant leadership experience usually required'],
      matchedReasons: ['Specialism matches'],
      scoreBreakdown: { caps_applied: [] },
    },
  } as unknown as RoleEligibilityResult

  const prog = toPublicRoleCard(progressionRole, stageCtx)
  assert.equal(prog.category, 'Target-level progression role')
  assert.ok(prog.typical_experience_note)
  assert.ok(prog.why.some((w) => /current relevant experience:\s*0/i.test(w)))
  assert.equal(prog.match_type, 'future_career_option')
  console.log('  ✓ Anthropology Leadership: immediate toward-target note; senior roles are progression')
}

console.log('\nAll stage-semantics tests passed.\n')
