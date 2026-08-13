import type { StrategicGoalId } from '@/lib/career-brain/userGoal'
import type { CareerEnginePathConfig } from './types'
import {
  EDUCATION_CONVERSATION_QUESTIONS,
  EXPERIENCE_CONVERSATION_QUESTIONS,
  GROW_CAREER_QUESTIONS,
  resolveEducationConversationQuestion,
  resolveExperienceConversationQuestion,
  START_BUSINESS_QUESTIONS,
} from './pathQuestions'
import { resolveExperienceQuestionFlow } from '@/lib/career-engine/experience-path/consultant'
import { resolveEducationQuestionFlow } from '@/lib/career-engine/education-path/educationDynamicInterview'

const SHARED_ANALYSIS = [
  'Your qualifications',
  'Your experience',
  'UK requirements',
  'Skill gaps',
  'Salary potential',
  'Career opportunities',
  'Recommended certifications',
  'Best matching UK jobs',
]

export const CAREER_ENGINE_PATHS: Record<StrategicGoalId, CareerEnginePathConfig> = {
  work_in_education: {
    id: 'work_in_education',
    slug: 'work-in-education',
    pathNumber: 1,
    title: 'Work in my Education',
    subtitle: 'Use your qualification to build a career in the UK.',
    introMessage:
      "Hi! I'll build your personalised UK Career Plan based on your education. This takes about 2 minutes — just answer naturally as we go.",
    resultIntroMessage:
      "I've finished analysing your profile.\n\nBased on your qualification and answers, this is the fastest and most realistic route for you in the UK.",
    analysisChecklist: SHARED_ANALYSIS,
    storageKey: 'jobaz_education_path_result_v1',
    questions: EDUCATION_CONVERSATION_QUESTIONS,
    resolveQuestion: resolveEducationConversationQuestion,
    resolveQuestionFlow: resolveEducationQuestionFlow,
    hasStructuredResult: true,
  },
  work_in_profession: {
    id: 'work_in_profession',
    slug: 'work-in-profession',
    pathNumber: 2,
    title: 'Work in My Profession',
    subtitle: 'Map your practical profession and experience to realistic UK roles.',
    introMessage:
      "Hi! I'll match your profession and experience level to realistic UK target roles. About 2 minutes.",
    resultIntroMessage:
      "I've matched your profession to UK target roles based on your field, specialism, and experience level.",
    analysisChecklist: [
      'Your profession field',
      'Your specialism / trade area',
      'Your professional level',
      'Your goal with this profession',
      'Closest UK target roles',
      'Licence and check themes',
      'CV focus points',
      'Next JobAZ actions',
    ],
    storageKey: 'jobaz_profession_path_result_v1',
    questions: [],
    hasStructuredResult: true,
  },
  work_in_experience: {
    id: 'work_in_experience',
    slug: 'work-in-experience',
    pathNumber: 3,
    title: 'Work in my Experience',
    subtitle: 'Transfer your work history into the UK job market at your level.',
    introMessage:
      "Hi! I'll map your work experience to realistic UK roles — not entry-level jobs unless regulation requires it. About 2 minutes.",
    resultIntroMessage:
      "I've finished analysing your experience.\n\nBased on everything you've shared, this is the most realistic UK career route at your level.",
    analysisChecklist: SHARED_ANALYSIS,
    storageKey: 'jobaz_experience_path_result_v1',
    questions: EXPERIENCE_CONVERSATION_QUESTIONS,
    resolveQuestion: resolveExperienceConversationQuestion,
    resolveQuestionFlow: resolveExperienceQuestionFlow,
    hasStructuredResult: true,
  },
  start_new_career: {
    id: 'start_new_career',
    slug: 'start-new-career',
    pathNumber: 4,
    title: 'Start a New Career',
    subtitle: 'Enter a new field as a beginner — training first, then starter UK jobs.',
    introMessage:
      "Hi! I'll help you pick a beginner-friendly new career route — work type, then one starter path. About 1 minute.",
    resultIntroMessage:
      "Here is your new career route — start with courses or licences, then target realistic UK jobs.",
    analysisChecklist: [
      'Work type interest',
      'Starter career route',
      'Entry courses or licences',
      'First jobs after first step',
      'Upgrade courses',
      'Better roles later',
      'Next JobAZ actions',
    ],
    storageKey: 'jobaz_start_new_career_library_v1',
    questions: [],
    hasStructuredResult: true,
  },
  grow_career: {
    id: 'grow_career',
    slug: 'grow-career',
    pathNumber: 5,
    title: 'Grow in my Current Career',
    subtitle: 'Get promoted, earn more, or progress in your current profession.',
    introMessage:
      "Hi! I'll analyse your current role and build a promotion plan for the UK market. About 2 minutes.",
    resultIntroMessage:
      "I've finished analysing your career growth potential.\n\nBased on your role and goals, this is the most realistic path to your next level in the UK.",
    analysisChecklist: [
      'Your current role',
      'Promotion readiness',
      'Skills & qualifications',
      'Leadership evidence',
      'Senior roles in the UK',
      'Salary benchmarks',
      'Recommended certifications',
      'Your 90-day action plan',
    ],
    storageKey: 'jobaz_grow_career_v1',
    questions: GROW_CAREER_QUESTIONS,
    hasStructuredResult: true,
  },
  side_job: {
    id: 'side_job',
    slug: 'extra-income',
    pathNumber: 6,
    title: 'Looking for Extra Income',
    subtitle: 'Pick a route type and one option for a practical UK extra-income result.',
    introMessage:
      "Hi! I'll help you pick a realistic Extra Income route — category, then one option. About 1 minute.",
    resultIntroMessage:
      "Here is your Extra Income option with practical next steps for the UK.",
    analysisChecklist: [
      'Extra income route type',
      'Selected option',
      'Jobs or training priority',
      'What to search for',
      'Licence or short training notes',
      'Next JobAZ actions',
    ],
    storageKey: 'jobaz_extra_income_library_v1',
    questions: [],
    hasStructuredResult: true,
  },
  start_business: {
    id: 'start_business',
    slug: 'start-business',
    pathNumber: 7,
    title: 'Start My Own Business',
    subtitle: 'Build a business, become self-employed, or launch a startup in the UK.',
    introMessage:
      "Hi! I'll assess your business idea and build a realistic UK startup roadmap. About 2 minutes.",
    resultIntroMessage:
      "I've finished analysing your business profile.\n\nBased on your idea, capital, and experience, this is the most realistic route to launch in the UK.",
    analysisChecklist: [
      'Your business idea',
      'Market viability',
      'Startup capital',
      'Regulatory requirements',
      'Revenue model',
      'Risk assessment',
      'First 30 days plan',
      'Long-term growth path',
    ],
    storageKey: 'jobaz_start_business_v1',
    questions: START_BUSINESS_QUESTIONS,
    hasStructuredResult: true,
  },
}

export function getCareerEnginePath(id: StrategicGoalId): CareerEnginePathConfig {
  return CAREER_ENGINE_PATHS[id]
}

export function getCareerEnginePathBySlug(slug: string): CareerEnginePathConfig | null {
  return Object.values(CAREER_ENGINE_PATHS).find((p) => p.slug === slug) ?? null
}

export const CAREER_ENGINE_GOAL_REDIRECTS: Record<StrategicGoalId, string> = {
  work_in_education: '/career-engine/work-in-education',
  work_in_profession: '/career-engine/work-in-profession',
  work_in_experience: '/career-engine/work-in-experience',
  start_new_career: '/career-engine/start-new-career',
  grow_career: '/career-engine/grow-career',
  side_job: '/career-engine/extra-income',
  start_business: '/career-engine/start-business',
}

/** Clear path result + in-session answer caches (Restart / Start fresh). */
export function clearCareerEngineConversationCaches(goalId?: StrategicGoalId | null): void {
  if (typeof window === 'undefined') return
  const paths = goalId
    ? [CAREER_ENGINE_PATHS[goalId]]
    : Object.values(CAREER_ENGINE_PATHS)
  for (const path of paths) {
    try {
      localStorage.removeItem(path.storageKey)
    } catch {
      // ignore
    }
    try {
      sessionStorage.removeItem(`jobaz_career_engine_answers_${path.id}`)
    } catch {
      // ignore
    }
  }
}
