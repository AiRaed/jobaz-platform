import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/proofreading/documents?project_id=xxx
 * Fetches the latest document for a project (ORDER BY updated_at DESC LIMIT 1)
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
    const projectId = searchParams.get('project_id')

    if (!projectId) {
      return NextResponse.json(
        { ok: false, error: 'project_id is required' },
        { status: 400 }
      )
    }

    const { data: documents, error } = await supabase
      .from('proofreading_documents')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('[Proofreading Documents] Error:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch document' },
        { status: 500 }
      )
    }

    const document = documents && documents.length > 0 ? documents[0] : null

    return NextResponse.json({ ok: true, document })
  } catch (error: any) {
    console.error('[Proofreading Documents] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/proofreading/documents
 * Creates a new document for a project.
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
    const { project_id, content = '' } = body

    if (!project_id) {
      return NextResponse.json(
        { ok: false, error: 'project_id is required' },
        { status: 400 }
      )
    }

    const wordCount = content.trim().split(/\s+/).filter((w: string) => w.length > 0).length
    const estimatedPages = Math.ceil(wordCount / 250) // ~250 words per page

    const { data: document, error } = await supabase
      .from('proofreading_documents')
      .insert({
        project_id,
        user_id: user.id,
        content: content || '',
        word_count: wordCount,
        estimated_pages: estimatedPages,
        analysis: {},
      })
      .select()
      .single()

    if (error) {
      console.error('[Proofreading Documents] Error:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to create document' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, document })
  } catch (error: any) {
    console.error('[Proofreading Documents] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

