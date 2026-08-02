'use client'

/**
 * @deprecated Platform navigation lives in DashboardIdentityHeader via PlatformShell.
 * Kept for gradual migration — renders nothing; use PlatformShell on all platform pages.
 */
export default function DashboardTabs() {
  return null
}

export type { DashboardTabId } from '@/lib/dashboard/platformNav'
export { DASHBOARD_TABS, parseDashboardTab } from '@/lib/dashboard/platformNav'
