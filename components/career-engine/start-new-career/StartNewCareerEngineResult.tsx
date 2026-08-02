'use client'

import { useState } from 'react'
import {
  isStartNewCareerRecommendations,
  isStartNewCareerRoadmap,
  type StartNewCareerEngineResult,
} from '@/lib/career-engine/start-new-career/types'
import StartNewCareerRecommendationsView from './StartNewCareerRecommendations'
import StartNewCareerResultView from './StartNewCareerResult'

type Props = {
  result: StartNewCareerEngineResult
  isGuest?: boolean
  onConfirmCareer?: (sectorId: string) => void | Promise<void>
}

export default function StartNewCareerEngineResultView({
  result,
  isGuest,
  onConfirmCareer,
}: Props) {
  const [confirming, setConfirming] = useState(false)

  if (isStartNewCareerRecommendations(result)) {
    return (
      <StartNewCareerRecommendationsView
        result={result}
        confirming={confirming}
        onConfirmCareer={async (sectorId) => {
          if (!onConfirmCareer) return
          setConfirming(true)
          try {
            await onConfirmCareer(sectorId)
          } finally {
            setConfirming(false)
          }
        }}
      />
    )
  }

  if (isStartNewCareerRoadmap(result)) {
    return <StartNewCareerResultView result={result} isGuest={isGuest} />
  }

  return null
}
