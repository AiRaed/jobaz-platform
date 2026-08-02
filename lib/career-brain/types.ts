/**
 * Career Brain — structured types (separate from legacy uk-career-assistant scoring).
 */

export type ExperienceLevel = 'none' | 'entry' | 'junior' | 'mid' | 'senior' | null

export type EducationLevel = 'none' | 'school' | 'college' | 'degree' | 'postgrad' | null

export type UrgencyLevel = 'low' | 'medium' | 'high'

export type CareerDomain =
  | 'creative_media'
  | 'animation_design'
  | 'IT_digital'
  | 'healthcare'
  | 'driving_logistics'
  | 'admin_business'
  | 'finance_accounting'
  | 'education_training'
  | 'construction_trades'
  | 'hospitality'
  | 'retail_customer_service'
  | 'care_support'
  | 'no_experience_general'

/** Full extracted career profile used by Career Brain. */
export type CareerProfile = {
  educationLevel: EducationLevel
  studyField: string | null
  workExperienceField: string | null
  targetField: string | null
  yearsOfExperience: number | null
  experienceCountry: string | null
  toolsAndSkills: string[]
  hasPortfolio: boolean | null
  certificates: string[]
  licences: string[]
  englishLevel: string | null
  ukLocation: string | null
  urgencyLevel: UrgencyLevel
  wantsSameField: boolean | null
  wantsCareerChange: boolean | null
  domain: CareerDomain
  domainConfidence: number
  detectedRoles: string[]
  transferableSkills: string[]
  constraints: string[]
  confidence: number
  /** UK immigration / right-to-work status from Step 1 */
  workEligibility?: string | null
  /** False when visitor/asylum blocks standard job pathways */
  canWorkInUk?: boolean
  /** From UK Work Eligibility Engine */
  workEligible?: true | false | 'unknown' | null
}

/** @deprecated Alias — use CareerProfile */
export type ExtractedCareerProfile = CareerProfile

export type CareerBrainQuestion = {
  id: string
  text: string
  type: 'single' | 'multi'
  options: Array<{ value: string; label: string; description?: string }>
  max_select?: number
  allow_free_text?: boolean
}

export type PathOrigin = 'education' | 'experience' | 'blended'

export type CareerPathRole = {
  title: string
  why: string
  domain: CareerDomain
  source: 'ai' | 'fallback'
  /** Which input shaped this recommendation (education vs experience). */
  pathOrigin?: PathOrigin
  /** Internal balance tag for dual education + experience paths. */
  fieldSource?: 'experience' | 'education' | 'mixed' | 'fallback'
  /** 0–100 match confidence for this recommendation. */
  confidence?: number
  /** Career step vs optional training in Build Next. */
  stepType?: 'career_step' | 'training'
  /** Courses/certs that support this Build Next role (shown under the role card). */
  recommendedTraining?: string[]
  /** Career change — typical UK salary band for bridge roles. */
  expectedSalary?: string
  /** Career change — how competitive entry is. */
  entryDifficulty?: 'Low' | 'Medium' | 'High'
}

export type PathConfidenceScore = {
  title: string
  track: 'work_now' | 'build_next' | 'long_term' | 'backup_income'
  score: number
  reason?: string
}

export type NotRecommendedPath = {
  title: string
  reason: string
}

export type EnglishDevelopmentPlan = {
  currentLevel: string
  limitations: string[]
  accessibleJobsNow: string[]
  benefitsOfImproving: string[]
  unlockedLater: string[]
  suggestedActions: string[]
}

export type SpecialPathwayPlan = {
  type: 'self_employed' | 'small_business' | 'new_to_uk'
  headline: string
  workNowLabel: string
  buildNextLabel: string
  longTermLabel: string
  workNowActions: string[]
  buildNextActions: string[]
  longTermActions: string[]
  notes?: string[]
}

export type DualCareerPathsOutput = {
  educationPath: {
    label: string
    workNow: CareerPathRole[]
    buildNext: CareerPathRole[]
    longTerm: CareerPathRole[]
  }
  experiencePath: {
    label: string
    workNow: CareerPathRole[]
    buildNext: CareerPathRole[]
    longTerm: CareerPathRole[]
  }
  primary: 'education_field' | 'experience_field' | 'both' | 'not_sure'
}

export type CareerChangeTransitionOutput = {
  currentField: string
  targetField: string
  transitionDifficulty: 'Easy' | 'Medium' | 'Hard'
  difficultyScore: number
  estimatedTimeline: string
  confidenceScore: number
  transitionReadinessScore: number
  transitionReadinessSummary: string
  transferableSkills: string[]
  fastestRouteSummary: string
  recommendedTraining: string[]
  timelinePhases: Array<{ period: string; label: string; description: string }>
  buildNextPath: {
    pathLabel: string
    intermediateRole: string
    milestones: Array<{
      title: string
      category: 'certification' | 'skill' | 'experience' | 'portfolio'
      description: string
    }>
  }
  summary: string
  realityCheck: string
  routeType: string
}

export type CareerBrainOutput = {
  careerProfile: CareerProfile
  recommendedPaths: {
    workNow: CareerPathRole[]
    buildNext: CareerPathRole[]
    longTerm: CareerPathRole[]
    backupIncome: CareerPathRole[]
  }
  /** When education and experience diverge and user chose "Both". */
  dualCareerPaths?: DualCareerPathsOutput
  jobSearchKeywords: string[]
  missingSkills: string[]
  mainBarriers: string[]
  nextJobAZActions: Array<{ action: string; label: string; href?: string }>
  practicalNextSteps: Array<{ action: string; label: string; href?: string }>
  /** Short "Why this path?" explanation shown before the three columns. */
  whyThisPath: string
  /** One-line ladder summary e.g. entry → training → senior → manager */
  careerLadderSummary: string
  personalizedSummary: string
  reasoning: string[]
  employabilityScore: number
  pathConfidence: PathConfidenceScore[]
  englishDevelopmentPlan: EnglishDevelopmentPlan | null
  notRecommended: NotRecommendedPath[]
  rightToWorkGuidance: string
  /** Eligibility gate message when status blocks or pauses recommendations. */
  workEligibilityGuidance?: string
  workEligibilityNextSteps?: string[]
  specialPathway: SpecialPathwayPlan | null
  /** Unemployed pathway — blended readiness (experience, education, English, training). */
  careerReadinessScore?: number
  /** Unemployed pathway — experience vs education vs fast-employment scoring. */
  pathScores?: { experience: number; education: number; fastEmployment: number }
  /** Alternative route if user had prioritised education instead. */
  alternativeEducationPath?: {
    label: string
    summary: string
    workNow: CareerPathRole[]
    buildNext: CareerPathRole[]
    longTerm: CareerPathRole[]
  }
  /** Alternative route if user had prioritised experience instead. */
  alternativeExperiencePath?: {
    label: string
    summary: string
    workNow: CareerPathRole[]
    buildNext: CareerPathRole[]
    longTerm: CareerPathRole[]
  }
  recommendedCourses?: string[]
  ukMarketNotes?: string[]
  /** Career change pathway — transition analysis and transferable skills. */
  careerChangeTransition?: CareerChangeTransitionOutput
  /** Grow in current career — progression intelligence. */
  growCareerGrowth?: GrowCareerGrowthOutput
  /** Side income — JAZ extra income intelligence. */
  sideIncomeGrowth?: import('./sideIncome/sideIncomeTypes').SideIncomeGrowthOutput
  /** Business discovery — JAZ business advisor intelligence. */
  businessDiscoveryGrowth?: import('./businessDiscovery/businessDiscoveryTypes').BusinessDiscoveryGrowthOutput
  /** New to the UK — JAZ UK Transition Advisor intelligence. */
  ukTransitionGrowth?: import('./ukTransition/ukTransitionTypes').UkTransitionGrowthOutput
}

export type GrowCareerDetailedGaps = {
  skills: string[]
  qualifications: string[]
  certifications: string[]
  experience: string[]
  leadership: string[]
  technical: string[]
  portfolio: string[]
  networking: string[]
}

export type GrowCareerGrowthOutput = {
  field: string
  currentJobTitle: string
  currentLevel: string
  currentPositionSummary: string
  careerGrowthScore: number
  growthScoreLabel: 'Building Readiness' | 'Growing Profile' | 'Strong Growth Potential' | 'Promotion Ready'
  careerProfile: string
  promotionReadinessScore: number
  promotionReadinessExplanation: string
  mainBarrier: string
  growthBarriers: string[]
  nextRealisticStep: {
    role: string
    timeline: string
    reason: string
  }
  alternativeGrowthRoute: {
    role: string
    reason: string
  }
  skillsGap: {
    strengths: string[]
    needsDevelopment: string[]
  }
  skillsToDevelop: string[]
  recommendedCertifications: string[]
  detailedGaps: GrowCareerDetailedGaps
  promotionRoadmap: {
    workNow: string
    buildNext: string
    longTerm: string
  }
  immediateActions: string[]
  actionPlan90Days: string[]
  growthPlan6To12Months: string[]
  longTermCareerDirection: string
  assumptions: string[]
  summary: string
  salaryGrowthPotential: string
  jazConfidence?: number
  readinessStrengths: string[]
  readinessGaps: string[]
  internalAnalysis: string
  recommendedJobAZActions: Array<{ action: string; label: string; href?: string }>
  employabilityScore: number
  careerConfidenceScore?: number
  careerConfidenceLabel?: 'Low' | 'Medium' | 'High'
  progressionRoutes?: import('./growCareerEducationProgressionRoutes').EducationProgressionRoute[]
  recommendedQualification?: { qualification: string; reason: string }
  longTermRequirements?: string
  /** Structured profile from JAZ conversation */
  professionProfile?: import('./jaz/jazProfessionProfile').JazProfessionProfile
  /** Full 10-section advisor report */
  finalReport?: import('./jaz/growCareerFinalReport').GrowCareerFinalReport
}

export type CareerBrainRecommendation = CareerPathRole & {
  track: 'work_now' | 'build_next' | 'long_term' | 'backup_income'
  field_tag: string
  stepType?: 'career_step' | 'training'
}

export type RecommendationSource = 'ai' | 'fallback'

export type CareerBrainDebug = {
  careerProfile: CareerProfile
  detectedDomain: CareerDomain
  domainConfidence: number
  profile_source: 'ai' | 'rules' | 'hybrid'
  recommendation_source?: RecommendationSource
  question_chosen?: string | null
  question_reason?: string
  discovery_profile?: Record<string, unknown>
  missing_fields?: Array<{ field: string; priority: number; reason: string }>
  legacy_flow_skipped?: boolean
  recommendation_reasons: string[]
  questions_asked: string[]
  path_story_length: number
  field_first_mode: boolean
  finalize_reason?: string
  careerBrainOutput?: CareerBrainOutput
}

export type CareerBrainState = {
  phase?: string
  path?: string | null
  classification_done?: boolean
  classification?: Record<string, unknown>
  answers?: Record<string, unknown>
  asked_question_ids?: string[]
  locked?: Record<string, boolean>
  path_story?: string
  career_brain_profile?: CareerProfile | null
  career_brain_result?: CareerBrainOutput | null
  career_brain_asked?: string[]
  last_question_id?: string | null
  step_index?: number
}

export type CareerBrainTurnResult = {
  response: {
    path: string | null
    phase: string
    assistant_message: string
    question: CareerBrainQuestion | null
    allow_free_text: boolean
    state_updates: Record<string, unknown>
    done: boolean
    confidence_score?: number
    result: {
      summary: string
      work_now: {
        directions: Array<{
          direction_id: string
          direction_title: string
          why: string[]
          chips?: string[]
        }>
      }
      improve_later: {
        directions: Array<{
          direction_id: string
          direction_title: string
          why: string[]
          chips?: string[]
        }>
      } | null
      avoid: string[]
      next_step: string | {
        action: 'CREATE_CV' | 'JOB_FINDER' | 'BUILD_YOUR_PATH'
        label: string
        href?: string
      }
      career_brain?: CareerBrainOutput
    } | null
  }
  debug: CareerBrainDebug
}
