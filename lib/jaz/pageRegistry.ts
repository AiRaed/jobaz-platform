/**
 * Single source of truth for JAZ page context across the platform.
 * Career Brain decides recommendations; JAZ explains them on each page.
 */

export type JazPageId =
  | 'landing'
  | 'dashboard'
  | 'career-plan'
  | 'career-engine'
  | 'uk-career-assistant'
  | 'job-finder'
  | 'job-details'
  | 'course'
  | 'career-hub'
  | 'cv-builder'
  | 'cover-letter'
  | 'interview-coach'
  | 'proofreading'
  | 'build-your-path'
  | 'other'

export type JazApiPageContext =
  | 'dashboard'
  | 'cv'
  | 'cover'
  | 'job-details'
  | 'job-finder'
  | 'interview'
  | 'career-plan'
  | 'courses'
  | 'landing'
  | 'other'

export type JazPageProfile = {
  id: JazPageId
  apiContext: JazApiPageContext
  title: string
  subtitle: string
  greeting: string
}

export function resolveJazPageId(pathname: string): JazPageId {
  if (pathname === '/') return 'landing'
  if (pathname.startsWith('/dashboard')) return 'dashboard'
  if (pathname.startsWith('/uk-career-assistant')) return 'uk-career-assistant'
  if (pathname.startsWith('/career-engine')) return 'career-engine'
  if (pathname.startsWith('/job-finder')) return 'job-finder'
  if (pathname.startsWith('/job-details')) return 'job-details'
  if (pathname.startsWith('/courses/')) return 'course'
  if (pathname.startsWith('/career-hub')) return 'career-hub'
  if (pathname.startsWith('/cv-builder-v2')) return 'cv-builder'
  if (pathname.startsWith('/cover')) return 'cover-letter'
  if (pathname.startsWith('/interview-coach')) return 'interview-coach'
  if (pathname.startsWith('/proofreading')) return 'proofreading'
  if (pathname.startsWith('/build-your-path')) return 'build-your-path'
  return 'other'
}

const PROFILES: Record<JazPageId, JazPageProfile> = {
  landing: {
    id: 'landing',
    apiContext: 'landing',
    title: 'JAZ',
    subtitle: 'Your personal UK career companion',
    greeting:
      "Hi! I'm JAZ — your personal career assistant.\n\nI can explain JobAZ, help you start a free career assessment, or guide you to jobs and courses. What would you like to do?",
  },
  dashboard: {
    id: 'dashboard',
    apiContext: 'dashboard',
    title: 'JAZ',
    subtitle: 'Career dashboard · your progress',
    greeting:
      "I've reviewed your dashboard.\n\nI can explain your readiness score, next steps, and how to move forward in your UK career plan.",
  },
  'career-plan': {
    id: 'career-plan',
    apiContext: 'career-plan',
    title: 'JAZ',
    subtitle: 'Your personalised career plan',
    greeting:
      "I'm here to explain your Career Brain plan — readiness, recommended courses, job matches, and what to do next.\n\nI explain what Career Brain recommends; I never invent steps on my own.",
  },
  'career-engine': {
    id: 'career-engine',
    apiContext: 'career-plan',
    title: 'JAZ',
    subtitle: 'Building your UK career roadmap',
    greeting:
      "Let's build your UK career plan together.\n\nAnswer naturally — I'll guide you through each step of your assessment.",
  },
  'uk-career-assistant': {
    id: 'uk-career-assistant',
    apiContext: 'career-plan',
    title: 'JAZ',
    subtitle: 'Career assessment · UK roadmap',
    greeting:
      "I'm guiding your career assessment.\n\nAsk me to explain any question, recommendation, or next step in your plan.",
  },
  'job-finder': {
    id: 'job-finder',
    apiContext: 'job-finder',
    title: 'JAZ',
    subtitle: 'Job search · UK openings',
    greeting:
      "I can explain why jobs match your profile, break down salary and skills, and suggest CV improvements for each role.",
  },
  'job-details': {
    id: 'job-details',
    apiContext: 'job-details',
    title: 'JAZ',
    subtitle: 'Job application coach',
    greeting:
      "I'll help you understand this role, see how it fits your plan, and prepare your application step by step.",
  },
  course: {
    id: 'course',
    apiContext: 'courses',
    title: 'JAZ',
    subtitle: 'Course guidance',
    greeting:
      "I can explain why this course is recommended, how it improves your readiness, and where it fits in your career roadmap.",
  },
  'career-hub': {
    id: 'career-hub',
    apiContext: 'courses',
    title: 'JAZ',
    subtitle: 'Training & courses',
    greeting:
      "I can explain recommended courses, certifications, and how training connects to your UK career plan.",
  },
  'cv-builder': {
    id: 'cv-builder',
    apiContext: 'cv',
    title: 'JAZ',
    subtitle: 'CV Builder · section by section',
    greeting:
      "I'll guide you through your CV section by section — what to write, why it matters, and how to improve it for UK employers.",
  },
  'cover-letter': {
    id: 'cover-letter',
    apiContext: 'cover',
    title: 'JAZ',
    subtitle: 'Cover letter coach',
    greeting:
      "I'll help you write a strong cover letter — opening, body, closing, and tailoring for this application.",
  },
  'interview-coach': {
    id: 'interview-coach',
    apiContext: 'interview',
    title: 'JAZ',
    subtitle: 'Interview preparation',
    greeting:
      "I'll coach you before you practice — explain questions, structure STAR answers, and build confidence for UK interviews.",
  },
  proofreading: {
    id: 'proofreading',
    apiContext: 'other',
    title: 'JAZ',
    subtitle: 'Writing review',
    greeting:
      "I can help you polish application text — grammar, clarity, tone, and professional UK English.",
  },
  'build-your-path': {
    id: 'build-your-path',
    apiContext: 'other',
    title: 'JAZ',
    subtitle: 'Career path explorer',
    greeting:
      "I can explain this career path, required training, and how to prepare with JobAZ tools.",
  },
  other: {
    id: 'other',
    apiContext: 'other',
    title: 'JAZ',
    subtitle: 'Personal career assistant',
    greeting:
      "Hi! I'm JAZ — your personal UK career companion.\n\nAsk me anything about your plan, jobs, courses, CV, or interviews.",
  },
}

export function getJazPageProfile(pathname: string): JazPageProfile {
  const id = resolveJazPageId(pathname)
  return PROFILES[id] ?? PROFILES.other
}

export function mapPathnameToApiContext(pathname: string): JazApiPageContext {
  return getJazPageProfile(pathname).apiContext
}
