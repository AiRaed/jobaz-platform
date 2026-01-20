import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * PATCH /api/proofreading/issues/[id]
 * Updates issue status (applied/rejected).
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
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
            // Ignore in route handler
          }
        },
      },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { id } = params
    const body = await req.json()
    const { status } = body

    if (!status || !['open', 'applied', 'rejected'].includes(status)) {
      return NextResponse.json(
        { ok: false, error: 'Valid status is required' },
        { status: 400 }
      )
    }

    const { data: issue, error } = await supabase
      .from('proofreading_issues')
      .update({ status })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[Proofreading Issues] Error:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to update issue' },
        { status: 500 }
      )
    }

    if (!issue) {
      return NextResponse.json(
        { ok: false, error: 'Issue not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ ok: true, issue })
  } catch (error: any) {
    console.error('[Proofreading Issues] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

