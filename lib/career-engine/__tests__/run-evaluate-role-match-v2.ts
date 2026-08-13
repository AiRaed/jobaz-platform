/**
 * Eligibility & Match Scoring v2 unit tests.
 *   npx tsx lib/career-engine/__tests__/run-evaluate-role-match-v2.ts
 */

import assert from 'node:assert/strict'
import {
  evaluateRoleMatch,
  normalizeRegistrationRequirement,
  removeContradictions,
  SCORE_WEIGHTS,
} from '../evaluate-role-match'
import { resolveNormalizedQualification } from '../qualification-taxonomy'
import type {
  FieldSpecialismResolution,
  KnowledgeFieldRow,
  KnowledgeRoleRow,
  KnowledgeSpecialismRow,
  KnowledgeStageRow,
  NormalisedWorkInEducationProfile,
} from '../work-in-education/types'

console.log('\n=== Eligibility & Match Scoring v2 tests ===\n')

const field: KnowledgeFieldRow = {
  id: 'f-eng',
  name: 'Engineering',
  slug: 'engineering',
  description: '',
  active: true,
  status: 'approved',
}

const specialism: KnowledgeSpecialismRow = {
  id: 's-civil',
  field_id: 'f-eng',
  name: 'Civil Engineering',
  slug: 'civil-engineering',
  description: '',
  regulated_profession: false,
  professional_body: 'Engineering Council',
  active: true,
  status: 'approved',
  stage_model_id: null,
}

const resolution: FieldSpecialismResolution = {
  primary_field: { id: 'f-eng', name: 'Engineering', slug: 'engineering', score: 1, reasons: [] },
  primary_specialism: {
    id: 's-civil',
    name: 'Civil Engineering',
    slug: 'civil-engineering',
    score: 1,
    reasons: [],
  },
  alternative_fields: [],
  alternative_specialisms: [],
  needs_clarification: false,
  confidence: 0.9,
  score_margin: 0.2,
  is_broad_subject: false,
  clarification_reason: null,
  clarification_options: [],
  match_reasons: [],
}

function profile(partial: Partial<NormalisedWorkInEducationProfile> = {}): NormalisedWorkInEducationProfile {
  const education_level = partial.education_level ?? 'bachelor'
  const base: NormalisedWorkInEducationProfile = {
    education_level,
    qualification_title_raw: 'BEng Civil Engineering',
    qualification_title_normalised: 'beng civil engineering',
    subject_raw: 'Civil Engineering',
    subject_normalised: 'civil engineering',
    subject_tokens: ['civil', 'engineering'],
    specialisation_raw: null,
    specialisation_normalised: null,
    specialisation_tokens: [],
    institution_country: 'United Kingdom',
    qualification_country: 'United Kingdom',
    is_uk_qualification: true,
    graduation_status: 'completed',
    graduation_year: 2024,
    years_relevant_experience: 0,
    current_job_title: null,
    current_job_tokens: [],
    has_uk_experience: null,
    professional_registration: [],
    licences: [],
    skills: [],
    skill_tokens: ['civil', 'engineering'],
    languages: [],
    english_level: null,
    alias_hits: [],
    career_preferences: {
      wants_related_field_only: null,
      wants_academic_route: null,
      open_to_retraining: null,
      preferred_work_types: [],
      preferred_locations: [],
    },
    qualification: resolveNormalizedQualification({
      education_level,
      qualification_title: 'BEng Civil Engineering',
      qualification_country: 'United Kingdom',
    }),
  }
  const merged = { ...base, ...partial }
  if (!merged.qualification) {
    merged.qualification = resolveNormalizedQualification({
      education_level: merged.education_level,
      qualification_title: merged.qualification_title_raw,
      qualification_country: merged.qualification_country,
    })
  }
  return merged
}

function role(partial: Partial<KnowledgeRoleRow> & { name: string }): KnowledgeRoleRow {
  return {
    id: partial.id ?? 'role-1',
    specialism_id: 's-civil',
    stage_id: null,
    name: partial.name,
    slug: partial.slug ?? 'role',
    description: partial.description ?? '',
    role_category: partial.role_category ?? 'practitioner',
    seniority_level: partial.seniority_level ?? 'graduate',
    minimum_experience_years:
      partial.minimum_experience_years === undefined ? 0 : partial.minimum_experience_years,
    experience_requirement_label: partial.experience_requirement_label ?? null,
    professional_registration_requirement:
      partial.professional_registration_requirement ?? 'none',
    professional_membership_requirement: null,
    academic_requirement: partial.academic_requirement ?? 'degree_relevant',
    is_research_role: false,
    is_academic_role: false,
    is_regulated_or_restricted: partial.is_regulated_or_restricted ?? false,
    eligibility_note: partial.eligibility_note ?? null,
    fit_classification: partial.fit_classification ?? 'immediate',
    priority: 100,
    status: 'draft',
    active: true,
    metadata: null,
    ...partial,
  }
}

const graduateStage: KnowledgeStageRow = {
  id: 'st1',
  stage_model_id: 'm1',
  stage_key: 'graduate_engineer',
  label: 'Graduate Engineer',
  active: true,
}

// 1. Exact civil graduate match, 0 exp, entry role
{
  const ev = evaluateRoleMatch({
    role: role({ name: 'Graduate Civil Engineer', seniority_level: 'graduate', minimum_experience_years: 0 }),
    specialism,
    field,
    stage: graduateStage,
    profile: profile(),
    resolution,
    specialismRank: 0,
  })
  assert.equal(ev.resultGroup, 'immediate')
  assert.equal(ev.eligibilityStatus, 'eligible_now')
  assert.ok(ev.matchScore >= 70 && ev.matchScore <= 100)
  assert.ok(!ev.unmetRequirements.some((u) => /experience looks sufficient/i.test(u)))
  assert.ok(
    ev.matchedReasons.some((m) => /does not require prior experience|meets the stated/i.test(m))
  )
  assert.ok(!ev.matchedReasons.some((m) => /experience looks sufficient/i.test(m)))
  console.log('  ✓ 1. Graduate entry, 0 exp → eligible_now, varied score', ev.matchScore)
}

// 2. Zero-exp vs role requiring 1 year
{
  const ev = evaluateRoleMatch({
    role: role({
      name: 'Civil Engineer',
      seniority_level: 'early_career',
      minimum_experience_years: 1,
    }),
    specialism,
    field,
    stage: graduateStage,
    profile: profile({ years_relevant_experience: 0 }),
    resolution,
    specialismRank: 0,
  })
  assert.ok(ev.unmetRequirements.some((u) => /experience/i.test(u) && /0/.test(u)))
  assert.ok(!ev.matchedReasons.some((m) => /experience looks sufficient|meets or exceeds/i.test(m)))
  assert.notEqual(ev.eligibilityStatus, 'eligible_now')
  assert.ok(ev.matchScore < 100)
  console.log('  ✓ 2. 0 exp vs 1yr min → unmet experience, not eligible_now', ev.matchScore)
}

// 3. Zero-exp vs 5+ year senior
{
  const ev = evaluateRoleMatch({
    role: role({
      name: 'Senior Civil Engineer',
      seniority_level: 'senior',
      minimum_experience_years: 5,
    }),
    specialism,
    field,
    stage: {
      id: 'st2',
      stage_model_id: 'm1',
      stage_key: 'senior_engineer',
      label: 'Senior',
      active: true,
    },
    profile: profile({ years_relevant_experience: 0 }),
    resolution,
    specialismRank: 0,
  })
  assert.ok(ev.resultGroup === 'future' || ev.resultGroup === 'blocked_or_review')
  assert.notEqual(ev.eligibilityStatus, 'eligible_now')
  assert.ok(ev.matchScore <= 49)
  console.log('  ✓ 3. Senior 5yr vs 0 exp → future/blocked, score≤49', ev.matchScore)
}

// 4. Mandatory registration missing
{
  const ev = evaluateRoleMatch({
    role: role({
      name: 'Staff Nurse',
      professional_registration_requirement: 'required',
      is_regulated_or_restricted: true,
      minimum_experience_years: 0,
    }),
    specialism: {
      ...specialism,
      id: 's-nurs',
      name: 'Adult Nursing',
      regulated_profession: true,
      professional_body: 'NMC',
    },
    field: {
      ...field,
      id: 'f-health',
      name: 'Healthcare',
      slug: 'healthcare-medicine',
    },
    stage: null,
    profile: profile({ subject: 'Nursing', years_relevant_experience: 1 }),
    resolution: {
      ...resolution,
      primary_field: {
        id: 'f-health',
        name: 'Healthcare',
        slug: 'healthcare-medicine',
        score: 1,
        reasons: [],
      },
      primary_specialism: {
        id: 's-nurs',
        name: 'Adult Nursing',
        slug: 'adult-nursing',
        score: 1,
        reasons: [],
      },
    },
    specialismRank: 0,
  })
  assert.ok(ev.unmetRequirements.some((u) => /registration/i.test(u)))
  assert.ok(!ev.matchedReasons.some((m) => /registration requirements appear met/i.test(m)))
  assert.notEqual(ev.eligibilityStatus, 'eligible_now')
  assert.ok(ev.matchScore <= 69)
  console.log('  ✓ 4. Mandatory registration missing → capped ≤69', ev.matchScore)
}

// 5. Registration desirable but missing — not blocking alone
{
  const ev = evaluateRoleMatch({
    role: role({
      name: 'Assistant Civil Engineer',
      professional_registration_requirement: 'commonly_expected',
      minimum_experience_years: 0,
      seniority_level: 'graduate',
    }),
    specialism,
    field,
    stage: graduateStage,
    profile: profile(),
    resolution,
    specialismRank: 0,
  })
  assert.ok(ev.warnings.some((w) => /desirable|not mandatory/i.test(w)))
  assert.ok(!ev.unmetRequirements.some((u) => /registration is required/i.test(u)))
  console.log('  ✓ 5. Desirable registration missing → warning, not hard block', ev.eligibilityStatus)
}

// 6. Qualification below mandatory
{
  const ev = evaluateRoleMatch({
    role: role({
      name: 'Research Fellow',
      academic_requirement: 'phd_relevant',
      is_research_role: true,
      minimum_experience_years: 0,
    }),
    specialism,
    field,
    stage: null,
    profile: profile({ education_level: 'bachelor' }),
    resolution,
    specialismRank: 0,
  })
  assert.ok(ev.unmetRequirements.some((u) => /qualification|mandatory|below/i.test(u)))
  assert.ok(ev.matchScore <= 49)
  console.log('  ✓ 6. Qual below PhD → score≤49', ev.matchScore)
}

// 7. Unknown experience requirement
{
  const ev = evaluateRoleMatch({
    role: role({
      name: 'Civil Design Engineer',
      seniority_level: 'mid',
      minimum_experience_years: null,
      experience_requirement_label: null,
    }),
    specialism,
    field,
    stage: null,
    profile: profile({ years_relevant_experience: 0 }),
    resolution,
    specialismRank: 0,
  })
  assert.ok(ev.warnings.some((w) => /experience requirements are not clearly defined/i.test(w)))
  assert.ok(!ev.matchedReasons.some((m) => /experience looks sufficient/i.test(m)))
  console.log('  ✓ 7. Unknown experience → warning, not falsely met')
}

// 8. Manual-review regulated
{
  const ev = evaluateRoleMatch({
    role: role({
      name: 'Doctor',
      professional_registration_requirement: 'required',
      is_regulated_or_restricted: true,
      minimum_experience_years: 0,
    }),
    specialism: {
      ...specialism,
      regulated_profession: true,
      professional_body: 'GMC',
    },
    field: { ...field, slug: 'healthcare-medicine', name: 'Healthcare' },
    stage: null,
    profile: profile({
      is_uk_qualification: false,
      qualification_country: 'India',
      professional_registration: [],
    }),
    resolution: {
      ...resolution,
      primary_field: {
        id: 'f-eng',
        name: 'Healthcare',
        slug: 'healthcare-medicine',
        score: 1,
        reasons: [],
      },
    },
    specialismRank: 0,
    prior: {
      eligibility: {
        status: 'needs_review',
        education_match: true,
        experience_match: true,
        registration_match: false,
        licence_match: true,
        country_recognition_review_needed: true,
        qualification_scope_match: 'unknown',
        registration_scope_match: 'unknown',
      },
      gaps: [],
      warnings: [],
      demotion_reasons: [],
      professional_stage_gate: 'not_applicable',
      scope_gate: 'ok',
    },
  })
  assert.equal(ev.eligibilityStatus, 'needs_review')
  assert.ok(ev.matchScore <= 69)
  console.log('  ✓ 8. Regulated manual review → needs_review, ≤69', ev.matchScore)
}

// 9. No unmet requirements can score 100
{
  const ev = evaluateRoleMatch({
    role: role({
      name: 'Site Engineer',
      seniority_level: 'early_career',
      minimum_experience_years: 2,
      professional_registration_requirement: 'none',
    }),
    specialism,
    field,
    stage: {
      id: 'st3',
      stage_model_id: 'm1',
      stage_key: 'chartered_professional_engineer',
      label: 'Chartered / Professional',
      active: true,
    },
    profile: profile({ years_relevant_experience: 0 }),
    resolution,
    specialismRank: 0,
  })
  assert.ok(ev.unmetRequirements.length > 0)
  assert.ok(ev.matchScore < 100)
  assert.ok(!ev.matchedReasons.some((m) => /charter/i.test(m) && /met/i.test(m)))
  // Site Engineer must not be auto-treated as chartered requirement unless explicit
  assert.ok(
    !ev.unmetRequirements.every((u) => /charter/i.test(u)) ||
      ev.warnings.some((w) => /site engineer/i.test(w))
  )
  console.log('  ✓ 9. Unmet present → score < 100; Site Engineer not auto-Chartered', ev.matchScore)
}

// 10. No contradictory positive + negative reasons
{
  const cleaned = removeContradictions({
    matchedReasons: [
      'Your experience looks sufficient',
      'Professional registration requirements appear met',
    ],
    unmetRequirements: [
      'More relevant experience is typically needed',
      'Chartered or professional registration status is unconfirmed',
    ],
    warnings: [],
  })
  assert.ok(!cleaned.matchedReasons.some((m) => /experience looks sufficient/i.test(m)))
  assert.ok(!cleaned.matchedReasons.some((m) => /registration requirements appear met/i.test(m)))

  const ev = evaluateRoleMatch({
    role: role({
      name: 'Chartered Civil Engineer',
      seniority_level: 'senior',
      minimum_experience_years: 5,
      professional_registration_requirement: 'required',
      eligibility_note: 'CEng required',
    }),
    specialism,
    field,
    stage: null,
    profile: profile({ years_relevant_experience: 0 }),
    resolution,
    specialismRank: 0,
  })
  const texts = [...ev.matchedReasons, ...ev.unmetRequirements].join(' | ').toLowerCase()
  assert.ok(!(/experience looks sufficient/.test(texts) && /more relevant experience/.test(texts)))
  assert.ok(
    !(
      /registration requirements appear met/.test(texts) &&
      /chartered or professional registration status is unconfirmed/.test(texts)
    )
  )
  assert.notEqual(ev.eligibilityStatus, 'eligible_now')
  console.log('  ✓ 10. No contradictory reason pairs')
}

// Weights sanity
{
  assert.equal(
    SCORE_WEIGHTS.specialism +
      SCORE_WEIGHTS.qualification +
      SCORE_WEIGHTS.experience +
      SCORE_WEIGHTS.career_stage +
      SCORE_WEIGHTS.registration,
    100
  )
  assert.equal(normalizeRegistrationRequirement('commonly_expected'), 'desirable')
  assert.equal(normalizeRegistrationRequirement('required'), 'required')
  assert.equal(normalizeRegistrationRequirement('none'), 'not_required')
  console.log('  ✓ Weights total 100; registration normalisation')
}

console.log('\nAll Scoring v2 unit tests passed.\n')
