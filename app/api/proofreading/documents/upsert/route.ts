import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/proofreading/documents/upsert
 * 
 * Creates or updates a document for a project.
 * Uses upsert with onConflict: 'project_id' to ensure one document per project.
 * 
 * Request body:
 * - projectId: string (required)
 * - documentId?: string (optional, if updating existing)
 * - content: string (required)
 * - title?: string (optional)
 * - analysis?: object (optional)
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
    const { projectId, documentId, content, title, analysis } = body

    if (!projectId || content === undefined) {
      return NextResponse.json(
        { ok: false, error: 'projectId and content are required' },
        { status: 400 }
      )
    }

    // Calculate word count and estimated pages
    const wordCount = content.trim().split(/\s+/).filter(Boolean).length
    const estimatedPages = Math.max(1, Math.ceil(wordCount / 250))

    const documentData: {
      project_id: string
      user_id: string
      content: string
      title?: string
      analysis?: any
      word_count?: number
      estimated_pages?: number
    } = {
      project_id: projectId,
      user_id: user.id,
      content: content || '',
      word_count: wordCount,
      estimated_pages: estimatedPages,
    }

    if (title !== undefined) documentData.title = title
    if (analysis !== undefined) documentData.analysis = analysis

    // Check if document exists
    let existingDoc
    if (documentId) {
      const { data, error } = await supabase
        .from('proofreading_documents')
        .select('id')
        .eq('id', documentId)
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (error) {
        console.error('[Proofreading Documents] Error checking document:', error)
      } else {
        existingDoc = data
      }
    }

    if (!existingDoc && !documentId) {
      // Check if document exists for this project
      const { data: projectDoc } = await supabase
        .from('proofreading_documents')
        .select('id')
        .eq('project_id', projectId)
        .eq('user_id', user.id)
        .maybeSingle()
      
      if (projectDoc) {
        existingDoc = projectDoc
      }
    }

    let result
    if (existingDoc) {
      // Update existing document
      console.log('[Proofreading Documents Upsert] Updating existing document:', {
        documentId: existingDoc.id,
        projectId,
        contentLength: content?.length || 0
      })
      
      const { data: document, error } = await supabase
        .from('proofreading_documents')
        .update(documentData)
        .eq('id', existingDoc.id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) {
        console.error('[Proofreading Documents] Error updating document:', error)
        return NextResponse.json(
          { ok: false, error: 'Failed to update document' },
          { status: 500 }
        )
      }

      result = document
      console.log('[Proofreading Documents Upsert] Update successful:', { documentId: result.id })
    } else {
      // Insert new document
      console.log('[Proofreading Documents Upsert] Creating new document:', {
        projectId,
        contentLength: content?.length || 0,
        autoCreate: !documentId
      })
      
      const { data: document, error } = await supabase
        .from('proofreading_documents')
        .insert(documentData)
        .select()
        .single()

      if (error) {
        console.error('[Proofreading Documents] Error creating document:', error)
        return NextResponse.json(
          { ok: false, error: 'Failed to create document' },
          { status: 500 }
        )
      }

      result = document
      console.log('[Proofreading Documents Upsert] Create successful:', { documentId: result.id })
    }

    return NextResponse.json({ ok: true, doc: result })
  } catch (error: any) {
    console.error('[Proofreading Documents] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
