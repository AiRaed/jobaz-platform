import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { verifyWieResultToken } from '@/lib/career-engine/work-in-education/result-token'
import {
  resolveWieKnowledgeEngineEnabled,
  WIE_ADMIN_OVERRIDE_COOKIE,
} from '@/lib/career-engine/work-in-education/feature-flag'
import { getOptionalAuthUserEmail } from '@/lib/career-engine/work-in-education/resolve-flag-server'
import { isAdminUser } from '@/lib/auth/adminEmails'
import { checkWieAssessmentRateLimit } from '@/lib/career-engine/work-in-education/rate-limit'

export const dynamic = 'force-dynamic'

/**
 * GET /api/career-assistant/work-in-my-education/result?token=...
 */
export async function GET(req: Request) {
  const email = await getOptionalAuthUserEmail()
  const cookieStore = await cookies()
  const cookieOverride = cookieStore.get(WIE_ADMIN_OVERRIDE_COOKIE)?.value ?? null
  const flagOn = resolveWieKnowledgeEngineEnabled({
    isAdmin: isAdminUser(email),
    cookieOverride,
  })
  if (!flagOn) {
    return NextResponse.json({ error: 'Not available.', code: 'feature_disabled' }, { status: 403 })
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  const rate = checkWieAssessmentRateLimit(`wie-result:${ip}`, { limit: 60, windowMs: 60_000 })
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many requests.', code: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
    )
  }

  const url = new URL(req.url)
  const token = url.searchParams.get('token')?.trim() || ''
  if (!token) {
    return NextResponse.json({ error: 'Missing result.', code: 'missing_token' }, { status: 400 })
  }

  const verified = verifyWieResultToken(token)
  if (!verified.ok) {
    return NextResponse.json(
      {
        error:
          verified.reason === 'expired'
            ? 'Your results have expired. Please run the assessment again.'
            : 'We could not restore your results. Please run the assessment again.',
        code: verified.reason === 'expired' ? 'token_expired' : 'token_invalid',
      },
      { status: verified.reason === 'expired' ? 410 : 400 }
    )
  }

  return NextResponse.json({ result: verified.result })
}
