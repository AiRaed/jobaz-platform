import { NextResponse } from 'next/server'
import {
  getExperienceQuestionForField,
  getProfessionFieldById,
  getProfessionFieldBySlug,
  getSpecialismBySlug,
  listLevelsForSpecialism,
  loadProfessionKnowledge,
} from '@/lib/career-engine/work-in-profession'

export const dynamic = 'force-dynamic'

/**
 * GET Step 3 experience options for field (+ optional specialism).
 * Returns field-specific contextual questions for every profession field.
 * Driving options are specialism-aware so Bus / PCV and HGV / LGV stay separate.
 */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const fieldId = url.searchParams.get('field_id')?.trim() || ''
  const fieldSlug = url.searchParams.get('field_slug')?.trim() || ''
  const specialismId = url.searchParams.get('specialism_id')?.trim() || ''
  const specialismSlug = url.searchParams.get('specialism_slug')?.trim() || ''

  const field =
    (fieldId && getProfessionFieldById(fieldId)) ||
    (fieldSlug && getProfessionFieldBySlug(fieldSlug)) ||
    null

  let resolvedSpecialismSlug = specialismSlug
  if (!resolvedSpecialismSlug && specialismId) {
    const spec = loadProfessionKnowledge().specialisms.find((s) => s.id === specialismId)
    resolvedSpecialismSlug = spec?.slug || ''
  }

  if (!field) {
    const config = getExperienceQuestionForField('')
    return NextResponse.json({
      mode: config.mode,
      question: config.question,
      description: config.description,
      result_label: config.result_label,
      options: config.options.map((o) => ({
        id: o.id,
        label: o.label,
        display_label: o.display_label,
        description: o.description,
      })),
      filtered: false,
    })
  }

  const config = getExperienceQuestionForField(field.slug, resolvedSpecialismSlug)

  // Contextual modes: return field options (driving already filtered by specialism).
  if (config.mode !== 'generic') {
    return NextResponse.json({
      mode: config.mode,
      question: config.question,
      description: config.description,
      result_label: config.result_label,
      options: config.options.map((o) => ({
        id: o.id,
        label: o.label,
        display_label: o.display_label,
        description: o.description,
      })),
      filtered: config.mode === 'driving' && Boolean(resolvedSpecialismSlug),
    })
  }

  let options = config.options
  let filtered = false

  if (resolvedSpecialismSlug && getSpecialismBySlug(field.slug, resolvedSpecialismSlug)) {
    const available = new Set(
      listLevelsForSpecialism(field.slug, resolvedSpecialismSlug).map((l) => l.key)
    )
    const narrowed = config.options.filter((o) => available.has(o.mapped_level))
    if (narrowed.length > 0) {
      options = narrowed
      filtered = narrowed.length < config.options.length
    }
  }

  return NextResponse.json({
    mode: config.mode,
    question: config.question,
    description: config.description,
    result_label: config.result_label,
    options: options.map((o) => ({
      id: o.id,
      label: o.label,
      display_label: o.display_label,
      description: o.description,
    })),
    filtered,
  })
}
