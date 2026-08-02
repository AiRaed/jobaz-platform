/**
 * Build full CareerProfile from narrative, classification answers, and AI partial extract.
 */

import { detectCareerDomain } from './domains'
import {
  applyEntryAnswersToProfile,
  getEntrySituation,
  getExperienceTier,
  parseUrgencyFromEntry,
} from './entryClassification'
import { studyFieldBridgeText } from './firstJobEducationPath'
import { resolveEffectiveStudyField } from './fieldSpecialisation'
import { buildNarrativeFromState, detectFieldHintsFromText } from './fieldSignals'
import { getRoutingGoal } from './userGoal'
import { isUnemployedPath } from './unemployedPath'
import type { CareerBrainState, CareerProfile, EducationLevel, UrgencyLevel } from './types'

function isStrictFirstJobGoal(state: CareerBrainState): boolean {
  return getRoutingGoal(state) === 'first_job'
}

function parseYears(blob: string): number | null {
  const yearMatch = blob.match(/\b(\d+)\s*(?:years?|yrs?)\b/i)
  if (yearMatch) return Math.min(40, parseInt(yearMatch[1], 10))
  const monthMatch = blob.match(/\b(\d+)\s*months?\b/i)
  if (monthMatch) return Math.max(0, Math.round(parseInt(monthMatch[1], 10) / 12))
  return null
}

function parseEducationLevel(
  answers: Record<string, unknown>,
  blob: string
): EducationLevel {
  if (answers.edu === 'no') return 'none'
  if (/\b(degree|university|bachelor|master|phd|graduat)\b/i.test(blob)) return 'degree'
  if (/\b(college|diploma|btec|nvq|level\s*[3-6])\b/i.test(blob)) return 'college'
  if (/\b(gcse|school|secondary)\b/i.test(blob)) return 'school'
  if (answers.edu === 'yes') return 'college'
  return null
}

function parseUrgency(blob: string, answers: Record<string, unknown>): UrgencyLevel {
  if (
    /\b(urgent|asap|any\s*job|need\s*money|quick\s*income|immediately|need\s*income)\b/i.test(blob) ||
    answers.goal_gate === 'any_job_now' ||
    String(answers.cb_goal ?? '').includes('urgent')
  ) {
    return 'high'
  }
  if (/\b(soon|within\s*a\s*month)\b/i.test(blob)) return 'medium'
  return 'low'
}

function parsePortfolio(answers: Record<string, unknown>, blob: string): boolean | null {
  const port = answers.cb_animation_portfolio ?? answers.cb_creative_portfolio
  if (port === 'yes_strong' || port === 'yes_basic') return true
  if (port === 'no') return false
  if (/\b(portfolio|showreel|reel)\b/i.test(blob) && /\b(yes|have|built)\b/i.test(blob)) return true
  return null
}

export function emptyCareerProfile(): CareerProfile {
  return {
    educationLevel: null,
    studyField: null,
    workExperienceField: null,
    targetField: null,
    yearsOfExperience: null,
    experienceCountry: null,
    toolsAndSkills: [],
    hasPortfolio: null,
    certificates: [],
    licences: [],
    englishLevel: null,
    ukLocation: null,
    urgencyLevel: 'low',
    wantsSameField: null,
    wantsCareerChange: null,
    domain: 'no_experience_general',
    domainConfidence: 0,
    detectedRoles: [],
    transferableSkills: [],
    constraints: [],
    confidence: 0,
  }
}

export function enrichCareerProfile(
  state: CareerBrainState,
  partial?: Partial<CareerProfile>
): CareerProfile {
  const narrative = buildNarrativeFromState(state)
  const blob = narrative.toLowerCase()
  const answers = state.answers ?? {}
  const hint = detectFieldHintsFromText(narrative)

  const profile = emptyCareerProfile()

  profile.educationLevel = partial?.educationLevel ?? parseEducationLevel(answers, blob)
  const studyAnswer = answers.cb_study_field ?? answers.study_field
  const workAnswer = answers.cb_work_experience ?? answers.work_experience
  profile.studyField =
    partial?.studyField ??
    (studyAnswer ? String(studyAnswer).trim() : null) ??
    hint.education_field ??
    (hint.current_field && (answers.cb_edu === 'yes' || answers.edu === 'yes') ? hint.current_field : null)
  profile.workExperienceField =
    partial?.workExperienceField ??
    (workAnswer ? String(workAnswer).trim() : null) ??
    hint.experience_field ??
    hint.current_field
  profile.targetField = partial?.targetField ?? null
  profile.yearsOfExperience = partial?.yearsOfExperience ?? parseYears(blob)
  profile.experienceCountry =
    partial?.experienceCountry ??
    (/\b(uk|united kingdom|britain|england|scotland|wales)\b/i.test(blob)
      ? 'UK'
      : /\b(abroad|overseas|home country|my country)\b/i.test(blob)
        ? 'non-UK'
        : null)
  profile.toolsAndSkills = [
    ...new Set([...(partial?.toolsAndSkills ?? []), ...hint.transferable_skills]),
  ]
  if (/\bmaya\b/i.test(blob)) profile.toolsAndSkills.push('Maya')
  if (/\bafter\s*effects\b/i.test(blob)) profile.toolsAndSkills.push('After Effects')
  if (/\bpremiere(\s*pro)?\b/i.test(blob)) profile.toolsAndSkills.push('Premiere Pro')
  if (/\bblender\b/i.test(blob)) profile.toolsAndSkills.push('Blender')

  if (/\bportfolio|showreel|reel\b/i.test(blob) && !/\bno\s+portfolio\b/i.test(blob)) {
    profile.hasPortfolio = profile.hasPortfolio ?? true
  }
  profile.hasPortfolio = partial?.hasPortfolio ?? profile.hasPortfolio ?? parsePortfolio(answers, blob)
  profile.certificates = partial?.certificates ?? []
  profile.licences = partial?.licences ?? []
  if (/\b(driving\s*licen[cs]e|dvla|hgv)\b/i.test(blob)) profile.licences.push('Driving licence')

  profile.englishLevel =
    partial?.englishLevel ?? (answers.cb_english ? String(answers.cb_english) : null)
  profile.ukLocation =
    partial?.ukLocation ??
    (answers.cb_creative_uk_location
      ? String(answers.cb_creative_uk_location)
      : answers.cb_location
        ? String(answers.cb_location)
        : 'UK-wide')

  if (/\b(creative\s*work|animation|animator|motion\s*design)\b/i.test(blob) && /\buk\b/i.test(blob)) {
    profile.wantsSameField = profile.wantsSameField ?? true
    profile.wantsCareerChange = false
  }

  profile.urgencyLevel = partial?.urgencyLevel ?? parseUrgency(blob, answers)
  profile.wantsSameField = partial?.wantsSameField ?? null
  profile.wantsCareerChange =
    partial?.wantsCareerChange ?? (hint.wants_career_change ? true : null)
  const fieldIntent = String(answers.cb_field_intent ?? '')
  if (fieldIntent.includes('same_field') || fieldIntent.includes('related_field')) {
    profile.wantsSameField = true
    profile.wantsCareerChange = false
  } else if (fieldIntent.includes('change_field')) {
    profile.wantsCareerChange = true
    profile.wantsSameField = false
  }
  const changeTarget = answers.cb_change_target_field ?? answers.cb_change_target
  if (changeTarget) {
    profile.targetField = String(changeTarget).trim()
    profile.wantsCareerChange = true
  }
  if (String(answers.cb_goal ?? '').includes('stay_field')) profile.wantsSameField = true
  if (String(answers.cb_goal ?? '').includes('career_change')) profile.wantsCareerChange = true

  profile.detectedRoles = [...new Set([...(partial?.detectedRoles ?? []), ...hint.detected_roles])]
  profile.transferableSkills = [
    ...new Set([...(partial?.transferableSkills ?? []), ...hint.transferable_skills]),
  ]
  profile.constraints = partial?.constraints ?? []
  profile.confidence = partial?.confidence ?? (hint.detected_roles.length ? 0.5 : 0.25)

  const eduAns = answers.cb_edu ?? answers.edu
  const expAns = answers.cb_exp ?? answers.exp
  if (eduAns === 'no') profile.educationLevel = 'none'
  if (expAns === 'no') {
    profile.yearsOfExperience = 0
    profile.workExperienceField = null
  }
  if (eduAns === 'no' && expAns === 'no') {
    profile.domain = 'no_experience_general'
  }

  const entryUrgency = parseUrgencyFromEntry(state)
  if (entryUrgency) profile.urgencyLevel = entryUrgency

  if (isStrictFirstJobGoal(state) || getExperienceTier(state) === 'no_experience') {
    profile.yearsOfExperience = 0
    profile.workExperienceField = null
    if (isStrictFirstJobGoal(state)) {
      profile.constraints = [...new Set([...profile.constraints, 'first-job-path', 'first-job-no-prior-exp'])]
    } else {
      profile.educationLevel = profile.educationLevel ?? 'none'
    }
  }

  if (answers.cb_graduate_study_field) {
    profile.studyField = resolveEffectiveStudyField(
      state,
      String(answers.cb_graduate_study_field).trim()
    )
    profile.educationLevel = profile.educationLevel ?? 'degree'
  }
  if (answers.cb_student_study_field) {
    profile.studyField = String(answers.cb_student_study_field).trim()
    profile.educationLevel = profile.educationLevel ?? 'college'
    profile.constraints = [...new Set([...profile.constraints, 'part-time', 'student'])]
  }
  if (answers.cb_basic_experience_text) {
    profile.workExperienceField = String(answers.cb_basic_experience_text).trim()
  }
  if (answers.cb_professional_field) {
    profile.studyField = profile.studyField ?? String(answers.cb_professional_field).trim()
  }
  if (answers.cb_professional_experience) {
    profile.workExperienceField = String(answers.cb_professional_experience).trim()
  }

  const { domain, confidence: domainConfidence } = detectCareerDomain(narrative, profile)
  profile.domain = partial?.domain ?? domain
  profile.domainConfidence = partial?.domainConfidence ?? domainConfidence

  if (answers.cb_first_job_study_field) {
    const slug = String(answers.cb_first_job_study_field)
    profile.studyField = resolveEffectiveStudyField(state, studyFieldBridgeText(slug))
    profile.educationLevel = profile.educationLevel ?? 'degree'
  }

  if (isUnemployedPath(state) || getEntrySituation(state) || getExperienceTier(state) || isStrictFirstJobGoal(state)) {
    return applyEntryAnswersToProfile(profile, state)
  }

  return profile
}
