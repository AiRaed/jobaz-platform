/** Dev-only logging for AI analytics; silent in production. */
export function analyticsDevLog(message: string, detail?: unknown): void {
  if (process.env.NODE_ENV !== 'development') return
  if (detail !== undefined) {
    console.warn(`[JobAZ AI Analytics] ${message}`, detail)
  } else {
    console.warn(`[JobAZ AI Analytics] ${message}`)
  }
}
