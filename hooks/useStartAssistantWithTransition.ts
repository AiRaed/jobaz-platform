'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getAssistantTransitionDuration,
  prefersReducedMotion,
} from '@/components/ui/JazBrainTransition'

/**
 * Runs the Career Assistant entry delay (respects prefers-reduced-motion).
 * Returns a promise that resolves when the transition should finish.
 */
export function waitForAssistantTransition(): Promise<number> {
  const reduced = prefersReducedMotion()
  const ms = getAssistantTransitionDuration(reduced)
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(ms), ms)
  })
}

/**
 * Local UI helper: `running` flips true for the transition window.
 */
export function useAssistantEntryTransition() {
  const [running, setRunning] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setReducedMotion(prefersReducedMotion())
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setReducedMotion(mq.matches)
    mq.addEventListener?.('change', onChange)
    return () => mq.removeEventListener?.('change', onChange)
  }, [])

  const run = useCallback(async () => {
    setRunning(true)
    await waitForAssistantTransition()
    setRunning(false)
  }, [])

  return { running, run, reducedMotion, setRunning }
}
