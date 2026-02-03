'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, Send, RotateCcw, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getActionUrls } from '@/lib/uk-career-assistant/action-map'
import { getMicroStatus, MicroStatus } from '@/lib/uk-career-assistant/microStatus'
import PageHeader from '@/components/PageHeader'

interface ConversationMessage {
  role: 'assistant' | 'user'
  content: string
}

interface QuestionOption {
  value: string // Standardized: always use value
  label: string // Standardized: always use label
}

interface Question {
  id: string
  text: string
  type: 'single' | 'multi'
  options: QuestionOption[]
  max_select?: number
}

interface AIState {
  [key: string]: any
  asked_question_ids?: string[]
  answers?: { [questionId: string]: any }
  step_index?: number
  last_question_id?: string | null
}

interface AIResponse {
  path: string | null
  phase: 'classification' | 'assessment' | 'recommendation'
  assistant_message: string
  question: Question | null
  allow_free_text: boolean
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
    next_step: string
  } | null
}

export default function UKCareerAssistantPage() {
  const router = useRouter()
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
        // New question coming
        setIsTyping(true)
        setMicroStatus(null)
        const typingDelay = 500 + Math.random() * 400
        setTimeout(() => {
          setIsTyping(false)
          const status = getMicroStatus(updatedState, data.phase || 'CLASSIFY', data.question?.id || null)
          setMicroStatus(status)
          // Add micro status to conversation as assistant message (instead of empty cleaned assistant_message)
          if (status && status.line) {
            setConversation([
              { role: 'assistant', content: status.line }
            ])
          } else {
            // Fallback to cleaned assistant_message if no micro status
            const cleanedMessage = cleanAssistantMessage(data.assistant_message)
            if (cleanedMessage && cleanedMessage.length > 0) {
              setConversation([
                { role: 'assistant', content: cleanedMessage }
              ])
            } else {
              setConversation([])
            }
          }
          setCurrent(data)
        }, typingDelay)
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
      setError({ message: err.message || 'Failed to start conversation' })
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
          const typingDelay = 500 + Math.random() * 400
          setTimeout(() => {
            setIsTyping(false)
            setShowResultsMessage(true)
            setCurrent(data)
          }, typingDelay)
        } else if (data.question) {
          // New question coming
          setIsTyping(true)
          setMicroStatus(null)
          const typingDelay = 500 + Math.random() * 400
          setTimeout(() => {
            setIsTyping(false)
            const status = getMicroStatus(merged, data.phase || 'CLASSIFY', data.question?.id || null)
            setMicroStatus(status)
            // Add micro status to conversation as assistant message (instead of empty cleaned assistant_message)
            if (status && status.line) {
              setConversation(prev => {
                const lastMessage = prev[prev.length - 1]
                // Only add if it's a new message (not a duplicate)
                if (lastMessage?.role === 'assistant' && lastMessage?.content === status.line) {
                  return prev // Don't add duplicate
                }
                return [...prev, { role: 'assistant', content: status.line }]
              })
            } else {
              // Fallback to cleaned assistant_message if no micro status
              const cleanedMessage = cleanAssistantMessage(data.assistant_message)
              setConversation(prev => {
                const lastMessage = prev[prev.length - 1]
                // Only add if it's a new message (not a duplicate) and not empty
                if (lastMessage?.role === 'assistant' && lastMessage?.content === cleanedMessage) {
                  return prev // Don't add duplicate
                }
                // Only add if cleaned message is meaningful (not just "Next: question text" which becomes empty)
                if (cleanedMessage && cleanedMessage.length > 0) {
                  return [...prev, { role: 'assistant', content: cleanedMessage }]
                }
                return prev
              })
            }
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
    } catch (err: any) {
      setError({ message: err.message || 'Failed to submit response' })
    } finally {
      setLoading(false)
    }
  }

  const handleOptionClick = (optionValue: string) => {
    if (!current?.question) return

    console.log("ANSWER SUBMIT", current.question.id, optionValue)

    if (current.question.type === 'single') {
      // Single select: submit immediately
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
    handleSubmit(freeText.trim())
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
  }

  const handleRetry = async () => {
    if (loading) return
    
    setError(null)
    setLoading(true)

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

      if (data.error) {
        setError({ message: data.message, raw: data.raw })
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
          // New question coming
          setIsTyping(true)
          setMicroStatus(null)
          const typingDelay = 500 + Math.random() * 400
          setTimeout(() => {
            setIsTyping(false)
            const status = getMicroStatus(merged, data.phase || 'CLASSIFY', data.question?.id || null)
            setMicroStatus(status)
            // Add micro status to conversation as assistant message (instead of empty cleaned assistant_message)
            if (status && status.line) {
              setConversation(prev => {
                // Replace last assistant message if it exists, or add new one
                const lastAssistantIdx = prev.map((m, i) => m.role === 'assistant' ? i : -1).filter(i => i >= 0).pop()
                if (lastAssistantIdx !== undefined) {
                  const updated = [...prev]
                  updated[lastAssistantIdx] = { role: 'assistant', content: status.line }
                  return updated
                } else {
                  return [...prev, { role: 'assistant', content: status.line }]
                }
              })
            } else {
              // Fallback to cleaned assistant_message if no micro status
              const cleanedMessage = cleanAssistantMessage(data.assistant_message)
              if (cleanedMessage && cleanedMessage.length > 0 && conversation.length > 0) {
                // Replace last assistant message if it exists, or add new one
                const lastAssistantIdx = conversation.map((m, i) => m.role === 'assistant' ? i : -1).filter(i => i >= 0).pop()
                if (lastAssistantIdx !== undefined) {
                  setConversation(prev => {
                    const updated = [...prev]
                    updated[lastAssistantIdx] = { role: 'assistant', content: cleanedMessage }
                    return updated
                  })
                } else {
                  setConversation(prev => [...prev, { role: 'assistant', content: cleanedMessage }])
                }
              }
            }
            setCurrent(data)
          }, typingDelay)
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
      setError({ message: err.message || 'Failed to retry' })
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

  // Get display messages (last 6 if collapsed, all if expanded)
  const getDisplayMessages = () => {
    if (showAllMessages || conversation.length <= 6) {
      return conversation
    }
    return conversation.slice(-6)
  }

  const displayMessages = getDisplayMessages()
  const hasOlderMessages = conversation.length > 6

  const started = conversation.length > 0 || current !== null

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#050617] to-[#02010f] text-slate-50 relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-40 -left-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-fuchsia-500/25 blur-3xl" />

      {/* Main container */}
      <main className="relative z-10 max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <PageHeader
          title="UK Career Assistant"
          subtitle="A guided conversation to assess your work situation in the UK"
        />

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-red-500/50 bg-red-950/50">
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
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={handleStart}
                    disabled={loading}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
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
          <div className="mt-8 rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-8 md:p-12 text-center">
            <MessageSquare className="w-16 h-16 text-violet-400 mx-auto mb-6" />
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
                "px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            >
              {loading ? 'Starting...' : 'Start conversation'}
            </button>
          </div>
        )}

        {/* Chat Transcript - Scrollable area */}
        {started && (
          <div className="mb-6 rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-4 md:p-6">
            <div className="max-h-[420px] overflow-y-auto space-y-3 pr-2">
              {/* Show earlier button */}
              {hasOlderMessages && !showAllMessages && (
                <div className="flex justify-center pb-2">
                  <button
                    onClick={() => setShowAllMessages(true)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Show earlier messages ({conversation.length - 6} more)
                  </button>
                </div>
              )}
              
              {/* Display messages (last 6 or all) */}
              {displayMessages.map((msg, idx) => {
                // Calculate actual index in full conversation
                const actualIdx = showAllMessages || conversation.length <= 6 
                  ? idx 
                  : conversation.length - 6 + idx
                return (
                  <div
                    key={actualIdx}
                    className={cn(
                      "flex",
                      msg.role === 'assistant' ? 'justify-start' : 'justify-end'
                    )}
                  >
                    <div
                      className={cn(
                        "max-w-[80%] rounded-xl px-4 py-3",
                        msg.role === 'assistant'
                          ? "bg-gradient-to-br from-violet-600/90 to-violet-700/90 text-white shadow-lg shadow-violet-900/30 border border-violet-500/30"
                          : "bg-slate-800/90 text-slate-100 shadow-lg border border-slate-700/50"
                      )}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                )
              })}
              
              {/* Collapse button */}
              {showAllMessages && hasOlderMessages && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={() => setShowAllMessages(false)}
                    className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    Show less
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Typing Indicator - shown in transcript area */}
        {started && isTyping && (
          <div className="mb-6 flex justify-start">
            <div className="max-w-[80%] rounded-xl px-4 py-3 bg-gradient-to-br from-violet-600/90 to-violet-700/90 text-white shadow-lg shadow-violet-900/30 border border-violet-500/30">
              <div className="flex items-center gap-2">
                <span className="text-sm">Thinking</span>
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-white/80 rounded-full animate-pulse" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Micro Status Message - shown in transcript area (before question only, not before results) */}
        {started && !isTyping && microStatus && current?.question && !current?.done && (
          <div className="mb-4 flex justify-start">
            <div className="max-w-[80%] rounded-xl px-4 py-3 bg-gradient-to-br from-violet-600/80 to-violet-700/80 text-white shadow-lg shadow-violet-900/20 border border-violet-500/20">
              <p className="text-sm mb-2">{microStatus.line}</p>
              {microStatus.chips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {microStatus.chips.map((chip, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 text-xs font-medium bg-white/10 text-violet-100 rounded-full border border-white/20"
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Result Display */}
        {current?.done && current.result && (
          <div className="mb-6 space-y-6">
            {/* Final AI Message Before Results */}
            {showResultsMessage && (
              <div className="mb-4 flex justify-start">
                <div className="max-w-[80%] rounded-xl px-4 py-3 bg-gradient-to-br from-violet-600/90 to-violet-700/90 text-white shadow-lg shadow-violet-900/30 border border-violet-500/30">
                  <p className="text-sm">Here's a clear Work Now vs Improve Later plan based on what you told me.</p>
                </div>
              </div>
            )}
            
            {/* Summary */}
            <div className="p-6 rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur">
              <h3 className="text-lg font-semibold text-slate-50 mb-3">Summary</h3>
              <p className="text-slate-300 whitespace-pre-wrap">{current.result.summary}</p>
            </div>

            {/* Work Now Section */}
            {current.result.work_now.directions.length > 0 && (
              <div className="p-6 rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur">
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
                          <h4 className="text-base font-semibold text-violet-300">
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
                                className="px-2.5 py-1 text-xs font-medium bg-violet-900/30 text-violet-300 border border-violet-700/50 rounded-full"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        )}
                        <ul className="space-y-1.5 mb-4">
                          {direction.why.map((bullet, bulletIdx) => (
                            <li key={bulletIdx} className="text-sm text-slate-300 flex items-start">
                              <span className="text-violet-400 mr-2">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => hasJobFinderUrl && router.push(actionUrls.jobFinderUrl)}
                            disabled={!hasJobFinderUrl}
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-violet-600"
                          >
                            Find jobs
                          </button>
                          <button
                            onClick={() => hasBuildPathUrl && router.push(actionUrls.buildPathUrl)}
                            disabled={!hasBuildPathUrl}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-700"
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
              <div className="p-6 rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur">
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
                          <h4 className="text-base font-semibold text-violet-300">
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
                                className="px-2.5 py-1 text-xs font-medium bg-violet-900/30 text-violet-300 border border-violet-700/50 rounded-full"
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        )}
                        <ul className="space-y-1.5 mb-4">
                          {direction.why.map((bullet, bulletIdx) => (
                            <li key={bulletIdx} className="text-sm text-slate-300 flex items-start">
                              <span className="text-violet-400 mr-2">•</span>
                              <span>{bullet}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => hasBuildPathUrl && router.push(actionUrls.buildPathUrl)}
                            disabled={!hasBuildPathUrl}
                            className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-violet-600"
                          >
                            View path
                          </button>
                          <button
                            onClick={() => hasJobFinderUrl && router.push(actionUrls.jobFinderUrl)}
                            disabled={!hasJobFinderUrl}
                            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-slate-700"
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
              <div className="p-6 rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur">
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
            <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-900/30 to-fuchsia-900/30 border border-violet-500/30 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur">
              <h3 className="text-lg font-semibold text-slate-50 mb-3">Next step</h3>
              <p className="text-sm text-slate-300 mb-4">
                {(() => {
                  const path = aiState.path
                  if (path === 'PATH_1' || path === 'PATH_2') {
                    return "Create a simple CV based on your situation."
                  } else if (path === 'PATH_3' || path === 'PATH_4' || path === 'PATH_5') {
                    return "Create a skills-based CV aligned to your direction."
                  }
                  return "Create your CV or start searching for jobs."
                })()}
              </p>
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={() => router.push('/cv-builder-v2')}
                  className="px-6 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors shadow-lg shadow-violet-900/30"
                >
                  Create CV
                </button>
                <button
                  onClick={() => router.push('/jobs')}
                  className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-medium transition-colors"
                >
                  Browse jobs
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PATH Phase Free-Text Input (Optional) - in Active Question Panel */}
        {current && 
         (current.phase === 'PATH' || current.phase === 'assessment') && 
         !current.done && 
         !pathFreeTextSubmitted && 
         aiState.path && (
          <div className="mb-6 p-6 rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">
              Tell us a bit about your situation (optional)
            </h3>
            <textarea
              value={pathFreeText}
              onChange={(e) => setPathFreeText(e.target.value)}
              placeholder="E.g., I have some warehouse experience, prefer not to work with customers, and I'm looking for a full-time job..."
              disabled={loading || isTyping}
              rows={4}
              className={cn(
                "w-full px-4 py-3 bg-slate-900/50 border border-slate-700/50 rounded-xl text-slate-50",
                "focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
                "disabled:opacity-50 disabled:cursor-not-allowed resize-none",
                "placeholder:text-slate-500"
              )}
            />
            <div className="flex gap-2 mt-3">
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
                  "px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors text-sm font-medium",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
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
                    "px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg transition-colors text-sm font-medium",
                    "disabled:opacity-50 disabled:cursor-not-allowed"
                  )}
                >
                  Clear
                </button>
              )}
            </div>
          </div>
        )}

        {/* Active Question Panel */}
        {current && !current.done && current.question && 
         // ANTI-LOOP GUARD: Don't render if question already asked and answered
         !(askedQuestionIds.has(current.question.id) && answeredQuestionIds.has(current.question.id)) && (
          <div className="mb-6 p-6 rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-slate-50 mb-2">
                {cleanAssistantMessage(current.question.text)}
              </h3>
              {current.question.type === 'multi' && current.question.max_select && (
                <p className="text-sm text-slate-400 mb-2">
                  Select up to {current.question.max_select} option{current.question.max_select > 1 ? 's' : ''}
                  {selectedOptions.length > 0 && ` (${selectedOptions.length} selected)`}
                </p>
              )}
            </div>

            <div className="space-y-2 mb-4">
              {current.question.options.map((option) => {
                const isSelected = selectedOptions.includes(option.value)
                // Display label (always available after normalization)
                const displayText = option.label
                return (
                  <button
                    key={option.value}
                    onClick={() => handleOptionClick(option.value)}
                    disabled={loading || isTyping || (current.question?.type === 'multi' && maxSelectReached && !isSelected)}
                    className={cn(
                      "w-full text-left px-4 py-3 rounded-xl border transition-all",
                      current.question.type === 'single'
                        ? "bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 hover:border-violet-500/50"
                        : isSelected
                        ? "bg-violet-600 border-violet-500 text-white shadow-lg shadow-violet-900/30"
                        : "bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/50 hover:border-violet-500/50",
                      "disabled:opacity-50 disabled:cursor-not-allowed"
                    )}
                  >
                    {displayText}
                  </button>
                )
              })}
            </div>

            {current.question.type === 'multi' && (
              <button
                onClick={handleMultiSubmit}
                disabled={!canSubmitMulti || loading || isTyping}
                className={cn(
                  "w-full px-4 py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-lg font-medium transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                Submit
              </button>
            )}
          </div>
        )}

        {/* Free Text Input - in Active Question Panel for free_text_optional */}
        {current && current.allow_free_text && !current.done && current.question && (
          <div className="mb-6 p-6 rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur">
            <h3 className="text-lg font-semibold text-slate-50 mb-4">
              {cleanAssistantMessage(current.question.text)}
            </h3>
            <div className="flex gap-2">
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
                placeholder="Type your answer..."
                disabled={loading || isTyping}
                className={cn(
                  "flex-1 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-50",
                  "focus:outline-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              />
              <button
                onClick={handleFreeTextSubmit}
                disabled={!freeText.trim() || loading || isTyping}
                className={cn(
                  "px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors",
                  "disabled:opacity-50 disabled:cursor-not-allowed"
                )}
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {started && loading && !isTyping && (
          <div className="mb-6 text-center text-slate-400">
            <div className="inline-flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
              <span>Processing...</span>
            </div>
          </div>
        )}

        {/* Restart Button */}
        {started && (
          <div className="mt-8 pt-6 border-t border-slate-800/60">
            <button
              onClick={handleRestart}
              disabled={loading}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-slate-200 transition-colors",
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

