'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  CAREER_PLAN_UPDATED_EVENT,
  loadCareerPlanItems,
} from '@/lib/career-hub/myPlan'
import type { CareerPlanItem } from '@/lib/career-hub/types'

export function useCareerPlan() {
  const [items, setItems] = useState<CareerPlanItem[]>([])

  const refresh = useCallback(() => {
    setItems(loadCareerPlanItems())
  }, [])

  useEffect(() => {
    refresh()
    const onUpdate = () => refresh()
    window.addEventListener(CAREER_PLAN_UPDATED_EVENT, onUpdate)
    return () => window.removeEventListener(CAREER_PLAN_UPDATED_EVENT, onUpdate)
  }, [refresh])

  return { items, refresh }
}
