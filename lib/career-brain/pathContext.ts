/**
 * Committed career path context — labels and education tier for explanations and packs.
 */

import { hasSelectedCareerField } from './careerTrackLock'
import { getExperienceFieldText, getStudyFieldText } from './educationExperienceSplit'
import { studyFieldLabel } from './firstJobEducationPath'
import {
  getActiveBroadFieldKey,
  getSpecialisationValue,
  specialisationStudyLabel,
} from './fieldSpecialisation'
import type { CareerBrainRecommendation, CareerBrainState, CareerProfile } from './types'

export type QualificationTier = 'below_degree' | 'bachelor' | 'masters' | 'phd'

function answers(state?: CareerBrainState): Record<string, unknown> {
  return state?.answers ?? {}
}

/** Highest qualification tier from answers + profile — does not pick pathways alone. */
export function resolveQualificationTier(
  state?: CareerBrainState,
  profile?: CareerProfile
): QualificationTier {
  const a = answers(state)
  const firstJob = String(a.cb_first_job_education_level ?? '')
  const global = String(a.cb_global_education_level ?? '')

  if (firstJob === 'phd' || global === 'phd') return 'phd'
  if (firstJob === 'masters' || global === 'masters') return 'masters'
  if (firstJob === 'bachelors' || global === 'bachelors') return 'bachelor'
  if (profile?.educationLevel === 'postgrad') {
    const study = (profile.studyField ?? '').toLowerCase()
    if (/phd|doctorate|dphil/.test(study)) return 'phd'
    return 'masters'
  }
  if (profile?.educationLevel === 'degree') return 'bachelor'
  return 'below_degree'
}

export function isAdvancedQualificationTier(tier: QualificationTier): boolean {
  return tier === 'masters' || tier === 'phd'
}

/** Human-readable committed field (specialisation > study field > profile). */
export function getCommittedCareerPathLabel(
  profile: CareerProfile,
  state?: CareerBrainState
): string | null {
  const specLabel = state ? specialisationStudyLabel(state) : null
  if (specLabel) return specLabel

  const a = answers(state)
  const fjSlug = String(a.cb_first_job_study_field ?? '').trim()
  if (fjSlug) return studyFieldLabel(fjSlug)

  const study = (profile.studyField ?? '').trim()
  if (study) {
    return study.replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\bUk\b/g, 'UK')
  }

  return null
}

export function hasCommittedCareerPath(
  profile: CareerProfile,
  state?: CareerBrainState
): boolean {
  return (
    !!getCommittedCareerPathLabel(profile, state) &&
    (hasSelectedCareerField(state ?? { answers: {} }, profile) ||
      profile.constraints.includes('bridge-role-mode') ||
      profile.constraints.includes('field-first-education'))
  )
}

/**
 * Path direction for explanations — never unrelated sector labels when user committed to a field.
 */
export function resolvePathDirectionLabel(
  workNow: Array<{ title: string }>,
  profile: CareerProfile,
  state?: CareerBrainState
): string {
  const committed = getCommittedCareerPathLabel(profile, state)
  if (committed && hasCommittedCareerPath(profile, state)) {
    return committed
  }

  const blob = workNow.map((r) => r.title).join(' ').toLowerCase()
  if (/mechanical|manufacturing engineer|cad technician/i.test(blob)) return 'Mechanical Engineering'
  if (/civil engineer|site assistant|surveying/i.test(blob)) return 'Civil Engineering'
  if (/electrical engineer|electrician|ecs/i.test(blob)) return 'Electrical Engineering'
  if (/software|developer|tester|it support analyst/i.test(blob)) return 'Software Engineering'
  if (/legal|paralegal|law/i.test(blob)) return 'Legal & Law'
  if (/it support|helpdesk|technical support/i.test(blob)) return 'IT & Technology'
  if (/healthcare|care assistant|nursing|clinical/i.test(blob)) return 'Healthcare & Care'
  if (/animator|motion|video|creative/i.test(blob)) return 'Creative & Media'
  if (/warehouse|logistics|delivery|forklift/i.test(blob)) return 'Logistics & Driving'
  if (/retail|barista|customer service|hospitality/i.test(blob)) return 'Retail & Customer Service'
  if (/admin|data entry|reception|office/i.test(blob)) return 'Office & Administration'

  const study = (profile.studyField ?? '').toLowerCase()
  if (/engineer|engineering/.test(study)) return 'Engineering'
  if (/law|legal/.test(study)) return 'Legal & Law'
  if (/nurs|health|medic/.test(study)) return 'Healthcare'

  return 'your chosen career path'
}

export function outcomeForCommittedPath(
  pathLabel: string,
  profile: CareerProfile,
  state?: CareerBrainState
): string {
  const tier = resolveQualificationTier(state, profile)
  const label = pathLabel.toLowerCase()

  if (/mechanical engineering/i.test(label)) {
    if (tier === 'phd') {
      return 'Graduate and design-focused mechanical roles reflect your PhD while you build UK references — R&D and project routes lead toward chartered mechanical engineering.'
    }
    if (tier === 'masters') {
      return 'Graduate mechanical and design entry roles match your Master\'s — technical progression toward design and project engineering in the UK.'
    }
    return 'Mechanical technician and CAD entry roles build UK experience toward design and manufacturing engineering careers.'
  }
  if (/software engineering|computer engineering/i.test(label)) {
    if (tier === 'phd' || tier === 'masters') {
      return 'Graduate technical and analyst entry roles use your advanced qualification while you gain UK commercial experience toward software engineering careers.'
    }
    return 'Technical support and junior development routes build toward software engineering careers in the UK.'
  }
  if (/civil engineering/i.test(label)) {
    if (tier === 'phd' || tier === 'masters') {
      return 'Graduate civil and project assistant routes align with your advanced qualification and lead toward site and design engineering careers.'
    }
    return 'Site and technician routes build toward civil engineering careers in the UK.'
  }
  if (/electrical engineering/i.test(label)) {
    if (tier === 'phd' || tier === 'masters') {
      return 'Graduate electrical and design support roles match your qualification level while you progress toward professional electrical engineering.'
    }
    return 'Technician and trainee electrical routes build UK competency toward design and installation careers.'
  }

  if (isAdvancedQualificationTier(tier)) {
    return 'Recommendations favour graduate-level and specialist entry routes appropriate to your advanced qualification, while still reflecting UK experience and readiness.'
  }

  return 'Work Now, Build Next, and Long-Term steps stay aligned with this field as you build UK experience.'
}

export type RoleExplanationSource = 'experience' | 'education' | 'mixed' | 'fallback'

function formatFieldLabel(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return 'your field'
  if (trimmed.includes('_')) return studyFieldLabel(trimmed)
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

function educationKnowledgePhrase(study: string): string {
  const s = study.toLowerCase()
  if (/law|legal/.test(s)) return 'legal-sector knowledge'
  if (/engineer/.test(s)) return 'technical engineering knowledge'
  if (/marketing|media|communication/.test(s)) return 'communications and content skills'
  if (/health|nurs|care/.test(s)) return 'healthcare sector knowledge'
  if (/education|teaching/.test(s)) return 'education-sector knowledge'
  if (/science|laboratory|research/.test(s)) return 'scientific and research knowledge'
  if (/business|management/.test(s)) return 'business and operations knowledge'
  return 'qualification and study background'
}

function experienceSkillPhrase(exp: string): string {
  const e = exp.toLowerCase()
  if (/marketing|communication|media/.test(e)) return 'transferable communication skills'
  if (/hospitality|hotel|bar|kitchen/.test(e)) return 'customer-facing hospitality skills'
  if (/retail|customer service|shop|store/.test(e)) return 'customer service and retail skills'
  if (/engineer|manufacturing|cad/.test(e)) return 'practical technical experience'
  if (/admin|office|reception/.test(e)) return 'office and administration skills'
  if (/health|care|nursing/.test(e)) return 'care and support experience'
  return 'transferable workplace skills'
}

export function resolveRoleExplanationSource(
  rec: Pick<CareerBrainRecommendation, 'fieldSource' | 'pathOrigin' | 'why' | 'title'>
): RoleExplanationSource {
  if (rec.fieldSource === 'experience' || rec.fieldSource === 'education' || rec.fieldSource === 'mixed') {
    return rec.fieldSource === 'mixed' ? 'mixed' : rec.fieldSource
  }
  if (rec.pathOrigin === 'experience') return 'experience'
  if (rec.pathOrigin === 'education') return 'education'
  if (rec.pathOrigin === 'blended') return 'mixed'
  if (/\(experience\)/i.test(rec.why)) return 'experience'
  if (/\(education\)/i.test(rec.why)) return 'education'
  if (/\(blended\)/i.test(rec.why)) return 'mixed'
  return 'fallback'
}

function inferRoleExplanationSourceFromTitle(
  title: string,
  study: string,
  exp: string
): RoleExplanationSource {
  const t = title.toLowerCase()
  const studyL = study.toLowerCase()
  const expL = exp.toLowerCase()

  const eduHit =
    (/law|legal|paralegal|solicitor/.test(t) && /law|legal/.test(studyL)) ||
    (/engineer|engineering|cad|manufacturing/.test(t) && /engineer/.test(studyL)) ||
    (/legal reception|casework/.test(t) && /law|legal/.test(studyL)) ||
    (/laboratory|research|science/.test(t) && /science/.test(studyL)) ||
    (/teaching|learning support|education/.test(t) && /education|teaching/.test(studyL))

  const expHit =
    (/marketing|content producer|communications assistant/.test(t) && /marketing|communication|media/.test(expL)) ||
    (/hospitality|hotel|barista|kitchen|receptionist/.test(t) && /hospitality|hotel|bar|kitchen/.test(expL)) ||
    (/retail|customer service|store|shop/.test(t) && /retail|shop|store|customer/.test(expL))

  if (eduHit && expHit) return 'mixed'
  if (eduHit) return 'education'
  if (expHit) return 'experience'
  return 'fallback'
}

export function whyFitForRoleSource(
  source: RoleExplanationSource,
  track: CareerBrainRecommendation['track'],
  study: string,
  exp: string
): string {
  const studyLabel = formatFieldLabel(study)
  const expLabel = formatFieldLabel(exp)

  if (source === 'mixed') {
    if (track === 'long_term') {
      return `combines your ${expLabel} experience and ${studyLabel} education into a long-term destination`
    }
    return `combines your ${expLabel} experience with your ${studyLabel} background`
  }

  if (source === 'experience') {
    const skills = experienceSkillPhrase(exp)
    if (track === 'build_next') {
      return `builds on your ${expLabel} experience with a realistic next-step role`
    }
    if (track === 'long_term') {
      return `a long-term destination aligned with your ${expLabel} experience`
    }
    return `uses your ${expLabel} experience and ${skills}`
  }

  if (source === 'education') {
    const knowledge = educationKnowledgePhrase(study)
    if (track === 'build_next') {
      return `develops your ${studyLabel} education into practical UK progression`
    }
    if (track === 'long_term') {
      return `a long-term destination aligned with your ${studyLabel} education`
    }
    return `uses your ${studyLabel} education and ${knowledge}`
  }

  return ''
}

export function whyFitForRecommendation(
  rec: Pick<CareerBrainRecommendation, 'title' | 'track' | 'why' | 'fieldSource' | 'pathOrigin'>,
  profile: CareerProfile,
  state?: CareerBrainState
): string {
  const study = getStudyFieldText(state ?? { answers: {} }, profile)
  const exp = getExperienceFieldText(state ?? { answers: {} }, profile)
  const hasDualContext = !!study.trim() && !!exp.trim()

  if (hasDualContext) {
    let source = resolveRoleExplanationSource(rec)
    if (source === 'fallback') {
      source = inferRoleExplanationSourceFromTitle(rec.title, study, exp)
    }
    if (source !== 'fallback') {
      return whyFitForRoleSource(source, rec.track, study, exp)
    }
  }

  return whyFitForCommittedRole(rec.title, rec.track, profile, state)
}

export function whyFitForCommittedRole(
  title: string,
  track: CareerBrainRecommendation['track'],
  profile: CareerProfile,
  state?: CareerBrainState
): string {
  const path = getCommittedCareerPathLabel(profile, state)
  const tier = resolveQualificationTier(state, profile)
  const t = title.toLowerCase()

  if (path && hasCommittedCareerPath(profile, state)) {
    if (track === 'work_now') {
      if (tier === 'phd' || tier === 'masters') {
        return `uses your ${path} background at a realistic UK entry level for advanced graduates`
      }
      return `connects your ${path} studies to paid UK experience in the same field`
    }
    if (track === 'build_next') {
      if (tier === 'phd' && /hnc|btec|gcse/i.test(t)) {
        return `supports ${path} progression at postgraduate level — not a school-leaver route`
      }
      return `builds skills that strengthen your ${path} career in the UK`
    }
    return `a realistic long-term destination within ${path}`
  }

  if (track === 'work_now') {
    return 'matches your current readiness, preferences, and schedule'
  }
  if (track === 'build_next') {
    return 'a practical bridge from Work Now toward better pay and responsibility'
  }
  return 'a realistic career destination after experience and UK work history'
}
