/** Development logging for AI profile upserts — always surfaces Supabase errors in dev. */
export function profileLog(
  tag: 'start' | 'payload' | 'existing profile' | 'insert result' | 'update result' | 'error',
  detail?: unknown
): void {
  if (process.env.NODE_ENV !== 'development') return
  if (detail !== undefined) {
    console.log(`[AI Profile] ${tag}`, detail)
  } else {
    console.log(`[AI Profile] ${tag}`)
  }
}

export function profileLogError(message: string, error: unknown): void {
  if (process.env.NODE_ENV !== 'development') {
    return
  }
  console.error(`[AI Profile] error`, message, error)
}
