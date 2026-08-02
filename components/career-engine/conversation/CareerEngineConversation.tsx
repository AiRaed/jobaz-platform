'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import AssistantBubble from '@/components/uk-career-assistant/AssistantBubble'
import UserBubble from '@/components/uk-career-assistant/UserBubble'
import JazFinalisingRoadmap from '@/components/uk-career-assistant/JazFinalisingRoadmap'
import CareerEngineFreeTextInput from './CareerEngineFreeTextInput'
import CareerEngineOptionChips from './CareerEngineOptionChips'
import CareerEngineMultiSelectChips from './CareerEngineMultiSelectChips'
import CareerEngineProgressIndicator, {
  progressLabelForStep,
} from './CareerEngineProgressIndicator'
import CareerEngineTypingBubble from './CareerEngineTypingBubble'
import { specialisationAllowsFreeText } from '@/lib/career-engine/education-path/educationSpecialisations'
import { experienceSpecialisationAllowsFreeText } from '@/lib/career-engine/experience-path/dynamic'
import type { EducationFieldId } from '@/lib/career-engine/education-path/types'
import type { ExperienceIndustryId } from '@/lib/career-engine/experience-path/types'
import type {
  CareerEngineConversationMessage,
  CareerEngineConversationPhase,
  CareerEnginePathConfig,
  CareerEngineQuestion,
} from '@/lib/career-engine/conversation/types'

const TYPING_MS = 700
const INTRO_DELAY_MS = 600
const RESULT_INTRO_DELAY_MS = 900

type Props = {
  config: CareerEnginePathConfig
  onComplete: (answers: Record<string, string>) => void
  onAnalyzing?: (answers: Record<string, string>) => void
  resultContent?: ReactNode
  disabled?: boolean
  /** When parent API finishes building the plan */
  resultReady?: boolean
}

function uid() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export default function CareerEngineConversation({
  config,
  onComplete,
  onAnalyzing,
  resultContent,
  disabled,
  resultReady = false,
}: Props) {
  const [phase, setPhase] = useState<CareerEngineConversationPhase>('intro')
  const [messages, setMessages] = useState<CareerEngineConversationMessage[]>([])
  const [questionIndex, setQuestionIndex] = useState(-1)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [showInput, setShowInput] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [pendingSpec, setPendingSpec] = useState<{ value: string; label: string } | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const introShownRef = useRef(false)
  const questionIndexRef = useRef(-1)
  const answersRef = useRef<Record<string, string>>({})
  const lastAnswerKeyRef = useRef<string | null>(null)
  const finishedRef = useRef(false)
  const finalisingStartedAtRef = useRef<number | null>(null)

  const getQuestionFlow = useCallback(
    (answerState: Record<string, string>) =>
      config.resolveQuestionFlow?.(answerState) ?? config.questions,
    [config]
  )

  const questionFlow = getQuestionFlow(answers)
  const totalQuestions = questionFlow.length
  const answeredCount = Object.keys(answers).length
  const progress =
    phase === 'analyzing' || phase === 'result_intro' || phase === 'result'
      ? 100
      : Math.round((answeredCount / Math.max(totalQuestions, 1)) * 100)

  const progressLabel =
    phase === 'analyzing'
      ? 'Building your roadmap…'
      : phase === 'result_intro' || phase === 'result'
        ? 'Roadmap ready'
        : progressLabelForStep(answeredCount, totalQuestions)

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
    })
  }, [])

  useEffect(() => {
    questionIndexRef.current = questionIndex
  }, [questionIndex])

  const appendMessage = useCallback((role: 'assistant' | 'user', content: string) => {
    setMessages((prev) => [...prev, { id: uid(), role, content }])
  }, [])

  const resolveQuestionAt = useCallback(
    (index: number, answerState: Record<string, string>): CareerEngineQuestion | null => {
      const flow = getQuestionFlow(answerState)
      const base = flow[index]
      if (!base) return null
      return config.resolveQuestion?.(base, answerState) ?? base
    },
    [config, getQuestionFlow]
  )

  const askQuestion = useCallback(
    (index: number, answerState?: Record<string, string>) => {
      const question = resolveQuestionAt(index, answerState ?? answersRef.current)
      if (!question) return

      setPendingSpec(null)
      setSubmitting(false)
      setIsTyping(true)
      setShowInput(false)

      setTimeout(() => {
        setIsTyping(false)
        appendMessage('assistant', question.text)
        setQuestionIndex(index)
        questionIndexRef.current = index
        setShowInput(true)
        setPhase('chat')
      }, TYPING_MS)
    },
    [appendMessage, resolveQuestionAt]
  )

  useEffect(() => {
    if (disabled) return

    if (!introShownRef.current) {
      introShownRef.current = true
      appendMessage('assistant', config.introMessage)
      setPhase('intro')
    }

    const timer = setTimeout(() => {
      if (questionIndexRef.current >= 0) return
      askQuestion(0)
    }, INTRO_DELAY_MS)
    return () => clearTimeout(timer)
  }, [appendMessage, askQuestion, config.introMessage, disabled])

  useEffect(() => {
    scrollToBottom()
  }, [messages, isTyping, phase, showInput, scrollToBottom])

  const finishConversation = useCallback(() => {
    if (finishedRef.current) return
    // Never mark complete before the parent has result content to render.
    if (!resultReady || !resultContent) {
      console.warn('[CareerEngineConversation] finish_blocked', {
        resultReady,
        hasResultContent: Boolean(resultContent),
      })
      return
    }
    finishedRef.current = true
    console.info('[CareerEngineConversation] finish', {
      resultReady,
      hasResultContent: Boolean(resultContent),
      messageCount: messages.length,
    })
    setPhase('result_intro')
    appendMessage('assistant', config.resultIntroMessage)

    setTimeout(() => {
      setPhase('result')
      onComplete(answersRef.current)
      console.info('[CareerEngineConversation] result_phase', {
        hasResultContent: Boolean(resultContent),
      })
    }, RESULT_INTRO_DELAY_MS)
  }, [
    appendMessage,
    config.resultIntroMessage,
    messages.length,
    onComplete,
    resultContent,
    resultReady,
  ])

  const handleFinalisingReady = useCallback(() => {
    if (!resultReady || !resultContent) return
    finishConversation()
  }, [finishConversation, resultContent, resultReady])

  // When the API finishes after the min finalising animation, advance immediately.
  useEffect(() => {
    if (phase !== 'analyzing') return
    if (!resultReady || !resultContent) return
    const startedAt = finalisingStartedAtRef.current ?? Date.now()
    const elapsed = Date.now() - startedAt
    const wait = Math.max(0, 800 - elapsed)
    const t = window.setTimeout(() => finishConversation(), wait)
    return () => window.clearTimeout(t)
  }, [finishConversation, phase, resultContent, resultReady])

  useEffect(() => {
    console.info('[CareerEngineConversation] phase', {
      phase,
      resultReady,
      hasResultContent: Boolean(resultContent),
      messageCount: messages.length,
    })
  }, [messages.length, phase, resultContent, resultReady])

  const advanceAfterAnswer = useCallback(
    (nextAnswers: Record<string, string>, displayLabel: string) => {
      // Append user message from the latest state updater path (avoid stale messages array).
      appendMessage('user', displayLabel)

      const flow = getQuestionFlow(nextAnswers)
      const isLast = questionIndex >= flow.length - 1

      console.info('[CareerEngineConversation] submitted', {
        questionIndex,
        isLast,
        answerKeys: Object.keys(nextAnswers),
        displayLabel,
      })

      if (isLast) {
        finalisingStartedAtRef.current = Date.now()
        setPhase('analyzing')
        setShowInput(false)
        onAnalyzing?.(nextAnswers)
        return
      }

      askQuestion(questionIndex + 1, nextAnswers)
    },
    [appendMessage, askQuestion, getQuestionFlow, onAnalyzing, questionIndex]
  )

  const handleAnswer = useCallback(
    (value: string, label: string) => {
      if (disabled || !showInput || isTyping || submitting) return

      const question = resolveQuestionAt(questionIndex, answers)
      if (!question) return

      const answerKey = `${question.id}:${value}`
      if (lastAnswerKeyRef.current === answerKey) return
      lastAnswerKeyRef.current = answerKey

      const displayLabel = label || value
      setShowInput(false)
      setSubmitting(true)

      if (question.id === 'education_specialisation' && pendingSpec) {
        const nextAnswers = {
          ...answers,
          education_specialisation: pendingSpec.value,
          education_specialisation_other: value,
        }
        setAnswers(nextAnswers)
        answersRef.current = nextAnswers
        setPendingSpec(null)
        advanceAfterAnswer(nextAnswers, value)
        return
      }

      if (question.id === 'experience_specialisation' && pendingSpec) {
        const nextAnswers = {
          ...answers,
          experience_specialisation: pendingSpec.value,
          experience_specialisation_other: value,
        }
        setAnswers(nextAnswers)
        answersRef.current = nextAnswers
        setPendingSpec(null)
        advanceAfterAnswer(nextAnswers, value)
        return
      }

      let nextAnswers = { ...answers, [question.id]: value }

      if (question.id === 'education_specialisation') {
        const fieldId = answers.education_field as EducationFieldId | undefined

        if (fieldId === 'other') {
          nextAnswers = {
            ...nextAnswers,
            education_specialisation: 'other_degree',
            education_specialisation_other: value,
          }
        } else if (fieldId && specialisationAllowsFreeText(fieldId, value)) {
          setAnswers(nextAnswers)
          answersRef.current = nextAnswers
          setPendingSpec({ value, label: displayLabel })
          appendMessage('user', displayLabel)
          setShowInput(true)
          setSubmitting(false)
          return
        }
      }

      if (question.id === 'experience_specialisation') {
        const industryId = answers.industry as ExperienceIndustryId | undefined

        if (industryId === 'other') {
          nextAnswers = {
            ...nextAnswers,
            experience_specialisation: 'other_role',
            experience_specialisation_other: value,
          }
        } else if (industryId && experienceSpecialisationAllowsFreeText(industryId, value)) {
          setAnswers(nextAnswers)
          answersRef.current = nextAnswers
          setPendingSpec({ value, label: displayLabel })
          appendMessage('user', displayLabel)
          setShowInput(true)
          setSubmitting(false)
          return
        }
      }

      setAnswers(nextAnswers)
      answersRef.current = nextAnswers
      advanceAfterAnswer(nextAnswers, displayLabel)
    },
    [
      advanceAfterAnswer,
      answers,
      appendMessage,
      disabled,
      isTyping,
      pendingSpec,
      questionIndex,
      resolveQuestionAt,
      showInput,
      submitting,
    ]
  )

  const currentQuestion =
    questionIndex >= 0 && questionIndex < totalQuestions
      ? resolveQuestionAt(questionIndex, answers)
      : null

  const useCards = currentQuestion && currentQuestion.options.length > 6 && !pendingSpec
  const inputsLocked = Boolean(disabled || isTyping || submitting)

  const freeTextPlaceholder = pendingSpec
    ? 'Describe your specialisation…'
    : currentQuestion?.id === 'preferred_location'
      ? 'Or type a city / location…'
      : currentQuestion?.id === 'education_specialisation'
        ? 'Type your degree or specialisation…'
        : currentQuestion?.id === 'experience_specialisation'
          ? 'Type your job title or specialisation…'
          : 'Type your answer…'

  const hasChatContent = messages.length > 0 || isTyping || phase === 'analyzing'

  return (
    <div className="flex flex-col">
      <CareerEngineProgressIndicator progress={progress} label={progressLabel} className="mb-5" />

      <div
        ref={scrollRef}
        className={
          hasChatContent
            ? 'overflow-y-auto space-y-4 pr-1 max-h-[min(62vh,640px)] scroll-smooth min-h-[120px]'
            : 'min-h-0'
        }
      >
        {messages.map((msg) =>
          msg.role === 'assistant' ? (
            <AssistantBubble key={msg.id} content={msg.content} />
          ) : (
            <UserBubble key={msg.id} content={msg.content} />
          )
        )}

        {isTyping && <CareerEngineTypingBubble />}

        {phase === 'analyzing' && (
          <JazFinalisingRoadmap
            complete={Boolean(resultReady && resultContent)}
            minMs={1200}
            onReady={handleFinalisingReady}
          />
        )}
      </div>

      {/* Render as soon as content exists — do not wait only on phase===result */}
      {resultContent && (phase === 'result' || phase === 'result_intro') && (
        <div className="mt-6 pt-6 border-t border-violet-500/15 animate-in fade-in duration-500">
          {resultContent}
        </div>
      )}

      {phase === 'chat' && showInput && currentQuestion && !isTyping && (
        <div className="mt-5 pt-4 border-t border-slate-800/60 space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-400">
          {currentQuestion.helperText && !pendingSpec && (
            <p className="text-xs text-slate-400">{currentQuestion.helperText}</p>
          )}
          {currentQuestion.allowMultiple && currentQuestion.options.length > 0 && !pendingSpec ? (
            <CareerEngineMultiSelectChips
              options={currentQuestion.options}
              onConfirm={handleAnswer}
              disabled={inputsLocked}
              variant={useCards ? 'cards' : 'chips'}
              maxSelections={currentQuestion.maxSelections}
            />
          ) : (
            currentQuestion.options.length > 0 &&
            !pendingSpec && (
              <CareerEngineOptionChips
                options={currentQuestion.options}
                onSelect={handleAnswer}
                disabled={inputsLocked}
                variant={useCards ? 'cards' : 'chips'}
              />
            )
          )}
          {(pendingSpec ||
            currentQuestion.allowFreeText ||
            currentQuestion.options.length === 0) && (
            <CareerEngineFreeTextInput
              placeholder={freeTextPlaceholder}
              onSubmit={(text) => handleAnswer(text, text)}
              disabled={inputsLocked}
            />
          )}
        </div>
      )}
    </div>
  )
}
