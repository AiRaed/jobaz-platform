'use client'

import { useRouter } from 'next/navigation'
import { useCallback } from 'react'
import type { DashboardTabId } from '@/components/dashboard/DashboardTabs'
import { dashboardTabHref } from '@/lib/dashboard/navigateDashboardTab'

export function useDashboardTabNavigation() {
  const router = useRouter()

  return useCallback(
    (tab: DashboardTabId) => {
      router.push(dashboardTabHref(tab))
    },
    [router]
  )
}
