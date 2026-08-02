import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  emptyPrefs,
  mapPrefsRow,
  syncLegacyMarketingFlag,
  tableExists,
} from '@/lib/email-campaigns'
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

/** GET — current user's preferences */
export async function GET() {
  const supabase = getUserClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let admin
  try {
    admin = createServerSupabaseClient()
  } catch {
    return NextResponse.json({
      ok: true,
      preferences: emptyPrefs(user.email, user.id),
      note: 'Preferences storage unavailable',
    })
  }

  if (!(await tableExists(admin, 'user_email_preferences'))) {
    return NextResponse.json({
      ok: true,
      preferences: emptyPrefs(user.email, user.id),
      note: 'user_email_preferences: Not tracked yet',
    })
  }

  const { data } = await admin
    .from('user_email_preferences')
    .select('*')
    .or(`user_id.eq.${user.id},email.eq.${user.email.toLowerCase()}`)
    .limit(1)
    .maybeSingle()

  // Apply signup marketing opt-in from user metadata once (email confirmation flow)
  const metaOptIn = Boolean(
    (user.user_metadata as Record<string, unknown> | undefined)?.marketing_opt_in
  )
  if (!data && metaOptIn) {
    const patch = {
      user_id: user.id,
      email: user.email.toLowerCase(),
      marketing_consent: true,
      job_alerts: true,
      course_alerts: true,
      local_opportunity_alerts: true,
      career_tips: true,
      product_updates: true,
      plan_reminders: true,
      unsubscribed_all: false,
      consent_source: 'signup',
      consented_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
    await admin.from('user_email_preferences').insert(patch)
    await syncLegacyMarketingFlag(admin, user.email, true, user.id)
    return NextResponse.json({ ok: true, preferences: mapPrefsRow(patch as Record<string, unknown>) })
  }

  return NextResponse.json({
    ok: true,
    preferences: data
      ? mapPrefsRow(data as Record<string, unknown>)
      : emptyPrefs(user.email, user.id),
  })
}

/** POST — update preferences / unsubscribe all */
export async function POST(req: NextRequest) {
  const supabase = getUserClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user?.email) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  let admin
  try {
    admin = createServerSupabaseClient()
  } catch {
    return NextResponse.json({ error: 'Preferences storage unavailable' }, { status: 503 })
  }

  if (!(await tableExists(admin, 'user_email_preferences'))) {
    return NextResponse.json(
      { error: 'user_email_preferences missing — run migration' },
      { status: 503 }
    )
  }

  const body = (await req.json()) as Record<string, unknown>
  const unsubscribeAll = Boolean(body.unsubscribed_all || body.unsubscribe_all)

  const patch = {
    user_id: user.id,
    email: user.email.toLowerCase(),
    marketing_consent: unsubscribeAll ? false : Boolean(body.marketing_consent),
    job_alerts: unsubscribeAll ? false : Boolean(body.job_alerts),
    course_alerts: unsubscribeAll ? false : Boolean(body.course_alerts),
    local_opportunity_alerts: unsubscribeAll ? false : Boolean(body.local_opportunity_alerts),
    career_tips: unsubscribeAll ? false : Boolean(body.career_tips),
    plan_reminders: unsubscribeAll ? false : body.plan_reminders !== false,
    product_updates: unsubscribeAll ? false : Boolean(body.product_updates),
    unsubscribed_all: unsubscribeAll,
    consent_source: unsubscribeAll ? 'unsubscribe_page' : String(body.consent_source || 'preferences_page'),
    consented_at:
      !unsubscribeAll && Boolean(body.marketing_consent) ? new Date().toISOString() : null,
    unsubscribed_at: unsubscribeAll ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }

  const { data: existing } = await admin
    .from('user_email_preferences')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    await admin.from('user_email_preferences').update(patch).eq('user_id', user.id)
  } else {
    await admin.from('user_email_preferences').insert(patch)
  }

  const marketingAllowed =
    !patch.unsubscribed_all &&
    (patch.marketing_consent ||
      patch.job_alerts ||
      patch.course_alerts ||
      patch.local_opportunity_alerts ||
      patch.career_tips ||
      patch.product_updates)

  await syncLegacyMarketingFlag(admin, user.email, marketingAllowed, user.id)

  return NextResponse.json({ ok: true, preferences: mapPrefsRow(patch as Record<string, unknown>) })
}
