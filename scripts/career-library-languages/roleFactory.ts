/**
 * Role factory for Languages & Literature — unique UK titles per specialism.
 */

import { r, type LangStageKey, type SpecialismPack, type RoleSeed } from './shared'

export type RouteProfile =
  | 'english_studies'
  | 'creative_writing_literary'
  | 'linguistics'
  | 'translation_interpreting'
  | 'tesol_tefl'
  | 'modern_language'
  | 'classics_comparative'

export type SpecDef = {
  slug: string
  label: string
  short: string
  professionalBody: string
  relatedBodies: string[]
  sources: string[]
  profile: RouteProfile
  mastersUseful?: boolean
  practitionerNoun?: string
}

function note(detail: string) {
  return `${detail} Distinct from Arts creative-industry studio writing, Education QTS school teaching (unless TESOL/TEFL pathways), and incomplete Humanities field ownership.`
}

export function buildRoles(def: SpecDef): RoleSeed[] {
  const S = def.short
  const noun = def.practitionerNoun ?? 'Specialist'
  const roles: RoleSeed[] = []
  let p = 10

  const add = (
    name: string,
    stage: LangStageKey,
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

  const addAcademic = () => {
    add(
      `Doctoral Researcher (${S})`,
      'academic_research',
      `Undertakes doctoral research in ${S.toLowerCase()}.`,
      {
        academicRequirement: 'phd_relevant',
        isResearchRole: true,
        eligibilityNote: note(`PhD track in ${S} — academic/research, not automatic leadership seniority.`),
      }
    )
    add(
      `Research Fellow (${S})`,
      'academic_research',
      `Research fellow advancing scholarship in ${S.toLowerCase()}.`,
      {
        academicRequirement: 'phd_relevant',
        isResearchRole: true,
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
        eligibilityNote: note(`Lecturer in ${S} — PhD typically required.`),
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
        eligibilityNote: note('Professor — future progression; PhD required.'),
      }
    )
  }

  switch (def.profile) {
    case 'english_studies': {
      add(
        `${S} Library / Writing Centre Assistant`,
        'foundation_language_support',
        `Supports reading rooms, writing centres or English study skills sessions.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note('Support role — degree not required.'),
        }
      )
      add(
        `${S} Graduate Assistant`,
        'graduate_language_entry',
        `Graduate assistant supporting ${S.toLowerCase()} teaching, editing or literary programmes.`,
        {
          eligibilityNote: note(`Graduate ${S} entry — academic/literary pathway.`),
        }
      )
      add(
        `${S} Practitioner / Tutor`,
        'professional_linguist',
        `Delivers ${S.toLowerCase()} tutoring, editorial support or literary education programmes.`,
        {
          eligibilityNote: note(`Professional ${S} practitioner — not QTS school English teacher by default.`),
        }
      )
      add(
        `Experienced ${S} ${noun}`,
        'experienced_specialist',
        `Experienced specialist owning complex ${S.toLowerCase()} projects or teaching remits.`,
        {
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'degree_relevant',
          eligibilityNote: note(`Experienced ${S} specialist — Master’s may help; not automatic seniority.`),
        }
      )
      add(
        `Senior ${S} ${noun}`,
        'senior_specialist',
        `Senior specialist leading ${S.toLowerCase()} quality and mentoring juniors.`,
        {
          eligibilityNote: note(`Senior ${S} specialist.`),
        }
      )
      add(
        `${S} Programme Lead`,
        'leadership',
        `Leads ${S.toLowerCase()} programmes in HE, cultural or publishing-education settings.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} programme lead — future progression.`),
        }
      )
      add(
        `Head of ${S}`,
        'executive_director',
        `Heads ${S.toLowerCase()} provision for a department, centre or organisation.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(`Head of ${S} — future progression only.`),
        }
      )
      addAcademic()
      break
    }

    case 'creative_writing_literary': {
      add(
        'Literary Programme Support Assistant',
        'foundation_language_support',
        'Supports literary festivals, writing centre admin and workshop logistics.',
        {
          academicRequirement: 'none',
          eligibilityNote: note(
            'Literary programme support — distinct from Arts Creative Writing studio/industry titles.'
          ),
        }
      )
      add(
        'Graduate Literary Programme Assistant',
        'graduate_language_entry',
        'Graduate assistant supporting creative writing workshops, readings and literary education.',
        {
          eligibilityNote: note(
            'Graduate literary pathway — not Arts Junior Creative Writing Writer titles.'
          ),
        }
      )
      add(
        'Creative Writing Tutor (Literary Education)',
        'professional_linguist',
        'Tutors creative writing in adult education, HE outreach or community literary programmes.',
        {
          eligibilityNote: note(
            'Literary education tutor — distinct from commercial publishing Creative Writing Writer roles in Arts.'
          ),
        }
      )
      add(
        'Experienced Literary Writing Specialist',
        'experienced_specialist',
        'Experienced specialist designing literary writing courses and mentoring emerging writers in education settings.',
        {
          academicRequirement: 'masters_relevant',
          eligibilityNote: note(
            'Experienced literary specialist — Master’s common in creative writing HE; not automatic seniority.'
          ),
        }
      )
      add(
        'Senior Literary Writing Specialist',
        'senior_specialist',
        'Senior specialist leading literary writing curricula and staff development.',
        {
          academicRequirement: 'masters_relevant',
          eligibilityNote: note('Senior literary writing specialist.'),
        }
      )
      add(
        'Literary Writing Programme Lead',
        'leadership',
        'Leads creative writing / literary education programmes for a centre or faculty unit.',
        {
          fitClassification: 'future_progression',
          eligibilityNote: note('Literary programme lead — future progression.'),
        }
      )
      add(
        'Director of Literary Writing Programmes',
        'executive_director',
        'Directs literary writing programmes across an institution or cultural education body.',
        {
          fitClassification: 'future_progression',
          eligibilityNote: note('Director — future progression only.'),
        }
      )
      addAcademic()
      break
    }

    case 'linguistics': {
      add(
        `${S} Research Admin Assistant`,
        'foundation_language_support',
        `Supports ${S.toLowerCase()} labs, corpora projects and participant logistics.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note('Research admin — degree not required.'),
        }
      )
      add(
        `${S} Graduate Research Assistant`,
        'graduate_language_entry',
        `Graduate RA supporting ${S.toLowerCase()} data collection, annotation or analysis.`,
        {
          eligibilityNote: note(`Graduate ${S} research entry.`),
        }
      )
      add(
        `${S} Practitioner / Analyst`,
        'professional_linguist',
        `Applies ${S.toLowerCase()} methods in research units, edtech, speech tech support or language assessment.`,
        {
          eligibilityNote: note(`Professional ${S} practitioner.`),
        }
      )
      add(
        `Experienced ${S} Specialist`,
        'experienced_specialist',
        `Experienced specialist designing ${S.toLowerCase()} studies or applied language projects.`,
        {
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'degree_relevant',
          eligibilityNote: note(`Experienced ${S} — Master’s often useful.`),
        }
      )
      add(
        `Senior ${S} Specialist`,
        'senior_specialist',
        `Senior specialist leading complex ${S.toLowerCase()} workstreams and mentoring juniors.`,
        {
          eligibilityNote: note(`Senior ${S} specialist.`),
        }
      )
      add(
        `${S} Research Lead`,
        'leadership',
        `Leads ${S.toLowerCase()} research or applied linguistics teams.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} research lead — future progression.`),
        }
      )
      add(
        `Head of ${S}`,
        'executive_director',
        `Heads ${S.toLowerCase()} for a department, institute or language technology unit.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(`Head of ${S} — future progression only.`),
        }
      )
      addAcademic()
      break
    }

    case 'translation_interpreting': {
      add(
        `${S} Project Support Assistant`,
        'foundation_language_support',
        `Supports ${S.toLowerCase()} agencies with file prep, scheduling and client admin.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(`${S} support — degree not required.`),
        }
      )
      add(
        `${S} Graduate Trainee`,
        'graduate_language_entry',
        `Graduate trainee building ${S.toLowerCase()} competence under supervision.`,
        {
          eligibilityNote: note(
            `Graduate ${S} — CIOL/ITI pathways often follow; degree alone does not equal professional status.`
          ),
        }
      )
      add(
        `Professional ${S}`,
        'professional_linguist',
        `Practising ${S.toLowerCase()} professional delivering assignments to brief and quality standards.`,
        {
          professionalMembershipRequirement: 'desirable',
          eligibilityNote: note(
            `Professional ${S} — CIOL/ITI membership desirable; DipTrans/DPSI may apply for some routes.`
          ),
        }
      )
      add(
        `Experienced ${S}`,
        'experienced_specialist',
        `Experienced ${S.toLowerCase()} specialist handling complex, specialist or high-stakes assignments.`,
        {
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'degree_relevant',
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(`Experienced ${S} — Master’s common for conference/specialist routes.`),
        }
      )
      add(
        `Senior ${S}`,
        'senior_specialist',
        `Senior ${S.toLowerCase()} professional reviewing quality and mentoring juniors.`,
        {
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note(`Senior ${S}.`),
        }
      )
      add(
        `${S} Services Lead`,
        'leadership',
        `Leads ${S.toLowerCase()} teams, vendor management and quality frameworks.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} services lead — future progression.`),
        }
      )
      add(
        `Director of ${S} Services`,
        'executive_director',
        `Director accountable for ${S.toLowerCase()} service delivery and commercial outcomes.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(`Director of ${S} — future progression only.`),
        }
      )
      addAcademic()
      break
    }

    case 'tesol_tefl': {
      add(
        `${S} Language Centre Assistant`,
        'foundation_language_support',
        `Supports English language centres with enrolment, materials and classroom logistics.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note('Language centre support — degree not required.'),
        }
      )
      add(
        `${S} Trainee Teacher`,
        'graduate_language_entry',
        `Trainee English language teacher completing CELTA/CertTESOL or equivalent initial training.`,
        {
          academicRequirement: 'degree_relevant',
          experienceRequirementLabel:
            'CELTA, CertTESOL or equivalent initial ELT qualification commonly expected',
          eligibilityNote: note(
            `${S} trainee — CELTA/CertTESOL common; not UK QTS school teacher by default.`
          ),
        }
      )
      add(
        `${S} Teacher`,
        'professional_linguist',
        `Teaches English as a foreign/second language in language schools, HE pathways or overseas settings.`,
        {
          professionalMembershipRequirement: 'desirable',
          experienceRequirementLabel:
            'CELTA/CertTESOL (or equivalent) plus teaching practice; degree commonly expected',
          eligibilityNote: note(
            `${S} teacher — ELT qualification expected; distinct from Education QTS English teacher.`
          ),
        }
      )
      add(
        `Experienced ${S} Teacher`,
        'experienced_specialist',
        `Experienced ELT teacher owning advanced classes, exam prep and materials development.`,
        {
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'degree_relevant',
          eligibilityNote: note(
            `Experienced ${S} — DELTA/DipTESOL or Master’s may help senior ELT niches.`
          ),
        }
      )
      add(
        `Senior ${S} Teacher / Teacher Trainer`,
        'senior_specialist',
        `Senior ELT practitioner training teachers and leading academic quality.`,
        {
          academicRequirement: 'masters_relevant',
          eligibilityNote: note(`Senior ${S} / teacher trainer.`),
        }
      )
      add(
        `${S} Academic Manager`,
        'leadership',
        `Academic manager leading ELT teachers, timetables and quality assurance.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} academic manager — future progression.`),
        }
      )
      add(
        `Director of Studies (${S})`,
        'executive_director',
        `Director of Studies accountable for ELT academic leadership and compliance.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note('Director of Studies — future progression only.'),
        }
      )
      addAcademic()
      break
    }

    case 'modern_language': {
      add(
        `${S} Language Support Assistant`,
        'foundation_language_support',
        `Supports ${S.toLowerCase()} classes, conversation sessions and language centre logistics.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(`${S} support — degree not required.`),
        }
      )
      add(
        `${S} Graduate Language Assistant`,
        'graduate_language_entry',
        `Graduate language assistant (British Council / school / HE) for ${S.toLowerCase()}.`,
        {
          eligibilityNote: note(`Graduate ${S} language assistant pathway.`),
        }
      )
      add(
        `${S} Language Teacher / Tutor`,
        'professional_linguist',
        `Teaches or tutors ${S.toLowerCase()} in language schools, HE, adult education or corporate settings.`,
        {
          eligibilityNote: note(
            `${S} tutor — not automatic QTS secondary MFL teacher (Education field) unless separately qualified.`
          ),
        }
      )
      add(
        `Experienced ${S} Specialist`,
        'experienced_specialist',
        `Experienced ${S.toLowerCase()} specialist in teaching, cultural programming or language services.`,
        {
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'degree_relevant',
          eligibilityNote: note(`Experienced ${S} specialist.`),
        }
      )
      add(
        `Senior ${S} Specialist`,
        'senior_specialist',
        `Senior ${S.toLowerCase()} specialist mentoring juniors and owning complex remits.`,
        {
          eligibilityNote: note(`Senior ${S} specialist.`),
        }
      )
      add(
        `${S} Language Programme Lead`,
        'leadership',
        `Leads ${S.toLowerCase()} teaching or cultural language programmes.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} programme lead — future progression.`),
        }
      )
      add(
        `Head of ${S}`,
        'executive_director',
        `Heads ${S.toLowerCase()} provision in a language centre, department or cultural institute.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(`Head of ${S} — future progression only.`),
        }
      )
      addAcademic()
      break
    }

    case 'classics_comparative': {
      add(
        `${S} Collections / Programme Assistant`,
        'foundation_language_support',
        `Supports libraries, museums or literary programmes related to ${S.toLowerCase()}.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(`${S} support — degree not required.`),
        }
      )
      add(
        `${S} Graduate Assistant`,
        'graduate_language_entry',
        `Graduate assistant supporting ${S.toLowerCase()} teaching, research or public programmes.`,
        {
          eligibilityNote: note(`Graduate ${S} entry.`),
        }
      )
      add(
        `${S} Education / Research Officer`,
        'professional_linguist',
        `Delivers ${S.toLowerCase()} education, outreach or research-support programmes.`,
        {
          eligibilityNote: note(`Professional ${S} officer.`),
        }
      )
      add(
        `Experienced ${S} Specialist`,
        'experienced_specialist',
        `Experienced specialist owning complex ${S.toLowerCase()} projects and content.`,
        {
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'degree_relevant',
          eligibilityNote: note(`Experienced ${S} — Master’s common.`),
        }
      )
      add(
        `Senior ${S} Specialist`,
        'senior_specialist',
        `Senior specialist leading ${S.toLowerCase()} programmes and mentoring juniors.`,
        {
          eligibilityNote: note(`Senior ${S} specialist.`),
        }
      )
      add(
        `${S} Programme Lead`,
        'leadership',
        `Leads ${S.toLowerCase()} programmes in HE or cultural institutions.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} programme lead — future progression.`),
        }
      )
      add(
        `Head of ${S}`,
        'executive_director',
        `Heads ${S.toLowerCase()} for a department or institute.`,
        {
          fitClassification: 'future_progression',
          eligibilityNote: note(`Head of ${S} — future progression only.`),
        }
      )
      addAcademic()
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
