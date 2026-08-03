/**
 * Batch 2 unit fixtures — ambiguity, nursing scope, engineering stage.
 * Run: npx tsx lib/career-engine/work-in-education/__tests__/run-batch-2-unit.ts
 */

import assert from 'node:assert/strict'
import { evaluateRoleEligibility } from '../evaluate-eligibility'
import { normaliseWorkInEducationProfile } from '../normalise'
import { evaluateProfessionalStageGate } from '../professional-stage-gate'
import {
  detectRoleNursingBranch,
  evaluateQualificationScope,
  resolveProfileNursingScope,
} from '../qualification-scope'
import { resolveFieldAndSpecialism } from '../resolve-field'
import type {
  KnowledgeFieldRow,
  KnowledgeRoleRow,
  KnowledgeSpecialismRow,
  KnowledgeStageRow,
} from '../types'

function pass(name: string) {
  console.log(`  ✓ ${name}`)
}

function field(
  partial: Partial<KnowledgeFieldRow> & Pick<KnowledgeFieldRow, 'id' | 'name' | 'slug'>
): KnowledgeFieldRow {
  return { description: '', active: true, status: 'draft', ...partial }
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

console.log('\n=== Work in My Education Batch 2 unit fixtures ===\n')

// A. Broad Law ambiguity
{
  const fields = [
    field({ id: 'f-law', name: 'Law, Legal & Justice', slug: 'law-legal-justice' }),
    field({ id: 'f-bus', name: 'Business & Management', slug: 'business-management' }),
  ]
  const specialisms = [
    spec({ id: 's1', field_id: 'f-law', name: 'Administrative Law', slug: 'administrative-law' }),
    spec({ id: 's2', field_id: 'f-law', name: 'Commercial Law', slug: 'commercial-law' }),
    spec({ id: 's3', field_id: 'f-law', name: 'Criminal Law', slug: 'criminal-law' }),
    spec({ id: 's4', field_id: 'f-law', name: 'Family Law', slug: 'family-law' }),
  ]
  const profile = normaliseWorkInEducationProfile({
    education_level: 'bachelor',
    qualification_title: 'LLB',
    subject: 'Law',
    qualification_country: 'United Kingdom',
    years_relevant_experience: 0,
  })
  const res = resolveFieldAndSpecialism({ profile, fields, specialisms })
  assert.equal(res.primary_field?.slug, 'law-legal-justice')
  assert.equal(res.needs_clarification, true)
  assert.equal(res.primary_specialism, null)
  assert.equal(res.clarification_reason, 'broad_subject_multiple_valid_specialisms')
  assert.ok(res.clarification_options.length >= 2)
  assert.ok(!res.clarification_options.every((o) => o.slug === 'administrative-law'))
  pass('A. Broad LLB+Law needs clarification; no forced Administrative Law')
}

// B. Commercial Law title resolves
{
  const fields = [field({ id: 'f-law', name: 'Law, Legal & Justice', slug: 'law-legal-justice' })]
  const specialisms = [
    spec({ id: 's1', field_id: 'f-law', name: 'Administrative Law', slug: 'administrative-law' }),
    spec({ id: 's2', field_id: 'f-law', name: 'Commercial Law', slug: 'commercial-law' }),
  ]
  const profile = normaliseWorkInEducationProfile({
    education_level: 'bachelor',
    qualification_title: 'LLB Commercial Law',
    subject: 'Law',
    specialisation: 'Commercial Law',
    qualification_country: 'Nigeria',
    years_relevant_experience: 1,
  })
  const res = resolveFieldAndSpecialism({ profile, fields, specialisms })
  assert.equal(res.primary_specialism?.slug, 'commercial-law')
  assert.equal(res.needs_clarification, false)
  pass('B. LLB Commercial Law resolves Commercial Law')
}

// C. Adult nursing scope vs mental health role
{
  const profile = normaliseWorkInEducationProfile({
    education_level: 'bachelor',
    qualification_title: 'BSc Adult Nursing',
    subject: 'Nursing',
    qualification_country: 'United Kingdom',
    years_relevant_experience: 1,
    professional_registration: [
      { body: 'NMC', status: 'registered', registration_scope: 'adult_nursing' },
    ],
  })
  assert.equal(resolveProfileNursingScope(profile), 'adult_nursing')
  const f = field({ id: 'f1', name: 'Healthcare & Medicine', slug: 'healthcare-medicine' })
  const s = spec({
    id: 's1',
    field_id: 'f1',
    name: 'Nursing',
    slug: 'nursing',
    regulated_profession: true,
    professional_body: 'NMC',
  })
  const mh = role({
    id: 'r1',
    specialism_id: 's1',
    name: 'Mental Health Staff Nurse',
    slug: 'mh-nurse',
    is_regulated_or_restricted: true,
    professional_registration_requirement: 'required',
  })
  assert.equal(detectRoleNursingBranch(mh), 'mental_health_nursing')
  const scope = evaluateQualificationScope({ profile, role: mh, specialism: s, fieldSlug: f.slug })
  assert.equal(scope.qualification_scope_match, 'mismatched')
  const ev = evaluateRoleEligibility({ role: mh, specialism: s, field: f, stage: null, profile })
  assert.notEqual(ev.effective_fit, 'immediate')
  assert.ok(
    ev.effective_fit === 'blocked_until_requirement' || ev.effective_fit === 'needs_review'
  )

  const midwife = role({
    id: 'r2',
    specialism_id: 's1',
    name: 'Community Midwife',
    slug: 'midwife',
    is_regulated_or_restricted: true,
    professional_registration_requirement: 'required',
  })
  const evM = evaluateRoleEligibility({ role: midwife, specialism: s, field: f, stage: null, profile })
  assert.notEqual(evM.effective_fit, 'immediate')

  const staff = role({
    id: 'r3',
    specialism_id: 's1',
    name: 'Staff Nurse',
    slug: 'staff-nurse',
    is_regulated_or_restricted: true,
    professional_registration_requirement: 'required',
  })
  const evS = evaluateRoleEligibility({ role: staff, specialism: s, field: f, stage: null, profile })
  assert.ok(evS.effective_fit === 'immediate' || evS.effective_fit === 'realistic_next')
  pass('C. Adult NMC blocks MH/Midwife immediate; Staff Nurse allowed')
}

// D. Mental health scope
{
  const profile = normaliseWorkInEducationProfile({
    education_level: 'bachelor',
    qualification_title: 'BSc Mental Health Nursing',
    subject: 'Nursing',
    qualification_country: 'United Kingdom',
    years_relevant_experience: 1,
    professional_registration: [
      { body: 'NMC', status: 'registered', registration_scope: 'mental_health_nursing' },
    ],
  })
  const f = field({ id: 'f1', name: 'Healthcare & Medicine', slug: 'healthcare-medicine' })
  const s = spec({
    id: 's1',
    field_id: 'f1',
    name: 'Nursing',
    slug: 'nursing',
    regulated_profession: true,
    professional_body: 'NMC',
  })
  const mh = role({
    id: 'r1',
    specialism_id: 's1',
    name: 'Mental Health Staff Nurse',
    slug: 'mh',
    is_regulated_or_restricted: true,
    professional_registration_requirement: 'required',
  })
  const ev = evaluateRoleEligibility({ role: mh, specialism: s, field: f, stage: null, profile })
  assert.ok(ev.effective_fit === 'immediate' || ev.effective_fit === 'realistic_next')
  pass('D. Mental health NMC allows MH staff nurse')
}

// E. Generic nursing unknown scope
{
  const profile = normaliseWorkInEducationProfile({
    education_level: 'bachelor',
    qualification_title: 'BSc Nursing',
    subject: 'Nursing',
    qualification_country: 'United Kingdom',
    years_relevant_experience: 0,
    professional_registration: [{ body: 'NMC', status: 'registered', registration_scope: 'unknown' }],
  })
  assert.equal(resolveProfileNursingScope(profile), 'unknown')
  const f = field({ id: 'f1', name: 'Healthcare & Medicine', slug: 'healthcare-medicine' })
  const s = spec({
    id: 's1',
    field_id: 'f1',
    name: 'Nursing',
    slug: 'nursing',
    regulated_profession: true,
    professional_body: 'NMC',
  })
  const mh = role({
    id: 'r1',
    specialism_id: 's1',
    name: 'Mental Health Staff Nurse',
    slug: 'mh',
    is_regulated_or_restricted: true,
    professional_registration_requirement: 'required',
  })
  const ev = evaluateRoleEligibility({ role: mh, specialism: s, field: f, stage: null, profile })
  assert.notEqual(ev.effective_fit, 'immediate')
  pass('E. Unknown NMC scope blocks branch-specific immediate')
}

// F. Civil graduate chartered stage
{
  const profile = normaliseWorkInEducationProfile({
    education_level: 'bachelor',
    qualification_title: 'BEng Civil Engineering',
    subject: 'Civil Engineering',
    years_relevant_experience: 0,
  })
  const stage: KnowledgeStageRow = {
    id: 'st1',
    stage_model_id: 'm1',
    stage_key: 'chartered_professional_engineer',
    label: 'Chartered / Professional Engineer',
    active: true,
  }
  const gate = evaluateProfessionalStageGate({
    profile,
    role: role({
      id: 'r1',
      specialism_id: 's1',
      name: 'Site Engineer',
      slug: 'site',
      minimum_experience_years: 0,
      fit_classification: 'realistic_next',
    }),
    stage,
    fieldSlug: 'engineering',
  })
  assert.ok(gate.warnings.includes('stage_professional_status_not_confirmed') || gate.force_fit)
  assert.notEqual(gate.force_fit, 'immediate')

  const cengRole = role({
    id: 'r2',
    specialism_id: 's1',
    name: 'Chartered Civil Engineer (CEng)',
    slug: 'ceng',
    professional_registration_requirement: 'required',
    minimum_experience_years: 0,
  })
  const f = field({ id: 'f1', name: 'Engineering', slug: 'engineering' })
  const s = spec({ id: 's1', field_id: 'f1', name: 'Civil Engineering', slug: 'civil-engineering' })
  const ev = evaluateRoleEligibility({
    role: cengRole,
    specialism: s,
    field: f,
    stage,
    profile,
  })
  assert.ok(
    ev.effective_fit === 'blocked_until_requirement' || ev.effective_fit === 'future_progression'
  )
  pass('F. Chartered stage/title not immediate for zero-experience graduate')
}

// Civil engineering resolves (not broad Engineering alone)
{
  const fields = [field({ id: 'f1', name: 'Engineering', slug: 'engineering' })]
  const specialisms = [
    spec({ id: 's1', field_id: 'f1', name: 'Civil Engineering', slug: 'civil-engineering' }),
    spec({ id: 's2', field_id: 'f1', name: 'Mechanical Engineering', slug: 'mechanical-engineering' }),
  ]
  const profile = normaliseWorkInEducationProfile({
    education_level: 'bachelor',
    qualification_title: 'BEng Civil Engineering',
    subject: 'Civil Engineering',
  })
  const res = resolveFieldAndSpecialism({ profile, fields, specialisms })
  assert.equal(res.primary_specialism?.slug, 'civil-engineering')
  assert.equal(res.needs_clarification, false)
  pass('F2. Civil Engineering subject resolves specialism')
}

console.log('\nAll Batch 2 unit fixtures passed.\n')
