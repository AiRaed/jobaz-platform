/**
 * Role factory for Hospitality, Tourism & Events — Work in My Education focus.
 * Low-barrier ops limited; Master's/PhD ≠ seniority; ownership ≠ employment promotion.
 */

import {
  r,
  type HteStageKey,
  type SpecialismPack,
  type RoleSeed,
  type RoleMeta,
  type MastersExpectation,
  type LicenceLevel,
} from './shared'

export type RouteProfile =
  | 'hospitality_mgmt'
  | 'food_beverage'
  | 'culinary'
  | 'tourism'
  | 'travel'
  | 'events'
  | 'venues'
  | 'leisure'
  | 'commercial_analytical'
  | 'sustainability_policy'
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
  includeOwnership?: boolean
  skipFoundation?: boolean
  licenceHints?: Array<{ name: string; level: LicenceLevel; note?: string }>
}

function note(detail: string) {
  return `${detail} Distinct from Business general management/marketing, Finance accountancy, Arts event design, EAF food science, Government tourism-policy adviser routes and Logistics. Low-barrier waiter/bar/kitchen-porter/room-attendant roles are limited foundation context for Work in My Education. Master's/PhD do not automatically grant management or director seniority. Ownership is not guaranteed employment.`
}

const FOOD_SAFE: RoleMeta['licences'] = [
  {
    name: 'Food hygiene / food safety',
    level: 'employer_commonly_expects',
    note: 'Level 2 food hygiene commonly expected in F&B; not always a statutory licence for all posts',
  },
  {
    name: 'Allergen awareness',
    level: 'employer_commonly_expects',
    note: 'Strongly expected under Natasha’s Law / allergen duties context',
  },
]

const LICENSED: RoleMeta['licences'] = [
  {
    name: 'Personal Licence awareness',
    level: 'useful',
    note: 'Relevant for licensed premises managers; Personal Licence holder where selling alcohol under Licensing Act duties',
  },
  {
    name: 'Alcohol licensing context',
    level: 'employer_commonly_expects',
    note: 'DPS / premises licence awareness for licensed venues',
  },
]

const EVENT_SAFE: RoleMeta['licences'] = [
  {
    name: 'Event safety / health and safety',
    level: 'strongly_recommended',
    note: 'Event safety planning expected for larger events; not a single universal licence',
  },
  {
    name: 'First aid',
    level: 'useful',
    note: 'Often employer-expected for event and venue teams',
  },
]

export function buildRoles(def: SpecDef): RoleSeed[] {
  const S = def.short
  const roles: RoleSeed[] = []
  let p = 10
  const mastersExp: MastersExpectation =
    def.mastersExpectationDefault ?? (def.mastersUseful ? 'desirable' : 'optional')

  const baseMeta = (extra: Partial<RoleMeta> = {}): RoleMeta => ({
    mastersExpectation: mastersExp,
    domainTag: def.domainTag,
    vocationalRoute: false,
    apprenticeshipRoute: false,
    workInMyEducationPriority: 'primary',
    lowBarrierOperational: false,
    ownershipRoute: false,
    consultancyRoute: false,
    licences: def.licenceHints ?? [],
    ...extra,
  })

  const add = (
    name: string,
    stage: HteStageKey,
    description: string,
    opts: Partial<Parameters<typeof r>[3]> & { eligibilityNote: string; priority?: number }
  ) => {
    const isEntry =
      stage === 'foundation_operational_support' ||
      stage === 'trainee_vocational_entry' ||
      stage === 'graduate_management_entry'
    roles.push(
      r(name, stage, description, {
        priority: opts.priority ?? p,
        ...opts,
        professionalRegistrationRequirement: isEntry
          ? 'none'
          : (opts.professionalRegistrationRequirement ?? 'none'),
        meta: baseMeta(opts.meta),
      })
    )
    p += 10
  }

  const addAcademic = (compact = true) => {
    add(
      `Doctoral Researcher (${S})`,
      'academic_research',
      `Undertakes doctoral research in ${S.toLowerCase()}.`,
      {
        academicRequirement: 'phd_relevant',
        isResearchRole: true,
        meta: baseMeta({
          mastersExpectation: 'required',
          workInMyEducationPriority: 'primary',
          licences: [],
        }),
        eligibilityNote: note(`PhD track in ${S} — academic/research, not hotel GM seniority.`),
      }
    )
    add(
      `Research Fellow (${S})`,
      'academic_research',
      `Research fellow advancing scholarship in ${S.toLowerCase()}.`,
      {
        academicRequirement: 'phd_relevant',
        isResearchRole: true,
        meta: baseMeta({ mastersExpectation: 'required', licences: [] }),
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
        meta: baseMeta({ mastersExpectation: 'required', licences: [] }),
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
          meta: baseMeta({ mastersExpectation: 'required', licences: [] }),
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
          meta: baseMeta({ mastersExpectation: 'required', licences: [] }),
          eligibilityNote: note('Professor — future progression; PhD required.'),
        }
      )
    }
  }

  const addFoundation = (title: string, desc: string) => {
    if (def.skipFoundation) return
    add(title, 'foundation_operational_support', desc, {
      academicRequirement: 'none',
      roleCategory: 'site_delivery',
      meta: baseMeta({
        lowBarrierOperational: true,
        workInMyEducationPriority: 'limited_context',
        vocationalRoute: true,
        licences: def.licenceHints ?? [],
      }),
      eligibilityNote: note(
        'Limited foundation/ops context for Work in My Education — not a primary education-match recommendation.'
      ),
    })
  }

  switch (def.profile) {
    case 'hospitality_mgmt': {
      addFoundation(
        `${S} Operations Assistant`,
        `Supports ${S.toLowerCase()} operations with guest-facing and back-office tasks under supervision.`
      )
      add(
        `${S} Apprentice / Management Trainee (Vocational)`,
        'trainee_vocational_entry',
        `Apprenticeship or college trainee building ${S.toLowerCase()} competence.`,
        {
          academicRequirement: 'none',
          meta: baseMeta({
            vocationalRoute: true,
            apprenticeshipRoute: true,
            workInMyEducationPriority: 'secondary',
          }),
          eligibilityNote: note('Vocational/apprenticeship entry — valid alternative to degree.'),
        }
      )
      add(
        `${S} Graduate Management Trainee`,
        'graduate_management_entry',
        `Graduate management trainee on a hotel/hospitality scheme focused on ${S.toLowerCase()}.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(
            'Graduate management scheme — relevant degree commonly expected; not automatic manager appointment.'
          ),
        }
      )
      add(
        `${S} Supervisor / Coordinator`,
        'supervisor_coordinator',
        `Supervises a ${S.toLowerCase()} team or coordinates shifts and guest journeys.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(`${S} supervisor — experience required beyond qualification.`),
        }
      )
      add(
        `${S} Manager`,
        'professional_practitioner_manager',
        `Manages ${S.toLowerCase()} delivery, team performance and guest standards.`,
        {
          roleCategory: 'leadership',
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(
            `${S} manager — requires proven operations experience, not degree alone.`
          ),
        }
      )
      add(
        `Senior ${S} Manager`,
        'experienced_specialist_senior_manager',
        `Senior manager owning complex ${S.toLowerCase()} remits and mentoring juniors.`,
        {
          meta: baseMeta({
            mastersExpectation: def.mastersUseful ? 'desirable' : 'optional',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(`Senior ${S} manager — future progression.`),
        }
      )
      add(
        `Head of ${S} / Regional Operations Lead`,
        'head_multisite_leadership',
        `Leads ${S.toLowerCase()} across a site cluster or region.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Head / multi-site — substantial experience required.'),
        }
      )
      add(
        `${S} Director / Hotel General Manager Pathway`,
        'director_general_management',
        `Director or GM-track leadership with a ${S.toLowerCase()} remit.`,
        {
          meta: baseMeta({
            mastersExpectation: 'desirable',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(
            'Director / GM pathway — future progression only; years of management evidence required.'
          ),
        }
      )
      add(
        `${S} Consultant`,
        'executive_ownership_consultancy',
        `Consults on ${S.toLowerCase()} strategy, openings and turnarounds.`,
        {
          roleCategory: 'consultancy',
          meta: baseMeta({
            consultancyRoute: true,
            mastersExpectation: 'desirable',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note('Hospitality consultancy — experience-led; not automatic from Master’s.'),
        }
      )
      if (def.includeOwnership) {
        add(
          `${S} Owner-Operator / Group Executive`,
          'executive_ownership_consultancy',
          `Ownership or group-executive route in ${S.toLowerCase()} — separate from employed promotion.`,
          {
            meta: baseMeta({
              ownershipRoute: true,
              workInMyEducationPriority: 'secondary',
              mastersExpectation: 'optional',
            }),
            eligibilityNote: note(
              'Ownership/group executive — not guaranteed employment outcome or automatic promotion.'
            ),
          }
        )
      }
      addAcademic(true)
      break
    }

    case 'food_beverage': {
      addFoundation(
        `${S} Operations Assistant`,
        `Supports ${S.toLowerCase()} service and prep under supervision.`
      )
      add(
        `${S} Apprentice / Trainee Supervisor`,
        'trainee_vocational_entry',
        `Vocational trainee developing ${S.toLowerCase()} skills.`,
        {
          academicRequirement: 'none',
          meta: baseMeta({
            vocationalRoute: true,
            apprenticeshipRoute: true,
            licences: [...(def.licenceHints ?? []), ...FOOD_SAFE],
            workInMyEducationPriority: 'secondary',
          }),
          eligibilityNote: note('Vocational F&B entry.'),
        }
      )
      add(
        `${S} Graduate Management Trainee`,
        'graduate_management_entry',
        `Graduate trainee on restaurant/hotel F&B schemes in ${S.toLowerCase()}.`,
        {
          meta: baseMeta({
            licences: [...(def.licenceHints ?? []), ...FOOD_SAFE, ...LICENSED],
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note('Graduate F&B management entry.'),
        }
      )
      add(
        `${S} Supervisor`,
        'supervisor_coordinator',
        `Supervises ${S.toLowerCase()} service standards and shifts.`,
        {
          meta: baseMeta({
            licences: [...FOOD_SAFE, ...LICENSED],
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(`${S} supervisor.`),
        }
      )
      add(
        `${S} Manager`,
        'professional_practitioner_manager',
        `Manages ${S.toLowerCase()} outlets, cost of sales and guest experience.`,
        {
          roleCategory: 'leadership',
          meta: baseMeta({
            licences: [...FOOD_SAFE, ...LICENSED],
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(
            `${S} manager — operations experience required; Personal Licence useful for licensed sites.`
          ),
        }
      )
      add(
        `Senior ${S} Manager`,
        'experienced_specialist_senior_manager',
        `Senior manager owning multi-outlet or complex ${S.toLowerCase()} portfolios.`,
        {
          meta: baseMeta({ licences: [...FOOD_SAFE, ...LICENSED], workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(`Senior ${S} manager.`),
        }
      )
      add(
        `Head of ${S}`,
        'head_multisite_leadership',
        `Heads ${S.toLowerCase()} for a hotel, group or contract caterer.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Head of F&B — future progression.'),
        }
      )
      add(
        `Director of ${S}`,
        'director_general_management',
        `Director accountable for ${S.toLowerCase()} strategy and P&L.`,
        {
          meta: baseMeta({ mastersExpectation: 'desirable', workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Director of F&B — future progression only.'),
        }
      )
      add(
        `${S} Consultant`,
        'executive_ownership_consultancy',
        `Consults on ${S.toLowerCase()} concepts, menus and operations.`,
        {
          roleCategory: 'consultancy',
          meta: baseMeta({ consultancyRoute: true, workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('F&B consultancy — experience-led.'),
        }
      )
      addAcademic(true)
      break
    }

    case 'culinary': {
      addFoundation(
        `${S} Kitchen Support Assistant`,
        `Supports kitchen prep and brigade routines for ${S.toLowerCase()} under supervision.`
      )
      add(
        `${S} Commis / Apprentice Chef`,
        'trainee_vocational_entry',
        `Commis or apprentice developing practical ${S.toLowerCase()} skills.`,
        {
          academicRequirement: 'none',
          meta: baseMeta({
            vocationalRoute: true,
            apprenticeshipRoute: true,
            licences: [...FOOD_SAFE],
            workInMyEducationPriority: 'secondary',
          }),
          eligibilityNote: note(
            'Culinary vocational entry — practical skill critical; Culinary Arts degree ≠ Executive Chef.'
          ),
        }
      )
      add(
        `${S} Graduate / Culinary Management Trainee`,
        'graduate_management_entry',
        `Graduate culinary or kitchen-management trainee in ${S.toLowerCase()}.`,
        {
          meta: baseMeta({
            licences: [...FOOD_SAFE],
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(
            'Graduate culinary management — still requires kitchen competence and experience.'
          ),
        }
      )
      add(
        `${S} Chef de Partie / Section Lead`,
        'supervisor_coordinator',
        `Leads a kitchen section for ${S.toLowerCase()}.`,
        {
          roleCategory: 'site_delivery',
          meta: baseMeta({
            licences: [...FOOD_SAFE],
            workInMyEducationPriority: 'primary',
            vocationalRoute: true,
          }),
          eligibilityNote: note('Section lead — kitchen experience essential.'),
        }
      )
      add(
        `${S} Sous Chef / Culinary Manager`,
        'professional_practitioner_manager',
        `Manages kitchen production and standards for ${S.toLowerCase()}.`,
        {
          roleCategory: 'leadership',
          meta: baseMeta({
            licences: [
              ...FOOD_SAFE,
              {
                name: 'HACCP awareness',
                level: 'employer_commonly_expects',
                note: 'Food safety management awareness commonly expected',
              },
            ],
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(
            'Sous/culinary manager — degree does not replace brigade experience.'
          ),
        }
      )
      add(
        `Senior ${S} / Head Chef Pathway`,
        'experienced_specialist_senior_manager',
        `Senior culinary leadership progressing toward Head Chef in ${S.toLowerCase()}.`,
        {
          meta: baseMeta({ licences: [...FOOD_SAFE], workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Senior culinary leadership — experience-led progression.'),
        }
      )
      add(
        `Executive Chef / Head of ${S}`,
        'head_multisite_leadership',
        `Executive culinary leadership for ${S.toLowerCase()} across a site or group.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(
            'Executive Chef / head of culinary — substantial kitchen leadership evidence required.'
          ),
        }
      )
      add(
        `Culinary Director (${S})`,
        'director_general_management',
        `Culinary director shaping ${S.toLowerCase()} concepts and standards.`,
        {
          meta: baseMeta({ mastersExpectation: 'optional', workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Culinary director — future progression only.'),
        }
      )
      add(
        `${S} Culinary Consultant`,
        'executive_ownership_consultancy',
        `Consults on ${S.toLowerCase()} menus, kitchens and concepts.`,
        {
          roleCategory: 'consultancy',
          meta: baseMeta({ consultancyRoute: true, workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Culinary consultancy — portfolio and experience led.'),
        }
      )
      addAcademic(true)
      break
    }

    case 'tourism': {
      addFoundation(
        `${S} Visitor Services Assistant`,
        `Supports visitor information and destination admin for ${S.toLowerCase()}.`
      )
      add(
        `${S} Trainee / Apprentice Officer`,
        'trainee_vocational_entry',
        `Vocational trainee supporting ${S.toLowerCase()} projects.`,
        {
          academicRequirement: 'none',
          meta: baseMeta({
            vocationalRoute: true,
            apprenticeshipRoute: true,
            workInMyEducationPriority: 'secondary',
          }),
          eligibilityNote: note('Vocational tourism entry.'),
        }
      )
      add(
        `${S} Graduate / Development Assistant`,
        'graduate_management_entry',
        `Graduate assistant contributing to ${S.toLowerCase()} development and visitor economy projects.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(
            'Graduate tourism/destination entry — strong Work in My Education fit.'
          ),
        }
      )
      add(
        `${S} Coordinator / Officer`,
        'supervisor_coordinator',
        `Coordinates ${S.toLowerCase()} programmes, partners and visitor journeys.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(`${S} coordinator/officer.`),
        }
      )
      add(
        `${S} Manager / Development Officer`,
        'professional_practitioner_manager',
        `Manages ${S.toLowerCase()} initiatives for a DMO, attraction or destination.`,
        {
          roleCategory: 'leadership',
          meta: baseMeta({
            mastersExpectation: def.mastersUseful ? 'desirable' : 'optional',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(
            `${S} manager — sector knowledge and delivery evidence required.`
          ),
        }
      )
      add(
        `Senior ${S} Specialist / Manager`,
        'experienced_specialist_senior_manager',
        `Senior specialist owning complex ${S.toLowerCase()} strategies.`,
        {
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'degree_relevant',
          meta: baseMeta({
            mastersExpectation: def.mastersUseful ? 'commonly_expected' : 'desirable',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(
            `Senior ${S} — Master's may help destination/policy niches; not automatic seniority.`
          ),
        }
      )
      add(
        `Head of ${S}`,
        'head_multisite_leadership',
        `Heads ${S.toLowerCase()} for a destination, region or organisation.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Head of tourism/destination — future progression.'),
        }
      )
      add(
        `Director of ${S}`,
        'director_general_management',
        `Director accountable for ${S.toLowerCase()} strategy.`,
        {
          meta: baseMeta({
            mastersExpectation: 'desirable',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note('Tourism director — future progression only.'),
        }
      )
      add(
        `${S} Consultant`,
        'executive_ownership_consultancy',
        `Consults on ${S.toLowerCase()} strategy and visitor economy development.`,
        {
          roleCategory: 'consultancy',
          meta: baseMeta({
            consultancyRoute: true,
            mastersExpectation: 'desirable',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note('Tourism consultancy — experience-led.'),
        }
      )
      addAcademic(true)
      break
    }

    case 'travel': {
      addFoundation(
        `${S} Operations Assistant`,
        `Supports bookings, manifests and client admin for ${S.toLowerCase()}.`
      )
      add(
        `${S} Consultant Trainee / Apprentice`,
        'trainee_vocational_entry',
        `Trainee travel consultant building ${S.toLowerCase()} product knowledge.`,
        {
          academicRequirement: 'none',
          meta: baseMeta({
            vocationalRoute: true,
            apprenticeshipRoute: true,
            workInMyEducationPriority: 'secondary',
          }),
          eligibilityNote: note('Travel vocational entry.'),
        }
      )
      add(
        `${S} Graduate Operations / Product Trainee`,
        'graduate_management_entry',
        `Graduate trainee in ${S.toLowerCase()} operations or product.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Graduate travel management entry.'),
        }
      )
      add(
        `${S} Coordinator`,
        'supervisor_coordinator',
        `Coordinates ${S.toLowerCase()} itineraries, suppliers and customer journeys.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(`${S} coordinator.`),
        }
      )
      add(
        `${S} Manager`,
        'professional_practitioner_manager',
        `Manages ${S.toLowerCase()} teams, margins and supplier relationships.`,
        {
          roleCategory: 'leadership',
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(`${S} manager — commercial experience required.`),
        }
      )
      add(
        `Senior ${S} Manager`,
        'experienced_specialist_senior_manager',
        `Senior manager owning complex ${S.toLowerCase()} portfolios.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(`Senior ${S} manager.`),
        }
      )
      add(
        `Head of ${S}`,
        'head_multisite_leadership',
        `Heads ${S.toLowerCase()} for a travel group or tour operator.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Head of travel — future progression.'),
        }
      )
      add(
        `Director of ${S}`,
        'director_general_management',
        `Director accountable for ${S.toLowerCase()} strategy.`,
        {
          meta: baseMeta({ mastersExpectation: 'desirable', workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Travel director — future progression only.'),
        }
      )
      add(
        `${S} Consultant`,
        'executive_ownership_consultancy',
        `Consults on ${S.toLowerCase()} products and distribution.`,
        {
          roleCategory: 'consultancy',
          meta: baseMeta({ consultancyRoute: true, workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Travel consultancy.'),
        }
      )
      addAcademic(true)
      break
    }

    case 'events': {
      addFoundation(
        `${S} Assistant`,
        `Supports ${S.toLowerCase()} logistics, registration and on-site set-up under supervision.`
      )
      add(
        `${S} Trainee Coordinator / Apprentice`,
        'trainee_vocational_entry',
        `Trainee coordinator supporting ${S.toLowerCase()} delivery.`,
        {
          academicRequirement: 'none',
          meta: baseMeta({
            vocationalRoute: true,
            apprenticeshipRoute: true,
            licences: [...EVENT_SAFE],
            workInMyEducationPriority: 'secondary',
          }),
          eligibilityNote: note('Events vocational entry.'),
        }
      )
      add(
        `${S} Graduate Coordinator`,
        'graduate_management_entry',
        `Graduate events coordinator contributing to ${S.toLowerCase()} programmes.`,
        {
          meta: baseMeta({
            licences: [...EVENT_SAFE],
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(
            'Graduate events entry — strong Work in My Education fit; complexity grows with delivery evidence.'
          ),
        }
      )
      add(
        `${S} Coordinator`,
        'supervisor_coordinator',
        `Coordinates ${S.toLowerCase()} timelines, suppliers and client briefs.`,
        {
          roleCategory: 'project_management',
          meta: baseMeta({
            licences: [...EVENT_SAFE],
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(`${S} coordinator.`),
        }
      )
      add(
        `${S} Manager`,
        'professional_practitioner_manager',
        `Manages end-to-end ${S.toLowerCase()} delivery and budgets.`,
        {
          roleCategory: 'project_management',
          meta: baseMeta({
            licences: [...EVENT_SAFE],
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(
            `${S} manager — evidence of delivering increasingly complex events required.`
          ),
        }
      )
      add(
        `Senior ${S} Manager`,
        'experienced_specialist_senior_manager',
        `Senior manager owning complex ${S.toLowerCase()} portfolios.`,
        {
          meta: baseMeta({
            licences: [...EVENT_SAFE],
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(`Senior ${S} manager.`),
        }
      )
      add(
        `Head of ${S}`,
        'head_multisite_leadership',
        `Heads ${S.toLowerCase()} for an agency, venue or organisation.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Head of events — future progression.'),
        }
      )
      add(
        `Director of ${S}`,
        'director_general_management',
        `Director accountable for ${S.toLowerCase()} strategy and major programmes.`,
        {
          meta: baseMeta({ mastersExpectation: 'desirable', workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Events director — future progression only.'),
        }
      )
      add(
        `${S} Strategy Consultant`,
        'executive_ownership_consultancy',
        `Consults on ${S.toLowerCase()} strategy and major event programmes.`,
        {
          roleCategory: 'consultancy',
          meta: baseMeta({ consultancyRoute: true, workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Events consultancy — portfolio-led.'),
        }
      )
      addAcademic(true)
      break
    }

    case 'venues': {
      addFoundation(
        `${S} Visitor / Venue Assistant`,
        `Supports visitor flow and venue operations for ${S.toLowerCase()}.`
      )
      add(
        `${S} Trainee / Apprentice Supervisor`,
        'trainee_vocational_entry',
        `Vocational trainee in ${S.toLowerCase()} operations.`,
        {
          academicRequirement: 'none',
          meta: baseMeta({
            vocationalRoute: true,
            apprenticeshipRoute: true,
            workInMyEducationPriority: 'secondary',
          }),
          eligibilityNote: note('Venue vocational entry.'),
        }
      )
      add(
        `${S} Graduate Management Trainee`,
        'graduate_management_entry',
        `Graduate trainee in ${S.toLowerCase()} operations and visitor experience.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Graduate venue/attraction management entry.'),
        }
      )
      add(
        `${S} Coordinator / Supervisor`,
        'supervisor_coordinator',
        `Coordinates ${S.toLowerCase()} operations, safety and visitor journeys.`,
        {
          meta: baseMeta({
            licences: [
              {
                name: 'Health and safety / fire safety awareness',
                level: 'employer_commonly_expects',
              },
              {
                name: 'Safeguarding awareness',
                level: 'useful',
                note: 'May apply in family/visitor settings; DBS only if regulated activity',
              },
            ],
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(`${S} coordinator/supervisor.`),
        }
      )
      add(
        `${S} Manager`,
        'professional_practitioner_manager',
        `Manages ${S.toLowerCase()} operations, commercial targets and guest experience.`,
        {
          roleCategory: 'leadership',
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(`${S} manager — site experience required.`),
        }
      )
      add(
        `Senior ${S} Manager`,
        'experienced_specialist_senior_manager',
        `Senior manager owning complex ${S.toLowerCase()} portfolios.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(`Senior ${S} manager.`),
        }
      )
      add(
        `Head of ${S}`,
        'head_multisite_leadership',
        `Heads ${S.toLowerCase()} across sites or a major venue.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Head of venue/attraction — future progression.'),
        }
      )
      add(
        `Director of ${S} / Venue GM`,
        'director_general_management',
        `Director or venue GM accountable for ${S.toLowerCase()}.`,
        {
          meta: baseMeta({ mastersExpectation: 'desirable', workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Venue director/GM — future progression only.'),
        }
      )
      add(
        `${S} Consultant`,
        'executive_ownership_consultancy',
        `Consults on ${S.toLowerCase()} operations and visitor experience.`,
        {
          roleCategory: 'consultancy',
          meta: baseMeta({ consultancyRoute: true, workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Venue consultancy.'),
        }
      )
      addAcademic(true)
      break
    }

    case 'leisure': {
      addFoundation(
        `${S} Operations Assistant`,
        `Supports ${S.toLowerCase()} facility operations under supervision.`
      )
      add(
        `${S} Apprentice / Trainee Supervisor`,
        'trainee_vocational_entry',
        `Vocational trainee in ${S.toLowerCase()}.`,
        {
          academicRequirement: 'none',
          meta: baseMeta({
            vocationalRoute: true,
            apprenticeshipRoute: true,
            workInMyEducationPriority: 'secondary',
          }),
          eligibilityNote: note('Leisure vocational entry.'),
        }
      )
      add(
        `${S} Graduate Management Trainee`,
        'graduate_management_entry',
        `Graduate trainee in ${S.toLowerCase()} operations.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Graduate leisure management entry.'),
        }
      )
      add(
        `${S} Supervisor / Coordinator`,
        'supervisor_coordinator',
        `Supervises ${S.toLowerCase()} programmes and facility teams.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(`${S} supervisor.`),
        }
      )
      add(
        `${S} Manager`,
        'professional_practitioner_manager',
        `Manages ${S.toLowerCase()} facilities, programmes and commercial performance.`,
        {
          roleCategory: 'leadership',
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(`${S} manager.`),
        }
      )
      add(
        `Senior ${S} Manager`,
        'experienced_specialist_senior_manager',
        `Senior manager owning complex ${S.toLowerCase()} portfolios.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(`Senior ${S} manager.`),
        }
      )
      add(
        `Head of ${S}`,
        'head_multisite_leadership',
        `Heads ${S.toLowerCase()} for a local authority, operator or group.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Head of leisure — future progression.'),
        }
      )
      add(
        `Director of ${S}`,
        'director_general_management',
        `Director accountable for ${S.toLowerCase()} strategy.`,
        {
          meta: baseMeta({ mastersExpectation: 'desirable', workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Leisure director — future progression only.'),
        }
      )
      add(
        `${S} Consultant`,
        'executive_ownership_consultancy',
        `Consults on ${S.toLowerCase()} strategy and operations.`,
        {
          roleCategory: 'consultancy',
          meta: baseMeta({ consultancyRoute: true, workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Leisure consultancy.'),
        }
      )
      addAcademic(true)
      break
    }

    case 'commercial_analytical': {
      add(
        `${S} Commercial Support Assistant`,
        'foundation_operational_support',
        `Supports ${S.toLowerCase()} reporting and booking admin.`,
        {
          academicRequirement: 'none',
          meta: baseMeta({
            lowBarrierOperational: false,
            workInMyEducationPriority: 'secondary',
            vocationalRoute: true,
          }),
          eligibilityNote: note(
            'Commercial support — limited ops context; analytical/commercial education routes preferred above this.'
          ),
        }
      )
      add(
        `${S} Analyst Trainee / Apprentice`,
        'trainee_vocational_entry',
        `Trainee analyst supporting ${S.toLowerCase()} dashboards and pricing.`,
        {
          academicRequirement: 'none',
          meta: baseMeta({
            vocationalRoute: true,
            apprenticeshipRoute: true,
            workInMyEducationPriority: 'secondary',
          }),
          eligibilityNote: note('Commercial/analytical vocational entry.'),
        }
      )
      add(
        `${S} Graduate Analyst / Management Trainee`,
        'graduate_management_entry',
        `Graduate analyst or commercial trainee in ${S.toLowerCase()}.`,
        {
          roleCategory: 'technical_specialist',
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(
            'Graduate revenue/commercial entry — strong Work in My Education fit.'
          ),
        }
      )
      add(
        `${S} Analyst / Coordinator`,
        'supervisor_coordinator',
        `Delivers ${S.toLowerCase()} analysis, forecasts and commercial actions.`,
        {
          roleCategory: 'technical_specialist',
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(`${S} analyst/coordinator.`),
        }
      )
      add(
        `${S} Manager`,
        'professional_practitioner_manager',
        `Manages ${S.toLowerCase()} performance, pricing and commercial plans.`,
        {
          roleCategory: 'technical_specialist',
          meta: baseMeta({
            mastersExpectation: def.mastersUseful ? 'desirable' : 'optional',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(
            `${S} manager — commercial evidence required beyond qualification.`
          ),
        }
      )
      add(
        `Senior ${S} Manager`,
        'experienced_specialist_senior_manager',
        `Senior commercial specialist owning complex ${S.toLowerCase()} remits.`,
        {
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'degree_relevant',
          meta: baseMeta({
            mastersExpectation: def.mastersUseful ? 'commonly_expected' : 'desirable',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(
            `Senior ${S} — Master's may help advanced revenue strategy; not automatic seniority.`
          ),
        }
      )
      add(
        `Head of ${S}`,
        'head_multisite_leadership',
        `Heads ${S.toLowerCase()} for a hotel group, attraction or operator.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note('Head of revenue/commercial — future progression.'),
        }
      )
      add(
        `Director of ${S} / Commercial Director`,
        'director_general_management',
        `Commercial director accountable for ${S.toLowerCase()}.`,
        {
          meta: baseMeta({
            mastersExpectation: 'desirable',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note('Commercial director — future progression only.'),
        }
      )
      add(
        `${S} Consultant`,
        'executive_ownership_consultancy',
        `Consults on ${S.toLowerCase()} strategy and systems.`,
        {
          roleCategory: 'consultancy',
          meta: baseMeta({
            consultancyRoute: true,
            mastersExpectation: 'desirable',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note('Hospitality commercial consultancy.'),
        }
      )
      addAcademic(true)
      break
    }

    case 'sustainability_policy': {
      add(
        `${S} Project Support Assistant`,
        'foundation_operational_support',
        `Supports ${S.toLowerCase()} projects with data and stakeholder logistics.`,
        {
          academicRequirement: 'none',
          meta: baseMeta({
            lowBarrierOperational: false,
            workInMyEducationPriority: 'secondary',
          }),
          eligibilityNote: note('Sustainability project support.'),
        }
      )
      add(
        `${S} Graduate Officer`,
        'graduate_management_entry',
        `Graduate officer supporting ${S.toLowerCase()} programmes.`,
        {
          meta: baseMeta({
            mastersExpectation: 'desirable',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(
            'Graduate sustainable tourism/hospitality entry — strong education-route fit.'
          ),
        }
      )
      add(
        `${S} Officer / Coordinator`,
        'supervisor_coordinator',
        `Coordinates ${S.toLowerCase()} initiatives and reporting.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(`${S} officer.`),
        }
      )
      add(
        `${S} Manager / Specialist`,
        'professional_practitioner_manager',
        `Delivers ${S.toLowerCase()} strategy for destinations or hospitality groups.`,
        {
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'degree_relevant',
          meta: baseMeta({
            mastersExpectation: def.mastersUseful ? 'commonly_expected' : 'desirable',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(`${S} specialist — Master's often useful.`),
        }
      )
      add(
        `Senior ${S} Specialist`,
        'experienced_specialist_senior_manager',
        `Senior specialist owning complex ${S.toLowerCase()} programmes.`,
        {
          academicRequirement: 'masters_relevant',
          meta: baseMeta({
            mastersExpectation: 'commonly_expected',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(`Senior ${S} specialist.`),
        }
      )
      add(
        `Head of ${S}`,
        'head_multisite_leadership',
        `Heads ${S.toLowerCase()} for a destination or hospitality group.`,
        {
          meta: baseMeta({ workInMyEducationPriority: 'primary' }),
          eligibilityNote: note(`Head of ${S} — future progression.`),
        }
      )
      add(
        `Director of ${S}`,
        'director_general_management',
        `Director accountable for ${S.toLowerCase()} strategy.`,
        {
          meta: baseMeta({
            mastersExpectation: 'desirable',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note('Sustainability/policy director — future progression.'),
        }
      )
      add(
        `${S} Consultant`,
        'executive_ownership_consultancy',
        `Consults on ${S.toLowerCase()} for destinations and operators.`,
        {
          roleCategory: 'consultancy',
          meta: baseMeta({
            consultancyRoute: true,
            mastersExpectation: 'desirable',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note('Sustainability consultancy.'),
        }
      )
      addAcademic(true)
      break
    }

    case 'academic_focus': {
      add(
        `${S} Research Support Assistant`,
        'foundation_operational_support',
        `Supports literature, surveys and events for ${S.toLowerCase()}.`,
        {
          academicRequirement: 'none',
          roleCategory: 'research',
          meta: baseMeta({
            lowBarrierOperational: false,
            workInMyEducationPriority: 'secondary',
          }),
          eligibilityNote: note('Research support.'),
        }
      )
      add(
        `${S} Graduate Research Assistant`,
        'graduate_management_entry',
        `Graduate research assistant on ${S.toLowerCase()} projects.`,
        {
          roleCategory: 'research',
          meta: baseMeta({
            mastersExpectation: 'desirable',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note('Graduate research assistant.'),
        }
      )
      add(
        `${S} Research Officer`,
        'professional_practitioner_manager',
        `Produces applied research in ${S.toLowerCase()}.`,
        {
          roleCategory: 'research',
          academicRequirement: 'masters_relevant',
          meta: baseMeta({
            mastersExpectation: 'commonly_expected',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(`${S} research officer.`),
        }
      )
      add(
        `Senior ${S} Researcher`,
        'experienced_specialist_senior_manager',
        `Senior researcher leading ${S.toLowerCase()} programmes.`,
        {
          academicRequirement: 'phd_relevant',
          isResearchRole: true,
          roleCategory: 'research',
          meta: baseMeta({
            mastersExpectation: 'required',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note('Senior researcher — PhD typically required.'),
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
