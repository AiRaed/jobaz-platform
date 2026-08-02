import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { createServerSupabaseClient } from '@/lib/supabase'
import { toOpportunityRow } from '@/lib/opportunities/mappers'
import {
  ADMIN_OPPORTUNITY_SELECT,
  ADMIN_SAVE_STATUSES,
  OPPORTUNITY_CATEGORIES,
  OPPORTUNITY_STATUSES,
  type AdminSaveStatus,
  type OpportunityStatus,
} from '@/lib/opportunities/types'

export const dynamic = 'force-dynamic'

function str(v: unknown, max: number): string {
  return String(v ?? '')
    .trim()
    .slice(0, max)
}

function parseAdminPayload(body: Record<string, unknown>) {
  const title = str(body.title, 120)
  const category = str(body.category, 80)
  const location = str(body.location, 120)
  const description = str(body.description, 2000)
  const status = str(body.status, 32) as AdminSaveStatus
  const confirmed_real = Boolean(body.confirmed_real)

  if (!title || title.length < 4) {
    return { error: 'Please enter a clear title (at least 4 characters).' }
  }
  if (!category || !(OPPORTUNITY_CATEGORIES as readonly string[]).includes(category)) {
    return { error: 'Please choose a valid category.' }
  }
  if (!location) {
    return { error: 'Please add a location or postcode area.' }
  }
  if (!description || description.length < 20) {
    return { error: 'Please add a description (at least 20 characters).' }
  }
  if (!(ADMIN_SAVE_STATUSES as readonly string[]).includes(status)) {
    return { error: 'Status must be draft, published, or filled.' }
  }
  if (!confirmed_real) {
    return { error: 'Please confirm this is a real opportunity collected by JobAZ/admin.' }
  }

  const business_name = str(body.business_name, 120) || null
  const poster_name = str(body.poster_name, 120) || business_name

  return {
    data: {
      title,
      category,
      location,
      date_text: str(body.date_text, 80) || null,
      pay_text: str(body.pay_text, 80) || null,
      description,
      contact_preference: str(body.contact_preference, 120) || null,
      contact_name: str(body.contact_name, 120) || null,
      contact_email: str(body.contact_email, 160) || null,
      contact_phone: str(body.contact_phone, 40) || null,
      business_name,
      poster_name,
      source: str(body.source, 200) || null,
      internal_note: str(body.internal_note, 2000) || null,
      contact_public: Boolean(body.contact_public),
      status,
      created_by_admin: true,
    },
  }
}

/** GET — admin list */
export async function GET(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const url = new URL(req.url)
    const status = url.searchParams.get('status')?.trim() ?? 'pending_review'

    const supabase = createServerSupabaseClient()
    let query = supabase
      .from('opportunities')
      .select(ADMIN_OPPORTUNITY_SELECT)
      .order('created_at', { ascending: false })
      .limit(200)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    } else {
      query = query.neq('status', 'deleted')
    }

    const { data, error } = await query
    if (error) {
      console.error('[api/admin/opportunities GET]', error)
      return NextResponse.json({ error: 'Failed to load opportunities' }, { status: 500 })
    }

    const rows = (data ?? []).map(toOpportunityRow)

    const userIds = [...new Set(rows.map((r) => r.user_id).filter(Boolean))] as string[]
    const emailById = new Map<string, string>()
    if (userIds.length > 0) {
      try {
        const { data: usersData } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 })
        for (const u of usersData?.users ?? []) {
          if (userIds.includes(u.id) && u.email) emailById.set(u.id, u.email)
        }
      } catch {
        // optional enrichment
      }
    }

    return NextResponse.json({
      opportunities: rows.map((r) => ({
        ...r,
        user_email: r.user_id ? emailById.get(r.user_id) ?? null : null,
      })),
    })
  } catch (err) {
    console.error('[api/admin/opportunities GET]', err)
    return NextResponse.json({ error: 'Failed to load opportunities' }, { status: 500 })
  }
}

/** POST — admin create (draft / published / filled) */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json()) as Record<string, unknown>
    const parsed = parseAdminPayload(body)
    if ('error' in parsed && parsed.error) {
      return NextResponse.json({ error: parsed.error }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { data, error } = await supabase
      .from('opportunities')
      .insert({
        ...parsed.data!,
        user_id: auth.user.id,
      })
      .select(ADMIN_OPPORTUNITY_SELECT)
      .single()

    if (error) {
      console.error('[api/admin/opportunities POST]', error)
      return NextResponse.json({ error: 'Could not create opportunity' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, opportunity: toOpportunityRow(data) }, { status: 201 })
  } catch (err) {
    console.error('[api/admin/opportunities POST]', err)
    return NextResponse.json({ error: 'Could not create opportunity' }, { status: 500 })
  }
}

/**
 * PATCH — status-only quick action OR full field edit.
 * Body with only { id, status } => status update.
 * Body with title/description etc => full update (admin edit).
 */
export async function PATCH(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json()) as Record<string, unknown>
    const id = str(body.id, 80)
    if (!id) {
      return NextResponse.json({ error: 'Missing opportunity id' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const isFullEdit = Boolean(body.title || body.description || body.category || body.location)

    if (isFullEdit) {
      const parsed = parseAdminPayload(body)
      if ('error' in parsed && parsed.error) {
        return NextResponse.json({ error: parsed.error }, { status: 400 })
      }

      const { created_by_admin: _createdByAdmin, ...updateFields } = parsed.data!
      const { data, error } = await supabase
        .from('opportunities')
        .update(updateFields)
        .eq('id', id)
        .select(ADMIN_OPPORTUNITY_SELECT)
        .single()

      if (error) {
        console.error('[api/admin/opportunities PATCH full]', error)
        return NextResponse.json({ error: 'Failed to update opportunity' }, { status: 500 })
      }

      return NextResponse.json({ ok: true, opportunity: toOpportunityRow(data) })
    }

    const status = str(body.status, 32) as OpportunityStatus
    if (!(OPPORTUNITY_STATUSES as readonly string[]).includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('opportunities')
      .update({ status })
      .eq('id', id)
      .select(ADMIN_OPPORTUNITY_SELECT)
      .single()

    if (error) {
      console.error('[api/admin/opportunities PATCH status]', error)
      return NextResponse.json({ error: 'Failed to update opportunity' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, opportunity: toOpportunityRow(data) })
  } catch (err) {
    console.error('[api/admin/opportunities PATCH]', err)
    return NextResponse.json({ error: 'Failed to update opportunity' }, { status: 500 })
  }
}

/** DELETE — soft-delete via status=deleted */
export async function DELETE(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const url = new URL(req.url)
    const id = url.searchParams.get('id')?.trim()
    if (!id) {
      return NextResponse.json({ error: 'Missing opportunity id' }, { status: 400 })
    }

    const supabase = createServerSupabaseClient()
    const { error } = await supabase
      .from('opportunities')
      .update({ status: 'deleted' })
      .eq('id', id)

    if (error) {
      console.error('[api/admin/opportunities DELETE]', error)
      return NextResponse.json({ error: 'Failed to delete opportunity' }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[api/admin/opportunities DELETE]', err)
    return NextResponse.json({ error: 'Failed to delete opportunity' }, { status: 500 })
  }
}
