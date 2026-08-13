/**
 * Short-lived signed result token (no DB). Payload is the public contract.
 * Unguessable HMAC; expires; no PII answers in the token.
 */

import { createHmac, randomBytes, timingSafeEqual } from 'crypto'
import type { PublicWieAssessmentResult } from './public-contract'

const TOKEN_TTL_MS = 2 * 60 * 60 * 1000 // 2 hours
const VERSION = 1

type TokenPayload = {
  v: number
  exp: number
  nonce: string
  result: Omit<PublicWieAssessmentResult, 'result_token'>
}

function secret(): string {
  return (
    process.env.WIE_RESULT_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXTAUTH_SECRET ||
    'jobaz-dev-wie-token-secret-change-me'
  )
}

function b64url(buf: Buffer | string): string {
  const b = Buffer.isBuffer(buf) ? buf : Buffer.from(buf, 'utf8')
  return b.toString('base64url')
}

function sign(data: string): string {
  return createHmac('sha256', secret()).update(data).digest('base64url')
}

export function mintWieResultToken(
  publicResult: Omit<PublicWieAssessmentResult, 'result_token'>
): string {
  const payload: TokenPayload = {
    v: VERSION,
    exp: Date.now() + TOKEN_TTL_MS,
    nonce: randomBytes(16).toString('hex'),
    result: publicResult,
  }
  const body = b64url(JSON.stringify(payload))
  const sig = sign(body)
  return `${body}.${sig}`
}

export type TokenVerifyResult =
  | { ok: true; result: PublicWieAssessmentResult }
  | { ok: false; reason: 'invalid' | 'expired' | 'malformed' }

export function verifyWieResultToken(token: string): TokenVerifyResult {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return { ok: false, reason: 'malformed' }
  }
  const [body, sig] = token.split('.')
  if (!body || !sig) return { ok: false, reason: 'malformed' }

  const expected = sign(body)
  try {
    const a = Buffer.from(sig)
    const b = Buffer.from(expected)
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      return { ok: false, reason: 'invalid' }
    }
  } catch {
    return { ok: false, reason: 'invalid' }
  }

  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload
    if (payload.v !== VERSION || !payload.result) return { ok: false, reason: 'malformed' }
    if (Date.now() > payload.exp) return { ok: false, reason: 'expired' }
    return {
      ok: true,
      result: { ...payload.result, result_token: token },
    }
  } catch {
    return { ok: false, reason: 'malformed' }
  }
}

export const WIE_RESULT_TOKEN_TTL_MS = TOKEN_TTL_MS
