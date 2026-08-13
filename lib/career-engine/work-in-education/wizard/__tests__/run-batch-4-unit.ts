/**
 * Batch 4 wizard unit tests (no DB, no matcher).
 *   npx tsx lib/career-engine/work-in-education/wizard/__tests__/run-batch-4-unit.ts
 */

import assert from 'node:assert/strict'
import {
  emptyWizardAnswers,
  getVisibleAnswerSteps,
  shouldShowRegistrationStep,
  validateWizardStep,
  createEmptyWizardSession,
  confidenceLabel,
  fitLabel,
  fitSectionTitle,
  buildRoleWhyItems,
  buildFitLeadIn,
} from '../index'
import type { RoleEligibilityResult } from '../../types'

console.log('\n=== Batch 4 wizard unit tests ===\n')

// 1. Civil Engineering → shows registration (engineering)
{
  const a = emptyWizardAnswers()
  a.subject = 'Civil Engineering'
  a.qualification_title = 'BEng Civil Engineering'
  assert.equal(shouldShowRegistrationStep(a), true)
  assert.ok(getVisibleAnswerSteps(a).includes('registration'))
  console.log('  ✓ Civil Engineering shows registration step')
}

// 2. Law → skips registration
{
  const a = emptyWizardAnswers()
  a.subject = 'Law'
  a.qualification_title = 'LLB'
  assert.equal(shouldShowRegistrationStep(a), false)
  assert.ok(!getVisibleAnswerSteps(a).includes('registration'))
  console.log('  ✓ Law skips registration step')
}

// 3. Nursing → registration + validation for scope when registered
{
  const a = emptyWizardAnswers()
  a.subject = 'Nursing'
  a.qualification_title = 'BSc Adult Nursing'
  a.registration = { has_registration: 'yes', body: 'NMC', status: 'registered', scope: null }
  assert.equal(shouldShowRegistrationStep(a), true)
  const errs = validateWizardStep('registration', a)
  assert.ok(errs.some((e) => /branch/i.test(e)))
  a.registration.scope = 'adult_nursing'
  assert.equal(validateWizardStep('registration', a).length, 0)
  console.log('  ✓ Nursing registration validation')
}

// 4. Medicine overseas → registration + recognition
{
  const a = emptyWizardAnswers()
  a.subject = 'Medicine'
  a.qualification_title = 'MBBS'
  a.qualification_country = 'India'
  assert.equal(shouldShowRegistrationStep(a), true)
  a.registration = { has_registration: 'no' }
  const errs = validateWizardStep('registration', a)
  assert.ok(errs.some((e) => /recognition/i.test(e)))
  console.log('  ✓ Medicine overseas asks recognition')
}

// 5. Teaching → registration step (QTS)
{
  const a = emptyWizardAnswers()
  a.subject = 'Education'
  a.qualification_title = 'PGCE'
  assert.equal(shouldShowRegistrationStep(a), true)
  console.log('  ✓ Teaching shows registration (QTS)')
}

// 6. Missing subject / answers validation
{
  const a = emptyWizardAnswers()
  a.education_level = null
  assert.ok(validateWizardStep('education', a).length > 0)
  a.education_level = 'bachelor'
  a.graduation_status = 'completed'
  assert.equal(validateWizardStep('education', a).length, 0)
  assert.ok(validateWizardStep('qualification', a).some((e) => /subject/i.test(e)))
  console.log('  ✓ Missing answers blocked per step')
}

// 7. Friendly labels
{
  assert.equal(fitLabel('immediate'), 'Eligible now')
  assert.equal(fitLabel('future_progression'), 'Future career option')
  assert.equal(fitLabel('blocked_until_requirement'), 'Requirements still needed')
  assert.equal(fitSectionTitle('immediate'), 'Immediate Opportunities')
  assert.equal(fitSectionTitle('realistic_next'), 'Developing Matches')
  assert.equal(
    confidenceLabel({ needs_clarification: true, confidence: 0.9 }),
    'Needs clarification'
  )
  assert.equal(confidenceLabel({ needs_clarification: false, confidence: 0.8 }), 'High')
  console.log('  ✓ User-friendly labels')
}

// 8. Explain-why from eligibility
{
  const role = {
    role_id: '1',
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
    match_score: 0.9,
    match_reasons: [],
    warnings: [],
    demotion_reasons: [],
    retrieval_source: 'primary_specialism',
    relation_reason: '',
    scope_gate: 'ok',
    professional_stage_gate: 'not_applicable',
  } as RoleEligibilityResult

  assert.equal(buildFitLeadIn(role), 'Eligible because')
  const why = buildRoleWhyItems(role)
  assert.ok(why.some((w) => w.kind === 'positive' && /qualification/i.test(w.text)))
  assert.ok(why.some((w) => /experience/i.test(w.text)))
  console.log('  ✓ Deterministic explain-why')
}

// 9. Session create shape (refresh recovery contract)
{
  const s = createEmptyWizardSession('qualification')
  assert.equal(s.version, 1)
  assert.equal(s.step_id, 'qualification')
  assert.ok(s.answers)
  assert.equal(s.selected_specialism_id, null)
  console.log('  ✓ Session object for refresh recovery')
}

// 10. Animation / unknown subject steps
{
  const anim = emptyWizardAnswers()
  anim.subject = 'Animation'
  anim.qualification_title = 'MSc Animation'
  assert.equal(shouldShowRegistrationStep(anim), false)
  assert.deepEqual(getVisibleAnswerSteps(anim), [
    'education',
    'qualification',
    'experience',
    'preferences',
  ])

  const unknown = emptyWizardAnswers()
  unknown.subject = 'Basket Weaving Studies'
  assert.equal(shouldShowRegistrationStep(unknown), false)
  console.log('  ✓ Animation / unknown subject skip registration')
}

// 11. Back/Next step order helpers
{
  const law = emptyWizardAnswers()
  law.subject = 'Law'
  law.qualification_title = 'LLB'
  const steps = getVisibleAnswerSteps(law)
  assert.equal(steps[0], 'education')
  assert.equal(steps[steps.length - 1], 'preferences')
  assert.ok(!steps.includes('clarification'))
  assert.ok(!steps.includes('results'))
  console.log('  ✓ Answer step order (Back/Next navigation basis)')
}

console.log('\nAll Batch 4 unit tests passed.\n')
