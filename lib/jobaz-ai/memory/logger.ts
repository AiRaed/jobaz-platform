/** Dev-only logging for AI memory; silent in production. */
export function memoryDevLog(message: string, detail?: unknown): void {
  if (process.env.NODE_ENV !== 'development') return
  if (detail !== undefined) {
    console.warn(`[JobAZ AI Memory] ${message}`, detail)
  } else {
    console.warn(`[JobAZ AI Memory] ${message}`)
  }
}
