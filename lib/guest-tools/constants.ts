export type GuestToolId = 'cv' | 'coverLetter' | 'writingReview' | 'interview'

export const GUEST_DRAFT_KEYS: Record<GuestToolId, string> = {
  cv: 'guest_cv_draft',
  coverLetter: 'guest_cover_letter_draft',
  writingReview: 'guest_writing_review_draft',
  interview: 'guest_interview_practice_draft',
}

export const GUEST_USAGE_KEYS: Record<GuestToolId, string> = {
  cv: 'guest_cv_usage',
  coverLetter: 'guest_cover_letter_usage',
  writingReview: 'guest_writing_review_usage',
  interview: 'guest_interview_practice_usage',
}

export const GUEST_BANNER_DISMISS_PREFIX = 'guest_banner_dismissed_'

export const GUEST_TOOL_TAGLINE =
  'Start free. No account needed to try. Create a free account when you want to save, download or continue later.'

export const GUEST_BANNER_MESSAGE =
  "You're using guest mode. Sign in to save your work and continue later."

export const GUEST_LIMITS = {
  coverLetterGenerations: 1,
  writingReviewAnalyses: 1,
  interviewPracticeQuestions: 1,
} as const

export type GuestAuthAction = 'save' | 'download' | 'fullAccess' | 'history'

export const GUEST_AUTH_SAVE_TITLE = 'Create a free account to save your work and continue later.'

export const GUEST_AUTH_PROMPTS: Record<
  GuestToolId,
  Record<GuestAuthAction, { title: string; description: string }>
> = {
  cv: {
    save: {
      title: GUEST_AUTH_SAVE_TITLE,
      description: GUEST_TOOL_TAGLINE,
    },
    download: {
      title: GUEST_AUTH_SAVE_TITLE,
      description: GUEST_TOOL_TAGLINE,
    },
    fullAccess: {
      title: GUEST_AUTH_SAVE_TITLE,
      description: GUEST_TOOL_TAGLINE,
    },
    history: {
      title: GUEST_AUTH_SAVE_TITLE,
      description: GUEST_TOOL_TAGLINE,
    },
  },
  coverLetter: {
    save: {
      title: GUEST_AUTH_SAVE_TITLE,
      description: GUEST_TOOL_TAGLINE,
    },
    download: {
      title: GUEST_AUTH_SAVE_TITLE,
      description: GUEST_TOOL_TAGLINE,
    },
    fullAccess: {
      title: GUEST_AUTH_SAVE_TITLE,
      description: GUEST_TOOL_TAGLINE,
    },
    history: {
      title: GUEST_AUTH_SAVE_TITLE,
      description: GUEST_TOOL_TAGLINE,
    },
  },
  writingReview: {
    save: {
      title: GUEST_AUTH_SAVE_TITLE,
      description: GUEST_TOOL_TAGLINE,
    },
    download: {
      title: GUEST_AUTH_SAVE_TITLE,
      description: GUEST_TOOL_TAGLINE,
    },
    fullAccess: {
      title: GUEST_AUTH_SAVE_TITLE,
      description: GUEST_TOOL_TAGLINE,
    },
    history: {
      title: GUEST_AUTH_SAVE_TITLE,
      description: GUEST_TOOL_TAGLINE,
    },
  },
  interview: {
    save: {
      title: GUEST_AUTH_SAVE_TITLE,
      description: GUEST_TOOL_TAGLINE,
    },
    download: {
      title: GUEST_AUTH_SAVE_TITLE,
      description: GUEST_TOOL_TAGLINE,
    },
    fullAccess: {
      title: GUEST_AUTH_SAVE_TITLE,
      description: GUEST_TOOL_TAGLINE,
    },
    history: {
      title: GUEST_AUTH_SAVE_TITLE,
      description: GUEST_TOOL_TAGLINE,
    },
  },
}

export const TOOL_ROUTES: Record<GuestToolId, string> = {
  cv: '/cv-builder',
  coverLetter: '/cover-letter',
  writingReview: '/writing-review',
  interview: '/interview-coach',
}
