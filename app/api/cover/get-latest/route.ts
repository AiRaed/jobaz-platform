import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/cover/get-latest
 * 
 * Fetches the latest saved cover letter for the authenticated user from the database.
 * 
 * Response:
 * - { ok: true, hasCover: boolean, cover: {...} | null }
 * - { ok: false, error: string } on error
 * - 401 if not authenticated
 */
export async function GET(req: NextRequest) {
  try {
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
      return NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Query the latest cover letter for this user (order by updated_at desc, limit 1)
    const { data: coverRows, error: queryError } = await supabase
      .from('cover_letters')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (queryError) {
      console.error('[COVER GET] Database error:', queryError)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch cover letter from database' },
        { status: 500 }
      )
    }

    console.log('[COVER GET]', coverRows?.length || 0)

    // If no cover letter found, return hasCover=false
    if (!coverRows || coverRows.length === 0) {
      return NextResponse.json({
        ok: true,
        hasCover: false,
        cover: null,
      })
    }

    const coverRow = coverRows[0]

    // The cover letter data is stored in the 'data' column as a JSONB object
    const coverData = coverRow.data || {}

    return NextResponse.json({
      ok: true,
      hasCover: true,
      cover: coverData,
      meta: {
        id: coverRow.id,
        title: coverRow.title,
        job_key: coverRow.job_key,
        updated_at: coverRow.updated_at,
        created_at: coverRow.created_at,
      },
    })
  } catch (error: any) {
    console.error('[COVER GET] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch cover letter' },
      { status: 500 }
    )
  }
}

