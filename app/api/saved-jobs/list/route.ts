import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/saved-jobs/list
 * 
 * Returns all saved jobs for the authenticated user.
 * 
 * Response:
 * - { ok: true, items: [{ job_key, job, created_at }] }
 * - { ok: false, error: string } on error
 * - 401 if not authenticated
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[SavedJobs] GET /api/saved-jobs/list - Starting request')
    
    // Create Supabase client with route handler (uses cookies for auth)
    const cookieStore = await cookies()
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
            // The `setAll` method was called from a Route Handler.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    })

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('[SavedJobs] GET /api/saved-jobs/list - Auth error:', authError?.message || 'No user')
      return NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('[SavedJobs] GET /api/saved-jobs/list - User authenticated:', user.id)

    // Query saved jobs for this user
    const { data: savedJobs, error: queryError } = await supabase
      .from('saved_jobs')
      .select('job_key, job, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (queryError) {
      console.error('[SavedJobs] GET /api/saved-jobs/list - Database error:', queryError)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch saved jobs from database' },
        { status: 500 }
      )
    }

    console.log('[SavedJobs] GET /api/saved-jobs/list - Found', savedJobs?.length || 0, 'saved jobs')

    return NextResponse.json({
      ok: true,
      items: savedJobs || [],
    })
  } catch (error) {
    console.error('[SavedJobs] GET /api/saved-jobs/list - Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

