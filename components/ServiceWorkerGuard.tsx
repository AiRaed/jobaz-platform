'use client'

import { useEffect } from 'react'

function isLocalDevHost(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]'
}

/**
 * Localhost: fully disable any registered service workers so Next.js / HMR
 * and API fetches are never intercepted. Production: do not auto-register;
 * if a stale SW exists, point it at the safe /sw.js (network-first).
 */
export default function ServiceWorkerGuard() {
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return

    const onLocalhost = isLocalDevHost()
    const isDev = process.env.NODE_ENV === 'development'

    const clearAllCaches = async () => {
      if (!('caches' in window)) return
      const keys = await caches.keys()
      await Promise.all(keys.map((key) => caches.delete(key)))
    }

    const unregisterAll = async () => {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((reg) => reg.unregister()))
      await clearAllCaches()
      if (isDev || onLocalhost) {
        console.info(
          '[JobAZ] Service worker disabled on localhost — unregistered',
          regs.length,
          'registration(s) and cleared caches for fresh local loads.'
        )
      }
    }

    void (async () => {
      try {
        if (onLocalhost || isDev) {
          await unregisterAll()
          // Never register a SW during local development
          return
        }

        // Production: only refresh an existing controlling/registered SW to the safe script.
        // Do not introduce SW registration if none exists.
        const regs = await navigator.serviceWorker.getRegistrations()
        if (regs.length === 0) return

        await navigator.serviceWorker.register('/sw.js', { scope: '/' })
      } catch (err) {
        if (isDev || onLocalhost) {
          console.warn('[JobAZ] Service worker guard failed (non-fatal):', err)
        }
      }
    })()
  }, [])

  return null
}
