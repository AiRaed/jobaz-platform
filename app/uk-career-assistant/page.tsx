'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Send, RotateCcw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { getMicroStatus, MicroStatus } from '@/lib/uk-career-assistant/microStatus'
import { appendAdvisorTranscriptMessage } from '@/lib/uk-career-assistant/advisorTranscript'
import { deriveLiveIntelligence, getThinkingMessage } from '@/lib/uk-career-assistant/liveIntelligence'
import {
  loadCaResultSnapshot,
  saveCaResultSnapshot,
  clearCaResultSnapshot,
  hasCaResultSnapshot,
  getUkCareerAuthUrls,
} from '@/lib/uk-career-assistant/guestSession'
import { createCaSession, updateCaSessionAnswers, completeCaSession, updateCaSessionSelectedRole } from '@/lib/uk-career-assistant/session-tracking'
import { mergeAnonymousAiProfileOnAuth, fetchLatestAssessmentForUser } from '@/lib/jobaz-ai/memory'
import { buildAssessmentBundleFromRecord } from '@/lib/dashboard/careerOs/planFromAssessment'
import type { AiPersonalizedUkResult } from '@/lib/jobaz-ai/engines/careerIntelligence'
import type { UkCareerRuleResult } from '@/lib/jobaz-ai/engines/careerIntelligence/types'
import { notifyProfileUpdated } from '@/lib/jobaz-ai/emitSignal'
import { notifyCareerPlanGenerated } from '@/hooks/useGeneratedCareerPlan'
import { logEvent } from '@/lib/analytics/logEvent'
import {
  CAREER_ENGINE_GOAL_REDIRECTS,
  clearCareerEngineConversationCaches,
} from '@/lib/career-engine/conversation/pathRegistry'
import type { StrategicGoalId } from '@/lib/career-brain/userGoal'
import AssistantBubble from '@/components/uk-career-assistant/AssistantBubble'
import UkCareerBackground from '@/components/uk-career-assistant/UkCareerBackground'
import UkCareerHero from '@/components/uk-career-assistant/UkCareerHero'
import UkCareerPreviousAssessmentBanner from '@/components/uk-career-assistant/UkCareerPreviousAssessmentBanner'
import UserBubble from '@/components/uk-career-assistant/UserBubble'
import QuestionCard from '@/components/uk-career-assistant/QuestionCard'
import TypingDots from '@/components/uk-career-assistant/TypingDots'
import ThinkingBubble from '@/components/uk-career-assistant/ThinkingBubble'
import JazFinalisingRoadmap from '@/components/uk-career-assistant/JazFinalisingRoadmap'
import { GUEST_CAREER_DASHBOARD_PATH } from '@/lib/auth/redirect'
import { transferGuestAssessmentOnAuth } from '@/lib/uk-career-assistant/guestTransfer'
import { resolveAuthenticatedUserId } from '@/lib/auth/resolveUserId'
import { persistCareerAssistantResult } from '@/lib/uk-career-assistant/persistAssessmentResult'
import { handleAssessmentApiCompletion, resolveAssessmentCompletion } from '@/lib/uk-career-assistant/completeAssessmentPersistence'
import { buildCareerActionPlan } from '@/lib/career-journey/buildActionPlan'
import {
  mapCareerActionPlanToJobAZPlan,
  type JobAZPlan,
} from '@/lib/dashboard/careerOs/mapCareerCoachResultToPlan'
import { buildJazAnalyseInputFromAnswers } from '@/lib/jaz-career-engine/buildInputFromAnswers'
import { mapJazAnalyseToJobAZPlan } from '@/lib/jaz-career-engine/mapJazAnalyseToJobAZPlan'
import type { JazAnalyseResult } from '@/lib/jaz-career-engine/types'
import { useMissionProgress } from '@/hooks/useMissionProgress'
import {
  isCareerBrainClientFlow,
  normalizeUkCareerClientResponse,
  shouldCommitAnswerToState,
  type NormalizedUkResponse,
} from '@/lib/uk-career-assistant/normalizeClientResponse'
import dynamic from 'next/dynamic'

const UkCareerConversionCard = dynamic(
  () => import('@/components/uk-career-assistant/UkCareerConversionCard'),
  { ssr: false }
)
const CareerCoachPlanHandoff = dynamic(
  () => import('@/components/career-engine/CareerCoachPlanHandoff'),
  { ssr: false }
)
const UkCareerExtraCoachDetail = dynamic(
  () => import('@/components/uk-career-assistant/UkCareerExtraCoachDetail'),
  { ssr: false }
)

const { signupUrl: UK_CAREER_SIGNUP_URL } = getUkCareerAuthUrls()

interface ConversationMessage {
  role: 'assistant' | 'user'
  content: string
}

interface QuestionOption {
  value: string
  label: string
  description?: string
}

export interface Question {
  id: string
  text: string
  type: 'single' | 'multi'
  options: QuestionOption[]
  max_select?: number
  allow_free_text?: boolean
}

interface AIState {
  [key: string]: any
  asked_question_ids?: string[]
  answers?: { [questionId: string]: any }
  step_index?: number
  last_question_id?: string | null
  phase?: 'CLASSIFY' | 'PATH' | 'RESULT' | string
  classification_done?: boolean
  classification?: { [key: string]: any }
  path?: string | null
  path_story?: string
  career_brain_profile?: Record<string, unknown>
  career_brain_result?: Record<string, unknown>
  career_brain_asked?: string[]
}

interface AIResponse {
  path: string | null
  phase: 'classification' | 'assessment' | 'recommendation' | 'CLASSIFY' | 'PATH' | 'RESULT' | string
  assistant_message: string
  question: Question | null
  allow_free_text: boolean
  transitions?: string
  state_updates: AIState
  done: boolean
  result: {
    summary: string
    work_now: {
      directions: Array<{
        direction_id: string
        direction_title: string
        why: Array<string>
        chips?: Array<string>
      }>
    }
    improve_later: {
      directions: Array<{
        direction_id: string
        direction_title: string
        why: Array<string>
        chips?: Array<string>
      }>
    } | null
    avoid: Array<string>
    next_step: string | {
      action: 'CREATE_CV' | 'JOB_FINDER' | 'BUILD_YOUR_PATH'
      label: string
      href?: string
    }
  } | null
  career_brain_active?: boolean
  question_source?: 'career_brain' | 'legacy'
  legacy_flow_bypassed?: boolean
  career_advisor?: {
    careerMatchSummary: string
    recommendedSectors: string[]
    topJobPaths: Array<{ title: string; why: string; salaryBand?: string }>
    jobFinderSearches: string[]
    cvImprovements: string[]
    missingSkills: string[]
    interviewReadinessNote: string
    nextSteps: Array<{ tool: string; label: string; href: string; reason: string }>
    referencePhrase: string | null
  }
}

export default function UKCareerAssistantPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversation, setConversation] = useState<ConversationMessage[]>([])
  const [aiState, setAiState] = useState<AIState>({
    asked_question_ids: [],
    answers: {},
    step_index: 0,
    last_question_id: null
  })
  const [current, setCurrent] = useState<AIResponse | null>(null)
  const [selectedOptions, setSelectedOptions] = useState<string[]>([])
  const [freeText, setFreeText] = useState('')
  const [pathFreeText, setPathFreeText] = useState('') // Free-text input at start of PATH phase
  const [pathFreeTextSubmitted, setPathFreeTextSubmitted] = useState(false) // Track if PATH free-text was submitted
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<{ message: string; raw?: string } | null>(null)
  const [lastUserInput, setLastUserInput] = useState<string | string[] | null>(null) // Store actual input (IDs) for retry
  const [lastState, setLastState] = useState<AIState>({}) // Store last state for retry
  // ANTI-LOOP GUARD: Track asked and answered questions
  const [askedQuestionIds, setAskedQuestionIds] = useState<Set<string>>(new Set())
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<string>>(new Set())
  const [autoSkipAttempts, setAutoSkipAttempts] = useState(0) // Track auto-skip attempts per step
  // Typing indicator and micro status
  const [isTyping, setIsTyping] = useState(false)
  const [microStatus, setMicroStatus] = useState<MicroStatus | null>(null)
  const [showResultsMessage, setShowResultsMessage] = useState(false)
  const [showAllMessages, setShowAllMessages] = useState(false) // For collapsing older messages
  const [isThinking, setIsThinking] = useState(false) // Track if thinking bubble should be shown
  const [thinkingText, setThinkingText] = useState<string>('is thinking…') // Current thinking message
  const [renderedQuestionIds, setRenderedQuestionIds] = useState<Set<string>>(new Set()) // Track rendered questions to prevent duplicates
  const [hasShownIntro, setHasShownIntro] = useState(false) // Track if intro message has been shown
  const [caSessionId, setCaSessionId] = useState<string | null>(null) // Session ID for round-trip navigation
  const [isResumeMode, setIsResumeMode] = useState(false) // Track if we're in resume mode
  const [hasPreviousAssessment, setHasPreviousAssessment] = useState(false)
  const autoStartRef = useRef(false)
  const isEmbed = searchParams.get('embed') === '1'
  const chatEndRef = useRef<HTMLDivElement>(null) // For auto-scroll
  const completedSessionLoggedRef = useRef(false) // Only log/complete once per result
  const persistedResultKeyRef = useRef<string | null>(null)
  const lastAnswerKeyRef = useRef<string | null>(null)
  /** Bumped on Restart / Start so pending timeouts cannot restore stale UI. */
  const sessionGenRef = useRef(0)
  const [finalisingResult, setFinalisingResult] = useState(false)
  const [aiEnrichment, setAiEnrichment] = useState<AiPersonalizedUkResult | null>(null)
  const [jazJobazPlan, setJazJobazPlan] = useState<JobAZPlan | null>(null)
  const jazAnalyseKeyRef = useRef<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const authRestoreDoneRef = useRef(false)
  const wasGuestWithAssessmentRef = useRef(false)
  const [enrichmentTrigger, setEnrichmentTrigger] = useState(0)
  const missionProgress = useMissionProgress()

  // Helper: Deduplicate transcript messages by (role + content) within last 5 entries
  const dedupeTranscript = (messages: ConversationMessage[]): ConversationMessage[] => {
    if (messages.length <= 5) return messages
    const recent = messages.slice(-5)
    const earlier = messages.slice(0, -5)
    const seen = new Set<string>()
    const dedupedRecent: ConversationMessage[] = []
    
    for (const msg of recent) {
      const key = `${msg.role}:${msg.content}`
      if (!seen.has(key)) {
        seen.add(key)
        dedupedRecent.push(msg)
      }
    }
    
    return [...earlier, ...dedupedRecent]
  }

  // Helper: Check if free-text should be shown
  const shouldShowFreeText = (question: Question | null, selectedOpts: string[]): boolean => {
    if (!question) return false
    if (question.id === 'cb_study_field' || question.id === 'cb_work_experience') return true
    if (question.allow_free_text === true) return true
    // Check if any selected option is "Other" type
    return selectedOpts.some(opt => {
      const option = question.options.find(o => o.value === opt)
      const labelLower = option?.label?.toLowerCase() || ''
      const valueLower = opt?.toLowerCase() || ''
      return valueLower === 'other' || 
             labelLower.includes('other') || 
             labelLower.includes('specify') || 
             labelLower.includes('explain') ||
             labelLower.includes('not listed')
    })
  }

  // Helper: Get context chip for question (if available)
  const getContextChip = (questionId: string | null): string | undefined => {
    if (!questionId) return undefined
    if (questionId.startsWith('cb_creative') || questionId.startsWith('cb_animation')) {
      return 'Creative'
    }
    if (questionId.startsWith('cb_')) return 'Career Brain'
    const chipMap: { [key: string]: string } = {
      'transport': 'Transport',
      'language': 'Communication',
      'people_comfort': 'Customer-facing',
      'physical_ability': 'Physical',
      'training_openness': 'Training',
      'education_level': 'Education',
      'education_field': 'Education',
      'pressure_source': 'Stress',
      'change_reason': 'Change',
      'strengths': 'Strengths',
      'transferable_strengths': 'Strengths'
    }
    return chipMap[questionId]
  }

  // Helper: Pick context-aware thinking message based on last answered question or phase
  const pickThinkingText = (lastQuestionId: string | null | undefined, state: AIState): string => {
    return getThinkingMessage(lastQuestionId, state.phase, state.step_index ?? 0)
  }

  const mergeStateFromApiResponse = (prev: AIState, data: NormalizedUkResponse): AIState => {
    const prevAskedIds = Array.isArray(prev.asked_question_ids) ? prev.asked_question_ids : []
    const merged: AIState = {
      ...prev,
      phase: String(data.state_updates?.phase ?? prev.phase ?? 'CLASSIFY'),
      classification_done:
        data.state_updates?.classification_done !== undefined
          ? Boolean(data.state_updates.classification_done)
          : Boolean(prev.classification_done),
      classification:
        (data.state_updates?.classification as Record<string, unknown>) ||
        prev.classification ||
        {},
      path: (data.state_updates?.path as string | null) ?? prev.path ?? null,
      asked_question_ids: Array.isArray(data.state_updates?.asked_question_ids)
        ? (data.state_updates.asked_question_ids as string[])
        : prevAskedIds,
      answers: {
        ...(prev.answers || {}),
        ...((data.state_updates?.answers as Record<string, unknown>) || {}),
      },
      career_profile: data.state_updates?.career_profile ?? prev.career_profile,
      career_brain_profile:
        (data.state_updates?.career_brain_profile as Record<string, unknown>) ??
        prev.career_brain_profile,
      career_brain_result:
        (data.state_updates?.career_brain_result as Record<string, unknown>) ??
        (data.result as { career_brain?: Record<string, unknown> } | undefined)?.career_brain ??
        prev.career_brain_result,
      career_brain_asked:
        (data.state_updates?.career_brain_asked as string[]) ?? prev.career_brain_asked,
      path_story: (data.state_updates?.path_story as string) ?? prev.path_story,
      step_index: (prev.step_index || 0) + 1,
      last_question_id: data.question?.id || null,
    }
    if (data.question?.id) {
      const ids = merged.asked_question_ids ?? []
      if (!ids.includes(data.question.id)) {
        merged.asked_question_ids = [...ids, data.question.id]
      }
    }
    return merged
  }

  const persistAssessmentIfComplete = async (
    data: NormalizedUkResponse,
    mergedAiState: AIState,
    transcript: ConversationMessage[],
    source: string
  ) => {
    const outcome = await handleAssessmentApiCompletion({
      done: data.done,
      result: data.result,
      path: data.path,
      aiState: mergedAiState,
      stateUpdates: data.state_updates,
      conversation: transcript,
      aiEnrichment,
      sessionId: caSessionId,
      persistedResultKeyRef,
      source,
    })
    if (outcome?.sessionId && !caSessionId) {
      setCaSessionId(outcome.sessionId)
    }
  }

  const showResultsWithDelay = (data: NormalizedUkResponse, apiResponse: AIResponse) => {
    setIsTyping(false)
    setMicroStatus(null)
    setShowResultsMessage(false)
    setIsThinking(false)
    setFinalisingResult(true)
    const gen = sessionGenRef.current
    const minMs = 1200
    window.setTimeout(() => {
      if (sessionGenRef.current !== gen) return
      setFinalisingResult(false)
      setShowResultsMessage(true)
      setConversation((prev) => appendAdvisorTranscriptMessage(prev, data.assistant_message))
      setCurrent(apiResponse)
    }, minMs)
  }

  const buildResultsResponse = (
    data: NormalizedUkResponse,
    apiResponse: AIResponse,
    mergedAiState: AIState
  ): AIResponse => {
    if (data.result) return apiResponse
    const resolved = resolveAssessmentCompletion({
      done: true,
      result: data.result,
      aiState: mergedAiState,
      stateUpdates: data.state_updates,
    })
    if (!resolved.result) return apiResponse
    return { ...apiResponse, result: resolved.result as AIResponse['result'] }
  }

  const completeAssessmentFromApi = (
    data: NormalizedUkResponse,
    mergedAiState: AIState,
    transcript: ConversationMessage[],
    apiResponse: AIResponse,
    source: string
  ) => {
    void persistAssessmentIfComplete(data, mergedAiState, transcript, source)
    showResultsWithDelay(data, buildResultsResponse(data, apiResponse, mergedAiState))
  }

  // Auth state + restore guest assessment after signup/login
  useEffect(() => {
    let cancelled = false

    const applySession = async (hasUser: boolean) => {
      if (cancelled) return
      setIsAuthenticated(hasUser)

      if (hasUser && !authRestoreDoneRef.current) {
        authRestoreDoneRef.current = true
        // Do not auto-hydrate old CA analysis into the UI — only transfer guest data in background.
        // User must click "Continue previous assessment" (or ?resume=1) to restore results.
        if (hasCaResultSnapshot()) {
          setHasPreviousAssessment(true)
        }

        const authUserId = await resolveAuthenticatedUserId()
        if (authUserId) {
          await mergeAnonymousAiProfileOnAuth(authUserId)
          await transferGuestAssessmentOnAuth()
          notifyProfileUpdated()
          notifyCareerPlanGenerated()
          if (wasGuestWithAssessmentRef.current) {
            wasGuestWithAssessmentRef.current = false
            router.replace(GUEST_CAREER_DASHBOARD_PATH)
            return
          }
          try {
            const row = await fetchLatestAssessmentForUser(authUserId)
            if (row && buildAssessmentBundleFromRecord(row)) {
              setHasPreviousAssessment(true)
            }
          } catch {
            // ignore — banner is optional
          }
        }
      }
    }

    void supabase.auth.getUser().then(({ data: { user } }) => {
      void applySession(Boolean(user))
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, _session) => {
      void supabase.auth.getUser().then(({ data: { user } }) => {
        void applySession(Boolean(user))
      })
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (isAuthenticated === false && current?.done && current.result) {
      wasGuestWithAssessmentRef.current = true
    }
  }, [isAuthenticated, current?.done, current?.result])

  // Resume mode: anonymous uses localStorage; logged-in users load from Supabase by user_id
  useEffect(() => {
    if (typeof window === 'undefined') return

    const resumeParam = searchParams.get('resume')
    const sessionParam = searchParams.get('ca_session')

    if (resumeParam !== '1') return

    void (async () => {
      try {
        const authUserId = await resolveAuthenticatedUserId()

        if (authUserId) {
          const row = await fetchLatestAssessmentForUser(authUserId)
          if (!row) return
          const bundle = buildAssessmentBundleFromRecord(row)
          if (!bundle) return

          setIsResumeMode(true)
          setCaSessionId(sessionParam ?? row.id)
          setCurrent({
            path: (bundle.aiState.path as string | null) ?? null,
            phase: 'RESULT',
            assistant_message: '',
            question: null,
            allow_free_text: false,
            state_updates: bundle.aiState as AIState,
            done: true,
            result: bundle.ruleResult as AIResponse['result'],
          })
          setAiState(bundle.aiState as AIState)
          const stored = row.result as { ai_personalized_result?: AiPersonalizedUkResult | null }
          if (stored?.ai_personalized_result) {
            setAiEnrichment(stored.ai_personalized_result)
          }
          persistedResultKeyRef.current = row.id
          setShowResultsMessage(true)
          setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
          }, 100)
          return
        }

        const snapshot = loadCaResultSnapshot(sessionParam)
        if (!snapshot?.result?.result) return

        setIsResumeMode(true)
        setCaSessionId(snapshot.sessionId)
        setCurrent({
          path: snapshot.result.path || null,
          phase: 'RESULT',
          assistant_message: '',
          question: null,
          allow_free_text: false,
          state_updates: (snapshot.aiState as AIState) || {},
          done: true,
          result: snapshot.result.result as AIResponse['result'],
        })
        if (snapshot.conversation?.length) setConversation(snapshot.conversation)
        if (snapshot.aiState) setAiState(snapshot.aiState as AIState)
        if (snapshot.aiEnrichment) {
          setAiEnrichment(snapshot.aiEnrichment as AiPersonalizedUkResult)
        } else {
          setEnrichmentTrigger((n) => n + 1)
        }
        persistedResultKeyRef.current = snapshot.sessionId
        setShowResultsMessage(true)
        setTimeout(() => {
          chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
      } catch (err) {
        console.error('Failed to load saved Career Assistant results:', err)
      }
    })()
  }, [searchParams])

  // Save snapshot when results are shown; backup persist if primary path missed
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!current?.done) return

    void handleAssessmentApiCompletion({
      done: true,
      result: current.result,
      path: current.path,
      aiState,
      conversation,
      aiEnrichment,
      sessionId: caSessionId,
      persistedResultKeyRef,
      source: 'useEffect_backup',
    }).then((outcome) => {
      if (outcome?.sessionId && !caSessionId) {
        setCaSessionId(outcome.sessionId)
      }
    })

    if (!completedSessionLoggedRef.current && caSessionId && isAuthenticated) {
      const resolved = resolveAssessmentCompletion({
        done: true,
        result: current.result,
        aiState,
      })
      const resultForSession = resolved.result ?? current.result
      if (!resultForSession) return
      const workNow = resultForSession.work_now?.directions ?? []
      const improveLater = resultForSession.improve_later?.directions ?? []
      const recommendedRoles = [
        ...workNow.map((d: { direction_id: string; direction_title: string }) => ({ id: d.direction_id, title: d.direction_title })),
        ...improveLater.map((d: { direction_id: string; direction_title: string }) => ({ id: d.direction_id, title: d.direction_title })),
      ]
      completeCaSession(caSessionId, recommendedRoles)
      logEvent('career_assistant_completed')
      completedSessionLoggedRef.current = true
    }
  }, [current?.done, current?.result, caSessionId, aiState, conversation, isAuthenticated, aiEnrichment])

  // Fetch AI personalization after results, then re-save to Supabase
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!current?.done || !current.result) return
    if (aiEnrichment) return

    let cancelled = false

    void (async () => {
      try {
        const res = await fetch('/api/ai/career-intelligence/personalize-uk', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            state: aiState,
            ruleResult: current.result,
          }),
        })
        if (!res.ok || cancelled) return
        const data = (await res.json()) as { personalization?: AiPersonalizedUkResult | null }
        if (data.personalization) {
          setAiEnrichment(data.personalization)
        }
      } catch {
        // Rule-based result remains visible
      }
    })()

    return () => {
      cancelled = true
    }
  }, [current?.done, current?.result, aiState, enrichmentTrigger, aiEnrichment])

  // Re-persist when personalization arrives (logged-in users)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!current?.done || !aiEnrichment) return

    const resolved = resolveAssessmentCompletion({
      done: true,
      result: current.result,
      aiState,
    })
    const resultToSave = resolved.result ?? current.result
    if (!resultToSave) return

    void (async () => {
      const userId = await resolveAuthenticatedUserId()
      if (!userId) return

      const sessionId = caSessionId ?? `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
      const persistKey = `${sessionId}:${resultToSave.summary ?? 'result'}`
      const personalizedKey = `${persistKey}:personalized`
      if (persistedResultKeyRef.current === personalizedKey) return

      const enrichedSave = await persistCareerAssistantResult({
        result: resultToSave,
        aiState,
        aiPersonalized: aiEnrichment,
        source: 'logged_in_personalized',
      })
      console.log('[uk-career-assistant] personalized save result', enrichedSave)
      if (enrichedSave.ok) {
        persistedResultKeyRef.current = personalizedKey
        saveCaResultSnapshot({
          timestamp: Date.now(),
          sessionId,
          result: { path: current.path, result: resultToSave },
          aiState,
          conversation,
          aiEnrichment,
        })
      }
    })()
  }, [aiEnrichment, current?.done, current?.result, aiState, conversation, caSessionId, current?.path])

  // Sync answers and path to session row (best-effort)
  useEffect(() => {
    if (!caSessionId) return
    updateCaSessionAnswers(caSessionId, aiState.answers ?? {}, aiState.path ?? null)
  }, [caSessionId, aiState.answers, aiState.path])

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [conversation, isThinking, current])

  // Deduplicate conversation on update
  useEffect(() => {
    setConversation(prev => dedupeTranscript(prev))
  }, [conversation.length])

  const CLEAN_START_STATE = {
    phase: 'CLASSIFY' as const,
    classification_done: false,
    classification: {},
    path: null,
    answers: {} as Record<string, unknown>,
    asked_question_ids: [] as string[],
    last_question_id: null as string | null,
    step_index: 0,
    preferences: {},
    preference_gate_done: false,
    ai_follow_up_ids: [] as string[],
  }

  const handleStart = async () => {
    sessionGenRef.current += 1
    const gen = sessionGenRef.current
    setLoading(true)
    setError(null)
    setConversation([])
    setAiState({
      asked_question_ids: [],
      answers: {},
      phase: 'CLASSIFY',
      classification_done: false,
      classification: {},
      path: null,
      step_index: 0,
      last_question_id: null,
      preferences: {},
      preference_gate_done: false,
      ai_follow_up_ids: [],
    })
    setCurrent(null)
    setSelectedOptions([])
    setFreeText('')
    setPathFreeText('')
    setPathFreeTextSubmitted(false)
    setLastUserInput(null)
    setLastState({})
    // ANTI-LOOP GUARD: Reset tracking
    setAskedQuestionIds(new Set())
    setAnsweredQuestionIds(new Set())
    setAutoSkipAttempts(0)
    // Reset typing and micro status
    setIsTyping(false)
    setMicroStatus(null)
    setShowResultsMessage(false)
    setShowAllMessages(false) // Reset message collapse state
    setIsThinking(true)
    setThinkingText('Getting your first question ready…')
    setRenderedQuestionIds(new Set())
    setHasShownIntro(false)
    setAiEnrichment(null)
    setJazJobazPlan(null)
    setFinalisingResult(false)
    setIsResumeMode(false)
    jazAnalyseKeyRef.current = null
    persistedResultKeyRef.current = null
    lastAnswerKeyRef.current = null
    completedSessionLoggedRef.current = false
    setCaSessionId(null)
    createCaSession(null).then((id) => {
      if (id && sessionGenRef.current === gen) setCaSessionId(id)
    })
    logEvent('career_assistant_opened')

    try {
      // Always start from a clean CLASSIFY state (never reuse stale React state).
      const fullStateObject = { ...CLEAN_START_STATE }
      
      // Dev-only logging
      if (process.env.NODE_ENV === 'development') {
        console.log('CLIENT->SERVER state', fullStateObject)
      }
      
      const response = await fetch('/api/uk-career-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: fullStateObject,
          user_input: 'START'
        })
      })

      let data = normalizeUkCareerClientResponse(await response.json())
      if (sessionGenRef.current !== gen) return

      if ((data as { error?: string }).error) {
        const err = data as { message?: string; raw?: string }
        setError({ message: err.message ?? 'Error', raw: err.raw })
        return
      }

      // ANTI-LOOP GUARD: legacy questions only
      const questionId = data.question?.id
      const isDuplicate =
        questionId &&
        !questionId.startsWith('cb_') &&
        askedQuestionIds.has(questionId) &&
        answeredQuestionIds.has(questionId)
      
      if (isDuplicate && autoSkipAttempts < 2) {
        // Auto-skip duplicate question
        setAutoSkipAttempts(prev => prev + 1)
        // Immediately request next step with "NEXT"
        const fullStateObject = {
          phase: CLEAN_START_STATE.phase,
          classification_done: CLEAN_START_STATE.classification_done,
          classification: CLEAN_START_STATE.classification,
          path: CLEAN_START_STATE.path,
          answers: CLEAN_START_STATE.answers,
          asked_question_ids: CLEAN_START_STATE.asked_question_ids,
          last_question_id: CLEAN_START_STATE.last_question_id,
          step_index: CLEAN_START_STATE.step_index
        }
        
        const skipResponse = await fetch('/api/uk-career-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            state: fullStateObject,
            user_input: 'NEXT'
          })
        })
        
        const skipData = normalizeUkCareerClientResponse(await skipResponse.json())
        if (sessionGenRef.current !== gen) return
        if (!(skipData as { error?: string }).error && skipData.question?.id !== questionId) {
          data = skipData
          setAutoSkipAttempts(0)
        } else {
          setAutoSkipAttempts(0)
        }
      } else if (isDuplicate) {
        setAutoSkipAttempts(0)
      }
      
      const prevAsked: string[] = []
      const updatedState: AIState = mergeStateFromApiResponse(
        {
          ...CLEAN_START_STATE,
          asked_question_ids: Array.isArray(data.state_updates?.asked_question_ids)
            ? (data.state_updates.asked_question_ids as string[])
            : prevAsked,
          answers: {
            ...((data.state_updates?.answers as Record<string, unknown>) || {}),
          },
        },
        data
      )

      if (data.done) {
        setIsThinking(false)
        completeAssessmentFromApi(data, updatedState, [], data as AIResponse, 'handleStart_completion')
      } else if (data.question) {
          const qid = data.question.id
          // Keep thinking until intro + first question are painted (avoids empty dark panel).
          const revealDelay = 450 + Math.random() * 250
          window.setTimeout(() => {
            if (sessionGenRef.current !== gen) return
            setIsThinking(false)
            setConversation((prev) => {
              const introMsg =
                "Hi! I'll help you find the best career path for your situation in the UK. Let me ask you a few questions to get started."
              const withIntro =
                prev.some((m) => m.role === 'assistant' && m.content === introMsg)
                  ? prev
                  : [...prev, { role: 'assistant' as const, content: introMsg }]
              return appendAdvisorTranscriptMessage(withIntro, data.assistant_message)
            })
            setHasShownIntro(true)
            setRenderedQuestionIds((prev) => new Set([...prev, qid]))
            setCurrent(data as AIResponse)
          }, revealDelay)
      } else {
        setIsThinking(false)
        setCurrent(data as AIResponse)
      }
      
      const newPhase = data.state_updates?.phase || data.phase || aiState.phase || 'CLASSIFY'
      const wasInClassify = aiState.phase === 'CLASSIFY' || !aiState.phase
      const isNowInPath = newPhase === 'PATH' || newPhase === 'assessment'
      if (wasInClassify && isNowInPath) {
        setPathFreeTextSubmitted(false) // Reset to show free-text area at start of PATH phase
      }
      // If a question was returned, add it to asked_question_ids if not already present
      if (data.question?.id) {
        const ids = updatedState.asked_question_ids ?? []
        if (!ids.includes(data.question.id)) {
          updatedState.asked_question_ids = [...ids, data.question.id]
        }
      }
      setAiState(updatedState)
      
      const startQid = data.question?.id
      if (startQid) {
        setAskedQuestionIds(prev => new Set([...prev, startQid]))
      }
    } catch (err: any) {
      setIsThinking(false)
      setError({ message: err.message || 'Failed to start conversation' })
      // Add error message to conversation
      setConversation(prev => {
        const errorMsg = "Something went wrong. Please retry."
        const lastMessage = prev[prev.length - 1]
        if (lastMessage?.role === 'assistant' && lastMessage?.content === errorMsg) {
          return prev // Don't add duplicate
        }
        return [...prev, { role: 'assistant', content: errorMsg }]
      })
    } finally {
      setLoading(false)
    }
  }

  // Skip intro — open straight into the first question (unless resuming a saved session)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (searchParams.get('resume') === '1') return
    if (autoStartRef.current) return
    autoStartRef.current = true
    if (hasCaResultSnapshot()) {
      setHasPreviousAssessment(true)
    }
    void handleStart()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- mount / resume-param only
  }, [searchParams])

  const hydrateFromLocalSnapshot = (snapshot: NonNullable<ReturnType<typeof loadCaResultSnapshot>>) => {
    setIsResumeMode(true)
    setHasPreviousAssessment(false)
    setCaSessionId(snapshot.sessionId)
    setCurrent({
      path: snapshot.result.path || null,
      phase: 'RESULT',
      assistant_message: '',
      question: null,
      allow_free_text: false,
      state_updates: (snapshot.aiState as AIState) || {},
      done: true,
      result: snapshot.result.result as AIResponse['result'],
    })
    if (snapshot.conversation?.length) setConversation(snapshot.conversation)
    if (snapshot.aiState) setAiState(snapshot.aiState as AIState)
    if (snapshot.aiEnrichment) {
      setAiEnrichment(snapshot.aiEnrichment as AiPersonalizedUkResult)
    } else {
      setEnrichmentTrigger((n) => n + 1)
    }
    persistedResultKeyRef.current = snapshot.sessionId
    setShowResultsMessage(true)
  }

  const handleContinuePreviousAssessment = async () => {
    setLoading(true)
    setError(null)
    try {
      const snapshot = loadCaResultSnapshot()
      if (snapshot?.result?.result) {
        hydrateFromLocalSnapshot(snapshot)
        return
      }
      const authUserId = await resolveAuthenticatedUserId()
      if (authUserId) {
        const row = await fetchLatestAssessmentForUser(authUserId)
        if (!row) return
        const bundle = buildAssessmentBundleFromRecord(row)
        if (!bundle) return
        setIsResumeMode(true)
        setHasPreviousAssessment(false)
        setCaSessionId(row.id)
        setCurrent({
          path: (bundle.aiState.path as string | null) ?? null,
          phase: 'RESULT',
          assistant_message: '',
          question: null,
          allow_free_text: false,
          state_updates: bundle.aiState as AIState,
          done: true,
          result: bundle.ruleResult as AIResponse['result'],
        })
        setAiState(bundle.aiState as AIState)
        const stored = row.result as { ai_personalized_result?: AiPersonalizedUkResult | null }
        if (stored?.ai_personalized_result) {
          setAiEnrichment(stored.ai_personalized_result)
        }
        persistedResultKeyRef.current = row.id
        setShowResultsMessage(true)
      }
    } catch (err) {
      console.error('Failed to continue previous assessment:', err)
      setError({ message: 'Could not load previous assessment. Try Start fresh.' })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (
    input: string | string[],
    opts?: { pathStoryOnly?: boolean }
  ) => {
    if (loading || isTyping) return

    const pathStoryOnly = opts?.pathStoryOnly === true
    const currentQuestionId = current?.question?.id
    const answerKey = `${currentQuestionId || 'none'}:${Array.isArray(input) ? input.join(',') : input}`
    if (lastAnswerKeyRef.current === answerKey) return
    lastAnswerKeyRef.current = answerKey

    setLoading(true)
    setError(null)

    if (currentQuestionId === 'cb_user_goal' && !pathStoryOnly) {
      const goalInput = Array.isArray(input) ? input[0] : input
      const redirect = CAREER_ENGINE_GOAL_REDIRECTS[goalInput as StrategicGoalId]
      if (redirect) {
        clearCareerEngineConversationCaches(goalInput as StrategicGoalId)
        router.push(redirect)
        setLoading(false)
        return
      }
    }

    // Store actual input and state for retry (IDs, not labels)
    setLastUserInput(input)
    setLastState(aiState)

    // Update answers: store the answer for the current question
    const brainFlow = isCareerBrainClientFlow(aiState, current as NormalizedUkResponse | null)
    const updatedAnswers = { ...(aiState.answers || {}) }
    const updatedAskedIds = [...(aiState.asked_question_ids || [])]
    
    if (
      currentQuestionId &&
      !pathStoryOnly &&
      shouldCommitAnswerToState(currentQuestionId, brainFlow)
    ) {
      if (currentQuestionId === 'currentJobTitle' && typeof input === 'string') {
        console.log('[Grow Career — job title]', {
          receivedJobTitle: input.trim(),
          savedJobTitle: input.trim(),
          stepBefore: currentQuestionId,
          stepAfter: 'pending-server-advance',
          source: 'client:commit',
        })
      }
      updatedAnswers[currentQuestionId] = input
      // Add to asked_question_ids if not already present
      if (!updatedAskedIds.includes(currentQuestionId)) {
        updatedAskedIds.push(currentQuestionId)
      }
      // ANTI-LOOP GUARD: Track answered questions
      setAnsweredQuestionIds(prev => new Set([...prev, currentQuestionId]))
      setAutoSkipAttempts(0) // Reset on new answer
    }

    // Update state immediately with answers
    const stateWithAnswers = {
      ...aiState,
      asked_question_ids: updatedAskedIds,
      answers: updatedAnswers
    }
    setAiState(stateWithAnswers)

    // Add user message to conversation - display labels, not values
    let userMessage: string
    const qOptions = current?.question?.options ?? []
    if (Array.isArray(input)) {
      const labels = input.map(val => {
        const option = qOptions.find(opt => opt.value === val)
        return option?.label || val
      })
      userMessage = labels.join(', ')
    } else {
      const option = qOptions.find(opt => opt.value === input)
      userMessage = option?.label || input
    }
    
    if (!pathStoryOnly || (typeof input === 'string' && input.trim())) {
      setConversation(prev => [...prev, { role: 'user', content: userMessage }])
    }

    // Show thinking bubble immediately
    const thinkingMsg = pickThinkingText(currentQuestionId, stateWithAnswers)
    setThinkingText(thinkingMsg)
    setIsThinking(true)

    try {
      // Build full state object with all required fields
      const fullStateObject = {
        phase: stateWithAnswers.phase || 'CLASSIFY',
        classification_done: stateWithAnswers.classification_done || false,
        classification: stateWithAnswers.classification || {},
        path: stateWithAnswers.path || null,
        answers: updatedAnswers,
        asked_question_ids: updatedAskedIds,
        path_story: stateWithAnswers.path_story,
        career_brain_profile: stateWithAnswers.career_brain_profile,
        career_brain_asked: stateWithAnswers.career_brain_asked,
        career_brain_result: stateWithAnswers.career_brain_result,
        last_question_id: currentQuestionId || stateWithAnswers.last_question_id || null,
        step_index: (stateWithAnswers.step_index || 0) + 1
      }
      
      // Dev-only logging
      if (process.env.NODE_ENV === 'development') {
        console.log('CLIENT->SERVER state', fullStateObject)
      }
      
      const response = await fetch('/api/uk-career-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: fullStateObject,
          user_input: pathStoryOnly ? 'PATH_STORY' : input,
          current_question_id: pathStoryOnly ? undefined : currentQuestionId || undefined,
          free_text: pathStoryOnly
            ? (typeof input === 'string' ? input.trim() : undefined)
            : pathFreeText.trim() || undefined,
          path_story_only: pathStoryOnly || undefined,
        })
      })

      let data = normalizeUkCareerClientResponse(await response.json())

      if ((data as { error?: string }).error) {
        const err = data as { message?: string; raw?: string }
        setError({ message: err.message ?? 'Error', raw: err.raw })
        return
      }

      const questionId = data.question?.id
      const isDuplicate =
        questionId &&
        !questionId.startsWith('cb_') &&
        askedQuestionIds.has(questionId) &&
        answeredQuestionIds.has(questionId)
      
      if (isDuplicate && autoSkipAttempts < 2) {
        // Auto-skip duplicate question
        setAutoSkipAttempts(prev => prev + 1)
        // Immediately request next step with "NEXT"
        const fullStateObjectForSkip = {
          phase: stateWithAnswers.phase || 'CLASSIFY',
          classification_done: stateWithAnswers.classification_done || false,
          classification: stateWithAnswers.classification || {},
          path: stateWithAnswers.path || null,
          answers: updatedAnswers,
          asked_question_ids: updatedAskedIds,
          last_question_id: currentQuestionId || stateWithAnswers.last_question_id || null,
          step_index: (stateWithAnswers.step_index || 0) + 1
        }
        
        const skipResponse = await fetch('/api/uk-career-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            state: fullStateObjectForSkip,
            user_input: 'NEXT'
          })
        })
        
        const skipData = normalizeUkCareerClientResponse(await skipResponse.json())
        if (!(skipData as { error?: string }).error && skipData.question?.id !== questionId) {
          data = skipData
          setAutoSkipAttempts(0)
        } else {
          setAutoSkipAttempts(0)
        }
      } else if (isDuplicate) {
        setAutoSkipAttempts(0)
      }
      
      const apiResponse = data as AIResponse
      const mergedAiState = mergeStateFromApiResponse(stateWithAnswers, data)
      const transcriptForSave = !pathStoryOnly || (typeof input === 'string' && input.trim())
        ? [...conversation, { role: 'user' as const, content: userMessage }]
        : conversation

      if (data.done) {
        completeAssessmentFromApi(
          data,
          mergedAiState,
          transcriptForSave,
          apiResponse,
          'handleSubmit_completion'
        )
      } else if (data.question) {
        const questionId = data.question.id
        const status = getMicroStatus(
          mergedAiState,
          (data.phase || 'CLASSIFY') as 'CLASSIFY' | 'PATH' | 'RESULT',
          data.question?.id || null
        )
        const thinkingText = status?.line || 'Thinking...'
        setIsTyping(true)
        setMicroStatus(null)
        const typingDelay = 450 + Math.random() * 350
        setTimeout(() => {
          setIsTyping(false)
          setIsThinking(false)
          setConversation((prev) => appendAdvisorTranscriptMessage(prev, data.assistant_message))
          setRenderedQuestionIds((prev) => new Set([...prev, questionId]))
          setCurrent(apiResponse)
        }, typingDelay)
      } else {
        setCurrent(apiResponse)
      }

      setAiState(mergedAiState)
      
      const qid = data.question?.id
      if (qid) {
        setAskedQuestionIds(prev => new Set([...prev, qid]))
      }
      
      const newPhase = data.state_updates?.phase || data.phase
      const wasInClassify = aiState.phase === 'CLASSIFY' || !aiState.phase
      const isNowInPath = newPhase === 'PATH' || newPhase === 'assessment'
      if (wasInClassify && isNowInPath) {
        setPathFreeTextSubmitted(false)
      }
      
      setSelectedOptions([])
      setFreeText('')
      // Note: pathFreeTextSubmitted is only set when user explicitly clicks Continue/Skip
      // Not automatically set here to allow free-text to show at start of PATH phase
      
      // Clear free-text when question changes (to hide free-text input after submit)
      // This ensures free-text input only shows for the current question
      if (data.question?.id !== currentQuestionId) {
        setFreeText('')
        setSelectedOptions([]) // Also clear selected options when question changes
      }
    } catch (err: any) {
      setIsThinking(false)
      setError({ message: err.message || 'Failed to submit response' })
      // Add error message to conversation
      setConversation(prev => {
        const errorMsg = "Something went wrong. Please retry."
        const lastMessage = prev[prev.length - 1]
        if (lastMessage?.role === 'assistant' && lastMessage?.content === errorMsg) {
          return prev // Don't add duplicate
        }
        return [...prev, { role: 'assistant', content: errorMsg }]
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOptionClick = (optionValue: string) => {
    if (!current?.question) return
    const options = current.question.options ?? []
    if (options.length === 0 && current.question.allow_free_text !== true) return

    console.log("ANSWER SUBMIT", current.question.id, optionValue)

    const option = options.find(o => o.value === optionValue)
    const labelLower = option?.label?.toLowerCase() || ''
    const valueLower = optionValue?.toLowerCase() || ''
    const isOtherOption = valueLower === 'other' || 
                          labelLower.includes('other') || 
                          labelLower.includes('specify') || 
                          labelLower.includes('explain') ||
                          labelLower.includes('not listed')

    if (current.question.type === 'single') {
      // Single select: if "Other" option, show free-text input instead of submitting immediately
      if (isOtherOption && current.question.allow_free_text !== true) {
        // For "Other" options, select it first to show free-text input
        setSelectedOptions([optionValue])
        // Don't submit yet - wait for free-text input
        return
      }
      // Otherwise, submit immediately
      handleSubmit(optionValue)
    } else {
      // Multi select: toggle selection
      setSelectedOptions(prev => {
        const isSelected = prev.includes(optionValue)
        if (isSelected) {
          return prev.filter(val => val !== optionValue)
        } else {
          const maxSelect = current.question?.max_select || Infinity
          if (prev.length >= maxSelect) {
            return prev // Don't add if at max
          }
          return [...prev, optionValue]
        }
      })
    }
  }

  const handleMultiSubmit = () => {
    if (selectedOptions.length === 0) return
    handleSubmit(selectedOptions)
  }

  const handleFreeTextSubmit = () => {
    if (!freeText.trim()) return
    // If "Other" option was selected, submit both the option value and the free-text
    if (selectedOptions.length > 0 && selectedOptions.some(opt => {
      const option = current?.question?.options.find(o => o.value === opt)
      const labelLower = option?.label?.toLowerCase() || ''
      const valueLower = opt?.toLowerCase() || ''
      return valueLower === 'other' || 
             labelLower.includes('other') || 
             labelLower.includes('specify') || 
             labelLower.includes('explain') ||
             labelLower.includes('not listed')
    })) {
      // For "Other" options, submit the free-text as the answer
      handleSubmit(freeText.trim())
    } else {
      // For regular free-text questions, submit the free-text
      handleSubmit(freeText.trim())
    }
  }

  // STAGE 2.1: RESET RULE — clear conversation + caches, then start a clean session
  const handleRestart = () => {
    clearCaResultSnapshot()
    clearCareerEngineConversationCaches()
    setHasPreviousAssessment(false)
    setIsResumeMode(false)
    setShowResultsMessage(false)
    setFinalisingResult(false)
    setJazJobazPlan(null)
    setAiEnrichment(null)
    setCurrent(null)
    setConversation([])
    authRestoreDoneRef.current = true // do not re-hydrate previous assessment after restart
    autoStartRef.current = true // prevent double auto-start fighting restart
    // Drop resume query so effects cannot restore old results
    if (searchParams.get('resume') === '1' || searchParams.get('ca_session')) {
      router.replace(isEmbed ? '/uk-career-assistant?embed=1' : '/uk-career-assistant')
    }
    void handleStart()
  }

  /** Clears CA draft/session only — not My Plan, CV, or account data. */
  const handleStartFresh = () => {
    handleRestart()
  }

  // Handle "Start new assessment" in resume mode
  const handleStartNewAssessment = () => {
    handleStartFresh()
    router.replace(isEmbed ? '/uk-career-assistant?embed=1' : '/uk-career-assistant')
  }

  const handleRetry = async () => {
    if (loading) return
    
    setError(null)
    setLoading(true)

    // Show thinking bubble immediately
    const thinkingMsg = pickThinkingText(lastState.last_question_id, lastState)
    setThinkingText(thinkingMsg)
    setIsThinking(true)

    // Retry with last payload (state + user_input)
    // Build full state object
    const fullStateObject = {
      phase: lastState.phase || 'CLASSIFY',
      classification_done: lastState.classification_done || false,
      classification: lastState.classification || {},
      path: lastState.path || null,
      answers: lastState.answers || {},
      asked_question_ids: lastState.asked_question_ids || [],
      last_question_id: lastState.last_question_id || null,
      step_index: lastState.step_index || 0
    }
    
    // Dev-only logging
    if (process.env.NODE_ENV === 'development') {
      console.log('CLIENT->SERVER state', fullStateObject)
    }
    
    const payload = {
      state: fullStateObject,
      user_input: lastUserInput !== null ? lastUserInput : 'START'
    }

    try {
      const response = await fetch('/api/uk-career-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      let data = normalizeUkCareerClientResponse(await response.json())

      // Clear thinking bubble when response arrives (success or error)
      setIsThinking(false)

      if ((data as { error?: string }).error) {
        const err = data as { message?: string; raw?: string }
        setError({ message: err.message ?? 'Error', raw: err.raw })
        setConversation(prev => {
          const errorMsg = "Something went wrong. Please retry."
          const lastMessage = prev[prev.length - 1]
          if (lastMessage?.role === 'assistant' && lastMessage?.content === errorMsg) {
            return prev
          }
          return [...prev, { role: 'assistant', content: errorMsg }]
        })
        return
      }

      const mergedAiState = mergeStateFromApiResponse(lastState, data)
      const apiResponse = data as AIResponse

      if (data.done) {
        completeAssessmentFromApi(data, mergedAiState, conversation, apiResponse, 'handleRetry_completion')
      } else if (data.question) {
        const questionId = data.question.id
        if (renderedQuestionIds.has(questionId)) {
          setAiState(mergedAiState)
          return
        }
        setRenderedQuestionIds(prev => new Set([...prev, questionId]))
        setConversation((prev) => appendAdvisorTranscriptMessage(prev, data.assistant_message))
        setCurrent(apiResponse)
      } else {
        setCurrent(apiResponse)
      }

      setAiState(mergedAiState)
      
      // Reset UI state
      setSelectedOptions([])
      setFreeText('')
      // Note: pathFreeTextSubmitted is only set when user explicitly clicks Continue/Skip
    } catch (err: any) {
      setIsThinking(false)
      setError({ message: err.message || 'Failed to retry' })
      // Add error message to conversation
      setConversation(prev => {
        const errorMsg = "Something went wrong. Please retry."
        const lastMessage = prev[prev.length - 1]
        if (lastMessage?.role === 'assistant' && lastMessage?.content === errorMsg) {
          return prev // Don't add duplicate
        }
        return [...prev, { role: 'assistant', content: errorMsg }]
      })
    } finally {
      setLoading(false)
    }
  }

  const activeQuestion = current?.question ?? null
  const brainFlowActive = isCareerBrainClientFlow(aiState, current as NormalizedUkResponse | null)
  const hasPathStory = Boolean(String(aiState.path_story ?? '').trim())
  const backgroundDiscoveryDone =
    aiState.answers?.cb_field_intent != null ||
    Boolean(aiState.classification_done)
  const showPathStoryPanel =
    !finalisingResult &&
    Boolean(current) &&
    !current?.done &&
    !aiState.career_brain_result &&
    (current?.phase === 'PATH' || current?.phase === 'assessment') &&
    !pathFreeTextSubmitted &&
    !hasPathStory &&
    backgroundDiscoveryDone &&
    (brainFlowActive ? !activeQuestion?.id?.startsWith('cb_') : Boolean(aiState.path))

  const canSubmitMulti = activeQuestion?.type === 'multi' && selectedOptions.length > 0
  const maxSelectReached =
    activeQuestion?.type === 'multi' &&
    activeQuestion.max_select != null &&
    selectedOptions.length >= activeQuestion.max_select

  // Helper function to strip "Next:" prefix from assistant messages
  const cleanAssistantMessage = (text: string): string => {
    return text.replace(/^Next:\s*/i, '').trim()
  }

  // Get display messages (last 8 if collapsed, all if expanded)
  const getDisplayMessages = () => {
    if (showAllMessages || conversation.length <= 8) {
      return conversation
    }
    return conversation.slice(-8)
  }

  const displayMessages = getDisplayMessages()
  const hasOlderMessages = conversation.length > 8

  const started =
    conversation.length > 0 ||
    isThinking ||
    finalisingResult ||
    current !== null ||
    Boolean(error)
  const showChatPanel =
    conversation.length > 0 || isThinking || finalisingResult

  const liveIntelligence = useMemo(() => {
    const resultDirs = current?.done && current.result
      ? [
          ...(current.result.work_now?.directions ?? []),
          ...(current.result.improve_later?.directions ?? []),
        ].map((d) => ({ direction_id: d.direction_id, direction_title: d.direction_title }))
      : undefined
    return deriveLiveIntelligence(aiState, resultDirs, Boolean(current?.done && current.result))
  }, [aiState, current])

  const unifiedEmployabilityScore = useMemo(() => {
    const brain = aiState.career_brain_result as {
      employabilityScore?: number
      businessDiscoveryGrowth?: unknown
      ukTransitionGrowth?: unknown
    } | undefined
    if (brain?.businessDiscoveryGrowth || brain?.ukTransitionGrowth) return null
    const brainScore = brain?.employabilityScore
    if (typeof brainScore === 'number' && brainScore > 0) return brainScore
    const advisorScore = aiState.career_profile?.aiInsights?.employabilityScore
    if (typeof advisorScore === 'number' && advisorScore > 0) return advisorScore
    return null
  }, [aiState.career_brain_result, aiState.career_profile?.aiInsights?.employabilityScore])

  // JAZ Career Engine — enhance result plan via internal analyse API (Ollama / safe fallback).
  // Legacy mapCareerActionPlanToJobAZPlan remains until analyse succeeds.
  useEffect(() => {
    if (!current?.done) return
    const hasResult = Boolean(current.result || aiState.career_brain_result)
    if (!hasResult) return

    const answers = {
      ...(aiState.answers || {}),
      ...(typeof aiState.career_brain_result === 'object' && aiState.career_brain_result
        ? { _career_brain: true }
        : {}),
    } as Record<string, unknown>

    const goal =
      String(
        (aiState.answers as Record<string, unknown>)?.cb_user_goal ||
          (aiState.answers as Record<string, unknown>)?.user_goal ||
          aiState.path ||
          'unknown'
      )

    const key = JSON.stringify({
      goal,
      answers: aiState.answers,
      skills: (aiState.answers as Record<string, unknown>)?.side_skills,
    })
    if (jazAnalyseKeyRef.current === key) return
    jazAnalyseKeyRef.current = key

    let cancelled = false
    const run = async () => {
      try {
        const input = buildJazAnalyseInputFromAnswers({
          answers,
          goal,
          pathId: String(aiState.path || 'uk_career_assistant'),
          sessionId: caSessionId,
        })
        const res = await fetch('/api/jaz-career/analyse', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(input),
        })
        if (!res.ok) return
        const data = (await res.json()) as JazAnalyseResult
        if (cancelled || !data?.engine_version) return
        setJazJobazPlan(
          mapJazAnalyseToJobAZPlan(data, {
            pathId: 'uk_career_assistant',
            coachNotes: data.why_this_route_fits,
          })
        )
        console.info('[UK CA] jazJobazPlan set — UI will prefer JAZ', {
          ai_provider: data.ai_provider,
          engine_version: data.engine_version,
          route_title: data.route_title,
          current_focus: data.current_focus,
          next_upgrade: data.next_upgrade,
          work_now_roles: data.work_now_roles?.map((r) => r.title),
        })
      } catch {
        console.warn('[UK CA] jaz-career/analyse failed — keeping legacyPlan')
        // Keep legacy JobAZPlan — never break UI
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [
    current?.done,
    current?.result,
    aiState.answers,
    aiState.career_brain_result,
    aiState.path,
    caSessionId,
  ])

  return (
    <div
      className={cn(
        'uk-career-assistant text-slate-50 relative overflow-hidden',
        isEmbed ? 'min-h-0 h-[100dvh] bg-slate-950' : 'min-h-screen'
      )}
    >
      {!isEmbed && <UkCareerBackground />}

      <main
        className={cn(
          'relative z-10 mx-auto',
          isEmbed
            ? 'max-w-none px-3 py-3 h-full overflow-y-auto'
            : 'max-w-7xl px-4 md:px-6 lg:px-8 py-6 md:py-10'
        )}
      >
        <UkCareerHero
          started={started}
          intelligence={liveIntelligence}
          loading={loading}
          embed={isEmbed}
          showStatusChips={false}
        />

        {hasPreviousAssessment && !current?.done && !isResumeMode && (
          <UkCareerPreviousAssessmentBanner
            loading={loading}
            onContinue={() => void handleContinuePreviousAssessment()}
            onStartFresh={handleStartFresh}
          />
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-red-500/50 bg-red-950/50 backdrop-blur-xl">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-red-300 font-medium mb-1">{error.message}</p>
                {error.raw && (
                  <details className="mt-2">
                    <summary className="text-red-400 text-sm cursor-pointer hover:text-red-300">
                      Show raw response
                    </summary>
                    <pre className="mt-2 text-xs text-red-200/80 bg-red-950/30 p-2 rounded overflow-auto max-h-60">
                      {error.raw}
                    </pre>
                  </details>
                )}
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleRetry}
                    disabled={loading}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-[0_0_25px_rgba(139,92,246,0.4)]"
                  >
                    Retry
                  </button>
                  <button
                    onClick={handleStartFresh}
                    disabled={loading}
                    className="uk-ca-secondary-btn px-4 py-2 bg-[#1f2937] border border-white/10 hover:border-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all duration-200"
                  >
                    Start fresh
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {started && (
          <div className="grid grid-cols-1 max-w-3xl gap-6 items-start">
            <div className="min-w-0 space-y-4">
              {/* Path/nudge previews suppressed during questions — conversation first */}

        {/* Chat Transcript — only when there is content or an active thinking/finalising state */}
        {showChatPanel && (
          <div className="uk-ca-panel mb-6 rounded-2xl border border-violet-500/15 bg-slate-950/60 backdrop-blur-xl shadow-[0_0_50px_rgba(139,92,246,0.1)] p-4 md:p-6 relative transition-all duration-300">
            {/* Vignette effect */}
            <div className="absolute inset-0 rounded-2xl pointer-events-none" 
                 style={{
                   boxShadow: 'inset 0 0 60px rgba(0,0,0,0.3)'
                 }} />
            
            <div className="relative max-h-[500px] overflow-y-auto space-y-4 pr-2" style={{
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(139, 92, 246, 0.3) transparent'
            }}>
              {/* Show earlier button */}
              {hasOlderMessages && !showAllMessages && (
                <div className="flex justify-center pb-2">
                  <button
                    onClick={() => setShowAllMessages(true)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors rounded-xl hover:bg-white/5"
                  >
                    Show earlier messages ({conversation.length - 6} more)
                  </button>
                </div>
              )}
              
              {/* Display messages (last 8 or all) */}
              {displayMessages.map((msg, idx) => {
                // Calculate actual index in full conversation
                const actualIdx = showAllMessages || conversation.length <= 8 
                  ? idx 
                  : conversation.length - 8 + idx
                return msg.role === 'assistant' ? (
                  <AssistantBubble 
                    key={actualIdx}
                    content={msg.content}
                    timestamp="Just now"
                    showTimestamp={false}
                  />
                ) : (
                  <UserBubble 
                    key={actualIdx}
                    content={msg.content}
                    timestamp="Just now"
                    showTimestamp={false}
                  />
                )
              })}
              
              {/* Thinking bubble (shown while waiting for API response) */}
              {isThinking && !finalisingResult && (
                <ThinkingBubble message={thinkingText} />
              )}

              {finalisingResult && (
                <JazFinalisingRoadmap complete={false} minMs={1200} />
              )}
              
              {/* Scroll anchor */}
              <div ref={chatEndRef} />
              
              {/* Collapse button */}
              {showAllMessages && hasOlderMessages && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setShowAllMessages(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors rounded-xl hover:bg-white/5"
                  >
                    Show less
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Result Display */}
        {!finalisingResult && current?.done && (current.result || aiState.career_brain_result) && (() => {
          const displayResult =
            current.result ??
            (resolveAssessmentCompletion({
              done: true,
              result: null,
              aiState,
            }).result as AIResponse['result'])
          if (!displayResult) return null
          const isGuest = isAuthenticated === false
          const careerBrain = (displayResult as { career_brain?: import('@/lib/career-brain/types').CareerBrainOutput })
            .career_brain
          const growGrowth = careerBrain?.growCareerGrowth
          const bizGrowth = careerBrain?.businessDiscoveryGrowth
          const ukGrowth = careerBrain?.ukTransitionGrowth
          const isBusinessPath = !!bizGrowth
          const isUkTransitionPath = !!ukGrowth
          const heroSummary =
            bizGrowth?.finalReport?.verdictExplanation ??
            bizGrowth?.summary ??
            ukGrowth?.summary ??
            growGrowth?.finalReport?.careerReasoning ??
            growGrowth?.currentPositionSummary ??
            aiEnrichment?.personalisedSummary ??
            displayResult.summary

          const actionPlan = buildCareerActionPlan({
            result: displayResult as UkCareerRuleResult & { career_brain?: import('@/lib/career-brain/types').CareerBrainOutput },
            brain: careerBrain,
            aiSummary: heroSummary,
            nextBestAction: aiEnrichment?.nextBestAction ?? undefined,
            isGuest,
            progress: isGuest
              ? undefined
              : {
                  cvReady: missionProgress.cvReady,
                  hasBaseCv: missionProgress.hasBaseCv,
                  appliedJobsCount: missionProgress.appliedJobsCount,
                  savedJobsCount: missionProgress.savedJobsCount,
                  trainingStarted: missionProgress.trainingStarted,
                },
          })

          const growTarget =
            growGrowth?.nextRealisticStep?.role ||
            growGrowth?.promotionRoadmap?.workNow ||
            growGrowth?.currentJobTitle ||
            growGrowth?.currentPositionSummary
          const bizIdea =
            bizGrowth?.finalReport?.businessIdeaLabel ||
            bizGrowth?.finalReport?.mostRealisticModel?.title

          if (growTarget) actionPlan.headline = String(growTarget)
          if (bizIdea) actionPlan.headline = String(bizIdea)

          // Prefer grow certifications as training hints when action plan courses are empty
          if (
            growGrowth?.recommendedCertifications?.length &&
            !(actionPlan.tiers.find((t) => t.id === 'build_next')?.courses?.length)
          ) {
            const buildTier = actionPlan.tiers.find((t) => t.id === 'build_next')
            if (buildTier) {
              buildTier.courses = growGrowth.recommendedCertifications.slice(0, 3).map((title, i) => ({
                id: `grow-cert-${i}`,
                title,
                searchKeyword: title,
                href: '/career-hub',
                careerImpact: 'Supports your growth route.',
              }))
              buildTier.items = growGrowth.recommendedCertifications.slice(0, 3)
            }
          }

          const jobazPlan = mapCareerActionPlanToJobAZPlan(actionPlan, {
            pathId: isBusinessPath
              ? 'start_business'
              : growGrowth
                ? 'grow_career'
                : isUkTransitionPath
                  ? 'uk_transition'
                  : actionPlan.pathId || 'uk_career_assistant',
            coachNotes: heroSummary || undefined,
          })

          const planForHandoff = jazJobazPlan ?? jobazPlan
          console.info('[UK CA] plan handoff source', {
            using: jazJobazPlan ? 'jazJobazPlan' : 'legacyPlan',
            route: planForHandoff.route_summary.route_title,
            current_focus: planForHandoff.route_summary.current_target_role,
            next_upgrade: planForHandoff.route_summary.next_upgrade_role,
          })

          const coachNotes =
            aiEnrichment?.whyThisPathFits ||
            heroSummary ||
            current.career_advisor?.careerMatchSummary ||
            undefined

          return (
          <div className="mb-6 space-y-4">
            {isResumeMode && (
              <div className="p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 backdrop-blur-sm flex items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-sm text-purple-200">
                  <span>Showing your last results</span>
                </div>
                <button
                  onClick={handleStartNewAssessment}
                  className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-[0_0_25px_rgba(139,92,246,0.4)]"
                >
                  Start new assessment
                </button>
              </div>
            )}

            {showResultsMessage && (
              <p className="text-sm text-slate-400 px-1">
                Your short action plan is ready — save it to My Plan when you are ready.
              </p>
            )}

            <CareerCoachPlanHandoff
              plan={planForHandoff}
              isGuest={isGuest}
              aiSummary={coachNotes}
            />
            {process.env.NODE_ENV === 'development' && (
              <p className="text-[10px] text-slate-500 px-1 font-mono">
                plan_source: {jazJobazPlan ? 'jaz|jaz_fallback' : 'legacy'} · goal: uk_career_assistant
                {jazJobazPlan
                  ? ` · matched: ${jazJobazPlan.structured_cards?.length ?? 0}`
                  : ''}
              </p>
            )}

            {isGuest && <UkCareerConversionCard />}

            <details className="uk-ca-panel rounded-xl border border-slate-700/50 bg-slate-900/40 open:pb-3">
              <summary className="cursor-pointer px-3.5 py-2.5 text-xs text-slate-500 hover:text-slate-300">
                Extra coach detail (optional)
              </summary>
              <div className="px-3.5 pb-3">
                <UkCareerExtraCoachDetail
                  intelligence={liveIntelligence}
                  employabilityScore={unifiedEmployabilityScore}
                />
              </div>
            </details>
          </div>
          )
        })()}

        {/* PATH story — Career Brain uses this as path_story; legacy uses old extractor */}
        {showPathStoryPanel && (
          <div className="uk-ca-panel mb-6 rounded-2xl border border-white/5 bg-[#111827]/60 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.15)] p-6">
            <h3 className="text-lg font-medium text-slate-50 mb-4">
              Tell us about your background (optional)
            </h3>
            <textarea
              value={pathFreeText}
              onChange={(e) => setPathFreeText(e.target.value)}
              placeholder="E.g., I am an animator, use Maya and After Effects, studied animation, and want creative work in the UK..."
              disabled={loading || isTyping}
              rows={4}
              className={cn(
                "w-full px-5 py-3 bg-slate-900/60 border border-slate-600/30 rounded-xl text-slate-50",
                "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all",
                "disabled:opacity-50 disabled:cursor-not-allowed resize-none",
                "placeholder:text-slate-500"
              )}
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => {
                  setPathFreeTextSubmitted(true)
                  if (pathFreeText.trim()) {
                    void handleSubmit(pathFreeText.trim(), { pathStoryOnly: true })
                  } else {
                    void handleSubmit('')
                  }
                }}
                disabled={loading || isTyping}
                className={cn(
                  "px-5 py-2.5 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400",
                  "text-white rounded-xl transition-all duration-200 text-sm font-medium shadow-[0_0_25px_rgba(139,92,246,0.4)]",
                  "hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                )}
              >
                {pathFreeText.trim() ? 'Continue' : 'Skip'}
              </button>
              {pathFreeText.trim() && (
                <button
                  onClick={() => {
                    setPathFreeText('')
                  }}
                  disabled={loading || isTyping}
                  className={cn(
                    "uk-ca-secondary-btn px-5 py-2.5 bg-[#1f2937] border border-white/10 hover:border-purple-500/40 text-slate-300 rounded-xl transition-all text-sm font-medium",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active question — API is single source of truth */}
        {!finalisingResult &&
          current &&
          !current.done &&
          activeQuestion &&
          !(askedQuestionIds.has(activeQuestion.id) && answeredQuestionIds.has(activeQuestion.id)) && (
          <QuestionCard
            question={activeQuestion}
            selectedOptions={selectedOptions}
            onOptionClick={handleOptionClick}
            onMultiSubmit={handleMultiSubmit}
            loading={loading || isThinking || finalisingResult}
            isTyping={isTyping}
            contextChip={getContextChip(activeQuestion.id)}
          />
        )}

        {/* Free Text Input - ONLY show when shouldShowFreeText returns true */}
        {!finalisingResult &&
         current && 
         !current.done && 
         activeQuestion && 
         shouldShowFreeText(activeQuestion, selectedOptions) && (
          <div className="uk-ca-panel mb-6 rounded-2xl border border-white/5 bg-[#111827]/60 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.15)] p-6">
            <label className="block text-sm text-slate-400 mb-3">
              Optional detail (only if needed)
            </label>
            <div className="flex gap-3">
              <input
                type="text"
                value={freeText}
                onChange={(e) => setFreeText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleFreeTextSubmit()
                  }
                }}
                placeholder="Please specify..."
                disabled={loading || isTyping}
                className={cn(
                  "flex-1 px-5 py-3 rounded-full bg-slate-900/60 border border-slate-600/30 text-slate-50",
                  "focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 transition-all",
                  "disabled:opacity-50 disabled:cursor-not-allowed placeholder:text-slate-500"
                )}
              />
              <button
                onClick={handleFreeTextSubmit}
                disabled={!freeText.trim() || loading || isTyping}
                className={cn(
                  "w-12 h-12 rounded-full bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400",
                  "text-white transition-all duration-200 shadow-[0_0_25px_rgba(139,92,246,0.4)] flex items-center justify-center",
                  "disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 disabled:hover:scale-100"
                )}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

            </div>
          </div>
        )}

        {/* Restart Button - Ghost style bottom-right */}
        {started && (
          <div className="mt-8 flex justify-end">
            <button
              onClick={handleRestart}
              disabled={loading}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm text-slate-400 hover:text-slate-200",
                "rounded-lg font-medium transition-all duration-200 hover:bg-white/5",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              <RotateCcw className="w-4 h-4" />
              <span>Restart</span>
            </button>
          </div>
        )}
      </main>
    </div>
  )
}

