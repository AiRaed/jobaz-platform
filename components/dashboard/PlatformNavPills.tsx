'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { dashboardTabHref, resolveDashboardTab } from '@/lib/dashboard/navigateDashboardTab'
import { DASHBOARD_TABS } from '@/lib/dashboard/platformNav'
import {
  PLATFORM_PILL_BASE,
  PLATFORM_PILL_GAP,
  PLATFORM_PILL_NAV_ACTIVE,
  PLATFORM_PILL_NAV_INACTIVE,
} from '@/lib/dashboard/platformDesignSystem'
import { cn } from '@/lib/utils'

type Props = {
  tabParam: string | null
}

/** Platform navigation — unified pill size on every page (embedded in identity card). */
export default function PlatformNavPills({ tabParam }: Props) {
  const pathname = usePathname()
  const activeTab = resolveDashboardTab(pathname, tabParam)

  return (
    <nav
      className="overflow-x-auto scrollbar-none"
      aria-label="Platform navigation"
      data-no-translate
    >
      <div className={cn('flex flex-wrap min-w-0', PLATFORM_PILL_GAP)}>
        {DASHBOARD_TABS.map((tab) => {
          const isActive = activeTab === tab.id
          const className = cn(
            PLATFORM_PILL_BASE,
            isActive ? PLATFORM_PILL_NAV_ACTIVE : PLATFORM_PILL_NAV_INACTIVE
          )

          if (isActive) {
            return (
              <span key={tab.id} aria-current="page" className={className}>
                <span className="hidden md:inline">{tab.label}</span>
                <span className="md:hidden">{tab.shortLabel}</span>
              </span>
            )
          }

          return (
            <Link key={tab.id} href={dashboardTabHref(tab.id)} prefetch className={className}>
              <span className="hidden md:inline">{tab.label}</span>
              <span className="md:hidden">{tab.shortLabel}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
