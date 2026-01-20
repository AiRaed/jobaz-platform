import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/proofreading/documents/get?projectId=xxx&documentId=xxx
 * 
 * Fetches a specific document or all documents for a project.
 * If documentId is provided, returns that document.
 * If only projectId is provided, returns all documents for the project.
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
    const documentId = searchParams.get('documentId')

    if (!projectId && !documentId) {
      return NextResponse.json(
        { ok: false, error: 'projectId or documentId is required' },
        { status: 400 }
      )
    }

    if (documentId) {
      // Fetch specific document
      const { data: document, error } = await supabase
        .from('proofreading_documents')
        .select('*')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .single()

      if (error) {
        console.error('[Proofreading Documents Get] Error fetching document:', error)
        return NextResponse.json(
          { ok: false, error: 'Failed to fetch document' },
          { status: 500 }
        )
      }

      if (!document) {
        return NextResponse.json(
          { ok: false, error: 'Document not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ ok: true, document })
    } else {
      // Fetch all documents for project
      const { data: documents, error } = await supabase
        .from('proofreading_documents')
        .select('*')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (error) {
        console.error('[Proofreading Documents Get] Error fetching documents:', error)
        return NextResponse.json(
          { ok: false, error: 'Failed to fetch documents' },
          { status: 500 }
        )
      }

      return NextResponse.json({ ok: true, documents: documents || [] })
    }
  } catch (error: any) {
    console.error('[Proofreading Documents Get] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

