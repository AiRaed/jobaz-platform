/**
 * Role factory helpers for AFB packs — produces unique titles per specialism.
 */

import { r, type AfbStageKey, type SpecialismPack, type RoleSeed } from './shared'

export type RouteProfile =
  | 'accounting_professional'
  | 'technician_heavy'
  | 'tax'
  | 'audit'
  | 'payroll_credit'
  | 'banking_retail'
  | 'banking_markets'
  | 'corporate_finance'
  | 'investment'
  | 'insurance'
  | 'regulated_advice'
  | 'risk_compliance'
  | 'quantitative'
  | 'academic'

export type SpecDef = {
  slug: string
  label: string
  short: string // used in titles for uniqueness, e.g. "Financial Accounting"
  professionalBody: string
  relatedBodies: string[]
  sources: string[]
  profile: RouteProfile
  /** Override which stages get roles; default depends on profile */
  includeRegulated?: boolean
  includeAcademic?: boolean
  mastersRelevantPractitioner?: boolean
  phdTrack?: boolean
}

function note(spec: string, detail: string) {
  return `${detail} Distinct from neighbouring AFB specialisms and from Business & Management, IT, Law, Economics and HR.`
}

export function buildRoles(def: SpecDef): RoleSeed[] {
  const S = def.short
  const roles: RoleSeed[] = []
  let p = 10

  const add = (
    name: string,
    stage: AfbStageKey,
    description: string,
    opts: Partial<Parameters<typeof r>[3]> & { eligibilityNote: string; priority?: number }
  ) => {
    roles.push(
      r(name, stage, description, {
        priority: opts.priority ?? p,
        ...opts,
      })
    )
    p += 10
  }

  switch (def.profile) {
    case 'technician_heavy': {
      add(
        `${S} Assistant`,
        'foundation_finance_support',
        `Supports ${S.toLowerCase()} processes including data entry, document control and basic reconciliations.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Foundation support — degree not required.'),
        }
      )
      add(
        `${S} Administrator`,
        'foundation_finance_support',
        `Administers day-to-day ${S.toLowerCase()} workflows, filing and process checklists under supervision.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'College/vocational administrator route.'),
        }
      )
      add(
        `${S} Apprentice`,
        'apprentice_technician',
        `Apprenticeship learning ${S.toLowerCase()} standards, systems and supervised practical tasks.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'desirable',
          eligibilityNote: note(S, 'Apprenticeship/technician pathway — not a fully qualified chartered route.'),
        }
      )
      add(
        `${S} Technician`,
        'apprentice_technician',
        `Technician-level ${S.toLowerCase()} work such as AAT-style accounts preparation or specialist technician duties.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(
            S,
            'Technician competence; not equivalent to ACA/ACCA/CIMA fully qualified status.'
          ),
        }
      )
      add(
        `${S} Graduate Trainee`,
        'graduate_trainee',
        `Graduate trainee rotating through ${S.toLowerCase()} teams on a structured training scheme.`,
        {
          eligibilityNote: note(S, 'Graduate scheme entry; exams/experience still needed for qualification.'),
        }
      )
      add(
        `${S} Officer`,
        'qualified_practitioner',
        `Delivers competent ${S.toLowerCase()} work to deadlines with limited supervision.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Practitioner officer — qualification desirable depending on employer.'),
        }
      )
      add(
        `Senior ${S} Specialist`,
        'experienced_specialist',
        `Experienced specialist handling complex ${S.toLowerCase()} cases and mentoring juniors.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Experience-led specialist; not automatic from degree alone.'),
        }
      )
      add(
        `${S} Team Leader`,
        'senior_manager',
        `Leads a ${S.toLowerCase()} team, allocates work and owns service quality.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Team leadership requires substantial experience.'),
        }
      )
      add(
        `${S} Manager`,
        'senior_manager',
        `Manages ${S.toLowerCase()} delivery, KPIs and stakeholder relationships.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Managerial accountability — not entry-level.'),
        }
      )
      add(
        `Head of ${S}`,
        'head_director',
        `Heads the ${S.toLowerCase()} function, setting standards and reporting to finance leadership.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(S, 'Head of function — future progression unless already senior.'),
        }
      )
      break
    }

    case 'accounting_professional': {
      add(
        `${S} Assistant`,
        'foundation_finance_support',
        `Supports ${S.toLowerCase()} with postings, schedules and month-end checklists.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Non-degree entry support role.'),
        }
      )
      add(
        `${S} Apprentice`,
        'apprentice_technician',
        `Accounting apprenticeship focused on ${S.toLowerCase()} with supervised practice.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'desirable',
          eligibilityNote: note(S, 'Apprentice route; distinct from fully qualified chartered accountant.'),
        }
      )
      add(
        `Trainee ${S} Accountant`,
        'graduate_trainee',
        `Trainee on a professional training contract covering ${S.toLowerCase()} and related exams.`,
        {
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(
            S,
            'Training contract / graduate trainee — degree helps schemes but does not equal qualification.'
          ),
        }
      )
      add(
        `${S} Accountant`,
        'qualified_practitioner',
        `Qualified or equivalent competent accountant delivering ${S.toLowerCase()} outputs.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'commonly_expected',
          experienceRequirementLabel:
            'Professional exams and practical experience typically required; accounting degree alone is not sufficient',
          eligibilityNote: note(
            S,
            'Qualified practitioner — not marked qualified solely for holding an accounting degree.'
          ),
        }
      )
      add(
        `Senior ${S} Accountant`,
        'experienced_specialist',
        `Senior accountant owning complex ${S.toLowerCase()} areas and reviewing junior work.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Post-qualification experience expected.'),
        }
      )
      add(
        `${S} Manager`,
        'senior_manager',
        `Manages ${S.toLowerCase()} workstreams, clients or reporting cycles.`,
        {
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Management requires substantial post-qualification experience.'),
        }
      )
      add(
        `${S} Senior Manager`,
        'senior_manager',
        `Senior manager accountable for major ${S.toLowerCase()} portfolios and quality.`,
        {
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Senior management — future progression for newly qualified.'),
        }
      )
      add(
        `Head of ${S}`,
        'head_director',
        `Heads ${S.toLowerCase()} for an organisation or practice service line.`,
        {
          fitClassification: 'future_progression',
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Head/director level — future progression.'),
        }
      )
      add(
        `${S} Director`,
        'head_director',
        `Director-level leadership of ${S.toLowerCase()} strategy and delivery.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(S, 'Director role — not automatic from Master\'s or MBA.'),
        }
      )
      add(
        `${S} Partner`,
        'executive_partner',
        `Equity/salaried partner owning ${S.toLowerCase()} service line profitability and clients.`,
        {
          fitClassification: 'future_progression',
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Partner — future progression only.'),
        }
      )
      break
    }

    case 'tax': {
      add(
        `${S} Assistant`,
        'foundation_finance_support',
        `Supports ${S.toLowerCase()} filings, document gathering and client data checks.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Non-degree tax support.'),
        }
      )
      add(
        `${S} Technician`,
        'apprentice_technician',
        `Tax technician preparing returns and computations under ATT/AAT-style pathways.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Technician pathway (e.g. ATT) — distinct from CTA fully qualified.'),
        }
      )
      add(
        `Graduate ${S} Adviser Trainee`,
        'graduate_trainee',
        `Graduate trainee building ${S.toLowerCase()} technical skills on a professional scheme.`,
        {
          eligibilityNote: note(S, 'Graduate tax trainee — exams still required for CTA/equivalent.'),
        }
      )
      add(
        `${S} Adviser`,
        'qualified_practitioner',
        `Advises clients or the business on ${S.toLowerCase()} compliance and planning.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Qualified/competent tax adviser — not degree-only.'),
        }
      )
      add(
        `Senior ${S} Adviser`,
        'experienced_specialist',
        `Handles complex ${S.toLowerCase()} matters and reviews junior advice.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Experienced specialist tax adviser.'),
        }
      )
      add(
        `${S} Manager`,
        'senior_manager',
        `Manages ${S.toLowerCase()} portfolios, deadlines and team delivery.`,
        {
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Tax manager — substantial experience required.'),
        }
      )
      add(
        `Head of ${S}`,
        'head_director',
        `Leads the ${S.toLowerCase()} function or practice team.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(S, 'Head of tax specialism — future progression.'),
        }
      )
      add(
        `${S} Partner`,
        'executive_partner',
        `Partner accountable for ${S.toLowerCase()} clients, quality and growth.`,
        {
          fitClassification: 'future_progression',
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Tax partner — future progression only.'),
        }
      )
      break
    }

    case 'audit': {
      add(
        `${S} Assistant`,
        'foundation_finance_support',
        `Supports ${S.toLowerCase()} engagements with working papers and evidence gathering.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Audit support — degree not required.'),
        }
      )
      add(
        `${S} Apprentice`,
        'apprentice_technician',
        `Apprenticeship into ${S.toLowerCase()} with supervised fieldwork.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Audit apprentice route.'),
        }
      )
      add(
        `Graduate ${S} Trainee`,
        'graduate_trainee',
        `Graduate auditor/assurance trainee on ${S.toLowerCase()} assignments.`,
        {
          eligibilityNote: note(S, 'Graduate audit trainee — professional exams typically follow.'),
        }
      )
      add(
        `${S} Practitioner`,
        'qualified_practitioner',
        `Delivers ${S.toLowerCase()} testing, conclusions and reporting as a competent practitioner.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Qualified/competent auditor — not degree-only.'),
        }
      )
      add(
        `Senior ${S} Specialist`,
        'experienced_specialist',
        `Leads complex ${S.toLowerCase()} areas and coaches engagement teams.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Experienced audit/assurance specialist.'),
        }
      )
      add(
        `${S} Manager`,
        'senior_manager',
        `Manages ${S.toLowerCase()} engagements, budgets and review points.`,
        {
          professionalMembershipRequirement: 'commonly_expected',
          minimumExperienceYears: 5,
          eligibilityNote: note(S, 'Audit manager requires substantial experience.'),
        }
      )
      add(
        `Head of ${S}`,
        'head_director',
        `Heads ${S.toLowerCase()} for a firm or in-house assurance function.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(S, 'Head of audit/assurance — future progression.'),
        }
      )
      add(
        `${S} Partner`,
        'executive_partner',
        `Partner signing or owning ${S.toLowerCase()} service quality and client relationships.`,
        {
          fitClassification: 'future_progression',
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Audit/assurance partner — future progression only.'),
        }
      )
      break
    }

    case 'payroll_credit': {
      add(
        `${S} Assistant`,
        'foundation_finance_support',
        `Assists with ${S.toLowerCase()} processing, queries and basic reconciliations.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'School-leaver/college entry — degree not required. Not HR policy roles.'),
        }
      )
      add(
        `${S} Apprentice`,
        'apprentice_technician',
        `Apprenticeship covering ${S.toLowerCase()} systems and compliance routines.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Apprentice/technician pathway.'),
        }
      )
      add(
        `${S} Technician`,
        'apprentice_technician',
        `Technician delivering accurate ${S.toLowerCase()} cycles and exception handling.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'desirable',
          eligibilityNote: note(S, 'Technician competence; distinct from qualified accountant pathways.'),
        }
      )
      add(
        `${S} Officer`,
        'qualified_practitioner',
        `Owns end-to-end ${S.toLowerCase()} processing and stakeholder query resolution.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Competent practitioner officer.'),
        }
      )
      add(
        `Senior ${S} Specialist`,
        'experienced_specialist',
        `Resolves complex ${S.toLowerCase()} issues and improves controls.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Experienced specialist — not HR reward strategy.'),
        }
      )
      add(
        `${S} Manager`,
        'senior_manager',
        `Manages the ${S.toLowerCase()} team, SLAs and audit readiness.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Payroll/credit manager may remain in AFB; HR policy stays in HR.'),
        }
      )
      add(
        `Head of ${S}`,
        'head_director',
        `Heads ${S.toLowerCase()} operations and continuous improvement.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(S, 'Head of function — future progression.'),
        }
      )
      break
    }

    case 'banking_retail': {
      add(
        `${S} Assistant`,
        'foundation_finance_support',
        `Supports ${S.toLowerCase()} customer and processing tasks under supervision.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Banking support — not software engineering.'),
        }
      )
      add(
        `${S} Apprentice`,
        'apprentice_technician',
        `Banking apprenticeship covering ${S.toLowerCase()} products and operations.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'desirable',
          eligibilityNote: note(S, 'Banking apprentice — LIBF/CBI pathways commonly useful.'),
        }
      )
      add(
        `${S} Graduate Trainee`,
        'graduate_trainee',
        `Graduate trainee on a ${S.toLowerCase()} banking scheme.`,
        {
          eligibilityNote: note(S, 'Graduate banking trainee.'),
        }
      )
      add(
        `${S} Officer`,
        'qualified_practitioner',
        `Delivers ${S.toLowerCase()} banking services within mandates and conduct rules.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'desirable',
          eligibilityNote: note(S, 'Banking officer — customer/operations focus, not IT.'),
        }
      )
      add(
        `Senior ${S} Specialist`,
        'experienced_specialist',
        `Experienced ${S.toLowerCase()} banker handling complex clients or credit cases.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Experienced banking specialist.'),
        }
      )
      add(
        `${S} Manager`,
        'senior_manager',
        `Manages ${S.toLowerCase()} teams, portfolios or branch/segment performance.`,
        {
          eligibilityNote: note(S, 'Banking manager — experience required.'),
        }
      )
      add(
        `Head of ${S}`,
        'head_director',
        `Heads ${S.toLowerCase()} for a bank or major segment.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(S, 'Head of banking segment — future progression.'),
        }
      )
      add(
        `${S} Director`,
        'head_director',
        `Director accountable for ${S.toLowerCase()} strategy and risk appetite alignment.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(S, 'Banking director — not automatic from MBA.'),
        }
      )
      break
    }

    case 'banking_markets': {
      add(
        `${S} Operations Assistant`,
        'foundation_finance_support',
        `Supports ${S.toLowerCase()} operations, confirmations and data checks.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Markets operations support — not trading authority.'),
        }
      )
      add(
        `${S} Operations Apprentice`,
        'apprentice_technician',
        `Apprenticeship in ${S.toLowerCase()} operations and control processes.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Operations apprentice pathway.'),
        }
      )
      add(
        `${S} Graduate Analyst`,
        'graduate_trainee',
        `Graduate analyst supporting ${S.toLowerCase()} analysis and deal processes.`,
        {
          academicRequirement: 'degree_relevant',
          eligibilityNote: note(S, 'Graduate markets analyst — not regulated advice.'),
        }
      )
      add(
        `${S} Analyst`,
        'qualified_practitioner',
        `Analyst delivering ${S.toLowerCase()} research, credit or transaction support.`,
        {
          academicRequirement: 'degree_relevant',
          professionalMembershipRequirement: 'desirable',
          eligibilityNote: note(S, 'Practitioner analyst — operational/advisory support, not automatic regulated advice.'),
        }
      )
      add(
        `Senior ${S} Analyst`,
        'experienced_specialist',
        `Senior analyst owning complex ${S.toLowerCase()} work and mentoring juniors.`,
        {
          academicRequirement: def.mastersRelevantPractitioner ? 'masters_relevant' : 'degree_relevant',
          eligibilityNote: note(S, 'Experienced markets specialist; Master\'s may help some desks.'),
        }
      )
      add(
        `${S} Associate`,
        'experienced_specialist',
        `Associate-level ${S.toLowerCase()} professional executing deals or coverage work.`,
        {
          academicRequirement: 'degree_relevant',
          eligibilityNote: note(S, 'Associate — experience and competence, not MBA alone.'),
        }
      )
      add(
        `${S} Manager`,
        'senior_manager',
        `Manages ${S.toLowerCase()} delivery, risk limits liaison and junior staff.`,
        {
          eligibilityNote: note(S, 'Markets manager — substantial experience.'),
        }
      )
      add(
        `${S} Director`,
        'head_director',
        `Director covering ${S.toLowerCase()} clients, products or risk ownership.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(S, 'Director — future progression.'),
        }
      )
      add(
        `${S} Managing Director`,
        'executive_partner',
        `Managing Director accountable for ${S.toLowerCase()} franchise performance.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(S, 'MD/executive — future progression only.'),
        }
      )
      break
    }

    case 'corporate_finance': {
      add(
        `${S} Assistant`,
        'foundation_finance_support',
        `Supports ${S.toLowerCase()} reporting packs, data gathering and process checklists.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Finance support — degree not required.'),
        }
      )
      add(
        `${S} Apprentice`,
        'apprentice_technician',
        `Finance apprenticeship focused on ${S.toLowerCase()} processes.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Apprentice finance pathway.'),
        }
      )
      add(
        `${S} Graduate Analyst`,
        'graduate_trainee',
        `Graduate analyst on a ${S.toLowerCase()} training scheme.`,
        {
          eligibilityNote: note(S, 'Graduate FP&A/finance trainee.'),
        }
      )
      add(
        `${S} Analyst`,
        'qualified_practitioner',
        `Delivers ${S.toLowerCase()} analysis, forecasts or control activities.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'desirable',
          eligibilityNote: note(S, 'Finance analyst — CIMA/ACCA often desirable, not always mandatory.'),
        }
      )
      add(
        `Senior ${S} Analyst`,
        'experienced_specialist',
        `Senior analyst leading complex ${S.toLowerCase()} workstreams.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Experienced finance specialist.'),
        }
      )
      add(
        `${S} Manager`,
        'senior_manager',
        `Manages ${S.toLowerCase()} cycles, stakeholders and team output.`,
        {
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Finance manager — substantial experience required.'),
        }
      )
      add(
        `Head of ${S}`,
        'head_director',
        `Heads the ${S.toLowerCase()} function.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(S, 'Head of finance specialism — future progression.'),
        }
      )
      add(
        `Finance Director (${S})`,
        'head_director',
        `Finance Director with accountability spanning ${S.toLowerCase()} and related controls.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(S, 'FD-level — future progression; not automatic from MBA.'),
        }
      )
      add(
        `Chief Financial Officer (${S} pathway)`,
        'executive_partner',
        `CFO-level leadership typically reached via senior ${S.toLowerCase()} and broader finance leadership.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(S, 'CFO — future progression only.'),
        }
      )
      break
    }

    case 'investment': {
      add(
        `${S} Operations Assistant`,
        'foundation_finance_support',
        `Supports ${S.toLowerCase()} operations, reconciliations and data integrity.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Investment operations support — not regulated advice.'),
        }
      )
      add(
        `${S} Operations Apprentice`,
        'apprentice_technician',
        `Apprenticeship in ${S.toLowerCase()} operations and controls.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Ops apprentice — distinct from advisory licences.'),
        }
      )
      add(
        `${S} Graduate Analyst`,
        'graduate_trainee',
        `Graduate analyst joining ${S.toLowerCase()} research or investment support teams.`,
        {
          academicRequirement: 'degree_relevant',
          eligibilityNote: note(S, 'Graduate investment analyst pathway.'),
        }
      )
      add(
        `${S} Analyst`,
        'qualified_practitioner',
        `Analyst producing ${S.toLowerCase()} insights, portfolio analytics or investment support.`,
        {
          academicRequirement: 'degree_relevant',
          professionalMembershipRequirement: 'desirable',
          eligibilityNote: note(S, 'Investment analyst — CFA/CISI often desirable; not automatically a regulated adviser.'),
        }
      )
      add(
        `Senior ${S} Analyst`,
        'experienced_specialist',
        `Senior analyst covering complex ${S.toLowerCase()} mandates or sectors.`,
        {
          academicRequirement: def.mastersRelevantPractitioner ? 'masters_relevant' : 'degree_relevant',
          professionalMembershipRequirement: 'desirable',
          eligibilityNote: note(S, 'Experienced investment specialist; Master\'s may help some roles.'),
        }
      )
      add(
        `${S} Manager`,
        'senior_manager',
        `Manages ${S.toLowerCase()} teams, processes or portfolio support functions.`,
        {
          eligibilityNote: note(S, 'Investment operations/management — experience required.'),
        }
      )
      add(
        `${S} Director`,
        'head_director',
        `Director accountable for ${S.toLowerCase()} capability and outcomes.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(S, 'Investment director — future progression.'),
        }
      )
      if (def.includeRegulated) {
        add(
          `Regulated ${S} Adviser`,
          'regulated_adviser_controlled',
          `Provides FCA-regulated advice within ${S.toLowerCase()} permissions.`,
          {
            academicRequirement: 'none',
            professionalRegistrationRequirement: 'required',
            professionalMembershipRequirement: 'commonly_expected',
            isRegulatedOrRestricted: true,
            eligibilityNote: note(
              S,
              'Regulated advice — qualification and FCA authorisation required for regulated activity.'
            ),
          }
        )
      }
      add(
        `Chief Investment Officer (${S} pathway)`,
        'executive_partner',
        `CIO-level leadership typically reached via senior ${S.toLowerCase()} experience.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(S, 'CIO — future progression only.'),
        }
      )
      break
    }

    case 'insurance': {
      add(
        `${S} Assistant`,
        'foundation_finance_support',
        `Supports ${S.toLowerCase()} processing, documentation and customer updates.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Insurance support — degree not required.'),
        }
      )
      add(
        `${S} Apprentice`,
        'apprentice_technician',
        `Insurance apprenticeship covering ${S.toLowerCase()} standards and systems.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'desirable',
          eligibilityNote: note(S, 'CII apprenticeship/technician pathways commonly used.'),
        }
      )
      add(
        `${S} Graduate Trainee`,
        'graduate_trainee',
        `Graduate trainee on a ${S.toLowerCase()} insurance scheme.`,
        {
          eligibilityNote: note(S, 'Graduate insurance trainee.'),
        }
      )
      add(
        `${S} Practitioner`,
        'qualified_practitioner',
        `Delivers ${S.toLowerCase()} decisions or processing within underwriting/claims/ops mandates.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Insurance practitioner — CII qualifications commonly expected.'),
        }
      )
      add(
        `Senior ${S} Specialist`,
        'experienced_specialist',
        `Handles complex ${S.toLowerCase()} cases and mentors juniors.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(S, 'Experienced insurance specialist.'),
        }
      )
      add(
        `${S} Manager`,
        'senior_manager',
        `Manages ${S.toLowerCase()} teams, quality and performance.`,
        {
          eligibilityNote: note(S, 'Insurance manager — experience required.'),
        }
      )
      add(
        `Head of ${S}`,
        'head_director',
        `Heads the ${S.toLowerCase()} function.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(S, 'Head of insurance specialism — future progression.'),
        }
      )
      break
    }

    case 'regulated_advice': {
      add(
        `${S} Administrator`,
        'foundation_finance_support',
        `Administers client files, applications and scheduling for ${S.toLowerCase()} teams.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Admin support — not itself regulated advice.'),
        }
      )
      add(
        `${S} Support Technician`,
        'apprentice_technician',
        `Technical support preparing packs and data for ${S.toLowerCase()} processes.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Support technician — not authorised adviser.'),
        }
      )
      add(
        `${S} Trainee`,
        'graduate_trainee',
        `Trainee working towards ${S.toLowerCase()} qualifications under supervision.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'desirable',
          eligibilityNote: note(S, 'Trainee pathway toward regulated qualification.'),
        }
      )
      add(
        `${S} Paraplanner Support`,
        'qualified_practitioner',
        `Prepares research and suitability pack support for ${S.toLowerCase()} (non-adviser where applicable).`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'desirable',
          eligibilityNote: note(S, 'Technical support — distinguish from regulated adviser status.'),
        }
      )
      add(
        `${S} Adviser`,
        'regulated_adviser_controlled',
        `Provides FCA-regulated ${S.toLowerCase()} to retail clients within firm permissions.`,
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'required',
          professionalMembershipRequirement: 'commonly_expected',
          isRegulatedOrRestricted: true,
          experienceRequirementLabel:
            'Relevant Level 4+ qualification (e.g. Diploma/CeMAP pathways) and FCA authorisation for regulated activity',
          eligibilityNote: note(
            S,
            'Regulated adviser — qualification and FCA approval required for regulated activity.'
          ),
        }
      )
      add(
        `Senior ${S} Adviser`,
        'regulated_adviser_controlled',
        `Experienced regulated adviser handling complex ${S.toLowerCase()} cases.`,
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'required',
          professionalMembershipRequirement: 'commonly_expected',
          isRegulatedOrRestricted: true,
          minimumExperienceYears: 5,
          eligibilityNote: note(S, 'Senior regulated adviser — authorisation required.'),
        }
      )
      add(
        `${S} Advice Manager`,
        'senior_manager',
        `Manages adviser teams, advice quality and supervision frameworks.`,
        {
          professionalRegistrationRequirement: 'commonly_expected',
          isRegulatedOrRestricted: true,
          eligibilityNote: note(S, 'Advice management — supervisory competence and experience required.'),
        }
      )
      add(
        `Head of ${S}`,
        'head_director',
        `Heads ${S.toLowerCase()} proposition, compliance liaison and advice standards.`,
        {
          fitClassification: 'future_progression',
          isRegulatedOrRestricted: true,
          eligibilityNote: note(S, 'Head of advice — future progression.'),
        }
      )
      add(
        `${S} Compliance Oversight Lead`,
        'regulated_adviser_controlled',
        `Supports or holds controlled-function-style oversight of ${S.toLowerCase()} quality and conduct.`,
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note(
            S,
            'Controlled function / compliance oversight — regulatory approval where applicable.'
          ),
        }
      )
      break
    }

    case 'risk_compliance': {
      add(
        `${S} Assistant`,
        'foundation_finance_support',
        `Supports ${S.toLowerCase()} monitoring, logging and evidence packs.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Risk/compliance support — degree not required.'),
        }
      )
      add(
        `${S} Apprentice`,
        'apprentice_technician',
        `Apprenticeship into ${S.toLowerCase()} frameworks and controls.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Risk/compliance apprentice.'),
        }
      )
      add(
        `${S} Graduate Analyst`,
        'graduate_trainee',
        `Graduate analyst supporting ${S.toLowerCase()} reporting and testing.`,
        {
          eligibilityNote: note(S, 'Graduate risk/compliance trainee.'),
        }
      )
      add(
        `${S} Analyst`,
        'qualified_practitioner',
        `Analyses ${S.toLowerCase()} issues and maintains control/monitoring routines.`,
        {
          academicRequirement: 'none',
          professionalMembershipRequirement: 'desirable',
          eligibilityNote: note(S, 'Risk/compliance practitioner.'),
        }
      )
      add(
        `${S} Specialist`,
        'experienced_specialist',
        `Experienced specialist owning complex ${S.toLowerCase()} domains.`,
        {
          academicRequirement: def.mastersRelevantPractitioner ? 'masters_relevant' : 'none',
          professionalMembershipRequirement: 'desirable',
          eligibilityNote: note(S, 'Experienced specialist; Master\'s may help market/credit risk.'),
        }
      )
      add(
        `${S} Manager`,
        'senior_manager',
        `Manages ${S.toLowerCase()} programmes, KRIs and stakeholder reporting.`,
        {
          eligibilityNote: note(S, 'Risk/compliance manager — experience required.'),
        }
      )
      add(
        `Head of ${S}`,
        'head_director',
        `Heads ${S.toLowerCase()} for a financial institution or corporate.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(S, 'Head of risk/compliance — future progression.'),
        }
      )
      add(
        `Chief Risk Officer (${S} pathway)`,
        'executive_partner',
        `CRO-level leadership typically reached via senior ${S.toLowerCase()} and enterprise risk experience.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(S, 'CRO — future progression only.'),
        }
      )
      if (def.includeRegulated) {
        add(
          `${S} Controlled Function Officer`,
          'regulated_adviser_controlled',
          `Holds or supports FCA/PRA controlled function responsibilities related to ${S.toLowerCase()}.`,
          {
            professionalRegistrationRequirement: 'required',
            isRegulatedOrRestricted: true,
            fitClassification: 'future_progression',
            eligibilityNote: note(S, 'Controlled function — regulatory approval required.'),
          }
        )
      }
      break
    }

    case 'quantitative': {
      add(
        `${S} Data Assistant`,
        'foundation_finance_support',
        `Supports data gathering and basic checks for ${S.toLowerCase()} work.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(S, 'Support role — not a quant modeller.'),
        }
      )
      add(
        `${S} Graduate Analyst`,
        'graduate_trainee',
        `Graduate quantitative/finance analyst joining ${S.toLowerCase()} teams.`,
        {
          academicRequirement: 'degree_relevant',
          eligibilityNote: note(
            S,
            'Often expects strong maths/stats/programming; Master\'s may help but not always required at entry.'
          ),
        }
      )
      add(
        `${S} Analyst`,
        'qualified_practitioner',
        `Builds and maintains models/analyses for ${S.toLowerCase()}.`,
        {
          academicRequirement: def.mastersRelevantPractitioner ? 'masters_relevant' : 'degree_relevant',
          professionalMembershipRequirement: 'desirable',
          eligibilityNote: note(S, 'Quant/finance modelling practitioner.'),
        }
      )
      add(
        `Senior ${S} Specialist`,
        'experienced_specialist',
        `Senior specialist delivering advanced ${S.toLowerCase()} models and reviews.`,
        {
          academicRequirement: 'masters_relevant',
          eligibilityNote: note(S, 'Advanced quantitative specialist; postgraduate study commonly useful.'),
        }
      )
      add(
        `${S} Manager`,
        'senior_manager',
        `Manages ${S.toLowerCase()} modelling teams and model governance.`,
        {
          academicRequirement: 'masters_relevant',
          eligibilityNote: note(S, 'Quant team manager — experience plus technical depth.'),
        }
      )
      add(
        `Head of ${S}`,
        'head_director',
        `Heads ${S.toLowerCase()} capability.`,
        {
          fitClassification: 'future_progression',
          academicRequirement: 'masters_relevant',
          eligibilityNote: note(S, 'Head of quant/specialist finance — future progression.'),
        }
      )
      add(
        `${S} Doctoral Researcher`,
        'academic_research',
        `Doctoral research advancing methods relevant to ${S.toLowerCase()}.`,
        {
          academicRequirement: 'phd_relevant',
          isResearchRole: true,
          eligibilityNote: note(S, 'PhD research track for advanced quantitative methods.'),
        }
      )
      break
    }

    case 'academic': {
      add(
        `Research Assistant (${S})`,
        'academic_research',
        `Supports research projects in ${S.toLowerCase()} under academic supervision.`,
        {
          academicRequirement: 'masters_relevant',
          isResearchRole: true,
          fitClassification: 'academic_or_research',
          eligibilityNote: note(S, 'Research assistant — Master\'s common; PhD track often follows.'),
        }
      )
      add(
        `Doctoral Researcher (${S})`,
        'academic_research',
        `Undertakes doctoral research in ${S.toLowerCase()}.`,
        {
          academicRequirement: 'phd_relevant',
          isResearchRole: true,
          eligibilityNote: note(S, 'PhD required/in progress for doctoral researcher roles.'),
        }
      )
      add(
        `Research Associate (${S})`,
        'academic_research',
        `Postdoctoral or contract research associate in ${S.toLowerCase()}.`,
        {
          academicRequirement: 'phd_relevant',
          isResearchRole: true,
          eligibilityNote: note(S, 'PhD typically required.'),
        }
      )
      add(
        `Lecturer in ${S}`,
        'academic_research',
        `University lecturer teaching and researching ${S.toLowerCase()}.`,
        {
          academicRequirement: 'phd_relevant',
          isAcademicRole: true,
          isResearchRole: true,
          eligibilityNote: note(S, 'Academic teaching track — PhD typically required. Not general Economics lecturer.'),
        }
      )
      add(
        `Senior Lecturer in ${S}`,
        'academic_research',
        `Senior lecturer with established teaching and research in ${S.toLowerCase()}.`,
        {
          academicRequirement: 'phd_relevant',
          isAcademicRole: true,
          isResearchRole: true,
          minimumExperienceYears: 5,
          eligibilityNote: note(S, 'Senior academic — PhD and experience.'),
        }
      )
      add(
        `Professor of ${S}`,
        'academic_research',
        `Professorial leadership in ${S.toLowerCase()} research and teaching.`,
        {
          academicRequirement: 'phd_relevant',
          isAcademicRole: true,
          isResearchRole: true,
          fitClassification: 'future_progression',
          minimumExperienceYears: 10,
          eligibilityNote: note(S, 'Professor — future progression; PhD required.'),
        }
      )
      break
    }
  }

  // Ensure unique names within pack (defensive)
  const seen = new Set<string>()
  return roles.filter((role) => {
    const k = role.name.trim().toLowerCase()
    if (seen.has(k)) return false
    seen.add(k)
    return true
  })
}

export function buildPack(def: SpecDef, allSlugs: string[]): SpecialismPack {
  return {
    slug: def.slug,
    label: def.label,
    professionalBody: def.professionalBody,
    relatedBodies: def.relatedBodies,
    sources: def.sources,
    siblingSlugs: allSlugs.filter((s) => s !== def.slug),
    roles: buildRoles(def),
  }
}
