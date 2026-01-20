import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/proofreading/issues/list?documentId=xxx&status=open
 * 
 * Fetches issues for a document, optionally filtered by status.
 */
export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url)
    const documentId = searchParams.get('documentId')
    const status = searchParams.get('status')

    if (!documentId) {
      return NextResponse.json(
        { ok: false, error: 'documentId is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('proofreading_issues')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', user.id)
      .order('start_index', { ascending: true })

    if (status) {
      query = query.eq('status', status)
    }

    const { data: issues, error } = await query

    if (error) {
      console.error('[Proofreading Issues List] Error fetching issues:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch issues' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, issues: issues || [] })
  } catch (error: any) {
    console.error('[Proofreading Issues List] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

