/**
 * UI-safe question shape for UK Career Assistant client.
 */

export type CareerBrainUiQuestionType = 'single_choice' | 'multi_choice' | 'free_text'

export type CareerBrainApiQuestion = {
  id: string
  text: string
  type: CareerBrainUiQuestionType
  options: Array<{ label: string; value: string }>
  max_select?: number
  allow_free_text?: boolean
}

/** Client QuestionCard expects single | multi */
export type LegacyUiQuestion = {
  id: string
  text: string
  type: 'single' | 'multi'
  options: Array<{ label: string; value: string }>
  max_select?: number
  allow_free_text?: boolean
}

export function normalizeCareerBrainQuestion(raw: unknown): CareerBrainApiQuestion | null {
  if (!raw || typeof raw !== 'object') return null
  const q = raw as Record<string, unknown>
  const id = String(q.id ?? '').trim()
  const text = String(q.text ?? '').trim()
  if (!id || !text) return null

  const rawType = String(q.type ?? 'single_choice').toLowerCase()
  let type: CareerBrainUiQuestionType = 'single_choice'
  if (rawType === 'multi' || rawType === 'multi_choice') type = 'multi_choice'
  else if (rawType === 'free_text') type = 'free_text'
  else type = 'single_choice'

  const options = Array.isArray(q.options)
    ? q.options
        .map((o) => {
          if (!o || typeof o !== 'object') return null
          const opt = o as Record<string, unknown>
          const value = String(opt.value ?? opt.id ?? '').trim()
          const label = String(opt.label ?? opt.text ?? value).trim()
          if (!value) return null
          return { label: label || value, value }
        })
        .filter((o): o is { label: string; value: string } => o !== null)
    : []

  const max_select =
    typeof q.max_select === 'number' ? q.max_select : undefined

  return {
    id,
    text,
    type,
    options,
    max_select,
    allow_free_text:
      type === 'free_text' || q.allow_free_text === true || options.length === 0,
  }
}

export function toLegacyUiQuestion(q: CareerBrainApiQuestion | null): LegacyUiQuestion | null {
  if (!q) return null
  return {
    id: q.id,
    text: q.text,
    type: q.type === 'multi_choice' ? 'multi' : 'single',
    options: q.options ?? [],
    max_select: q.max_select,
    allow_free_text: q.allow_free_text ?? q.type === 'free_text',
  }
}
