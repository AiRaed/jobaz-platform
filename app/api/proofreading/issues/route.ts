import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/proofreading/issues?document_id=xxx&status=xxx
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
    const documentId = searchParams.get('document_id')
    const status = searchParams.get('status')

    if (!documentId) {
      return NextResponse.json(
        { ok: false, error: 'document_id is required' },
        { status: 400 }
      )
    }

    let query = supabase
      .from('proofreading_issues')
      .select('*')
      .eq('document_id', documentId)
      .eq('user_id', user.id)

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    const { data: issues, error } = await query.order('start_index', { ascending: true })

    if (error) {
      console.error('[Proofreading Issues] Error:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch issues' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, issues: issues || [] })
  } catch (error: any) {
    console.error('[Proofreading Issues] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/proofreading/issues
 * Creates new issues (used after analysis).
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
    const { document_id, issues } = body

    if (!document_id || !Array.isArray(issues)) {
      return NextResponse.json(
        { ok: false, error: 'document_id and issues array are required' },
        { status: 400 }
      )
    }

    // Delete previous issues for this document
    const { error: deleteError } = await supabase
      .from('proofreading_issues')
      .delete()
      .eq('document_id', document_id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('[Proofreading Issues] Delete error:', deleteError)
      return NextResponse.json(
        { ok: false, error: 'Failed to clear previous issues' },
        { status: 500 }
      )
    }

    // Insert new issues
    if (issues.length > 0) {
      const issuesToInsert = issues.map((issue: any) => ({
        user_id: user.id,
        document_id,
        type: issue.type,
        severity: issue.severity,
        message: issue.message,
        original_text: issue.original_text || issue.originalText || '',
        suggestion_text: issue.suggestion_text || issue.suggestionText || issue.suggestion || '',
        start_index: issue.startIndex,
        end_index: issue.endIndex,
        status: 'open',
      }))

      const { data: insertedIssues, error: insertError } = await supabase
        .from('proofreading_issues')
        .insert(issuesToInsert)
        .select()

      if (insertError) {
        console.error('[Proofreading Issues] Insert error:', insertError)
        return NextResponse.json(
          { ok: false, error: 'Failed to insert issues' },
          { status: 500 }
        )
      }

      return NextResponse.json({ ok: true, issues: insertedIssues })
    }

    return NextResponse.json({ ok: true, issues: [] })
  } catch (error: any) {
    console.error('[Proofreading Issues] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

