import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { friendlyCareerLibraryError } from '@/lib/admin/career-library/errors'
import { countSpecialismsForField, normalizeSlug } from '@/lib/admin/career-library/guards'
import { mapFieldRow } from '@/lib/admin/career-library/mappers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import type { CareerLibraryFieldStatus } from '@/lib/admin/career-library/types'

export const dynamic = 'force-dynamic'

type PatchBody = {
  name?: string
  slug?: string
  description?: string
  status?: CareerLibraryFieldStatus
  active?: boolean
  sortOrder?: number
}

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing field id.' }, { status: 400 })
  }

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career Library storage is not configured.' },
      { status: 503 }
    )
  }

  let body: PatchBody
  try {
    body = (await req.json()) as PatchBody
  } catch {
    return NextResponse.json({ error: 'Invalid request. Please try again.' }, { status: 400 })
  }

  const patch: Record<string, unknown> = {}
  if (typeof body.name === 'string') {
    const name = body.name.trim()
    if (!name) {
      return NextResponse.json({ error: 'Field name cannot be empty.' }, { status: 400 })
    }
    patch.name = name
  }
  if (typeof body.slug === 'string') {
    const slug = normalizeSlug(body.slug, body.name ?? body.slug)
    if (!slug) {
      return NextResponse.json({ error: 'Slug is invalid.' }, { status: 400 })
    }
    patch.slug = slug
  }
  if (typeof body.description === 'string') patch.description = body.description.trim()
  if (body.status === 'draft' || body.status === 'approved' || body.status === 'disabled') {
    patch.status = body.status
    if (body.status === 'disabled') patch.active = false
  }
  if (typeof body.active === 'boolean') {
    patch.active = body.active
    if (body.active === false && patch.status === undefined) {
      // keep status unless explicitly disabled via status field
    }
    if (body.active === true && body.status === undefined) {
      // if re-enabling from disabled status, move to draft
      const { data: current } = await supabase
        .from('career_library_fields')
        .select('status')
        .eq('id', id)
        .maybeSingle()
      if (current?.status === 'disabled') patch.status = 'draft'
    }
  }
  if (typeof body.sortOrder === 'number' && Number.isFinite(body.sortOrder)) {
    patch.sort_order = Math.trunc(body.sortOrder)
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: 'No updates provided.' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('career_library_fields')
    .update(patch)
    .eq('id', id)
    .select('*')
    .single()

  if (error || !data) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not update this career field.') },
      { status: 500 }
    )
  }

  const count = await countSpecialismsForField(supabase, id)
  return NextResponse.json({ field: mapFieldRow(data, Math.max(0, count)) })
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const { id } = await context.params
  if (!id) {
    return NextResponse.json({ error: 'Missing field id.' }, { status: 400 })
  }

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career Library storage is not configured.' },
      { status: 503 }
    )
  }

  const count = await countSpecialismsForField(supabase, id)
  if (count < 0) {
    return NextResponse.json(
      { error: 'Could not check field dependencies. Please try again.' },
      { status: 500 }
    )
  }
  if (count > 0) {
    return NextResponse.json(
      {
        error: `This field has ${count} specialism${count === 1 ? '' : 's'}. Remove or move them before deleting the field.`,
        dependencyCount: count,
      },
      { status: 409 }
    )
  }

  const { error } = await supabase.from('career_library_fields').delete().eq('id', id)
  if (error) {
    return NextResponse.json(
      { error: friendlyCareerLibraryError(error, 'Could not delete this career field.') },
      { status: 500 }
    )
  }

  return NextResponse.json({ ok: true })
}
