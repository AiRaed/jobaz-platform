import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * DELETE /api/career-plan/reset
 * Removes the authenticated user's career assessment/plan rows.
 * Does not touch saved CVs.
 */
export async function DELETE(_req: NextRequest) {
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
            // ignore
          }
        },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      // Guest / unauthenticated — client clears local caches only
      return NextResponse.json({ ok: true, deleted: 0, guest: true })
    }

    const { data, error } = await supabase
      .from('ai_career_assessments')
      .delete()
      .eq('user_id', user.id)
      .select('id')

    if (error) {
      console.error('[Career Plan Reset]', error)
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, deleted: data?.length ?? 0 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reset career plan'
    return NextResponse.json({ ok: false, error: message }, { status: 500 })
  }
}
