import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * PATCH /api/proofreading/documents/[id]
 * Updates document content, word_count, estimated_pages, and analysis.
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
    
    const updates: {
      content?: string
      word_count?: number
      estimated_pages?: number
      analysis?: any
    } = {}

    if (body.content !== undefined) {
      updates.content = body.content
      const wordCount = body.content.trim().split(/\s+/).filter((w: string) => w.length > 0).length
      updates.word_count = wordCount
      updates.estimated_pages = Math.ceil(wordCount / 250)
    }
    
    if (body.analysis !== undefined) {
      updates.analysis = body.analysis
    }

    const { data: document, error } = await supabase
      .from('proofreading_documents')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[Proofreading Documents] Error:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to update document' },
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
  } catch (error: any) {
    console.error('[Proofreading Documents] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

