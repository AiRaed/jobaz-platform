import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/proofreading/issues/apply
 * 
 * Applies an issue fix to the document.
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

    // Fetch issue
    const { data: issue, error: issueError } = await supabase
      .from('proofreading_issues')
      .select('*')
      .eq('id', issueId)
      .eq('user_id', user.id)
      .single()

    if (issueError || !issue) {
      return NextResponse.json(
        { ok: false, error: 'Issue not found' },
        { status: 404 }
      )
    }

    if (issue.status !== 'open') {
      return NextResponse.json(
        { ok: false, error: 'Issue has already been processed' },
        { status: 400 }
      )
    }

    // Fetch document
    const { data: document, error: docError } = await supabase
      .from('proofreading_documents')
      .select('*')
      .eq('id', issue.document_id)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      return NextResponse.json(
        { ok: false, error: 'Document not found' },
        { status: 404 }
      )
    }

    // Apply fix to content
    let content = document.content || ''
    const { start_index, end_index, original, suggestion } = issue

    // Validate original text matches
    const actualText = content.substring(start_index, end_index)
    if (!actualText.includes(original) && !original.includes(actualText)) {
      // Try to find text nearby
      const searchStart = Math.max(0, start_index - 50)
      const searchEnd = Math.min(content.length, end_index + 50)
      const foundIndex = content.indexOf(original, searchStart)
      
      if (foundIndex !== -1 && foundIndex < searchEnd) {
        // Use found position
        const before = content.substring(0, foundIndex)
        const after = content.substring(foundIndex + original.length)
        content = before + suggestion + after
      } else {
        // Fallback: use original positions anyway
        const before = content.substring(0, start_index)
        const after = content.substring(end_index)
        content = before + suggestion + after
      }
    } else {
      // Direct replacement
      const before = content.substring(0, start_index)
      const after = content.substring(end_index)
      content = before + suggestion + after
    }

    // Recalculate counts
    const charCount = content.length
    const wordCount = content.trim().split(/\s+/).filter(w => w.length > 0).length
    const pageCount = Math.max(1, Math.ceil(charCount / document.page_size))

    // Update document
    const { data: updatedDocument, error: updateError } = await supabase
      .from('proofreading_documents')
      .update({
        content,
        word_count: wordCount,
        char_count: charCount,
        page_count: pageCount,
      })
      .eq('id', document.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      console.error('[Proofreading Issues Apply] Error updating document:', updateError)
      return NextResponse.json(
        { ok: false, error: 'Failed to update document' },
        { status: 500 }
      )
    }

    // Update issue status
    await supabase
      .from('proofreading_issues')
      .update({ status: 'applied' })
      .eq('id', issueId)
      .eq('user_id', user.id)

    // Update other issues' positions if they were after this fix
    // Note: For simplicity, we'll reload issues on the client side after applying
    // Position updates can be handled by re-running analysis if needed

    return NextResponse.json({ ok: true, document: updatedDocument })
  } catch (error: any) {
    console.error('[Proofreading Issues Apply] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to apply issue' },
      { status: 500 }
    )
  }
}

