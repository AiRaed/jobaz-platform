import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/email/messages?project_id=xxx
 * Fetches the latest message for a project.
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

    const { data: messages, error } = await supabase
      .from('email_messages')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('[Email Messages] Fetch error:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch message' },
        { status: 500 }
      )
    }

    const message = messages && messages.length > 0 ? messages[0] : null

    return NextResponse.json({ ok: true, message })
  } catch (error: any) {
    console.error('[Email Messages] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/email/messages
 * Creates or updates an email message.
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

    const { project_id, subject, greeting, body: bodyText, closing, signature, source, meta } = body

    if (!project_id) {
      return NextResponse.json(
        { ok: false, error: 'project_id is required' },
        { status: 400 }
      )
    }

    // Verify project belongs to user
    const { data: project, error: projectError } = await supabase
      .from('email_projects')
      .select('id')
      .eq('id', project_id)
      .eq('user_id', user.id)
      .single()

    if (projectError || !project) {
      return NextResponse.json(
        { ok: false, error: 'Project not found or access denied' },
        { status: 404 }
      )
    }

    // Build full text from parts
    const fullText = [
      subject || '',
      '',
      greeting || '',
      bodyText || '',
      closing || '',
      signature || '',
    ].filter(Boolean).join('\n\n')

    // Check if message exists, update or create
    const { data: existing } = await supabase
      .from('email_messages')
      .select('id')
      .eq('project_id', project_id)
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .single()

    let message
    if (existing) {
      // Update existing message
      const { data, error } = await supabase
        .from('email_messages')
        .update({
          subject: subject || '',
          greeting: greeting || '',
          body: bodyText || '',
          closing: closing || '',
          signature: signature || '',
          full_text: fullText,
          source: source || 'pasted',
          meta: meta || {},
        })
        .eq('id', existing.id)
        .select()
        .single()

      if (error) {
        console.error('[Email Messages] Update error:', error)
        return NextResponse.json(
          { ok: false, error: 'Failed to update message' },
          { status: 500 }
        )
      }
      message = data
    } else {
      // Create new message
      const { data, error } = await supabase
        .from('email_messages')
        .insert({
          project_id,
          user_id: user.id,
          subject: subject || '',
          greeting: greeting || '',
          body: bodyText || '',
          closing: closing || '',
          signature: signature || '',
          full_text: fullText,
          source: source || 'pasted',
          meta: meta || {},
        })
        .select()
        .single()

      if (error) {
        console.error('[Email Messages] Create error:', error)
        return NextResponse.json(
          { ok: false, error: 'Failed to create message' },
          { status: 500 }
        )
      }
      message = data
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

