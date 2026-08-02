'use client'

import { ReactNode, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import {
  PLATFORM_HEADER_HEIGHT,
  PLATFORM_SHELL_MAX_WIDTH,
} from '@/lib/dashboard/platformDesignSystem'

interface AppShellProps {
  children: ReactNode
  className?: string
  /** Wider max-width for platform workspace */
  wide?: boolean
  /** Platform chrome (sidebar layout) manages its own horizontal padding */
  platform?: boolean
}

/**
 * Shared page shell — full-height JobAZ background.
 * Platform mode is full-bleed (sidebar fixed at left:0); content padding lives in PlatformChrome.
 */
export default function AppShell({ children, className = '', wide, platform }: AppShellProps) {
  return (
    <div
      className="min-h-screen relative jobaz-page-bg text-white"
      style={
        {
          ['--jobaz-header-h' as string]: PLATFORM_HEADER_HEIGHT,
          ['--jobaz-shell-max' as string]: PLATFORM_SHELL_MAX_WIDTH,
        } as CSSProperties
      }
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="absolute -top-32 -left-24 h-64 w-64 rounded-full bg-violet-600/30 blur-3xl jobaz-ambient-violet" />
        <div className="absolute bottom-0 right-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl jobaz-ambient-fuchsia" />
      </div>

      <div
        className={cn(
          'relative min-h-screen',
          platform ? 'w-full max-w-none px-0' : 'mx-auto px-4 md:px-8 py-8 md:py-10',
          !platform && (wide ? 'max-w-[1440px]' : 'max-w-6xl'),
          className
        )}
      >
        {children}
      </div>
    </div>
  )
}
