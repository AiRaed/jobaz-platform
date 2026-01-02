// Smart Guidance Engine for JAZ
// Determines the next best action for users based on their current context

export type JazNextAction =
  | 'CREATE_CV'
  | 'TAILOR_CV'
  | 'GENERATE_COVER'
  | 'TRAIN_INTERVIEW'
  | 'READY_TO_APPLY'
  | 'FIND_JOBS'

export type JazPageContext =
  | 'dashboard'
  | 'job-details'
  | 'job-finder'
  | 'cv-builder'
  | 'cover'
  | 'interview'
  | 'build-your-path'
  | 'unknown'

export interface JazGuidanceState {
  page: JazPageContext
  jobId?: string
  jobTitle?: string
  company?: string

  hasBaseCV: boolean
  isCVTailored: boolean
  hasCoverLetter: boolean
  interviewTrained: boolean
  applicationSubmitted: boolean

  cvScore?: number // optional
}

export interface NextBestAction {
  action: JazNextAction
  title: string
  message: string
  ctaLabel: string
  secondaryCtaLabel?: string
}

/**
 * Computes the next best action based on user's current state and context.
 * Priority order:
 * 1) no base CV -> CREATE_CV
 * 2) job-details and not tailored -> TAILOR_CV
 * 3) job-details and no cover -> GENERATE_COVER
 * 4) job-details and not interview trained -> TRAIN_INTERVIEW
 * 5) job-details and all ready -> READY_TO_APPLY
 * 6) no job context -> FIND_JOBS (if has CV) or CREATE_CV
 */
export function getNextBestAction(state: JazGuidanceState): NextBestAction | null {
  // ROUTE GUARD: If on interview-coach page, return null
  // Interview Coach has its own guidance system and should never show global guidance
  if (state.page === 'interview') {
    return null
  }

  // ROUTE GUARD: If on build-your-path page, return null
  // Build Your Path has its own guidance system
  if (state.page === 'build-your-path') {
    return null
  }

  // Priority 1: No base CV -> Create CV
  if (!state.hasBaseCV) {
    return {
      action: 'CREATE_CV',
      title: 'Start with your CV',
      message: "You don't have a base CV yet. Let's create one first.",
      ctaLabel: 'Create CV',
    }
  }

  // For job-details page, guide through the application workflow
  if (state.page === 'job-details' && state.jobId) {
    // Priority 1: CV not tailored to this job
    if (!state.isCVTailored) {
      return {
        action: 'TAILOR_CV',
        title: 'Tailor CV Now',
        message: 'Your CV is not tailored to this job yet. Tailoring increases your chances.',
        ctaLabel: 'Tailor CV Now',
      }
    }

    // Priority 2: No cover letter for this job
    if (!state.hasCoverLetter) {
      return {
        action: 'GENERATE_COVER',
        title: 'Generate Cover Letter',
        message: 'A tailored cover letter can make you stand out. Let\'s generate one for this job.',
        ctaLabel: 'Generate Cover Letter',
      }
    }

    // Priority 3: Interview training not done/available
    // Training becomes available after application is submitted
    if (state.applicationSubmitted && !state.interviewTrained) {
      return {
        action: 'TRAIN_INTERVIEW',
        title: 'Train Interview',
        message: 'Let\'s prepare answers for this job so you feel confident in interviews.',
        ctaLabel: 'Train Interview',
      }
    }

    // Priority 4: All ready, can apply (or already submitted)
    if (state.applicationSubmitted) {
      return {
        action: 'READY_TO_APPLY',
        title: 'Application submitted',
        message: 'Great job. Track it in your dashboard and keep training.',
        ctaLabel: 'Open Dashboard',
      }
    }
    
    return {
      action: 'READY_TO_APPLY',
      title: 'Apply for this job',
      message: 'Your documents look ready. Apply now and track it in your dashboard.',
      ctaLabel: 'Apply for this job',
    }
  }

  // For other pages (dashboard, job-finder, etc.) or no job context
  // If user has CV, suggest finding jobs. Otherwise, suggest creating CV (but we already checked this above)
  if (!state.hasBaseCV) {
    // This case should be handled by the first check, but keeping for safety
    return {
      action: 'CREATE_CV',
      title: 'Start with your CV',
      message: "You don't have a base CV yet. Let's create one first.",
      ctaLabel: 'Create CV',
    }
  }

  // Has CV but no job context -> suggest finding jobs
  return {
    action: 'FIND_JOBS',
    title: 'Want job matches?',
    message: 'Start in Job Finder to discover opportunities that match your CV.',
    ctaLabel: 'Find Jobs',
  }
}

