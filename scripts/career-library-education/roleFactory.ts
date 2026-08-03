/**
 * Role factory for Education & Teaching — unique UK titles per specialism.
 */

import { r, type EduStageKey, type SpecialismPack, type RoleSeed } from './shared'

export type RouteProfile =
  | 'school_phase' // primary, secondary, early years
  | 'subject_teaching' // maths, science, PE, etc.
  | 'sen_support'
  | 'fe_adult'
  | 'higher_education'
  | 'ed_psych'
  | 'leadership_management'
  | 'curriculum_training'
  | 'learning_support'
  | 'academic'

export type SpecDef = {
  slug: string
  label: string
  short: string
  professionalBody: string
  relatedBodies: string[]
  sources: string[]
  profile: RouteProfile
  /** QTS typically required for school teaching roles */
  qtsRequired?: boolean
  /** EYTS for early years */
  eytsRoute?: boolean
  /** QTLS / FE focus */
  feRoute?: boolean
  /** HCPC for educational psychologists */
  hcpcRequired?: boolean
  mastersUseful?: boolean
  includeExecutive?: boolean
}

function note(detail: string) {
  return `${detail} Distinct from Business management, Healthcare clinical roles, Psychology (non-education), and general HR.`
}

export function buildRoles(def: SpecDef): RoleSeed[] {
  const S = def.short
  const roles: RoleSeed[] = []
  let p = 10

  const add = (
    name: string,
    stage: EduStageKey,
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

  const qtsReg: Parameters<typeof r>[3]['professionalRegistrationRequirement'] =
    def.qtsRequired ? 'required' : 'commonly_expected'

  switch (def.profile) {
    case 'school_phase': {
      add(
        `${S} Teaching Assistant`,
        'foundation_education_support',
        `Supports ${S.toLowerCase()} classrooms with learning activities, behaviour routines and pupil support.`,
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('TA role — degree not required; not a qualified teacher.'),
        }
      )
      add(
        `${S} Cover Supervisor`,
        'foundation_education_support',
        `Supervises classes for short-term cover in ${S.toLowerCase()} settings under school policies.`,
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Cover supervision — not QTS teaching.'),
        }
      )
      add(
        `${S} PGCE / ITT Trainee`,
        'graduate_teacher_entry',
        `Initial teacher training trainee (e.g. PGCE/School Direct) preparing for ${S.toLowerCase()} teaching.`,
        {
          academicRequirement: 'degree_relevant',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          experienceRequirementLabel: def.eytsRoute
            ? 'EYTS / early years ITT pathway — not yet fully qualified'
            : 'ITT toward QTS — not yet a qualified teacher',
          eligibilityNote: note(
            def.eytsRoute
              ? 'Early years ITT/EYTS pathway — degree alone does not confer EYTS.'
              : 'ITT/PGCE pathway — QTS not automatic from degree alone.'
          ),
        }
      )
      add(
        `${S} Teacher`,
        'qualified_teacher_practitioner',
        `Qualified teacher delivering ${S.toLowerCase()} curriculum and pastoral duties.`,
        {
          professionalRegistrationRequirement: def.eytsRoute ? 'required' : qtsReg,
          isRegulatedOrRestricted: true,
          academicRequirement: 'accredited_degree_preferred',
          experienceRequirementLabel: def.eytsRoute
            ? 'EYTS (or QTS with early years remit) typically required'
            : 'QTS typically required for maintained school teaching',
          eligibilityNote: note(
            def.eytsRoute
              ? `${S} teacher — EYTS/QTS as applicable; not automatic from Master\'s.`
              : `${S} teacher — QTS typically required (TRA); ECT induction applies.`
          ),
        }
      )
      add(
        `Experienced ${S} Teacher`,
        'experienced_teacher',
        `Post-induction ${S.toLowerCase()} teacher with substantial classroom ownership.`,
        {
          professionalRegistrationRequirement: def.eytsRoute ? 'required' : qtsReg,
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Experienced teacher — classroom PQE, not Master\'s alone.'),
        }
      )
      add(
        `${S} Lead Practitioner`,
        'senior_teacher_specialist',
        `Lead practitioner improving ${S.toLowerCase()} teaching quality and mentoring colleagues.`,
        {
          professionalRegistrationRequirement: qtsReg,
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Lead practitioner — experience-led specialist role.'),
        }
      )
      add(
        `${S} Head of Year / Phase`,
        'leadership_middle_senior',
        `Middle leadership of a year group or phase within ${S.toLowerCase()}.`,
        {
          professionalRegistrationRequirement: qtsReg,
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('Middle leadership — future progression.'),
        }
      )
      add(
        `Assistant Headteacher (${S})`,
        'leadership_middle_senior',
        `Assistant head with ${S.toLowerCase()} curriculum or pastoral portfolio.`,
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('Assistant head — substantial leadership experience.'),
        }
      )
      add(
        `Deputy Headteacher (${S})`,
        'leadership_middle_senior',
        `Deputy head supporting whole-school leadership with ${S.toLowerCase()} expertise.`,
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('Deputy head — future progression.'),
        }
      )
      if (def.includeExecutive !== false) {
        add(
          `Headteacher (${S} setting)`,
          'executive_leadership',
          `Headteacher of a ${S.toLowerCase()} school or equivalent setting.`,
          {
            professionalRegistrationRequirement: 'required',
            isRegulatedOrRestricted: true,
            fitClassification: 'future_progression',
            eligibilityNote: note('Headteacher — future progression; NPQH may help some routes.'),
          }
        )
      }
      break
    }

    case 'subject_teaching': {
      add(
        `${S} Teaching Assistant`,
        'foundation_education_support',
        `Supports ${S.toLowerCase()} lessons, resources and pupil interventions.`,
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note(`${S} TA — not a qualified subject teacher.`),
        }
      )
      add(
        `${S} ITT Trainee Teacher`,
        'graduate_teacher_entry',
        `Trainee teacher on an ITT/PGCE route specialising in ${S.toLowerCase()}.`,
        {
          academicRequirement: 'degree_relevant',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note(`${S} ITT — subject degree often expected; QTS still required to qualify.`),
        }
      )
      add(
        `${S} Teacher`,
        'qualified_teacher_practitioner',
        `QTS teacher delivering ${S.toLowerCase()} across relevant key stages.`,
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          eligibilityNote: note(`${S} teacher — QTS typically required.`),
        }
      )
      add(
        `Experienced ${S} Teacher`,
        'experienced_teacher',
        `Experienced ${S.toLowerCase()} teacher owning schemes of work and outcomes.`,
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Experienced subject teacher — not Master\'s alone.'),
        }
      )
      add(
        `${S} Subject Lead / Coordinator`,
        'senior_teacher_specialist',
        `Leads ${S.toLowerCase()} curriculum quality, assessment and staff development.`,
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'accredited_degree_preferred',
          eligibilityNote: note(
            `${S} subject lead — experience-led; Master\'s may help some secondary/FE routes.`
          ),
        }
      )
      add(
        `Head of ${S}`,
        'leadership_middle_senior',
        `Head of department for ${S.toLowerCase()}.`,
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note(`Head of ${S} — future progression.`),
        }
      )
      add(
        `Assistant Headteacher (${S} curriculum)`,
        'leadership_middle_senior',
        `Assistant head with a ${S.toLowerCase()} or wider curriculum portfolio.`,
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('AHT curriculum — future progression.'),
        }
      )
      break
    }

    case 'sen_support': {
      add(
        'SEN Teaching Assistant',
        'foundation_education_support',
        'Supports pupils with special educational needs in class and interventions.',
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('SEN TA — vocational/experience entry; not SENCO.'),
        }
      )
      add(
        'Learning Support Assistant (SEN)',
        'foundation_education_support',
        'Delivers 1:1 and small-group support aligned to EHC plans and school SEN policy.',
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('LSA (SEN) — not a qualified teacher.'),
        }
      )
      add(
        'SEN Trainee Teacher',
        'graduate_teacher_entry',
        'ITT trainee developing inclusive practice with a SEN focus.',
        {
          academicRequirement: 'degree_relevant',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('SEN ITT pathway — QTS still required for qualified teacher status.'),
        }
      )
      add(
        'SEN Teacher',
        'qualified_teacher_practitioner',
        'Qualified teacher specialising in special educational needs provision.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          eligibilityNote: note('SEN teacher — QTS typically required.'),
        }
      )
      add(
        'Experienced SEN Teacher',
        'experienced_teacher',
        'Experienced SEN teacher leading complex caseloads and interventions.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Experienced SEN teacher — PQE required.'),
        }
      )
      add(
        'SENCO',
        'senior_teacher_specialist',
        'Special Educational Needs Coordinator leading SEN strategy, EHC liaison and staff guidance.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          academicRequirement: 'masters_relevant',
          experienceRequirementLabel:
            'QTS plus National Award for SEN Coordination (or equivalent) commonly expected',
          eligibilityNote: note(
            'SENCO — QTS + NASENCO commonly expected; Master\'s-level award often required, not automatic headship.'
          ),
        }
      )
      add(
        'SEN Lead Practitioner',
        'senior_teacher_specialist',
        'Lead practitioner for inclusive teaching and SEN pedagogy across a school.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          eligibilityNote: note('SEN lead practitioner — experience-led.'),
        }
      )
      add(
        'Assistant Headteacher (Inclusion / SEN)',
        'leadership_middle_senior',
        'Assistant head with inclusion/SEN strategic portfolio.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('AHT inclusion — future progression.'),
        }
      )
      break
    }

    case 'fe_adult': {
      add(
        `${S} Learning Support Assistant`,
        'foundation_education_support',
        `Supports learners in ${S.toLowerCase()} sessions and workshops.`,
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('FE/adult support — degree not required.'),
        }
      )
      add(
        `${S} Trainee Lecturer / Tutor`,
        'graduate_teacher_entry',
        `Trainee tutor/lecturer on an FE/adult education training pathway (e.g. toward QTLS).`,
        {
          academicRequirement: 'degree_relevant',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('FE trainee — QTLS/ETF pathways common; not school QTS by default.'),
        }
      )
      add(
        `${S} Lecturer / Tutor`,
        'qualified_teacher_practitioner',
        `Delivers ${S.toLowerCase()} teaching in college or adult learning settings.`,
        {
          professionalRegistrationRequirement: 'commonly_expected',
          isRegulatedOrRestricted: false,
          academicRequirement: 'degree_relevant',
          experienceRequirementLabel:
            'Subject expertise plus teaching qualification (e.g. Cert Ed / PGCE FE / QTLS) commonly expected',
          eligibilityNote: note(
            `${S} FE/adult tutor — QTLS commonly expected; QTS not always required.`
          ),
        }
      )
      add(
        `Experienced ${S} Lecturer`,
        'experienced_teacher',
        `Experienced ${S.toLowerCase()} lecturer owning curriculum delivery and learner outcomes.`,
        {
          professionalRegistrationRequirement: 'commonly_expected',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Experienced FE lecturer — experience-led.'),
        }
      )
      add(
        `${S} Advanced Practitioner`,
        'senior_teacher_specialist',
        `Advanced practitioner improving ${S.toLowerCase()} teaching and learning quality.`,
        {
          professionalRegistrationRequirement: 'commonly_expected',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Advanced practitioner — FE quality role.'),
        }
      )
      add(
        `Curriculum Leader (${S})`,
        'leadership_middle_senior',
        `Leads ${S.toLowerCase()} curriculum area within a college or adult learning service.`,
        {
          fitClassification: 'future_progression',
          professionalRegistrationRequirement: 'desirable',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Curriculum leader — future progression.'),
        }
      )
      add(
        `Head of ${S}`,
        'leadership_middle_senior',
        `Heads the ${S.toLowerCase()} department or service.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(`Head of ${S} — future progression.`),
        }
      )
      if (def.includeExecutive !== false) {
        add(
          `Principal / College Leader (${S} pathway)`,
          'executive_leadership',
          `College principal or executive education leader typically reached via senior ${S.toLowerCase()} leadership.`,
          {
            fitClassification: 'future_progression',
            eligibilityNote: note('Principal — future progression only.'),
          }
        )
      }
      break
    }

    case 'higher_education': {
      add(
        'Higher Education Administrator',
        'foundation_education_support',
        'Supports HE teaching operations, timetabling liaison and student-facing admin.',
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('HE admin — not an academic teaching post.'),
        }
      )
      add(
        'Graduate Teaching Assistant (HE)',
        'graduate_teacher_entry',
        'Graduate/PG student supporting seminars, marking and labs under academic supervision.',
        {
          academicRequirement: 'masters_relevant',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('GTA — often postgraduate; not a permanent lecturer.'),
        }
      )
      add(
        'Teaching Fellow',
        'qualified_teacher_practitioner',
        'HE teaching fellow delivering undergraduate/postgraduate teaching.',
        {
          academicRequirement: 'masters_relevant',
          professionalRegistrationRequirement: 'desirable',
          professionalMembershipRequirement: 'desirable',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Teaching fellow — Advance HE fellowship desirable; QTS not required.'),
        }
      )
      add(
        'Lecturer in Education / Subject Pedagogy',
        'experienced_teacher',
        'University lecturer teaching education or subject pedagogy programmes.',
        {
          academicRequirement: 'phd_relevant',
          isAcademicRole: true,
          professionalRegistrationRequirement: 'desirable',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('HE lecturer — PhD commonly expected; Master\'s alone not automatic.'),
        }
      )
      add(
        'Senior Lecturer (Higher Education)',
        'senior_teacher_specialist',
        'Senior lecturer with established HE teaching and scholarship.',
        {
          academicRequirement: 'phd_relevant',
          isAcademicRole: true,
          isRegulatedOrRestricted: false,
          professionalRegistrationRequirement: 'desirable',
          eligibilityNote: note('Senior lecturer — PhD and experience.'),
        }
      )
      add(
        'Programme Leader (HE Education)',
        'leadership_middle_senior',
        'Leads an HE education programme (e.g. PGCE/BA Education).',
        {
          academicRequirement: 'phd_relevant',
          fitClassification: 'future_progression',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Programme leader — future progression.'),
        }
      )
      add(
        'Head of School / Department (Education)',
        'executive_leadership',
        'Heads an education school or department in a university.',
        {
          academicRequirement: 'phd_relevant',
          fitClassification: 'future_progression',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('HE head of school — future progression.'),
        }
      )
      add(
        'Professor of Education',
        'academic_research',
        'Professorial leadership in education teaching and research.',
        {
          academicRequirement: 'phd_relevant',
          isAcademicRole: true,
          isResearchRole: true,
          fitClassification: 'future_progression',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Professor — PhD required; future progression.'),
        }
      )
      break
    }

    case 'ed_psych': {
      add(
        'Educational Psychology Assistant',
        'foundation_education_support',
        'Supports educational psychology services with admin and observation logistics.',
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Assistant — not an HCPC-registered psychologist.'),
        }
      )
      add(
        'Assistant Educational Psychologist',
        'graduate_teacher_entry',
        'Graduate assistant supporting EP casework under supervision (pre-doctorate).',
        {
          academicRequirement: 'degree_relevant',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note(
            'Assistant EP — psychology degree common; doctorate + HCPC still required to practise as EP.'
          ),
        }
      )
      add(
        'Trainee Educational Psychologist',
        'graduate_teacher_entry',
        'Doctoral trainee educational psychologist on an accredited training route.',
        {
          academicRequirement: 'phd_relevant',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Trainee EP — doctorate in progress; not yet fully registered.'),
        }
      )
      add(
        'Educational Psychologist',
        'qualified_teacher_practitioner',
        'HCPC-registered educational psychologist assessing and advising on learning and development needs.',
        {
          academicRequirement: 'phd_relevant',
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          experienceRequirementLabel:
            'Doctorate in educational psychology and HCPC registration required',
          eligibilityNote: note(
            'Educational Psychologist — HCPC registration required; not a classroom teacher QTS role.'
          ),
        }
      )
      add(
        'Senior Educational Psychologist',
        'experienced_teacher',
        'Senior EP with complex caseloads and service development responsibilities.',
        {
          academicRequirement: 'phd_relevant',
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          minimumExperienceYears: 3,
          eligibilityNote: note('Senior EP — HCPC + substantial experience.'),
        }
      )
      add(
        'Principal Educational Psychologist',
        'senior_teacher_specialist',
        'Principal EP leading specialist strands of an EP service.',
        {
          academicRequirement: 'phd_relevant',
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('Principal EP — future progression.'),
        }
      )
      add(
        'Head of Educational Psychology Service',
        'executive_leadership',
        'Heads a local authority or trust educational psychology service.',
        {
          academicRequirement: 'phd_relevant',
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('Head of EP service — future progression only.'),
        }
      )
      break
    }

    case 'leadership_management': {
      add(
        'Education Administration Assistant',
        'foundation_education_support',
        'Supports school/college office, admissions and education management processes.',
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Education admin — not Business Operations Manager roles.'),
        }
      )
      add(
        'Graduate Leadership Trainee (Education)',
        'graduate_teacher_entry',
        'Graduate on an education leadership development pathway (often alongside QTS progression).',
        {
          academicRequirement: 'degree_relevant',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Leadership trainee — not headteacher by default.'),
        }
      )
      add(
        'Middle Leader (Education)',
        'qualified_teacher_practitioner',
        'First middle leadership post coordinating a team, year or subject area.',
        {
          professionalRegistrationRequirement: 'commonly_expected',
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Middle leader — QTS commonly expected in schools.'),
        }
      )
      add(
        'Experienced Middle Leader',
        'experienced_teacher',
        'Experienced middle leader with sustained accountability for outcomes and staff.',
        {
          professionalRegistrationRequirement: 'commonly_expected',
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Experienced middle leader — not Master\'s alone.'),
        }
      )
      add(
        'Senior Leader (Education)',
        'senior_teacher_specialist',
        'Senior leadership team member with whole-school/college portfolio ownership.',
        {
          professionalRegistrationRequirement: 'commonly_expected',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('SLT — future progression.'),
        }
      )
      add(
        'Assistant Headteacher',
        'leadership_middle_senior',
        'Assistant headteacher with a defined whole-school strategic portfolio.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('Assistant headteacher — future progression.'),
        }
      )
      add(
        'Deputy Headteacher',
        'leadership_middle_senior',
        'Deputy headteacher supporting the headteacher across school leadership.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('Deputy headteacher — future progression.'),
        }
      )
      add(
        'Headteacher',
        'executive_leadership',
        'Headteacher with overall responsibility for a school.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('Headteacher — future progression; NPQH may help.'),
        }
      )
      add(
        'Executive Headteacher',
        'executive_leadership',
        'Executive headteacher leading more than one school or a federation.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('Executive head — future progression only.'),
        }
      )
      add(
        'Principal',
        'executive_leadership',
        'Principal of an academy, free school or college.',
        {
          professionalRegistrationRequirement: 'commonly_expected',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('Principal — future progression only.'),
        }
      )
      break
    }

    case 'curriculum_training': {
      add(
        `${S} Administrator`,
        'foundation_education_support',
        `Supports ${S.toLowerCase()} programmes with scheduling, materials and participant admin.`,
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note(`${S} admin support.`),
        }
      )
      add(
        `${S} Officer`,
        'graduate_teacher_entry',
        `Graduate officer supporting ${S.toLowerCase()} design, delivery logistics or ITT coordination.`,
        {
          academicRequirement: 'degree_relevant',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note(`${S} officer — not automatic QTS.`),
        }
      )
      add(
        `${S} Specialist`,
        'qualified_teacher_practitioner',
        `Specialist delivering ${S.toLowerCase()} projects, coaching or programme content.`,
        {
          professionalRegistrationRequirement: 'commonly_expected',
          isRegulatedOrRestricted: false,
          academicRequirement: 'degree_relevant',
          eligibilityNote: note(
            `${S} specialist — teaching qualification commonly expected for school-facing work.`
          ),
        }
      )
      add(
        `Senior ${S} Adviser`,
        'experienced_teacher',
        `Advises schools/colleges on ${S.toLowerCase()} quality and implementation.`,
        {
          professionalRegistrationRequirement: 'commonly_expected',
          isRegulatedOrRestricted: false,
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'degree_relevant',
          eligibilityNote: note(`Senior ${S} adviser — experience-led; Master\'s may help.`),
        }
      )
      add(
        `${S} Lead`,
        'senior_teacher_specialist',
        `Leads ${S.toLowerCase()} strategy across a trust, local authority or provider.`,
        {
          fitClassification: 'future_progression',
          professionalRegistrationRequirement: 'desirable',
          isRegulatedOrRestricted: false,
          eligibilityNote: note(`${S} lead — future progression.`),
        }
      )
      add(
        `Head of ${S}`,
        'leadership_middle_senior',
        `Heads ${S.toLowerCase()} for an organisation or multi-academy trust.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(`Head of ${S} — future progression.`),
        }
      )
      add(
        `Director of ${S}`,
        'executive_leadership',
        `Director-level leadership of ${S.toLowerCase()} across a trust or system.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(`Director of ${S} — future progression only.`),
        }
      )
      break
    }

    case 'learning_support': {
      add(
        'Learning Support Assistant',
        'foundation_education_support',
        'Supports learning in class, interventions and access arrangements.',
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('LSA — degree not required.'),
        }
      )
      add(
        'Higher Level Teaching Assistant',
        'foundation_education_support',
        'HLTA delivering specified teaching cover and higher-level support under teacher direction.',
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          experienceRequirementLabel: 'HLTA status / equivalent experience commonly expected',
          eligibilityNote: note('HLTA — not QTS; distinct from qualified teacher.'),
        }
      )
      add(
        'Graduate Learning Mentor',
        'graduate_teacher_entry',
        'Graduate mentor supporting attendance, behaviour for learning and study skills.',
        {
          academicRequirement: 'degree_relevant',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Learning mentor — not a qualified teacher.'),
        }
      )
      add(
        'Learning Support Coordinator',
        'qualified_teacher_practitioner',
        'Coordinates learning support deployment, interventions and impact tracking.',
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'desirable',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Coordinator — QTS desirable in some schools, not always required.'),
        }
      )
      add(
        'Senior Learning Support Practitioner',
        'experienced_teacher',
        'Senior practitioner leading complex support caseloads and mentoring LSAs.',
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Senior learning support — experience-led.'),
        }
      )
      add(
        'Inclusion Support Lead',
        'senior_teacher_specialist',
        'Leads whole-school learning support and inclusion practice (non-SENCO where distinct).',
        {
          professionalRegistrationRequirement: 'desirable',
          isRegulatedOrRestricted: false,
          fitClassification: 'future_progression',
          eligibilityNote: note('Inclusion support lead — distinct from SENCO title where separate.'),
        }
      )
      add(
        'Assistant Headteacher (Learning Support)',
        'leadership_middle_senior',
        'Assistant head with learning support / inclusion operational portfolio.',
        {
          professionalRegistrationRequirement: 'commonly_expected',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('AHT learning support — future progression.'),
        }
      )
      break
    }

    case 'academic': {
      add(
        `Research Assistant (${S})`,
        'academic_research',
        `Supports research projects in ${S.toLowerCase()}.`,
        {
          academicRequirement: 'masters_relevant',
          isResearchRole: true,
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Research assistant — Master\'s common.'),
        }
      )
      add(
        `Doctoral Researcher (${S})`,
        'academic_research',
        `Undertakes doctoral research in ${S.toLowerCase()}.`,
        {
          academicRequirement: 'phd_relevant',
          isResearchRole: true,
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('PhD track — not automatic leadership seniority.'),
        }
      )
      add(
        `Research Fellow (${S})`,
        'academic_research',
        `Research fellow advancing scholarship in ${S.toLowerCase()}.`,
        {
          academicRequirement: 'phd_relevant',
          isResearchRole: true,
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Research fellow — PhD typically required.'),
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
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Academic lecturer — PhD typically required.'),
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
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Senior academic — PhD and experience.'),
        }
      )
      add(
        `Professor of ${S}`,
        'academic_research',
        `Professorial leadership in ${S.toLowerCase()}.`,
        {
          academicRequirement: 'phd_relevant',
          isAcademicRole: true,
          isResearchRole: true,
          fitClassification: 'future_progression',
          minimumExperienceYears: 10,
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Professor — future progression; PhD required.'),
        }
      )
      break
    }
  }

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
