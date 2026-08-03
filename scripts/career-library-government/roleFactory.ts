/**
 * Role factory for Government, Public Policy & International Development.
 * Unique UK titles; Master's/PhD ≠ seniority; elected office excluded;
 * security clearance only where genuine.
 */

import {
  r,
  type GovStageKey,
  type SpecialismPack,
  type RoleSeed,
  type RoleMeta,
  type MastersExpectation,
  type SecurityClearanceMeta,
} from './shared'

export type RouteProfile =
  | 'public_admin'
  | 'policy'
  | 'politics_parliamentary'
  | 'diplomacy'
  | 'international_development'
  | 'public_affairs'
  | 'regulation_governance'
  | 'public_finance'
  | 'government_analytical'
  | 'academic_focus'

export type SpecDef = {
  slug: string
  label: string
  short: string
  professionalBody: string
  relatedBodies: string[]
  sources: string[]
  profile: RouteProfile
  domainTag: string
  mastersUseful?: boolean
  mastersExpectationDefault?: MastersExpectation
  governmentProfession?: string | null
  includeExecutive?: boolean
  includeDiplomaticDirector?: boolean
  clearanceHint?: SecurityClearanceMeta
}

function note(detail: string) {
  return `${detail} Distinct from Humanities academic Politics/IR/Social Policy, Law solicitor routes, Business general PM, Finance accountancy, Natural Sciences lab tracks, EAF land/food Environmental Policy, Healthcare clinical and Education QTS. Elected office (MP, councillor, mayor) is excluded from ordinary employment progression. Master's/PhD do not automatically grant seniority or restricted posts.`
}

export function buildRoles(def: SpecDef): RoleSeed[] {
  const S = def.short
  const roles: RoleSeed[] = []
  let p = 10
  const mastersExp: MastersExpectation =
    def.mastersExpectationDefault ?? (def.mastersUseful ? 'desirable' : 'optional')
  const baseMeta = (extra: Partial<RoleMeta> = {}): RoleMeta => ({
    civilServiceRoute: true,
    politicalNeutrality: true,
    mastersExpectation: mastersExp,
    governmentProfession: def.governmentProfession ?? null,
    securityClearance: def.clearanceHint ?? 'none',
    nationalityRestriction: null,
    electedOffice: false,
    domainTag: def.domainTag,
    ...extra,
  })

  const add = (
    name: string,
    stage: GovStageKey,
    description: string,
    opts: Partial<Parameters<typeof r>[3]> & { eligibilityNote: string; priority?: number }
  ) => {
    const isEntry =
      stage === 'foundation_public_service_support' ||
      stage === 'graduate_public_service_entry'
    roles.push(
      r(name, stage, description, {
        priority: opts.priority ?? p,
        ...opts,
        professionalRegistrationRequirement: isEntry
          ? 'none'
          : (opts.professionalRegistrationRequirement ?? 'none'),
        isRegulatedOrRestricted: isEntry ? false : (opts.isRegulatedOrRestricted ?? false),
        meta: {
          ...baseMeta(opts.meta),
          ...(isEntry
            ? { securityClearance: 'none' as SecurityClearanceMeta, nationalityRestriction: null }
            : {}),
        },
      })
    )
    p += 10
  }

  const addAcademic = (compact = false) => {
    add(
      `Doctoral Researcher (${S})`,
      'academic_research',
      `Undertakes doctoral research in ${S.toLowerCase()} with a public-policy or governance focus.`,
      {
        academicRequirement: 'phd_relevant',
        isResearchRole: true,
        meta: baseMeta({
          mastersExpectation: 'required',
          civilServiceRoute: false,
          politicalNeutrality: false,
          securityClearance: 'none',
        }),
        eligibilityNote: note(`PhD track in ${S} — academic/research, not SCS seniority.`),
      }
    )
    add(
      `Research Fellow (${S})`,
      'academic_research',
      `Research fellow advancing applied public-policy or governance scholarship in ${S.toLowerCase()}.`,
      {
        academicRequirement: 'phd_relevant',
        isResearchRole: true,
        meta: baseMeta({
          mastersExpectation: 'required',
          civilServiceRoute: false,
          securityClearance: 'none',
        }),
        eligibilityNote: note('Research fellow — PhD typically required.'),
      }
    )
    if (!compact) {
      add(
        `Research Associate (${S})`,
        'academic_research',
        `Research associate supporting projects in ${S.toLowerCase()}.`,
        {
          academicRequirement: 'phd_relevant',
          isResearchRole: true,
          meta: baseMeta({
            mastersExpectation: 'commonly_expected',
            civilServiceRoute: false,
            securityClearance: 'none',
          }),
          eligibilityNote: note('Research associate — often PhD or near completion.'),
        }
      )
    }
    add(
      `Lecturer in ${S}`,
      'academic_research',
      `University lecturer teaching and researching ${S.toLowerCase()}.`,
      {
        academicRequirement: 'phd_relevant',
        isAcademicRole: true,
        isResearchRole: true,
        meta: baseMeta({
          mastersExpectation: 'required',
          civilServiceRoute: false,
          securityClearance: 'none',
        }),
        eligibilityNote: note(`Lecturer in ${S} — PhD typically required.`),
      }
    )
    if (!compact) {
      add(
        `Senior Lecturer in ${S}`,
        'academic_research',
        `Senior lecturer with established teaching and research in ${S.toLowerCase()}.`,
        {
          academicRequirement: 'phd_relevant',
          isAcademicRole: true,
          isResearchRole: true,
          minimumExperienceYears: 5,
          meta: baseMeta({
            mastersExpectation: 'required',
            civilServiceRoute: false,
            securityClearance: 'none',
          }),
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
          meta: baseMeta({
            mastersExpectation: 'required',
            civilServiceRoute: false,
            securityClearance: 'none',
          }),
          eligibilityNote: note('Professor — future progression; PhD required.'),
        }
      )
    }
  }

  switch (def.profile) {
    case 'public_admin': {
      add(
        `${S} Administrative Officer`,
        'foundation_public_service_support',
        `Provides administrative support across ${S.toLowerCase()} teams.`,
        {
          academicRequirement: 'none',
          roleCategory: 'site_delivery',
          meta: baseMeta({ securityClearance: 'baseline_possible', mastersExpectation: 'optional' }),
          eligibilityNote: note('AO-style support — degree not required.'),
        }
      )
      add(
        `${S} Graduate Scheme Participant`,
        'graduate_public_service_entry',
        `Graduate entrant on a Civil Service or local-government scheme linked to ${S.toLowerCase()}.`,
        {
          meta: baseMeta({
            securityClearance: 'baseline_possible',
            mastersExpectation: 'optional',
          }),
          eligibilityNote: note(
            'Graduate scheme — degree commonly expected; appointment competitive.'
          ),
        }
      )
      add(
        `${S} Officer`,
        'officer_analyst_practitioner',
        `Delivers day-to-day ${S.toLowerCase()} functions in central or local government.`,
        {
          meta: baseMeta({ securityClearance: 'baseline_possible' }),
          eligibilityNote: note(`Competent ${S} practitioner.`),
        }
      )
      add(
        `${S} Adviser`,
        'experienced_adviser_programme',
        `Advises senior managers on ${S.toLowerCase()} operations and service delivery.`,
        {
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'degree_relevant',
          meta: baseMeta({
            mastersExpectation: def.mastersUseful ? 'desirable' : 'optional',
            securityClearance: 'baseline_possible',
          }),
          eligibilityNote: note(`Experienced ${S} adviser — Master's not automatic seniority.`),
        }
      )
      add(
        `Senior ${S} Specialist`,
        'senior_adviser_specialist',
        `Senior specialist owning complex ${S.toLowerCase()} remits and mentoring juniors.`,
        {
          meta: baseMeta({ securityClearance: 'sc_commonly_required' }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note(`Senior ${S} specialist — clearance may apply in some posts.`),
        }
      )
      add(
        `${S} Manager`,
        'manager_principal',
        `Manages ${S.toLowerCase()} teams and delivery programmes.`,
        {
          roleCategory: 'leadership',
          meta: baseMeta({ securityClearance: 'sc_commonly_required' }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note(`${S} manager — future progression.`),
        }
      )
      add(
        `Head of ${S}`,
        'head_senior_civil_service',
        `Heads ${S.toLowerCase()} for a department, agency or local authority.`,
        {
          meta: baseMeta({ securityClearance: 'sc_commonly_required' }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Head / SCS — future progression only.'),
        }
      )
      if (def.includeDiplomaticDirector !== false) {
        add(
          `Director of ${S}`,
          'director_diplomatic_leadership',
          `Director accountable for ${S.toLowerCase()} strategy and delivery.`,
          {
            meta: baseMeta({
              securityClearance: 'sc_commonly_required',
              mastersExpectation: 'desirable',
            }),
            isRegulatedOrRestricted: true,
            eligibilityNote: note('Director — future progression only.'),
          }
        )
      }
      if (def.includeExecutive) {
        add(
          `Executive Director / Permanent Secretary Pathway (${S})`,
          'executive_public_service_leadership',
          `Executive public-service leadership with a ${S.toLowerCase()} background.`,
          {
            meta: baseMeta({
              securityClearance: 'dv_selected_posts',
              mastersExpectation: 'desirable',
            }),
            isRegulatedOrRestricted: true,
            eligibilityNote: note(
              'Executive / Permanent Secretary pathway — future progression only; DV may apply to selected posts.'
            ),
          }
        )
      }
      addAcademic(true)
      break
    }

    case 'policy': {
      add(
        `${S} Support Assistant`,
        'foundation_public_service_support',
        `Supports policy teams with filing, correspondence and meeting logistics for ${S.toLowerCase()}.`,
        {
          academicRequirement: 'none',
          meta: baseMeta({ securityClearance: 'none', mastersExpectation: 'optional' }),
          eligibilityNote: note('Policy support — degree not required.'),
        }
      )
      add(
        `${S} Graduate Policy Assistant`,
        'graduate_public_service_entry',
        `Graduate policy assistant contributing to briefs and evidence packs in ${S.toLowerCase()}.`,
        {
          meta: baseMeta({ securityClearance: 'baseline_possible' }),
          eligibilityNote: note('Graduate policy entry — competitive; degree commonly expected.'),
        }
      )
      add(
        `${S} Officer`,
        'officer_analyst_practitioner',
        `Develops and coordinates ${S.toLowerCase()} advice for ministers or senior leaders.`,
        {
          meta: baseMeta({ securityClearance: 'baseline_possible' }),
          eligibilityNote: note(`Policy officer in ${S}.`),
        }
      )
      add(
        `${S} Analyst`,
        'officer_analyst_practitioner',
        `Analyses options, impacts and evidence for ${S.toLowerCase()}.`,
        {
          roleCategory: 'research',
          meta: baseMeta({
            securityClearance: 'baseline_possible',
            mastersExpectation: def.mastersUseful ? 'desirable' : 'optional',
          }),
          eligibilityNote: note(`Policy analyst — analytical skills valued.`),
        }
      )
      add(
        `${S} Adviser`,
        'experienced_adviser_programme',
        `Provides experienced ${S.toLowerCase()} advice and owns policy workstreams.`,
        {
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'degree_relevant',
          meta: baseMeta({
            mastersExpectation: def.mastersUseful ? 'commonly_expected' : 'desirable',
            securityClearance: 'sc_commonly_required',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note(
            `Experienced policy adviser — Master's may help specialised niches.`
          ),
        }
      )
      add(
        `Senior ${S} Adviser`,
        'senior_adviser_specialist',
        `Senior adviser leading complex ${S.toLowerCase()} and mentoring juniors.`,
        {
          meta: baseMeta({
            mastersExpectation: def.mastersUseful ? 'commonly_expected' : 'desirable',
            securityClearance: 'sc_commonly_required',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Senior policy adviser — future progression.'),
        }
      )
      add(
        `${S} Manager / Principal Adviser`,
        'manager_principal',
        `Manages a ${S.toLowerCase()} team or acts as principal adviser.`,
        {
          roleCategory: 'leadership',
          meta: baseMeta({ securityClearance: 'sc_commonly_required' }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Policy manager / principal — future progression.'),
        }
      )
      add(
        `Head of ${S}`,
        'head_senior_civil_service',
        `Heads ${S.toLowerCase()} in a department or public body (SCS).`,
        {
          meta: baseMeta({ securityClearance: 'sc_commonly_required' }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Head of policy / SCS — future progression only.'),
        }
      )
      add(
        `Director of ${S}`,
        'director_diplomatic_leadership',
        `Director accountable for ${S.toLowerCase()} strategy.`,
        {
          meta: baseMeta({
            securityClearance: 'sc_commonly_required',
            mastersExpectation: 'desirable',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Director of policy — future progression only.'),
        }
      )
      if (def.includeExecutive) {
        add(
          `Director General / Executive Policy Leadership (${S})`,
          'executive_public_service_leadership',
          `Executive leadership of major ${S.toLowerCase()} portfolios.`,
          {
            meta: baseMeta({
              securityClearance: 'dv_selected_posts',
              mastersExpectation: 'desirable',
            }),
            isRegulatedOrRestricted: true,
            eligibilityNote: note('DG / executive policy leadership — future progression only.'),
          }
        )
      }
      addAcademic(true)
      break
    }

    case 'politics_parliamentary': {
      add(
        `${S} Support Assistant`,
        'foundation_public_service_support',
        `Supports parliamentary, democratic or political-office administration for ${S.toLowerCase()}.`,
        {
          academicRequirement: 'none',
          meta: baseMeta({
            civilServiceRoute: false,
            politicalNeutrality: false,
            securityClearance: 'none',
          }),
          eligibilityNote: note(
            'Support role — degree not required. Not an elected-office pathway.'
          ),
        }
      )
      add(
        `${S} Graduate Officer`,
        'graduate_public_service_entry',
        `Graduate officer supporting ${S.toLowerCase()} research or casework.`,
        {
          meta: baseMeta({
            civilServiceRoute: /democratic|electoral|legislative|parliamentary research/i.test(S),
            politicalNeutrality: /democratic|electoral/i.test(S),
            securityClearance: 'baseline_possible',
          }),
          eligibilityNote: note(
            'Graduate parliamentary/political support — not MP/councillor promotion.'
          ),
        }
      )
      add(
        `${S} Officer`,
        'officer_analyst_practitioner',
        `Delivers ${S.toLowerCase()} services for Parliament, councils or political offices.`,
        {
          meta: baseMeta({
            civilServiceRoute: /democratic|electoral|legislative/i.test(S),
            politicalNeutrality: /democratic|electoral/i.test(S),
          }),
          eligibilityNote: note(`${S} officer — employed role, not elected office.`),
        }
      )
      add(
        `${S} Adviser`,
        'experienced_adviser_programme',
        `Experienced adviser on ${S.toLowerCase()} briefs and stakeholder handling.`,
        {
          meta: baseMeta({
            civilServiceRoute: false,
            politicalNeutrality: false,
            mastersExpectation: 'desirable',
          }),
          eligibilityNote: note('Political/parliamentary adviser — distinct from Civil Service neutrality posts.'),
        }
      )
      add(
        `Senior ${S} Specialist`,
        'senior_adviser_specialist',
        `Senior specialist in ${S.toLowerCase()} with mentoring and quality lead duties.`,
        {
          meta: baseMeta({ civilServiceRoute: false, politicalNeutrality: false }),
          eligibilityNote: note(`Senior ${S} specialist.`),
        }
      )
      add(
        `${S} Manager`,
        'manager_principal',
        `Manages ${S.toLowerCase()} teams in Parliament, local democracy or campaign organisations.`,
        {
          roleCategory: 'leadership',
          meta: baseMeta({ civilServiceRoute: false, politicalNeutrality: false }),
          eligibilityNote: note(`${S} manager — future progression.`),
        }
      )
      add(
        `Head of ${S}`,
        'head_senior_civil_service',
        `Heads ${S.toLowerCase()} for a parliamentary or democratic-services function.`,
        {
          meta: baseMeta({
            civilServiceRoute: /democratic|electoral|legislative|parliamentary/i.test(S),
            politicalNeutrality: /democratic|electoral/i.test(S),
          }),
          eligibilityNote: note('Head of function — future progression; not elected office.'),
        }
      )
      addAcademic(true)
      break
    }

    case 'diplomacy': {
      add(
        `${S} Administrative Support Officer`,
        'foundation_public_service_support',
        `Supports diplomatic or foreign-affairs teams with admin for ${S.toLowerCase()}.`,
        {
          academicRequirement: 'none',
          meta: baseMeta({
            securityClearance: 'baseline_possible',
            mastersExpectation: 'optional',
          }),
          eligibilityNote: note('Diplomatic admin support — degree not required.'),
        }
      )
      add(
        `${S} Graduate Entrant`,
        'graduate_public_service_entry',
        `Graduate entrant to FCDO or related foreign-affairs schemes touching ${S.toLowerCase()}.`,
        {
          meta: baseMeta({
            securityClearance: 'sc_commonly_required',
            nationalityRestriction:
              'Some FCDO Diplomatic Service posts require British nationality; check vacancy',
            mastersExpectation: 'optional',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note(
            'Graduate diplomatic entry — competitive; nationality/clearance rules vary by post. Not automatic Ambassador pathway.'
          ),
        }
      )
      add(
        `${S} Officer`,
        'officer_analyst_practitioner',
        `Delivers ${S.toLowerCase()} desk work, reporting or consular/policy support.`,
        {
          meta: baseMeta({
            securityClearance: 'sc_commonly_required',
            nationalityRestriction:
              'Selected diplomatic posts may require British nationality; not universal',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note(`${S} officer — clearance commonly required.`),
        }
      )
      add(
        `${S} Adviser`,
        'experienced_adviser_programme',
        `Experienced adviser on ${S.toLowerCase()} dossiers and negotiations support.`,
        {
          academicRequirement: 'masters_relevant',
          meta: baseMeta({
            mastersExpectation: 'commonly_expected',
            securityClearance: 'sc_commonly_required',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note("Experienced diplomatic adviser — Master's often useful."),
        }
      )
      add(
        `Senior ${S} Adviser`,
        'senior_adviser_specialist',
        `Senior adviser leading complex ${S.toLowerCase()} workstreams.`,
        {
          meta: baseMeta({
            mastersExpectation: 'commonly_expected',
            securityClearance: 'sc_commonly_required',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Senior diplomatic adviser — future progression.'),
        }
      )
      add(
        `${S} Team Leader / Principal`,
        'manager_principal',
        `Leads a ${S.toLowerCase()} team or regional desk.`,
        {
          roleCategory: 'leadership',
          meta: baseMeta({ securityClearance: 'sc_commonly_required' }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Diplomatic team leader — future progression.'),
        }
      )
      add(
        `Head of ${S}`,
        'head_senior_civil_service',
        `Heads ${S.toLowerCase()} within FCDO or a related department (SCS).`,
        {
          meta: baseMeta({ securityClearance: 'dv_selected_posts' }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Head / SCS diplomatic — future progression only.'),
        }
      )
      add(
        `Director / Senior Diplomatic Leadership (${S})`,
        'director_diplomatic_leadership',
        `Director-level or senior diplomatic leadership with a ${S.toLowerCase()} remit (Ambassador / Consul-General only where post-specific).`,
        {
          meta: baseMeta({
            securityClearance: 'dv_selected_posts',
            nationalityRestriction:
              'Senior Diplomatic Service posts typically require British nationality',
            mastersExpectation: 'desirable',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note(
            'Director / senior diplomatic leadership — future progression only; Ambassador/Consul-General are post appointments, not automatic promotions.'
          ),
        }
      )
      if (def.includeExecutive) {
        add(
          `Executive Diplomatic / Foreign Affairs Leadership (${S})`,
          'executive_public_service_leadership',
          `Executive leadership of major foreign-affairs or diplomatic portfolios.`,
          {
            meta: baseMeta({
              securityClearance: 'dv_selected_posts',
              nationalityRestriction:
                'Most senior Diplomatic Service posts require British nationality',
            }),
            isRegulatedOrRestricted: true,
            eligibilityNote: note('Executive diplomatic leadership — future progression only.'),
          }
        )
      }
      addAcademic(true)
      break
    }

    case 'international_development': {
      add(
        `${S} Programme Support Officer`,
        'foundation_public_service_support',
        `Supports grants, logistics and reporting for ${S.toLowerCase()} programmes (often UK-based).`,
        {
          academicRequirement: 'none',
          meta: baseMeta({
            civilServiceRoute: false,
            politicalNeutrality: false,
            securityClearance: 'none',
            mastersExpectation: 'optional',
          }),
          eligibilityNote: note(
            'Programme support — degree not always required; UK-based entry common.'
          ),
        }
      )
      add(
        `${S} Graduate Officer`,
        'graduate_public_service_entry',
        `Graduate officer joining NGO, FCDO or consultancy schemes in ${S.toLowerCase()}.`,
        {
          meta: baseMeta({
            civilServiceRoute: /fcdo|government/i.test(def.professionalBody),
            securityClearance: 'baseline_possible',
            mastersExpectation: 'desirable',
          }),
          eligibilityNote: note(
            'Graduate development entry — competitive; field leadership not immediate.'
          ),
        }
      )
      add(
        `${S} Programme Officer`,
        'officer_analyst_practitioner',
        `Delivers ${S.toLowerCase()} programme activities, partner liaison and reporting.`,
        {
          roleCategory: 'project_management',
          meta: baseMeta({
            civilServiceRoute: false,
            securityClearance: 'baseline_possible',
            mastersExpectation: 'desirable',
          }),
          eligibilityNote: note(`${S} programme officer.`),
        }
      )
      add(
        `${S} Adviser`,
        'experienced_adviser_programme',
        `Experienced adviser on ${S.toLowerCase()}; may require prior programme or sector experience.`,
        {
          academicRequirement: 'masters_relevant',
          meta: baseMeta({
            mastersExpectation: 'commonly_expected',
            civilServiceRoute: false,
            securityClearance: 'may_be_required',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note(
            "Development adviser — Master's and prior experience commonly expected; high-risk field leadership is not graduate entry."
          ),
        }
      )
      add(
        `Senior ${S} Specialist`,
        'senior_adviser_specialist',
        `Senior specialist leading technical quality in ${S.toLowerCase()}.`,
        {
          meta: baseMeta({
            mastersExpectation: 'commonly_expected',
            civilServiceRoute: false,
            securityClearance: 'may_be_required',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Senior development specialist — future progression.'),
        }
      )
      add(
        `${S} Programme Manager`,
        'manager_principal',
        `Manages ${S.toLowerCase()} programmes, budgets and partner portfolios.`,
        {
          roleCategory: 'project_management',
          meta: baseMeta({
            mastersExpectation: 'desirable',
            civilServiceRoute: false,
            securityClearance: 'may_be_required',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Development programme manager — future progression.'),
        }
      )
      add(
        `Head of ${S}`,
        'head_senior_civil_service',
        `Heads ${S.toLowerCase()} for FCDO, an NGO or multilateral programme.`,
        {
          meta: baseMeta({
            mastersExpectation: 'desirable',
            securityClearance: 'sc_commonly_required',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Head of development function — future progression only.'),
        }
      )
      add(
        `Director of ${S}`,
        'director_diplomatic_leadership',
        `Director accountable for ${S.toLowerCase()} strategy and portfolios.`,
        {
          meta: baseMeta({
            mastersExpectation: 'desirable',
            securityClearance: 'sc_commonly_required',
            civilServiceRoute: false,
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Director of development — future progression only.'),
        }
      )
      if (def.includeExecutive) {
        add(
          `Executive Director (${S} Organisation)`,
          'executive_public_service_leadership',
          `Executive director of an international development or humanitarian organisation.`,
          {
            meta: baseMeta({
              mastersExpectation: 'desirable',
              civilServiceRoute: false,
              securityClearance: 'may_be_required',
            }),
            isRegulatedOrRestricted: true,
            eligibilityNote: note('NGO/public-body executive — future progression only.'),
          }
        )
      }
      addAcademic(true)
      break
    }

    case 'public_affairs': {
      add(
        `${S} Assistant`,
        'foundation_public_service_support',
        `Supports ${S.toLowerCase()} diaries, monitoring and stakeholder lists.`,
        {
          academicRequirement: 'none',
          meta: baseMeta({
            civilServiceRoute: false,
            politicalNeutrality: false,
            securityClearance: 'none',
          }),
          eligibilityNote: note('Public-affairs support — degree not required.'),
        }
      )
      add(
        `${S} Graduate Executive`,
        'graduate_public_service_entry',
        `Graduate executive supporting ${S.toLowerCase()} campaigns and briefings.`,
        {
          meta: baseMeta({
            civilServiceRoute: false,
            politicalNeutrality: false,
            securityClearance: 'none',
          }),
          eligibilityNote: note('Graduate public-affairs entry.'),
        }
      )
      add(
        `${S} Officer`,
        'officer_analyst_practitioner',
        `Delivers ${S.toLowerCase()} programmes with stakeholders and decision-makers.`,
        {
          roleCategory: 'consultancy',
          meta: baseMeta({ civilServiceRoute: false, politicalNeutrality: false }),
          eligibilityNote: note(`${S} officer.`),
        }
      )
      add(
        `${S} Adviser`,
        'experienced_adviser_programme',
        `Experienced adviser on ${S.toLowerCase()} strategies and parliamentary engagement.`,
        {
          meta: baseMeta({
            civilServiceRoute: false,
            politicalNeutrality: false,
            mastersExpectation: 'desirable',
          }),
          eligibilityNote: note('Public-affairs adviser.'),
        }
      )
      add(
        `Senior ${S} Specialist`,
        'senior_adviser_specialist',
        `Senior specialist leading complex ${S.toLowerCase()} accounts.`,
        {
          meta: baseMeta({ civilServiceRoute: false, politicalNeutrality: false }),
          eligibilityNote: note(`Senior ${S} specialist.`),
        }
      )
      add(
        `${S} Manager`,
        'manager_principal',
        `Manages ${S.toLowerCase()} teams and client or organisational programmes.`,
        {
          roleCategory: 'leadership',
          meta: baseMeta({ civilServiceRoute: false, politicalNeutrality: false }),
          eligibilityNote: note(`${S} manager — future progression.`),
        }
      )
      add(
        `Head of ${S}`,
        'head_senior_civil_service',
        `Heads ${S.toLowerCase()} for an organisation or consultancy practice.`,
        {
          meta: baseMeta({ civilServiceRoute: false, politicalNeutrality: false }),
          eligibilityNote: note('Head of public affairs — future progression.'),
        }
      )
      add(
        `Director of ${S}`,
        'director_diplomatic_leadership',
        `Director accountable for ${S.toLowerCase()} strategy.`,
        {
          meta: baseMeta({
            civilServiceRoute: false,
            politicalNeutrality: false,
            mastersExpectation: 'desirable',
          }),
          eligibilityNote: note('Director of public affairs — future progression only.'),
        }
      )
      addAcademic(true)
      break
    }

    case 'regulation_governance': {
      add(
        `${S} Administration Assistant`,
        'foundation_public_service_support',
        `Supports ${S.toLowerCase()} case files, disclosures and committee papers.`,
        {
          academicRequirement: 'none',
          meta: baseMeta({ securityClearance: 'baseline_possible' }),
          eligibilityNote: note('Governance admin support — degree not required.'),
        }
      )
      add(
        `${S} Graduate Officer`,
        'graduate_public_service_entry',
        `Graduate officer supporting ${S.toLowerCase()} processes.`,
        {
          meta: baseMeta({ securityClearance: 'baseline_possible' }),
          eligibilityNote: note('Graduate governance/regulation entry.'),
        }
      )
      add(
        `${S} Officer`,
        'officer_analyst_practitioner',
        `Delivers ${S.toLowerCase()} advice, compliance or scrutiny support.`,
        {
          meta: baseMeta({ securityClearance: 'baseline_possible' }),
          eligibilityNote: note(`${S} officer.`),
        }
      )
      add(
        `${S} Adviser`,
        'experienced_adviser_programme',
        `Experienced adviser on ${S.toLowerCase()} frameworks and risk.`,
        {
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'degree_relevant',
          meta: baseMeta({
            mastersExpectation: def.mastersUseful ? 'desirable' : 'optional',
            securityClearance: 'sc_commonly_required',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note(`Experienced ${S} adviser.`),
        }
      )
      add(
        `Senior ${S} Specialist`,
        'senior_adviser_specialist',
        `Senior specialist owning complex ${S.toLowerCase()} remits.`,
        {
          meta: baseMeta({ securityClearance: 'sc_commonly_required' }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note(`Senior ${S} specialist.`),
        }
      )
      add(
        `${S} Manager`,
        'manager_principal',
        `Manages ${S.toLowerCase()} teams and assurance programmes.`,
        {
          roleCategory: 'leadership',
          meta: baseMeta({ securityClearance: 'sc_commonly_required' }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note(`${S} manager — future progression.`),
        }
      )
      add(
        `Head of ${S}`,
        'head_senior_civil_service',
        `Heads ${S.toLowerCase()} for a department, regulator or public body.`,
        {
          meta: baseMeta({ securityClearance: 'sc_commonly_required' }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Head of governance/regulation — future progression only.'),
        }
      )
      add(
        `Director of ${S}`,
        'director_diplomatic_leadership',
        `Director accountable for ${S.toLowerCase()} strategy and assurance.`,
        {
          meta: baseMeta({
            securityClearance: 'sc_commonly_required',
            mastersExpectation: 'desirable',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Director — future progression only.'),
        }
      )
      addAcademic(true)
      break
    }

    case 'public_finance': {
      add(
        `${S} Grants / Finance Support Assistant`,
        'foundation_public_service_support',
        `Supports ${S.toLowerCase()} administration, claims and filing.`,
        {
          academicRequirement: 'none',
          meta: baseMeta({ securityClearance: 'baseline_possible' }),
          eligibilityNote: note(
            'Grants/finance support — degree not required. Not an accountancy qualification route.'
          ),
        }
      )
      add(
        `${S} Graduate Officer`,
        'graduate_public_service_entry',
        `Graduate officer supporting ${S.toLowerCase()} policy or programme finance.`,
        {
          meta: baseMeta({ securityClearance: 'baseline_possible' }),
          eligibilityNote: note(
            'Graduate public-finance policy entry — distinct from ACCA/CIMA accountancy tracks.'
          ),
        }
      )
      add(
        `${S} Officer`,
        'officer_analyst_practitioner',
        `Delivers ${S.toLowerCase()} policy, grants or commissioning tasks.`,
        {
          roleCategory: 'project_management',
          meta: baseMeta({ securityClearance: 'baseline_possible' }),
          eligibilityNote: note(`${S} officer — policy/commissioning focus, not statutory audit.`),
        }
      )
      add(
        `${S} Adviser`,
        'experienced_adviser_programme',
        `Experienced adviser on ${S.toLowerCase()} design and assurance.`,
        {
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'degree_relevant',
          meta: baseMeta({
            mastersExpectation: def.mastersUseful ? 'desirable' : 'optional',
            securityClearance: 'sc_commonly_required',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note(`Experienced ${S} adviser.`),
        }
      )
      add(
        `Senior ${S} Specialist`,
        'senior_adviser_specialist',
        `Senior specialist leading complex ${S.toLowerCase()} programmes.`,
        {
          meta: baseMeta({ securityClearance: 'sc_commonly_required' }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note(`Senior ${S} specialist.`),
        }
      )
      add(
        `${S} Manager`,
        'manager_principal',
        `Manages ${S.toLowerCase()} teams and funding portfolios.`,
        {
          roleCategory: 'leadership',
          meta: baseMeta({ securityClearance: 'sc_commonly_required' }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note(`${S} manager — future progression.`),
        }
      )
      add(
        `Head of ${S}`,
        'head_senior_civil_service',
        `Heads ${S.toLowerCase()} for a department or public body.`,
        {
          meta: baseMeta({ securityClearance: 'sc_commonly_required' }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Head of public finance/commissioning — future progression.'),
        }
      )
      add(
        `Director of ${S}`,
        'director_diplomatic_leadership',
        `Director accountable for ${S.toLowerCase()} strategy.`,
        {
          meta: baseMeta({
            securityClearance: 'sc_commonly_required',
            mastersExpectation: 'desirable',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Director — future progression only.'),
        }
      )
      addAcademic(true)
      break
    }

    case 'government_analytical': {
      const profession = def.governmentProfession ?? 'Government Analysis Function'
      add(
        `${S} Analytical Support Assistant`,
        'foundation_public_service_support',
        `Supports data cleaning, survey admin and evidence packs for ${S.toLowerCase()}.`,
        {
          academicRequirement: 'none',
          roleCategory: 'research',
          meta: baseMeta({
            governmentProfession: profession,
            securityClearance: 'baseline_possible',
          }),
          eligibilityNote: note('Analytical support — degree not always required.'),
        }
      )
      add(
        `${S} Graduate / Assistant Analyst`,
        'graduate_public_service_entry',
        `Graduate entrant to government analytical schemes related to ${S.toLowerCase()}.`,
        {
          roleCategory: 'research',
          meta: baseMeta({
            governmentProfession: profession,
            securityClearance: 'baseline_possible',
            mastersExpectation: 'desirable',
          }),
          eligibilityNote: note(
            `Graduate analytical entry (${profession}) — relevant degree commonly expected; competitive.`
          ),
        }
      )
      add(
        `${S} Officer / Analyst`,
        'officer_analyst_practitioner',
        `Produces analysis and evidence for decision-makers in ${S.toLowerCase()}.`,
        {
          roleCategory: 'research',
          meta: baseMeta({
            governmentProfession: profession,
            securityClearance: 'baseline_possible',
            mastersExpectation: 'desirable',
          }),
          eligibilityNote: note(`Analytical practitioner — ${profession}.`),
        }
      )
      add(
        `${S} Adviser`,
        'experienced_adviser_programme',
        `Experienced analytical adviser owning complex ${S.toLowerCase()} projects.`,
        {
          academicRequirement: 'masters_relevant',
          roleCategory: 'research',
          meta: baseMeta({
            governmentProfession: profession,
            mastersExpectation: 'commonly_expected',
            securityClearance: 'sc_commonly_required',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note(
            "Experienced government analyst — Master's often expected in specialised posts."
          ),
        }
      )
      add(
        `Senior ${S} Specialist`,
        'senior_adviser_specialist',
        `Senior specialist leading ${S.toLowerCase()} quality and mentoring.`,
        {
          roleCategory: 'research',
          meta: baseMeta({
            governmentProfession: profession,
            mastersExpectation: 'commonly_expected',
            securityClearance: 'sc_commonly_required',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Senior government analyst — future progression.'),
        }
      )
      add(
        `${S} Research Manager`,
        'manager_principal',
        `Manages analytical teams delivering ${S.toLowerCase()}.`,
        {
          roleCategory: 'leadership',
          meta: baseMeta({
            governmentProfession: profession,
            securityClearance: 'sc_commonly_required',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Government research manager — future progression.'),
        }
      )
      add(
        `Head of ${S}`,
        'head_senior_civil_service',
        `Heads ${S.toLowerCase()} within the Government Analysis Function or a department.`,
        {
          meta: baseMeta({
            governmentProfession: profession,
            securityClearance: 'sc_commonly_required',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Head of government research — future progression only.'),
        }
      )
      add(
        `Director of Analysis / ${S}`,
        'director_diplomatic_leadership',
        `Director-level leadership of ${S.toLowerCase()} and related analysis.`,
        {
          meta: baseMeta({
            governmentProfession: profession,
            securityClearance: 'sc_commonly_required',
            mastersExpectation: 'desirable',
          }),
          isRegulatedOrRestricted: true,
          eligibilityNote: note('Director of analysis — future progression only.'),
        }
      )
      addAcademic(false)
      break
    }

    case 'academic_focus': {
      add(
        `${S} Research Support Assistant`,
        'foundation_public_service_support',
        `Supports literature searches, coding and event logistics for ${S.toLowerCase()}.`,
        {
          academicRequirement: 'none',
          roleCategory: 'research',
          meta: baseMeta({
            civilServiceRoute: false,
            politicalNeutrality: false,
            securityClearance: 'none',
          }),
          eligibilityNote: note('Research support — degree not always required.'),
        }
      )
      add(
        `${S} Graduate Research Assistant`,
        'graduate_public_service_entry',
        `Graduate research assistant contributing to ${S.toLowerCase()} projects.`,
        {
          roleCategory: 'research',
          meta: baseMeta({
            civilServiceRoute: false,
            mastersExpectation: 'desirable',
            securityClearance: 'none',
          }),
          eligibilityNote: note('Graduate research assistant — academic track adjacent.'),
        }
      )
      add(
        `${S} Research Officer`,
        'officer_analyst_practitioner',
        `Produces applied research outputs in ${S.toLowerCase()}.`,
        {
          roleCategory: 'research',
          meta: baseMeta({
            civilServiceRoute: false,
            mastersExpectation: 'commonly_expected',
            securityClearance: 'none',
          }),
          eligibilityNote: note(`${S} research officer.`),
        }
      )
      add(
        `${S} Research Fellow (Applied)`,
        'experienced_adviser_programme',
        `Applied research fellow bridging academia and public policy in ${S.toLowerCase()}.`,
        {
          academicRequirement: 'phd_relevant',
          roleCategory: 'research',
          isResearchRole: true,
          meta: baseMeta({
            civilServiceRoute: false,
            mastersExpectation: 'required',
            securityClearance: 'none',
          }),
          eligibilityNote: note('Applied research fellow — PhD typically required.'),
        }
      )
      add(
        `Senior ${S} Researcher`,
        'senior_adviser_specialist',
        `Senior researcher leading programmes in ${S.toLowerCase()}.`,
        {
          academicRequirement: 'phd_relevant',
          roleCategory: 'research',
          isResearchRole: true,
          meta: baseMeta({
            civilServiceRoute: false,
            mastersExpectation: 'required',
            securityClearance: 'none',
          }),
          eligibilityNote: note('Senior researcher — PhD typically required.'),
        }
      )
      add(
        `${S} Research Centre Manager`,
        'manager_principal',
        `Manages a research centre or programme focused on ${S.toLowerCase()}.`,
        {
          roleCategory: 'leadership',
          meta: baseMeta({
            civilServiceRoute: false,
            mastersExpectation: 'commonly_expected',
            securityClearance: 'none',
          }),
          eligibilityNote: note('Research centre manager — future progression.'),
        }
      )
      addAcademic(false)
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
    domainTag: def.domainTag,
    roles: buildRoles(def),
  }
}
