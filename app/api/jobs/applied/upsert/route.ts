import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/jobs/applied/upsert
 * 
 * Creates or updates an applied job for the authenticated user in the database.
 * Uses upsert based on (user_id, job_key) to prevent duplicates.
 * 
 * Request body:
 * - jobKey: string (required) - Unique identifier for the job
 * - source?: string - Job source (e.g., 'Adzuna', 'Reed')
 * - jobTitle?: string - Job title
 * - company?: string - Company name
 * - location?: string - Job location
 * - url?: string - Job URL
 * - data?: object - Additional job data (stored as JSONB)
 * 
 * Response:
 * - { ok: true, appliedJob: {...} } on success
 * - { ok: false, error: string } on error
 * - 401 if not authenticated
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[AppliedJobs] POST /api/jobs/applied/upsert - Starting request')
    
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
      console.error('[AppliedJobs] POST /api/jobs/applied/upsert - Auth error:', authError)
      return NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    console.log('[AppliedJobs] POST /api/jobs/applied/upsert - User authenticated:', user.id)

    // Parse request body
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('[AppliedJobs] POST /api/jobs/applied/upsert - JSON parse error:', parseError)
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate required fields
    const { jobKey, source, jobTitle, company, location, url, data } = body

    if (!jobKey) {
      console.error('[AppliedJobs] POST /api/jobs/applied/upsert - Missing jobKey')
      return NextResponse.json(
        { ok: false, error: 'Missing required field: jobKey' },
        { status: 400 }
      )
    }

    console.log('[AppliedJobs] POST /api/jobs/applied/upsert - Upserting job:', {
      jobKey,
      jobTitle,
      company,
      source,
    })

    // Prepare the data for upsert
    const appliedJobData: any = {
      user_id: user.id,
      job_key: jobKey,
      data: data || {},
    }

    // Add optional fields if provided
    if (source !== undefined) appliedJobData.source = source
    if (jobTitle !== undefined) appliedJobData.job_title = jobTitle
    if (company !== undefined) appliedJobData.company = company
    if (location !== undefined) appliedJobData.location = location
    if (url !== undefined) appliedJobData.url = url

    // Upsert using onConflict on the unique index (user_id, job_key)
    const { data: appliedJob, error: upsertError } = await supabase
      .from('applied_jobs')
      .upsert(
        appliedJobData,
        {
          onConflict: 'user_id,job_key',
        }
      )
      .select()
      .single()

    if (upsertError) {
      console.error('[AppliedJobs] POST /api/jobs/applied/upsert - Supabase error:', upsertError)
      return NextResponse.json(
        {
          ok: false,
          error: upsertError.message || 'Failed to save applied job to database',
          code: upsertError.code || null,
          details: upsertError.details || null,
          hint: upsertError.hint || null,
        },
        { status: 500 }
      )
    }

    if (!appliedJob) {
      console.error('[AppliedJobs] POST /api/jobs/applied/upsert - Upsert succeeded but no data returned')
      return NextResponse.json(
        { ok: false, error: 'Failed to save applied job: No data returned' },
        { status: 500 }
      )
    }

    console.log('[AppliedJobs] POST /api/jobs/applied/upsert - Successfully saved applied job:', appliedJob.id)

    return NextResponse.json({
      ok: true,
      appliedJob,
    })
  } catch (error: any) {
    // Catch-all for unexpected errors
    console.error('[AppliedJobs] POST /api/jobs/applied/upsert - Unexpected error:', error)
    console.error('[AppliedJobs] POST /api/jobs/applied/upsert - Error stack:', error.stack)
    
    return NextResponse.json(
      {
        ok: false,
        error: error.message || 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

