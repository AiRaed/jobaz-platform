'use client'

import { useCallback, useRef, useState } from 'react'
import CareerEnginePathPage from '@/components/career-engine/conversation/CareerEnginePathPage'
import StartNewCareerEngineResultView from '@/components/career-engine/start-new-career/StartNewCareerEngineResult'
import { getCareerEnginePath } from '@/lib/career-engine/conversation/pathRegistry'
import {
  buildStartNewCareerEngineResult,
} from '@/lib/career-engine/start-new-career/decisionEngine'
import type { StartNewCareerEngineResult } from '@/lib/career-engine/start-new-career/types'
import { isStartNewCareerRoadmap } from '@/lib/career-engine/start-new-career/types'
import { persistCareerEngineStructuredResult } from '@/lib/uk-career-assistant/persistCareerEngineCompletion'

const config = getCareerEnginePath('start_new_career')

async function fetchEngineResult(
  answers: Record<string, string>
): Promise<StartNewCareerEngineResult> {
  try {
    const res = await fetch('/api/career-engine/start-new-career', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(answers),
    })
    if (res.ok) {
      const body = (await res.json()) as { result: StartNewCareerEngineResult }
      return body.result
    }
  } catch {
    // fallback below
  }
  return buildStartNewCareerEngineResult(answers)
}

export default function StartNewCareerPage() {
  const answersRef = useRef<Record<string, string>>({})
  const [displayResult, setDisplayResult] = useState<StartNewCareerEngineResult | null>(null)

  const persistRoadmap = useCallback(
    (answers: Record<string, string>, result: StartNewCareerEngineResult) => {
      if (!isStartNewCareerRoadmap(result)) return
      localStorage.setItem(config.storageKey, JSON.stringify(result))
      void persistCareerEngineStructuredResult({
        goalId: config.id,
        answers,
        structuredResult: result,
        source: `career_engine_${config.id}`,
      })
    },
    []
  )

  const buildStructuredResult = useCallback(async (answers: Record<string, string>) => {
    answersRef.current = answers
    const result = await fetchEngineResult(answers)
    setDisplayResult(result)
    if (isStartNewCareerRoadmap(result)) {
      persistRoadmap(answers, result)
    }
    return result
  }, [persistRoadmap])

  const handleConfirmCareer = useCallback(
    async (sectorId: string) => {
      const baseAnswers =
        answersRef.current.starting_situation != null
          ? answersRef.current
          : displayResult?.phase === 'recommendations'
            ? displayResult.answers
            : {}
      const merged = {
        ...baseAnswers,
        target_field: sectorId,
        target_confirmed: 'yes',
      }
      answersRef.current = merged
      const result = await fetchEngineResult(merged)
      setDisplayResult(result)
      if (isStartNewCareerRoadmap(result)) {
        persistRoadmap(merged, result)
      }
    },
    [persistRoadmap, displayResult]
  )

  return (
    <CareerEnginePathPage
      goalId="start_new_career"
      shouldPersistResult={(result) =>
        typeof result === 'object' &&
        result != null &&
        'phase' in result &&
        (result as StartNewCareerEngineResult).phase === 'roadmap'
      }
      buildStructuredResult={buildStructuredResult}
      renderStructuredResult={(result, isGuest) => (
        <StartNewCareerEngineResultView
          result={(displayResult ?? result) as StartNewCareerEngineResult}
          isGuest={isGuest}
          onConfirmCareer={handleConfirmCareer}
        />
      )}
    />
  )
}
