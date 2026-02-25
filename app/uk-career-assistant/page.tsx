'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MessageSquare, Send, RotateCcw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getActionUrls } from '@/lib/uk-career-assistant/action-map'
import { getBuildPathUrl } from '@/lib/build-your-path/paths'
import { getMicroStatus, MicroStatus } from '@/lib/uk-career-assistant/microStatus'
import { createCaSession, updateCaSessionAnswers, completeCaSession, updateCaSessionSelectedRole } from '@/lib/uk-career-assistant/session-tracking'
import { logEvent } from '@/lib/analytics/logEvent'
import PageHeader from '@/components/PageHeader'
import AssistantBubble from '@/components/uk-career-assistant/AssistantBubble'
import UserBubble from '@/components/uk-career-assistant/UserBubble'
import QuestionCard from '@/components/uk-career-assistant/QuestionCard'
import TypingDots from '@/components/uk-career-assistant/TypingDots'
import ThinkingBubble from '@/components/uk-career-assistant/ThinkingBubble'
import JazEyeIcon from '@/components/JazEyeIcon'

const CA_RESULT_STORAGE_KEY = 'jobaz_ca_last_result_v1'

interface ConversationMessage {
  role: 'assistant' | 'user'
  content: string
}

interface QuestionOption {
  value: string // Standardized: always use value
  label: string // Standardized: always use label
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
  const chatEndRef = useRef<HTMLDivElement>(null) // For auto-scroll
  const completedSessionLoggedRef = useRef(false) // Only log/complete once per result

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
    const phase = state.phase || 'CLASSIFY'
    const normalizedPhase = 
      phase === 'CLASSIFY' || phase === 'classification' ? 'CLASSIFY' :
      phase === 'PATH' || phase === 'assessment' ? 'PATH' :
      'RESULT'

    // If moving to results
    if (normalizedPhase === 'RESULT') {
      return "Building your Work Now vs Improve Later plan…"
    }

    // If we have a last question ID, use it for context
    if (lastQuestionId) {
      // Classification phase questions
      if (normalizedPhase === 'CLASSIFY') {
        return "Analysing your answers…"
      }

      // PATH phase - context-aware based on question type
      if (normalizedPhase === 'PATH') {
        // Transport-related
        if (lastQuestionId === 'transport') {
          return "Checking UK job options…"
        }
        // Communication/customer-facing
        if (lastQuestionId === 'language' || lastQuestionId === 'people_comfort') {
          return "Matching roles to your preferences…"
        }
        // Education-related
        if (lastQuestionId === 'education_level' || lastQuestionId === 'education_field') {
          return "Analysing your answers…"
        }
        // Strengths-related
        if (lastQuestionId === 'strengths' || lastQuestionId === 'transferable_strengths') {
          return "Matching roles to your preferences…"
        }
        // Default PATH message
        return "Analysing your answers…"
      }
    }

    // Default messages based on phase
    if (normalizedPhase === 'CLASSIFY') {
      return "Analysing your answers…"
    }
    if (normalizedPhase === 'PATH') {
      return "Checking UK job options…"
    }

    // Fallback
    return "is thinking…"
  }

  // Resume mode: Check for resume=1 param and load saved results
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    const resumeParam = searchParams.get('resume')
    const sessionParam = searchParams.get('ca_session')
    
    if (resumeParam === '1' && sessionParam) {
      try {
        const stored = localStorage.getItem(CA_RESULT_STORAGE_KEY)
        if (stored) {
          const snapshot = JSON.parse(stored)
          // Verify session matches
          if (snapshot.sessionId === sessionParam && snapshot.result) {
            setIsResumeMode(true)
            setCaSessionId(sessionParam)
            // Restore the result immediately
            setCurrent({
              path: snapshot.result.path || null,
              phase: 'RESULT',
              assistant_message: '',
              question: null,
              allow_free_text: false,
              state_updates: snapshot.aiState || {},
              done: true,
              result: snapshot.result.result
            })
            // Restore conversation if available
            if (snapshot.conversation && Array.isArray(snapshot.conversation)) {
              setConversation(snapshot.conversation)
            }
            // Restore AI state
            if (snapshot.aiState) {
              setAiState(snapshot.aiState)
            }
            setShowResultsMessage(true)
            // Scroll to results after a brief delay
            setTimeout(() => {
              if (chatEndRef.current) {
                chatEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
              }
            }, 100)
          }
        }
      } catch (err) {
        console.error('Failed to load saved Career Assistant results:', err)
        // Fall through to normal start
      }
    }
  }, [searchParams])

  // Save snapshot when results are shown (done: true)
  // Skip saving if we're in resume mode (already loaded from storage)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!current?.done || !current.result) return
    if (isResumeMode) return // Don't save if we're in resume mode
    
    // Generate session ID if not already set (localStorage key for round-trip)
    const sessionId = caSessionId || `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    if (!caSessionId) {
      setCaSessionId(sessionId)
    }
    
    try {
      const snapshot = {
        timestamp: Date.now(),
        sessionId: sessionId,
        result: {
          path: current.path,
          result: current.result
        },
        aiState: aiState,
        conversation: conversation
      }
      localStorage.setItem(CA_RESULT_STORAGE_KEY, JSON.stringify(snapshot))
    } catch (err) {
      console.error('Failed to save Career Assistant results snapshot:', err)
    }

    // Session tracking: mark completed and log event once per result
    if (!completedSessionLoggedRef.current && caSessionId) {
      const workNow = current.result.work_now?.directions ?? []
      const improveLater = current.result.improve_later?.directions ?? []
      const recommendedRoles = [
        ...workNow.map((d: { direction_id: string; direction_title: string }) => ({ id: d.direction_id, title: d.direction_title })),
        ...improveLater.map((d: { direction_id: string; direction_title: string }) => ({ id: d.direction_id, title: d.direction_title })),
      ]
      completeCaSession(caSessionId, recommendedRoles)
      logEvent('career_assistant_completed')
      completedSessionLoggedRef.current = true
    }
  }, [current?.done, current?.result, caSessionId, aiState, conversation, isResumeMode])

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

  const handleStart = async () => {
    setLoading(true)
    setError(null)
    setConversation([])
    setAiState({
      asked_question_ids: [],
      answers: {}
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
    setIsThinking(false)
    setRenderedQuestionIds(new Set())
    completedSessionLoggedRef.current = false
    setCaSessionId(null)
    createCaSession(null).then((id) => { if (id) setCaSessionId(id) })
    logEvent('career_assistant_opened')

    try {
      // Build full state object
      const fullStateObject = {
        phase: aiState.phase || 'CLASSIFY',
        classification_done: aiState.classification_done || false,
        classification: aiState.classification || {},
        path: aiState.path || null,
        answers: aiState.answers || {},
        asked_question_ids: aiState.asked_question_ids || [],
        last_question_id: aiState.last_question_id || null,
        step_index: aiState.step_index || 0
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
          user_input: 'START'
        })
      })

      let data = await response.json()

      if (data.error) {
        setError({ message: data.message, raw: data.raw })
        return
      }

      // ANTI-LOOP GUARD: Check for duplicate question before setting current
      const questionId = data.question?.id
      const isDuplicate = questionId && askedQuestionIds.has(questionId) && answeredQuestionIds.has(questionId)
      
      if (isDuplicate && autoSkipAttempts < 2) {
        // Auto-skip duplicate question
        setAutoSkipAttempts(prev => prev + 1)
        // Immediately request next step with "NEXT"
        const fullStateObject = {
          phase: aiState.phase || 'CLASSIFY',
          classification_done: aiState.classification_done || false,
          classification: aiState.classification || {},
          path: aiState.path || null,
          answers: aiState.answers || {},
          asked_question_ids: aiState.asked_question_ids || [],
          last_question_id: aiState.last_question_id || null,
          step_index: aiState.step_index || 0
        }
        
        const skipResponse = await fetch('/api/uk-career-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            state: fullStateObject,
            user_input: 'NEXT'
          })
        })
        
        const skipData = await skipResponse.json()
        if (!skipData.error && skipData.question?.id !== questionId) {
          // Got a different question, process it normally
          data = skipData
          setAutoSkipAttempts(0) // Reset on success
        } else {
          // Still got duplicate or error, keep original data
          setAutoSkipAttempts(0) // Reset to prevent infinite retries
        }
      } else if (isDuplicate) {
        setAutoSkipAttempts(0) // Reset after max attempts
      }
      
      // Merge state updates and ensure all required fields exist
      const updatedState = {
        ...aiState,
        ...(data.state_updates || {}),
        // Ensure all required fields are present
        phase: data.state_updates?.phase || aiState.phase || 'CLASSIFY',
        classification_done: data.state_updates?.classification_done !== undefined ? data.state_updates.classification_done : (aiState.classification_done || false),
        classification: data.state_updates?.classification || aiState.classification || {},
        path: data.state_updates?.path || aiState.path || null,
        asked_question_ids: data.state_updates?.asked_question_ids || aiState.asked_question_ids || [],
        answers: {
          ...(aiState.answers || {}),
          ...(data.state_updates?.answers || {})
        },
        step_index: (aiState.step_index || 0) + 1,
        last_question_id: data.question?.id || null
      }
      
        // Clear thinking bubble when response arrives
        setIsThinking(false)
        
        // Show typing indicator, then micro status + question (or results message)
        if (data.done && data.result) {
          // Moving to results
          setIsTyping(true)
          setMicroStatus(null)
          setShowResultsMessage(false)
          const typingDelay = 500 + Math.random() * 400
          setTimeout(() => {
            setIsTyping(false)
            setShowResultsMessage(true)
            setCurrent(data)
          }, typingDelay)
        } else if (data.question) {
          // New question coming - check if we should show it (prevent duplicate question cards)
          const questionId = data.question.id
          if (renderedQuestionIds.has(questionId)) {
            // Skip duplicate question
            return
          }
          
          // Add intro message on first question only (prevent duplicates)
          if (!hasShownIntro) {
            setConversation(prev => {
              const introMsg = "Hi! I'll help you find the best career path for your situation in the UK. Let me ask you a few questions to get started."
              const lastMessage = prev[prev.length - 1]
              if (lastMessage?.role === 'assistant' && lastMessage?.content === introMsg) {
                return prev // Don't add duplicate
              }
              return [...prev, { role: 'assistant', content: introMsg }]
            })
            setHasShownIntro(true)
          }
          
          // Mark question as rendered and show it
          setRenderedQuestionIds(prev => new Set([...prev, questionId]))
          setCurrent(data)
      } else {
        setCurrent(data)
      }
      
      // Reset pathFreeTextSubmitted when transitioning to PATH phase for the first time
      const newPhase = data.state_updates?.phase || data.phase || aiState.phase || 'CLASSIFY'
      const wasInClassify = aiState.phase === 'CLASSIFY' || !aiState.phase
      const isNowInPath = newPhase === 'PATH' || newPhase === 'assessment'
      if (wasInClassify && isNowInPath) {
        setPathFreeTextSubmitted(false) // Reset to show free-text area at start of PATH phase
      }
      // If a question was returned, add it to asked_question_ids if not already present
      if (data.question?.id && !updatedState.asked_question_ids?.includes(data.question.id)) {
        updatedState.asked_question_ids = [...(updatedState.asked_question_ids || []), data.question.id]
      }
      setAiState(updatedState)
      
      // ANTI-LOOP GUARD: Track asked questions
      if (data.question?.id) {
        setAskedQuestionIds(prev => new Set([...prev, data.question.id]))
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

  const handleSubmit = async (input: string | string[]) => {
    if (loading) return

    setLoading(true)
    setError(null)

    // Store actual input and state for retry (IDs, not labels)
    setLastUserInput(input)
    setLastState(aiState)

    // Update answers: store the answer for the current question
    const currentQuestionId = current?.question?.id
    const updatedAnswers = { ...(aiState.answers || {}) }
    const updatedAskedIds = [...(aiState.asked_question_ids || [])]
    
    if (currentQuestionId) {
      // Store the answer (input value(s))
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
    if (Array.isArray(input)) {
      // Multi-select: find labels for selected option values
      const labels = input.map(val => {
        const option = current?.question?.options.find(opt => opt.value === val)
        return option?.label || val
      })
      userMessage = labels.join(', ')
    } else {
      // Single select or free text: find label for option value, or use input as-is
      const option = current?.question?.options.find(opt => opt.value === input)
      userMessage = option?.label || input
    }
    
    setConversation(prev => [...prev, { role: 'user', content: userMessage }])

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
          user_input: input,
          free_text: pathFreeText.trim() || undefined // Include PATH free-text if provided
        })
      })

      let data = await response.json()

      if (data.error) {
        setError({ message: data.message, raw: data.raw })
        return
      }

      // ANTI-LOOP GUARD: Check for duplicate question before setting current
      const questionId = data.question?.id
      const isDuplicate = questionId && askedQuestionIds.has(questionId) && answeredQuestionIds.has(questionId)
      
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
        
        const skipData = await skipResponse.json()
        if (!skipData.error && skipData.question?.id !== questionId) {
          // Got a different question, process it normally
          data = skipData
          setAutoSkipAttempts(0) // Reset on success
        } else {
          // Still got duplicate or error, keep original data
          setAutoSkipAttempts(0) // Reset to prevent infinite retries
        }
      } else if (isDuplicate) {
        setAutoSkipAttempts(0) // Reset after max attempts
      }
      
      // Merge state updates and ensure all required fields are preserved
      setAiState(prev => {
        const merged = {
          ...prev,
          ...(data.state_updates || {}),
          // Ensure all required fields are present
          phase: data.state_updates?.phase || prev.phase || 'CLASSIFY',
          classification_done: data.state_updates?.classification_done !== undefined ? data.state_updates.classification_done : (prev.classification_done || false),
          classification: data.state_updates?.classification || prev.classification || {},
          path: data.state_updates?.path || prev.path || null,
          asked_question_ids: data.state_updates?.asked_question_ids || prev.asked_question_ids || [],
          answers: {
            ...(prev.answers || {}),
            ...(data.state_updates?.answers || {})
          },
          step_index: (prev.step_index || 0) + 1,
          last_question_id: data.question?.id || null
        }
        // If a question was returned, add it to asked_question_ids if not already present
        if (data.question?.id && !merged.asked_question_ids.includes(data.question.id)) {
          merged.asked_question_ids = [...merged.asked_question_ids, data.question.id]
        }
        
        // Show typing indicator, then micro status + question (or results message)
        if (data.done && data.result) {
          // Moving to results
          setIsTyping(true)
          setMicroStatus(null)
          setShowResultsMessage(false)
          setIsThinking(false)
          const typingDelay = 500 + Math.random() * 400
          setTimeout(() => {
            setIsTyping(false)
            setShowResultsMessage(true)
            setCurrent(data)
          }, typingDelay)
        } else if (data.question) {
          // New question coming - check if we should show it (prevent duplicate question cards)
          const questionId = data.question.id
          if (renderedQuestionIds.has(questionId)) {
            // Skip duplicate question
            return
          }
          
          // Show thinking bubble first
          const status = getMicroStatus(merged, data.phase || 'CLASSIFY', data.question?.id || null)
          const thinkingText = status?.line || "Thinking..."
          // Thinking bubble already shown before API call
          setIsTyping(true)
          setMicroStatus(null)
          
          const typingDelay = 450 + Math.random() * 350 // 450-800ms
          setTimeout(() => {
            setIsTyping(false)
            setIsThinking(false) // Clear thinking bubble
            // Add thinking message to conversation if not duplicate
            if (status && status.line) {
              setConversation(prev => {
                const lastMessage = prev[prev.length - 1]
                if (lastMessage?.role === 'assistant' && lastMessage?.content === status.line) {
                  return prev // Don't add duplicate
                }
                return [...prev, { role: 'assistant', content: status.line }]
              })
            }
            // Mark question as rendered and show it
            setRenderedQuestionIds(prev => new Set([...prev, questionId]))
            setCurrent(data)
          }, typingDelay)
        } else {
          setCurrent(data)
        }
        
        return merged
      })
      
      // ANTI-LOOP GUARD: Track asked questions
      if (data.question?.id) {
        setAskedQuestionIds(prev => new Set([...prev, data.question.id]))
      }
      
      // Reset pathFreeTextSubmitted when transitioning to PATH phase for the first time
      const newPhase = data.state_updates?.phase || data.phase
      const wasInClassify = aiState.phase === 'CLASSIFY' || !aiState.phase
      const isNowInPath = newPhase === 'PATH' || newPhase === 'assessment'
      if (wasInClassify && isNowInPath) {
        setPathFreeTextSubmitted(false) // Reset to show free-text area at start of PATH phase
      }
      
      // Reset UI state
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

    console.log("ANSWER SUBMIT", current.question.id, optionValue)

    // Check if this is an "Other" option that requires free-text
    const option = current.question.options.find(o => o.value === optionValue)
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

  // STAGE 2.1: RESET RULE - Restart button clears state.answers, clears locked fields, resets phase to CLASSIFY
  const handleRestart = () => {
    setConversation([])
    setAiState({
      asked_question_ids: [],
      answers: {}, // STAGE 2.1: Clear all locked fields
      step_index: 0,
      last_question_id: null,
      phase: 'CLASSIFY', // STAGE 2.1: Reset phase to CLASSIFY
      classification_done: false, // STAGE 2.1: Clear classification_done
      classification: {}, // STAGE 2.1: Clear classification
      path: null, // STAGE 2.1: Clear path
      preferences: {}, // STAGE 2.1: Clear preferences (if exists)
      preference_gate_done: false // STAGE 2.1: Clear preference_gate_done (if exists)
    })
    setCurrent(null)
    setSelectedOptions([])
    setFreeText('')
    setPathFreeText('')
    setPathFreeTextSubmitted(false)
    setError(null)
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
    setIsThinking(false)
    setThinkingText('is thinking…')
    setRenderedQuestionIds(new Set())
    setHasShownIntro(false)
    // Clear resume mode and session
    setIsResumeMode(false)
    setCaSessionId(null)
    // Clear stored snapshot
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(CA_RESULT_STORAGE_KEY)
      } catch (err) {
        console.error('Failed to clear Career Assistant snapshot:', err)
      }
    }
  }

  // Handle "Start new assessment" in resume mode
  const handleStartNewAssessment = () => {
    handleRestart()
    // Remove resume params from URL
    router.replace('/uk-career-assistant')
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

      const data = await response.json()

      // Clear thinking bubble when response arrives (success or error)
      setIsThinking(false)

      if (data.error) {
        setError({ message: data.message, raw: data.raw })
        // Add error message to conversation
        setConversation(prev => {
          const errorMsg = "Something went wrong. Please retry."
          const lastMessage = prev[prev.length - 1]
          if (lastMessage?.role === 'assistant' && lastMessage?.content === errorMsg) {
            return prev // Don't add duplicate
          }
          return [...prev, { role: 'assistant', content: errorMsg }]
        })
        return
      }

      // Merge state updates and ensure all required fields are preserved
      setAiState(prev => {
        const merged = {
          ...prev,
          ...(data.state_updates || {}),
          // Ensure all required fields are present
          phase: data.state_updates?.phase || prev.phase || 'CLASSIFY',
          classification_done: data.state_updates?.classification_done !== undefined ? data.state_updates.classification_done : (prev.classification_done || false),
          classification: data.state_updates?.classification || prev.classification || {},
          path: data.state_updates?.path || prev.path || null,
          asked_question_ids: data.state_updates?.asked_question_ids || prev.asked_question_ids || [],
          answers: {
            ...(prev.answers || {}),
            ...(data.state_updates?.answers || {})
          },
          step_index: (prev.step_index || 0) + 1,
          last_question_id: data.question?.id || null
        }
        // If a question was returned, add it to asked_question_ids if not already present
        if (data.question?.id && !merged.asked_question_ids.includes(data.question.id)) {
          merged.asked_question_ids = [...merged.asked_question_ids, data.question.id]
        }
        
        // Show typing indicator, then micro status + question (or results message)
        if (data.done && data.result) {
          // Moving to results
          setIsTyping(true)
          setMicroStatus(null)
          setShowResultsMessage(false)
          const typingDelay = 500 + Math.random() * 400
          setTimeout(() => {
            setIsTyping(false)
            setShowResultsMessage(true)
            setCurrent(data)
          }, typingDelay)
        } else if (data.question) {
          // New question coming - check if we should show it (prevent duplicate question cards)
          const questionId = data.question.id
          if (renderedQuestionIds.has(questionId)) {
            // Skip duplicate question
            return
          }
          
          // Mark question as rendered and show it
          setRenderedQuestionIds(prev => new Set([...prev, questionId]))
          setCurrent(data)
        } else {
          setCurrent(data)
        }
        
        return merged
      })
      
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

  const canSubmitMulti = current?.question?.type === 'multi' && selectedOptions.length > 0
  const maxSelectReached = current?.question?.type === 'multi' && 
    current.question.max_select && 
    selectedOptions.length >= current.question.max_select

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

  const started = conversation.length > 0 || current !== null

  return (
    <div className="min-h-screen text-slate-50 relative overflow-hidden">
      {/* Dark background matching dashboard */}
      <div className="fixed inset-0 bg-[#0B0F19]" />
      <div className="fixed inset-0 bg-gradient-to-br from-[#0f172a] via-[#0B0F19] to-[#05070d]" />
      <div className="fixed inset-0 before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_20%_30%,rgba(139,92,246,0.15),transparent_40%)]" />
      
      {/* Background glows */}
      <div className="pointer-events-none fixed -top-40 -left-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl animate-pulse" />
      <div className="pointer-events-none fixed bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-fuchsia-500/25 blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />

      {/* Main container - centered and max-w-4xl */}
      <main className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <PageHeader
          title="UK Career Assistant"
          subtitle="A guided conversation to assess your work situation in the UK"
          showBackToDashboard={true}
        />

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
                    onClick={handleStart}
                    disabled={loading}
                    className="px-4 py-2 bg-[#1f2937] border border-white/10 hover:border-purple-500/40 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-medium transition-all duration-200"
                  >
                    Reset & Start Over
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Start Screen */}
        {!started && (
          <div className="mt-8 rounded-2xl border border-white/5 bg-[#111827]/60 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.15)] hover:shadow-[0_0_60px_rgba(139,92,246,0.25)] p-8 md:p-12 text-center transition-all duration-300">
            <MessageSquare className="w-16 h-16 text-purple-400 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-slate-50 mb-3">
              Ready to get started?
            </h2>
            <p className="text-slate-400 mb-8 max-w-md mx-auto">
              I'll ask you a few questions to understand your situation and recommend the best career paths for you.
            </p>
            <button
              onClick={handleStart}
              disabled={loading}
              className={cn(
                "px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400",
                "text-white rounded-xl font-medium transition-all duration-200 shadow-[0_0_25px_rgba(139,92,246,0.4)]",
                "hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              )}
            >
              {loading ? 'Starting...' : 'Start conversation'}
            </button>
          </div>
        )}

        {/* AI Status Bar */}
        {started && (
          <div className="mb-4 flex items-center gap-2 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>AI Career Intelligence Active</span>
            </div>
          </div>
        )}

        {/* Chat Transcript - Premium glassmorphism panel */}
        {started && (
          <div className="mb-6 rounded-2xl border border-white/5 bg-[#111827]/60 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.15)] hover:shadow-[0_0_60px_rgba(139,92,246,0.25)] p-4 md:p-6 relative transition-all duration-300">
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
              {isThinking && (
                <ThinkingBubble message={thinkingText} />
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
        {current?.done && current.result && (
          <div className="mb-6 space-y-6">
            {/* Resume Mode Banner */}
            {isResumeMode && (
              <div className="mb-4 p-4 rounded-xl border border-purple-500/30 bg-purple-950/20 backdrop-blur-sm flex items-center justify-between gap-4">
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
            
            {/* Final AI Message Before Results */}
            {showResultsMessage && (
              <div className="mb-4 flex justify-start items-start gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600/40 to-indigo-500/30 border border-purple-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.25)]">
                  <JazEyeIcon size="sm" ariaLabel="AI Career Intelligence" />
                </div>
                <div className="flex-1 max-w-[80%]">
                  <div className="rounded-xl px-5 py-3 bg-gradient-to-r from-purple-600/20 to-indigo-500/20 border border-purple-500/30 shadow-[0_0_20px_rgba(139,92,246,0.25)] backdrop-blur-sm">
                    <p className="text-sm text-white">Here's a clear Work Now vs Improve Later plan based on what you told me.</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* Summary */}
            <div className="p-6 rounded-2xl border border-white/5 bg-[#111827]/60 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.15)]">
              <h3 className="text-lg font-medium text-slate-50 mb-3">Summary</h3>
              <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{current.result.summary}</p>
            </div>

            {/* Work Now Section */}
            {current.result.work_now.directions.length > 0 && (
              <div className="p-6 rounded-2xl border border-white/5 bg-[#111827]/60 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.15)]">
                <h3 className="text-lg font-semibold text-slate-50 mb-4">Work Now</h3>
                <div className="space-y-4">
                  {current.result.work_now.directions.map((direction, idx) => {
                    const actionUrls = getActionUrls(direction.direction_id, direction.direction_title)
                    const hasJobFinderUrl = actionUrls.jobFinderUrl && actionUrls.jobFinderUrl !== ''
                    const hasBuildPathUrl = actionUrls.buildPathUrl && actionUrls.buildPathUrl !== ''
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-base font-semibold text-purple-300">
                            {direction.direction_title}
                          </h4>
                          <span className="text-xs text-slate-500 font-mono ml-2">
                            {direction.direction_id}
                          </span>
                        </div>
                        {direction.chips && direction.chips.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {direction.chips.map((chip, chipIdx) => (
                              <span
                                key={chipIdx}
                                className="px-2.5 py-1 text-xs font-medium bg-purple-900/30 text-purple-300 border border-purple-700/50 rounded-full"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        )}
                        <ul className="space-y-1.5 mb-4">
                          {direction.why.map((bullet, bulletIdx) => (
                            <li key={bulletIdx} className="text-sm text-slate-300 flex items-start">
                              <span className="text-purple-400 mr-2">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              if (!hasJobFinderUrl) return
                              updateCaSessionSelectedRole(caSessionId, direction.direction_id)
                              const url = new URL(actionUrls.jobFinderUrl, window.location.origin)
                              url.searchParams.set('category', direction.direction_id)
                              url.searchParams.set('q', direction.direction_title)
                              if (caSessionId) {
                                url.searchParams.set('from', 'career_assistant')
                                url.searchParams.set('ca_session', caSessionId)
                              }
                              router.push(url.pathname + url.search)
                            }}
                            disabled={!hasJobFinderUrl}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-[0_0_25px_rgba(139,92,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Find jobs
                          </button>
                          <button
                            onClick={() => {
                              updateCaSessionSelectedRole(caSessionId, direction.direction_id)
                              const slug = direction.direction_id?.replace(/_/g, '-').toLowerCase()
                              const tag = direction.direction_id?.toLowerCase()
                              const targetUrl = getBuildPathUrl(slug, tag, caSessionId || null)
                              router.push(targetUrl)
                            }}
                            className="px-4 py-2 bg-[#1f2937] border border-white/10 hover:border-purple-500/40 text-slate-200 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            View path
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Improve Later Section */}
            {current.result.improve_later && current.result.improve_later.directions.length > 0 && (
              <div className="p-6 rounded-2xl border border-white/5 bg-[#111827]/60 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.15)]">
                <h3 className="text-lg font-semibold text-slate-50 mb-4">Improve Later</h3>
                <div className="space-y-4">
                  {current.result.improve_later.directions.map((direction, idx) => {
                    const actionUrls = getActionUrls(direction.direction_id, direction.direction_title)
                    const hasJobFinderUrl = actionUrls.jobFinderUrl && actionUrls.jobFinderUrl !== ''
                    const hasBuildPathUrl = actionUrls.buildPathUrl && actionUrls.buildPathUrl !== ''
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/50"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h4 className="text-base font-semibold text-purple-300">
                            {direction.direction_title}
                          </h4>
                          <span className="text-xs text-slate-500 font-mono ml-2">
                            {direction.direction_id}
                          </span>
                        </div>
                        {direction.chips && direction.chips.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {direction.chips.map((chip, chipIdx) => (
                              <span
                                key={chipIdx}
                                className="px-2.5 py-1 text-xs font-medium bg-purple-900/30 text-purple-300 border border-purple-700/50 rounded-full"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        )}
                        <ul className="space-y-1.5 mb-4">
                          {direction.why.map((bullet, bulletIdx) => (
                            <li key={bulletIdx} className="text-sm text-slate-300 flex items-start">
                              <span className="text-purple-400 mr-2">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => {
                              updateCaSessionSelectedRole(caSessionId, direction.direction_id)
                              const slug = direction.direction_id?.replace(/_/g, '-').toLowerCase()
                              const tag = direction.direction_id?.toLowerCase()
                              const targetUrl = getBuildPathUrl(slug, tag, caSessionId || null)
                              router.push(targetUrl)
                            }}
                            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl text-sm font-medium transition-all duration-200 shadow-[0_0_25px_rgba(139,92,246,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            View path
                          </button>
                          <button
                            onClick={() => {
                              if (!hasJobFinderUrl) return
                              updateCaSessionSelectedRole(caSessionId, direction.direction_id)
                              const url = new URL(actionUrls.jobFinderUrl, window.location.origin)
                              url.searchParams.set('category', direction.direction_id)
                              url.searchParams.set('q', direction.direction_title)
                              if (caSessionId) {
                                url.searchParams.set('from', 'career_assistant')
                                url.searchParams.set('ca_session', caSessionId)
                              }
                              router.push(url.pathname + url.search)
                            }}
                            disabled={!hasJobFinderUrl}
                            className="px-4 py-2 bg-[#1f2937] border border-white/10 hover:border-purple-500/40 text-slate-200 rounded-xl text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Find jobs
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Avoid List */}
            {current.result.avoid.length > 0 && (
              <div className="p-6 rounded-2xl border border-white/5 bg-[#111827]/60 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.15)]">
                <h3 className="text-lg font-semibold text-slate-50 mb-4">Avoid</h3>
                <ul className="space-y-2">
                  {current.result.avoid.map((item, idx) => (
                    <li key={idx} className="text-sm text-slate-300 flex items-start">
                      <span className="text-red-400 mr-2">⚠</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Global CTA Block */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/30 to-cyan-900/30 border border-purple-500/30 shadow-[0_0_40px_rgba(139,92,246,0.15)] backdrop-blur-xl">
              <h3 className="text-xl font-bold text-slate-50 mb-3">Your Next Smart Move</h3>
              <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                Based on your profile and goals, creating a tailored CV is the strongest next step.
              </p>
              <button
                onClick={() => router.push('/cv-builder-v2')}
                className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white rounded-xl font-medium transition-all duration-200 shadow-[0_0_25px_rgba(139,92,246,0.4)] hover:scale-[1.02]"
              >
                Create CV
              </button>
            </div>
          </div>
        )}

        {/* PATH Phase Free-Text Input (Optional) - in Active Question Panel */}
        {current && 
         (current.phase === 'PATH' || current.phase === 'assessment') && 
         !current.done && 
         !pathFreeTextSubmitted && 
         aiState.path && (
          <div className="mb-6 rounded-2xl border border-white/5 bg-[#111827]/60 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.15)] p-6">
            <h3 className="text-lg font-medium text-slate-50 mb-4">
              Tell us a bit about your situation (optional)
            </h3>
            <textarea
              value={pathFreeText}
              onChange={(e) => setPathFreeText(e.target.value)}
              placeholder="E.g., I have some warehouse experience, prefer not to work with customers, and I'm looking for a full-time job..."
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
                    // Submit with free-text
                    handleSubmit(pathFreeText.trim())
                  } else {
                    // Skip - trigger next question by sending empty input
                    handleSubmit('')
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
                    "px-5 py-2.5 bg-[#1f2937] border border-white/10 hover:border-purple-500/40 text-slate-300 rounded-xl transition-all text-sm font-medium",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Question Panel - using QuestionCard component */}
        {current && !current.done && current.question && 
         // ANTI-LOOP GUARD: Don't render if question already asked and answered, or if already rendered
         !(askedQuestionIds.has(current.question.id) && answeredQuestionIds.has(current.question.id)) &&
         renderedQuestionIds.has(current.question.id) && (
          <QuestionCard
            question={current.question}
            selectedOptions={selectedOptions}
            onOptionClick={handleOptionClick}
            onMultiSubmit={handleMultiSubmit}
            loading={loading}
            isTyping={isTyping}
            contextChip={getContextChip(current.question.id)}
          />
        )}

        {/* Free Text Input - ONLY show when shouldShowFreeText returns true */}
        {current && 
         !current.done && 
         current.question && 
         shouldShowFreeText(current.question, selectedOptions) && (
          <div className="mb-6 rounded-2xl border border-white/5 bg-[#111827]/60 backdrop-blur-xl shadow-[0_0_40px_rgba(139,92,246,0.15)] p-6">
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

