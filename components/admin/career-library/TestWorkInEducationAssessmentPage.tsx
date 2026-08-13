'use client'

import { useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Play } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import {
  WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT,
  listVisibleQuestions,
  type WorkInEducationAssessmentAnswers,
  type WorkInEducationAssessmentResult,
} from '@/lib/career-engine/work-in-education'

type FlatForm = {
  education_level: string
  qualification_group: string
  qualification_type: string
  qualification_title: string
  subject: string
  specialisation: string
  qualification_country: string
  graduation_status: string
  graduation_year: string
  years_relevant_experience: string
  current_job_title: string
  has_uk_experience: string
  has_registration: string
  registration_body: string
  registration_status: string
  registration_scope: string
  engineering_registration: string
  qts_status: string
  uk_recognition_confirmed: string
  licences: string
  skills: string
  english_level: string
  related_field_only: string
  open_to_related_fields: string
  open_to_retraining: string
  academic_route: string
  includeDrafts: boolean
}

const DEFAULT_FORM: FlatForm = {
  education_level: 'bachelor',
  qualification_group: 'undergraduate',
  qualification_type: 'bachelors',
  qualification_title: 'BEng Civil Engineering',
  subject: 'Civil Engineering',
  specialisation: '',
  qualification_country: 'United Kingdom',
  graduation_status: 'completed',
  graduation_year: '2024',
  years_relevant_experience: '0',
  current_job_title: '',
  has_uk_experience: 'unsure',
  has_registration: '',
  registration_body: '',
  registration_status: 'none',
  registration_scope: 'unknown',
  engineering_registration: 'none',
  qts_status: '',
  uk_recognition_confirmed: '',
  licences: '',
  skills: '',
  english_level: '',
  related_field_only: 'yes',
  open_to_related_fields: 'yes',
  open_to_retraining: 'unsure',
  academic_route: 'unsure',
  includeDrafts: true,
}

const PRESETS: { label: string; form: Partial<FlatForm> }[] = [
  {
    label: 'UK Civil Engineering graduate',
    form: {
      education_level: 'bachelor',
      qualification_group: 'undergraduate',
      qualification_type: 'bachelors',
      qualification_title: 'BEng Civil Engineering',
      subject: 'Civil Engineering',
      qualification_country: 'United Kingdom',
      years_relevant_experience: '0',
      engineering_registration: 'none',
    },
  },
  {
    label: 'UK Animation MSc',
    form: {
      education_level: 'master',
      qualification_title: 'MSc Computer Animation',
      subject: 'Animation',
      specialisation: '3D Animation',
      years_relevant_experience: '4',
      current_job_title: 'Retail Supervisor',
    },
  },
  {
    label: 'Broad LLB Law',
    form: {
      education_level: 'bachelor',
      qualification_title: 'LLB',
      subject: 'Law',
      specialisation: '',
      qualification_country: 'United Kingdom',
      years_relevant_experience: '0',
      has_registration: 'no',
    },
  },
  {
    label: 'Overseas Medicine',
    form: {
      education_level: 'bachelor',
      qualification_title: 'MBBS',
      subject: 'Medicine',
      qualification_country: 'India',
      years_relevant_experience: '0',
      has_registration: 'no',
      uk_recognition_confirmed: 'no',
    },
  },
  {
    label: 'UK Adult Nursing + NMC Adult',
    form: {
      education_level: 'bachelor',
      qualification_title: 'BSc Adult Nursing',
      subject: 'Nursing',
      qualification_country: 'United Kingdom',
      years_relevant_experience: '1',
      has_registration: 'yes',
      registration_body: 'NMC',
      registration_status: 'registered',
      registration_scope: 'adult_nursing',
    },
  },
  {
    label: 'PhD Biology research',
    form: {
      education_level: 'doctorate',
      qualification_title: 'PhD Biology',
      subject: 'Biology',
      specialisation: 'Molecular Biology',
      years_relevant_experience: '2',
      academic_route: 'yes',
    },
  },
  {
    label: 'Ambiguous missing subject',
    form: {
      education_level: 'bachelor',
      qualification_title: 'BA',
      subject: '',
      years_relevant_experience: '0',
    },
  },
]

function formToAnswers(form: FlatForm): WorkInEducationAssessmentAnswers {
  const splitList = (s: string) =>
    s
      .split(/[,;|]/)
      .map((x) => x.trim())
      .filter(Boolean)

  return {
    education_level: form.education_level,
    qualification_group: form.qualification_group || null,
    qualification_type: form.qualification_type || null,
    qualification_title: form.qualification_title,
    subject: form.subject,
    specialisation: form.specialisation || null,
    qualification_country: form.qualification_country,
    graduation_status: form.graduation_status,
    graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
    years_relevant_experience: Number(form.years_relevant_experience || 0),
    current_job_title: form.current_job_title || null,
    has_uk_experience: form.has_uk_experience || null,
    registration: {
      has_registration: form.has_registration || null,
      body: form.registration_body || null,
      status: form.registration_status || null,
      scope: form.registration_scope || null,
    },
    engineering_registration: form.engineering_registration || null,
    qts_status: form.qts_status || null,
    uk_recognition_confirmed: form.uk_recognition_confirmed || null,
    licences: splitList(form.licences),
    skills: splitList(form.skills),
    english_level: form.english_level || null,
    preferences: {
      related_field_only: form.related_field_only || null,
      open_to_related_fields: form.open_to_related_fields || null,
      open_to_retraining: form.open_to_retraining || null,
      academic_route: form.academic_route || null,
    },
  }
}

function RoleList({
  title,
  roles,
}: {
  title: string
  roles: Array<{ role_id: string; role_title: string; effective_fit: string }>
}) {
  if (!roles.length) {
    return (
      <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h3>
        <p className="mt-1 text-xs text-slate-500">None</p>
      </div>
    )
  }
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/40 p-3">
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        {title} ({roles.length})
      </h3>
      <ul className="mt-2 space-y-1">
        {roles.slice(0, 12).map((r) => (
          <li key={r.role_id} className="text-sm text-slate-200">
            {r.role_title}
            <span className="ml-2 text-[10px] text-slate-500">{r.effective_fit}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[11px] font-medium text-slate-400">{label}</span>
      {children}
    </label>
  )
}

export default function TestWorkInEducationAssessmentPage() {
  const { addToast } = useToast()
  const [form, setForm] = useState<FlatForm>(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<WorkInEducationAssessmentResult | null>(null)
  const [selectedSpecialismId, setSelectedSpecialismId] = useState('')
  const [showRaw, setShowRaw] = useState(false)

  const answers = useMemo(() => formToAnswers(form), [form])
  const visible = useMemo(() => listVisibleQuestions(answers), [answers])
  const visibleKeys = useMemo(() => new Set(visible.map((q) => q.key)), [visible])

  const setField = <K extends keyof FlatForm>(key: K, value: FlatForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  async function runAssessment(clarificationId?: string) {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/career-library/work-in-education/assessment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blueprint_version: WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT.version,
          answers,
          clarification_answers: clarificationId
            ? { selected_specialism_id: clarificationId }
            : undefined,
          includeDrafts: form.includeDrafts,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        if (data.assessment) setResult(data.assessment)
        const msg = data.error || 'Assessment failed'
        const details = Array.isArray(data.details) ? data.details.join('; ') : ''
        setError(details ? `${msg}: ${details}` : msg)
        addToast({ title: 'Assessment issue', description: msg, variant: 'error' })
        return
      }
      setResult(data.assessment)
      setSelectedSpecialismId('')
      addToast({ title: 'Assessment complete', variant: 'success' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Network error'
      setError(msg)
      addToast({ title: 'Assessment failed', description: msg, variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const show = (key: string) => visibleKeys.has(key)

  return (
    <AppShell>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link
              href="/admin/career-library"
              className="mb-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Career Library
            </Link>
            <h1 className="text-xl font-semibold text-slate-100">
              Work in My Education — Assessment Preview
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Blueprint → answers → profile → existing matcher. Admin only. Not public Career
              Assistant.
            </p>
            <p className="mt-1 text-[11px] text-cyan-400/80">
              Blueprint {WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT.version} ·{' '}
              <Link
                href="/admin/career-library/test-work-in-education"
                className="underline hover:text-cyan-300"
              >
                Raw matcher harness
              </Link>
            </p>
          </div>
          <button
            type="button"
            onClick={() => runAssessment()}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run assessment
          </button>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => setForm((prev) => ({ ...prev, ...DEFAULT_FORM, ...p.form }))}
              className="rounded-full border border-slate-700 px-3 py-1 text-[11px] text-slate-300 hover:border-slate-500"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            <h2 className="text-sm font-semibold text-slate-200">Assessment questions</h2>
            <p className="text-[11px] text-slate-500">
              Visible now: {visible.length} / {WORK_IN_EDUCATION_ASSESSMENT_BLUEPRINT.questions.length}
            </p>

            <Field label="Qualification group (taxonomy)">
              <select
                className="input"
                value={String(form.qualification_group ?? '')}
                onChange={(e) => {
                  const group = e.target.value
                  setForm((f) => ({
                    ...f,
                    qualification_group: group,
                    qualification_type: '',
                  }))
                }}
              >
                <option value="">— use legacy education level —</option>
                {[
                  'no_formal',
                  'school',
                  'college_vocational',
                  'undergraduate',
                  'postgraduate',
                  'doctoral',
                  'professional',
                  'overseas',
                  'other_unsure',
                ].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Qualification type (taxonomy)">
              <input
                className="input"
                placeholder="e.g. bachelors, hnc, pgce, masters"
                value={String(form.qualification_type ?? '')}
                onChange={(e) => setField('qualification_type', e.target.value)}
              />
            </Field>
            <Field label="Education level (legacy / derived)">
              <select
                className="input"
                value={form.education_level}
                onChange={(e) => setField('education_level', e.target.value)}
              >
                {[
                  'college_or_diploma',
                  'bachelor',
                  'master',
                  'doctorate',
                  'professional_qualification',
                  'other',
                  'college',
                  'professional',
                ].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Qualification title">
              <input
                className="input"
                value={form.qualification_title}
                onChange={(e) => setField('qualification_title', e.target.value)}
              />
            </Field>
            <Field label="Main subject">
              <input
                className="input"
                value={form.subject}
                onChange={(e) => setField('subject', e.target.value)}
              />
            </Field>
            <Field label="Specialisation (optional)">
              <input
                className="input"
                value={form.specialisation}
                onChange={(e) => setField('specialisation', e.target.value)}
              />
            </Field>
            <Field label="Qualification country">
              <input
                className="input"
                value={form.qualification_country}
                onChange={(e) => setField('qualification_country', e.target.value)}
              />
            </Field>
            <Field label="Graduation status">
              <select
                className="input"
                value={form.graduation_status}
                onChange={(e) => setField('graduation_status', e.target.value)}
              >
                {['completed', 'studying', 'incomplete'].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            {show('graduation_year') && (
              <Field label="Graduation / expected year">
                <input
                  className="input"
                  type="number"
                  value={form.graduation_year}
                  onChange={(e) => setField('graduation_year', e.target.value)}
                />
              </Field>
            )}
            <Field label="Years relevant experience">
              <input
                className="input"
                type="number"
                min={0}
                value={form.years_relevant_experience}
                onChange={(e) => setField('years_relevant_experience', e.target.value)}
              />
            </Field>
            <Field label="Current / recent job title">
              <input
                className="input"
                value={form.current_job_title}
                onChange={(e) => setField('current_job_title', e.target.value)}
              />
            </Field>
            <Field label="UK experience">
              <select
                className="input"
                value={form.has_uk_experience}
                onChange={(e) => setField('has_uk_experience', e.target.value)}
              >
                {['yes', 'no', 'unsure'].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>

            {show('registration.has_registration') && (
              <Field label="Professional registration?">
                <select
                  className="input"
                  value={form.has_registration}
                  onChange={(e) => setField('has_registration', e.target.value)}
                >
                  <option value="">—</option>
                  {['yes', 'no', 'unsure'].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {show('registration.body') && (
              <Field label="Registration body">
                <input
                  className="input"
                  value={form.registration_body}
                  onChange={(e) => setField('registration_body', e.target.value)}
                />
              </Field>
            )}
            {show('registration.status') && (
              <Field label="Registration status">
                <select
                  className="input"
                  value={form.registration_status}
                  onChange={(e) => setField('registration_status', e.target.value)}
                >
                  {['registered', 'pending', 'expired', 'none'].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {show('registration.scope') && (
              <Field label="Nursing registration scope">
                <select
                  className="input"
                  value={form.registration_scope}
                  onChange={(e) => setField('registration_scope', e.target.value)}
                >
                  {[
                    'adult_nursing',
                    'mental_health_nursing',
                    'childrens_nursing',
                    'learning_disability_nursing',
                    'midwifery',
                    'nursing_associate',
                    'unknown',
                  ].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {show('engineering_registration') && (
              <Field label="Engineering registration">
                <select
                  className="input"
                  value={form.engineering_registration}
                  onChange={(e) => setField('engineering_registration', e.target.value)}
                >
                  {['ceng', 'ieng', 'engtech', 'none', 'unknown'].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {show('qts_status') && (
              <Field label="QTS status">
                <select
                  className="input"
                  value={form.qts_status}
                  onChange={(e) => setField('qts_status', e.target.value)}
                >
                  <option value="">—</option>
                  {['yes', 'no', 'working_towards', 'unknown'].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            {show('uk_recognition_confirmed') && (
              <Field label="UK recognition confirmed?">
                <select
                  className="input"
                  value={form.uk_recognition_confirmed}
                  onChange={(e) => setField('uk_recognition_confirmed', e.target.value)}
                >
                  <option value="">—</option>
                  {['yes', 'no', 'unsure'].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <Field label="Licences (comma-separated)">
              <input
                className="input"
                value={form.licences}
                onChange={(e) => setField('licences', e.target.value)}
              />
            </Field>
            <Field label="Skills (comma-separated)">
              <input
                className="input"
                value={form.skills}
                onChange={(e) => setField('skills', e.target.value)}
              />
            </Field>
            <Field label="English level">
              <select
                className="input"
                value={form.english_level}
                onChange={(e) => setField('english_level', e.target.value)}
              >
                <option value="">—</option>
                {['native', 'fluent', 'professional', 'conversational', 'basic'].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Prefer closely related roles?">
              <select
                className="input"
                value={form.related_field_only}
                onChange={(e) => setField('related_field_only', e.target.value)}
              >
                {['yes', 'no', 'unsure'].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Open to related fields?">
              <select
                className="input"
                value={form.open_to_related_fields}
                onChange={(e) => setField('open_to_related_fields', e.target.value)}
              >
                {['yes', 'no', 'unsure'].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Open to retraining?">
              <select
                className="input"
                value={form.open_to_retraining}
                onChange={(e) => setField('open_to_retraining', e.target.value)}
              >
                {['yes', 'no', 'unsure'].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            {show('preferences.academic_route') && (
              <Field label="Academic / research route?">
                <select
                  className="input"
                  value={form.academic_route}
                  onChange={(e) => setField('academic_route', e.target.value)}
                >
                  {['yes', 'no', 'unsure'].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
            )}
            <label className="flex items-center gap-2 text-xs text-slate-400">
              <input
                type="checkbox"
                checked={form.includeDrafts}
                onChange={(e) => setField('includeDrafts', e.target.checked)}
              />
              Include draft library roles
            </label>
          </div>

          <div className="space-y-4">
            {error && (
              <div className="rounded-lg border border-rose-800/60 bg-rose-950/30 p-3 text-sm text-rose-200">
                {error}
              </div>
            )}

            {!result && !error && (
              <div className="rounded-xl border border-dashed border-slate-700 p-8 text-center text-sm text-slate-500">
                Run assessment to see mapped profile, resolution, and recommendations.
              </div>
            )}

            {result && (
              <>
                <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase',
                        result.assessment_status === 'complete' && 'bg-emerald-900/50 text-emerald-200',
                        result.assessment_status === 'needs_clarification' &&
                          'bg-amber-900/50 text-amber-200',
                        result.assessment_status === 'invalid' && 'bg-rose-900/50 text-rose-200'
                      )}
                    >
                      {result.assessment_status}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      {result.trace.total_ms}ms total · map {result.trace.mapping_ms}ms · match{' '}
                      {result.trace.matcher_ms}ms
                    </span>
                  </div>
                  <h2 className="mt-2 text-base font-semibold text-slate-100">
                    {result.presentation.headline}
                  </h2>
                  <ul className="mt-2 space-y-1">
                    {result.presentation.summary_items.map((item) => (
                      <li key={item.message_key + JSON.stringify(item.params)} className="text-sm text-slate-300">
                        {item.text}
                      </li>
                    ))}
                  </ul>
                  {result.next_actions.length > 0 && (
                    <div className="mt-3">
                      <h3 className="text-xs font-semibold uppercase text-slate-400">Next actions</h3>
                      <ul className="mt-1 space-y-1">
                        {result.next_actions.map((a) => (
                          <li key={a.message_key + a.type} className="text-sm text-cyan-200/90">
                            <span className="text-[10px] uppercase text-slate-500">{a.type}</span> —{' '}
                            {a.text}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {result.clarification.required && (
                  <div className="rounded-xl border border-amber-800/50 bg-amber-950/20 p-4">
                    <h3 className="text-sm font-semibold text-amber-100">Clarification required</h3>
                    <p className="mt-1 text-xs text-amber-200/80">{result.clarification.reason}</p>
                    <div className="mt-3 space-y-2">
                      {result.clarification.options.map((o) => (
                        <label
                          key={o.specialism_id}
                          className="flex cursor-pointer items-start gap-2 rounded-lg border border-slate-700/80 px-3 py-2 text-sm hover:border-slate-500"
                        >
                          <input
                            type="radio"
                            name="clarify"
                            checked={selectedSpecialismId === o.specialism_id}
                            onChange={() => setSelectedSpecialismId(o.specialism_id)}
                          />
                          <span>
                            <span className="text-slate-100">{o.name}</span>
                            <span className="mt-0.5 block text-[11px] text-slate-500">
                              {o.reason} · score {o.score}
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                    <button
                      type="button"
                      disabled={!selectedSpecialismId || loading}
                      onClick={() => runAssessment(selectedSpecialismId)}
                      className="mt-3 rounded-lg bg-amber-700 px-3 py-1.5 text-xs font-medium text-white hover:bg-amber-600 disabled:opacity-50"
                    >
                      Apply selected specialism & re-run
                    </button>
                  </div>
                )}

                {result.profile && (
                  <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
                    <h3 className="text-xs font-semibold uppercase text-slate-400">Mapped profile</h3>
                    <dl className="mt-2 grid grid-cols-2 gap-2 text-xs text-slate-300">
                      <div>
                        <dt className="text-slate-500">Education</dt>
                        <dd>{result.profile.education_level}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Subject</dt>
                        <dd>{result.profile.subject}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Specialisation</dt>
                        <dd>{result.profile.specialisation || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Country</dt>
                        <dd>{result.profile.qualification_country}</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Experience</dt>
                        <dd>{result.profile.years_relevant_experience} yrs</dd>
                      </div>
                      <div>
                        <dt className="text-slate-500">Registrations</dt>
                        <dd>{result.profile.professional_registration?.length ?? 0}</dd>
                      </div>
                    </dl>
                    <p className="mt-2 text-[11px] text-slate-500">
                      Field: {result.resolution?.primary_field?.name ?? '—'} · Specialism:{' '}
                      {result.resolution?.primary_specialism?.name ?? '—'}
                    </p>
                  </div>
                )}

                {result.recommendations && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <RoleList title="Immediate" roles={result.recommendations.immediate} />
                    <RoleList
                      title="Realistic next"
                      roles={result.recommendations.realistic_next}
                    />
                    <RoleList
                      title="Future progression"
                      roles={result.recommendations.future_progression}
                    />
                    <RoleList
                      title="Blocked / needs review"
                      roles={result.recommendations.blocked_or_needs_review}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowRaw((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
                >
                  {showRaw ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                  Raw JSON
                </button>
                {showRaw && (
                  <pre className="max-h-[480px] overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-[10px] text-slate-400">
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(51 65 85);
          background: rgb(15 23 42);
          padding: 0.4rem 0.6rem;
          font-size: 0.875rem;
          color: rgb(226 232 240);
        }
      `}</style>
    </AppShell>
  )
}
