import type { DashboardTabId } from '@/components/dashboard/DashboardTabs'

/** Canonical href for each top nav tab (use with next/link). */
export function dashboardTabHref(tab: DashboardTabId): string {
  switch (tab) {
    case 'profile':
      return '/profile'
    case 'feed':
      return '/feed'
    case 'messages':
      return '/messages'
    case 'opportunities':
      return '/opportunities'
    case 'overview':
      return '/dashboard'
    case 'career-path':
      return '/career-hub'
    case 'interview':
      return '/interview-coach'
    case 'jobs':
      return '/dashboard?tab=jobs'
    case 'training':
      // Training is a section inside My Plan — no separate hub.
      return '/dashboard#recommended-training'
    case 'documents':
      return '/dashboard?tab=documents'
    default:
      return '/dashboard'
  }
}

export function isProfileRoute(pathname: string): boolean {
  return (
    pathname === '/profile' ||
    pathname.startsWith('/profile/') ||
    pathname.startsWith('/u/') ||
    pathname.startsWith('/business/')
  )
}

/** Active tab from pathname + optional ?tab= on /dashboard */
export function resolveDashboardTab(pathname: string, tabParam: string | null): DashboardTabId {
  if (isProfileRoute(pathname)) return 'profile'
  if (pathname === '/pulse' || pathname.startsWith('/pulse/')) return 'feed'
  if (pathname === '/feed' || pathname.startsWith('/feed/')) return 'feed'
  if (pathname === '/messages' || pathname.startsWith('/messages/') || pathname === '/relay') {
    return 'messages'
  }
  if (pathname === '/opportunities' || pathname.startsWith('/opportunities/')) {
    return 'opportunities'
  }
  if (
    pathname === '/career-hub' ||
    pathname.startsWith('/career-hub/') ||
    pathname === '/build-your-path' ||
    pathname.startsWith('/build-your-path/')
  ) {
    return 'career-path'
  }
  if (pathname === '/interview-coach' || pathname.startsWith('/interview-coach')) {
    return 'interview'
  }
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    if (tabParam === 'jobs') return 'jobs'
    // Legacy Training tab → My Plan (Recommended Training section)
    if (tabParam === 'training') return 'overview'
    if (tabParam === 'documents') return 'documents'
    if (tabParam === 'interview') return 'interview'
    if (tabParam === 'career-path') return 'career-path'
    if (tabParam === 'opportunities') return 'opportunities'
    return 'overview'
  }
  return 'overview'
}
