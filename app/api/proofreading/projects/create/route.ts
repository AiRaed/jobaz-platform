import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/proofreading/projects/create
 * 
 * Creates a new project for the authenticated user.
 * 
 * Request body:
 * - title: string (required, min 2 chars)
 * - category: string (optional, defaults to 'General')
 */
export async function POST(req: NextRequest) {
  const routeName = '[Proofreading Projects Create]'
  
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
      console.log(`${routeName} Auth check: hasUser=false`)
      return NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log(`${routeName} Auth check: hasUser=true, userId=${user.id}`)

    const body = await req.json()
    const { title, category = 'General' } = body

    if (!title || typeof title !== 'string' || title.trim().length < 2) {
      return NextResponse.json(
        { ok: false, error: 'Title must be at least 2 characters' },
        { status: 400 }
      )
    }

    const { data: project, error } = await supabase
      .from('proofreading_projects')
      .insert({
        user_id: user.id,
        title: title.trim(),
        category: category || 'General',
      })
      .select()
      .single()

    if (error) {
      console.error(`${routeName} Database error:`, error)
      return NextResponse.json(
        { ok: false, error: 'Failed to create project' },
        { status: 500 }
      )
    }

    console.log(`${routeName} Success: projectId=${project.id}, status=201`)

    return NextResponse.json({ 
      ok: true, 
      project 
    }, { status: 201 })
  } catch (error: any) {
    console.error(`${routeName} Unexpected error:`, error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
