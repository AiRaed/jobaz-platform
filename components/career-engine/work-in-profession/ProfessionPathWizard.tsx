'use client'

/**
 * Work in My Profession wizard:
 * Field → Specialism → Experience (contextual) → Results
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { PublicWipMatchResult } from '@/lib/career-engine/work-in-profession'
import { OptionCard } from '@/components/career-engine/work-in-education/wizard/OptionCard'
import { ProgressBar } from '@/components/career-engine/work-in-education/wizard/ProgressBar'
import { QuestionCard } from '@/components/career-engine/work-in-education/wizard/QuestionCard'
import { CaWizardNav } from '@/components/career-engine/shared'
import { PublicWipResultExperience } from './PublicWipResultExperience'
import { clearAddToPlanSessionState } from '@/lib/career-assistant/add-to-my-plan/clearAddToPlanSession'
import { cn } from '@/lib/utils'

type StepId = 'field' | 'specialism' | 'level' | 'results'

type LibraryOption = {
  id: string
  slug: string
  name: string
  description?: string | null
}

type ExperienceOptionUi = {
  id: string
  label: string
  display_label: string
  description?: string
}

type Props = {
  className?: string
  sessionKey?: string
  adminMode?: boolean
}

const STEP_DEFS: { id: StepId; label: string }[] = [
  { id: 'field', label: 'Profession' },
  { id: 'specialism', label: 'Trade area' },
  { id: 'level', label: 'Experience' },
  { id: 'results', label: 'Result' },
]

export function ProfessionPathWizard({
  className,
  sessionKey = 'jobaz.wip.library_path.v1',
  adminMode = false,
}: Props) {
  const [hydrated, setHydrated] = useState(false)
  const [stepId, setStepId] = useState<StepId>('field')
  const [fieldSlug, setFieldSlug] = useState<string | null>(null)
  const [specialismSlug, setSpecialismSlug] = useState<string | null>(null)
  const [experienceOptionId, setExperienceOptionId] = useState<string | null>(null)

  const [fields, setFields] = useState<LibraryOption[]>([])
  const [specialisms, setSpecialisms] = useState<LibraryOption[]>([])
  const [experienceOptions, setExperienceOptions] = useState<ExperienceOptionUi[]>([])
  const [experienceQuestion, setExperienceQuestion] = useState({
    question: 'What level best describes your experience?',
    description: 'Use practical work levels — not university stages.',
  })

  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null)

  const [matchLoading, setMatchLoading] = useState(false)
  const [matchError, setMatchError] = useState<string | null>(null)
  const [result, setResult] = useState<PublicWipMatchResult | null>(null)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const requestSeq = useRef(0)

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(sessionKey) : null
      if (raw) {
        const parsed = JSON.parse(raw) as {
          step_id?: StepId | 'goal'
          field_slug?: string | null
          specialism_slug?: string | null
          experience_option_id?: string | null
          professional_level?: string | null
        }
        // Migrate old sessions that stopped on the removed goal step.
        if (parsed.step_id === 'goal') setStepId('level')
        else if (parsed.step_id && parsed.step_id !== 'results') setStepId(parsed.step_id)
        if (parsed.field_slug) setFieldSlug(parsed.field_slug)
        if (parsed.specialism_slug) setSpecialismSlug(parsed.specialism_slug)
        if (parsed.experience_option_id) setExperienceOptionId(parsed.experience_option_id)
        else if (parsed.professional_level) setExperienceOptionId(parsed.professional_level)
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
          field_slug: fieldSlug,
          specialism_slug: specialismSlug,
          experience_option_id: experienceOptionId,
          updated_at: new Date().toISOString(),
        })
      )
    } catch {
      // ignore
    }
  }, [hydrated, sessionKey, stepId, fieldSlug, specialismSlug, experienceOptionId])

  useEffect(() => {
    headingRef.current?.focus()
  }, [stepId])

  const loadFields = useCallback(async () => {
    const seq = ++requestSeq.current
    setListLoading(true)
    setListError(null)
    setEmptyMessage(null)
    try {
      const res = await fetch('/api/career-assistant/work-in-my-profession/library/fields')
      const data = await res.json()
      if (requestSeq.current !== seq) return
      if (!res.ok) {
        setListError(data.error || 'Could not load profession fields.')
        setFields([])
        return
      }
      setFields(
        (data.fields || []).map((f: LibraryOption) => ({
          id: f.id,
          slug: f.slug,
          name: f.name,
          description: f.description,
        }))
      )
      if (data.empty) setEmptyMessage(data.message || 'No profession fields available.')
    } catch {
      if (requestSeq.current === seq) setListError('Could not load profession fields.')
    } finally {
      if (requestSeq.current === seq) setListLoading(false)
    }
  }, [])

  const loadSpecialisms = useCallback(async (slug: string) => {
    const seq = ++requestSeq.current
    setListLoading(true)
    setListError(null)
    setEmptyMessage(null)
    setSpecialisms([])
    try {
      const res = await fetch(
        `/api/career-assistant/work-in-my-profession/library/specialisms?field_slug=${encodeURIComponent(slug)}`
      )
      const data = await res.json()
      if (requestSeq.current !== seq) return
      if (!res.ok) {
        setListError(data.error || 'Could not load specialisms.')
        return
      }
      setSpecialisms(
        (data.specialisms || []).map((s: LibraryOption) => ({
          id: s.id,
          slug: s.slug,
          name: s.name,
          description: s.description,
        }))
      )
      if (data.empty) setEmptyMessage(data.message || 'No specialisms available.')
    } catch {
      if (requestSeq.current === seq) setListError('Could not load specialisms.')
    } finally {
      if (requestSeq.current === seq) setListLoading(false)
    }
  }, [])

  const loadExperienceOptions = useCallback(async (fSlug: string, sSlug: string) => {
    const seq = ++requestSeq.current
    setListLoading(true)
    setListError(null)
    setEmptyMessage(null)
    setExperienceOptions([])
    try {
      const res = await fetch(
        `/api/career-assistant/work-in-my-profession/library/levels?field_slug=${encodeURIComponent(fSlug)}&specialism_slug=${encodeURIComponent(sSlug)}`
      )
      const data = await res.json()
      if (requestSeq.current !== seq) return
      if (!res.ok) {
        setListError(data.error || 'Could not load experience options.')
        return
      }
      setExperienceQuestion({
        question: data.question || 'What level best describes your experience?',
        description:
          data.description || 'Use practical work levels — not university stages.',
      })
      setExperienceOptions(
        (data.options || []).map((o: ExperienceOptionUi) => ({
          id: o.id,
          label: o.label,
          display_label: o.display_label || o.label,
          description: o.description,
        }))
      )
    } catch {
      if (requestSeq.current === seq) setListError('Could not load experience options.')
    } finally {
      if (requestSeq.current === seq) setListLoading(false)
    }
  }, [])

  const runMatch = useCallback(
    async (payload: {
      field_slug: string
      specialism_slug: string
      experience_option_id: string
    }) => {
      setMatchLoading(true)
      setMatchError(null)
      setResult(null)
      try {
        const res = await fetch('/api/career-assistant/work-in-my-profession/library/match', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        const data = await res.json()
        if (!res.ok) {
          setMatchError(data.error || 'Could not match profession roles.')
          return
        }
        setResult(data.result as PublicWipMatchResult)
        clearAddToPlanSessionState()
        setStepId('results')
      } catch {
        setMatchError('Could not match profession roles.')
      } finally {
        setMatchLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!hydrated) return
    if (stepId === 'field') void loadFields()
    if (stepId === 'specialism' && fieldSlug) void loadSpecialisms(fieldSlug)
    if (stepId === 'level' && fieldSlug && specialismSlug) {
      void loadExperienceOptions(fieldSlug, specialismSlug)
    }
  }, [
    hydrated,
    stepId,
    fieldSlug,
    specialismSlug,
    loadFields,
    loadSpecialisms,
    loadExperienceOptions,
  ])

  const stepIndex = Math.max(
    0,
    STEP_DEFS.findIndex((s) => s.id === stepId)
  )

  const startAgain = () => {
    setStepId('field')
    setFieldSlug(null)
    setSpecialismSlug(null)
    setExperienceOptionId(null)
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
      <div className={cn('flex items-center justify-center py-16', className)}>
        <Loader2 className="h-6 w-6 animate-spin text-cyan-400" aria-hidden />
      </div>
    )
  }

  if (stepId === 'results' && result) {
    return (
      <div className={className}>
        <PublicWipResultExperience
          result={result}
          onStartAgain={startAgain}
          showDebug={adminMode}
        />
      </div>
    )
  }

  return (
    <div className={cn('space-y-5', className)}>
      <h1 ref={headingRef} tabIndex={-1} className="sr-only">
        Work in My Profession
      </h1>
      <ProgressBar steps={STEP_DEFS} currentIndex={stepIndex} />

      {listError ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-sm text-rose-100">
          {listError}
        </p>
      ) : null}
      {matchError ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-sm text-rose-100">
          {matchError}
        </p>
      ) : null}
      {emptyMessage ? (
        <p className="rounded-xl border border-amber-500/25 bg-amber-950/20 px-3 py-2 text-sm text-amber-100">
          {emptyMessage}
        </p>
      ) : null}

      {stepId === 'field' ? (
        <QuestionCard
          title="What profession or industry is most of your experience in?"
          description="Choose the area that best matches your practical work experience — not your degree subject."
        >
          {listLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400" aria-hidden />
            </div>
          ) : (
            <div className="space-y-2">
              {fields.map((f) => (
                <OptionCard
                  key={f.slug}
                  name="wip-field"
                  value={f.slug}
                  label={f.name}
                  helpText={f.description || undefined}
                  selected={fieldSlug === f.slug}
                  onSelect={(v) => {
                    setFieldSlug(v)
                    setSpecialismSlug(null)
                    setExperienceOptionId(null)
                    setStepId('specialism')
                  }}
                />
              ))}
            </div>
          )}
        </QuestionCard>
      ) : null}

      {stepId === 'specialism' ? (
        <QuestionCard
          title="What is your specific profession or trade area?"
          description="Pick the specialism closest to the work you have done."
        >
          {listLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400" aria-hidden />
            </div>
          ) : (
            <div className="space-y-2">
              {specialisms.map((s) => (
                <OptionCard
                  key={s.slug}
                  name="wip-specialism"
                  value={s.slug}
                  label={s.name}
                  helpText={s.description || undefined}
                  selected={specialismSlug === s.slug}
                  onSelect={(v) => {
                    setSpecialismSlug(v)
                    setExperienceOptionId(null)
                    setStepId('level')
                  }}
                />
              ))}
            </div>
          )}
        </QuestionCard>
      ) : null}

      {stepId === 'level' ? (
        <QuestionCard
          title={experienceQuestion.question}
          description={experienceQuestion.description}
        >
          {listLoading || matchLoading ? (
            <div className="flex flex-col items-center gap-2 py-10">
              <Loader2 className="h-6 w-6 animate-spin text-cyan-400" aria-hidden />
              <p className="text-sm text-slate-400">
                {matchLoading ? 'Matching UK target roles…' : 'Loading…'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {experienceOptions.map((o) => (
                <OptionCard
                  key={o.id}
                  name="wip-experience"
                  value={o.id}
                  label={o.label}
                  helpText={o.description}
                  selected={experienceOptionId === o.id}
                  onSelect={(v) => {
                    setExperienceOptionId(v)
                    if (fieldSlug && specialismSlug) {
                      void runMatch({
                        field_slug: fieldSlug,
                        specialism_slug: specialismSlug,
                        experience_option_id: v,
                      })
                    }
                  }}
                />
              ))}
            </div>
          )}
        </QuestionCard>
      ) : null}

      <CaWizardNav
        showBack={stepId !== 'field'}
        onBack={() => {
          if (stepId === 'level') {
            setStepId('specialism')
            setExperienceOptionId(null)
            setResult(null)
          } else if (stepId === 'specialism') {
            setStepId('field')
            setSpecialismSlug(null)
            setExperienceOptionId(null)
          }
        }}
        onStartOver={startAgain}
        disabled={listLoading || matchLoading}
      />
    </div>
  )
}
