/**
 * Lightweight in-memory rate limit for public WIE assessment API.
 * Best-effort (per server instance) — sufficient until a shared limiter exists.
 */

type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()

export function checkWieAssessmentRateLimit(
  key: string,
  opts: { limit?: number; windowMs?: number } = {}
): { ok: true } | { ok: false; retryAfterSec: number } {
  const limit = opts.limit ?? 30
  const windowMs = opts.windowMs ?? 60_000
  const now = Date.now()
  let bucket = buckets.get(key)
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs }
    buckets.set(key, bucket)
  }
  bucket.count += 1
  if (bucket.count > limit) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((bucket.resetAt - now) / 1000)) }
  }
  return { ok: true }
}

/** Test helper */
export function __resetWieRateLimitForTests() {
  buckets.clear()
}
