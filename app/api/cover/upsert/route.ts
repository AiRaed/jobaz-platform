import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/cover/upsert
 * 
 * Creates or updates a cover letter for the authenticated user in the database.
 * Uses manual upsert logic: first check if row exists, then update or insert.
 * 
 * Request body:
 * - title?: string (optional, defaults to 'Cover Letter')
 * - job_key?: string (optional, job ID this cover letter is for)
 * - data: object (Cover letter data object)
 * 
 * Response:
 * - { ok: true, coverId: string, updatedAt: string } on success
 * - { ok: false, error, code?, details?, hint? } on error
 * - 401 if not authenticated
 */
export async function POST(req: NextRequest) {
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
      console.error('[COVER UPSERT] Auth error:', authError)
      return NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    let body
    try {
      body = await req.json()
    } catch (parseError) {
      console.error('[COVER UPSERT] JSON parse error:', parseError)
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Extract title, job_key, and data from request body
    const title = body.title ?? 'Cover Letter'
    const job_key = body.job_key ?? null
    const data = body.data

    if (!data) {
      console.error('[COVER UPSERT] Missing data in request body')
      return NextResponse.json(
        { ok: false, error: 'Missing required field: data' },
        { status: 400 }
      )
    }

    // First query: check if row exists for this user
    const { data: existingRows, error: queryError } = await supabase
      .from('cover_letters')
      .select('id')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (queryError) {
      console.error('[COVER UPSERT] Query error:', queryError)
      return NextResponse.json(
        {
          ok: false,
          error: queryError.message || 'Failed to query cover letters',
          code: queryError.code || null,
          details: queryError.details || null,
          hint: queryError.hint || null,
        },
        { status: 500 }
      )
    }

    let result
    let coverId: string
    let updatedAt: string

    if (existingRows && existingRows.length > 0) {
      // Row exists: UPDATE
      const existingId = existingRows[0].id
      console.log('[UPSERT] updating existing cover letter', existingId)
      
      const { data: updatedRow, error: updateError } = await supabase
        .from('cover_letters')
        .update({
          title: title,
          job_key: job_key,
          data: data,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('[COVER UPSERT] Update error:', updateError)
        return NextResponse.json(
          {
            ok: false,
            error: updateError.message || 'Failed to update cover letter',
            code: updateError.code || null,
            details: updateError.details || null,
            hint: updateError.hint || null,
          },
          { status: 500 }
        )
      }

      if (!updatedRow) {
        console.error('[COVER UPSERT] Update succeeded but no data returned')
        return NextResponse.json(
          { ok: false, error: 'Failed to update cover letter: No data returned' },
          { status: 500 }
        )
      }

      result = updatedRow
      coverId = updatedRow.id
      updatedAt = updatedRow.updated_at || new Date().toISOString()
      console.log('[UPSERT] updated_at', updatedAt)
    } else {
      // No row exists: INSERT
      const { data: insertedRow, error: insertError } = await supabase
        .from('cover_letters')
        .insert({
          user_id: user.id,
          title: title,
          job_key: job_key,
          data: data,
        })
        .select()
        .single()

      if (insertError) {
        console.error('[COVER UPSERT] Insert error:', insertError)
        return NextResponse.json(
          {
            ok: false,
            error: insertError.message || 'Failed to insert cover letter',
            code: insertError.code || null,
            details: insertError.details || null,
            hint: insertError.hint || null,
          },
          { status: 500 }
        )
      }

      if (!insertedRow) {
        console.error('[COVER UPSERT] Insert succeeded but no data returned')
        return NextResponse.json(
          { ok: false, error: 'Failed to insert cover letter: No data returned' },
          { status: 500 }
        )
      }

      result = insertedRow
      coverId = insertedRow.id
      updatedAt = insertedRow.updated_at || new Date().toISOString()
    }

    console.log('[COVER UPSERT]', user.id, result)

    return NextResponse.json({
      ok: true,
      coverId: coverId,
      updatedAt: updatedAt,
    })
  } catch (error: any) {
    // Catch-all for unexpected errors
    console.error('[COVER UPSERT] Unexpected error:', error)
    console.error('[COVER UPSERT] Error stack:', error.stack)
    
    return NextResponse.json(
      {
        ok: false,
        error: error.message || 'An unexpected error occurred',
        code: null,
        details: null,
        hint: null,
      },
      { status: 500 }
    )
  }
}

