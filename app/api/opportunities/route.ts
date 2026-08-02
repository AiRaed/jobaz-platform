import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { toPublicOpportunity } from '@/lib/opportunities/mappers'
import { OPPORTUNITY_CATEGORIES } from '@/lib/opportunities/types'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

function getRouteClient() {
  const cookieStore = cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // ignore when called from a context that cannot set cookies
        }
      },
    },
  })
}

/** GET — public published opportunities (optional q / location / category filters). */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const q = url.searchParams.get('q')?.trim() ?? ''
    const location = url.searchParams.get('location')?.trim() ?? ''
    const category = url.searchParams.get('category')?.trim() ?? ''

    const supabase = getRouteClient()
    let query = supabase
      .from('opportunities')
      .select(
        'id, title, category, location, pay_text, date_text, description, poster_name, created_at, created_by_admin, business_name, contact_preference, contact_email, contact_phone, contact_public'
      )
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(100)

    if (category && category !== 'all') {
      query = query.ilike('category', category)
    }
    if (location) {
      query = query.ilike('location', `%${location}%`)
    }
    if (q) {
      query = query.or(
        `title.ilike.%${q}%,description.ilike.%${q}%,category.ilike.%${q}%,location.ilike.%${q}%,poster_name.ilike.%${q}%`
      )
    }

    const { data, error } = await query
    if (error) {
      console.error('[api/opportunities GET]', error)
      return NextResponse.json({ error: 'Failed to load opportunities' }, { status: 500 })
    }

    return NextResponse.json({
      opportunities: (data ?? []).map(toPublicOpportunity),
      total: data?.length ?? 0,
    })
  } catch (err) {
    console.error('[api/opportunities GET]', err)
    return NextResponse.json({ error: 'Failed to load opportunities' }, { status: 500 })
  }
}

/** POST — authenticated create as pending_review (never published directly). */
export async function POST(req: NextRequest) {
  try {
    const supabase = getRouteClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = (await req.json()) as Record<string, unknown>
    const title = String(body.title ?? '').trim()
    const category = String(body.category ?? '').trim()
    const location = String(body.location ?? '').trim()
    const pay_text = String(body.pay_text ?? '').trim()
    const date_text = String(body.date_text ?? '').trim()
    const description = String(body.description ?? '').trim()
    const contact_preference = String(body.contact_preference ?? '').trim()
    const poster_name = String(body.poster_name ?? '').trim()
    const terms_accepted = Boolean(body.terms_accepted)

    if (!title || title.length < 4) {
      return NextResponse.json({ error: 'Please enter a clear title (at least 4 characters).' }, { status: 400 })
    }
    if (!category) {
      return NextResponse.json({ error: 'Please choose a category.' }, { status: 400 })
    }
    if (!(OPPORTUNITY_CATEGORIES as readonly string[]).includes(category)) {
      return NextResponse.json({ error: 'Invalid category.' }, { status: 400 })
    }
    if (!location) {
      return NextResponse.json({ error: 'Please add a location or postcode area.' }, { status: 400 })
    }
    if (!description || description.length < 20) {
      return NextResponse.json(
        { error: 'Please add a short description (at least 20 characters).' },
        { status: 400 }
      )
    }
    if (!poster_name) {
      return NextResponse.json({ error: 'Please add your name or business name.' }, { status: 400 })
    }
    if (!contact_preference) {
      return NextResponse.json({ error: 'Please choose a contact preference.' }, { status: 400 })
    }
    if (!terms_accepted) {
      return NextResponse.json(
        { error: 'Please confirm this is a real opportunity.' },
        { status: 400 }
      )
    }

    const { data, error } = await supabase
      .from('opportunities')
      .insert({
        user_id: user.id,
        title: title.slice(0, 120),
        category: category.slice(0, 80),
        location: location.slice(0, 120),
        pay_text: pay_text.slice(0, 80) || null,
        date_text: date_text.slice(0, 80) || null,
        description: description.slice(0, 2000),
        contact_preference: contact_preference.slice(0, 120),
        poster_name: poster_name.slice(0, 120),
        status: 'pending_review',
      })
      .select('id, status, created_at')
      .single()

    if (error) {
      console.error('[api/opportunities POST]', error)
      return NextResponse.json(
        { error: 'Could not submit opportunity. Please try again.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        ok: true,
        opportunity: data,
        message:
          'Your opportunity has been submitted for review. It will appear after admin approval.',
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[api/opportunities POST]', err)
    return NextResponse.json({ error: 'Could not submit opportunity.' }, { status: 500 })
  }
}
