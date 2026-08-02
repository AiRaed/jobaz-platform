/**
 * Interview Coach → central AI engine signal helpers.
 */

import { emitAiSignal } from '@/lib/jobaz-ai/emitSignal'

const SOURCE = 'interview-coach'

export type InterviewCoachMode =
  | 'writing'
  | 'voice'
  | 'hard'
  | 'memory'
  | 'interviewSimulation'

export function emitInterviewStarted(mode: InterviewCoachMode): void {
  const day = new Date().toISOString().slice(0, 10)
  void emitAiSignal({
    type: 'interview_started',
    source: SOURCE,
    impact: { readiness: 1, engagement: 2 },
    metadata: {
      dedupeId: `${mode}-${day}`,
      mode,
    },
  })
}

export function emitInterviewQuestionAnswered(params: {
  mode: InterviewCoachMode
  questionIndex: number
  score?: number | null
}): void {
  void emitAiSignal({
    type: 'interview_question_answered',
    source: SOURCE,
    impact: { readiness: 3, engagement: 4 },
    metadata: {
      dedupeId: `${params.mode}-q-${params.questionIndex}`,
      mode: params.mode,
      question_index: params.questionIndex,
      score: params.score ?? null,
    },
  })
}

export function emitInterviewCompleted(params: {
  mode: InterviewCoachMode
  score?: number | null
  questionsCompleted?: number
  dedupeId?: string
}): void {
  void emitAiSignal({
    type: 'interview_completed',
    source: SOURCE,
    impact: { readiness: 14, engagement: 10 },
    metadata: {
      dedupeId: params.dedupeId ?? `${params.mode}-session-${new Date().toISOString().slice(0, 10)}`,
      mode: params.mode,
      score: params.score ?? null,
      questions_completed: params.questionsCompleted,
      sessionComplete: true,
    },
  })
}

export function emitVoiceTrainingCompleted(params: {
  questionsCompleted: number
  score?: number | null
}): void {
  void emitAiSignal({
    type: 'voice_training_completed',
    source: SOURCE,
    impact: { readiness: 10, engagement: 12 },
    metadata: {
      dedupeId: `voice-complete-${new Date().toISOString().slice(0, 10)}`,
      mode: 'voice',
      questions_completed: params.questionsCompleted,
      score: params.score ?? null,
    },
  })
}

export function emitMockInterviewCompleted(params: {
  score?: number | null
  dedupeId?: string
}): void {
  void emitAiSignal({
    type: 'mock_interview_completed',
    source: SOURCE,
    impact: { readiness: 12, engagement: 10 },
    metadata: {
      dedupeId: params.dedupeId ?? `mock-${new Date().toISOString().slice(0, 10)}`,
      mode: 'interviewSimulation',
      score: params.score ?? null,
    },
  })
}
