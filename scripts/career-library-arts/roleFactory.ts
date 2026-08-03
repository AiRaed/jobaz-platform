/**
 * Role factory for Arts, Media & Creative Industries — unique UK titles per specialism.
 */

import { r, type ArtsStageKey, type SpecialismPack, type RoleSeed } from './shared'

export type RouteProfile =
  | 'design_craft'
  | 'digital_interactive'
  | 'animation_vfx'
  | 'film_tv_video'
  | 'photography_visual'
  | 'fine_art_illustration'
  | 'music_audio'
  | 'performing'
  | 'fashion_textile_interior'
  | 'writing_journalism_publishing'
  | 'advertising_direction'
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
  includeAcademic?: boolean
  /** Junior title noun override e.g. Designer, Artist, Producer */
  juniorTitle?: string
}

function note(detail: string) {
  return `${detail} Distinct from IT software engineering, Architecture (RIBA practice), Business marketing management, and Law.`
}

export function buildRoles(def: SpecDef): RoleSeed[] {
  const S = def.short
  const junior = def.juniorTitle ?? 'Creative'
  const roles: RoleSeed[] = []
  let p = 10

  const add = (
    name: string,
    stage: ArtsStageKey,
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

  const designCat = def.profile === 'design_craft' || def.profile === 'digital_interactive' ||
    def.profile === 'fashion_textile_interior'
      ? ('design' as const)
      : undefined

  switch (def.profile) {
    case 'design_craft':
    case 'digital_interactive':
    case 'fashion_textile_interior': {
      add(
        `${S} Studio Assistant`,
        'foundation_creative_support',
        `Supports ${S.toLowerCase()} studios with file prep, asset organisation and production logistics.`,
        {
          academicRequirement: 'none',
          roleCategory: designCat,
          eligibilityNote: note('Studio support — degree not required; portfolio may help.'),
        }
      )
      add(
        `${S} Graduate ${junior}`,
        'graduate_creative_entry',
        `Graduate entry ${junior.toLowerCase()} delivering supervised ${S.toLowerCase()} briefs.`,
        {
          roleCategory: designCat,
          eligibilityNote: note(
            `Graduate ${S} entry — relevant degree/portfolio commonly expected; not senior by default.`
          ),
        }
      )
      add(
        `Junior ${S} ${junior}`,
        'junior_creative_professional',
        `Junior ${junior.toLowerCase()} producing ${S.toLowerCase()} work under creative direction.`,
        {
          roleCategory: designCat,
          academicRequirement: 'degree_relevant',
          eligibilityNote: note(`Junior ${S} ${junior.toLowerCase()} — early-career craft role.`),
        }
      )
      add(
        `${S} ${junior}`,
        'experienced_creative',
        `Experienced ${junior.toLowerCase()} owning ${S.toLowerCase()} briefs end-to-end.`,
        {
          roleCategory: designCat,
          eligibilityNote: note(
            `Experienced ${S} ${junior.toLowerCase()} — portfolio and delivery experience; Master’s not automatic seniority.`
          ),
        }
      )
      add(
        `Senior ${S} ${junior}`,
        'senior_specialist',
        `Senior ${junior.toLowerCase()} leading complex ${S.toLowerCase()} work and mentoring juniors.`,
        {
          roleCategory: designCat,
          eligibilityNote: note(`Senior ${S} specialist — experience-led.`),
        }
      )
      add(
        `${S} Lead / Art Director`,
        'creative_leadership',
        `Leads ${S.toLowerCase()} craft quality, creative direction of briefs and team output.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} creative lead — future progression.`),
        }
      )
      add(
        `Head of ${S}`,
        'creative_leadership',
        `Heads the ${S.toLowerCase()} discipline in an agency, studio or in-house team.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note(`Head of ${S} — future progression.`),
        }
      )
      add(
        `${S} Studio Director / Creative Director`,
        'executive_studio_director',
        `Studio or creative director accountable for ${S.toLowerCase()} output, clients and commercial outcomes.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} studio/creative director — future progression only.`),
        }
      )
      if (def.includeAcademic) {
        add(
          `Lecturer in ${S}`,
          'academic_research',
          `University lecturer teaching and researching ${S.toLowerCase()}.`,
          {
            academicRequirement: 'phd_relevant',
            isAcademicRole: true,
            isResearchRole: true,
            eligibilityNote: note(`Academic ${S} — PhD or equivalent practice-based doctorate typically required.`),
          }
        )
      }
      break
    }

    case 'animation_vfx': {
      add(
        `${S} Production Assistant`,
        'foundation_creative_support',
        `Supports ${S.toLowerCase()} pipelines with asset tracking, renders and shot logistics.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(`${S} production support — degree not required.`),
        }
      )
      add(
        `${S} Graduate Artist`,
        'graduate_creative_entry',
        `Graduate artist joining a ${S.toLowerCase()} pipeline with a supervised shot/task list.`,
        {
          eligibilityNote: note(`Graduate ${S} — showreel/portfolio critical; degree helps but craft matters most.`),
        }
      )
      add(
        `Junior ${S} Artist`,
        'junior_creative_professional',
        `Junior artist delivering ${S.toLowerCase()} shots under a lead’s direction.`,
        {
          eligibilityNote: note(`Junior ${S} artist.`),
        }
      )
      add(
        `${S} Artist`,
        'experienced_creative',
        `Experienced ${S.toLowerCase()} artist owning complex shots and quality standards.`,
        {
          eligibilityNote: note(`Experienced ${S} artist — showreel and credits drive seniority.`),
        }
      )
      add(
        `Senior ${S} Artist`,
        'senior_specialist',
        `Senior artist solving hard ${S.toLowerCase()} problems and mentoring juniors.`,
        {
          eligibilityNote: note(`Senior ${S} specialist.`),
        }
      )
      add(
        `${S} Lead / Supervisor`,
        'creative_leadership',
        `Supervises ${S.toLowerCase()} crews, reviews and delivery milestones.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} lead/supervisor — future progression.`),
        }
      )
      add(
        `${S} Head of Department`,
        'creative_leadership',
        `Heads the ${S.toLowerCase()} department in a studio or facility.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note(`Head of ${S} — future progression.`),
        }
      )
      add(
        `${S} Studio / VFX Director`,
        'executive_studio_director',
        `Director-level leadership of ${S.toLowerCase()} facility output and client delivery.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} director — future progression only.`),
        }
      )
      break
    }

    case 'film_tv_video': {
      add(
        `${S} Runner / Production Assistant`,
        'foundation_creative_support',
        `Entry production support on ${S.toLowerCase()} shoots and sets.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note('Runner/PA — classic UK entry; degree not required.'),
        }
      )
      add(
        `${S} Graduate Trainee`,
        'graduate_creative_entry',
        `Graduate trainee on a ${S.toLowerCase()} production, broadcast or facilities scheme.`,
        {
          eligibilityNote: note(`Graduate ${S} trainee — schemes competitive; portfolio/credits help.`),
        }
      )
      add(
        `Junior ${S} Producer / Coordinator`,
        'junior_creative_professional',
        `Coordinates ${S.toLowerCase()} schedules, logistics and junior production tasks.`,
        {
          eligibilityNote: note(`Junior ${S} production role.`),
        }
      )
      add(
        `${S} Producer / Editor`,
        'experienced_creative',
        `Experienced practitioner producing or editing ${S.toLowerCase()} content to brief.`,
        {
          eligibilityNote: note(`Experienced ${S} producer/editor — credits and delivery record matter.`),
        }
      )
      add(
        `Senior ${S} Producer`,
        'senior_specialist',
        `Senior producer owning complex ${S.toLowerCase()} projects and budgets.`,
        {
          eligibilityNote: note(`Senior ${S} producer.`),
        }
      )
      add(
        `${S} Series / Creative Lead`,
        'creative_leadership',
        `Leads creative and production teams for ${S.toLowerCase()} strands or series.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} creative lead — future progression.`),
        }
      )
      add(
        `Head of ${S}`,
        'creative_leadership',
        `Heads ${S.toLowerCase()} for a broadcaster, indie or in-house content team.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note(`Head of ${S} — future progression.`),
        }
      )
      add(
        `Executive Producer (${S})`,
        'executive_studio_director',
        `Executive producer accountable for ${S.toLowerCase()} slate, finance and delivery.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note('Executive producer — future progression only.'),
        }
      )
      break
    }

    case 'photography_visual':
    case 'fine_art_illustration': {
      add(
        `${S} Studio / Gallery Assistant`,
        'foundation_creative_support',
        `Supports ${S.toLowerCase()} studios, shoots or gallery preparation and archives.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(`${S} support — degree not required.`),
        }
      )
      add(
        `${S} Graduate Practitioner`,
        'graduate_creative_entry',
        `Graduate practitioner building a ${S.toLowerCase()} portfolio through commissions or residencies.`,
        {
          eligibilityNote: note(`Graduate ${S} — portfolio-led entry.`),
        }
      )
      add(
        `Junior ${S} ${junior}`,
        'junior_creative_professional',
        `Early-career ${junior.toLowerCase()} delivering supervised ${S.toLowerCase()} commissions.`,
        {
          roleCategory: designCat ?? 'professional_practice',
          eligibilityNote: note(`Junior ${S} ${junior.toLowerCase()}.`),
        }
      )
      add(
        `${S} ${junior}`,
        'experienced_creative',
        `Practising ${junior.toLowerCase()} delivering professional ${S.toLowerCase()} work.`,
        {
          roleCategory: designCat ?? 'professional_practice',
          eligibilityNote: note(`Experienced ${S} — portfolio and client record drive progression.`),
        }
      )
      add(
        `Senior ${S} ${junior}`,
        'senior_specialist',
        `Senior ${junior.toLowerCase()} with recognised ${S.toLowerCase()} expertise and complex commissions.`,
        {
          roleCategory: designCat ?? 'technical_specialist',
          eligibilityNote: note(`Senior ${S} specialist.`),
        }
      )
      add(
        `${S} Creative Lead`,
        'creative_leadership',
        `Leads ${S.toLowerCase()} creative output for campaigns, publications or exhibitions.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} creative lead — future progression.`),
        }
      )
      add(
        `${S} Studio Director`,
        'executive_studio_director',
        `Directs a ${S.toLowerCase()} studio, practice or creative business.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} studio director — future progression only.`),
        }
      )
      add(
        `Lecturer in ${S}`,
        'academic_research',
        `University lecturer teaching and researching ${S.toLowerCase()}.`,
        {
          academicRequirement: def.mastersUseful ? 'masters_relevant' : 'phd_relevant',
          isAcademicRole: true,
          isResearchRole: true,
          eligibilityNote: note(
            `Academic ${S} — practice-based Master’s/PhD pathways common in art & design HE.`
          ),
        }
      )
      break
    }

    case 'music_audio': {
      add(
        `${S} Studio Assistant`,
        'foundation_creative_support',
        `Supports ${S.toLowerCase()} sessions with setup, logging and technical assistance.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(`${S} studio support — degree not required.`),
        }
      )
      add(
        `${S} Graduate Trainee`,
        'graduate_creative_entry',
        `Graduate trainee in ${S.toLowerCase()} performance, production or label/operations pathways.`,
        {
          eligibilityNote: note(`Graduate ${S} — portfolio/demo reel often decisive.`),
        }
      )
      add(
        `Junior ${S} ${junior}`,
        'junior_creative_professional',
        `Junior ${junior.toLowerCase()} contributing to ${S.toLowerCase()} projects under supervision.`,
        {
          eligibilityNote: note(`Junior ${S} ${junior.toLowerCase()}.`),
        }
      )
      add(
        `${S} ${junior}`,
        'experienced_creative',
        `Experienced ${junior.toLowerCase()} delivering professional ${S.toLowerCase()} work.`,
        {
          eligibilityNote: note(`Experienced ${S} — credits and craft drive seniority.`),
        }
      )
      add(
        `Senior ${S} ${junior}`,
        'senior_specialist',
        `Senior ${junior.toLowerCase()} leading complex ${S.toLowerCase()} sessions or releases.`,
        {
          eligibilityNote: note(`Senior ${S} specialist.`),
        }
      )
      add(
        `${S} Creative Lead / MD`,
        'creative_leadership',
        `Musical/creative lead directing ${S.toLowerCase()} projects and collaborators.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} creative lead — future progression.`),
        }
      )
      add(
        `${S} Studio / Label Director`,
        'executive_studio_director',
        `Directs a ${S.toLowerCase()} studio, label or production company.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} director — future progression only.`),
        }
      )
      break
    }

    case 'performing': {
      add(
        `${S} Stage / Company Assistant`,
        'foundation_creative_support',
        `Supports ${S.toLowerCase()} rehearsals, venues and company administration.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(`${S} support — vocational entry common.`),
        }
      )
      add(
        `${S} Graduate Performer / Trainee`,
        'graduate_creative_entry',
        `Graduate or conservatoire trainee entering ${S.toLowerCase()} companies or productions.`,
        {
          academicRequirement: 'degree_relevant',
          eligibilityNote: note(`Graduate ${S} — conservatoire/degree and audition pathways.`),
        }
      )
      add(
        `Junior ${S} Performer`,
        'junior_creative_professional',
        `Early-career performer in ${S.toLowerCase()} productions and ensembles.`,
        {
          eligibilityNote: note(`Junior ${S} performer.`),
        }
      )
      add(
        `${S} Performer`,
        'experienced_creative',
        `Professional ${S.toLowerCase()} performer with sustained credits.`,
        {
          eligibilityNote: note(`Experienced ${S} performer — credits drive progression.`),
        }
      )
      add(
        `Senior ${S} Performer / Soloist`,
        'senior_specialist',
        `Senior performer or specialist with lead casting and mentoring roles.`,
        {
          eligibilityNote: note(`Senior ${S} specialist.`),
        }
      )
      add(
        `${S} Director / Choreographer Lead`,
        'creative_leadership',
        `Directs or choreographs ${S.toLowerCase()} productions and creative teams.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} director/choreographer — future progression.`),
        }
      )
      add(
        `Artistic Director (${S})`,
        'executive_studio_director',
        `Artistic director of a ${S.toLowerCase()} company, venue or festival strand.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note('Artistic director — future progression only.'),
        }
      )
      add(
        `Lecturer in ${S}`,
        'academic_research',
        `Conservatoire/university lecturer in ${S.toLowerCase()}.`,
        {
          academicRequirement: 'masters_relevant',
          isAcademicRole: true,
          isResearchRole: true,
          eligibilityNote: note(
            `Academic ${S} — Master’s/practice doctorate common; PhD for some research tracks.`
          ),
        }
      )
      break
    }

    case 'writing_journalism_publishing': {
      add(
        `${S} Editorial Assistant`,
        'foundation_creative_support',
        `Supports ${S.toLowerCase()} teams with research, admin and basic copy preparation.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(`${S} editorial support — degree not always required.`),
        }
      )
      add(
        `${S} Graduate Trainee`,
        'graduate_creative_entry',
        `Graduate trainee on a ${S.toLowerCase()} scheme (newsroom, publisher or writing programme).`,
        {
          eligibilityNote: note(`Graduate ${S} — NCTJ/equivalent may apply for journalism routes.`),
        }
      )
      add(
        `Junior ${S} ${junior}`,
        'junior_creative_professional',
        `Junior ${junior.toLowerCase()} producing supervised ${S.toLowerCase()} content.`,
        {
          eligibilityNote: note(`Junior ${S} ${junior.toLowerCase()}.`),
        }
      )
      add(
        `${S} ${junior}`,
        'experienced_creative',
        `Experienced ${junior.toLowerCase()} delivering professional ${S.toLowerCase()} work.`,
        {
          eligibilityNote: note(
            `Experienced ${S} — clips/portfolio matter; Master’s not automatic seniority.`
          ),
        }
      )
      add(
        `Senior ${S} ${junior}`,
        'senior_specialist',
        `Senior ${junior.toLowerCase()} owning complex commissions and mentoring juniors.`,
        {
          eligibilityNote: note(`Senior ${S} specialist.`),
        }
      )
      add(
        `${S} Commissioning / Section Lead`,
        'creative_leadership',
        `Leads commissioning or section output for ${S.toLowerCase()}.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} lead — future progression.`),
        }
      )
      add(
        `Editor / Publishing Director (${S})`,
        'executive_studio_director',
        `Editor or publishing director accountable for ${S.toLowerCase()} lists or titles.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} editor/director — future progression only.`),
        }
      )
      break
    }

    case 'advertising_direction': {
      add(
        `${S} Creative Assistant`,
        'foundation_creative_support',
        `Supports advertising creative teams with research, mock-ups and production chasing.`,
        {
          academicRequirement: 'none',
          eligibilityNote: note(`${S} assistant — agency entry; degree not always required.`),
        }
      )
      add(
        `${S} Graduate Creative`,
        'graduate_creative_entry',
        `Graduate creative joining an agency scheme focused on ${S.toLowerCase()}.`,
        {
          roleCategory: 'design',
          eligibilityNote: note(`Graduate ${S} — book/portfolio decisive.`),
        }
      )
      add(
        `Junior ${S} ${junior}`,
        'junior_creative_professional',
        `Junior ${junior.toLowerCase()} developing concepts under a creative director.`,
        {
          roleCategory: 'design',
          eligibilityNote: note(`Junior ${S} ${junior.toLowerCase()}.`),
        }
      )
      add(
        `${S} ${junior}`,
        'experienced_creative',
        `Experienced ${junior.toLowerCase()} owning campaign concepts and presentations.`,
        {
          roleCategory: 'design',
          eligibilityNote: note(`Experienced ${S} — awards/book matter more than Master’s.`),
        }
      )
      add(
        `Senior ${S} ${junior}`,
        'senior_specialist',
        `Senior ${junior.toLowerCase()} leading major briefs and mentoring pairs/teams.`,
        {
          roleCategory: 'design',
          eligibilityNote: note(`Senior ${S} specialist.`),
        }
      )
      add(
        `${S} Group Creative Lead`,
        'creative_leadership',
        `Leads creative groups delivering multi-channel ${S.toLowerCase()} campaigns.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note(`${S} group lead — future progression.`),
        }
      )
      add(
        `Executive Creative Director (${S})`,
        'executive_studio_director',
        `ECD-level leadership of ${S.toLowerCase()} creative output and agency reputation.`,
        {
          roleCategory: 'leadership',
          fitClassification: 'future_progression',
          eligibilityNote: note('Executive Creative Director — future progression only.'),
        }
      )
      break
    }

    case 'academic': {
      add(
        `Research Assistant (${S})`,
        'academic_research',
        `Supports research/practice-research projects in ${S.toLowerCase()}.`,
        {
          academicRequirement: 'masters_relevant',
          isResearchRole: true,
          eligibilityNote: note('Research assistant — Master’s common.'),
        }
      )
      add(
        `Doctoral Researcher (${S})`,
        'academic_research',
        `Undertakes doctoral / practice-based doctoral research in ${S.toLowerCase()}.`,
        {
          academicRequirement: 'phd_relevant',
          isResearchRole: true,
          eligibilityNote: note('PhD/practice doctorate — academic track, not studio seniority.'),
        }
      )
      add(
        `Research Fellow (${S})`,
        'academic_research',
        `Research fellow advancing scholarship or practice-research in ${S.toLowerCase()}.`,
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
          eligibilityNote: note('Academic lecturer — PhD or equivalent practice doctorate.'),
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
