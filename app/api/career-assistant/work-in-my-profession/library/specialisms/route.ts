import { NextResponse } from 'next/server'
import {
  getProfessionFieldById,
  getProfessionFieldBySlug,
  listSpecialismsForField,
} from '@/lib/career-engine/work-in-profession'

export const dynamic = 'force-dynamic'

/** GET specialisms for a profession field (?field_id= or ?field_slug=). */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const fieldId = url.searchParams.get('field_id')?.trim() || ''
  const fieldSlug = url.searchParams.get('field_slug')?.trim() || ''
  const field =
    (fieldId && getProfessionFieldById(fieldId)) ||
    (fieldSlug && getProfessionFieldBySlug(fieldSlug)) ||
    null

  if (!field) {
    return NextResponse.json(
      { error: 'Profession field is required.', code: 'missing_field' },
      { status: 400 }
    )
  }

  const specialisms = listSpecialismsForField(field.slug).map((s) => ({
    id: s.id,
    slug: s.slug,
    name: s.name,
    description: s.description,
    field_id: s.field_id,
  }))

  return NextResponse.json({
    field: { id: field.id, slug: field.slug, name: field.name },
    specialisms,
    empty: specialisms.length === 0,
    message: specialisms.length === 0 ? 'No specialisms for this field yet.' : undefined,
  })
}
