'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  Briefcase,
  Compass,
  FileText,
  GraduationCap,
  Home,
  LayoutDashboard,
  LogIn,
  Mail,
  MapPin,
  Mic,
  PenLine,
  Radio,
  UserPlus,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import UkCareerAssistantLink from '@/components/uk-career-assistant/UkCareerAssistantLink'
import { platformSidebarWidthClass } from '@/lib/dashboard/platformDesignSystem'
import type { SearchMode } from './constants'

type NavItem = { href: string; label: string; icon: LucideIcon }

const PRIMARY: NavItem[] = [{ href: '/', label: 'Home', icon: Home }]

/** Public tools — CV Builder lives here (not duplicated under Main actions). */
const TOOLS: NavItem[] = [
  { href: '/cv-builder', label: 'CV Builder', icon: FileText },
  { href: '/cover-letter', label: 'Cover Letter', icon: Mail },
  { href: '/interview-coach', label: 'Interview Coach', icon: Mic },
  { href: '/writing-review', label: 'Writing Review', icon: PenLine },
]

const GUEST_ACCOUNT: NavItem[] = [
  { href: '/auth?mode=login', label: 'Log in', icon: LogIn },
  { href: '/auth?mode=signup', label: 'Get started free', icon: UserPlus },
]

const LOGGED_IN_ACCOUNT: NavItem[] = [
  { href: '/dashboard', label: 'My Workspace', icon: LayoutDashboard },
]

const HOW_IT_WORKS = [
  'Choose a goal or open a tool',
  'Get a plan if you want one',
  'Improve your CV',
  'Apply or train',
] as const

function isNavItemActive(pathname: string, href: string): boolean {
  const pathOnly = href.split('?')[0] || href
  if (pathOnly === '/') return pathname === '/'

  if (pathOnly === '/cv-builder') {
    return (
      pathname === '/cv-builder' ||
      pathname === '/cv-builder-v2' ||
      pathname.startsWith('/cv-builder/')
    )
  }
  if (pathOnly === '/cover-letter') {
    return pathname === '/cover-letter' || pathname === '/cover' || pathname.startsWith('/cover/')
  }
  if (pathOnly === '/writing-review') {
    return (
      pathname === '/writing-review' ||
      pathname === '/proofreading' ||
      pathname.startsWith('/proofreading/')
    )
  }
  if (pathOnly === '/auth') {
    return pathname.startsWith('/auth')
  }

  return pathname === pathOnly || pathname.startsWith(`${pathOnly}/`)
}

function NavLink({
  item,
  active,
  onNavigate,
}: {
  item: NavItem
  active: boolean
  onNavigate?: () => void
}) {
  const Icon = item.icon
  return (
    <Link
      href={item.href}
      prefetch
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn('jobaz-shell-nav', active && 'jobaz-shell-nav--active')}
    >
      <Icon className="w-4 h-4 shrink-0 opacity-95" strokeWidth={1.75} aria-hidden />
      <span className="truncate text-xs font-semibold">{item.label}</span>
    </Link>
  )
}

function NavButton({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string
  icon: LucideIcon
  active?: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      className={cn('jobaz-shell-nav w-full text-left', active && 'jobaz-shell-nav--active')}
    >
      <Icon className="w-4 h-4 shrink-0 opacity-95" strokeWidth={1.75} aria-hidden />
      <span className="truncate text-xs font-semibold">{label}</span>
    </button>
  )
}

function HowJobazWorksCard() {
  return (
    <div
      className={cn(
        'jobaz-shell-helper-card mx-1 rounded-xl border px-3 py-3',
        'border-white/10 bg-white/[0.06]',
        'shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]'
      )}
    >
      <p className="jobaz-shell-section-label text-[10px] uppercase tracking-widest font-semibold mb-2.5">
        How JobAZ works
      </p>
      <ol className="space-y-1.5">
        {HOW_IT_WORKS.map((step, i) => (
          <li key={step} className="flex items-start gap-2 text-[11px] leading-snug">
            <span
              className={cn(
                'mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full',
                'border border-white/15 bg-white/10',
                'text-[9px] font-bold text-white/90'
              )}
              aria-hidden
            >
              {i + 1}
            </span>
            <span className="text-[var(--shell-text-secondary)]">{step}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

function SidebarContent({
  onNavigate,
  contentTab,
  onSelectTab,
  isLoggedIn,
}: {
  onNavigate?: () => void
  contentTab: SearchMode
  onSelectTab: (mode: SearchMode) => void
  isLoggedIn: boolean
}) {
  const pathname = usePathname()

  const selectTab = (mode: SearchMode) => {
    onSelectTab(mode)
    onNavigate?.()
  }

  const accountItems = isLoggedIn ? LOGGED_IN_ACCOUNT : GUEST_ACCOUNT

  const section = (title: string, items: NavItem[]) => (
    <div>
      <div className="px-2 mb-2">
        <p className="jobaz-shell-section-label text-[10px] uppercase tracking-widest font-semibold">
          {title}
        </p>
      </div>
      <nav className="space-y-0.5" aria-label={title}>
        {items.map((item) => (
          <NavLink
            key={`${title}-${item.href}-${item.label}`}
            item={item}
            active={isNavItemActive(pathname, item.href)}
            onNavigate={onNavigate}
          />
        ))}
      </nav>
    </div>
  )

  return (
    <aside
      className="flex flex-col shrink-0 border-r jobaz-platform-sidebar h-full min-h-0 w-full"
      aria-label="Landing navigation"
    >
      {/* Same inner rhythm as PlatformSidebar */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain px-2 pt-3 pb-3 space-y-5">
        <div>
          <nav className="space-y-0.5" aria-label="Primary">
            {PRIMARY.map((item) => (
              <NavLink
                key={item.href}
                item={item}
                active={isNavItemActive(pathname, item.href)}
                onNavigate={onNavigate}
              />
            ))}
          </nav>
        </div>

        <div>
          <div className="px-2 mb-2">
            <p className="jobaz-shell-section-label text-[10px] uppercase tracking-widest font-semibold">
              Main actions
            </p>
          </div>
          <nav className="space-y-0.5" aria-label="Main actions">
            <UkCareerAssistantLink
              className="jobaz-shell-nav"
              onClick={() => onNavigate?.()}
            >
              <Compass className="w-4 h-4 shrink-0 opacity-95" strokeWidth={1.75} aria-hidden />
              <span className="truncate text-xs font-semibold">Start Career Assistant</span>
            </UkCareerAssistantLink>

            <NavButton
              label="Browse Courses"
              icon={GraduationCap}
              active={pathname === '/' && contentTab === 'courses'}
              onClick={() => selectTab('courses')}
            />
            <NavButton
              label="Find Jobs"
              icon={Briefcase}
              active={pathname === '/' && contentTab === 'jobs'}
              onClick={() => selectTab('jobs')}
            />
            <NavButton
              label="Local Opportunities"
              icon={MapPin}
              active={pathname === '/' && contentTab === 'opportunities'}
              onClick={() => selectTab('opportunities')}
            />
            <NavButton
              label="Career Tips / Pulse"
              icon={Radio}
              active={pathname === '/' && contentTab === 'pulse'}
              onClick={() => selectTab('pulse')}
            />
          </nav>
        </div>

        {section('Tools', TOOLS)}
        {section('Account', accountItems)}
      </div>

      <div className="shrink-0 border-t border-[var(--shell-sidebar-border)] p-2 space-y-2">
        <HowJobazWorksCard />
        <p className="px-2.5 text-[10px] leading-relaxed text-[var(--shell-text-muted)]">
          Practical UK career routes — no job guarantees.
        </p>
      </div>
    </aside>
  )
}

type Props = {
  mobileOpen: boolean
  onMobileClose: () => void
  contentTab: SearchMode
  onSelectTab: (mode: SearchMode) => void
}

/**
 * Landing sidebar — fixed lg+ placement matching PlatformSidebar shell metrics.
 */
export default function DashboardSidebar({
  mobileOpen,
  onMobileClose,
  contentTab,
  onSelectTab,
}: Props) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const widthClass = platformSidebarWidthClass(false)

  useEffect(() => {
    let cancelled = false

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!cancelled) setIsLoggedIn(Boolean(session?.user))
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user))
    })

    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!mobileOpen) return
    const close = () => onMobileClose()
    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [mobileOpen, onMobileClose])

  const content = (
    <SidebarContent
      contentTab={contentTab}
      onSelectTab={onSelectTab}
      isLoggedIn={isLoggedIn}
      onNavigate={onMobileClose}
    />
  )

  return (
    <>
      {/* Fixed desktop sidebar — same geometry as PlatformSidebar */}
      <div
        className={cn(
          'hidden lg:flex fixed z-40 left-0',
          'bg-[var(--shell-sidebar-bg)] border-r border-[var(--shell-sidebar-border)]',
          widthClass
        )}
        style={{
          top: 'var(--jobaz-header-h, 4.5rem)',
          height: 'calc(100vh - var(--jobaz-header-h, 4.5rem))',
        }}
      >
        {content}
      </div>

      {mobileOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm"
          aria-label="Close menu"
          onClick={onMobileClose}
        />
      )}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-[56] transition-transform duration-200',
          'h-full w-[15.5rem] bg-[var(--shell-sidebar-bg)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {content}
      </div>
    </>
  )
}
