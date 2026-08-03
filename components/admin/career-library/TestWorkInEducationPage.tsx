'use client'

import { useCallback, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Play } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import type { WorkInEducationMatchResult } from '@/lib/career-engine/work-in-education'

type FormState = {
  education_level: string
  qualification_title: string
  subject: string
  specialisation: string
  qualification_country: string
  years_relevant_experience: string
  current_job_title: string
  registration_body: string
  registration_status: string
  registration_scope: string
  skills: string
  wants_academic_route: string
  includeDrafts: boolean
}

const DEFAULT_FORM: FormState = {
  education_level: 'bachelor',
  qualification_title: 'BEng Civil Engineering',
  subject: 'Civil Engineering',
  specialisation: '',
  qualification_country: 'United Kingdom',
  years_relevant_experience: '0',
  current_job_title: '',
  registration_body: '',
  registration_status: 'none',
  registration_scope: 'unknown',
  skills: '',
  wants_academic_route: 'null',
  includeDrafts: true,
}

const PRESETS: { label: string; form: Partial<FormState> }[] = [
  {
    label: 'UK Civil Eng BEng, 0 exp',
    form: {
      education_level: 'bachelor',
      qualification_title: 'BEng Civil Engineering',
      subject: 'Civil Engineering',
      qualification_country: 'United Kingdom',
      years_relevant_experience: '0',
      registration_body: '',
      registration_status: 'none',
      skills: '',
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
    label: 'Overseas Law, no reg',
    form: {
      education_level: 'bachelor',
      qualification_title: 'LLB',
      subject: 'Law',
      qualification_country: 'Nigeria',
      years_relevant_experience: '1',
      registration_status: 'none',
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
      registration_status: 'none',
    },
  },
  {
    label: 'UK Adult Nursing + NMC adult',
    form: {
      education_level: 'bachelor',
      qualification_title: 'BSc Adult Nursing',
      subject: 'Nursing',
      qualification_country: 'United Kingdom',
      years_relevant_experience: '1',
      registration_body: 'NMC',
      registration_status: 'registered',
      registration_scope: 'adult_nursing',
    },
  },
  {
    label: 'Broad LLB Law (clarify)',
    form: {
      education_level: 'bachelor',
      qualification_title: 'LLB',
      subject: 'Law',
      specialisation: '',
      qualification_country: 'United Kingdom',
      years_relevant_experience: '0',
      registration_status: 'none',
      registration_scope: 'unknown',
    },
  },
  {
    label: 'PhD Biology research',
    form: {
      education_level: 'doctorate',
      qualification_title: 'PhD Biology',
      subject: 'Biology',
      years_relevant_experience: '2',
      wants_academic_route: 'true',
    },
  },
  {
    label: 'Ambiguous / missing subject',
    form: {
      education_level: 'bachelor',
      qualification_title: 'BA Studies',
      subject: '',
      specialisation: '',
    },
  },
]

function RoleCard({ role }: { role: WorkInEducationMatchResult['recommendations']['immediate'][number] }) {
  return (
    <div className="rounded-lg border border-slate-700/80 bg-slate-950/50 p-3 text-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="font-medium text-slate-100">{role.role_title}</div>
        <div className="text-[11px] text-slate-400">score {role.match_score}</div>
      </div>
      <div className="mt-1 text-[11px] text-slate-400">
        {role.field.name} · {role.specialism.name}
        {role.stage.label ? ` · ${role.stage.label}` : ''}
      </div>
      <div className="mt-1 flex flex-wrap gap-1.5">
        <Badge>{role.effective_fit}</Badge>
        <Badge>{role.eligibility.status}</Badge>
        <Badge tone="muted">{role.retrieval_source}</Badge>
        {role.stored_fit ? <Badge tone="muted">stored:{role.stored_fit}</Badge> : null}
      </div>
      <div className="mt-1 text-[10px] text-slate-500">
        scope q={role.eligibility.qualification_scope_match} / r=
        {role.eligibility.registration_scope_match} · gate={role.scope_gate} · stage=
        {role.professional_stage_gate}
      </div>
      {role.demotion_reasons?.length ? (
        <div className="mt-1 text-[11px] text-amber-200/90">
          Demoted: {role.demotion_reasons.join(', ')}
        </div>
      ) : null}
      {role.match_reasons.length ? (
        <ul className="mt-2 list-disc space-y-0.5 pl-4 text-[11px] text-slate-400">
          {role.match_reasons.slice(0, 4).map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ul>
      ) : null}
      {role.gaps.length ? (
        <ul className="mt-2 space-y-0.5 text-[11px] text-amber-200/90">
          {role.gaps.map((g) => (
            <li key={g.code}>
              [{g.severity}] {g.message}
            </li>
          ))}
        </ul>
      ) : null}
      <div className="mt-2 font-mono text-[10px] text-slate-500">id: {role.role_id}</div>
    </div>
  )
}

function Badge({
  children,
  tone = 'default',
}: {
  children: ReactNode
  tone?: 'default' | 'muted'
}) {
  return (
    <span
      className={cn(
        'rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide',
        tone === 'muted'
          ? 'border-slate-600 text-slate-400'
          : 'border-cyan-700/50 bg-cyan-950/40 text-cyan-100'
      )}
    >
      {children}
    </span>
  )
}

function Section({
  title,
  count,
  children,
}: {
  title: string
  count?: number
  children: ReactNode
}) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold text-slate-200">
        {title}
        {typeof count === 'number' ? (
          <span className="ml-2 text-xs font-normal text-slate-500">({count})</span>
        ) : null}
      </h3>
      {children}
    </section>
  )
}

export default function TestWorkInEducationPage() {
  const { addToast } = useToast()
  const [form, setForm] = useState<FormState>(DEFAULT_FORM)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<WorkInEducationMatchResult | null>(null)
  const [rawOpen, setRawOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const setField = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }, [])

  const profilePayload = useMemo(() => {
    const prefs: Record<string, unknown> = {}
    if (form.wants_academic_route === 'true') prefs.wants_academic_route = true
    if (form.wants_academic_route === 'false') prefs.wants_academic_route = false

    const professional_registration =
      form.registration_body.trim() || form.registration_status !== 'none'
        ? [
            {
              body: form.registration_body.trim() || 'unspecified',
              status: form.registration_status,
              registration_scope:
                form.registration_scope && form.registration_scope !== ''
                  ? form.registration_scope
                  : 'unknown',
            },
          ]
        : []

    return {
      education_level: form.education_level,
      qualification_title: form.qualification_title,
      subject: form.subject,
      specialisation: form.specialisation || null,
      qualification_country: form.qualification_country || null,
      years_relevant_experience: Number(form.years_relevant_experience || 0),
      current_job_title: form.current_job_title || null,
      professional_registration,
      skills: form.skills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      career_preferences: prefs,
    }
  }, [form])

  const runMatch = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/career-library/work-in-education/match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: profilePayload,
          includeDrafts: form.includeDrafts,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        const msg =
          data?.error ||
          (Array.isArray(data?.details) ? data.details.join('; ') : 'Match failed')
        setError(msg)
        addToast({ title: 'Match failed', description: msg, variant: 'error' })
        setResult(null)
        return
      }
      setResult(data.match as WorkInEducationMatchResult)
      addToast({ title: 'Match complete', description: 'Results loaded', variant: 'success' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Network error'
      setError(msg)
      addToast({ title: 'Match failed', description: msg, variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

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
              Work in My Education — Match Test
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              Admin diagnostic harness. Deterministic knowledge matching — no AI, not public UI.
            </p>
          </div>
          <button
            type="button"
            onClick={runMatch}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-700 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            Run match
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
            <h2 className="text-sm font-semibold text-slate-200">Profile input</h2>
            <Field label="Education level">
              <select
                className="input"
                value={form.education_level}
                onChange={(e) => setField('education_level', e.target.value)}
              >
                {['college', 'bachelor', 'master', 'doctorate', 'professional', 'other'].map((v) => (
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
            <Field label="Subject">
              <input
                className="input"
                value={form.subject}
                onChange={(e) => setField('subject', e.target.value)}
              />
            </Field>
            <Field label="Specialisation">
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
            <Field label="Years relevant experience">
              <input
                className="input"
                type="number"
                min={0}
                max={60}
                value={form.years_relevant_experience}
                onChange={(e) => setField('years_relevant_experience', e.target.value)}
              />
            </Field>
            <Field label="Current job title">
              <input
                className="input"
                value={form.current_job_title}
                onChange={(e) => setField('current_job_title', e.target.value)}
              />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Registration body">
                <input
                  className="input"
                  value={form.registration_body}
                  onChange={(e) => setField('registration_body', e.target.value)}
                />
              </Field>
              <Field label="Registration status">
                <select
                  className="input"
                  value={form.registration_status}
                  onChange={(e) => setField('registration_status', e.target.value)}
                >
                  {['none', 'registered', 'pending', 'expired'].map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <Field label="Registration scope (NMC part / branch)">
              <select
                className="input"
                value={form.registration_scope}
                onChange={(e) => setField('registration_scope', e.target.value)}
              >
                {[
                  'unknown',
                  'adult_nursing',
                  'mental_health_nursing',
                  'childrens_nursing',
                  'learning_disability_nursing',
                  'midwifery',
                  'nursing_associate',
                ].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Skills (comma-separated)">
              <input
                className="input"
                value={form.skills}
                onChange={(e) => setField('skills', e.target.value)}
              />
            </Field>
            <Field label="Wants academic route">
              <select
                className="input"
                value={form.wants_academic_route}
                onChange={(e) => setField('wants_academic_route', e.target.value)}
              >
                <option value="null">unspecified</option>
                <option value="true">yes</option>
                <option value="false">no</option>
              </select>
            </Field>
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input
                type="checkbox"
                checked={form.includeDrafts}
                onChange={(e) => setField('includeDrafts', e.target.checked)}
              />
              Include draft roles (integration testing only)
            </label>
          </div>

          <div className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
            {error ? (
              <div className="rounded-lg border border-rose-800/60 bg-rose-950/40 p-3 text-sm text-rose-100">
                {error}
              </div>
            ) : null}
            {!result && !error ? (
              <p className="text-sm text-slate-500">Run a match to see resolution and roles.</p>
            ) : null}
            {result ? (
              <>
                <Section title="QA summary">
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    {Object.entries(result.qa_summary).map(([k, v]) => (
                      <div
                        key={k}
                        className={cn(
                          'rounded border px-2 py-1',
                          v === 'PASS' && 'border-emerald-800 text-emerald-200',
                          v === 'WARNING' && 'border-amber-800 text-amber-200',
                          v === 'FAIL' && 'border-rose-800 text-rose-200'
                        )}
                      >
                        <span className="font-semibold">{v}</span> {k.replace(/_/g, ' ')}
                      </div>
                    ))}
                  </div>
                </Section>
                <Section title="Normalised profile">
                  <pre className="overflow-auto rounded-lg bg-slate-950/80 p-3 text-[11px] text-slate-300">
                    {JSON.stringify(result.normalised_profile, null, 2)}
                  </pre>
                </Section>
                <Section title="Field / specialism resolution">
                  <div className="space-y-1 text-sm text-slate-300">
                    <div>
                      Primary field:{' '}
                      <strong>{result.resolution.primary_field?.name ?? '—'}</strong>
                    </div>
                    <div>
                      Primary specialism:{' '}
                      <strong>{result.resolution.primary_specialism?.name ?? '—'}</strong>
                    </div>
                    <div>
                      Confidence: <strong>{result.resolution.confidence}</strong>
                      {' · '}margin <strong>{result.resolution.score_margin}</strong>
                      {result.resolution.is_broad_subject ? (
                        <span className="ml-2 text-amber-300">broad subject</span>
                      ) : null}
                      {result.resolution.needs_clarification ? (
                        <span className="ml-2 text-amber-300">
                          needs clarification ({result.resolution.clarification_reason})
                        </span>
                      ) : null}
                    </div>
                    <ul className="list-disc pl-4 text-[11px] text-slate-400">
                      {result.resolution.match_reasons.map((r) => (
                        <li key={r}>{r}</li>
                      ))}
                    </ul>
                    {result.resolution.clarification_options.length ? (
                      <div className="mt-2 rounded-lg border border-amber-800/50 bg-amber-950/20 p-2 text-[11px] text-amber-100">
                        <div className="mb-1 font-semibold">Clarification options</div>
                        {result.resolution.clarification_options.map((o) => (
                          <div key={o.id}>
                            {o.name} ({o.score}) — {o.reason}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </Section>
                <div className="text-[11px] text-slate-500">
                  Queries: {result.meta.query_count} · {result.meta.elapsed_ms}ms · candidates{' '}
                  {result.meta.candidate_roles_considered}
                </div>
              </>
            ) : null}
          </div>
        </div>

        {result ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Section title="Immediate" count={result.recommendations.immediate.length}>
              <div className="space-y-2">
                {result.recommendations.immediate.map((r) => (
                  <RoleCard key={r.role_id} role={r} />
                ))}
                {!result.recommendations.immediate.length ? (
                  <Empty>No immediate roles</Empty>
                ) : null}
              </div>
            </Section>
            <Section title="Realistic next" count={result.recommendations.realistic_next.length}>
              <div className="space-y-2">
                {result.recommendations.realistic_next.map((r) => (
                  <RoleCard key={r.role_id} role={r} />
                ))}
                {!result.recommendations.realistic_next.length ? (
                  <Empty>No realistic-next roles</Empty>
                ) : null}
              </div>
            </Section>
            <Section
              title="Future progression"
              count={result.recommendations.future_progression.length}
            >
              <div className="space-y-2">
                {result.recommendations.future_progression.map((r) => (
                  <RoleCard key={r.role_id} role={r} />
                ))}
                {!result.recommendations.future_progression.length ? (
                  <Empty>No future-progression roles</Empty>
                ) : null}
              </div>
            </Section>
            <Section
              title="Academic / research"
              count={result.recommendations.academic_or_research.length}
            >
              <div className="space-y-2">
                {result.recommendations.academic_or_research.map((r) => (
                  <RoleCard key={r.role_id} role={r} />
                ))}
                {!result.recommendations.academic_or_research.length ? (
                  <Empty>No academic/research roles</Empty>
                ) : null}
              </div>
            </Section>
            <Section
              title="Blocked / needs review"
              count={result.recommendations.blocked_or_needs_review.length}
            >
              <div className="space-y-2">
                {result.recommendations.blocked_or_needs_review.map((r) => (
                  <RoleCard key={r.role_id} role={r} />
                ))}
                {!result.recommendations.blocked_or_needs_review.length ? (
                  <Empty>None</Empty>
                ) : null}
              </div>
            </Section>
            <Section title="Gaps & provenance">
              <ul className="mb-3 list-disc space-y-1 pl-4 text-[11px] text-slate-400">
                {result.overall_gaps.map((g) => (
                  <li key={g.code}>
                    [{g.severity}] {g.message}
                  </li>
                ))}
                {!result.overall_gaps.length ? <li>No aggregate gaps</li> : null}
              </ul>
              <div className="font-mono text-[10px] text-slate-500">
                field_ids: {result.data_provenance.field_ids.join(', ') || '—'}
                <br />
                specialism_ids: {result.data_provenance.specialism_ids.join(', ') || '—'}
                <br />
                role_ids: {result.data_provenance.role_ids.length}
              </div>
            </Section>
          </div>
        ) : null}

        {result ? (
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-900/40">
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-3 text-sm text-slate-300"
              onClick={() => setRawOpen((v) => !v)}
            >
              Raw JSON debug
              {rawOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {rawOpen ? (
              <pre className="max-h-[480px] overflow-auto border-t border-slate-800 p-4 text-[11px] text-slate-400">
                {JSON.stringify(result, null, 2)}
              </pre>
            ) : null}
          </div>
        ) : null}
      </div>

      <style jsx global>{`
        .input {
          width: 100%;
          border-radius: 0.5rem;
          border: 1px solid rgb(51 65 85);
          background: rgb(2 6 23 / 0.8);
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          color: rgb(226 232 240);
        }
      `}</style>
    </AppShell>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1 text-xs text-slate-400">
      <span>{label}</span>
      {children}
    </label>
  )
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="text-xs text-slate-500">{children}</p>
}
