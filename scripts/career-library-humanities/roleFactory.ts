/**
 * Role factory for Humanities & Social Sciences — unique UK titles per specialism.
 * Graduate entry never requires professional registration.
 */

import { r, type HssStageKey, type SpecialismPack, type RoleSeed } from './shared'

export type RouteProfile =
  | 'social_research'
  | 'heritage_history'
  | 'geography'
  | 'politics_policy'
  | 'philosophy_religion'
  | 'psychology_academic'
  | 'culture_media'

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
  return `${detail} Distinct from Languages & Literature, Arts creative industries, Healthcare clinical psychology, Education QTS teaching, Law and Business management.`
}

export function buildRoles(def: SpecDef): RoleSeed[] {
  const S = def.short
  const noun = def.practitionerNoun ?? 'Officer'
  const roles: RoleSeed[] = []
  let p = 10

  const add = (
    name: string,
    stage: HssStageKey,
    description: string,
    opts: Partial<Parameters<typeof r>[3]> & { eligibilityNote: string; priority?: number }
  ) => {
    const isEntry =
      stage === 'foundation_social_support' || stage === 'graduate_social_sciences_entry'
    roles.push(
      r(name, stage, description, {
        priority: opts.priority ?? p,
        ...opts,
        // Force: graduate/foundation never require professional registration
        professionalRegistrationRequirement: isEntry
          ? 'none'
          : (opts.professionalRegistrationRequirement ?? 'none'),
        isRegulatedOrRestricted: isEntry ? false : (opts.isRegulatedOrRestricted ?? false),
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
        professionalRegistrationRequirement: 'none',
        eligibilityNote: note(
          `PhD academic track in ${S} — separate from professional practice seniority.`
        ),
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
        professionalRegistrationRequirement: 'none',
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
        eligibilityNote: note('Professor — future progression; PhD required.'),
      }
    )
  }

  // Shared professional ladder used by most profiles
  const ladder = (opts: {
    supportTitle: string
    supportDesc: string
    graduateTitle: string
    graduateDesc: string
    practitionerTitle: string
    practitionerDesc: string
    experiencedTitle: string
    experiencedDesc: string
    seniorTitle: string
    seniorDesc: string
    leadTitle: string
    leadDesc: string
    execTitle: string
    execDesc: string
    extraExperienced?: Partial<Parameters<typeof r>[3]>
  }) => {
    add(opts.supportTitle, 'foundation_social_support', opts.supportDesc, {
      academicRequirement: 'none',
      professionalRegistrationRequirement: 'none',
      eligibilityNote: note('Foundation support — no professional registration required.'),
    })
    add(opts.graduateTitle, 'graduate_social_sciences_entry', opts.graduateDesc, {
      professionalRegistrationRequirement: 'none',
      eligibilityNote: note(
        'Graduate entry — relevant degree commonly expected; professional registration not required.'
      ),
    })
    add(opts.practitionerTitle, 'professional_practitioner', opts.practitionerDesc, {
      eligibilityNote: note(`Professional ${S} practitioner.`),
    })
    add(opts.experiencedTitle, 'experienced_specialist', opts.experiencedDesc, {
      academicRequirement: def.mastersUseful ? 'masters_relevant' : 'degree_relevant',
      eligibilityNote: note(
        `Experienced ${S} specialist — Master’s may help niches; not automatic seniority.`
      ),
      ...opts.extraExperienced,
    })
    add(opts.seniorTitle, 'senior_specialist', opts.seniorDesc, {
      eligibilityNote: note(`Senior ${S} specialist.`),
    })
    add(opts.leadTitle, 'leadership', opts.leadDesc, {
      fitClassification: 'future_progression',
      eligibilityNote: note(`${S} leadership — future progression.`),
    })
    add(opts.execTitle, 'executive_director', opts.execDesc, {
      fitClassification: 'future_progression',
      eligibilityNote: note(`${S} director — future progression only.`),
    })
    addAcademic()
  }

  switch (def.profile) {
    case 'social_research':
      ladder({
        supportTitle: `Research Assistant (${S})`,
        supportDesc: `Supports ${S.toLowerCase()} projects with scheduling, data entry and participant logistics.`,
        graduateTitle: `Social Research Assistant (${S})`,
        graduateDesc: `Graduate research assistant supporting ${S.toLowerCase()} surveys, fieldwork or evidence reviews.`,
        practitionerTitle: `Policy Support Officer (${S})`,
        practitionerDesc: `Delivers applied ${S.toLowerCase()} research or policy support for public, voluntary or commercial clients.`,
        experiencedTitle: `Research Officer (${S})`,
        experiencedDesc: `Designs and delivers complex ${S.toLowerCase()} research or evaluation projects.`,
        seniorTitle: `Programme Coordinator (${S})`,
        seniorDesc: `Coordinates major ${S.toLowerCase()} programmes and mentors junior researchers.`,
        leadTitle: `Programme Lead (${S})`,
        leadDesc: `Leads ${S.toLowerCase()} research or programme teams and stakeholder delivery.`,
        execTitle: `Director of ${S} / Head of Research`,
        execDesc: `Director-level leadership of ${S.toLowerCase()} capability or research function.`,
      })
      // Extra natural UK practical routes (unique per specialism)
      add(`Charity Project Assistant (${S})`, 'graduate_social_sciences_entry', `Supports charity or NGO project delivery using ${S.toLowerCase()} skills.`, {
        professionalRegistrationRequirement: 'none',
        eligibilityNote: note('Practical charity project support — no professional registration required.'),
      })
      add(`Community Engagement Officer (${S})`, 'professional_practitioner', `Delivers community engagement and outreach linked to ${S.toLowerCase()}.`, {
        eligibilityNote: note('Community engagement officer — practical public/voluntary sector route.'),
      })
      add(`Project Coordinator (${S})`, 'professional_practitioner', `Coordinates projects and stakeholders in ${S.toLowerCase()}-related programmes.`, {
        eligibilityNote: note('Project coordinator — practical delivery route.'),
      })
      add(`Public Sector Officer (${S})`, 'professional_practitioner', `Public sector officer supporting programmes informed by ${S.toLowerCase()}.`, {
        eligibilityNote: note('Public sector officer — practical civil society / government route.'),
      })
      add(`NGO / Charity Administrator (${S})`, 'foundation_social_support', `Administers NGO or charity operations with ${S.toLowerCase()} context.`, {
        academicRequirement: 'none',
        professionalRegistrationRequirement: 'none',
        eligibilityNote: note('Foundation NGO/charity admin — no professional registration required.'),
      })
      add(`Monitoring & Evaluation Officer (${S})`, 'experienced_specialist', `Delivers monitoring and evaluation for ${S.toLowerCase()}-related programmes.`, {
        eligibilityNote: note('M&E officer — typically needs project experience.'),
      })
      add(`Policy Officer (${S})`, 'experienced_specialist', `Develops policy briefings and evidence products linked to ${S.toLowerCase()}.`, {
        eligibilityNote: note('Policy officer — progression route with sector experience.'),
      })
      break

    case 'heritage_history':
      ladder({
        supportTitle: `${S} Museum / Archive Assistant`,
        supportDesc: `Supports collections, visitor services or dig/site admin linked to ${S.toLowerCase()}.`,
        graduateTitle: `${S} Graduate Trainee`,
        graduateDesc: `Graduate trainee in museums, archives, heritage or fieldwork for ${S.toLowerCase()}.`,
        practitionerTitle: `${S} ${noun}`,
        practitionerDesc: `Professional ${noun.toLowerCase()} delivering ${S.toLowerCase()} interpretation, curation support or research projects.`,
        experiencedTitle: `${S} Specialist`,
        experiencedDesc: `Experienced specialist owning complex ${S.toLowerCase()} research, curation or fieldwork briefs.`,
        seniorTitle: `Senior ${S} Specialist`,
        seniorDesc: `Senior specialist leading major ${S.toLowerCase()} programmes and quality standards.`,
        leadTitle: `${S} Project / Collections Lead`,
        leadDesc: `Leads ${S.toLowerCase()} projects, collections or interpretation teams.`,
        execTitle: `Head of ${S}`,
        execDesc: `Heads ${S.toLowerCase()} for a museum, heritage body, local authority or research unit.`,
      })
      break

    case 'geography':
      ladder({
        supportTitle: `${S} Field / Data Assistant`,
        supportDesc: `Supports ${S.toLowerCase()} fieldwork logistics, mapping prep and data admin.`,
        graduateTitle: `${S} Graduate Analyst`,
        graduateDesc: `Graduate analyst supporting ${S.toLowerCase()} mapping, research or policy evidence.`,
        practitionerTitle: `${S} Analyst / ${noun}`,
        practitionerDesc: `Applies ${S.toLowerCase()} methods in planning support, environment, research or public-sector analysis.`,
        experiencedTitle: `Experienced ${S} Specialist`,
        experiencedDesc: `Experienced specialist delivering complex ${S.toLowerCase()} analysis and stakeholder projects.`,
        seniorTitle: `Senior ${S} Specialist`,
        seniorDesc: `Senior specialist leading ${S.toLowerCase()} workstreams and mentoring juniors.`,
        leadTitle: `${S} Team Lead`,
        leadDesc: `Leads ${S.toLowerCase()} analytical or research teams.`,
        execTitle: `Head of ${S}`,
        execDesc: `Heads ${S.toLowerCase()} for an organisation, consultancy or public body.`,
      })
      break

    case 'politics_policy':
      ladder({
        supportTitle: `Programme Assistant (${S})`,
        supportDesc: `Supports political, diplomatic or think-tank offices with admin linked to ${S.toLowerCase()}.`,
        graduateTitle: `Policy Support Officer (${S})`,
        graduateDesc: `Graduate policy support officer researching and drafting materials on ${S.toLowerCase()} topics.`,
        practitionerTitle: `Public Sector Officer (${S})`,
        practitionerDesc: `Develops and communicates ${S.toLowerCase()} policy positions and briefings.`,
        experiencedTitle: `Policy Officer (${S})`,
        experiencedDesc: `Owns complex ${S.toLowerCase()} dossiers and stakeholder engagement.`,
        seniorTitle: `Programme Coordinator (${S})`,
        seniorDesc: `Coordinates organisational programmes on ${S.toLowerCase()} issues.`,
        leadTitle: `Programme Lead (${S})`,
        leadDesc: `Leads ${S.toLowerCase()} policy teams and partnerships.`,
        execTitle: `Director of ${S} / Head of Policy`,
        execDesc: `Director-level leadership of ${S.toLowerCase()} policy or international affairs functions.`,
      })
      add(`Charity Project Assistant (${S})`, 'graduate_social_sciences_entry', `Supports NGO or advocacy project delivery on ${S.toLowerCase()} themes.`, {
        professionalRegistrationRequirement: 'none',
        eligibilityNote: note('Practical charity project support — no professional registration required.'),
      })
      add(`Community Engagement Officer (${S})`, 'professional_practitioner', `Delivers community and stakeholder engagement on ${S.toLowerCase()} issues.`, {
        eligibilityNote: note('Community engagement — practical public/voluntary sector route.'),
      })
      add(`Project Coordinator (${S})`, 'professional_practitioner', `Coordinates projects linked to ${S.toLowerCase()} policy or programmes.`, {
        eligibilityNote: note('Project coordinator — practical delivery route.'),
      })
      break

    case 'philosophy_religion':
      ladder({
        supportTitle: `${S} Programme Support Assistant`,
        supportDesc: `Supports ${S.toLowerCase()} education programmes, chaplaincy admin or public engagement logistics.`,
        graduateTitle: `${S} Graduate Outreach Assistant`,
        graduateDesc: `Graduate outreach assistant delivering ${S.toLowerCase()} public programmes.`,
        practitionerTitle: `${S} Education / Engagement ${noun}`,
        practitionerDesc: `Delivers ${S.toLowerCase()} education, dialogue or community engagement programmes.`,
        experiencedTitle: `${S} Specialist Adviser`,
        experiencedDesc: `Advises organisations on ${S.toLowerCase()} content, ethics programmes or community relations.`,
        seniorTitle: `Senior ${S} Specialist`,
        seniorDesc: `Senior specialist leading complex ${S.toLowerCase()} programmes and partnerships.`,
        leadTitle: `${S} Programme Lead`,
        leadDesc: `Leads ${S.toLowerCase()} education or engagement teams.`,
        execTitle: `Head of ${S} Education / Engagement`,
        execDesc: `Heads ${S.toLowerCase()} education or engagement for an institution.`,
      })
      break

    case 'psychology_academic':
      ladder({
        supportTitle: 'Psychology Research Admin Assistant',
        supportDesc:
          'Supports academic psychology labs with participant booking, data entry and ethics paperwork.',
        graduateTitle: 'Graduate Psychology Research Assistant',
        graduateDesc:
          'Graduate RA supporting experimental, survey or developmental psychology research (non-clinical).',
        practitionerTitle: 'Academic Psychology Research Officer',
        practitionerDesc:
          'Delivers non-clinical psychology research projects in universities, labs or applied research units.',
        experiencedTitle: 'Experienced Academic Psychology Researcher',
        experiencedDesc:
          'Designs studies and analyses complex psychological datasets in academic/applied research settings.',
        seniorTitle: 'Senior Academic Psychology Specialist',
        seniorDesc:
          'Leads research programmes and supervises junior researchers (non-clinical).',
        leadTitle: 'Psychology Research Programme Lead',
        leadDesc: 'Leads academic or applied psychology research programmes (non-clinical).',
        execTitle: 'Head of Psychology (Academic Department)',
        execDesc: 'Heads an academic psychology department or school unit.',
        extraExperienced: { academicRequirement: 'masters_relevant' },
      })
      break

    case 'culture_media':
      ladder({
        supportTitle: `${S} Programme Admin Assistant`,
        supportDesc: `Supports ${S.toLowerCase()} teaching centres, cultural programmes or research admin.`,
        graduateTitle: `${S} Graduate Research / Comms Assistant`,
        graduateDesc: `Graduate assistant supporting ${S.toLowerCase()} research, analysis or institutional communications.`,
        practitionerTitle: `${S} Analyst / ${noun}`,
        practitionerDesc: `Analyses ${S.toLowerCase()} issues or delivers education and engagement work.`,
        experiencedTitle: `${S} Specialist`,
        experiencedDesc: `Experienced specialist in ${S.toLowerCase()} research, criticism or strategic analysis.`,
        seniorTitle: `Senior ${S} Specialist`,
        seniorDesc: `Senior specialist leading complex ${S.toLowerCase()} projects and mentoring juniors.`,
        leadTitle: `${S} Programme Lead`,
        leadDesc: `Leads ${S.toLowerCase()} programmes in HE, cultural or public-sector settings.`,
        execTitle: `Head of ${S}`,
        execDesc: `Heads ${S.toLowerCase()} for a faculty unit, institute or organisation.`,
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
