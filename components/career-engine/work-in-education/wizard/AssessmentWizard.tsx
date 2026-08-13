'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
  WIE_ASSESSMENT_BLUEPRINT_VERSION,
  type WorkInEducationAssessmentAnswers,
  type WorkInEducationAssessmentResult,
} from '@/lib/career-engine/work-in-education'
import {
  createEmptyWizardSession,
  getVisibleAnswerSteps,
  loadWizardSession,
  saveWizardSession,
  clearWizardSession,
  savePublicResultHandoff,
  loadPublicResultHandoff,
  clearPublicResultHandoff,
  validateWizardStep,
  WIZARD_SESSION_KEY,
  type WizardStepId,
} from '@/lib/career-engine/work-in-education/wizard'
import type { PublicWieAssessmentResult } from '@/lib/career-engine/work-in-education/public-contract'
import { NOT_SURE_CLARIFICATION_VALUE } from '@/lib/career-engine/work-in-education/clarification-limit'
import { clearAddToPlanSessionState } from '@/lib/career-assistant/add-to-my-plan/clearAddToPlanSession'
import { cn } from '@/lib/utils'
import { ClarificationStep } from './ClarificationStep'
import { OptionCard } from './OptionCard'
import { ProgressBar } from './ProgressBar'
import { QuestionCard } from './QuestionCard'
import { QualificationTaxonomyStep } from './QualificationTaxonomyStep'
import { RegistrationStep } from './RegistrationStep'
import { ResultExperience } from './ResultExperience'
import { PublicResultExperience } from './PublicResultExperience'
import { WarningCard } from './WarningCard'

const GRAD_STATUS = [
  { value: 'completed', label: 'Completed' },
  { value: 'studying', label: 'Currently studying' },
  { value: 'incomplete', label: 'Incomplete / did not finish' },
]

const YES_NO_UNSURE = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Unsure' },
]

export type AssessmentWizardMode = 'admin_preview' | 'career_assistant'

type Props = {
  mode?: AssessmentWizardMode
  /** Admin uses authenticated assessment API; CA uses public-safe API */
  apiPath?: string
  includeDrafts?: boolean
  className?: string
  /** Demo presets for admin harness */
  showPresets?: boolean
  initialAnswers?: Partial<WorkInEducationAssessmentAnswers>
  onComplete?: (payload: {
    mode: AssessmentWizardMode
    publicResult?: PublicWieAssessmentResult
    assessment?: WorkInEducationAssessmentResult
  }) => void
  onExit?: () => void
  sessionKey?: string
  showInternalDiagnostics?: boolean
  /** When set (CA mode), navigate here after complete instead of inline results */
  resultHref?: string
  compact?: boolean
}

const PRESETS: { label: string; answers: Partial<WorkInEducationAssessmentAnswers> }[] = [
  {
    label: 'Civil Engineering',
    answers: {
      qualification_group: 'undergraduate',
      qualification_type: 'bachelors',
      education_level: 'bachelor',
      qualification_title: 'BEng Civil Engineering',
      subject: 'Civil Engineering',
      qualification_country: 'United Kingdom',
      graduation_status: 'completed',
      years_relevant_experience: 0,
      engineering_registration: 'none',
    },
  },
  {
    label: 'Animation MSc',
    answers: {
      qualification_group: 'postgraduate',
      qualification_type: 'masters',
      education_level: 'master',
      qualification_title: 'MSc Computer Animation',
      subject: 'Animation',
      specialisation: '3D Animation',
      years_relevant_experience: 4,
      current_job_title: 'Retail Supervisor',
    },
  },
  {
    label: 'Broad LLB Law',
    answers: {
      qualification_group: 'undergraduate',
      qualification_type: 'bachelors',
      education_level: 'bachelor',
      qualification_title: 'LLB',
      subject: 'Law',
      specialisation: '',
      years_relevant_experience: 0,
    },
  },
  {
    label: 'Overseas Medicine',
    answers: {
      qualification_group: 'overseas',
      qualification_type: 'overseas_undergraduate',
      education_level: 'bachelor',
      equivalence_status: 'not_confirmed',
      uk_recognition_confirmed: 'no',
      qualification_title: 'MBBS',
      subject: 'Medicine',
      qualification_country: 'India',
      years_relevant_experience: 0,
      registration: { has_registration: 'no' },
    },
  },
  {
    label: 'Adult Nursing',
    answers: {
      qualification_group: 'undergraduate',
      qualification_type: 'bachelors',
      education_level: 'bachelor',
      qualification_title: 'BSc Adult Nursing',
      subject: 'Nursing',
      years_relevant_experience: 1,
      registration: {
        has_registration: 'yes',
        body: 'NMC',
        status: 'registered',
        scope: 'adult_nursing',
      },
    },
  },
  {
    label: 'Teaching PGCE',
    answers: {
      qualification_group: 'postgraduate',
      qualification_type: 'pgce',
      education_level: 'professional',
      qualification_title: 'PGCE Secondary',
      subject: 'Education',
      specialisation: 'Secondary Teaching',
      years_relevant_experience: 0,
      qts_status: 'working_towards',
    },
  },
]

export function AssessmentWizard({
  mode = 'admin_preview',
  apiPath,
  includeDrafts,
  className,
  showPresets = false,
  initialAnswers,
  onComplete,
  onExit,
  sessionKey = WIZARD_SESSION_KEY,
  showInternalDiagnostics = false,
  resultHref,
  compact = false,
}: Props) {
  const resolvedApiPath =
    apiPath ??
    (mode === 'career_assistant'
      ? '/api/career-assistant/work-in-my-education/assessment'
      : '/api/admin/career-library/work-in-education/assessment')
  // Default true for both CA and admin — library roles are still draft.
  // Explicit prop / WIE_PUBLIC_INCLUDE_DRAFTS=false can still restrict at API.
  const resolvedIncludeDrafts = includeDrafts ?? true
  const isPublicMode = mode === 'career_assistant'

  const [hydrated, setHydrated] = useState(false)
  const [stepId, setStepId] = useState<WizardStepId>('education')
  const [answers, setAnswers] = useState<WorkInEducationAssessmentAnswers>(() => ({
    ...createEmptyWizardSession().answers,
    ...initialAnswers,
    registration: {
      ...createEmptyWizardSession().answers.registration,
      ...initialAnswers?.registration,
    },
    preferences: {
      ...createEmptyWizardSession().answers.preferences,
      ...initialAnswers?.preferences,
    },
  }))
  const [selectedSpecialismId, setSelectedSpecialismId] = useState<string | null>(null)
  const [result, setResult] = useState<WorkInEducationAssessmentResult | null>(null)
  const [publicResult, setPublicResult] = useState<PublicWieAssessmentResult | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState<string | null>(null)
  const [fallbackHint, setFallbackHint] = useState(false)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const lastRunKey = useRef<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)
  const requestSeqRef = useRef(0)

  useEffect(() => {
    const saved = loadWizardSession(sessionKey)
    if (saved) {
      setStepId(saved.step_id)
      setAnswers(saved.answers)
      setSelectedSpecialismId(saved.selected_specialism_id)
      // Results payload lives in the public handoff key, not the wizard session.
      // Without this, remounting on step "results" left an empty forever-loading-looking screen.
      if (saved.step_id === 'results' && mode === 'career_assistant') {
        const handoff = loadPublicResultHandoff()
        if (handoff?.result && typeof handoff.result === 'object') {
          setPublicResult(handoff.result as PublicWieAssessmentResult)
        }
      }
    }
    setHydrated(true)
  }, [sessionKey, mode])

  useEffect(() => {
    if (!hydrated) return
    saveWizardSession(
      {
        version: 1,
        blueprint_version: WIE_ASSESSMENT_BLUEPRINT_VERSION,
        step_id: stepId,
        answers,
        selected_specialism_id: selectedSpecialismId,
        updated_at: new Date().toISOString(),
      },
      sessionKey
    )
  }, [hydrated, stepId, answers, selectedSpecialismId, sessionKey])

  useEffect(() => {
    headingRef.current?.focus()
  }, [stepId])

  const answerSteps = useMemo(() => getVisibleAnswerSteps(answers), [answers])

  const progressSteps = useMemo(() => {
    const labels: Record<string, string> = {
      education: 'Education',
      qualification: 'Qualification',
      experience: 'Experience',
      registration: 'Registration',
      preferences: 'Preferences',
      clarification: 'Clarify',
      results: 'Results',
    }
    const ids: string[] = [...answerSteps]
    const needsClarify =
      stepId === 'clarification' ||
      result?.clarification.required ||
      publicResult?.clarification.required
    if (needsClarify && !ids.includes('clarification')) ids.push('clarification')
    if (
      stepId === 'results' ||
      result?.assessment_status === 'complete' ||
      publicResult?.status === 'complete'
    ) {
      ids.push('results')
    }
    return ids.map((id) => ({ id, label: labels[id] ?? id }))
  }, [answerSteps, stepId, result, publicResult])

  const progressIndex = Math.max(
    0,
    progressSteps.findIndex((s) => s.id === stepId)
  )

  type RunOutcome = {
    status: 'complete' | 'needs_clarification' | 'invalid'
    assessment?: WorkInEducationAssessmentResult
    publicResult?: PublicWieAssessmentResult
    validation_errors?: string[]
  }

  const runAssessment = useCallback(
    async (opts?: { specialismId?: string | null }): Promise<RunOutcome | null> => {
      const requestSeq = ++requestSeqRef.current
      setLoading(true)
      setApiError(null)
      setFallbackHint(false)

      const clearLoadingIfCurrent = () => {
        if (requestSeqRef.current === requestSeq) setLoading(false)
      }

      try {
        const clarificationId = opts?.specialismId ?? selectedSpecialismId
        if (clarificationId === NOT_SURE_CLARIFICATION_VALUE) {
          setErrors(['Go back and add a specialisation if none of the listed areas fit.'])
          setStepId('qualification')
          return null
        }

        const runKey = JSON.stringify({
          answers,
          clarificationId: clarificationId || null,
          mode,
        })
        const cachedRoleTotal = publicResult
          ? (publicResult.recommendations?.available_now?.length ?? 0) +
            (publicResult.recommendations?.realistic_next?.length ?? 0) +
            (publicResult.recommendations?.future_options?.length ?? 0) +
            (publicResult.recommendations?.academic_research?.length ?? 0) +
            (publicResult.recommendations?.requirements_needed?.length ?? 0)
          : result
            ? (result.summary?.immediate_count ?? 0) +
              (result.summary?.realistic_next_count ?? 0) +
              (result.summary?.future_count ?? 0) +
              (result.summary?.academic_count ?? 0) +
              (result.summary?.blocked_count ?? 0)
            : 0
        // Never reuse a cached empty result — that hid matcher output after draft-loading fixes.
        if (
          lastRunKey.current === runKey &&
          opts?.specialismId == null &&
          (result || publicResult) &&
          cachedRoleTotal > 0
        ) {
          return {
            status: (result?.assessment_status ||
              publicResult?.status ||
              'complete') as RunOutcome['status'],
            assessment: result ?? undefined,
            publicResult: publicResult ?? undefined,
          }
        }

        abortRef.current?.abort()
        const controller = new AbortController()
        abortRef.current = controller

        const res = await fetch(resolvedApiPath, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            blueprint_version: WIE_ASSESSMENT_BLUEPRINT_VERSION,
            answers,
            clarification_answers: clarificationId
              ? { selected_specialism_id: clarificationId }
              : undefined,
            includeDrafts: resolvedIncludeDrafts,
          }),
        })
        const data = await res.json()

        // Superseded by a newer request
        if (requestSeqRef.current !== requestSeq) return null

        if (!res.ok) {
          if (isPublicMode && data.result) {
            setPublicResult(data.result as PublicWieAssessmentResult)
          }
          if (!isPublicMode && data.assessment) {
            setResult(data.assessment as WorkInEducationAssessmentResult)
          }
          const friendly =
            data.error ||
            (Array.isArray(data.details) ? 'Please check your answers and try again.' : null) ||
            'Something went wrong. Please try again.'
          setApiError(friendly)
          if (isPublicMode) setFallbackHint(true)
          return null
        }

        if (isPublicMode) {
          const pub = data.result as PublicWieAssessmentResult
          setPublicResult(pub)
          setResult(null)
          lastRunKey.current = runKey
          return { status: pub.status, publicResult: pub }
        }

        const assessment = data.assessment as WorkInEducationAssessmentResult
        setResult(assessment)
        setPublicResult(null)
        lastRunKey.current = runKey
        return {
          status: assessment.assessment_status,
          assessment,
          validation_errors: assessment.validation_errors,
        }
      } catch (e) {
        if (e instanceof Error && e.name === 'AbortError') {
          // Aborted because a newer request started — leave loading to the newer request.
          return null
        }
        if (requestSeqRef.current === requestSeq) {
          setApiError('We could not complete your assessment right now. Please try again.')
          if (isPublicMode) setFallbackHint(true)
        }
        return null
      } finally {
        clearLoadingIfCurrent()
      }
    },
    [
      answers,
      resolvedApiPath,
      resolvedIncludeDrafts,
      selectedSpecialismId,
      result,
      publicResult,
      mode,
      isPublicMode,
    ]
  )

  const finishComplete = (outcome: RunOutcome) => {
    if (isPublicMode && outcome.publicResult) {
      // New CA result — drop any prior modal / pending selections
      clearAddToPlanSessionState()
      savePublicResultHandoff({
        result_token: outcome.publicResult.result_token,
        result: outcome.publicResult,
      })
      onComplete?.({ mode, publicResult: outcome.publicResult })
      setPublicResult(outcome.publicResult)
      setStepId('results')
      // Do not hard-navigate away automatically. Forced location.assign raced the
      // result-page hydrate (and React Strict Mode remounts) and left users on a
      // perpetual "Loading your results…" screen even though the API had finished.
      return
    }
    if (outcome.assessment) {
      onComplete?.({ mode, assessment: outcome.assessment })
    }
    setStepId('results')
  }

  const goNext = async () => {
    setErrors([])
    if (stepId === 'clarification') {
      if (!selectedSpecialismId) {
        setErrors(['Please select one option to continue.'])
        return
      }
      const outcome = await runAssessment({ specialismId: selectedSpecialismId })
      if (outcome?.status === 'complete') finishComplete(outcome)
      return
    }

    if (answerSteps.includes(stepId)) {
      const stepErrors = validateWizardStep(stepId, answers)
      if (stepErrors.length) {
        setErrors(stepErrors)
        return
      }
      const idx = answerSteps.indexOf(stepId)
      if (idx < answerSteps.length - 1) {
        setStepId(answerSteps[idx + 1])
        return
      }
      const outcome = await runAssessment({ specialismId: null })
      if (!outcome) return
      if (outcome.status === 'needs_clarification') {
        setSelectedSpecialismId(null)
        setStepId('clarification')
        return
      }
      if (outcome.status === 'complete') {
        finishComplete(outcome)
        return
      }
      if (outcome.status === 'invalid') {
        setErrors(outcome.validation_errors ?? ['Please check your answers.'])
      }
    }
  }

  const goBack = () => {
    setErrors([])
    setApiError(null)
    if (stepId === 'results') {
      const hasClarify =
        (result?.clarification.options.length ?? 0) > 0 ||
        (publicResult?.clarification.options.length ?? 0) > 0
      if (hasClarify) setStepId('clarification')
      else setStepId(answerSteps[answerSteps.length - 1] ?? 'preferences')
      return
    }
    if (stepId === 'clarification') {
      setStepId(answerSteps[answerSteps.length - 1] ?? 'preferences')
      return
    }
    const idx = answerSteps.indexOf(stepId)
    if (idx > 0) setStepId(answerSteps[idx - 1])
    else onExit?.()
  }

  const restart = () => {
    clearWizardSession(sessionKey)
    const empty = createEmptyWizardSession()
    setAnswers(empty.answers)
    setStepId('education')
    setSelectedSpecialismId(null)
    setResult(null)
    setPublicResult(null)
    setErrors([])
    setApiError(null)
    setFallbackHint(false)
    lastRunKey.current = null
    clearPublicResultHandoff()
    clearAddToPlanSessionState()
  }

  const applyPreset = (partial: Partial<WorkInEducationAssessmentAnswers>) => {
    setAnswers((prev) => ({
      ...prev,
      ...partial,
      registration: {
        ...(prev.registration ?? {}),
        ...(partial.registration ?? {}),
      },
      preferences: {
        ...(prev.preferences ?? {}),
        ...(partial.preferences ?? {}),
      },
    }))
    setResult(null)
    setPublicResult(null)
    setSelectedSpecialismId(null)
    setStepId('education')
    lastRunKey.current = null
  }

  const clarificationOptions =
    publicResult?.clarification.options.map((o) => ({
      specialism_id: o.id,
      name: o.label,
      reason: o.help,
    })) ??
    result?.clarification.options.map((o) => ({
      specialism_id: o.specialism_id,
      name: o.name,
      reason: o.reason,
      score: o.score,
    })) ??
    []

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
          Answer a few questions — we&apos;ll match roles using JobAZ career knowledge (no AI).
        </p>
      </div>

      {showPresets && (
        <div className="flex flex-wrap gap-2" aria-label="Demo presets">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => applyPreset(p.answers)}
              className="rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-300 hover:border-slate-500"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {stepId !== 'results' && (
        <ProgressBar steps={progressSteps} currentIndex={progressIndex} />
      )}

      {errors.length > 0 && (
        <div role="alert" className="space-y-2">
          {errors.map((e) => (
            <WarningCard key={e} message={e} />
          ))}
        </div>
      )}
      {apiError && <WarningCard message={apiError} />}
      {fallbackHint && (
        <div className="space-y-2 rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-slate-300">
          <p>You can retry, or use the previous Career Assistant education path.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded-lg bg-cyan-700 px-3 py-2 text-xs font-medium text-white"
              onClick={() => void goNext()}
            >
              Retry
            </button>
            <a
              href="/career-engine/work-in-education?legacy=1"
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200"
            >
              Use classic flow
            </a>
          </div>
        </div>
      )}

      {stepId === 'education' && (
        <QualificationTaxonomyStep
          answers={answers}
          gradStatusOptions={GRAD_STATUS}
          onChange={(patch) => setAnswers((a) => ({ ...a, ...patch }))}
        />
      )}

      {stepId === 'qualification' && (
        <QuestionCard
          title="Your qualification"
          description="Use the title on your certificate where possible."
        >
          <div className="space-y-1.5">
            <label htmlFor="qual-title" className="text-sm font-medium text-slate-300">
              Qualification title
            </label>
            <input
              id="qual-title"
              className="wizard-input"
              placeholder="e.g. BEng Civil Engineering"
              value={answers.qualification_title ?? ''}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, qualification_title: e.target.value }))
              }
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="subject" className="text-sm font-medium text-slate-300">
              Main subject
            </label>
            <input
              id="subject"
              className="wizard-input"
              placeholder="e.g. Civil Engineering, Law, Nursing"
              value={answers.subject ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, subject: e.target.value }))}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="specialisation" className="text-sm font-medium text-slate-300">
              Specialisation (optional)
            </label>
            <input
              id="specialisation"
              className="wizard-input"
              placeholder="e.g. Commercial Law, 3D Animation"
              value={answers.specialisation ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, specialisation: e.target.value }))}
              autoComplete="off"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="country" className="text-sm font-medium text-slate-300">
              Country of qualification
            </label>
            <input
              id="country"
              className="wizard-input"
              value={answers.qualification_country ?? ''}
              onChange={(e) =>
                setAnswers((a) => ({ ...a, qualification_country: e.target.value }))
              }
              autoComplete="country-name"
            />
          </div>
        </QuestionCard>
      )}

      {stepId === 'experience' && (
        <QuestionCard
          title="Your experience"
          description="Include work related to this qualification or target career."
        >
          <div className="space-y-1.5">
            <label htmlFor="years" className="text-sm font-medium text-slate-300">
              Years of relevant experience
            </label>
            <input
              id="years"
              type="number"
              min={0}
              max={60}
              className="wizard-input"
              value={answers.years_relevant_experience ?? 0}
              onChange={(e) =>
                setAnswers((a) => ({
                  ...a,
                  years_relevant_experience: Number(e.target.value || 0),
                }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="job" className="text-sm font-medium text-slate-300">
              Current or most recent related job title (optional)
            </label>
            <input
              id="job"
              className="wizard-input"
              value={answers.current_job_title ?? ''}
              onChange={(e) => setAnswers((a) => ({ ...a, current_job_title: e.target.value }))}
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-300">UK work experience?</legend>
            {YES_NO_UNSURE.map((o) => (
              <OptionCard
                key={o.value}
                name="uk_exp"
                value={o.value}
                label={o.label}
                selected={String(answers.has_uk_experience ?? '') === o.value}
                onSelect={(v) => setAnswers((a) => ({ ...a, has_uk_experience: v }))}
              />
            ))}
          </fieldset>
          <div className="space-y-1.5">
            <label htmlFor="skills" className="text-sm font-medium text-slate-300">
              Key skills (optional, comma-separated)
            </label>
            <input
              id="skills"
              className="wizard-input"
              value={(answers.skills ?? []).join(', ')}
              onChange={(e) =>
                setAnswers((a) => ({
                  ...a,
                  skills: e.target.value
                    .split(/[,;|]/)
                    .map((s) => s.trim())
                    .filter(Boolean),
                }))
              }
            />
          </div>
        </QuestionCard>
      )}

      {stepId === 'registration' && (
        <RegistrationStep answers={answers} onChange={setAnswers} />
      )}

      {stepId === 'preferences' && (
        <QuestionCard
          title="Career preferences"
          description="These help prioritise directions — they do not invent careers."
        >
          {(
            [
              ['related_field_only', 'Prefer roles closely related to your qualification?'],
              ['open_to_related_fields', 'Open to related fields?'],
              ['open_to_retraining', 'Open to retraining?'],
              ['academic_route', 'Interested in academic / research routes?'],
            ] as const
          ).map(([key, label]) => (
            <fieldset key={key} className="space-y-2">
              <legend className="text-sm font-medium text-slate-300">{label}</legend>
              {YES_NO_UNSURE.map((o) => (
                <OptionCard
                  key={o.value}
                  name={key}
                  value={o.value}
                  label={o.label}
                  selected={String(answers.preferences?.[key] ?? '') === o.value}
                  onSelect={(v) =>
                    setAnswers((a) => ({
                      ...a,
                      preferences: { ...(a.preferences ?? {}), [key]: v },
                    }))
                  }
                />
              ))}
            </fieldset>
          ))}
        </QuestionCard>
      )}

      {stepId === 'clarification' && clarificationOptions.length > 0 && (
        <ClarificationStep
          reason={result?.clarification.reason || publicResult?.clarification.question}
          question={publicResult?.clarification.question}
          options={clarificationOptions}
          selectedId={selectedSpecialismId}
          onSelect={setSelectedSpecialismId}
          includeNotSure={Boolean(isPublicMode || publicResult?.clarification.include_not_sure)}
        />
      )}

      {stepId === 'results' && isPublicMode && publicResult && (
        <PublicResultExperience
          result={publicResult}
          onStartAgain={restart}
          resultPageHref={resultHref}
        />
      )}
      {stepId === 'results' && !isPublicMode && result && (
        <>
          <ResultExperience result={result} />
          {showInternalDiagnostics ? (
            <details className="rounded-lg border border-slate-800 p-3 text-[10px] text-slate-500">
              <summary>Internal diagnostics (admin)</summary>
              <pre className="mt-2 max-h-64 overflow-auto">
                {JSON.stringify(
                  {
                    status: result.assessment_status,
                    summary: result.summary,
                    trace: result.trace,
                  },
                  null,
                  2
                )}
              </pre>
            </details>
          ) : null}
        </>
      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-2">
          {stepId !== 'education' && (
            <button
              type="button"
              onClick={goBack}
              disabled={loading}
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
        {stepId !== 'results' && (
          <button
            type="button"
            onClick={goNext}
            disabled={loading}
            className="inline-flex min-h-11 min-w-[8rem] items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                Matching…
              </>
            ) : stepId === 'clarification' ? (
              'See results'
            ) : stepId === answerSteps[answerSteps.length - 1] ? (
              'Get matches'
            ) : (
              'Continue'
            )}
          </button>
        )}
      </div>

      <style jsx global>{`
        .wizard-input {
          width: 100%;
          min-height: 2.75rem;
          border-radius: 0.75rem;
          border: 1px solid rgb(51 65 85);
          background: rgb(2 6 23);
          padding: 0.65rem 0.85rem;
          font-size: 1rem;
          color: rgb(226 232 240);
        }
        .wizard-input:focus {
          outline: 2px solid rgb(6 182 212 / 0.55);
          outline-offset: 1px;
        }
      `}</style>
    </div>
  )
}
