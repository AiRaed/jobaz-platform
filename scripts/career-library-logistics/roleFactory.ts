/**
 * Role factory for Logistics, Supply Chain & Transport Management.
 * Work in My Education focus — management/planning/analytics over driver/operative roles.
 */

import {
  r,
  type LsctStageKey,
  type SpecialismPack,
  type RoleSeed,
  type RoleMeta,
  type MastersExpectation,
  type LicenceLevel,
} from './shared'

export type RouteProfile =
  | 'supply_chain'
  | 'procurement'
  | 'warehouse_inventory'
  | 'planning'
  | 'transport_distribution'
  | 'maritime_port'
  | 'aviation'
  | 'fleet_road'
  | 'trade_compliance'
  | 'sector_logistics'
  | 'analytics'
  | 'sustainability'
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
  includeCsco?: boolean
  skipFoundation?: boolean
  licenceHints?: Array<{ name: string; level: LicenceLevel; note?: string }>
  professionalQualification?: string | null
}

function note(detail: string) {
  return `${detail} Distinct from Engineering systems design, Business general ops, Finance accountancy, Construction site management, Hospitality venue ops, Environment land logistics and Government defence-policy routes. Driver, courier, forklift and warehouse-operative roles are limited foundation context for Work in My Education. Master's/PhD do not automatically grant management or director seniority.`
}

const CPC_LICENCE: RoleMeta['licences'] = [
  {
    name: 'Transport Manager CPC awareness',
    level: 'useful',
    note: 'Operator licence / Transport Manager CPC relevant for road-haulage O-licence holders — not required for all logistics managers',
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
    licences: def.licenceHints ?? [],
    professionalQualification: def.professionalQualification ?? null,
    ...extra,
  })

  const add = (
    name: string,
    stage: LsctStageKey,
    description: string,
    opts: Partial<Parameters<typeof r>[3]> & { eligibilityNote: string; priority?: number }
  ) => {
    const isEntry =
      stage === 'foundation_logistics_support' ||
      stage === 'apprentice_technical_entry' ||
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
          licences: [],
          workInMyEducationPriority: 'primary',
        }),
        eligibilityNote: note(`PhD track in ${S} — academic/research, not CSCO seniority.`),
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

  /** Standard management ladder used by most profiles */
  const ladder = (o: {
    foundation: string
    foundationDesc: string
    apprentice: string
    apprenticeDesc: string
    graduate: string
    graduateDesc: string
    practitioner: string
    practitionerDesc: string
    experienced: string
    experiencedDesc: string
    senior: string
    seniorDesc: string
    head: string
    headDesc: string
    director: string
    directorDesc: string
    extraLicences?: RoleMeta['licences']
    academicCompact?: boolean
  }) => {
    if (!def.skipFoundation) {
      add(o.foundation, 'foundation_logistics_support', o.foundationDesc, {
        academicRequirement: 'none',
        roleCategory: 'site_delivery',
        meta: baseMeta({
          lowBarrierOperational: true,
          workInMyEducationPriority: 'limited_context',
          vocationalRoute: true,
          licences: o.extraLicences ?? def.licenceHints ?? [],
        }),
        eligibilityNote: note(
          'Limited foundation/support context for Work in My Education — not a primary education-match recommendation. Not a driver/courier/warehouse-operative career focus.'
        ),
      })
    }
    add(o.apprentice, 'apprentice_technical_entry', o.apprenticeDesc, {
      academicRequirement: 'none',
      meta: baseMeta({
        vocationalRoute: true,
        apprenticeshipRoute: true,
        workInMyEducationPriority: 'secondary',
        licences: o.extraLicences ?? def.licenceHints ?? [],
      }),
      eligibilityNote: note('Apprentice/technical entry — valid alternative to degree.'),
    })
    add(o.graduate, 'graduate_management_entry', o.graduateDesc, {
      meta: baseMeta({
        workInMyEducationPriority: 'primary',
        licences: o.extraLicences ?? def.licenceHints ?? [],
      }),
      eligibilityNote: note(
        'Graduate management/analyst entry — relevant degree commonly expected; not automatic manager appointment.'
      ),
    })
    add(o.practitioner, 'professional_practitioner', o.practitionerDesc, {
      meta: baseMeta({
        workInMyEducationPriority: 'primary',
        licences: o.extraLicences ?? def.licenceHints ?? [],
        professionalQualification: def.professionalQualification ?? null,
      }),
      eligibilityNote: note(`${S} practitioner — experience required beyond qualification.`),
    })
    add(o.experienced, 'experienced_specialist', o.experiencedDesc, {
      academicRequirement: def.mastersUseful ? 'masters_relevant' : 'degree_relevant',
      meta: baseMeta({
        mastersExpectation: def.mastersUseful ? 'desirable' : 'optional',
        workInMyEducationPriority: 'primary',
        licences: o.extraLicences ?? def.licenceHints ?? [],
      }),
      eligibilityNote: note(
        `Experienced ${S} specialist — Master's may help strategy/analytics niches; not automatic seniority.`
      ),
    })
    add(o.senior, 'senior_manager', o.seniorDesc, {
      roleCategory: 'leadership',
      meta: baseMeta({ workInMyEducationPriority: 'primary' }),
      eligibilityNote: note(`Senior ${S} manager — future progression.`),
    })
    add(o.head, 'head_logistics_supply_chain', o.headDesc, {
      meta: baseMeta({
        mastersExpectation: def.mastersUseful ? 'desirable' : 'optional',
        workInMyEducationPriority: 'primary',
      }),
      eligibilityNote: note('Head of function — substantial experience required.'),
    })
    add(o.director, 'director_executive', o.directorDesc, {
      meta: baseMeta({
        mastersExpectation: 'desirable',
        workInMyEducationPriority: 'primary',
      }),
      eligibilityNote: note('Director/executive — future progression only.'),
    })
    if (def.includeCsco) {
      add(
        `Chief Supply Chain Officer Pathway (${S})`,
        'director_executive',
        `CSCO / group supply-chain executive pathway with a ${S.toLowerCase()} background.`,
        {
          meta: baseMeta({
            mastersExpectation: 'commonly_expected',
            workInMyEducationPriority: 'primary',
          }),
          eligibilityNote: note(
            'CSCO pathway — future progression only; extensive leadership evidence required.'
          ),
        }
      )
    }
    addAcademic(o.academicCompact ?? true)
  }

  switch (def.profile) {
    case 'supply_chain':
      ladder({
        foundation: `${S} Support Assistant`,
        foundationDesc: `Supports ${S.toLowerCase()} admin, tracking and stakeholder logistics under supervision.`,
        apprentice: `${S} Apprentice / Trainee Coordinator`,
        apprenticeDesc: `Apprentice building ${S.toLowerCase()} process and systems competence.`,
        graduate: `${S} Graduate Analyst / Management Trainee`,
        graduateDesc: `Graduate analyst or management trainee on a ${S.toLowerCase()} scheme.`,
        practitioner: `${S} Planner / Practitioner`,
        practitionerDesc: `Delivers ${S.toLowerCase()} planning, coordination and supplier/customer interfaces.`,
        experienced: `Experienced ${S} Specialist`,
        experiencedDesc: `Owns complex ${S.toLowerCase()} workstreams and continuous improvement.`,
        senior: `Senior ${S} Manager`,
        seniorDesc: `Senior manager leading ${S.toLowerCase()} teams and KPIs.`,
        head: `Head of ${S}`,
        headDesc: `Heads ${S.toLowerCase()} for a business unit or network.`,
        director: `Director of ${S} / Supply Chain Director`,
        directorDesc: `Director accountable for ${S.toLowerCase()} strategy and performance.`,
      })
      break

    case 'procurement':
      ladder({
        foundation: `${S} Administration Assistant`,
        foundationDesc: `Supports purchase orders, filing and supplier admin for ${S.toLowerCase()}.`,
        apprentice: `${S} Apprentice / Trainee Buyer`,
        apprenticeDesc: `Apprentice buyer developing ${S.toLowerCase()} competence.`,
        graduate: `${S} Graduate Buyer / Procurement Analyst`,
        graduateDesc: `Graduate buyer or procurement analyst in ${S.toLowerCase()}.`,
        practitioner: `${S} Buyer / Practitioner`,
        practitionerDesc: `Delivers ${S.toLowerCase()} sourcing, contracts and supplier management.`,
        experienced: `Experienced ${S} Specialist / Category Lead`,
        experiencedDesc: `Owns complex ${S.toLowerCase()} categories or contracts.`,
        // Avoid Business/AFB title collisions (e.g. Senior Procurement Manager, Head of Procurement)
        senior: `Senior ${S} Manager (Supply Chain)`,
        seniorDesc: `Senior procurement manager leading ${S.toLowerCase()} teams in a logistics/supply-chain setting.`,
        head: `Head of ${S} (Supply Chain)`,
        headDesc: `Heads ${S.toLowerCase()} for a logistics, manufacturing or retail supply-chain organisation.`,
        director: `Director of ${S} / Chief Procurement Officer Pathway`,
        directorDesc: `Director / CPO pathway for ${S.toLowerCase()}.`,
      })
      break

    case 'warehouse_inventory':
      ladder({
        foundation: `${S} Coordination Assistant`,
        foundationDesc: `Supports inventory records and warehouse coordination admin for ${S.toLowerCase()} — not a warehouse operative role.`,
        apprentice: `${S} Apprentice / Trainee Coordinator`,
        apprenticeDesc: `Apprentice coordinator in ${S.toLowerCase()} systems and processes.`,
        graduate: `${S} Graduate Coordinator / Analyst`,
        graduateDesc: `Graduate coordinator or inventory analyst in ${S.toLowerCase()}.`,
        practitioner: `${S} Coordinator / Analyst`,
        practitionerDesc: `Delivers ${S.toLowerCase()} accuracy, slotting and throughput planning.`,
        experienced: `Experienced ${S} Specialist`,
        experiencedDesc: `Owns complex ${S.toLowerCase()} improvement and network projects.`,
        senior: `${S} Manager`,
        seniorDesc: `Manages ${S.toLowerCase()} teams, KPIs and site/network performance.`,
        head: `Head of ${S}`,
        headDesc: `Heads ${S.toLowerCase()} across sites or a distribution network.`,
        director: `Director of ${S} / Distribution Operations`,
        directorDesc: `Director accountable for ${S.toLowerCase()} strategy.`,
        extraLicences: [
          {
            name: 'Health and safety awareness',
            level: 'employer_commonly_expects',
            note: 'Site H&S awareness commonly expected; forklift licence only if role includes driving — not the focus of this field',
          },
        ],
      })
      break

    case 'planning':
      ladder({
        foundation: `${S} Planning Support Assistant`,
        foundationDesc: `Supports data entry and plan packs for ${S.toLowerCase()}.`,
        apprentice: `${S} Apprentice Planner`,
        apprenticeDesc: `Apprentice planner building ${S.toLowerCase()} forecasting skills.`,
        graduate: `${S} Graduate Planner / Analyst`,
        graduateDesc: `Graduate planner or demand/supply analyst in ${S.toLowerCase()}.`,
        practitioner: `${S} Planner`,
        practitionerDesc: `Delivers ${S.toLowerCase()} plans, S&OP inputs and exception management.`,
        experienced: `Experienced ${S} Specialist`,
        experiencedDesc: `Owns complex ${S.toLowerCase()} scenarios and cross-functional alignment.`,
        senior: `Senior ${S} Manager`,
        seniorDesc: `Senior planning manager leading ${S.toLowerCase()} teams.`,
        head: `Head of ${S}`,
        headDesc: `Heads ${S.toLowerCase()} for a business or region.`,
        director: `Director of ${S} / Integrated Planning`,
        directorDesc: `Director accountable for ${S.toLowerCase()} strategy.`,
      })
      break

    case 'transport_distribution':
      ladder({
        foundation: `${S} Coordination Assistant`,
        foundationDesc: `Supports transport schedules and distribution admin for ${S.toLowerCase()} — not a driver role.`,
        apprentice: `${S} Apprentice / Trainee Coordinator`,
        apprenticeDesc: `Apprentice coordinator in ${S.toLowerCase()}.`,
        graduate: `${S} Graduate Coordinator / Analyst`,
        graduateDesc: `Graduate transport/distribution analyst in ${S.toLowerCase()}.`,
        practitioner: `${S} Coordinator / Practitioner`,
        practitionerDesc: `Coordinates ${S.toLowerCase()} networks, carriers and service levels.`,
        experienced: `Experienced ${S} Specialist`,
        experiencedDesc: `Owns complex ${S.toLowerCase()} network and cost initiatives.`,
        senior: `${S} Manager`,
        seniorDesc: `Manages ${S.toLowerCase()} operations and carrier performance.`,
        head: `Head of ${S}`,
        headDesc: `Heads ${S.toLowerCase()} for a network or region.`,
        director: `Director of ${S}`,
        directorDesc: `Director accountable for ${S.toLowerCase()} strategy.`,
        extraLicences: [...CPC_LICENCE, ...(def.licenceHints ?? [])],
      })
      break

    case 'maritime_port':
      ladder({
        foundation: `${S} Operations Support Assistant`,
        foundationDesc: `Supports port/shipping documentation and ops admin for ${S.toLowerCase()}.`,
        apprentice: `${S} Apprentice / Trainee Officer`,
        apprenticeDesc: `Apprentice officer in ${S.toLowerCase()}.`,
        graduate: `${S} Graduate Operations / Management Trainee`,
        graduateDesc: `Graduate trainee in ${S.toLowerCase()} operations.`,
        practitioner: `${S} Officer / Practitioner`,
        practitionerDesc: `Delivers ${S.toLowerCase()} planning, berth/cargo or shipping coordination.`,
        experienced: `Experienced ${S} Specialist`,
        experiencedDesc: `Owns complex ${S.toLowerCase()} programmes and stakeholder interfaces.`,
        senior: `${S} Manager`,
        seniorDesc: `Manages ${S.toLowerCase()} teams and operational performance.`,
        head: `Head of ${S}`,
        headDesc: `Heads ${S.toLowerCase()} for a port, line or terminal.`,
        director: `Director of ${S}`,
        directorDesc: `Director accountable for ${S.toLowerCase()} strategy.`,
      })
      break

    case 'aviation':
      ladder({
        foundation: `${S} Operations Support Assistant`,
        foundationDesc: `Supports ${S.toLowerCase()} admin and operational coordination under supervision.`,
        apprentice: `${S} Apprentice / Trainee Coordinator`,
        apprenticeDesc: `Apprentice coordinator in ${S.toLowerCase()}.`,
        graduate: `${S} Graduate Operations / Management Trainee`,
        graduateDesc: `Graduate trainee in ${S.toLowerCase()}.`,
        practitioner: `${S} Coordinator / Practitioner`,
        practitionerDesc: `Delivers ${S.toLowerCase()} planning and operational control.`,
        experienced: `Experienced ${S} Specialist`,
        experiencedDesc: `Owns complex ${S.toLowerCase()} programmes and compliance interfaces.`,
        senior: `${S} Manager`,
        seniorDesc: `Manages ${S.toLowerCase()} teams and service performance.`,
        head: `Head of ${S}`,
        headDesc: `Heads ${S.toLowerCase()} for an airport, airline or cargo handler.`,
        director: `Director of ${S}`,
        directorDesc: `Director accountable for ${S.toLowerCase()} strategy.`,
        extraLicences: [
          {
            name: 'Aviation security / airside awareness',
            level: 'employer_commonly_expects',
            note: 'Airside ID and security awareness commonly required for airport roles; not a driving licence focus',
          },
        ],
      })
      break

    case 'fleet_road':
      ladder({
        foundation: `${S} Administration Assistant`,
        foundationDesc: `Supports fleet records and compliance admin for ${S.toLowerCase()} — not a truck/van driver role.`,
        apprentice: `${S} Apprentice / Trainee Coordinator`,
        apprenticeDesc: `Apprentice coordinator in ${S.toLowerCase()}.`,
        graduate: `${S} Graduate Fleet / Transport Analyst`,
        graduateDesc: `Graduate analyst supporting ${S.toLowerCase()} utilisation and compliance.`,
        practitioner: `${S} Coordinator / Practitioner`,
        practitionerDesc: `Coordinates ${S.toLowerCase()} utilisation, maintenance planning and compliance.`,
        experienced: `Experienced ${S} Specialist`,
        experiencedDesc: `Owns complex ${S.toLowerCase()} cost, compliance and network initiatives.`,
        senior: `${S} Manager`,
        seniorDesc: `Manages ${S.toLowerCase()} teams and operator-licence compliance.`,
        head: `Head of ${S}`,
        headDesc: `Heads ${S.toLowerCase()} for a haulage or distribution business.`,
        director: `Director of ${S}`,
        directorDesc: `Director accountable for ${S.toLowerCase()} strategy.`,
        extraLicences: [
          ...CPC_LICENCE,
          {
            name: 'Operator licence awareness',
            level: 'employer_commonly_expects',
            note: 'Relevant for O-licence holders; not equivalent to HGV driver licensing as a career focus',
          },
        ],
      })
      break

    case 'trade_compliance':
      ladder({
        foundation: `${S} Documentation Assistant`,
        foundationDesc: `Supports trade documents and filings for ${S.toLowerCase()}.`,
        apprentice: `${S} Apprentice / Trainee Officer`,
        apprenticeDesc: `Apprentice officer in ${S.toLowerCase()}.`,
        graduate: `${S} Graduate Compliance / Trade Analyst`,
        graduateDesc: `Graduate analyst in ${S.toLowerCase()}.`,
        practitioner: `${S} Officer / Practitioner`,
        practitionerDesc: `Delivers ${S.toLowerCase()} declarations, controls and advisory support.`,
        experienced: `Experienced ${S} Specialist`,
        experiencedDesc: `Owns complex ${S.toLowerCase()} programmes and audits.`,
        senior: `Senior ${S} Manager`,
        seniorDesc: `Senior manager leading ${S.toLowerCase()} teams.`,
        head: `Head of ${S}`,
        headDesc: `Heads ${S.toLowerCase()} for an importer/exporter or logistics group.`,
        director: `Director of ${S}`,
        directorDesc: `Director accountable for ${S.toLowerCase()} strategy.`,
        extraLicences: [
          {
            name: 'Customs / trade compliance training',
            level: 'employer_commonly_expects',
            note: 'AEO, customs procedure and export-control awareness commonly expected',
          },
        ],
      })
      break

    case 'sector_logistics':
      ladder({
        foundation: `${S} Support Assistant`,
        foundationDesc: `Supports ${S.toLowerCase()} coordination and admin under supervision.`,
        apprentice: `${S} Apprentice / Trainee Coordinator`,
        apprenticeDesc: `Apprentice coordinator in ${S.toLowerCase()}.`,
        graduate: `${S} Graduate Analyst / Management Trainee`,
        graduateDesc: `Graduate trainee in ${S.toLowerCase()}.`,
        practitioner: `${S} Practitioner / Coordinator`,
        practitionerDesc: `Delivers ${S.toLowerCase()} planning and operational coordination.`,
        experienced: `Experienced ${S} Specialist`,
        experiencedDesc: `Owns complex ${S.toLowerCase()} programmes.`,
        senior: `Senior ${S} Manager`,
        seniorDesc: `Senior manager leading ${S.toLowerCase()} teams.`,
        head: `Head of ${S}`,
        headDesc: `Heads ${S.toLowerCase()} for an organisation or programme.`,
        director: `Director of ${S}`,
        directorDesc: `Director accountable for ${S.toLowerCase()} strategy.`,
      })
      break

    case 'analytics':
      ladder({
        foundation: `${S} Data Support Assistant`,
        foundationDesc: `Supports data cleaning and reporting packs for ${S.toLowerCase()}.`,
        apprentice: `${S} Apprentice Analyst`,
        apprenticeDesc: `Apprentice analyst building ${S.toLowerCase()} skills.`,
        graduate: `${S} Graduate Analyst`,
        graduateDesc: `Graduate analyst in ${S.toLowerCase()}.`,
        practitioner: `${S} Analyst / Practitioner`,
        practitionerDesc: `Delivers ${S.toLowerCase()} models, dashboards and decision support.`,
        experienced: `Experienced ${S} Specialist`,
        experiencedDesc: `Owns complex ${S.toLowerCase()} modelling and optimisation projects.`,
        senior: `Senior ${S} Manager`,
        seniorDesc: `Senior analytics manager leading ${S.toLowerCase()} teams.`,
        head: `Head of ${S}`,
        headDesc: `Heads ${S.toLowerCase()} for a logistics or manufacturing organisation.`,
        director: `Director of ${S} / Supply Chain Analytics`,
        directorDesc: `Director accountable for ${S.toLowerCase()} strategy.`,
      })
      break

    case 'sustainability':
      ladder({
        foundation: `${S} Project Support Assistant`,
        foundationDesc: `Supports ${S.toLowerCase()} reporting and project logistics.`,
        apprentice: `${S} Apprentice / Trainee Officer`,
        apprenticeDesc: `Apprentice officer in ${S.toLowerCase()}.`,
        graduate: `${S} Graduate Officer / Analyst`,
        graduateDesc: `Graduate officer supporting ${S.toLowerCase()} programmes.`,
        practitioner: `${S} Officer / Practitioner`,
        practitionerDesc: `Delivers ${S.toLowerCase()} initiatives and carbon/network reporting.`,
        experienced: `Experienced ${S} Specialist`,
        experiencedDesc: `Owns complex ${S.toLowerCase()} programmes.`,
        senior: `Senior ${S} Manager`,
        seniorDesc: `Senior manager leading ${S.toLowerCase()} teams.`,
        head: `Head of ${S}`,
        headDesc: `Heads ${S.toLowerCase()} for a logistics group.`,
        director: `Director of ${S}`,
        directorDesc: `Director accountable for ${S.toLowerCase()} strategy.`,
      })
      break

    case 'academic_focus':
      add(
        `${S} Research Support Assistant`,
        'foundation_logistics_support',
        `Supports literature and data tasks for ${S.toLowerCase()}.`,
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
        'professional_practitioner',
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
        'experienced_specialist',
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
