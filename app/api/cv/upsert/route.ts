import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/cv/upsert
 * 
 * Creates or updates a CV for the authenticated user in the database.
 * Uses upsert with onConflict: 'user_id' to ensure one CV per user.
 * 
 * Request body:
 * - title?: string (optional, defaults to 'My CV')
 * - data: object (CV data object)
 * 
 * Response:
 * - { ok: true, cv: {...} } on success
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
      console.error('[CV Upsert] Auth error:', authError)
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
      console.error('[CV Upsert] JSON parse error:', parseError)
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Log request body keys and data preview
    const bodyKeys = Object.keys(body || {})
    console.log('[CV Upsert] Request body keys:', bodyKeys)
    console.log('[CV Upsert] Authenticated user id:', user.id)

    // Extract title and data from request body
    const title = body.title ?? 'My CV'
    const data = body.data

    if (!data) {
      console.error('[CV Upsert] Missing data in request body')
      return NextResponse.json(
        { ok: false, error: 'Missing required field: data' },
        { status: 400 }
      )
    }

    // Log received data details
    const dataKeys = Object.keys(data || {})
    const summaryLength = data?.summary?.length || 0
    console.log('[CV Upsert] Received data keys:', dataKeys)
    console.log('[CV Upsert] Summary length:', summaryLength)
    console.log('[CV Upsert] Skills count:', data?.skills?.length || 0)
    console.log('[CV Upsert] Experience count:', data?.experience?.length || 0)

    // First query: check if row exists for this user
    const { data: existingRows, error: queryError } = await supabase
      .from('cvs')
      .select('id')
      .eq('user_id', user.id)
      .limit(1)

    if (queryError) {
      console.error('[CV Upsert] Query error:', queryError)
      return NextResponse.json(
        {
          ok: false,
          error: queryError.message || 'Failed to query CVs',
          code: queryError.code || null,
          details: queryError.details || null,
          hint: queryError.hint || null,
        },
        { status: 500 }
      )
    }

    let cvRow

    if (existingRows && existingRows.length > 0) {
      // Row exists: UPDATE
      const existingId = existingRows[0].id
      console.log('[UPSERT] updating existing CV', existingId)

      const { data: updatedRow, error: updateError } = await supabase
        .from('cvs')
        .update({
          title: title,
          data: data,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .select()
        .single()

      if (updateError) {
        console.error('[CV Upsert] Update error:', updateError)
        return NextResponse.json(
          {
            ok: false,
            error: updateError.message || 'Failed to update CV',
            code: updateError.code || null,
            details: updateError.details || null,
            hint: updateError.hint || null,
          },
          { status: 500 }
        )
      }

      if (!updatedRow) {
        console.error('[CV Upsert] Update succeeded but no data returned')
        return NextResponse.json(
          { ok: false, error: 'Failed to update CV: No data returned' },
          { status: 500 }
        )
      }

      cvRow = updatedRow
      console.log('[UPSERT] updated_at', updatedRow.updated_at)
    } else {
      // No row exists: INSERT
      const { data: insertedRow, error: insertError } = await supabase
        .from('cvs')
        .insert({
          user_id: user.id,
          title: title,
          data: data,
        })
        .select()
        .single()

      if (insertError) {
        console.error('[CV Upsert] Insert error:', insertError)
        return NextResponse.json(
          {
            ok: false,
            error: insertError.message || 'Failed to insert CV',
            code: insertError.code || null,
            details: insertError.details || null,
            hint: insertError.hint || null,
          },
          { status: 500 }
        )
      }

      if (!insertedRow) {
        console.error('[CV Upsert] Insert succeeded but no data returned')
        return NextResponse.json(
          { ok: false, error: 'Failed to insert CV: No data returned' },
          { status: 500 }
        )
      }

      cvRow = insertedRow
      console.log('[UPSERT] inserted new CV with updated_at', insertedRow.updated_at)
    }

    console.log('[CV Upsert] Successfully saved CV for user:', user.id)

    return NextResponse.json({
      ok: true,
      cv: cvRow,
    })
  } catch (error: any) {
    // Catch-all for unexpected errors
    console.error('[CV Upsert] Unexpected error:', error)
    console.error('[CV Upsert] Error stack:', error.stack)
    
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

