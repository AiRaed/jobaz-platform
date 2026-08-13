'use client'

import Link from 'next/link'
import { LogOut, Menu } from 'lucide-react'
import JobazThemeToggle from '@/components/JobazThemeToggle'
import Logo from '@/components/Logo'
import AdminNavLink from '@/components/admin/AdminNavLink'
import { usePlatformSidebar } from '@/contexts/PlatformSidebarContext'
import {
  PLATFORM_HEADER_INNER,
  PLATFORM_SIDEBAR_BRAND,
  PLATFORM_SIDEBAR_BRAND_LINK,
  platformSidebarWidthClass,
} from '@/lib/dashboard/platformDesignSystem'
import { cn } from '@/lib/utils'

type Props = {
  onLogout: () => void | Promise<void>
}

export default function PlatformHeader({ onLogout }: Props) {
  const { toggleMobile, collapsed } = usePlatformSidebar()

  return (
    <header className="flex w-full min-h-[var(--jobaz-header-h,4.5rem)] items-stretch">
      {/* Desktop: logo sits in sidebar-width column, centered with nav content */}
      <div className={cn(PLATFORM_SIDEBAR_BRAND, platformSidebarWidthClass(collapsed))}>
        <Link
          href="/dashboard"
          className={cn(PLATFORM_SIDEBAR_BRAND_LINK, collapsed && 'px-1')}
          aria-label="JobAZ — My Workspace"
        >
          <Logo
            className={cn(
              'h-8 w-auto max-w-full object-contain',
              collapsed && 'h-6 max-w-[2.5rem]'
            )}
          />
        </Link>
      </div>

      <div className={cn(PLATFORM_HEADER_INNER, 'flex-1 min-w-0')}>
        <div className="flex w-full items-center justify-between gap-3 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={toggleMobile}
              className="jobaz-shell-chip lg:hidden shrink-0 !px-2 !py-1.5"
              aria-label="Open tools menu"
            >
              <Menu className="h-4 w-4" />
            </button>
            <Link
              href="/dashboard"
              className="shrink-0 hover:opacity-90 transition-opacity lg:hidden"
            >
              <Logo className="h-8 md:h-9" />
            </Link>
            <div className="min-w-0 hidden xl:block">
              <p className="jobaz-header-eyebrow text-[10px] uppercase tracking-widest font-semibold leading-none text-[#A5B4FC]">
                AI Career Operating System
              </p>
              <p className="jobaz-header-tagline text-[11px] text-[#94A3B8] mt-1 leading-snug truncate max-w-md">
                Your career workspace and tools — plan, train, apply, and grow.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <JobazThemeToggle compact />
            <AdminNavLink />
            <a
              href="https://buymeacoffee.com/jobaz.support"
              target="_blank"
              rel="noopener noreferrer"
              className="jobaz-shell-chip"
            >
              <span aria-hidden>☕</span>
              <span className="hidden sm:inline">Support</span>
            </a>
            <button
              type="button"
              onClick={() => void onLogout()}
              className="jobaz-shell-chip jobaz-shell-chip--danger"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
