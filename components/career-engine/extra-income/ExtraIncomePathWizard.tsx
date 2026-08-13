'use client'

/**
 * Looking for Extra Income wizard (MVP):
 * Category → Option → Result
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { PublicExtraIncomeResult } from '@/lib/career-engine/extra-income/library'
import { OptionCard } from '@/components/career-engine/work-in-education/wizard/OptionCard'
import { ProgressBar } from '@/components/career-engine/work-in-education/wizard/ProgressBar'
import { QuestionCard } from '@/components/career-engine/work-in-education/wizard/QuestionCard'
import { CaWizardNav } from '@/components/career-engine/shared'
import { PublicExtraIncomeResultExperience } from './PublicExtraIncomeResultExperience'
import { clearAddToPlanSessionState } from '@/lib/career-assistant/add-to-my-plan/clearAddToPlanSession'
import { cn } from '@/lib/utils'

type StepId = 'category' | 'option' | 'results'

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
  { id: 'category', label: 'Route type' },
  { id: 'option', label: 'Option' },
  { id: 'results', label: 'Result' },
]

function step2Copy(categoryId: string | null): {
  title: string
  description: string
  cardBadge: string
} {
  if (categoryId === 'start_without_licence') {
    return {
      title: 'Which job option do you want to try?',
      description: 'These options usually do not need a formal licence before applying.',
      cardBadge: 'Job option',
    }
  }
  if (categoryId === 'quick_shifts_short_training') {
    return {
      title: 'Which quick-shift work route interests you?',
      description:
        'Choose the type of shift work you want. JobAZ will show the short training that can help.',
      cardBadge: 'Shift work route',
    }
  }
  if (categoryId === 'licence_based') {
    return {
      title: 'Which licence-based work route interests you?',
      description:
        'Choose the type of work you want. JobAZ will show the licence, certificate, or check needed.',
      cardBadge: 'Licence-based work route',
    }
  }
  if (categoryId === 'online_from_home') {
    return {
      title: 'Which online or home-based option interests you?',
      description: 'Choose a flexible option you could build from home or online.',
      cardBadge: 'Online option',
    }
  }
  return {
    title: 'Which option interests you most?',
    description: 'Choose one Extra Income option to see a practical result.',
    cardBadge: 'Option',
  }
}

export function ExtraIncomePathWizard({
  className,
  sessionKey = 'jobaz.extra_income.library_path.v1',
}: Props) {
  const [hydrated, setHydrated] = useState(false)
  const [stepId, setStepId] = useState<StepId>('category')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [optionId, setOptionId] = useState<string | null>(null)

  const [categories, setCategories] = useState<LibraryOption[]>([])
  const [options, setOptions] = useState<LibraryOption[]>([])

  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)

  const [matchLoading, setMatchLoading] = useState(false)
  const [matchError, setMatchError] = useState<string | null>(null)
  const [result, setResult] = useState<PublicExtraIncomeResult | null>(null)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const requestSeq = useRef(0)

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(sessionKey) : null
      if (raw) {
        const parsed = JSON.parse(raw) as {
          step_id?: StepId
          category_id?: string | null
          option_id?: string | null
        }
        if (parsed.step_id && parsed.step_id !== 'results') setStepId(parsed.step_id)
        if (parsed.category_id) setCategoryId(parsed.category_id)
        if (parsed.option_id) setOptionId(parsed.option_id)
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
          category_id: categoryId,
          option_id: optionId,
          updated_at: new Date().toISOString(),
        })
      )
    } catch {
      // ignore
    }
  }, [hydrated, sessionKey, stepId, categoryId, optionId])

  useEffect(() => {
    headingRef.current?.focus()
  }, [stepId])

  const loadCategories = useCallback(async () => {
    const seq = ++requestSeq.current
    setListLoading(true)
    setListError(null)
    try {
      const res = await fetch('/api/career-assistant/extra-income/library/categories')
      const data = (await res.json()) as {
        categories?: Array<{ id: string; label: string; short_description?: string }>
        error?: string
      }
      if (requestSeq.current !== seq) return
      if (!res.ok) {
        setListError(data.error || 'Could not load Extra Income categories.')
        setCategories([])
        return
      }
      setCategories(
        (data.categories || []).map((c) => ({
          id: c.id,
          label: c.label,
          description: c.short_description,
        }))
      )
    } catch {
      if (requestSeq.current === seq) setListError('Could not load Extra Income categories.')
    } finally {
      if (requestSeq.current === seq) setListLoading(false)
    }
  }, [])

  const loadOptions = useCallback(async (cat: string) => {
    const seq = ++requestSeq.current
    setListLoading(true)
    setListError(null)
    try {
      const res = await fetch(
        `/api/career-assistant/extra-income/library/options?category_id=${encodeURIComponent(cat)}`
      )
      const data = (await res.json()) as {
        options?: Array<{ id: string; option_title: string; short_description?: string }>
        error?: string
      }
      if (requestSeq.current !== seq) return
      if (!res.ok) {
        setListError(data.error || 'Could not load options.')
        setOptions([])
        return
      }
      setOptions(
        (data.options || []).map((o) => ({
          id: o.id,
          label: o.option_title,
          description: o.short_description,
        }))
      )
    } catch {
      if (requestSeq.current === seq) setListError('Could not load options.')
    } finally {
      if (requestSeq.current === seq) setListLoading(false)
    }
  }, [])

  const runMatch = useCallback(async (cat: string, opt: string) => {
    setMatchLoading(true)
    setMatchError(null)
    setResult(null)
    try {
      const res = await fetch('/api/career-assistant/extra-income/library/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category_id: cat, option_id: opt }),
      })
      const data = (await res.json()) as {
        result?: PublicExtraIncomeResult
        error?: string
      }
      if (!res.ok || !data.result) {
        setMatchError(data.error || 'Could not build your Extra Income result.')
        return
      }
      setResult(data.result)
      clearAddToPlanSessionState()
      setStepId('results')
    } catch {
      setMatchError('Could not build your Extra Income result.')
    } finally {
      setMatchLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!hydrated) return
    if (stepId === 'category') void loadCategories()
    if (stepId === 'option' && categoryId) void loadOptions(categoryId)
  }, [hydrated, stepId, categoryId, loadCategories, loadOptions])

  useEffect(() => {
    if (!hydrated) return
    if (stepId === 'results' && categoryId && optionId && !result && !matchLoading) {
      void runMatch(categoryId, optionId)
    }
  }, [hydrated, stepId, categoryId, optionId, result, matchLoading, runMatch])

  const stepIndex = Math.max(
    0,
    STEP_DEFS.findIndex((s) => s.id === stepId)
  )
  const optionStep = step2Copy(categoryId)

  const startAgain = () => {
    setStepId('category')
    setCategoryId(null)
    setOptionId(null)
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
            <p className="text-sm">Building your Extra Income option…</p>
            {matchError ? <p className="text-sm text-rose-300">{matchError}</p> : null}
          </div>
        </div>
      )
    }
    return (
      <div className={cn('space-y-4', className)}>
        <PublicExtraIncomeResultExperience result={result} onStartAgain={startAgain} />
      </div>
    )
  }

  return (
    <div className={cn('space-y-5', className)}>
      <ProgressBar steps={STEP_DEFS} currentIndex={stepIndex} />
      <h2 ref={headingRef} tabIndex={-1} className="sr-only">
        {STEP_DEFS[stepIndex]?.label}
      </h2>

      {stepId === 'category' ? (
        <QuestionCard
          title="What kind of extra income route do you want?"
          description="Pick the route style that fits how you want to earn extra money in the UK."
        >
          {listLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            </div>
          ) : listError ? (
            <p className="text-sm text-rose-300">{listError}</p>
          ) : (
            <div className="grid gap-2">
              {categories.map((c) => (
                <OptionCard
                  key={c.id}
                  name="ei-category"
                  value={c.id}
                  label={c.label}
                  helpText={c.description || undefined}
                  selected={categoryId === c.id}
                  onSelect={(v) => {
                    setCategoryId(v)
                    setOptionId(null)
                    setResult(null)
                    setStepId('option')
                  }}
                />
              ))}
            </div>
          )}
        </QuestionCard>
      ) : null}

      {stepId === 'option' ? (
        <QuestionCard title={optionStep.title} description={optionStep.description}>
          {listLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
            </div>
          ) : listError ? (
            <p className="text-sm text-rose-300">{listError}</p>
          ) : (
            <div className="grid gap-2">
              {options.map((o) => (
                <OptionCard
                  key={o.id}
                  name="ei-option"
                  value={o.id}
                  label={o.label}
                  badge={optionStep.cardBadge}
                  helpText={o.description || undefined}
                  selected={optionId === o.id}
                  onSelect={(v) => {
                    setOptionId(v)
                    setResult(null)
                    if (categoryId) void runMatch(categoryId, v)
                  }}
                />
              ))}
            </div>
          )}
        </QuestionCard>
      ) : null}

      <CaWizardNav
        showBack={stepId !== 'category'}
        onBack={() => {
          setStepId('category')
          setOptionId(null)
          setResult(null)
        }}
        onStartOver={startAgain}
        disabled={listLoading || matchLoading}
      />
    </div>
  )
}
