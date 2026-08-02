import type { StrategicGoalId } from '@/lib/career-brain/userGoal'
import type { CareerEnginePlanResult } from '@/lib/career-engine/shared/planTypes'

export type CareerEngineQuestion = {
  id: string
  text: string
  options: Array<{ value: string; label: string }>
  allowFreeText?: boolean
  /** Allow selecting multiple options (stored comma-separated) */
  allowMultiple?: boolean
  /** Maximum selections when allowMultiple is true */
  maxSelections?: number
  helperText?: string
}

export type CareerEngineConversationMessage = {
  id: string
  role: 'assistant' | 'user'
  content: string
}

export type CareerEnginePathConfig = {
  id: StrategicGoalId
  slug: string
  pathNumber: number
  title: string
  subtitle: string
  introMessage: string
  resultIntroMessage: string
  analysisChecklist: string[]
  storageKey: string
  questions: CareerEngineQuestion[]
  /** Paths with a structured CareerEnginePlanResult decision engine */
  hasStructuredResult: boolean
  /** Resolve dynamic options (e.g. education specialisation after field) */
  resolveQuestion?: (
    question: CareerEngineQuestion,
    answers: Record<string, string>
  ) => CareerEngineQuestion
  /** Build full question flow from answers (e.g. profession-specific interview) */
  resolveQuestionFlow?: (answers: Record<string, string>) => CareerEngineQuestion[]
}

export type CareerEngineConversationPhase =
  | 'intro'
  | 'chat'
  | 'typing'
  | 'analyzing'
  | 'result_intro'
  | 'result'

export type CareerEngineBuildResultFn = (
  answers: Record<string, string>
) => Promise<CareerEnginePlanResult | null>
