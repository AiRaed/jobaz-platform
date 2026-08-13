'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Menu } from 'lucide-react'
import Logo from '@/components/Logo'
import JobazThemeToggle from '@/components/JobazThemeToggle'
import AdminNavLink from '@/components/admin/AdminNavLink'
import { supabase } from '@/lib/supabase'
import {
  PLATFORM_HEADER_INNER,
  PLATFORM_SIDEBAR_BRAND,
  PLATFORM_SIDEBAR_BRAND_LINK,
  platformSidebarWidthClass,
} from '@/lib/dashboard/platformDesignSystem'
import { cn } from '@/lib/utils'

function LandingTagline({ className }: { className?: string }) {
  return (
    <p className={className}>
      <span className="jobaz-header-tagline-strong">Your UK career platform</span>
      <span className="jobaz-header-tagline-accent"> — plan, train, apply and grow</span>
    </p>
  )
}

type Props = {
  onOpenMobileNav?: () => void
}

/**
 * Landing header — same height / logo brand column as PlatformHeader.
 */
export default function DashboardAppHeader({ onOpenMobileNav }: Props) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(Boolean(session?.user))
    })
  }, [])

  const accountActions = (
    <div className="flex flex-wrap items-center gap-2 shrink-0">
      <JobazThemeToggle compact />
      <AdminNavLink />
      {isLoggedIn ? (
        <Link href="/dashboard" className="jobaz-btn-primary jobaz-btn-primary-sm">
          My Workspace
        </Link>
      ) : (
        <>
          <Link href="/auth?mode=login" className="jobaz-shell-chip hidden sm:inline-flex">
            Log in
          </Link>
          <Link href="/auth?mode=signup" className="jobaz-btn-primary jobaz-btn-primary-sm">
            Get started
          </Link>
        </>
      )}
    </div>
  )

  return (
    <header className="flex w-full min-h-[var(--jobaz-header-h,4.5rem)] items-stretch">
      {/* Desktop: logo centered in sidebar-width column (matches nav below) */}
      <div className={cn(PLATFORM_SIDEBAR_BRAND, platformSidebarWidthClass(false))}>
        <Link href="/" className={PLATFORM_SIDEBAR_BRAND_LINK} aria-label="JobAZ home">
          <Logo className="h-8 w-auto max-w-full object-contain" />
        </Link>
      </div>

      <div className={cn(PLATFORM_HEADER_INNER, 'flex-1 min-w-0')}>
        <div className="flex w-full items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            {onOpenMobileNav && (
              <button
                type="button"
                onClick={onOpenMobileNav}
                className="jobaz-shell-chip lg:hidden shrink-0 !px-2 !py-1.5"
                aria-label="Open navigation"
              >
                <Menu className="h-4 w-4" />
              </button>
            )}
            <Link href="/" className="shrink-0 hover:opacity-90 transition-opacity lg:hidden">
              <Logo className="h-8 md:h-9" />
            </Link>
            <div className="min-w-0 hidden xl:block">
              <p className="jobaz-header-eyebrow text-[10px] uppercase tracking-widest font-semibold leading-none text-[#A5B4FC]">
                AI Career Operating System
              </p>
              <LandingTagline className="jobaz-header-tagline text-[11px] text-[#94A3B8] mt-1 leading-snug truncate max-w-md" />
            </div>
          </div>

          {accountActions}
        </div>
      </div>
    </header>
  )
}
