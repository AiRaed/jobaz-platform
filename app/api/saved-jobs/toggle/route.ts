import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/saved-jobs/toggle
 * 
 * Toggles a saved job for the authenticated user.
 * If the job is already saved, it will be removed.
 * If the job is not saved, it will be added.
 * 
 * Request body:
 * - job_key: string (required) - Unique identifier for the job
 * - job: any (required) - Full job payload to store
 * 
 * Response:
 * - { ok: true, saved: boolean } - saved=true if added, saved=false if removed
 * - { ok: false, error: string } on error
 * - 401 if not authenticated
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[SavedJobs] POST /api/saved-jobs/toggle - Starting request')
    
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
      console.log('[SavedJobs] POST /api/saved-jobs/toggle - Auth error:', authError?.message || 'No user')
      return NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('[SavedJobs] POST /api/saved-jobs/toggle - User authenticated:', user.id)

    // Parse request body
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('[SavedJobs] POST /api/saved-jobs/toggle - JSON parse error:', parseError)
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { job_key, job } = body

    if (!job_key || typeof job_key !== 'string') {
      return NextResponse.json(
        { ok: false, error: 'job_key is required and must be a string' },
        { status: 400 }
      )
    }

    if (!job || typeof job !== 'object') {
      return NextResponse.json(
        { ok: false, error: 'job is required and must be an object' },
        { status: 400 }
      )
    }

    console.log('[SavedJobs] POST /api/saved-jobs/toggle - Toggling job_key:', job_key)

    // Check if job is already saved
    const { data: existing, error: checkError } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('user_id', user.id)
      .eq('job_key', job_key)
      .maybeSingle()

    if (checkError) {
      console.error('[SavedJobs] POST /api/saved-jobs/toggle - Database check error:', checkError)
      return NextResponse.json(
        { ok: false, error: 'Failed to check saved job status' },
        { status: 500 }
      )
    }

    if (existing) {
      // Job is saved, delete it
      console.log('[SavedJobs] POST /api/saved-jobs/toggle - Job exists, deleting')
      const { error: deleteError } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', user.id)
        .eq('job_key', job_key)

      if (deleteError) {
        console.error('[SavedJobs] POST /api/saved-jobs/toggle - Delete error:', deleteError)
        return NextResponse.json(
          { ok: false, error: 'Failed to remove saved job' },
          { status: 500 }
        )
      }

      console.log('[SavedJobs] POST /api/saved-jobs/toggle - Job removed successfully')
      return NextResponse.json({
        ok: true,
        saved: false,
      })
    } else {
      // Job is not saved, insert it
      console.log('[SavedJobs] POST /api/saved-jobs/toggle - Job not found, inserting')
      const { error: insertError } = await supabase
        .from('saved_jobs')
        .insert({
          user_id: user.id,
          job_key: job_key,
          job: job,
        })

      if (insertError) {
        console.error('[SavedJobs] POST /api/saved-jobs/toggle - Insert error:', insertError)
        return NextResponse.json(
          { ok: false, error: 'Failed to save job' },
          { status: 500 }
        )
      }

      console.log('[SavedJobs] POST /api/saved-jobs/toggle - Job saved successfully')
      return NextResponse.json({
        ok: true,
        saved: true,
      })
    }
  } catch (error) {
    console.error('[SavedJobs] POST /api/saved-jobs/toggle - Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

