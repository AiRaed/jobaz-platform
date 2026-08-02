/**

 * New to the UK — understanding from ntuk_ answers (3–5 questions, business-first).

 */



import type { CareerBrainState } from '../types'

import { canClassifyUkTransition, classifyUkTransitionProfile } from './ukTransitionClassification'

import type { UkTransitionUnderstanding } from './ukTransitionTypes'



export const NTUK_PREFIX = 'ntuk_'

export const MAX_UK_TRANSITION_QUESTIONS = 5



export function isUkTransitionAnswerKey(id: string): boolean {

  return id.startsWith(NTUK_PREFIX)

}



function answers(state: CareerBrainState): Record<string, unknown> {

  return (state.answers ?? {}) as Record<string, unknown>

}



function str(state: CareerBrainState, ...keys: string[]): string | null {

  for (const key of keys) {

    const raw = answers(state)[key]

    if (raw === undefined || raw === null) continue

    const val = String(raw).trim()

    if (val) return val

  }

  return null

}



function readSpecialized(state: CareerBrainState): Record<string, string | string[]> {

  const core = new Set([

    'ntuk_profile_type',

    'ntuk_main_goal',

    'ntuk_interest_area',

    'ntuk_qualification_field',

    'ntuk_experience_area',

  ])

  const out: Record<string, string | string[]> = {}

  for (const [key, val] of Object.entries(answers(state))) {

    if (!key.startsWith(NTUK_PREFIX) || core.has(key)) continue

    if (val === undefined || val === null) continue

    out[key] = val as string | string[]

  }

  return out

}



const FIELD_LABELS: Record<string, string> = {

  healthcare: 'Healthcare',

  education: 'Education',

  engineering: 'Engineering',

  accounting: 'Accounting & Finance',

  it: 'IT & Technology',

  business: 'Business & Management',

  hospitality: 'Hospitality',

  construction: 'Construction',

  driving: 'Driving & transport',

  trades: 'Trades',

  admin: 'Administration',

  other: 'Your field',

}



function deriveProfession(u: Pick<UkTransitionUnderstanding, 'profileType' | 'qualificationField' | 'experienceArea' | 'interestArea'>): string | null {

  if (u.profileType === 'degree' && u.qualificationField) {

    return FIELD_LABELS[u.qualificationField] ?? u.qualificationField

  }

  if (u.profileType === 'work_experience' && u.experienceArea) {

    return FIELD_LABELS[u.experienceArea] ?? u.experienceArea

  }

  if (u.profileType === 'business') return 'Business & self-employment'

  if (u.interestArea === 'healthcare_education') return 'Care & support work'

  if (u.interestArea === 'driving') return 'Driving & logistics'

  if (u.interestArea === 'office') return 'Office & administration'

  if (u.interestArea === 'hands_on') return 'Practical / hands-on work'

  if (u.interestArea === 'people') return 'Customer-facing work'

  return null

}



function deriveEducationLevel(profileType: string | null): string | null {

  if (profileType === 'degree') return 'degree'

  if (profileType === 'work_experience') return 'vocational'

  if (profileType === 'business') return 'secondary'

  if (profileType === 'starting_scratch') return 'none'

  return null

}



export function getUkTransitionAnswerIds(state: CareerBrainState): string[] {

  const keys = Object.keys(answers(state)).filter((k) => k.startsWith(NTUK_PREFIX))

  const asked = (state.career_brain_asked ?? []).filter((k) => k.startsWith(NTUK_PREFIX))

  return [...new Set([...keys, ...asked])]

}



export function computeUkTransitionConfidence(u: UkTransitionUnderstanding): number {

  let score = 0

  if (u.profileType) score += 25

  if (u.mainGoal) score += 20

  if (u.interestArea) score += 20

  if (u.qualificationField || u.experienceArea) score += 15

  if (u.category) score += 10

  if (u.routeId) score += 10

  return Math.min(100, score)

}



function needsFollowUp(u: UkTransitionUnderstanding): boolean {

  if (u.profileType === 'degree' && !u.qualificationField) return true

  if (u.profileType === 'work_experience' && !u.experienceArea) return true

  return false

}



export function buildUkTransitionUnderstanding(state: CareerBrainState): UkTransitionUnderstanding {

  const profileType = str(state, 'ntuk_profile_type') as UkTransitionUnderstanding['profileType']

  const mainGoal = str(state, 'ntuk_main_goal') as UkTransitionUnderstanding['mainGoal']

  const interestArea = str(state, 'ntuk_interest_area') as UkTransitionUnderstanding['interestArea']



  const understanding: UkTransitionUnderstanding = {

    profileType,

    mainGoal,

    interestArea,

    qualificationField: str(state, 'ntuk_qualification_field'),

    experienceArea: str(state, 'ntuk_experience_area'),

    routeId: null,

    routeLabel: null,

    profession: null,

    educationLevel: deriveEducationLevel(profileType),

    careerGoal: mainGoal === 'start_business' ? 'start_business' : mainGoal,

    category: null,

    pathLetter: null,

    specialized: readSpecialized(state),

    askedIds: getUkTransitionAnswerIds(state),

    questionCount: getUkTransitionAnswerIds(state).length,

    confidence: 0,

  }



  understanding.profession = deriveProfession(understanding)



  if (canClassifyUkTransition(understanding)) {

    const classified = classifyUkTransitionProfile(understanding)

    understanding.category = classified.category

    understanding.pathLetter = classified.pathLetter

    understanding.routeId = classified.routeId

    understanding.routeLabel = classified.routeLabel

  }



  understanding.confidence = computeUkTransitionConfidence(understanding)

  return understanding

}



export function isUkTransitionQuestioningComplete(state: CareerBrainState): boolean {

  const u = buildUkTransitionUnderstanding(state)



  if (u.questionCount >= MAX_UK_TRANSITION_QUESTIONS) return true

  if (!u.profileType || !u.mainGoal || !u.interestArea) return false

  if (needsFollowUp(u)) return false

  if (!canClassifyUkTransition(u) || !u.category) return false



  return u.confidence >= 65 || u.questionCount >= 4

}



export function isLegacyNewToUkMapped(state: CareerBrainState): boolean {

  const a = answers(state)

  return Boolean(a.cb_new_to_uk_prior_exp) && !Object.keys(a).some((k) => k.startsWith(NTUK_PREFIX))

}



export function mapLegacyNewToUkAnswers(state: CareerBrainState): CareerBrainState {

  if (!isLegacyNewToUkMapped(state)) return state

  const a = state.answers ?? {}

  const prior = String(a.cb_new_to_uk_prior_exp ?? '')

  const abroad = String(a.cb_new_to_uk_experience_abroad ?? 'yes')



  let profileType = 'starting_scratch'

  if (prior === 'yes' && abroad === 'yes') profileType = 'work_experience'

  else if (prior === 'yes') profileType = 'work_experience'



  const edu = String(a.cb_first_job_education_level ?? '')

  if (/degree|bachelor|master|phd/i.test(edu)) profileType = 'degree'



  return {

    ...state,

    answers: {

      ...a,

      cb_new_to_uk: 'yes',

      ntuk_profile_type: a.ntuk_profile_type ?? profileType,

      ntuk_main_goal: a.ntuk_main_goal ?? 'field_work',

      ntuk_interest_area: a.ntuk_interest_area ?? 'office',

    },

  }

}


