'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

const MAX_GTAG_WAIT_MS = 5000
const GTAG_POLL_MS = 100

/** Sends page_view events only; does not load or reinitialize GA. */
export default function GA4PageView({ measurementId }: { measurementId: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const qs = searchParams?.toString()
    const url = qs ? `${pathname}?${qs}` : pathname

    const send = (): boolean => {
      if (typeof window === 'undefined' || typeof window.gtag !== 'function') return false
      window.gtag('event', 'page_view', { page_path: url })
      return true
    }

    if (send()) return
    const deadline = Date.now() + MAX_GTAG_WAIT_MS
    const pollId = setInterval(() => {
      if (Date.now() > deadline) clearInterval(pollId)
      else if (send()) clearInterval(pollId)
    }, GTAG_POLL_MS)
    return () => clearInterval(pollId)
  }, [pathname, searchParams, measurementId])

  return null
}