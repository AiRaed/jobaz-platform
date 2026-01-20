import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * PATCH /api/email/messages/[id]
 * Updates specific parts of an email message.
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

    let body
    try {
      body = await req.json()
    } catch (parseError: any) {
      console.error('[Email Messages] JSON parse error:', parseError)
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { subject, greeting, body: bodyText, closing, signature, source, meta } = body

    // Build full text from parts
    const fullText = [
      subject || '',
      '',
      greeting || '',
      bodyText || '',
      closing || '',
      signature || '',
    ].filter(Boolean).join('\n\n')

    // Build update object with only provided fields
    const updateData: any = {}
    if (subject !== undefined) updateData.subject = subject || ''
    if (greeting !== undefined) updateData.greeting = greeting || ''
    if (bodyText !== undefined) updateData.body = bodyText || ''
    if (closing !== undefined) updateData.closing = closing || ''
    if (signature !== undefined) updateData.signature = signature || ''
    if (source !== undefined) updateData.source = source || 'pasted'
    if (meta !== undefined) updateData.meta = meta || {}
    updateData.full_text = fullText

    const { data: message, error } = await supabase
      .from('email_messages')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('[Email Messages] Update error:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to update message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, message })
  } catch (error: any) {
    console.error('[Email Messages] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

