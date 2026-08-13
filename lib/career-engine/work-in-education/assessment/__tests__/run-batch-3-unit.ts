/**
 * Batch 3 unit tests — mapping, validation, conditions, presenter (no DB).
 *   npx tsx lib/career-engine/work-in-education/assessment/__tests__/run-batch-3-unit.ts
 */

import assert from 'node:assert/strict'
import {
  WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT,
  listVisibleQuestions,
  evaluateShowWhen,
  validateWorkInEducationAnswers,
  mapWorkInEducationAnswersToProfile,
  buildAssessmentPresentation,
} from '../index'
import type { WorkInEducationMatchResult } from '../../types'

function baseAnswers(over: Record<string, unknown> = {}) {
  return {
    education_level: 'bachelor',
    qualification_title: 'BEng Civil Engineering',
    subject: 'Civil Engineering',
    specialisation: '',
    qualification_country: 'United Kingdom',
    graduation_status: 'completed',
    graduation_year: 2024,
    years_relevant_experience: 0,
    has_uk_experience: 'unsure',
    preferences: { related_field_only: 'yes' },
    ...over,
  }
}

console.log('\n=== Batch 3 assessment unit tests ===\n')

// 1. Blueprint version & question keys
{
  assert.equal(WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT.active, true)
  assert.ok(WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT.version.startsWith('wie-assessment-'))
  const keys = WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT.questions.map((q) => q.key)
  for (const required of [
    'education_level',
    'qualification_title',
    'subject',
    'qualification_country',
    'graduation_status',
    'years_relevant_experience',
  ]) {
    assert.ok(keys.includes(required), `missing ${required}`)
  }
  console.log('  ✓ blueprint version and core questions')
}

// 2. Conditional visibility — nursing scope
{
  const nursing = baseAnswers({
    subject: 'Nursing',
    qualification_title: 'BSc Adult Nursing',
    registration: { has_registration: 'yes', body: 'NMC', status: 'registered' },
  })
  const visible = listVisibleQuestions(nursing)
  assert.ok(visible.some((q) => q.key === 'registration.scope'))
  const civil = listVisibleQuestions(baseAnswers())
  assert.ok(!civil.some((q) => q.key === 'registration.scope'))
  console.log('  ✓ conditional nursing scope question')
}

// 3. Overseas recognition question
{
  const overseas = baseAnswers({ qualification_country: 'India', subject: 'Medicine' })
  assert.ok(listVisibleQuestions(overseas).some((q) => q.key === 'uk_recognition_confirmed'))
  const uk = baseAnswers({ qualification_country: 'United Kingdom' })
  assert.ok(!listVisibleQuestions(uk).some((q) => q.key === 'uk_recognition_confirmed'))
  console.log('  ✓ conditional UK recognition question')
}

// 4. Missing subject → invalid
{
  const v = validateWorkInEducationAnswers(baseAnswers({ subject: '' }))
  assert.equal(v.ok, false)
  if (!v.ok) assert.ok(v.errors.some((e) => e.includes('subject')))
  console.log('  ✓ missing subject validation')
}

// 5. Civil Eng mapping
{
  const mapped = mapWorkInEducationAnswersToProfile(baseAnswers())
  assert.equal(mapped.profile.education_level, 'bachelor')
  assert.equal(mapped.profile.subject, 'Civil Engineering')
  assert.equal(mapped.profile.qualification_country, 'United Kingdom')
  assert.equal(mapped.profile.years_relevant_experience, 0)
  assert.ok(mapped.mapping_provenance.length > 0)
  console.log('  ✓ civil engineering answer→profile mapping')
}

// 6. college_or_diploma → college; professional_qualification → professional
{
  const a = mapWorkInEducationAnswersToProfile(
    baseAnswers({ education_level: 'college_or_diploma' })
  )
  assert.equal(a.profile.education_level, 'college')
  const b = mapWorkInEducationAnswersToProfile(
    baseAnswers({ education_level: 'professional_qualification' })
  )
  assert.equal(b.profile.education_level, 'professional')
  console.log('  ✓ education_level enum mapping')
}

// 7. Nursing registration + scope
{
  const mapped = mapWorkInEducationAnswersToProfile(
    baseAnswers({
      subject: 'Nursing',
      qualification_title: 'BSc Adult Nursing',
      registration: {
        has_registration: 'yes',
        body: 'NMC',
        status: 'registered',
        scope: 'adult_nursing',
      },
    })
  )
  assert.equal(mapped.profile.professional_registration?.length, 1)
  assert.equal(mapped.profile.professional_registration?.[0].body, 'NMC')
  assert.equal(mapped.profile.professional_registration?.[0].registration_scope, 'adult_nursing')
  console.log('  ✓ nursing registration mapping with scope')
}

// 8. Country normalisation
{
  const mapped = mapWorkInEducationAnswersToProfile(baseAnswers({ qualification_country: 'uk' }))
  assert.equal(mapped.profile.qualification_country, 'United Kingdom')
  console.log('  ✓ country normalisation')
}

// 9. Unknown keys stripped (forward compatible)
{
  const v = validateWorkInEducationAnswers({
    ...baseAnswers(),
    future_field_xyz: 'keep-compat',
  })
  assert.equal(v.ok, true)
  if (v.ok) {
    assert.ok(v.unknown_keys.includes('future_field_xyz'))
    assert.equal((v.answers as { future_field_xyz?: unknown }).future_field_xyz, undefined)
  }
  console.log('  ✓ unknown keys stripped safely')
}

// 10. Presenter templates
{
  const fakeMatch = {
    resolution: {
      needs_clarification: true,
      clarification_reason: 'broad_subject',
      clarification_options: [],
      primary_field: { id: '1', name: 'Law', slug: 'law', score: 1, reasons: [] },
      primary_specialism: null,
      alternative_fields: [],
      alternative_specialisms: [],
      confidence: 0.5,
      score_margin: 0,
      is_broad_subject: true,
      match_reasons: [],
    },
    profile_summary: { subject: 'Law' },
    recommendations: {
      immediate: [],
      realistic_next: [],
      future_progression: [],
      academic_or_research: [],
      blocked_or_needs_review: [],
    },
    qualification_recognition: { review_needed: false, reason: '', country: '' },
    overall_gaps: [],
    qa_summary: {
      field_resolution: 'WARNING',
      specialism_resolution: 'WARNING',
      regulated_role_safety: 'PASS',
      scope_safety: 'PASS',
      seniority_safety: 'PASS',
      professional_stage_safety: 'PASS',
    },
  } as unknown as WorkInEducationMatchResult

  const p = buildAssessmentPresentation(fakeMatch, {
    assessment_status: 'needs_clarification',
    subject: 'Law',
  })
  assert.equal(p.headline_key, 'assessment.headline.needs_clarification')
  assert.ok(p.headline.toLowerCase().includes('law'))
  assert.ok(p.next_action_items.some((a) => a.type === 'clarification'))
  console.log('  ✓ deterministic presenter for clarification')
}

// 11. show_when evaluate
{
  assert.equal(
    evaluateShowWhen(
      { logic: 'and', conditions: [{ answer_key: 'subject', operator: 'contains', expected_value: 'nurs' }] },
      { subject: 'Adult Nursing' }
    ),
    true
  )
  console.log('  ✓ show_when contains operator')
}

// 12. Deterministic mapping identical
{
  const a = mapWorkInEducationAnswersToProfile(baseAnswers({ skills: ['CAD', 'AutoCAD'] }))
  const b = mapWorkInEducationAnswersToProfile(baseAnswers({ skills: ['CAD', 'AutoCAD'] }))
  assert.deepEqual(a.profile, b.profile)
  assert.deepEqual(a.mapping_provenance, b.mapping_provenance)
  console.log('  ✓ repeated mapping deterministic')
}

console.log('\nAll Batch 3 unit tests passed.\n')
