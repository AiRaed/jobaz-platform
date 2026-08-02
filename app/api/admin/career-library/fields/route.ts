import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import { normalizeSlug } from '@/lib/admin/career-library/guards'
import { mapFieldRow } from '@/lib/admin/career-library/mappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import type { CareerLibraryFieldInput, CareerLibraryFieldStatus } from '@/lib/admin/career-library/types'

export const dynamic = 'force-dynamic'

function normalizeStatus(
  status: CareerLibraryFieldStatus | undefined,
  active: boolean | undefined
): { status: CareerLibraryFieldStatus; active: boolean } {
  const nextStatus: CareerLibraryFieldStatus =
    status === 'approved' || status === 'disabled' || status === 'draft' ? status : 'draft'
  if (nextStatus === 'disabled') return { status: nextStatus, active: false }
  if (typeof active === 'boolean') return { status: nextStatus, active }
  return { status: nextStatus, active: true }
}

export async function POST(req: Request) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career Library storage is not configured.' },
      { status: 503 }
    )
  }

  let input: CareerLibraryFieldInput
  try {
    input = (await req.json()) as CareerLibraryFieldInput
  } catch {
    return NextResponse.json({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }

  const name = input.name?.trim()
  if (!name) {
    return NextResponse.json({ error: 'Field name is required.' }, { status: 400 })
  }

  const slug = normalizeSlug(input.slug, name)
  if (!slug) {
    return NextResponse.json(
      { error: 'Could not create a valid slug. Use letters and numbers.' },
      { status: 400 }
    )
  }

  const { status, active } = normalizeStatus(input.status, input.active)

  const { data, error } = await supabase
    .from('career_library_fields')
    .insert({
      name,
      slug,
      description: input.description?.trim() ?? '',
      status,
      active,
      sort_order: typeof input.sortOrder === 'number' ? input.sortOrder : 0,
    })
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not create this career field.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ field: mapFieldRow(data, 0) }, { status: 201 })
}
