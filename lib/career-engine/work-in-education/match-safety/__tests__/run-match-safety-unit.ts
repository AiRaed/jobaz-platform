/**
 * Global match-safety unit + persona acceptance checks.
 *   npx tsx lib/career-engine/work-in-education/match-safety/__tests__/run-match-safety-unit.ts
 */

import assert from 'node:assert/strict'
import {
  classifyRoleSafety,
  classifyStageBand,
  detectRoleBlockers,
  friendlyRewrite,
  blockerToFriendly,
  classifyWieFieldFamily,
  dedupePublicLines,
  polishPublicRoleCopy,
  demoteImmediateMatchType,
  FUTURE_ROUTE_SOFT_LINE,
} from '../index'
import {
  polishHumanitiesRoleTitle,
  shouldDeprioritiseCareCourseForHss,
} from '../humanities-polish'
import type { KnowledgeRoleRow, RoleEligibilityResult } from '../../types'

console.log('\n=== Global match-safety tests ===\n')

function baseRole(partial: Partial<KnowledgeRoleRow> & { name: string }): KnowledgeRoleRow {
  return {
    id: partial.id ?? 'r1',
    specialism_id: 's1',
    stage_id: partial.stage_id ?? 'st1',
    name: partial.name,
    slug: 'role',
    description: '',
    role_category: null,
    seniority_level: partial.seniority_level ?? null,
    minimum_experience_years: partial.minimum_experience_years ?? 0,
    experience_requirement_label: null,
    professional_registration_requirement: partial.professional_registration_requirement ?? 'none',
    professional_membership_requirement: null,
    academic_requirement: partial.academic_requirement ?? 'degree_relevant',
    is_research_role: partial.is_research_role ?? false,
    is_academic_role: partial.is_academic_role ?? false,
    is_regulated_or_restricted: partial.is_regulated_or_restricted ?? false,
    eligibility_note: partial.eligibility_note ?? null,
    fit_classification: 'immediate',
    priority: 100,
    status: 'draft',
    active: true,
    metadata: null,
  }
}

function evaluated(title: string): RoleEligibilityResult {
  return {
    role_id: 'r1',
    role_title: title,
    field: { id: 'f', name: 'Field', slug: 'field' },
    specialism: { id: 's', name: 'Spec', slug: 'spec' },
    stage: { id: 'st', key: 'graduate', label: 'Graduate' },
    stored_fit: 'immediate',
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
    match_score: 90,
    match_reasons: ['Your specialism matches'],
    warnings: [],
    demotion_reasons: [],
    retrieval_source: 'primary_specialism',
    relation_reason: '',
    scope_gate: 'not_applicable',
    professional_stage_gate: 'not_applicable',
  }
}

// Stage bands
{
  assert.equal(classifyStageBand('graduate_engineer', 'Graduate Engineer'), 'graduate')
  assert.equal(classifyStageBand('chartered_professional_engineer', 'Chartered'), 'chartered')
  assert.equal(classifyStageBand('academic_research', 'Academic / Research'), 'academic')
  assert.equal(classifyStageBand('foundation_support', 'Foundation / Support'), 'foundation')
  assert.equal(classifyStageBand('leadership', 'Leadership'), 'leadership')
  assert.equal(
    classifyStageBand('professional_practitioner', 'Professional Practitioner'),
    'officer'
  )
  console.log('  ✓ Stage bands classify generically (incl. leadership)')
}

// Blockers
{
  const b = detectRoleBlockers({
    roleTitle: 'Chartered Civil Engineer',
    stageLabel: 'Chartered / Professional Engineer',
    registrationRequirement: 'required',
    regulated: true,
  })
  assert.ok(b.some((x) => x.kind === 'professional'))
  const a = detectRoleBlockers({
    roleTitle: 'Postdoctoral Researcher',
    isResearchRole: true,
  })
  assert.ok(a.some((x) => x.kind === 'academic'))
  console.log('  ✓ Blockers detect chartered + postdoc')
}

// Civil graduate persona
{
  const ctx = {
    userStageKey: 'graduate_engineer',
    userStageLabel: 'Graduate Engineer',
    academicRouteSelected: false,
    yearsExperience: 0,
    hasActiveRegistration: false,
    isUkQualification: true,
    roleOnSelectedStage: true,
  }
  const grad = classifyRoleSafety(
    evaluated('Graduate Civil Engineer'),
    baseRole({ name: 'Graduate Civil Engineer', seniority_level: 'graduate' }),
    { id: '1', stage_model_id: 'm', stage_key: 'graduate_engineer', label: 'Graduate Engineer', active: true },
    ctx
  )
  assert.equal(grad.match_type, 'best_immediate_route')

  const assistant = classifyRoleSafety(
    evaluated('Assistant Civil Engineer'),
    baseRole({
      name: 'Assistant Civil Engineer',
      seniority_level: 'graduate',
      academic_requirement: 'degree_relevant',
      eligibility_note: 'Suitable with a relevant academic engineering degree',
    }),
    { id: '1', stage_model_id: 'm', stage_key: 'graduate_engineer', label: 'Graduate Engineer', active: true },
    ctx
  )
  assert.equal(
    assistant.match_type,
    'best_immediate_route',
    'Assistant on graduate stage must not be blocked by bare “academic” in notes'
  )

  const site = classifyRoleSafety(
    evaluated('Site Engineer'),
    baseRole({ name: 'Site Engineer', seniority_level: 'mid', minimum_experience_years: 1 }),
    { id: '1', stage_model_id: 'm', stage_key: 'graduate_engineer', label: 'Graduate Engineer', active: true },
    ctx
  )
  assert.ok(
    site.match_type === 'developing_match' || site.match_type === 'future_career_option',
    'Bare Site Engineer should not be best immediate on graduate stage'
  )

  const chartered = classifyRoleSafety(
    evaluated('Chartered Civil Engineer'),
    baseRole({
      name: 'Chartered Civil Engineer',
      professional_registration_requirement: 'required',
      is_regulated_or_restricted: true,
      seniority_level: 'chartered',
    }),
    {
      id: '2',
      stage_model_id: 'm',
      stage_key: 'chartered_professional_engineer',
      label: 'Chartered / Professional Engineer',
      active: true,
    },
    { ...ctx, roleOnSelectedStage: false }
  )
  assert.equal(chartered.match_type, 'needs_review_regulated')

  const postdoc = classifyRoleSafety(
    evaluated('Postdoctoral Researcher'),
    baseRole({ name: 'Postdoctoral Researcher', is_research_role: true, is_academic_role: true }),
    {
      id: '3',
      stage_model_id: 'm',
      stage_key: 'academic_research',
      label: 'Academic / Research',
      active: true,
    },
    { ...ctx, roleOnSelectedStage: false }
  )
  assert.ok(
    postdoc.match_type === 'future_career_option' || postdoc.match_type === 'not_recommended_now'
  )

  const senior = classifyRoleSafety(
    evaluated('Senior Site Engineer'),
    baseRole({
      name: 'Senior Site Engineer',
      seniority_level: 'senior',
      minimum_experience_years: 5,
    }),
    {
      id: '4',
      stage_model_id: 'm',
      stage_key: 'experienced_engineer',
      label: 'Experienced Engineer',
      active: true,
    },
    { ...ctx, roleOnSelectedStage: false }
  )
  assert.equal(senior.match_type, 'future_career_option')
  console.log('  ✓ Civil graduate persona: immediate vs chartered/postdoc/senior')
}

// Healthcare
{
  const ctx = {
    userStageKey: 'support_worker',
    userStageLabel: 'Care / Support',
    academicRouteSelected: false,
    yearsExperience: 0,
    hasActiveRegistration: false,
    isUkQualification: true,
  }
  const nurse = classifyRoleSafety(
    evaluated('Registered Nurse'),
    baseRole({
      name: 'Registered Nurse',
      professional_registration_requirement: 'required',
      is_regulated_or_restricted: true,
    }),
    { id: 'n', stage_model_id: 'm', stage_key: 'registered', label: 'Registered Practitioner', active: true },
    ctx
  )
  assert.equal(nurse.match_type, 'needs_review_regulated')

  const care = classifyRoleSafety(
    evaluated('Care Assistant'),
    baseRole({ name: 'Care Assistant', seniority_level: 'entry' }),
    { id: 'c', stage_model_id: 'm', stage_key: 'foundation', label: 'Foundation / Support', active: true },
    ctx
  )
  assert.equal(care.match_type, 'best_immediate_route')
  console.log('  ✓ Healthcare: nurse regulated, care assistant immediate')
}

// Education / Teaching
{
  const ctx = {
    userStageKey: 'teaching_assistant',
    userStageLabel: 'Teaching Assistant',
    academicRouteSelected: false,
    yearsExperience: 0,
    hasActiveRegistration: false,
    isUkQualification: true,
  }
  const qts = classifyRoleSafety(
    evaluated('Qualified Teacher'),
    baseRole({
      name: 'Qualified Teacher',
      professional_registration_requirement: 'QTS required',
      eligibility_note: 'QTS required',
      is_regulated_or_restricted: true,
    }),
    { id: 't', stage_model_id: 'm', stage_key: 'qualified_teacher', label: 'Qualified Teacher', active: true },
    ctx
  )
  assert.equal(qts.match_type, 'needs_review_regulated')

  const ta = classifyRoleSafety(
    evaluated('Teaching Assistant'),
    baseRole({ name: 'Teaching Assistant', seniority_level: 'assistant' }),
    { id: 'ta', stage_model_id: 'm', stage_key: 'assistant', label: 'Teaching Assistant', active: true },
    ctx
  )
  assert.equal(ta.match_type, 'best_immediate_route')
  console.log('  ✓ Education: QTS review, TA immediate')
}

// Accounting
{
  const ctx = {
    userStageKey: 'graduate',
    userStageLabel: 'Graduate / Entry',
    academicRouteSelected: false,
    yearsExperience: 0,
    hasActiveRegistration: false,
    isUkQualification: true,
  }
  const assistant = classifyRoleSafety(
    evaluated('Accounts Assistant'),
    baseRole({ name: 'Accounts Assistant' }),
    { id: 'a', stage_model_id: 'm', stage_key: 'graduate', label: 'Graduate / Entry', active: true },
    ctx
  )
  assert.equal(assistant.match_type, 'best_immediate_route')
  const ca = classifyRoleSafety(
    evaluated('Chartered Accountant'),
    baseRole({
      name: 'Chartered Accountant',
      professional_registration_requirement: 'ACCA/CIMA',
      is_regulated_or_restricted: true,
    }),
    { id: 'ca', stage_model_id: 'm', stage_key: 'chartered', label: 'Chartered', active: true },
    ctx
  )
  assert.equal(ca.match_type, 'needs_review_regulated')
  console.log('  ✓ Accounting: assistant immediate, chartered review')
}

// IT
{
  const ctx = {
    userStageKey: 'junior',
    userStageLabel: 'Junior / Entry',
    academicRouteSelected: false,
    yearsExperience: 0,
    hasActiveRegistration: false,
    isUkQualification: true,
  }
  const support = classifyRoleSafety(
    evaluated('IT Support Technician'),
    baseRole({ name: 'IT Support Technician', seniority_level: 'junior' }),
    { id: 'it', stage_model_id: 'm', stage_key: 'junior', label: 'Junior / Entry', active: true },
    ctx
  )
  assert.equal(support.match_type, 'best_immediate_route')
  const architect = classifyRoleSafety(
    evaluated('Senior Software Architect'),
    baseRole({
      name: 'Senior Software Architect',
      seniority_level: 'senior',
      minimum_experience_years: 7,
    }),
    { id: 'ar', stage_model_id: 'm', stage_key: 'senior', label: 'Senior Specialist', active: true },
    ctx
  )
  assert.equal(architect.match_type, 'future_career_option')
  console.log('  ✓ IT: support immediate, architect future')
}

// Legal
{
  const ctx = {
    userStageKey: 'paralegal',
    userStageLabel: 'Paralegal / Assistant',
    academicRouteSelected: false,
    yearsExperience: 0,
    hasActiveRegistration: false,
    isUkQualification: true,
  }
  const para = classifyRoleSafety(
    evaluated('Paralegal'),
    baseRole({ name: 'Paralegal' }),
    { id: 'p', stage_model_id: 'm', stage_key: 'paralegal', label: 'Paralegal / Assistant', active: true },
    ctx
  )
  assert.equal(para.match_type, 'best_immediate_route')
  const sol = classifyRoleSafety(
    evaluated('Solicitor'),
    baseRole({
      name: 'Solicitor',
      professional_registration_requirement: 'SRA',
      is_regulated_or_restricted: true,
    }),
    { id: 's', stage_model_id: 'm', stage_key: 'solicitor', label: 'Qualified Solicitor', active: true },
    ctx
  )
  assert.equal(sol.match_type, 'needs_review_regulated')
  console.log('  ✓ Legal: paralegal immediate, solicitor review')
}

// Friendly copy
{
  const t = friendlyRewrite(
    'Qualification level is ambiguous and cannot automatically satisfy this requirement'
  )
  assert.match(t, /qualification recognition|portfolio evidence|manual review/i)
  const e = friendlyRewrite('This role does not require prior experience', {
    suppressNoExperience: true,
  })
  assert.match(e, /future option|UK experience/i)
  const soft = blockerToFriendly(
    { kind: 'professional', code: 'blocker.professional', label: 'x' },
    'non_regulated_practical'
  )
  assert.ok(!/professional registration/i.test(soft), 'No default professional registration for non-regulated')
  console.log('  ✓ Friendly wording rewrites technical messages')
}

// Anthropology / Humanities / Leadership guardrails
{
  assert.equal(
    classifyWieFieldFamily('Humanities & Social Sciences', 'humanities-social-sciences', 'Anthropology'),
    'non_regulated_practical'
  )
  const ctx = {
    userStageKey: 'leadership',
    userStageLabel: 'Leadership',
    academicRouteSelected: false,
    yearsExperience: 0,
    hasActiveRegistration: false,
    isUkQualification: true,
    roleOnSelectedStage: true,
    fieldName: 'Humanities & Social Sciences',
    fieldSlug: 'humanities-social-sciences',
    specialismName: 'Anthropology',
  }
  const lead = classifyRoleSafety(
    evaluated('Anthropology Research / Programme Lead'),
    baseRole({
      name: 'Anthropology Research / Programme Lead',
      professional_registration_requirement: 'none',
      eligibility_note: 'Anthropology leadership — future progression.',
      minimum_experience_years: 8,
    }),
    { id: 'l', stage_model_id: 'm', stage_key: 'leadership', label: 'Leadership', active: true },
    ctx
  )
  assert.equal(
    lead.match_type,
    'future_career_option',
    `Programme Lead with 0 years experience should be future, got ${lead.match_type}`
  )
  assert.notEqual(lead.match_type, 'needs_review_regulated')

  const gradAdj = classifyRoleSafety(
    evaluated('Anthropology Graduate Research Assistant'),
    baseRole({
      name: 'Anthropology Graduate Research Assistant',
      professional_registration_requirement: 'none',
      eligibility_note: 'Graduate entry — professional registration not required.',
    }),
    {
      id: 'g',
      stage_model_id: 'm',
      stage_key: 'graduate_social_sciences_entry',
      label: 'Graduate Entry',
      active: true,
    },
    { ...ctx, roleOnSelectedStage: false }
  )
  assert.equal(
    gradAdj.match_type,
    'best_immediate_route',
    `Graduate RA should be immediate under Leadership with 0 years, got ${gradAdj.match_type}`
  )

  const doctoral = classifyRoleSafety(
    evaluated('Doctoral Researcher (Anthropology)'),
    baseRole({
      name: 'Doctoral Researcher (Anthropology)',
      is_research_role: true,
      academic_requirement: 'phd_relevant',
      professional_registration_requirement: 'none',
    }),
    {
      id: 'a',
      stage_model_id: 'm',
      stage_key: 'academic_research',
      label: 'Academic / Research',
      active: true,
    },
    { ...ctx, roleOnSelectedStage: false }
  )
  assert.ok(
    doctoral.match_type === 'future_career_option' || doctoral.match_type === 'not_recommended_now',
    'Doctoral should be future/academic, not immediate'
  )
  assert.notEqual(doctoral.match_type, 'needs_review_regulated')

  assert.equal(
    polishHumanitiesRoleTitle(
      'Anthropology Research Admin Assistant',
      'Humanities & Social Sciences',
      'Anthropology'
    ),
    'Research Assistant'
  )
  assert.equal(
    polishHumanitiesRoleTitle(
      'Anthropology Graduate Research Assistant',
      'Humanities & Social Sciences',
      'Anthropology'
    ),
    'Social Research Assistant'
  )
  assert.equal(
    polishHumanitiesRoleTitle(
      'Programme Lead (Anthropology)',
      'Humanities & Social Sciences',
      'Anthropology'
    ),
    'Programme Lead'
  )
  assert.ok(
    shouldDeprioritiseCareCourseForHss(
      'Counselling Skills Introduction',
      'Humanities & Social Sciences',
      'Anthropology'
    )
  )
  assert.ok(
    !shouldDeprioritiseCareCourseForHss(
      'Public Sector Applications',
      'Humanities & Social Sciences',
      'Anthropology'
    )
  )
  console.log('  ✓ Humanities Leadership: practical routes, natural titles, no care-course priority')
}

// Psychology / Education regulated vs practical
{
  const psychCtx = {
    userStageKey: 'graduate',
    userStageLabel: 'Graduate Entry',
    academicRouteSelected: false,
    yearsExperience: 0,
    hasActiveRegistration: false,
    isUkQualification: true,
    roleOnSelectedStage: true,
    fieldName: 'Psychology',
    fieldSlug: 'psychology',
    specialismName: 'Psychology',
  }
  const clinical = classifyRoleSafety(
    evaluated('Clinical Psychologist'),
    baseRole({
      name: 'Clinical Psychologist',
      is_regulated_or_restricted: true,
      professional_registration_requirement: 'required',
    }),
    { id: 'cp', stage_model_id: 'm', stage_key: 'clinical', label: 'Clinical', active: true },
    psychCtx
  )
  assert.equal(clinical.match_type, 'needs_review_regulated')

  const support = classifyRoleSafety(
    evaluated('Mental Health Support Worker'),
    baseRole({ name: 'Mental Health Support Worker', professional_registration_requirement: 'none' }),
    { id: 'sw', stage_model_id: 'm', stage_key: 'graduate', label: 'Graduate Entry', active: true },
    psychCtx
  )
  assert.ok(
    support.match_type === 'best_immediate_route' || support.match_type === 'developing_match'
  )
  console.log('  ✓ Psychology: clinical regulated, support practical')
}

// Education graduate: TA practical, QTS future/regulated
{
  const eduCtx = {
    userStageKey: 'graduate',
    userStageLabel: 'Graduate Entry',
    academicRouteSelected: false,
    yearsExperience: 0,
    hasActiveRegistration: false,
    isUkQualification: true,
    roleOnSelectedStage: true,
    fieldName: 'Education',
    fieldSlug: 'education',
    specialismName: 'Primary Education',
  }
  const ta = classifyRoleSafety(
    evaluated('Teaching Assistant'),
    baseRole({ name: 'Teaching Assistant', professional_registration_requirement: 'none' }),
    { id: 'ta2', stage_model_id: 'm', stage_key: 'graduate', label: 'Graduate Entry', active: true },
    eduCtx
  )
  assert.equal(ta.match_type, 'best_immediate_route')
  const sen = classifyRoleSafety(
    evaluated('SEN Support Assistant'),
    baseRole({ name: 'SEN Support Assistant', professional_registration_requirement: 'none' }),
    { id: 'sen', stage_model_id: 'm', stage_key: 'graduate', label: 'Graduate Entry', active: true },
    eduCtx
  )
  assert.ok(sen.match_type === 'best_immediate_route' || sen.match_type === 'developing_match')
  const teacher = classifyRoleSafety(
    evaluated('Qualified Teacher'),
    baseRole({
      name: 'Qualified Teacher',
      professional_registration_requirement: 'QTS required',
      is_regulated_or_restricted: true,
    }),
    { id: 'qt', stage_model_id: 'm', stage_key: 'qualified_teacher', label: 'Qualified Teacher', active: true },
    { ...eduCtx, roleOnSelectedStage: false }
  )
  assert.equal(teacher.match_type, 'needs_review_regulated')
  console.log('  ✓ Education graduate: TA/SEN practical, QTS regulated')
}

// Soft vs hard registration warning language
{
  const soft = friendlyRewrite('This route may need professional registration', {
    fieldFamily: 'non_regulated_practical',
  })
  assert.ok(!/professional registration/i.test(soft))
  const hard = friendlyRewrite('Professional registration required or commonly expected', {
    fieldFamily: 'regulated_sensitive',
  })
  assert.match(hard, /Professional registration may be required/i)
  console.log('  ✓ Registration warning language is field-family aware')
}

// Public card polish: dedupe + immediate demotion
{
  const deduped = dedupePublicLines([
    'Some employers may ask for qualification evidence.',
    'Some employers may ask for qualification evidence.',
    'Further study may be needed for academic progression.',
  ])
  assert.equal(deduped.length, 2)

  const polished = polishPublicRoleCopy({
    matchType: 'future_career_option',
    why: [
      'More relevant experience is typically needed',
      'Further study may be needed for academic progression.',
      'Your specialism matches',
    ],
    requirements: [
      'More relevant experience is typically needed',
      'Some employers may ask for qualification evidence.',
    ],
  })
  assert.ok(polished.why.includes(FUTURE_ROUTE_SOFT_LINE))
  assert.equal(polished.requirements.length, 0)
  assert.ok(!polished.why.filter((l) => l !== FUTURE_ROUTE_SOFT_LINE).some((l) => /more relevant experience/i.test(l)))

  assert.ok(
    ['developing_match', 'future_career_option'].includes(
      demoteImmediateMatchType({
        matchType: 'best_immediate_route',
        title: 'Research Assistant',
        requirementLines: ['More relevant experience is typically needed (2+ years)'],
      })
    ),
    'Experience-gated roles must leave Best Immediate'
  )
  assert.equal(
    demoteImmediateMatchType({
      matchType: 'best_immediate_route',
      title: 'Programme Lead (Anthropology)',
      fieldName: 'Humanities & Social Sciences',
      specialismName: 'Anthropology',
      yearsExperience: 0,
    }),
    'future_career_option'
  )
  assert.equal(
    demoteImmediateMatchType({
      matchType: 'best_immediate_route',
      title: 'Social Research Assistant',
      fieldName: 'Humanities & Social Sciences',
      specialismName: 'Anthropology',
      yearsExperience: 0,
      whyLines: ['Your specialism matches'],
    }),
    'best_immediate_route'
  )
  assert.equal(
    demoteImmediateMatchType({
      matchType: 'best_immediate_route',
      title: 'Anthropology Researcher / Researcher',
      fieldName: 'Humanities & Social Sciences',
      specialismName: 'Anthropology',
      yearsExperience: 0,
    }),
    'future_career_option'
  )
  console.log('  ✓ Public card polish: dedupe, future soft line, immediate demotion')
}

console.log('\nAll global match-safety tests passed.\n')
