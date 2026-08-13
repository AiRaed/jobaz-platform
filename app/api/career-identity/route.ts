import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  loadCareerIdentity,
  sanitizeCareerIdentityPatch,
  tableExists,
  upsertCareerIdentity,
} from '@/lib/career-identity'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

function getUserClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
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
    }
  )
}

function getAdmin() {
  try {
    return createServerSupabaseClient()
  } catch {
    return null
  }
}

/** GET — load private career identity for current user */
export async function GET() {
  const userClient = getUserClient()
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const admin = getAdmin()
  if (!admin) {
    return NextResponse.json({
      ok: true,
      identity: null,
      note: 'Career identity storage not configured',
    })
  }

  const { identity, tableMissing } = await loadCareerIdentity(admin, user.id)
  return NextResponse.json({
    ok: true,
    identity,
    email: user.email ?? null,
    note: tableMissing
      ? 'user_career_identity: Not tracked yet — run migration 20250729120000_user_career_identity.sql'
      : null,
  })
}

/** POST — upsert career identity */
export async function POST(req: NextRequest) {
  const userClient = getUserClient()
  const {
    data: { user },
  } = await userClient.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const admin = getAdmin()
  if (!admin) {
    return NextResponse.json({ error: 'Storage not configured' }, { status: 503 })
  }
  if (!(await tableExists(admin, 'user_career_identity'))) {
    return NextResponse.json(
      {
        error:
          'user_career_identity missing — run migration 20250729120000_user_career_identity.sql',
      },
      { status: 503 }
    )
  }

  let body: Record<string, unknown>
  try {
    body = (await req.json()) as Record<string, unknown>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  try {
    const identity = sanitizeCareerIdentityPatch(body, user.id)
    const previousOptIn = (await loadCareerIdentity(admin, user.id)).identity
      .message_reminders_opt_in
    const saved = await upsertCareerIdentity(admin, identity)

    // Best-effort sync to existing profiles / personal_profiles (optional)
    try {
      const { data: profile } = await admin
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()
      if (profile?.id) {
        await admin
          .from('profiles')
          .update({
            location: saved.preferred_location,
            headline: saved.target_role,
            bio: saved.short_bio,
            visibility: 'private',
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)
          .eq('user_id', user.id)

        await admin.from('personal_profiles').upsert(
          {
            profile_id: profile.id,
            current_focus: saved.main_goal || saved.preferred_route || null,
          },
          { onConflict: 'profile_id' }
        )

        if (saved.skills.length) {
          await admin.from('profile_skills').delete().eq('profile_id', profile.id)
          await admin.from('profile_skills').insert(
            saved.skills.map((skill_name) => ({
              profile_id: profile.id,
              skill_name,
              strength_score: 50,
            }))
          )
        }
      }
    } catch {
      // profile sync optional — never sync mobile/consent to public profiles
    }

    return NextResponse.json({
      ok: true,
      identity: saved,
      message_reminders_changed:
        previousOptIn !== saved.message_reminders_opt_in
          ? saved.message_reminders_opt_in
            ? 'enabled'
            : 'disabled'
          : null,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Save failed'
    const isValidation = /mobile number|digits/i.test(message)
    return NextResponse.json({ error: message }, { status: isValidation ? 400 : 500 })
  }
}
