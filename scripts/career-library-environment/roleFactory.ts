/**
 * Role factory for Environment, Agriculture & Food — unique UK titles.
 */

import { r, type EafStageKey, type SpecialismPack, type RoleSeed } from './shared'

export type RouteProfile =
  | 'agriculture'
  | 'animal_livestock'
  | 'food'
  | 'environment_conservation'
  | 'forestry_horticulture'
  | 'rural_land'
  | 'policy_consultancy'

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
  return `${detail} Distinct from Natural Sciences laboratory Environmental Science, Engineering, Construction, Healthcare nutrition/dietetics clinical routes, Business general management and Logistics.`
}

export function buildRoles(def: SpecDef): RoleSeed[] {
  const S = def.short
  const noun = def.practitionerNoun ?? 'Officer'
  const roles: RoleSeed[] = []
  let p = 10

  const add = (
    name: string,
    stage: EafStageKey,
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
        eligibilityNote: note(`PhD track in ${S} — academic/research, not automatic operations seniority.`),
      }
    )
    add(
      `Research Fellow (${S})`,
      'academic_research',
      `Research fellow advancing applied or scientific scholarship in ${S.toLowerCase()}.`,
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

  const ladder = (o: {
    tech: string
    techDesc: string
    grad: string
    gradDesc: string
    prac: string
    pracDesc: string
    exp: string
    expDesc: string
    sen: string
    senDesc: string
    lead: string
    leadDesc: string
    exec: string
    execDesc: string
  }) => {
    add(o.tech, 'foundation_technical_support', o.techDesc, {
      academicRequirement: 'none',
      roleCategory: 'site_delivery',
      eligibilityNote: note('Technical support — degree not required.'),
    })
    add(o.grad, 'graduate_entry', o.gradDesc, {
      eligibilityNote: note('Graduate entry — relevant degree commonly expected.'),
    })
    add(o.prac, 'professional_practitioner', o.pracDesc, {
      eligibilityNote: note(`Professional ${S} practitioner.`),
    })
    add(o.exp, 'experienced_specialist', o.expDesc, {
      academicRequirement: def.mastersUseful ? 'masters_relevant' : 'degree_relevant',
      eligibilityNote: note(
        `Experienced ${S} specialist — Master’s may help niches; not automatic seniority.`
      ),
    })
    add(o.sen, 'senior_specialist', o.senDesc, {
      eligibilityNote: note(`Senior ${S} specialist.`),
    })
    add(o.lead, 'leadership_operations', o.leadDesc, {
      fitClassification: 'future_progression',
      roleCategory: 'leadership',
      eligibilityNote: note(`${S} operations leadership — future progression.`),
    })
    add(o.exec, 'executive_director', o.execDesc, {
      fitClassification: 'future_progression',
      roleCategory: 'leadership',
      eligibilityNote: note(`${S} director — future progression only.`),
    })
    addAcademic()
  }

  switch (def.profile) {
    case 'agriculture':
      ladder({
        tech: `${S} Technician`,
        techDesc: `Supports ${S.toLowerCase()} field trials, farm operations or crop/soil recording under supervision.`,
        // Avoid Natural Sciences "Soil Science Graduate Trainee" title collision
        grad:
          def.slug === 'soil-science'
            ? 'Soil Science Land / Farm Graduate Trainee'
            : `${S} Graduate Trainee`,
        gradDesc: `Graduate trainee building ${S.toLowerCase()} competence on farm, trials or agribusiness schemes.`,
        prac: `${S} ${noun}`,
        pracDesc: `Practising ${noun.toLowerCase()} delivering ${S.toLowerCase()} advice, production or technical services.`,
        exp: `Experienced ${S} Specialist`,
        expDesc: `Experienced specialist owning complex ${S.toLowerCase()} programmes, trials or client accounts.`,
        sen: `Senior ${S} Specialist`,
        senDesc: `Senior specialist mentoring juniors and leading technical quality in ${S.toLowerCase()}.`,
        lead: `${S} Operations / Farm Lead`,
        leadDesc: `Leads ${S.toLowerCase()} operations, farm units or technical teams.`,
        exec: `Director of ${S} / Head of Production`,
        execDesc: `Director-level leadership of ${S.toLowerCase()} production or agribusiness functions.`,
      })
      break

    case 'animal_livestock':
      ladder({
        tech: `${S} Technician / Stockperson Support`,
        techDesc: `Supports livestock handling, recording and husbandry routines for ${S.toLowerCase()}.`,
        grad: `${S} Graduate Trainee`,
        gradDesc: `Graduate trainee in ${S.toLowerCase()} production, breeding support or animal science schemes.`,
        prac: `${S} ${noun}`,
        pracDesc: `Delivers ${S.toLowerCase()} husbandry, production or technical advisory work.`,
        exp: `Experienced ${S} Specialist`,
        expDesc: `Owns complex ${S.toLowerCase()} production, welfare or breeding programmes.`,
        sen: `Senior ${S} Specialist`,
        senDesc: `Senior specialist leading ${S.toLowerCase()} technical standards and mentoring.`,
        lead: `${S} Unit / Herd Manager`,
        leadDesc: `Manages ${S.toLowerCase()} units, herds or flocks and day-to-day operations.`,
        exec: `Head of ${S} / Livestock Director`,
        execDesc: `Heads ${S.toLowerCase()} livestock enterprises or business units.`,
      })
      break

    case 'food':
      ladder({
        tech: `${S} Laboratory / Plant Technician`,
        techDesc: `Supports ${S.toLowerCase()} sampling, QC checks and production-line technical tasks.`,
        grad: `${S} Graduate Technologist`,
        gradDesc: `Graduate technologist joining ${S.toLowerCase()} NPD, QC or manufacturing schemes.`,
        prac: `${S} ${noun}`,
        pracDesc: `Delivers ${S.toLowerCase()} product development, safety, quality or process work.`,
        exp: `Experienced ${S} Specialist`,
        expDesc: `Owns complex ${S.toLowerCase()} projects across plants, brands or regulatory dossiers.`,
        sen: `Senior ${S} Specialist`,
        senDesc: `Senior specialist leading ${S.toLowerCase()} technical excellence and mentoring.`,
        lead: `${S} Technical / Operations Lead`,
        leadDesc: `Leads ${S.toLowerCase()} technical or operations teams in manufacturing or retail.`,
        exec: `Head of ${S} / Technical Director`,
        execDesc: `Director-level leadership of ${S.toLowerCase()} technical or food-safety functions.`,
      })
      break

    case 'environment_conservation':
      ladder({
        tech: `${S} Field Assistant`,
        techDesc: `Supports surveys, habitat works and monitoring for ${S.toLowerCase()}.`,
        grad: `${S} Graduate Officer`,
        gradDesc: `Graduate officer supporting ${S.toLowerCase()} projects, surveys or site management.`,
        prac: `${S} ${noun}`,
        pracDesc: `Delivers ${S.toLowerCase()} projects, site advice or conservation delivery.`,
        exp: `Experienced ${S} Specialist`,
        expDesc: `Owns complex ${S.toLowerCase()} programmes, EIAs support or habitat plans.`,
        sen: `Senior ${S} Specialist`,
        senDesc: `Senior specialist leading ${S.toLowerCase()} technical quality and mentoring.`,
        lead: `${S} Programme / Site Lead`,
        leadDesc: `Leads ${S.toLowerCase()} programmes, sites or multi-partner delivery.`,
        exec: `Head of ${S} / Director of Environment`,
        execDesc: `Heads ${S.toLowerCase()} or environmental services for an organisation.`,
      })
      break

    case 'forestry_horticulture':
      ladder({
        tech: `${S} Technical Operative`,
        techDesc: `Supports planting, maintenance and site works for ${S.toLowerCase()}.`,
        grad: `${S} Graduate Trainee`,
        gradDesc: `Graduate trainee in ${S.toLowerCase()} estates, nurseries or woodland schemes.`,
        prac: `${S} ${noun}`,
        pracDesc: `Delivers ${S.toLowerCase()} management, arboricultural or horticultural practice.`,
        exp: `Experienced ${S} Specialist`,
        expDesc: `Owns complex ${S.toLowerCase()} contracts, estates or woodland plans.`,
        sen: `Senior ${S} Specialist`,
        senDesc: `Senior specialist leading ${S.toLowerCase()} technical standards and mentoring.`,
        lead: `${S} Operations Manager`,
        leadDesc: `Manages ${S.toLowerCase()} operations, crews and seasonal programmes.`,
        exec: `Head of ${S}`,
        execDesc: `Heads ${S.toLowerCase()} for a local authority, estate or commercial organisation.`,
      })
      break

    case 'rural_land':
      ladder({
        tech: `${S} Estate Support Assistant`,
        techDesc: `Supports rural estate admin, land records and site logistics for ${S.toLowerCase()}.`,
        grad: `${S} Graduate Trainee`,
        gradDesc: `Graduate trainee in ${S.toLowerCase()} agency, estate or rural business schemes.`,
        prac: `${S} ${noun}`,
        pracDesc: `Delivers ${S.toLowerCase()} advice, tenancy support or land-management practice.`,
        exp: `Experienced ${S} Specialist`,
        expDesc: `Owns complex ${S.toLowerCase()} portfolios, tenancies or rural projects.`,
        sen: `Senior ${S} Specialist`,
        senDesc: `Senior specialist leading ${S.toLowerCase()} client work and mentoring.`,
        lead: `${S} / Estate Manager`,
        leadDesc: `Manages estates or ${S.toLowerCase()} operations and teams.`,
        exec: `Director of ${S} / Head of Estates`,
        execDesc: `Director-level leadership of ${S.toLowerCase()} or rural estate functions.`,
      })
      break

    case 'policy_consultancy':
      ladder({
        tech: `${S} Project Support Assistant`,
        techDesc: `Supports ${S.toLowerCase()} projects with data gathering, filing and client logistics.`,
        grad: `${S} Graduate Consultant / Officer`,
        gradDesc: `Graduate consultant or policy officer supporting ${S.toLowerCase()} briefs.`,
        prac: `${S} ${noun}`,
        pracDesc: `Delivers ${S.toLowerCase()} advice, assessments or policy analysis.`,
        exp: `Experienced ${S} Specialist`,
        expDesc: `Owns complex ${S.toLowerCase()} client or policy workstreams.`,
        sen: `Senior ${S} Specialist`,
        senDesc: `Senior specialist leading ${S.toLowerCase()} quality and mentoring juniors.`,
        lead: `${S} Practice / Programme Lead`,
        leadDesc: `Leads ${S.toLowerCase()} practice groups or policy programmes.`,
        exec: `Director of ${S}`,
        execDesc: `Director accountable for ${S.toLowerCase()} service lines or policy functions.`,
      })
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
    roles: buildRoles(def),
  }
}
