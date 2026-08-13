/**
 * Work in My Education — deterministic sanity audit for launch readiness.
 * Checks role classification + course suggestion quality for sample personas.
 * No DB / OpenAI — safe to run in unit tests and admin scripts.
 */

import { classifyRoleSafety } from './classify-role'
import { polishWieRoleTitle, isLeadOrSeniorTitle } from './role-title-polish'
import { shouldDeprioritiseCareCourseForRoute } from './course-field-gates'
import { suggestCourseTypesForWieRoute } from '../course-alignment/suggested-course-types'
import { findCatalogPacksForFieldName } from '../course-alignment/gap-course-catalog'
import { softRequirementWarning, classifyWieFieldFamily } from './field-families'
import { blockerToFriendly } from './friendly-copy'
import type { KnowledgeRoleRow, KnowledgeStageRow, RoleEligibilityResult } from '../types'
import type { SafetyMatchType } from './classify-role'

export type WieSanityPersona = {
  id: string
  label: string
  fieldName: string
  fieldSlug?: string
  specialismName: string
  stageKey: string
  stageLabel: string
  yearsExperience?: number
  sampleRoles: Array<{
    name: string
    stageKey: string
    stageLabel: string
    onSelectedStage?: boolean
    registration?: string
    regulated?: boolean
    academic?: boolean
    research?: boolean
    minYears?: number
    expect: SafetyMatchType | SafetyMatchType[]
  }>
  expectCourseIncludes?: string[]
  expectCourseExcludes?: string[]
  expectNoProfessionalRegistrationWarning?: boolean
}

export type WieSanityFinding = {
  personaId: string
  ok: boolean
  message: string
}

function baseRole(
  partial: Partial<KnowledgeRoleRow> & { name: string }
): KnowledgeRoleRow {
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
    professional_registration_requirement:
      partial.professional_registration_requirement ?? 'none',
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

function evaluated(title: string, field: string, specialism: string): RoleEligibilityResult {
  return {
    role_id: 'r1',
    role_title: title,
    field: { id: 'f', name: field, slug: 'field' },
    specialism: { id: 's', name: specialism, slug: 'spec' },
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

function expectMatch(
  actual: SafetyMatchType,
  expect: SafetyMatchType | SafetyMatchType[]
): boolean {
  return Array.isArray(expect) ? expect.includes(actual) : actual === expect
}

export const WIE_SANITY_PERSONAS: WieSanityPersona[] = [
  {
    id: 'hss-anthropology-leadership',
    label: 'Anthropology / Humanities & Social Sciences / Leadership',
    fieldName: 'Humanities & Social Sciences',
    fieldSlug: 'humanities-social-sciences',
    specialismName: 'Anthropology',
    stageKey: 'leadership',
    stageLabel: 'Leadership',
    yearsExperience: 0,
    sampleRoles: [
      {
        name: 'Anthropology Graduate Research Assistant',
        stageKey: 'graduate_social_sciences_entry',
        stageLabel: 'Graduate Entry',
        expect: 'best_immediate_route',
      },
      {
        name: 'Programme Lead (Anthropology)',
        stageKey: 'leadership',
        stageLabel: 'Leadership',
        onSelectedStage: true,
        minYears: 5,
        expect: 'future_career_option',
      },
      {
        name: 'Doctoral Researcher (Anthropology)',
        stageKey: 'academic_research',
        stageLabel: 'Academic / Research',
        research: true,
        academic: true,
        expect: ['future_career_option', 'not_recommended_now'],
      },
    ],
    expectCourseIncludes: [
      'Public Sector Applications',
      'Charity / NGO Administration',
      'Project Coordination',
      'Data Analysis for Social Research',
    ],
    expectCourseExcludes: [
      'Counselling Skills',
      'Mental Health Awareness',
      'Support Worker Bridge',
    ],
    expectNoProfessionalRegistrationWarning: true,
  },
  {
    id: 'civil-graduate',
    label: 'Civil Engineering / Graduate',
    fieldName: 'Engineering',
    specialismName: 'Civil Engineering',
    stageKey: 'graduate_engineer',
    stageLabel: 'Graduate Engineer',
    yearsExperience: 0,
    sampleRoles: [
      {
        name: 'Graduate Civil Engineer',
        stageKey: 'graduate_engineer',
        stageLabel: 'Graduate Engineer',
        onSelectedStage: true,
        expect: 'best_immediate_route',
      },
      {
        name: 'Assistant Civil Engineer',
        stageKey: 'graduate_engineer',
        stageLabel: 'Graduate Engineer',
        onSelectedStage: true,
        expect: 'best_immediate_route',
      },
      {
        name: 'Chartered Civil Engineer',
        stageKey: 'chartered_professional_engineer',
        stageLabel: 'Chartered / Professional Engineer',
        regulated: true,
        registration: 'required',
        expect: 'needs_review_regulated',
      },
    ],
    expectCourseIncludes: ['AutoCAD', 'Revit', 'BIM Fundamentals', 'Engineering Portfolio / Project Evidence'],
    expectCourseExcludes: ['SIA', 'Food Hygiene', 'Forklift'],
    expectNoProfessionalRegistrationWarning: true,
  },
  {
    id: 'accounting-graduate',
    label: 'Accounting / Graduate Entry',
    fieldName: 'Accounting, Finance & Banking',
    specialismName: 'Financial Accounting',
    stageKey: 'graduate',
    stageLabel: 'Graduate / Entry',
    yearsExperience: 0,
    sampleRoles: [
      {
        name: 'Accounts Assistant',
        stageKey: 'graduate',
        stageLabel: 'Graduate / Entry',
        onSelectedStage: true,
        expect: 'best_immediate_route',
      },
      {
        name: 'Chartered Accountant',
        stageKey: 'chartered',
        stageLabel: 'Chartered',
        regulated: true,
        registration: 'ACCA/CIMA',
        expect: 'needs_review_regulated',
      },
    ],
    expectCourseIncludes: ['Excel', 'AAT', 'Bookkeeping', 'Xero', 'QuickBooks', 'Payroll'],
    expectCourseExcludes: ['SIA', 'Forklift', 'Food Hygiene'],
  },
  {
    id: 'it-software',
    label: 'Software / IT',
    fieldName: 'IT & Technology',
    specialismName: 'Software Development',
    stageKey: 'junior',
    stageLabel: 'Junior / Entry',
    yearsExperience: 0,
    sampleRoles: [
      {
        name: 'IT Support Technician',
        stageKey: 'junior',
        stageLabel: 'Junior / Entry',
        onSelectedStage: true,
        expect: 'best_immediate_route',
      },
      {
        name: 'Senior Software Architect',
        stageKey: 'senior',
        stageLabel: 'Senior Specialist',
        minYears: 7,
        expect: 'future_career_option',
      },
    ],
    expectCourseIncludes: ['GitHub', 'CompTIA', 'Cloud', 'SQL', 'Portfolio'],
    expectCourseExcludes: ['SIA', 'CSCS', 'Care Certificate', 'Forklift'],
  },
  {
    id: 'education-graduate',
    label: 'Teaching / Education / Graduate',
    fieldName: 'Education & Teaching',
    specialismName: 'Primary Education',
    stageKey: 'graduate',
    stageLabel: 'Graduate Entry',
    yearsExperience: 0,
    sampleRoles: [
      {
        name: 'Teaching Assistant',
        stageKey: 'graduate',
        stageLabel: 'Graduate Entry',
        onSelectedStage: true,
        expect: 'best_immediate_route',
      },
      {
        name: 'Qualified Teacher',
        stageKey: 'qualified_teacher',
        stageLabel: 'Qualified Teacher',
        regulated: true,
        registration: 'QTS required',
        expect: 'needs_review_regulated',
      },
    ],
    expectCourseIncludes: ['Teaching Assistant', 'SEN', 'Safeguarding Children'],
    expectCourseExcludes: ['SIA', 'Forklift'],
  },
  {
    id: 'healthcare-support',
    label: 'Healthcare / Care-related',
    fieldName: 'Healthcare & Medicine',
    specialismName: 'Adult Care',
    stageKey: 'foundation',
    stageLabel: 'Foundation / Support',
    yearsExperience: 0,
    sampleRoles: [
      {
        name: 'Care Assistant',
        stageKey: 'foundation',
        stageLabel: 'Foundation / Support',
        onSelectedStage: true,
        expect: 'best_immediate_route',
      },
      {
        name: 'Registered Nurse',
        stageKey: 'registered',
        stageLabel: 'Registered Practitioner',
        regulated: true,
        registration: 'required',
        expect: 'needs_review_regulated',
      },
    ],
    expectCourseIncludes: ['Care Certificate', 'Safeguarding'],
    expectCourseExcludes: ['SIA', 'Forklift', 'AutoCAD'],
  },
]

function courseTitlesFor(fieldName: string, specialismName: string): string[] {
  const typed = suggestCourseTypesForWieRoute({ fieldName, specialismName, limit: 12 }).map(
    (s) => s.title
  )
  const pack = findCatalogPacksForFieldName(fieldName, specialismName).flatMap((p) =>
    p.courses.map((c) => c.title)
  )
  return [...typed, ...pack]
}

/**
 * Run deterministic sanity checks for all (or selected) personas.
 */
export function runWieSanityAudit(personaIds?: string[]): {
  findings: WieSanityFinding[]
  passed: number
  failed: number
  personasChecked: number
} {
  const personas = personaIds?.length
    ? WIE_SANITY_PERSONAS.filter((p) => personaIds.includes(p.id))
    : WIE_SANITY_PERSONAS

  const findings: WieSanityFinding[] = []

  for (const persona of personas) {
    const family = classifyWieFieldFamily(
      persona.fieldName,
      persona.fieldSlug,
      persona.specialismName
    )

    if (persona.expectNoProfessionalRegistrationWarning) {
      const soft = blockerToFriendly(
        { kind: 'professional', code: 'blocker.professional', label: 'x' },
        family
      )
      const ok =
        family === 'regulated_sensitive'
          ? /professional registration/i.test(soft)
          : !/professional registration/i.test(soft) ||
            soft === softRequirementWarning('employer')
      findings.push({
        personaId: persona.id,
        ok:
          family !== 'regulated_sensitive'
            ? !/professional registration required/i.test(soft)
            : ok,
        message: `Registration warning language for family=${family}: "${soft}"`,
      })
    }

    for (const sample of persona.sampleRoles) {
      const stage: KnowledgeStageRow = {
        id: 'st',
        stage_model_id: 'm',
        stage_key: sample.stageKey,
        label: sample.stageLabel,
        active: true,
      }
      const role = baseRole({
        name: sample.name,
        professional_registration_requirement: sample.registration ?? 'none',
        is_regulated_or_restricted: Boolean(sample.regulated),
        is_research_role: Boolean(sample.research),
        is_academic_role: Boolean(sample.academic),
        minimum_experience_years: sample.minYears ?? 0,
      })
      const safety = classifyRoleSafety(
        evaluated(sample.name, persona.fieldName, persona.specialismName),
        role,
        stage,
        {
          userStageKey: persona.stageKey,
          userStageLabel: persona.stageLabel,
          academicRouteSelected: /academic|research/i.test(persona.stageLabel),
          yearsExperience: persona.yearsExperience ?? 0,
          hasActiveRegistration: false,
          isUkQualification: true,
          roleOnSelectedStage: Boolean(sample.onSelectedStage),
          fieldName: persona.fieldName,
          fieldSlug: persona.fieldSlug,
          specialismName: persona.specialismName,
        }
      )
      const ok = expectMatch(safety.match_type, sample.expect)
      findings.push({
        personaId: persona.id,
        ok,
        message: ok
          ? `Role "${sample.name}" → ${safety.match_type}`
          : `Role "${sample.name}" → ${safety.match_type}, expected ${JSON.stringify(sample.expect)}`,
      })

      // Lead titles with 0 experience should never be immediate
      if (
        (persona.yearsExperience ?? 0) < 2 &&
        isLeadOrSeniorTitle(sample.name) &&
        safety.match_type === 'best_immediate_route'
      ) {
        findings.push({
          personaId: persona.id,
          ok: false,
          message: `Lead/senior title "${sample.name}" incorrectly marked immediate with low experience`,
        })
      }

      const polished = polishWieRoleTitle(
        sample.name,
        persona.fieldName,
        persona.specialismName,
        persona.fieldSlug
      )
      findings.push({
        personaId: persona.id,
        ok: polished.length > 0,
        message: `Title polish: "${sample.name}" → "${polished}"`,
      })
    }

    const courses = courseTitlesFor(persona.fieldName, persona.specialismName)
    const blob = courses.join(' | ')

    for (const need of persona.expectCourseIncludes ?? []) {
      const ok = new RegExp(need.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i').test(blob)
      findings.push({
        personaId: persona.id,
        ok,
        message: ok
          ? `Course includes "${need}"`
          : `Missing expected course pattern "${need}" in suggestions/catalog`,
      })
    }
    for (const bad of persona.expectCourseExcludes ?? []) {
      const hit = courses.some((t) => new RegExp(`\\b${bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(t))
      // Also check care-course gate for care-like titles on non-care routes
      const gated = shouldDeprioritiseCareCourseForRoute(
        bad,
        persona.fieldName,
        persona.specialismName,
        persona.fieldSlug
      )
      const ok = !hit || gated
      findings.push({
        personaId: persona.id,
        ok: !hit,
        message: !hit
          ? `Course excludes "${bad}"`
          : `Unwanted course "${bad}" still present in suggestions/catalog`,
      })
      void gated
      void ok
    }
  }

  const passed = findings.filter((f) => f.ok).length
  const failed = findings.filter((f) => !f.ok).length
  return { findings, passed, failed, personasChecked: personas.length }
}

export function formatWieSanityAuditMarkdown(result: ReturnType<typeof runWieSanityAudit>): string {
  const lines = [
    '# Work in My Education — Sanity Audit',
    '',
    `Personas checked: **${result.personasChecked}**`,
    `Passed: **${result.passed}** · Failed: **${result.failed}**`,
    '',
    '## Findings',
  ]
  for (const f of result.findings) {
    lines.push(`- ${f.ok ? '✓' : '✗'} [${f.personaId}] ${f.message}`)
  }
  return lines.join('\n')
}
