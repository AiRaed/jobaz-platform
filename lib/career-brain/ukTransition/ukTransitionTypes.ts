/**

 * New to the UK — business-first career path types.

 * Not immigration advice or government assessment.

 */



import type { CareerBrainQuestion } from '../types'



/** Four profile groups — map to legacy path letters A–D. */

export type UkTransitionCategory =

  | 'qualified_professional'

  | 'skilled_trade'

  | 'business_background'

  | 'limited_qualifications'



export type UkTransitionPathLetter = 'A' | 'B' | 'C' | 'D'



export type UkProfileType = 'degree' | 'work_experience' | 'business' | 'starting_scratch'

export type UkMainGoal = 'quick_work' | 'field_work' | 'long_term' | 'start_business'

export type UkInterestArea =

  | 'people'

  | 'hands_on'

  | 'driving'

  | 'office'

  | 'healthcare_education'

  | 'business'



export type UkTransitionUnderstanding = {

  profileType: UkProfileType | null

  mainGoal: UkMainGoal | null

  interestArea: UkInterestArea | null

  qualificationField: string | null

  experienceArea: string | null

  /** Derived route id for content lookup */

  routeId: string | null

  routeLabel: string | null

  /** Legacy / derived fields for compatibility */

  profession: string | null

  educationLevel: string | null

  careerGoal: string | null

  category: UkTransitionCategory | null

  pathLetter: UkTransitionPathLetter | null

  specialized: Record<string, string | string[]>

  askedIds: string[]

  questionCount: number

  confidence: number

}



export type UkTransitionQuestionPick = {

  question: CareerBrainQuestion | null

  reason: string

  confidence: number

  understanding: UkTransitionUnderstanding

}



export type UkPathStep = {

  step: number

  title: string

  description: string

}



export type UkTransitionJobAZAction = {

  action: string

  label: string

  why: string

  href?: string

}



export type UkTransitionFinalReport = {

  transitionSummary: string

  whyRecommended: string

  recommendedRouteLabel: string

  whatYouBring: string[]

  ukPathSteps: UkPathStep[]

  targetRole: string

  bestNextAction: string

  recommendedCertifications: string[]

  recommendedCourses: string[]

  recommendedJobs: Array<{ title: string; why: string }>

  categoryLabel: string

  categoryExplanation: string

  pathLetter: UkTransitionPathLetter

  confidenceScore: number

  /** Legacy fields */

  currentBarriers: string[]

  transferableSkills: string[]

  fastestRouteIntoWork: string

  longTermCareerPath: string

  qualificationRecognitionPath?: string

  businessPotential?: string

  recommendedNextActions: string[]

}



export type UkTransitionGrowthOutput = {

  summary: string

  confidence: number

  finalReport: UkTransitionFinalReport

  recommendedJobAZActions: UkTransitionJobAZAction[]

}


