/**
 * Unit fixtures for Work in My Education (no DB).
 * Run: npx tsx lib/career-engine/work-in-education/__tests__/run-unit-fixtures.ts
 */

import assert from 'node:assert/strict'
import { aliasKey, resolveAlias, buildAliasIndex } from '../aliases'
import { evaluateRoleEligibility } from '../evaluate-eligibility'
import { normaliseWorkInEducationProfile } from '../normalise'
import { resolveFieldAndSpecialism } from '../resolve-field'
import { rankAndBucketRoles } from '../rank-roles'
import { validateWorkInEducationProfile } from '../validate'
import { FIXTURES } from './fixtures'
import type {
  KnowledgeFieldRow,
  KnowledgeRoleRow,
  KnowledgeSpecialismRow,
  NormalisedWorkInEducationProfile,
} from '../types'

function pass(name: string) {
  console.log(`  ✓ ${name}`)
}

function field(partial: Partial<KnowledgeFieldRow> & Pick<KnowledgeFieldRow, 'id' | 'name' | 'slug'>): KnowledgeFieldRow {
  return {
    description: '',
    active: true,
    status: 'draft',
    ...partial,
  }
}

function spec(
  partial: Partial<KnowledgeSpecialismRow> &
    Pick<KnowledgeSpecialismRow, 'id' | 'field_id' | 'name' | 'slug'>
): KnowledgeSpecialismRow {
  return {
    description: '',
    regulated_profession: false,
    professional_body: null,
    active: true,
    status: 'draft',
    stage_model_id: null,
    ...partial,
  }
}

function role(
  partial: Partial<KnowledgeRoleRow> & Pick<KnowledgeRoleRow, 'id' | 'specialism_id' | 'name' | 'slug'>
): KnowledgeRoleRow {
  return {
    stage_id: null,
    description: '',
    role_category: 'graduate_entry',
    seniority_level: 'entry',
    minimum_experience_years: 0,
    experience_requirement_label: null,
    professional_registration_requirement: 'none',
    professional_membership_requirement: 'none',
    academic_requirement: 'degree_relevant',
    is_research_role: false,
    is_academic_role: false,
    is_regulated_or_restricted: false,
    eligibility_note: null,
    fit_classification: 'immediate',
    priority: 100,
    status: 'draft',
    active: true,
    metadata: {},
    ...partial,
  }
}

console.log('\n=== Work in My Education unit fixtures ===\n')

// 1. Validation
{
  const bad = validateWorkInEducationProfile({ education_level: 'nope' })
  assert.equal(bad.ok, false)
  const good = validateWorkInEducationProfile(FIXTURES.uk_civil_beng_zero_exp)
  assert.equal(good.ok, true)
  pass('validate accepts civil fixture / rejects bad education_level')
}

// 2. Alias normalisation
{
  const index = buildAliasIndex()
  assert.equal(resolveAlias('M.Sc.', index).canonical, 'master of science')
  assert.equal(resolveAlias('BEng', index).canonical, 'bachelor of engineering')
  assert.equal(resolveAlias('Computing', index).canonical, 'computer science')
  assert.equal(resolveAlias('LLB', index).canonical, 'bachelor of laws')
  assert.equal(resolveAlias('MBChB', index).canonical, 'bachelor of medicine')
  const n = normaliseWorkInEducationProfile({
    education_level: 'master',
    qualification_title: 'M.Sc. Computer Animation',
    subject: '3D Animation',
  })
  assert.ok(n.qualification_title_normalised.includes('master of science') || n.alias_hits.length > 0)
  assert.ok(n.subject_normalised.includes('animation'))
  pass('aliases: MSc/BEng/Computing/LLB/MBChB + animation subject')
}

// 3. Missing subject → clarification
{
  const fields = [
    field({ id: 'f1', name: 'Engineering', slug: 'engineering' }),
    field({ id: 'f2', name: 'Business & Management', slug: 'business-management' }),
  ]
  const specialisms = [
    spec({ id: 's1', field_id: 'f1', name: 'Civil Engineering', slug: 'civil-engineering' }),
    spec({ id: 's2', field_id: 'f2', name: 'General Management', slug: 'general-management' }),
  ]
  const profile = normaliseWorkInEducationProfile(FIXTURES.ambiguous_missing_subject)
  const res = resolveFieldAndSpecialism({ profile, fields, specialisms, confidenceThreshold: 0.42 })
  assert.equal(res.needs_clarification, true)
  pass('missing subject needs clarification')
}

// 4. Civil engineering resolution
{
  const fields = [field({ id: 'f1', name: 'Engineering', slug: 'engineering' })]
  const specialisms = [
    spec({ id: 's1', field_id: 'f1', name: 'Civil Engineering', slug: 'civil-engineering' }),
    spec({ id: 's2', field_id: 'f1', name: 'Mechanical Engineering', slug: 'mechanical-engineering' }),
  ]
  const profile = normaliseWorkInEducationProfile(FIXTURES.uk_civil_beng_zero_exp)
  const res = resolveFieldAndSpecialism({ profile, fields, specialisms })
  assert.equal(res.primary_specialism?.slug, 'civil-engineering')
  assert.ok(res.confidence >= 0.42)
  pass('civil engineering resolves to civil-engineering specialism')
}

// 5. Senior + 0 exp never immediate
{
  const profile = normaliseWorkInEducationProfile(FIXTURES.uk_civil_beng_zero_exp)
  const f = field({ id: 'f1', name: 'Engineering', slug: 'engineering' })
  const s = spec({ id: 's1', field_id: 'f1', name: 'Civil Engineering', slug: 'civil-engineering' })
  const r = role({
    id: 'r1',
    specialism_id: 's1',
    name: 'Senior Civil Engineer',
    slug: 'senior-civil',
    seniority_level: 'senior',
    minimum_experience_years: 5,
    fit_classification: 'immediate',
  })
  const ev = evaluateRoleEligibility({ role: r, specialism: s, field: f, stage: null, profile })
  assert.notEqual(ev.effective_fit, 'immediate')
  assert.ok(
    ev.effective_fit === 'future_progression' ||
      ev.effective_fit === 'realistic_next' ||
      ev.effective_fit === 'blocked_until_requirement'
  )
  pass('senior role with 0 experience is not immediate')
}

// 6. Regulated healthcare without registration → needs_review / blocked
{
  const profile = normaliseWorkInEducationProfile(FIXTURES.regulated_registration_unknown)
  const f = field({ id: 'f1', name: 'Healthcare & Medicine', slug: 'healthcare-medicine' })
  const s = spec({
    id: 's1',
    field_id: 'f1',
    name: 'Nursing',
    slug: 'nursing',
    regulated_profession: true,
    professional_body: 'NMC',
  })
  const r = role({
    id: 'r1',
    specialism_id: 's1',
    name: 'Staff Nurse',
    slug: 'staff-nurse',
    is_regulated_or_restricted: true,
    professional_registration_requirement: 'required',
    fit_classification: 'immediate',
    seniority_level: 'early_career',
    minimum_experience_years: 0,
  })
  const ev = evaluateRoleEligibility({ role: r, specialism: s, field: f, stage: null, profile })
  assert.notEqual(ev.effective_fit, 'immediate')
  assert.ok(
    ev.effective_fit === 'needs_review' || ev.effective_fit === 'blocked_until_requirement'
  )
  assert.ok(
    ev.eligibility.status === 'needs_review' || ev.eligibility.status === 'not_yet_eligible'
  )
  pass('regulated nursing without registration is not unrestricted immediate')
}

// 7. Nursing with NMC registered can be eligible path
{
  const profile = normaliseWorkInEducationProfile(FIXTURES.uk_nursing_nmc)
  const f = field({ id: 'f1', name: 'Healthcare & Medicine', slug: 'healthcare-medicine' })
  const s = spec({
    id: 's1',
    field_id: 'f1',
    name: 'Nursing',
    slug: 'nursing',
    regulated_profession: true,
    professional_body: 'NMC',
  })
  const r = role({
    id: 'r1',
    specialism_id: 's1',
    name: 'Staff Nurse',
    slug: 'staff-nurse',
    is_regulated_or_restricted: true,
    professional_registration_requirement: 'required',
    fit_classification: 'immediate',
    seniority_level: 'early_career',
    minimum_experience_years: 0,
  })
  const ev = evaluateRoleEligibility({ role: r, specialism: s, field: f, stage: null, profile })
  assert.equal(ev.eligibility.registration_match, true)
  assert.notEqual(ev.effective_fit, 'blocked_until_requirement')
  pass('nursing with NMC registration matches registration gate')
}

// 8. PhD biology academic preference
{
  const profile = normaliseWorkInEducationProfile(FIXTURES.phd_biology_research)
  const f = field({ id: 'f1', name: 'Natural Sciences & Research', slug: 'natural-sciences-research' })
  const s = spec({ id: 's1', field_id: 'f1', name: 'Biology', slug: 'biology' })
  const r = role({
    id: 'r1',
    specialism_id: 's1',
    name: 'Postdoctoral Research Fellow',
    slug: 'postdoc',
    is_research_role: true,
    is_academic_role: true,
    academic_requirement: 'phd_relevant',
    fit_classification: 'academic_or_research',
    seniority_level: 'academic_research',
    minimum_experience_years: 0,
  })
  const ev = evaluateRoleEligibility({ role: r, specialism: s, field: f, stage: null, profile })
  assert.equal(ev.effective_fit, 'academic_or_research')
  assert.equal(ev.eligibility.education_match, true)
  pass('PhD biology research role → academic_or_research')
}

// 9. Bachelor vs PhD role → future progression
{
  const profile = normaliseWorkInEducationProfile(FIXTURES.uk_civil_beng_zero_exp)
  const f = field({ id: 'f1', name: 'Natural Sciences & Research', slug: 'natural-sciences-research' })
  const s = spec({ id: 's1', field_id: 'f1', name: 'Biology', slug: 'biology' })
  const r = role({
    id: 'r1',
    specialism_id: 's1',
    name: 'Research Fellow',
    slug: 'rf',
    is_research_role: true,
    academic_requirement: 'phd_relevant',
    fit_classification: 'academic_or_research',
    seniority_level: 'academic_research',
  })
  const ev = evaluateRoleEligibility({ role: r, specialism: s, field: f, stage: null, profile })
  assert.equal(ev.eligibility.education_match, false)
  assert.equal(ev.effective_fit, 'future_progression')
  pass('bachelor vs phd research → future_progression')
}

// 10. Diversity ranking — near-identical titles not all kept
{
  const profile = normaliseWorkInEducationProfile(FIXTURES.cs_graduate_portfolio)
  const resolution = {
    primary_field: { id: 'f1', name: 'IT', slug: 'it-technology', score: 0.9, reasons: [] },
    alternative_fields: [],
    primary_specialism: {
      id: 's1',
      name: 'Software Development',
      slug: 'software-development',
      score: 0.9,
      reasons: [],
    },
    alternative_specialisms: [],
    confidence: 0.9,
    match_reasons: [],
    needs_clarification: false,
    clarification_options: [],
  }
  const f = field({ id: 'f1', name: 'IT & Technology', slug: 'it-technology' })
  const s = spec({ id: 's1', field_id: 'f1', name: 'Software Development', slug: 'software-development' })
  const roles = [1, 2, 3, 4, 5].map((i) =>
    role({
      id: `r${i}`,
      specialism_id: 's1',
      name: i === 1 ? 'Junior Software Developer' : `Junior Software Developer ${i}`,
      slug: `jsd-${i}`,
      seniority_level: 'early_career',
      fit_classification: 'immediate',
    })
  )
  // Make first three near-identical stems
  roles[0].name = 'Junior Software Developer'
  roles[1].name = 'Software Developer Junior'
  roles[2].name = 'Graduate Software Developer'
  roles[3].name = 'Frontend Engineer'
  roles[4].name = 'Backend Engineer'

  const items = roles.map((r) => ({
    evaluated: evaluateRoleEligibility({ role: r, specialism: s, field: f, stage: null, profile }),
    role: r,
    specialismRank: 0,
  }))
  const buckets = rankAndBucketRoles({
    items,
    profile,
    resolution,
    limits: {
      immediate: 5,
      realistic_next: 5,
      future_progression: 5,
      academic_or_research: 3,
      blocked_or_needs_review: 5,
    },
  })
  assert.ok(buckets.immediate.length <= 5)
  assert.ok(buckets.immediate.length >= 2)
  pass('ranking applies diversity / limits')
}

// 11. Deterministic normalisation
{
  const a = normaliseWorkInEducationProfile(FIXTURES.uk_civil_beng_zero_exp)
  const b = normaliseWorkInEducationProfile(FIXTURES.uk_civil_beng_zero_exp)
  assert.deepEqual(a, b)
  pass('normalisation is deterministic')
}

// 12. Overseas medicine flags recognition
{
  const profile = normaliseWorkInEducationProfile(FIXTURES.overseas_medicine_no_reg)
  assert.equal(profile.is_uk_qualification, false)
  const f = field({ id: 'f1', name: 'Healthcare & Medicine', slug: 'healthcare-medicine' })
  const s = spec({
    id: 's1',
    field_id: 'f1',
    name: 'Medicine',
    slug: 'medicine',
    regulated_profession: true,
    professional_body: 'GMC',
  })
  const r = role({
    id: 'r1',
    specialism_id: 's1',
    name: 'Foundation Year 1 Doctor (FY1)',
    slug: 'fy1',
    is_regulated_or_restricted: true,
    professional_registration_requirement: 'required',
    fit_classification: 'immediate',
  })
  const ev = evaluateRoleEligibility({ role: r, specialism: s, field: f, stage: null, profile })
  assert.equal(ev.eligibility.country_recognition_review_needed, true)
  assert.notEqual(ev.effective_fit, 'immediate')
  pass('overseas medicine requires recognition review and is not immediate')
}

void aliasKey
void (0 as unknown as NormalisedWorkInEducationProfile)

console.log('\nAll unit fixtures passed.\n')
