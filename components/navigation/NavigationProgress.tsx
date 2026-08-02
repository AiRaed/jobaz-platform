'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'

/**
 * Lightweight top progress bar for App Router client navigations.
 * Starts on internal Link clicks; clears when the route settles.
 */
export default function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [active, setActive] = useState(false)
  const [visible, setVisible] = useState(false)
  const clearTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const routeKey = `${pathname}?${searchParams.toString()}`

  useEffect(() => {
    setActive(false)
    if (clearTimer.current) clearTimeout(clearTimer.current)
    clearTimer.current = setTimeout(() => setVisible(false), 180)
    return () => {
      if (clearTimer.current) clearTimeout(clearTimer.current)
    }
  }, [routeKey])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const target = event.target as HTMLElement | null
      const anchor = target?.closest?.('a')
      if (!anchor) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#')) return
      if (anchor.target === '_blank' || anchor.hasAttribute('download')) return
      if (/^(https?:|mailto:|tel:)/i.test(href)) {
        try {
          const url = new URL(href, window.location.origin)
          if (url.origin !== window.location.origin) return
        } catch {
          return
        }
      }

      const nextPath = href.split('?')[0]?.split('#')[0] ?? href
      if (nextPath === pathname) return

      setVisible(true)
      setActive(true)
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [pathname])

  if (!visible) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5 overflow-hidden"
      aria-hidden
    >
      <div
        className={cn(
          'h-full bg-gradient-to-r from-violet-500 via-cyan-400 to-violet-500',
          'transition-[width,opacity] duration-300 ease-out',
          active ? 'w-[70%] opacity-100' : 'w-full opacity-0'
        )}
      />
    </div>
  )
}
