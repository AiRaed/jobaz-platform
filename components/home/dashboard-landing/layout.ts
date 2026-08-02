/**
 * Landing layout tokens — aligned with PlatformChrome / My Plan / CV Builder.
 * Prefer shared platform design system values; keep landing-only helpers here.
 */

import {
  PLATFORM_CONTENT,
  PLATFORM_HEADER_INNER,
  PLATFORM_HEADER_HEIGHT,
  PLATFORM_MAIN_PADDING,
  PLATFORM_SIDEBAR_WIDTH,
  PLATFORM_STICKY_CHROME,
  platformSidebarWidthClass,
} from '@/lib/dashboard/platformDesignSystem'

/** @deprecated Prefer PLATFORM_SIDEBAR_WIDTH / platformSidebarWidthClass — kept for callers. */
export const DASHBOARD_SIDEBAR_WIDTH = 248 // ~15.5rem — matches PLATFORM_SIDEBAR_WIDTH

export const dashboardPlatformMaxWidth = 'relative mx-auto w-full max-w-[1440px]'

/** Main column padding — same as PlatformChrome */
export const dashboardShellPadding = PLATFORM_MAIN_PADDING

/** @deprecated Vertical padding is included in PLATFORM_MAIN_PADDING */
export const dashboardShellVerticalPadding = ''

/** Header horizontal padding — same as PlatformHeader */
export const dashboardHeaderPadding = PLATFORM_HEADER_INNER

export const dashboardStickyChrome = PLATFORM_STICKY_CHROME
export const dashboardHeaderHeight = PLATFORM_HEADER_HEIGHT
export const dashboardSidebarWidthClass = platformSidebarWidthClass(false)
export const dashboardSidebarWidth = PLATFORM_SIDEBAR_WIDTH

export const dashboardColumnGap = 'gap-0'

/** Section rhythm — matches PLATFORM_CONTENT */
export const dashboardSectionGap = 'gap-5 md:gap-6'
export const dashboardContentBottom = 'pb-10'
export const dashboardContentClass = PLATFORM_CONTENT

/** 16px between cards in horizontal rows */
export const dashboardCardGap = 'gap-4'

/** Responsive courses/jobs grid — 4/3/2/1, aligned to main content column */
export const dashboardJobsGridClass =
  'grid grid-cols-1 min-[640px]:grid-cols-2 min-[960px]:grid-cols-3 min-[1280px]:grid-cols-4 gap-x-5 gap-y-5 w-full max-w-none min-w-0 box-border'

export const dashboardCoursesGridClass = dashboardJobsGridClass
