'use client'

/**
 * Start New Career wizard (MVP): Work type → Career route → Result
 * No level/experience question — beginner default.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { PublicSncResult } from '@/lib/career-engine/start-new-career/library'
import { OptionCard } from '@/components/career-engine/work-in-education/wizard/OptionCard'
import { ProgressBar } from '@/components/career-engine/work-in-education/wizard/ProgressBar'
import { QuestionCard } from '@/components/career-engine/work-in-education/wizard/QuestionCard'
import { CaWizardNav } from '@/components/career-engine/shared'
import { PublicStartNewCareerResultExperience } from './PublicStartNewCareerResultExperience'
import { clearAddToPlanSessionState } from '@/lib/career-assistant/add-to-my-plan/clearAddToPlanSession'
import { cn } from '@/lib/utils'

type StepId = 'work_type' | 'route' | 'results'

type LibraryOption = {
  id: string
  label: string
  description?: string | null
}

type Props = {
  className?: string
  sessionKey?: string
}

const STEP_DEFS: { id: StepId; label: string }[] = [
  { id: 'work_type', label: 'Work type' },
  { id: 'route', label: 'Career route' },
  { id: 'results', label: 'Result' },
]

export function StartNewCareerPathWizard({
  className,
  sessionKey = 'jobaz.start_new_career.library_path.v1',
}: Props) {
  const [hydrated, setHydrated] = useState(false)
  const [stepId, setStepId] = useState<StepId>('work_type')
  const [workTypeId, setWorkTypeId] = useState<string | null>(null)
  const [routeId, setRouteId] = useState<string | null>(null)

  const [workTypes, setWorkTypes] = useState<LibraryOption[]>([])
  const [routes, setRoutes] = useState<LibraryOption[]>([])

  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const [matchLoading, setMatchLoading] = useState(false)
  const [matchError, setMatchError] = useState<string | null>(null)
  const [result, setResult] = useState<PublicSncResult | null>(null)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const requestSeq = useRef(0)

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(sessionKey) : null
      if (raw) {
        const parsed = JSON.parse(raw) as {
          step_id?: StepId
          work_type_id?: string | null
          route_id?: string | null
        }
        if (parsed.step_id && parsed.step_id !== 'results') setStepId(parsed.step_id)
        if (parsed.work_type_id) setWorkTypeId(parsed.work_type_id)
        if (parsed.route_id) setRouteId(parsed.route_id)
      }
    } catch {
      // ignore
    }
    setHydrated(true)
  }, [sessionKey])

  useEffect(() => {
    if (!hydrated) return
    try {
      window.sessionStorage.setItem(
        sessionKey,
        JSON.stringify({
          step_id: stepId,
          work_type_id: workTypeId,
          route_id: routeId,
          updated_at: new Date().toISOString(),
        })
      )
    } catch {
      // ignore
    }
  }, [hydrated, sessionKey, stepId, workTypeId, routeId])

  useEffect(() => {
    headingRef.current?.focus()
  }, [stepId])

  const loadWorkTypes = useCallback(async () => {
    const seq = ++requestSeq.current
    setListLoading(true)
    setListError(null)
    try {
      const res = await fetch('/api/career-assistant/start-new-career/library/work-types')
      const data = (await res.json()) as {
        work_types?: Array<{ id: string; label: string; short_description?: string }>
        error?: string
      }
      if (requestSeq.current !== seq) return
      if (!res.ok) {
        setListError(data.error || 'Could not load work types.')
        setWorkTypes([])
        return
      }
      setWorkTypes(
        (data.work_types || []).map((w) => ({
          id: w.id,
          label: w.label,
          description: w.short_description,
        }))
      )
    } catch {
      if (requestSeq.current === seq) setListError('Could not load work types.')
    } finally {
      if (requestSeq.current === seq) setListLoading(false)
    }
  }, [])

  const loadRoutes = useCallback(async (wt: string) => {
    const seq = ++requestSeq.current
    setListLoading(true)
    setListError(null)
    try {
      const res = await fetch(
        `/api/career-assistant/start-new-career/library/routes?work_type_id=${encodeURIComponent(wt)}`
      )
      const data = (await res.json()) as {
        routes?: Array<{ id: string; label: string; short_description?: string }>
        error?: string
      }
      if (requestSeq.current !== seq) return
      if (!res.ok) {
        setListError(data.error || 'Could not load career routes.')
        setRoutes([])
        return
      }
      setRoutes(
        (data.routes || []).map((r) => ({
          id: r.id,
          label: r.label,
          description: r.short_description,
        }))
      )
    } catch {
      if (requestSeq.current === seq) setListError('Could not load career routes.')
    } finally {
      if (requestSeq.current === seq) setListLoading(false)
    }
  }, [])

  const runMatch = useCallback(async (wt: string, route: string) => {
    setMatchLoading(true)
    setMatchError(null)
    setResult(null)
    try {
      const res = await fetch('/api/career-assistant/start-new-career/library/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ work_type_id: wt, route_id: route }),
      })
      const data = (await res.json()) as {
        result?: PublicSncResult
        error?: string
      }
      if (!res.ok || !data.result) {
        setMatchError(data.error || 'Could not build your Start New Career result.')
        return
      }
      setResult(data.result)
      clearAddToPlanSessionState()
      setStepId('results')
    } catch {
      setMatchError('Could not build your Start New Career result.')
    } finally {
      setMatchLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (stepId === 'work_type') void loadWorkTypes()
    if (stepId === 'route' && workTypeId) void loadRoutes(workTypeId)
  }, [hydrated, stepId, workTypeId, loadWorkTypes, loadRoutes])

  useEffect(() => {
    if (!hydrated) return
    if (stepId === 'results' && workTypeId && routeId && !result && !matchLoading) {
      void runMatch(workTypeId, routeId)
    }
  }, [hydrated, stepId, workTypeId, routeId, result, matchLoading, runMatch])

  const stepIndex = Math.max(
    0,
    STEP_DEFS.findIndex((s) => s.id === stepId)
  )

  const startAgain = () => {
    setStepId('work_type')
    setWorkTypeId(null)
    setRouteId(null)
    setResult(null)
    setMatchError(null)
    try {
      window.sessionStorage.removeItem(sessionKey)
    } catch {
      // ignore
    }
    clearAddToPlanSessionState()
  }

  if (!hydrated) {
    return (
      <div className={cn('flex justify-center py-16', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" aria-hidden />
      </div>
    )
  }

  if (stepId === 'results') {
    if (matchLoading || !result) {
      return (
        <div className={cn('space-y-4', className)}>
          <ProgressBar steps={STEP_DEFS} currentIndex={stepIndex} />
          <div className="flex flex-col items-center gap-3 py-16 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-cyan-400" aria-hidden />
            <p className="text-sm">Building your new career route…</p>
            {matchError ? <p className="text-sm text-rose-300">{matchError}</p> : null}
          </div>
        </div>
      )
    }
    return (
      <div className={cn('space-y-4', className)}>
        <PublicStartNewCareerResultExperience result={result} onStartAgain={startAgain} />
      </div>
    )
  }

  return (
    <div className={cn('space-y-5', className)}>
      <ProgressBar steps={STEP_DEFS} currentIndex={stepIndex} />
      <h2 ref={headingRef} tabIndex={-1} className="sr-only">
        {STEP_DEFS[stepIndex]?.label}
      </h2>

      {stepId === 'work_type' ? (
        <QuestionCard
          title="What type of new career are you interested in?"
          description="Pick a broad work type. We’ll show beginner-friendly starter routes next."
        >
          {listLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            </div>
          ) : listError ? (
            <p className="text-sm text-rose-300">{listError}</p>
          ) : (
            <div className="grid gap-2">
              {workTypes.map((w) => (
                <OptionCard
                  key={w.id}
                  name="snc-work-type"
                  value={w.id}
                  label={w.label}
                  helpText={w.description || undefined}
                  selected={workTypeId === w.id}
                  onSelect={(v) => {
                    setWorkTypeId(v)
                    setRouteId(null)
                    setResult(null)
                    setStepId('route')
                  }}
                />
              ))}
            </div>
          )}
        </QuestionCard>
      ) : null}

      {stepId === 'route' ? (
        <QuestionCard
          title="Which starter career route interests you?"
          description="Choose one beginner-friendly route. We’ll assume you’re starting from scratch."
        >
          {listLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            </div>
          ) : listError ? (
            <p className="text-sm text-rose-300">{listError}</p>
          ) : (
            <div className="grid gap-2">
              {routes.map((r) => (
                <OptionCard
                  key={r.id}
                  name="snc-route"
                  value={r.id}
                  label={r.label}
                  helpText={r.description || undefined}
                  selected={routeId === r.id}
                  onSelect={(v) => {
                    setRouteId(v)
                    setResult(null)
                    if (workTypeId) void runMatch(workTypeId, v)
                  }}
                />
              ))}
            </div>
          )}
        </QuestionCard>
      ) : null}

      <CaWizardNav
        showBack={stepId !== 'work_type'}
        onBack={() => {
          setStepId('work_type')
          setRouteId(null)
          setResult(null)
        }}
        onStartOver={startAgain}
        disabled={listLoading || matchLoading}
      />
    </div>
  )
}
