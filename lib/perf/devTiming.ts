/**
 * Dev-only timing helpers. No-ops in production.
 */

const isDev = process.env.NODE_ENV === 'development'

export function devTime(label: string): () => void {
  if (!isDev || typeof performance === 'undefined') return () => undefined
  const start = performance.now()
  return () => {
    const ms = Math.round(performance.now() - start)
    console.log(`[perf] ${label}: ${ms}ms`)
  }
}

export function devLog(...args: unknown[]): void {
  if (!isDev) return
  console.log('[perf]', ...args)
}
