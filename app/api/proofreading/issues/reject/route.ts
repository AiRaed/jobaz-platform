import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/proofreading/issues/reject
 * 
 * Rejects an issue (marks it as rejected).
 * 
 * Request body:
 * - issueId: string (required)
 */
export async function POST(req: NextRequest) {
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

    const body = await req.json()
    const { issueId } = body

    if (!issueId) {
      return NextResponse.json(
        { ok: false, error: 'issueId is required' },
        { status: 400 }
      )
    }

    // Update issue status to rejected
    const { error } = await supabase
      .from('proofreading_issues')
      .update({ status: 'rejected' })
      .eq('id', issueId)
      .eq('user_id', user.id)

    if (error) {
      console.error('[Proofreading Issues Reject] Error rejecting issue:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to reject issue' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Proofreading Issues Reject] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

