'use client'

import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import PlatformNavPills from './PlatformNavPills'
import {
  PLATFORM_IDENTITY_CARD,
  PLATFORM_IDENTITY_NAV_DIVIDER,
} from '@/lib/dashboard/platformDesignSystem'
import { cn } from '@/lib/utils'

type Props = {
  displayName: string
  displayEmail?: string
  careerStateLabel?: string | null
}

function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

function IdentityNav() {
  const searchParams = useSearchParams()
  return <PlatformNavPills tabParam={searchParams.get('tab')} />
}

export default function DashboardIdentityHeader({
  displayName,
  displayEmail,
  careerStateLabel,
}: Props) {
  const initials = initialsFromName(displayName || displayEmail || 'You')

  return (
    <section className={PLATFORM_IDENTITY_CARD} aria-label="Your identity and navigation">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={cn(
            'shrink-0 flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold',
            'bg-gradient-to-br from-violet-600/25 to-cyan-500/15 border border-violet-300/40 text-violet-800',
            'dark:from-violet-600/35 dark:to-cyan-500/20 dark:border-violet-500/25 dark:text-violet-100'
          )}
          aria-hidden
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-base md:text-lg font-semibold text-[var(--text-primary)] dark:text-slate-50 tracking-tight truncate">
            {displayName || 'Welcome back'}
          </h1>
          {displayEmail && (
            <p className="text-xs text-[var(--text-secondary)] dark:text-slate-400 truncate">{displayEmail}</p>
          )}
          {careerStateLabel ? (
            <span className="mt-1.5 inline-flex items-center gap-1 rounded-full border border-violet-300/60 bg-[var(--bg-surface-alt)] px-2 py-0.5 text-[10px] font-medium text-violet-800 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200">
              <span className="h-1 w-1 rounded-full bg-violet-500 dark:bg-violet-400 animate-pulse" />
              {careerStateLabel}
            </span>
          ) : (
            <p className="text-[10px] text-[var(--text-muted)] dark:text-slate-500 mt-0.5">
              Your private career workspace
            </p>
          )}
        </div>
      </div>

      <div className={PLATFORM_IDENTITY_NAV_DIVIDER}>
        <Suspense fallback={<PlatformNavPills tabParam={null} />}>
          <IdentityNav />
        </Suspense>
      </div>
    </section>
  )
}
