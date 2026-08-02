/**
 * JobAZ service worker — network-first, non-invasive.
 * - Never caches API or Next.js/dev assets aggressively
 * - On network failure: return cache if present, else a soft Response (no uncaught reject)
 * - Localhost self-unregisters so HMR / fresh files always win
 */
/* eslint-disable no-restricted-globals */

const CACHE_NAME = 'jobaz-sw-v1'
const IS_LOCALHOST =
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname === '[::1]'

self.addEventListener('install', (event) => {
  self.skipWaiting()
  if (IS_LOCALHOST) {
    event.waitUntil(
      self.registration.unregister().catch(() => undefined)
    )
  }
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      if (IS_LOCALHOST) {
        const keys = await caches.keys()
        await Promise.all(keys.map((k) => caches.delete(k)))
        await self.registration.unregister().catch(() => undefined)
      } else {
        const keys = await caches.keys()
        await Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
        )
      }
      await self.clients.claim()
    })()
  )
})

function shouldBypassCache(request, url) {
  if (request.method !== 'GET') return true
  // Never cache APIs or RSC payloads
  if (url.pathname.startsWith('/api/')) return true
  if (url.searchParams.has('_rsc')) return true
  // Next.js / Turbopack / HMR — always network
  if (
    url.pathname.startsWith('/_next/') ||
    url.pathname.includes('webpack') ||
    url.pathname.includes('hot-update')
  ) {
    return true
  }
  // Localhost must always load fresh files
  if (IS_LOCALHOST) return true
  // Soft-cache only common static asset destinations
  const dest = request.destination
  return !(dest === 'image' || dest === 'font' || dest === 'style' || dest === 'script')
}

async function networkFirst(request) {
  const url = new URL(request.url)

  // Same-origin only; never intercept cross-origin (analytics, etc.)
  if (url.origin !== self.location.origin) {
    return fetch(request)
  }

  if (IS_LOCALHOST || shouldBypassCache(request, url)) {
    try {
      return await fetch(request)
    } catch {
      // Soft failure — avoid Uncaught (in promise) TypeError: Failed to fetch
      const cached = await caches.match(request)
      if (cached) return cached
      return new Response('', {
        status: 503,
        statusText: 'Network unavailable',
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Jobaz-SW': 'bypass-fail' },
      })
    }
  }

  try {
    const networkResponse = await fetch(request)
    // Cache successful static GETs only (not API)
    if (
      networkResponse &&
      networkResponse.ok &&
      request.method === 'GET' &&
      !url.pathname.startsWith('/api/')
    ) {
      try {
        const copy = networkResponse.clone()
        const cache = await caches.open(CACHE_NAME)
        await cache.put(request, copy)
      } catch {
        // Ignore cache write failures
      }
    }
    return networkResponse
  } catch {
    const cached = await caches.match(request)
    if (cached) return cached
    return new Response('', {
      status: 503,
      statusText: 'Network unavailable',
      headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Jobaz-SW': 'offline' },
    })
  }
}

self.addEventListener('fetch', (event) => {
  // Never let a rejected fetch become an uncaught promise at the page
  event.respondWith(
    networkFirst(event.request).catch(() =>
      new Response('', {
        status: 503,
        statusText: 'Service worker error',
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Jobaz-SW': 'error' },
      })
    )
  )
})
