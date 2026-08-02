import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { sanitizeRedirectPath } from '@/lib/auth/redirect'
import { logEvent } from '@/lib/analytics/logEvent'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * Server-side auth callback. Handles Supabase email confirmation and password
 * recovery links: exchanges code for session, sets cookies, redirects with no UI.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const type = searchParams.get('type')
  const errorCode = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  const baseUrl = request.nextUrl.origin

  // Error in query -> redirect to auth with error
  if (errorCode || errorDescription) {
    const authUrl = new URL('/auth', baseUrl)
    authUrl.searchParams.set('error', 'auth_callback_failed')
    return NextResponse.redirect(authUrl)
  }

  // No code -> redirect to auth (e.g. user opened /auth/callback manually)
  if (!code) {
    const authUrl = new URL('/auth', baseUrl)
    authUrl.searchParams.set('verified', '1')
    return NextResponse.redirect(authUrl)
  }

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
          // Ignore in route handler
        }
      },
    },
  })

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    const authUrl = new URL('/auth', baseUrl)
    authUrl.searchParams.set('error', 'auth_callback_failed')
    return NextResponse.redirect(authUrl)
  }

  // Recovery flow: send to reset-password page with session
  if (type === 'recovery') {
    const resetUrl = new URL('/auth/reset-password', baseUrl)
    resetUrl.searchParams.set('type', 'recovery')
    resetUrl.searchParams.set('verified', '1')
    return NextResponse.redirect(resetUrl)
  }

  // Session exists -> dashboard (recovery already handled above)
  if (data.session) {
    logEvent('login', {}, supabase).catch(() => {})

    // Apply signup marketing opt-in once (unchecked by default on signup form)
    const meta = data.session.user.user_metadata as Record<string, unknown> | undefined
    if (meta?.marketing_opt_in === true && data.session.user.email) {
      try {
        const { createServerSupabaseClient } = await import('@/lib/supabase')
        const {
          tableExists,
          syncLegacyMarketingFlag,
        } = await import('@/lib/email-campaigns')
        const admin = createServerSupabaseClient()
        if (await tableExists(admin, 'user_email_preferences')) {
          const { data: existing } = await admin
            .from('user_email_preferences')
            .select('id')
            .eq('user_id', data.session.user.id)
            .maybeSingle()
          if (!existing) {
            await admin.from('user_email_preferences').insert({
              user_id: data.session.user.id,
              email: data.session.user.email.toLowerCase(),
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
            })
            await syncLegacyMarketingFlag(
              admin,
              data.session.user.email,
              true,
              data.session.user.id
            )
          }
        }
      } catch {
        // Non-blocking — prefs can be set later
      }
    }

    const redirectTo = sanitizeRedirectPath(searchParams.get('redirectTo'))
    const dest = redirectTo ? `${redirectTo}${redirectTo.includes('?') ? '&' : '?'}verified=1` : '/dashboard?verified=1'
    return NextResponse.redirect(new URL(dest, baseUrl))
  }

  const authUrl = new URL('/auth', baseUrl)
  authUrl.searchParams.set('verified', '1')
  return NextResponse.redirect(authUrl)
}
