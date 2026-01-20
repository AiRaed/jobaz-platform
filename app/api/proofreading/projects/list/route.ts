import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/proofreading/projects/list
 * 
 * Returns user's projects ordered by updated_at DESC
 */
export async function GET(req: NextRequest) {
  const routeName = '[Proofreading Projects List]'
  
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

    const { data: projects, error } = await supabase
      .from('proofreading_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error(`${routeName} Database error:`, error)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    console.log(`${routeName} Success: ${projects?.length || 0} projects found`)

    return NextResponse.json({ 
      ok: true, 
      projects: projects || [] 
    })
  } catch (error: any) {
    console.error(`${routeName} Unexpected error:`, error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
