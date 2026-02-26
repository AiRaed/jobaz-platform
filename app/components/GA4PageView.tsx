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

export default function GA4PageView({ measurementId }: { measurementId: string }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    const qs = searchParams?.toString()
    const pagePath = qs ? `${pathname}?${qs}` : pathname

    const sendPageView = (): boolean => {
      if (typeof window === 'undefined' || !window.gtag) return false
      window.gtag('event', 'page_view', {
        page_path: pagePath,
        page_location: window.location.href,
        page_title: document.title,
        send_to: measurementId,
      })
      return true
    }

    if (sendPageView()) return

    const deadline = Date.now() + MAX_GTAG_WAIT_MS
    const pollId = setInterval(() => {
      if (Date.now() > deadline) {
        clearInterval(pollId)
        return
      }
      if (sendPageView()) clearInterval(pollId)
    }, GTAG_POLL_MS)

    return () => clearInterval(pollId)
  }, [pathname, searchParams, measurementId])

  return null
}