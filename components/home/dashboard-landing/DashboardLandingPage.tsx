'use client'

import { useState, type CSSProperties } from 'react'
import { cn } from '@/lib/utils'
import {
  PLATFORM_HEADER_HEIGHT,
  PLATFORM_MAIN_PADDING,
  PLATFORM_SHELL_MAX_WIDTH,
  PLATFORM_STICKY_CHROME,
  platformSidebarWidthClass,
} from '@/lib/dashboard/platformDesignSystem'
import DashboardAppHeader from './DashboardAppHeader'
import DashboardSidebar from './DashboardSidebar'
import DashboardContentTabs from './DashboardContentTabs'
import ContentSearchBar from './ContentSearchBar'
import JazCoachWidget from './JazCoachWidget'
import LatestJobsRow from './LatestJobsRow'
import PopularCoursesRow from './PopularCoursesRow'
import FeaturedOpportunitiesRow from './FeaturedOpportunitiesRow'
import FeaturedPulseRow from './FeaturedPulseRow'
import { LandingJobsProvider } from './LandingJobsContext'
import { LandingCoursesProvider } from './LandingCoursesContext'
import { dashboardSectionGap } from './layout'
import type { SearchMode } from './constants'

function DashboardMain() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [contentTab, setContentTab] = useState<SearchMode>('courses')
  const sidebarWidthClass = platformSidebarWidthClass(false)

  return (
    <div
      className="min-h-screen jobaz-page-bg text-[var(--text-main)] selection:bg-violet-500/30"
      style={
        {
          ['--jobaz-header-h' as string]: PLATFORM_HEADER_HEIGHT,
          ['--jobaz-shell-max' as string]: PLATFORM_SHELL_MAX_WIDTH,
        } as CSSProperties
      }
    >
      <div className={PLATFORM_STICKY_CHROME}>
        <DashboardAppHeader onOpenMobileNav={() => setMobileNavOpen(true)} />
      </div>

      <div
        className="jobaz-platform-body flex items-stretch bg-[var(--bg-main)]"
        style={{ minHeight: 'calc(100vh - var(--jobaz-header-h))' }}
      >
        {/* In-flow spacer — same as PlatformChrome */}
        <div
          className={cn('hidden lg:block shrink-0', sidebarWidthClass)}
          aria-hidden
        />

        <DashboardSidebar
          mobileOpen={mobileNavOpen}
          onMobileClose={() => setMobileNavOpen(false)}
          contentTab={contentTab}
          onSelectTab={setContentTab}
        />

        <main
          className={cn('flex-1 min-w-0 bg-[var(--bg-main)]', PLATFORM_MAIN_PADDING)}
          style={{ minHeight: 'calc(100vh - var(--jobaz-header-h))' }}
        >
          <div
            className={cn(
              'mx-auto w-full max-w-[1440px] min-w-0 flex flex-col',
              dashboardSectionGap
            )}
          >
            <JazCoachWidget />

            <DashboardContentTabs value={contentTab} onChange={setContentTab} />

            {contentTab !== 'pulse' && (
              <div className="jobaz-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-3.5 md:p-4">
                <ContentSearchBar mode={contentTab} />
              </div>
            )}

            <div className="w-full max-w-none min-w-0">
              {contentTab === 'jobs' && <LatestJobsRow />}
              {contentTab === 'courses' && <PopularCoursesRow />}
              {contentTab === 'opportunities' && <FeaturedOpportunitiesRow />}
              {contentTab === 'pulse' && <FeaturedPulseRow />}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default function DashboardLandingPage() {
  return (
    <LandingJobsProvider>
      <LandingCoursesProvider>
        <DashboardMain />
      </LandingCoursesProvider>
    </LandingJobsProvider>
  )
}
