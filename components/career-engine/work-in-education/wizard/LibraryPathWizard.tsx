'use client'

/**
 * Library-driven Work in My Education wizard:
 * Field → Specialism → Stage → Completed courses → Results
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import type { PublicWieAssessmentResult } from '@/lib/career-engine/work-in-education/public-contract'
import {
  clearWizardSession,
  savePublicResultHandoff,
  clearPublicResultHandoff,
  WIZARD_SESSION_KEY,
} from '@/lib/career-engine/work-in-education/wizard'
import {
  normalizeCompletedCoursesSelection,
  WIE_COMPLETED_NONE_ID,
  WIE_COMPLETED_NOT_SURE_ID,
  WIE_COMPLETED_OTHER_ID,
  type WieCompletedCourseOption,
} from '@/lib/career-engine/work-in-education/course-alignment'
import { saveWieTrainingHandoffs } from '@/lib/career-engine/work-in-education/wizard/training-handoff'
import { clearAddToPlanSessionState } from '@/lib/career-assistant/add-to-my-plan/clearAddToPlanSession'
import { trackJazEvent } from '@/lib/analytics/jazTrackEvent'
import { cn } from '@/lib/utils'
import { OptionCard } from './OptionCard'
import { ProgressBar } from './ProgressBar'
import { QuestionCard } from './QuestionCard'
import { PublicResultExperience } from './PublicResultExperience'
import { WarningCard } from './WarningCard'

type StepId = 'field' | 'specialism' | 'stage' | 'completed_courses' | 'results'

type LibraryOption = { id: string; name: string; description?: string | null; label?: string }

type Props = {
  className?: string
  sessionKey?: string
  resultHref?: string
  adminMode?: boolean
  compact?: boolean
}

const STEP_DEFS: { id: StepId; label: string }[] = [
  { id: 'field', label: 'Field' },
  { id: 'specialism', label: 'Specialism' },
  { id: 'stage', label: 'Stage' },
  { id: 'completed_courses', label: 'Training' },
  { id: 'results', label: 'Results' },
]

export function LibraryPathWizard({
  className,
  sessionKey = 'jobaz.wie.library_path.v1',
  resultHref,
  adminMode = false,
  compact = false,
}: Props) {
  const [hydrated, setHydrated] = useState(false)
  const [stepId, setStepId] = useState<StepId>('field')
  const [fieldId, setFieldId] = useState<string | null>(null)
  const [specialismId, setSpecialismId] = useState<string | null>(null)
  const [stageId, setStageId] = useState<string | null>(null)
  const [completedIds, setCompletedIds] = useState<string[]>([])
  const [completedNotes, setCompletedNotes] = useState('')

  const [fields, setFields] = useState<LibraryOption[]>([])
  const [specialisms, setSpecialisms] = useState<LibraryOption[]>([])
  const [stages, setStages] = useState<LibraryOption[]>([])
  const [courseOptions, setCourseOptions] = useState<WieCompletedCourseOption[]>([])

  const [listLoading, setListLoading] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [emptyMessage, setEmptyMessage] = useState<string | null>(null)

  const [matchLoading, setMatchLoading] = useState(false)
  const [matchError, setMatchError] = useState<string | null>(null)
  const [publicResult, setPublicResult] = useState<PublicWieAssessmentResult | null>(null)

  const headingRef = useRef<HTMLHeadingElement>(null)
  const requestSeq = useRef(0)

  const optionLabelsById = useMemo(() => {
    const map: Record<string, string> = {}
    for (const o of courseOptions) map[o.id] = o.label
    return map
  }, [courseOptions])

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? window.sessionStorage.getItem(sessionKey) : null
      if (raw) {
        const parsed = JSON.parse(raw) as {
          step_id?: StepId
          field_id?: string | null
          specialism_id?: string | null
          stage_id?: string | null
          completed_ids?: string[]
          completed_notes?: string
        }
        if (parsed.step_id && parsed.step_id !== 'results') setStepId(parsed.step_id)
        if (parsed.field_id) setFieldId(parsed.field_id)
        if (parsed.specialism_id) setSpecialismId(parsed.specialism_id)
        if (parsed.stage_id) setStageId(parsed.stage_id)
        if (Array.isArray(parsed.completed_ids)) setCompletedIds(parsed.completed_ids)
        if (typeof parsed.completed_notes === 'string') setCompletedNotes(parsed.completed_notes)
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
          field_id: fieldId,
          specialism_id: specialismId,
          stage_id: stageId,
          completed_ids: completedIds,
          completed_notes: completedNotes,
          updated_at: new Date().toISOString(),
        })
      )
    } catch {
      // ignore
    }
  }, [hydrated, sessionKey, stepId, fieldId, specialismId, stageId, completedIds, completedNotes])

  useEffect(() => {
    headingRef.current?.focus()
  }, [stepId])

  const loadFields = useCallback(async () => {
    const seq = ++requestSeq.current
    setListLoading(true)
    setListError(null)
    setEmptyMessage(null)
    try {
      const res = await fetch('/api/career-assistant/work-in-my-education/library/fields')
      const data = await res.json()
      if (requestSeq.current !== seq) return
      if (!res.ok) {
        setListError(data.error || 'Could not load career fields.')
        setFields([])
        return
      }
      setFields(
        (data.fields || []).map((f: { id: string; name: string; description?: string }) => ({
          id: f.id,
          name: f.name,
          description: f.description,
        }))
      )
      if (data.empty) setEmptyMessage(data.message || 'No career fields available.')
    } catch {
      if (requestSeq.current === seq) setListError('Could not load career fields.')
    } finally {
      if (requestSeq.current === seq) setListLoading(false)
    }
  }, [])

  const loadSpecialisms = useCallback(async (fid: string) => {
    const seq = ++requestSeq.current
    setListLoading(true)
    setListError(null)
    setEmptyMessage(null)
    setSpecialisms([])
    try {
      const res = await fetch(
        `/api/career-assistant/work-in-my-education/library/specialisms?field_id=${encodeURIComponent(fid)}`
      )
      const data = await res.json()
      if (requestSeq.current !== seq) return
      if (!res.ok) {
        setListError(data.error || 'Could not load specialisms.')
        return
      }
      setSpecialisms(
        (data.specialisms || []).map((s: { id: string; name: string; description?: string }) => ({
          id: s.id,
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

  const loadStages = useCallback(async (sid: string) => {
    const seq = ++requestSeq.current
    setListLoading(true)
    setListError(null)
    setEmptyMessage(null)
    setStages([])
    try {
      const res = await fetch(
        `/api/career-assistant/work-in-my-education/library/stages?specialism_id=${encodeURIComponent(sid)}`
      )
      const data = await res.json()
      if (requestSeq.current !== seq) return
      if (!res.ok) {
        setListError(data.error || 'Could not load stages.')
        return
      }
      setStages(
        (data.stages || []).map((s: { id: string; label: string; stage_key: string }) => ({
          id: s.id,
          name: s.label,
          label: s.label,
          description: s.stage_key,
        }))
      )
      if (data.empty) setEmptyMessage(data.message || 'No stages available.')
    } catch {
      if (requestSeq.current === seq) setListError('Could not load stages.')
    } finally {
      if (requestSeq.current === seq) setListLoading(false)
    }
  }, [])

  const loadCourseOptions = useCallback(
    async (fid: string, sid: string, stid: string) => {
      const seq = ++requestSeq.current
      setListLoading(true)
      setListError(null)
      setCourseOptions([])
      try {
        const qs = new URLSearchParams({
          field_id: fid,
          specialism_id: sid,
          stage_id: stid,
        })
        const res = await fetch(
          `/api/career-assistant/work-in-my-education/library/completed-courses?${qs.toString()}`
        )
        const data = await res.json()
        if (requestSeq.current !== seq) return
        if (!res.ok) {
          setListError(data.error || 'Could not load related courses.')
          return
        }
        setCourseOptions((data.options || []) as WieCompletedCourseOption[])
        void trackJazEvent({
          event_type: 'wie_courses_question_shown',
          event_source: 'work_in_education_library_wizard',
          goal_path: 'work_in_education',
          metadata: { option_count: (data.options || []).length },
        })
      } catch {
        if (requestSeq.current === seq) setListError('Could not load related courses.')
      } finally {
        if (requestSeq.current === seq) setListLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (!hydrated) return
    if (stepId === 'field') void loadFields()
  }, [hydrated, stepId, loadFields])

  useEffect(() => {
    if (!hydrated || stepId !== 'specialism' || !fieldId) return
    void loadSpecialisms(fieldId)
  }, [hydrated, stepId, fieldId, loadSpecialisms])

  useEffect(() => {
    if (!hydrated || stepId !== 'stage' || !specialismId) return
    void loadStages(specialismId)
  }, [hydrated, stepId, specialismId, loadStages])

  useEffect(() => {
    if (!hydrated || stepId !== 'completed_courses' || !fieldId || !specialismId || !stageId) return
    void loadCourseOptions(fieldId, specialismId, stageId)
  }, [hydrated, stepId, fieldId, specialismId, stageId, loadCourseOptions])

  const selectField = (id: string) => {
    setFieldId(id)
    setSpecialismId(null)
    setStageId(null)
    setCompletedIds([])
    setCompletedNotes('')
    setPublicResult(null)
    setSpecialisms([])
    setStages([])
    setCourseOptions([])
    setMatchError(null)
    // Single-choice: auto-advance (same as Profession / SNC / Extra Income)
    setStepId('specialism')
  }

  const selectSpecialism = (id: string) => {
    setSpecialismId(id)
    setStageId(null)
    setCompletedIds([])
    setCompletedNotes('')
    setPublicResult(null)
    setStages([])
    setCourseOptions([])
    setMatchError(null)
    setStepId('stage')
  }

  const selectStage = (id: string) => {
    setStageId(id)
    setCompletedIds([])
    setCompletedNotes('')
    setPublicResult(null)
    setCourseOptions([])
    setMatchError(null)
    setStepId('completed_courses')
  }

  const toggleCompleted = (id: string) => {
    setCompletedIds((prev) => {
      if (id === WIE_COMPLETED_NONE_ID || id === WIE_COMPLETED_NOT_SURE_ID) {
        return prev.includes(id) ? [] : [id]
      }
      const withoutSentinels = prev.filter(
        (x) => x !== WIE_COMPLETED_NONE_ID && x !== WIE_COMPLETED_NOT_SURE_ID
      )
      if (withoutSentinels.includes(id)) {
        return withoutSentinels.filter((x) => x !== id)
      }
      return [...withoutSentinels, id]
    })
  }

  const runMatch = async () => {
    if (!fieldId || !specialismId || !stageId) return
    setMatchLoading(true)
    setMatchError(null)
    try {
      const normalized = normalizeCompletedCoursesSelection({
        selectedIds: completedIds,
        optionLabelsById,
        otherNotes: completedNotes,
      })

      const res = await fetch('/api/career-assistant/work-in-my-education/library/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          field_id: fieldId,
          specialism_id: specialismId,
          stage_id: stageId,
          completed_course_types: normalized.completed_course_types,
          completed_course_notes: normalized.completed_course_notes,
          course_confidence: normalized.course_confidence,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setMatchError(data.error || 'Could not load pathway results.')
        return
      }
      const result = data.result as PublicWieAssessmentResult
      clearAddToPlanSessionState()
      setPublicResult(result)
      savePublicResultHandoff({
        result_token: result.result_token,
        result,
      })
      saveWieTrainingHandoffs({
        training: result.training_recommendations,
        field: result.matched_direction?.field,
        specialism: result.matched_direction?.specialism,
        stage: result.headline?.text,
      })
      void trackJazEvent({
        event_type: 'wie_completed_courses_selected',
        event_source: 'work_in_education_library_wizard',
        goal_path: 'work_in_education',
        metadata: {
          completed_course_types: normalized.completed_course_types,
          course_confidence: normalized.course_confidence,
        },
      })
      setStepId('results')
    } catch {
      setMatchError('Could not load pathway results. Please try again.')
    } finally {
      setMatchLoading(false)
    }
  }

  /** Continue only for multi-select completed-courses step. */
  const goNext = async () => {
    setMatchError(null)
    if (stepId !== 'completed_courses') return
    if (completedIds.length === 0) {
      setMatchError('Please select at least one option (including None yet or Not sure).')
      return
    }
    await runMatch()
  }

  const goBack = () => {
    setMatchError(null)
    if (stepId === 'specialism') setStepId('field')
    else if (stepId === 'stage') setStepId('specialism')
    else if (stepId === 'completed_courses') setStepId('stage')
    else if (stepId === 'results') setStepId('completed_courses')
  }

  const restart = () => {
    setFieldId(null)
    setSpecialismId(null)
    setStageId(null)
    setCompletedIds([])
    setCompletedNotes('')
    setPublicResult(null)
    setSpecialisms([])
    setStages([])
    setCourseOptions([])
    setStepId('field')
    setMatchError(null)
    try {
      window.sessionStorage.removeItem(sessionKey)
    } catch {
      // ignore
    }
    clearWizardSession(WIZARD_SESSION_KEY)
    clearPublicResultHandoff()
    clearAddToPlanSessionState()
  }

  const progressIndex = Math.max(
    0,
    STEP_DEFS.findIndex((s) => s.id === stepId)
  )

  const showOtherNotes = completedIds.includes(WIE_COMPLETED_OTHER_ID)

  if (!hydrated) {
    return (
      <div className="flex items-center justify-center py-16 text-sm text-slate-400">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
        Restoring session…
      </div>
    )
  }

  return (
    <div className={cn('mx-auto w-full space-y-5', compact ? 'max-w-lg' : 'max-w-xl', className)}>
      <div className="space-y-1">
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-xl font-semibold text-slate-50 outline-none sm:text-2xl"
        >
          Work in My Education
        </h1>
        <p className="text-sm text-slate-400">
          Choose your career field, specialism, stage, and any related training you already have.
        </p>
      </div>

      {stepId !== 'results' && <ProgressBar steps={STEP_DEFS} currentIndex={progressIndex} />}

      {(listError || matchError) && <WarningCard message={listError || matchError || ''} />}
      {emptyMessage && (
        <WarningCard
          message={
            adminMode
              ? emptyMessage
              : emptyMessage.includes('admin')
                ? 'This pathway is not available right now.'
                : emptyMessage
          }
        />
      )}

      {stepId === 'field' && (
        <QuestionCard
          title="Career field"
          description="Select the field that matches your education or target pathway."
        >
          {listLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading fields from the Career Knowledge Library…
            </div>
          ) : (
            <fieldset className="space-y-2">
              <legend className="sr-only">Career field</legend>
              {fields.map((f) => (
                <OptionCard
                  key={f.id}
                  name="field"
                  value={f.id}
                  label={f.name}
                  helpText={f.description || undefined}
                  selected={fieldId === f.id}
                  onSelect={selectField}
                />
              ))}
            </fieldset>
          )}
        </QuestionCard>
      )}

      {stepId === 'specialism' && (
        <QuestionCard
          title="Specialism"
          description="Only specialisms linked to your selected field are shown."
        >
          {listLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading specialisms…
            </div>
          ) : (
            <fieldset className="space-y-2">
              <legend className="sr-only">Specialism</legend>
              {specialisms.map((s) => (
                <OptionCard
                  key={s.id}
                  name="specialism"
                  value={s.id}
                  label={s.name}
                  helpText={s.description || undefined}
                  selected={specialismId === s.id}
                  onSelect={selectSpecialism}
                />
              ))}
            </fieldset>
          )}
        </QuestionCard>
      )}

      {stepId === 'stage' && (
        <QuestionCard
          title="Target career stage"
          description="Choose the level you want to work toward. Immediate routes are based on your estimated current readiness, not this target alone."
        >
          {listLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading stages…
            </div>
          ) : (
            <fieldset className="space-y-2">
              <legend className="sr-only">Target career stage</legend>
              {stages.map((s) => (
                <OptionCard
                  key={s.id}
                  name="stage"
                  value={s.id}
                  label={s.name}
                  selected={stageId === s.id}
                  onSelect={selectStage}
                />
              ))}
            </fieldset>
          )}
        </QuestionCard>
      )}

      {stepId === 'completed_courses' && (
        <QuestionCard
          title="Have you completed any related courses, training, or certificates?"
          description="Select all that apply. This is self-reported — we use it to avoid recommending training you already have."
        >
          {listLoading ? (
            <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Loading related course options…
            </div>
          ) : (
            <fieldset className="space-y-2">
              <legend className="sr-only">Completed courses</legend>
              {courseOptions.map((o) => (
                <OptionCard
                  key={o.id}
                  name="completed_courses"
                  value={o.id}
                  label={o.label}
                  helpText={o.helpText}
                  selected={completedIds.includes(o.id)}
                  onSelect={toggleCompleted}
                  multi
                />
              ))}
            </fieldset>
          )}
          {showOtherNotes ? (
            <label className="mt-3 block space-y-1.5">
              <span className="text-xs font-medium text-slate-300">Other training (optional)</span>
              <textarea
                value={completedNotes}
                onChange={(e) => setCompletedNotes(e.target.value.slice(0, 280))}
                rows={2}
                placeholder="e.g. in-house Excel course, short online module…"
                className="w-full rounded-xl border border-slate-700 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
              />
            </label>
          ) : null}
        </QuestionCard>
      )}

      {stepId === 'results' && publicResult && (
        <PublicResultExperience
          result={publicResult}
          onStartAgain={restart}
          resultPageHref={resultHref}
          showDebug={adminMode}
        />
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {stepId !== 'field' && (
            <button
              type="button"
              onClick={goBack}
              disabled={matchLoading || listLoading}
              className="min-h-11 flex-1 rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-slate-400 disabled:opacity-50 sm:flex-none"
            >
              Back
            </button>
          )}
          <button
            type="button"
            onClick={restart}
            className="min-h-11 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:text-slate-300"
          >
            Start over
          </button>
        </div>
        {stepId === 'completed_courses' && (
          <button
            type="button"
            onClick={() => void goNext()}
            disabled={matchLoading || listLoading || completedIds.length === 0}
            className="inline-flex min-h-11 min-w-[8rem] items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60"
          >
            {matchLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Matching…
              </>
            ) : (
              'See results'
            )}
          </button>
        )}
      </div>
    </div>
  )
}
