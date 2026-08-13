import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { WIE_ADMIN_OVERRIDE_COOKIE } from '@/lib/career-engine/work-in-education/feature-flag'

export const dynamic = 'force-dynamic'

/**
 * GET /api/career-assistant/work-in-my-education/test-mode
 * Admin-only: sets short-lived override cookie and redirects to WIE journey.
 * Public users cannot enable the knowledge engine via query string alone.
 */
export async function GET(req: Request) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const url = new URL(req.url)
  const target =
    url.searchParams.get('next') || '/career-engine/work-in-education?wie_v1=1'

  const res = NextResponse.redirect(new URL(target, url.origin))
  res.cookies.set(WIE_ADMIN_OVERRIDE_COOKIE, '1', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  return res
}
