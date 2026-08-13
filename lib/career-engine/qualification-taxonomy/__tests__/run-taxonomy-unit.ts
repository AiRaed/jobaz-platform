/**
 * Qualification taxonomy alignment tests.
 *   npx tsx lib/career-engine/qualification-taxonomy/__tests__/run-taxonomy-unit.ts
 */

import assert from 'node:assert/strict'
import {
  LEGACY_TO_TAXONOMY,
  qualificationSatisfiesAcademicRequirement,
  resolveNormalizedQualification,
} from '../index'
import {
  mapWorkInEducationAnswersToProfile,
} from '../../work-in-education/assessment/map-answers-to-profile'
import { normaliseWorkInEducationProfile } from '../../work-in-education/normalise'

console.log('\n=== Qualification taxonomy alignment tests ===\n')

function resolve(type: string, group?: string) {
  return resolveNormalizedQualification({
    qualification_group: group,
    qualification_type: type,
    qualification_country: 'United Kingdom',
  })
}

// 1. UK Bachelor’s → Level 6
{
  const q = resolve('bachelors', 'undergraduate')
  assert.equal(q.uk_level, 'level_6')
  assert.equal(q.education_level_legacy, 'bachelor')
  console.log('  ✓ 1. UK Bachelor’s → Level 6')
}

// 2. UK Master’s → Level 7
{
  const q = resolve('masters', 'postgraduate')
  assert.equal(q.uk_level, 'level_7')
  assert.equal(q.is_integrated_masters, false)
  assert.equal(q.not_generic_masters, false)
  console.log('  ✓ 2. UK Master’s → Level 7')
}

// 3. PhD → Level 8
{
  const q = resolve('phd', 'doctoral')
  assert.equal(q.uk_level, 'level_8')
  console.log('  ✓ 3. PhD → Level 8')
}

// 4. HNC → Level 4
{
  const q = resolve('hnc', 'college_vocational')
  assert.equal(q.uk_level, 'level_4')
  assert.notEqual(q.uk_level, resolve('bachelors').uk_level)
  console.log('  ✓ 4. HNC → Level 4 (not Bachelor’s)')
}

// 5. HND → Level 5
{
  const q = resolve('hnd', 'college_vocational')
  assert.equal(q.uk_level, 'level_5')
  console.log('  ✓ 5. HND → Level 5')
}

// 6. Foundation Degree → Level 5
{
  const q = resolve('foundation_degree', 'college_vocational')
  assert.equal(q.uk_level, 'level_5')
  console.log('  ✓ 6. Foundation Degree → Level 5')
}

// 7. PGCE is teaching, not generic Master’s
{
  const q = resolve('pgce', 'postgraduate')
  assert.equal(q.uk_level, 'level_7')
  assert.equal(q.kind, 'teaching')
  assert.equal(q.not_generic_masters, true)
  const check = qualificationSatisfiesAcademicRequirement(q, 'masters_relevant')
  assert.equal(check.ok, false)
  assert.match(check.reason_code, /pgce/)
  console.log('  ✓ 7. PGCE not treated as generic Master’s')
}

// 8. MEng distinguishable from MSc
{
  const meng = resolve('integrated_masters', 'postgraduate')
  const msc = resolve('masters', 'postgraduate')
  assert.equal(meng.is_integrated_masters, true)
  assert.equal(msc.is_integrated_masters, false)
  assert.equal(meng.type, 'integrated_masters')
  assert.equal(msc.type, 'masters')
  console.log('  ✓ 8. MEng distinguishable from MSc')
}

// 9. Professional registration separate from academic level
{
  const q = resolve('professional_registration', 'professional')
  assert.equal(q.uk_level, 'unknown')
  assert.equal(q.kind, 'professional_registration')
  const check = qualificationSatisfiesAcademicRequirement(q, 'degree_relevant')
  assert.equal(check.ok, false)
  assert.match(check.reason_code, /professional/)
  console.log('  ✓ 9. Professional registration ≠ academic degree')
}

// 10. Overseas Bachelor’s unknown equivalence → review
{
  const q = resolveNormalizedQualification({
    qualification_group: 'overseas',
    qualification_type: 'overseas_undergraduate',
    equivalence_status: 'unsure',
    qualification_country: 'India',
  })
  assert.equal(q.uk_level, 'level_6')
  assert.equal(q.equivalence_status, 'unsure')
  const check = qualificationSatisfiesAcademicRequirement(q, 'degree_relevant')
  assert.equal(check.ok, false)
  assert.equal(check.needs_review, true)
  assert.match(check.reason_code, /overseas/)
  console.log('  ✓ 10. Overseas Bachelor’s unconfirmed → review')
}

// 11. Old saved values still normalize
{
  const cases: Array<[string, string, string]> = [
    ['college_or_diploma', 'college_vocational', 'other_vocational'],
    ['bachelor', 'undergraduate', 'bachelors'],
    ['bachelors', 'undergraduate', 'bachelors'],
    ['master', 'postgraduate', 'masters'],
    ['masters', 'postgraduate', 'masters'],
    ['phd', 'doctoral', 'phd'],
    ['doctorate', 'doctoral', 'phd'],
    ['professional', 'professional', 'other_professional'],
    ['professional_qualification', 'professional', 'other_professional'],
    ['other', 'other_unsure', 'other'],
  ]
  for (const [legacy, group, type] of cases) {
    const q = resolveNormalizedQualification({ education_level: legacy })
    assert.equal(q.group, group, `${legacy} group`)
    assert.equal(q.type, type, `${legacy} type`)
    assert.ok(LEGACY_TO_TAXONOMY[legacy], `${legacy} in map`)
  }
  console.log('  ✓ 11. Legacy education_level values normalize')
}

// Manual: Civil Engineering BEng profile storage
{
  const mapped = mapWorkInEducationAnswersToProfile({
    qualification_group: 'undergraduate',
    qualification_type: 'bachelors',
    education_level: 'bachelor',
    qualification_title: 'BEng Civil Engineering',
    subject: 'Civil Engineering',
    qualification_country: 'United Kingdom',
    graduation_status: 'completed',
    years_relevant_experience: 0,
    engineering_registration: 'none',
  })
  assert.equal(mapped.profile.education_level, 'bachelor')
  assert.equal(mapped.profile.qualification_group, 'undergraduate')
  assert.equal(mapped.profile.qualification_type, 'bachelors')
  assert.equal(mapped.profile.qualification?.uk_level, 'level_6')
  const norm = normaliseWorkInEducationProfile(mapped.profile)
  assert.equal(norm.qualification.uk_level, 'level_6')
  assert.equal(norm.qualification.group, 'undergraduate')
  assert.equal(norm.qualification.type, 'bachelors')
  assert.equal(norm.education_level, 'bachelor')
  console.log('  ✓ Manual Civil Engineering BEng → undergraduate / Level 6')
}

console.log('\nAll qualification taxonomy tests passed.\n')
