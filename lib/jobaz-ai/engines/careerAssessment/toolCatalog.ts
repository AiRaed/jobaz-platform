import type { RecommendedTool } from '../../types'
import type { ToolCatalogKey } from './pathProfiles'

export const TOOL_CATALOG: Record<ToolCatalogKey, RecommendedTool> = {
  jobFinder: {
    id: 'job_finder',
    name: 'Job Finder',
    description: 'Search UK roles that match your profile and situation.',
    href: '/job-finder',
  },
  cvBuilder: {
    id: 'cv_builder',
    name: 'CV Builder',
    description: 'Create or improve a UK-style CV with guided sections.',
    href: '/cv-builder-v2',
  },
  buildYourPath: {
    id: 'build_your_path',
    name: 'Build Your Path',
    description: 'Explore skill paths and realistic career routes in the UK.',
    href: '/build-your-path',
  },
  interviewCoach: {
    id: 'interview_coach',
    name: 'Interview Coach',
    description: 'Practice answers and build confidence before interviews.',
    href: '/interview-coach',
  },
  writingReview: {
    id: 'writing_review',
    name: 'Writing Review',
    description: 'Improve CV wording, cover letters, and professional English.',
    href: '/proofreading',
  },
  ukCareerAssistant: {
    id: 'uk_career_assistant',
    name: 'UK Career Assistant',
    description: 'Deep personalised guidance across roles, skills, and next steps.',
    href: '/uk-career-assistant',
  },
}
