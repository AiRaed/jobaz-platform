import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/proofreading/documents/get-latest?projectId=xxx
 * 
 * Fetches the latest document for a specific project.
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
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        { ok: false, error: 'projectId is required' },
        { status: 400 }
      )
    }

    const { data: document, error } = await supabase
      .from('proofreading_documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error) {
      console.error('[Proofreading Documents] Error fetching document:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch document' },
        { status: 500 }
      )
    }

    if (document) {
      return NextResponse.json({ ok: true, hasDoc: true, doc: document })
    } else {
      return NextResponse.json({ ok: true, hasDoc: false, doc: null })
    }
  } catch (error: any) {
    console.error('[Proofreading Documents] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
