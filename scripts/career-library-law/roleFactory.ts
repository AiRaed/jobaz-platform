/**
 * Role factory for Law, Legal & Justice packs — unique UK titles per specialism.
 */

import { r, type LawStageKey, type SpecialismPack, type RoleSeed } from './shared'

export type RouteProfile =
  | 'legal_support'
  | 'solicitor_core'
  | 'barrister_core'
  | 'cilex_core'
  | 'practice_area'
  | 'court_justice'
  | 'academic'

export type SpecDef = {
  slug: string
  label: string
  short: string
  professionalBody: string
  relatedBodies: string[]
  sources: string[]
  profile: RouteProfile
  mastersUseful?: boolean
  includeJudicial?: boolean
  namedJudiciary?: boolean
  includeExecutive?: boolean
}

function note(detail: string) {
  return `${detail} Distinct from Business, Finance, Healthcare, Government policy (non-legal), and IT careers.`
}

export function buildRoles(def: SpecDef): RoleSeed[] {
  const S = def.short
  const roles: RoleSeed[] = []
  let p = 10

  const add = (
    name: string,
    stage: LawStageKey,
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
    case 'legal_support': {
      add(
        `${S} Assistant`,
        'foundation_legal_support',
        `Supports ${S.toLowerCase()} teams with filing, diary, document prep and basic case administration.`,
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Foundation legal support — degree not required; not a qualified lawyer.'),
        }
      )
      add(
        `${S} Administrator`,
        'foundation_legal_support',
        `Administers ${S.toLowerCase()} workflows, records and client/court correspondence under supervision.`,
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Legal administration — not solicitor/barrister practice.'),
        }
      )
      add(
        `${S} Secretary`,
        'foundation_legal_support',
        `Provides secretarial and typing support for ${S.toLowerCase()} practitioners.`,
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Legal secretary pathway — vocational entry.'),
        }
      )
      add(
        `Graduate ${S}`,
        'graduate_academic_entry',
        `Graduate-level ${S.toLowerCase()} supporting fee-earners with research packs and case prep.`,
        {
          academicRequirement: 'degree_relevant',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Graduate support — LLB helpful; does not confer practice rights.'),
        }
      )
      add(
        `Senior ${S}`,
        'experienced_lawyer',
        `Experienced ${S.toLowerCase()} owning complex support workflows and mentoring juniors.`,
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          minimumExperienceYears: 3,
          eligibilityNote: note('Senior support role — not equivalent to qualified solicitor status.'),
        }
      )
      add(
        `${S} Team Leader`,
        'partner_head',
        `Leads a ${S.toLowerCase()} support team and service standards.`,
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          fitClassification: 'future_progression',
          eligibilityNote: note('Support team leadership — not Partner solicitor.'),
        }
      )
      break
    }

    case 'solicitor_core': {
      add(
        'Legal Practice Assistant',
        'foundation_legal_support',
        'Supports solicitor practice with filing, client intake and matter administration.',
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Practice support — not admitted solicitor.'),
        }
      )
      add(
        'Trainee Solicitor',
        'graduate_academic_entry',
        'Training contract / SQE qualifying work experience under SRA-authorised firm supervision.',
        {
          academicRequirement: 'accredited_degree_preferred',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          experienceRequirementLabel:
            'Qualifying work experience / training contract; SQE pathway — not yet admitted',
          eligibilityNote: note(
            'Trainee solicitor — LLB/GDL/SQE preparation common; degree alone does not make a solicitor.'
          ),
        }
      )
      add(
        'Newly Qualified Solicitor',
        'qualified_legal_professional',
        'Recently admitted solicitor with SRA practising certificate handling supervised matters.',
        {
          professionalRegistrationRequirement: 'required',
          professionalMembershipRequirement: 'commonly_expected',
          isRegulatedOrRestricted: true,
          eligibilityNote: note(
            'Admitted solicitor — SRA regulation and practising certificate required.'
          ),
        }
      )
      add(
        'Solicitor',
        'qualified_legal_professional',
        'Practising solicitor advising and representing clients within reserved/legal activities permitted.',
        {
          professionalRegistrationRequirement: 'required',
          professionalMembershipRequirement: 'commonly_expected',
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Solicitor — SRA admission and PC required; not automatic from LLB.'),
        }
      )
      add(
        'Senior Solicitor',
        'experienced_lawyer',
        'Post-qualification solicitor with substantial case ownership and client responsibility.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          minimumExperienceYears: 3,
          eligibilityNote: note('Senior solicitor requires PQE — not Master\'s alone.'),
        }
      )
      add(
        'Specialist Solicitor',
        'senior_lawyer_specialist',
        'Senior solicitor with recognised practice specialism and complex matter leadership.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'accredited_degree_preferred',
          eligibilityNote: note('Specialist solicitor — experience-led; Master\'s may help niches.'),
        }
      )
      add(
        'Solicitor Partner',
        'partner_head',
        'Equity/salaried partner in solicitor practice owning clients, quality and profitability.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('Partner — future progression only.'),
        }
      )
      add(
        'Head of Solicitor Practice',
        'partner_head',
        'Heads a solicitor practice group or office legal delivery.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('Head of practice — substantial leadership experience.'),
        }
      )
      add(
        'Director of Legal Services (Solicitor)',
        'executive_leadership',
        'Executive leadership of solicitor legal services in firm or organisation.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('Executive legal leadership — future progression.'),
        }
      )
      break
    }

    case 'barrister_core': {
      add(
        'Chambers Practice Assistant',
        'foundation_legal_support',
        'Supports barristers\' chambers with clerking admin, listings and brief logistics.',
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Chambers support — not a barrister.'),
        }
      )
      add(
        'Pupil Barrister',
        'graduate_academic_entry',
        'Pupillage under a pupil supervisor; Bar training completed or in progress per BSB rules.',
        {
          academicRequirement: 'accredited_degree_preferred',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          experienceRequirementLabel: 'Pupillage — not yet a fully practising barrister',
          eligibilityNote: note(
            'Pupil — Bar Course/Bar training and pupillage; call alone without pupillage does not equal practice.'
          ),
        }
      )
      add(
        'Junior Barrister',
        'qualified_legal_professional',
        'Practising barrister (post-pupillage) with BSB authorisation undertaking advocacy and advisory work.',
        {
          professionalRegistrationRequirement: 'required',
          professionalMembershipRequirement: 'commonly_expected',
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Barrister — BSB regulation; not automatic from law degree.'),
        }
      )
      add(
        'Barrister',
        'qualified_legal_professional',
        'Self-employed or employed barrister providing specialist advocacy and counsel.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Practising barrister — BSB practising certificate / authorisation.'),
        }
      )
      add(
        'Senior Junior Barrister',
        'experienced_lawyer',
        'Experienced junior with substantial advocacy and advisory caseload.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          minimumExperienceYears: 5,
          eligibilityNote: note('Experienced barrister — PQE/advocacy record, not Master\'s alone.'),
        }
      )
      add(
        'Specialist Counsel',
        'senior_lawyer_specialist',
        'Senior counsel recognised for specialist advocacy or advisory excellence.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'accredited_degree_preferred',
          eligibilityNote: note('Specialist counsel — experience and reputation-led.'),
        }
      )
      add(
        "King's Counsel",
        'judicial_kings_counsel',
        'Silk appointed as King\'s Counsel for outstanding advocacy excellence.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          minimumExperienceYears: 15,
          eligibilityNote: note('KC — appointment-based future progression.'),
        }
      )
      add(
        'Head of Chambers',
        'partner_head',
        'Leads chambers governance, pupillage culture and practice development.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('Head of chambers — future progression.'),
        }
      )
      break
    }

    case 'cilex_core': {
      add(
        'CILEx Support Assistant',
        'foundation_legal_support',
        'Supports Chartered Legal Executive pathways with matter admin and documentation.',
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Support — not yet CILEx qualified.'),
        }
      )
      add(
        'CILEx Student / Trainee',
        'graduate_academic_entry',
        'Trainee on CILEx professional qualification pathway toward Chartered Legal Executive status.',
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          professionalMembershipRequirement: 'commonly_expected',
          eligibilityNote: note('CILEx training pathway — distinct from solicitor SQE and Bar pupillage.'),
        }
      )
      add(
        'Chartered Legal Executive',
        'qualified_legal_professional',
        'CILEx-qualified legal executive providing reserved/legal services within authorised scope.',
        {
          professionalRegistrationRequirement: 'required',
          professionalMembershipRequirement: 'required',
          isRegulatedOrRestricted: true,
          academicRequirement: 'none',
          eligibilityNote: note('CILEx Regulation — practice rights depend on authorisation; not a solicitor by default.'),
        }
      )
      add(
        'Senior Chartered Legal Executive',
        'experienced_lawyer',
        'Experienced CILEX practitioner owning complex caseloads in authorised practice areas.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          academicRequirement: 'none',
          minimumExperienceYears: 3,
          eligibilityNote: note('Senior CILEx — experience and authorisation.'),
        }
      )
      add(
        'Principal Chartered Legal Executive',
        'senior_lawyer_specialist',
        'Principal-level CILEx specialist leading complex work and supervising juniors.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          academicRequirement: 'none',
          eligibilityNote: note('Principal CILEx specialist.'),
        }
      )
      add(
        'CILEx Partner / Practice Head',
        'partner_head',
        'Heads a CILEx-led practice team or holds partnership-equivalent leadership.',
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note('CILEx leadership — future progression.'),
        }
      )
      break
    }

    case 'practice_area': {
      add(
        `${S} Legal Assistant`,
        'foundation_legal_support',
        `Assists ${S.toLowerCase()} fee-earners with bundles, filing and case logistics.`,
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note(`${S} support — not qualified practice.`),
        }
      )
      add(
        `${S} Graduate Paralegal`,
        'graduate_academic_entry',
        `Graduate paralegal supporting ${S.toLowerCase()} matters with research and drafting under supervision.`,
        {
          academicRequirement: 'degree_relevant',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Graduate paralegal — not admitted solicitor/barrister.'),
        }
      )
      add(
        `${S} Trainee Lawyer`,
        'graduate_academic_entry',
        `Trainee solicitor/pupil/CILEx trainee gaining ${S.toLowerCase()} seat or practice experience.`,
        {
          academicRequirement: 'accredited_degree_preferred',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Training pathway in practice area — qualification still required.'),
        }
      )
      add(
        `${S} Solicitor`,
        'qualified_legal_professional',
        `Solicitor practising ${S.toLowerCase()} with SRA practising certificate.`,
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          eligibilityNote: note(`${S} solicitor — SRA regulation; LLB alone insufficient.`),
        }
      )
      add(
        `${S} Barrister`,
        'qualified_legal_professional',
        `Barrister advising and advocating in ${S.toLowerCase()} under BSB authorisation.`,
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          eligibilityNote: note(`${S} barrister — BSB regulation.`),
        }
      )
      add(
        `${S} Legal Adviser`,
        'qualified_legal_professional',
        `Qualified legal adviser delivering ${S.toLowerCase()} advice within authorised practice rights.`,
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          academicRequirement: 'accredited_degree_preferred',
          eligibilityNote: note('Qualified legal adviser — regulator depends on route (SRA/BSB/CILEx).'),
        }
      )
      add(
        `Senior ${S} Lawyer`,
        'experienced_lawyer',
        `Experienced lawyer owning complex ${S.toLowerCase()} caseloads.`,
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'accredited_degree_preferred',
          eligibilityNote: note(
            `Senior ${S} lawyer — PQE required; Master’s may aid specialisation but is not automatic seniority.`
          ),
        }
      )
      add(
        `${S} Specialist Counsel`,
        'senior_lawyer_specialist',
        `Senior specialist counsel in ${S.toLowerCase()}.`,
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'accredited_degree_preferred',
          eligibilityNote: note(`${S} specialist — experience-led.`),
        }
      )
      add(
        `Head of ${S}`,
        'partner_head',
        `Heads the ${S.toLowerCase()} practice group or in-house legal desk.`,
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          fitClassification: 'future_progression',
          eligibilityNote: note(`Head of ${S} — future progression.`),
        }
      )
      if (def.includeJudicial) {
        add(
          `${S} Tribunal Judge`,
          'judicial_kings_counsel',
          `Tribunal judiciary hearing ${S.toLowerCase()}-related matters (appointment-based).`,
          {
            professionalRegistrationRequirement: 'required',
            isRegulatedOrRestricted: true,
            fitClassification: 'future_progression',
            minimumExperienceYears: 7,
            eligibilityNote: note('Judicial appointment — JAC/appointment process; future progression.'),
          }
        )
      }
      if (def.includeExecutive !== false) {
        add(
          `General Counsel (${S})`,
          'executive_leadership',
          `Executive legal leadership with significant ${S.toLowerCase()} accountability.`,
          {
            professionalRegistrationRequirement: 'commonly_expected',
            isRegulatedOrRestricted: true,
            fitClassification: 'future_progression',
            eligibilityNote: note('General Counsel pathway — future progression; not automatic from Master\'s.'),
          }
        )
      }
      break
    }

    case 'court_justice': {
      add(
        `${S} Assistant`,
        'foundation_legal_support',
        `Supports ${S.toLowerCase()} operations with listing support, records and public-facing admin.`,
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Court/justice support — HMCTS/MoJ context; not a lawyer.'),
        }
      )
      add(
        `${S} Officer`,
        'foundation_legal_support',
        `Delivers day-to-day ${S.toLowerCase()} processes under court/justice service procedures.`,
        {
          academicRequirement: 'none',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Operational justice role — degree often not required.'),
        }
      )
      add(
        `${S} Graduate Officer`,
        'graduate_academic_entry',
        `Graduate entry into ${S.toLowerCase()} casework or court operations schemes.`,
        {
          academicRequirement: 'degree_relevant',
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Graduate court/justice entry — not solicitor admission.'),
        }
      )
      add(
        `${S} Caseworker`,
        'qualified_legal_professional',
        `Caseworker handling ${S.toLowerCase()} files to procedure and quality standards.`,
        {
          academicRequirement: 'degree_relevant',
          professionalRegistrationRequirement: 'desirable',
          isRegulatedOrRestricted: false,
          eligibilityNote: note(
            'Justice caseworker — legal qualification may be desirable depending on role; CPS lawyer tracks differ.'
          ),
        }
      )
      add(
        `${S} Lawyer`,
        'qualified_legal_professional',
        `Qualified lawyer practising within ${S.toLowerCase()} (e.g. Crown Prosecutor or legal services lawyer).`,
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          eligibilityNote: note(`${S} lawyer — SRA/BSB as applicable; employer may be CPS/MoJ context.`),
        }
      )
      add(
        `Senior ${S} Lawyer`,
        'experienced_lawyer',
        `Senior lawyer with complex ${S.toLowerCase()} caseloads and supervision duties.`,
        {
          professionalRegistrationRequirement: 'required',
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Senior justice lawyer — substantial experience.'),
        }
      )
      add(
        `${S} Manager`,
        'partner_head',
        `Manages ${S.toLowerCase()} teams, quality and operational delivery.`,
        {
          professionalRegistrationRequirement: 'desirable',
          isRegulatedOrRestricted: false,
          fitClassification: 'future_progression',
          eligibilityNote: note('Justice management — future progression.'),
        }
      )
      if (def.includeJudicial) {
        add(
          `${S} Tribunal Judge`,
          'judicial_kings_counsel',
          `Tribunal judiciary hearing ${S.toLowerCase()}-related matters (appointment-based).`,
          {
            professionalRegistrationRequirement: 'required',
            isRegulatedOrRestricted: true,
            fitClassification: 'future_progression',
            minimumExperienceYears: 7,
            eligibilityNote: note('Judicial/tribunal appointment — future progression.'),
          }
        )
      }
      if (def.namedJudiciary) {
        add(
          'District Judge',
          'judicial_kings_counsel',
          'District Judge appointed to hear civil, family or criminal matters as applicable.',
          {
            professionalRegistrationRequirement: 'required',
            isRegulatedOrRestricted: true,
            fitClassification: 'future_progression',
            minimumExperienceYears: 7,
            eligibilityNote: note('Judicial appointment — future progression.'),
          }
        )
        add(
          'Circuit Judge',
          'judicial_kings_counsel',
          'Circuit Judge hearing more serious and complex cases on circuit.',
          {
            professionalRegistrationRequirement: 'required',
            isRegulatedOrRestricted: true,
            fitClassification: 'future_progression',
            minimumExperienceYears: 10,
            eligibilityNote: note('Circuit Judge — appointment-based future progression.'),
          }
        )
        add(
          'High Court Judge',
          'judicial_kings_counsel',
          'High Court Judge appointed to the High Court of England and Wales.',
          {
            professionalRegistrationRequirement: 'required',
            isRegulatedOrRestricted: true,
            fitClassification: 'future_progression',
            minimumExperienceYears: 15,
            eligibilityNote: note('High Court Judge — appointment-based; future progression only.'),
          }
        )
      }
      add(
        `Head of ${S}`,
        'executive_leadership',
        `Executive head of ${S.toLowerCase()} function or service line.`,
        {
          fitClassification: 'future_progression',
          professionalRegistrationRequirement: 'desirable',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Executive justice leadership — future progression.'),
        }
      )
      break
    }

    case 'academic': {
      add(
        `Research Assistant (${S})`,
        'academic_research',
        `Supports academic research projects in ${S.toLowerCase()}.`,
        {
          academicRequirement: 'masters_relevant',
          isResearchRole: true,
          professionalRegistrationRequirement: 'none',
          isRegulatedOrRestricted: false,
          eligibilityNote: note('Research assistant — Master\'s common; not practice seniority.'),
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
          eligibilityNote: note('PhD track — academic/research, not automatic QC/partner progression.'),
        }
      )
      add(
        `Legal Research Fellow (${S})`,
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
          eligibilityNote: note('Academic teaching — PhD typically required.'),
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
        `Professorial leadership in ${S.toLowerCase()} teaching and research.`,
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
