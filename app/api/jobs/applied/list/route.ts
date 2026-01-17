import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/jobs/applied/list
 * 
 * Returns all applied jobs for the authenticated user, ordered by applied_at desc (limit 50).
 * 
 * Response:
 * - { ok: true, jobs: [...] } on success
 * - { ok: false, error: string } on error
 * - 401 if not authenticated
 */
export async function GET(req: NextRequest) {
  try {
    console.log('[AppliedJobs] GET /api/jobs/applied/list - Starting request')
    
    // Create Supabase client with route handler (uses cookies for auth)
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
            // The `setAll` method was called from a Route Handler.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    })

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('[AppliedJobs] GET /api/jobs/applied/list - Auth error:', authError?.message || 'No user')
      return NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('[AppliedJobs] GET /api/jobs/applied/list - User authenticated:', user.id)

    // Query applied jobs for this user, ordered by applied_at desc, limit 50
    const { data: appliedJobs, error: queryError } = await supabase
      .from('applied_jobs')
      .select('*')
      .eq('user_id', user.id)
      .order('applied_at', { ascending: false })
      .limit(50)

    if (queryError) {
      console.error('[AppliedJobs] GET /api/jobs/applied/list - Database error:', queryError)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch applied jobs from database' },
        { status: 500 }
      )
    }

    console.log('[AppliedJobs] GET /api/jobs/applied/list - Found', appliedJobs?.length || 0, 'applied jobs')

    return NextResponse.json({
      ok: true,
      jobs: appliedJobs || [],
    })
  } catch (error) {
    console.error('[AppliedJobs] GET /api/jobs/applied/list - Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

