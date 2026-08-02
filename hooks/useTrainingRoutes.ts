'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  loadTrainingRoutes,
  TRAINING_ROUTES_UPDATED_EVENT,
  type RecommendedTrainingRoute,
} from '@/lib/career-hub/trainingPlan'

export function useTrainingRoutes() {
  const [routes, setRoutes] = useState<RecommendedTrainingRoute[]>([])

  const refresh = useCallback(() => {
    setRoutes(loadTrainingRoutes())
  }, [])

  useEffect(() => {
    refresh()
    window.addEventListener(TRAINING_ROUTES_UPDATED_EVENT, refresh)
    return () => window.removeEventListener(TRAINING_ROUTES_UPDATED_EVENT, refresh)
  }, [refresh])

  return { routes, refresh }
}
