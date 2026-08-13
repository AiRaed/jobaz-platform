/**
 * Normalize UK Career Assistant API payloads for the client (safe access, no crashes).
 */

import type { Question } from '@/app/uk-career-assistant/page'
import {
  isCareerBrainStructuredAnswerKey,
  isGrowCareerAssessmentAnswerKey,
} from '@/lib/career-brain/growCareerPath'

export type NormalizedUkResponse = {
  path: string | null
  phase: string
  assistant_message: string
  question: Question | null
  allow_free_text: boolean
  state_updates: Record<string, unknown>
  done: boolean
  result: unknown
  career_brain_active?: boolean
  question_source?: 'career_brain' | 'legacy'
  legacy_flow_bypassed?: boolean
  career_advisor?: unknown
  _career_brain_debug?: unknown
  [key: string]: unknown
}

function normalizeQuestion(raw: unknown): Question | null {
  if (!raw || typeof raw !== 'object') return null
  const q = raw as Record<string, unknown>
  const id = String(q.id ?? '').trim()
  const text = String(q.text ?? '').trim()
  if (!id || !text) return null

  const rawType = String(q.type ?? 'single').toLowerCase()
  let type: 'single' | 'multi' = 'single'
  if (rawType === 'multi' || rawType === 'multi_choice') type = 'multi'

  const options = Array.isArray(q.options)
    ? q.options
        .map((o) => {
          if (!o || typeof o !== 'object') return null
          const opt = o as Record<string, unknown>
          const value = String(opt.value ?? opt.id ?? '').trim()
          const label = String(opt.label ?? opt.text ?? value).trim()
          if (!value) return null
          const description =
            typeof opt.description === 'string' && opt.description.trim()
              ? opt.description.trim()
              : undefined
          const disabled = opt.disabled === true
          const badge =
            typeof opt.badge === 'string' && opt.badge.trim() ? opt.badge.trim() : undefined
          const helperText =
            typeof opt.helperText === 'string' && opt.helperText.trim()
              ? opt.helperText.trim()
              : undefined
          return {
            label: label || value,
            value,
            ...(description ? { description } : {}),
            ...(disabled ? { disabled: true } : {}),
            ...(badge ? { badge } : {}),
            ...(helperText ? { helperText } : {}),
          }
        })
        .filter(
          (
            x
          ): x is {
            label: string
            value: string
            description?: string
            disabled?: boolean
            badge?: string
            helperText?: string
          } => x !== null
        )
    : []

  return {
    id,
    text,
    type,
    options,
    max_select: typeof q.max_select === 'number' ? q.max_select : undefined,
    allow_free_text:
      rawType === 'free_text' ||
      q.allow_free_text === true ||
      options.length === 0,
  }
}

export function normalizeUkCareerClientResponse(data: unknown): NormalizedUkResponse {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>

  const question = normalizeQuestion(d.current_question ?? d.question)

  if (process.env.NODE_ENV === 'development') {
    console.log('[UK Career Assistant Client]', {
      question_source:
        d.question_source ??
        (question?.id && isCareerBrainStructuredAnswerKey(question.id) ? 'career_brain' : 'legacy'),
      career_brain_active: Boolean(d.career_brain_active),
      legacy_flow_bypassed: Boolean(d.legacy_flow_bypassed),
      question_id: question?.id ?? null,
      question_text: question?.text?.slice(0, 80) ?? null,
      options_count: question?.options?.length ?? 0,
      detected_domain:
        (d._career_brain_debug as { detectedDomain?: string } | undefined)?.detectedDomain ??
        (d.state_updates as { career_brain_profile?: { domain?: string } })?.career_brain_profile
          ?.domain,
      done: Boolean(d.done),
      phase: d.phase,
    })
  }

  return {
    path: d.path != null ? String(d.path) : null,
    phase: String(d.phase ?? 'CLASSIFY'),
    assistant_message: String(d.assistant_message ?? ''),
    question,
    allow_free_text: d.allow_free_text !== false,
    state_updates:
      d.state_updates && typeof d.state_updates === 'object'
        ? (d.state_updates as Record<string, unknown>)
        : {},
    done: Boolean(d.done),
    result: d.result ?? null,
    career_brain_active: Boolean(d.career_brain_active),
    question_source: d.question_source as 'career_brain' | 'legacy' | undefined,
    legacy_flow_bypassed: Boolean(d.legacy_flow_bypassed),
    career_advisor: d.career_advisor,
    _career_brain_debug: d._career_brain_debug,
  }
}

export function isCareerBrainClientFlow(
  state: Record<string, unknown>,
  response?: NormalizedUkResponse | null
): boolean {
  if (response?.career_brain_active || response?.question_source === 'career_brain') return true
  if (state.career_brain_result) return true
  if (response?.done && response.result) {
    const r = response.result as { career_brain?: unknown }
    if (r?.career_brain) return true
  }
  const qid = response?.question?.id
  if (qid && isCareerBrainStructuredAnswerKey(qid)) return true
  if (state.career_brain_profile && state.classification_done) return true
  return false
}

export function shouldCommitAnswerToState(
  questionId: string | undefined,
  _careerBrainFlow: boolean
): boolean {
  if (!questionId) return false
  if (isCareerBrainStructuredAnswerKey(questionId)) return true
  return true
}
