import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

/**
 * POST /api/account/delete
 * 
 * Permanently deletes a user's account and all associated data.
 * 
 * Steps:
 * 1. Verify user authentication using session cookies
 * 2. Delete all user data from database tables (using service role key)
 * 3. Delete the auth user (using service role key)
 * 
 * Response:
 * - { ok: true } on success
 * - { ok: false, error: string } on error
 * - 401 if not authenticated
 */
export async function POST(req: NextRequest) {
  try {
    console.log('[Delete Account] Starting account deletion process')

    // Step 1: Verify user authentication using session cookies
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
      console.log('[Delete Account] Authentication failed:', authError?.message)
      return NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const userId = user.id
    console.log('[Delete Account] User authenticated:', userId)

    // Step 2: Create admin client with service role key for data deletion
    if (!supabaseServiceRoleKey) {
      console.error('[Delete Account] Service role key not configured')
      return NextResponse.json(
        { ok: false, error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log('[Delete Account] Admin client created, starting data deletion')

    // Step 3: Delete all user data from database tables (in order)
    // Tables with ON DELETE CASCADE should be fine, but we'll delete explicitly for clarity

    // Delete from cvs table
    const { error: cvError } = await adminClient
      .from('cvs')
      .delete()
      .eq('user_id', userId)
    
    if (cvError) {
      console.error('[Delete Account] Error deleting CVs:', cvError)
      // Continue even if some deletions fail
    } else {
      console.log('[Delete Account] CVs deleted successfully')
    }

    // Delete from cover_letters table
    const { error: coverError } = await adminClient
      .from('cover_letters')
      .delete()
      .eq('user_id', userId)
    
    if (coverError) {
      console.error('[Delete Account] Error deleting cover letters:', coverError)
    } else {
      console.log('[Delete Account] Cover letters deleted successfully')
    }

    // Delete from saved_jobs table
    const { error: savedJobsError } = await adminClient
      .from('saved_jobs')
      .delete()
      .eq('user_id', userId)
    
    if (savedJobsError) {
      console.error('[Delete Account] Error deleting saved jobs:', savedJobsError)
    } else {
      console.log('[Delete Account] Saved jobs deleted successfully')
    }

    // Delete from applied_jobs table
    const { error: appliedJobsError } = await adminClient
      .from('applied_jobs')
      .delete()
      .eq('user_id', userId)
    
    if (appliedJobsError) {
      console.error('[Delete Account] Error deleting applied jobs:', appliedJobsError)
    } else {
      console.log('[Delete Account] Applied jobs deleted successfully')
    }

    // Delete from interview_training table (if it exists)
    const { error: trainingError } = await adminClient
      .from('interview_training')
      .delete()
      .eq('user_id', userId)
    
    if (trainingError) {
      // Table might not exist, log but don't fail
      console.log('[Delete Account] Interview training deletion (table may not exist):', trainingError.message)
    } else {
      console.log('[Delete Account] Interview training data deleted successfully')
    }

    // Step 4: Delete the auth user (this will also cascade delete related rows)
    console.log('[Delete Account] Deleting auth user:', userId)
    const { error: deleteUserError } = await adminClient.auth.admin.deleteUser(userId)

    if (deleteUserError) {
      console.error('[Delete Account] Error deleting auth user:', deleteUserError)
      return NextResponse.json(
        { ok: false, error: 'Failed to delete user account' },
        { status: 500 }
      )
    }

    console.log('[Delete Account] Account deleted successfully:', userId)

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[Delete Account] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to delete account' },
      { status: 500 }
    )
  }
}
