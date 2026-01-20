import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/email/projects
 * Fetches all email projects for the authenticated user.
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

    const { data: projects, error } = await supabase
      .from('email_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[Email Projects] Error:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, projects: projects || [] })
  } catch (error: any) {
    console.error('[Email Projects] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/email/projects
 * Creates a new email project.
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
      console.error('[Email Projects] JSON parse error:', parseError)
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON in request body', message: parseError?.message || 'Failed to parse request body' },
        { status: 400 }
      )
    }

    const { title, purpose, tone, recipient_type } = body

    // Validate all required fields
    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Title is required and must be a non-empty string', message: 'Title is required' },
        { status: 400 }
      )
    }

    if (!purpose || typeof purpose !== 'string' || !purpose.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Purpose is required and must be a non-empty string', message: 'Purpose is required' },
        { status: 400 }
      )
    }

    if (!tone || typeof tone !== 'string' || !tone.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Tone is required and must be a non-empty string', message: 'Tone is required' },
        { status: 400 }
      )
    }

    if (!recipient_type || typeof recipient_type !== 'string' || !recipient_type.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Recipient type is required and must be a non-empty string', message: 'Recipient type is required' },
        { status: 400 }
      )
    }

    // Prepare insert payload with user_id from server
    const payload = {
      user_id: user.id,
      title: title.trim(),
      purpose: purpose.trim(),
      tone: tone.trim(),
      recipient_type: recipient_type.trim(),
    }

    console.log('[Email Projects] Creating project with payload:', { ...payload, user_id: '[REDACTED]' })

    const { data: project, error } = await supabase
      .from('email_projects')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('[Email Projects] Create error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        payload,
        fullError: error,
      })
      return NextResponse.json(
        { 
          ok: false, 
          error: error.message || 'Failed to create project',
          message: error.message || 'Database error occurred',
          code: error.code || 'UNKNOWN_ERROR',
          details: error.details || null,
          hint: error.hint || null,
        },
        { status: 400 } // Return 400 for database errors, not 500
      )
    }

    return NextResponse.json({ ok: true, project }, { status: 201 })
  } catch (error: any) {
    console.error('[Email Projects] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

