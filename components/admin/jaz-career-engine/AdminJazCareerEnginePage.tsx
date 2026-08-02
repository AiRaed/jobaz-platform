'use client'

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Brain,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  ShieldOff,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { cn } from '@/lib/utils'
import type {
  JazCareerEngineLogEntry,
  JazEngineStatusSnapshot,
  JazLogAdminFeedback,
} from '@/lib/jaz-career-engine/logging/types'
import type { LearningLoopSnapshot } from '@/lib/analytics/jazLearningLoop'
import type { PlanEngineAdminSnapshot } from '@/lib/jaz-plan-engine/planAnalytics'

const FEEDBACK_OPTIONS: { value: JazLogAdminFeedback; label: string }[] = [
  { value: 'good_result', label: 'Good result' },
  { value: 'wrong_route', label: 'Wrong route' },
  { value: 'wrong_course', label: 'Wrong course' },
  { value: 'missing_affiliate', label: 'Missing affiliate' },
  { value: 'needs_better_explanation', label: 'Needs better explanation' },
]

type AdminTab =
  | 'engine_health'
  | 'recent_plans'
  | 'user_behaviour'
  | 'course_matching'
  | 'missing_affiliates'
  | 'learning_loop'
  | 'plan_engine'

const TABS: { id: AdminTab; label: string }[] = [
  { id: 'engine_health', label: 'Engine Health' },
  { id: 'recent_plans', label: 'Recent Plans' },
  { id: 'user_behaviour', label: 'User Behaviour' },
  { id: 'course_matching', label: 'Course Matching' },
  { id: 'missing_affiliates', label: 'Missing Affiliates' },
  { id: 'learning_loop', label: 'Learning Loop' },
  { id: 'plan_engine', label: 'Plan Engine' },
]

function StatusPill({
  ok,
  label,
}: {
  ok: boolean | 'unknown'
  label: string
}) {
  const color =
    ok === true
      ? 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200'
      : ok === false
        ? 'border-rose-500/40 bg-rose-950/40 text-rose-200'
        : 'border-slate-600 bg-slate-900/60 text-slate-300'
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs', color)}>
      {label}
    </span>
  )
}

function Card({
  title,
  children,
  className,
}: {
  title: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 sm:p-5',
        className
      )}
    >
      <h2 className="text-sm font-semibold text-slate-100 mb-3">{title}</h2>
      {children}
    </section>
  )
}

function EmptyState({ message }: { message?: string }) {
  return (
    <p className="text-sm text-slate-500">{message || 'No activity tracked yet'}</p>
  )
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2.5">
      <p className="text-[11px] text-slate-500">{label}</p>
      <p className="text-lg font-semibold text-slate-100 tabular-nums mt-0.5">{value}</p>
    </div>
  )
}

function fmtTime(iso: string | null | undefined) {
  if (!iso) return 'Not tracked yet'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function shortId(id: string | null | undefined) {
  if (!id) return 'anonymous'
  return id.length > 10 ? `${id.slice(0, 8)}…` : id
}

function priorityClass(p: string) {
  if (p === 'high') return 'text-rose-200'
  if (p === 'medium') return 'text-amber-200'
  return 'text-slate-400'
}

export default function AdminJazCareerEnginePage() {
  const [tab, setTab] = useState<AdminTab>('engine_health')
  const [status, setStatus] = useState<JazEngineStatusSnapshot | null>(null)
  const [logs, setLogs] = useState<JazCareerEngineLogEntry[]>([])
  const [missing, setMissing] = useState<
    Array<{
      course_type: string
      route_category: string
      reason: string
      priority: string
      count: number
      suggested_admin_action: string
    }>
  >([])
  const [learning, setLearning] = useState<LearningLoopSnapshot | null>(null)
  const [planEngine, setPlanEngine] = useState<PlanEngineAdminSnapshot | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [planMigrationPath, setPlanMigrationPath] = useState(
    'supabase/migrations/20250801140000_jaz_plan_engine.sql'
  )
  const [tableReady, setTableReady] = useState(false)
  const [migrationPath, setMigrationPath] = useState(
    'supabase/migrations/20250801120000_jaz_career_engine_logs.sql'
  )
  const [eventsMigrationPath, setEventsMigrationPath] = useState(
    'supabase/migrations/20250801130000_jaz_user_activity_events.sql'
  )
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [feedbackBusy, setFeedbackBusy] = useState(false)
  const [seedBusy, setSeedBusy] = useState(false)
  const [seedMessage, setSeedMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/jaz-career-engine', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setStatus(data.status)
      setLogs(data.logs || [])
      setMissing(data.missing_affiliates || [])
      setLearning(data.learning_loop || null)
      setPlanEngine(data.plan_engine || null)
      setNote(data.note || null)
      setTableReady(Boolean(data.table_ready ?? data.status?.table_ready))
      if (data.migration_path) setMigrationPath(data.migration_path)
      if (data.events_migration_path) setEventsMigrationPath(data.events_migration_path)
      if (data.plan_migration_path) setPlanMigrationPath(data.plan_migration_path)
      setSelectedId((prev) => prev || data.logs?.[0]?.id || null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const selected = useMemo(
    () => logs.find((l) => l.id === selectedId) ?? null,
    [logs, selectedId]
  )

  const saveFeedback = async (feedback: JazLogAdminFeedback) => {
    if (!selected) return
    setFeedbackBusy(true)
    try {
      const res = await fetch('/api/admin/jaz-career-engine', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: selected.id, feedback }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')
      setLogs((prev) =>
        prev.map((l) =>
          l.id === selected.id
            ? {
                ...l,
                admin_feedback: feedback,
                admin_feedback_at: new Date().toISOString(),
              }
            : l
        )
      )
      if (data.warning) setSeedMessage(data.warning)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Feedback save failed')
    } finally {
      setFeedbackBusy(false)
    }
  }

  const seedTest = async () => {
    setSeedBusy(true)
    setSeedMessage(null)
    try {
      const res = await fetch('/api/admin/jaz-career-engine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'seed_test' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Seed failed')
      setSeedMessage(data.message || (data.warning ? String(data.warning) : 'Seeded'))
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Seed failed')
    } finally {
      setSeedBusy(false)
    }
  }

  const isDev = process.env.NODE_ENV === 'development'
  const behaviour = learning?.behaviour
  const eventsReady = behaviour?.events_table_ready ?? false

  return (
    <AppShell>
      <header className="mb-6 pb-5 border-b border-slate-800/60">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Admin home
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-cyan-500/30 bg-cyan-950/30 shrink-0">
              <Brain className="w-5 h-5 text-cyan-300" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-50">JAZ Career Engine</h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Control room + Learning Loop — engine health, behaviour analytics, and
                improvement insights (admin decides what to change).
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => void seedTest()}
              disabled={seedBusy}
              className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/40 px-3 py-2 text-xs text-amber-100 hover:bg-amber-950/30 disabled:opacity-50"
            >
              {seedBusy ? 'Seeding…' : 'Insert test log'}
            </button>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-cyan-500/40"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/30 px-3 py-2 text-sm text-rose-200">
          {error}
        </div>
      )}
      {note && (
        <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-950/20 px-3 py-2 text-xs text-amber-100/90">
          {note}
        </div>
      )}
      {seedMessage && (
        <div className="mb-4 rounded-lg border border-cyan-500/20 bg-cyan-950/20 px-3 py-2 text-xs text-cyan-100/90">
          {seedMessage}
        </div>
      )}
      {!tableReady && (
        <div className="mb-4 rounded-lg border border-violet-500/30 bg-violet-950/20 px-3 py-3 text-xs text-violet-100/90 space-y-2">
          <p className="font-semibold text-violet-100">Apply engine logs migration</p>
          <p>
            Open Supabase → SQL Editor → paste and run{' '}
            <span className="font-mono text-violet-200">{migrationPath}</span>
          </p>
        </div>
      )}
      {!eventsReady && (
        <div className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-950/20 px-3 py-3 text-xs text-cyan-100/90 space-y-2">
          <p className="font-semibold text-cyan-100">Apply Learning Loop migration</p>
          <p>
            Also run{' '}
            <span className="font-mono text-cyan-200">{eventsMigrationPath}</span> for{' '}
            <span className="font-mono">jaz_user_activity_events</span>.
          </p>
        </div>
      )}

      <nav className="mb-6 flex flex-wrap gap-1.5 border-b border-slate-800/80 pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition',
              tab === t.id
                ? 'bg-cyan-950/50 border border-cyan-500/40 text-cyan-100'
                : 'border border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            )}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === 'engine_health' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <Card title="Engine status">
              {status ? (
                <div className="space-y-2 text-sm">
                  <StatusPill
                    ok={status.engine_status === 'active'}
                    label={
                      status.engine_status === 'active'
                        ? 'Active'
                        : status.engine_status === 'error'
                          ? 'Error'
                          : 'Unknown'
                    }
                  />
                  <p className="text-xs text-slate-400 font-mono">{status.api_endpoint}</p>
                  <p className="text-xs text-slate-300">
                    Version:{' '}
                    <span className="text-slate-100">{status.engine_version || 'Not tracked yet'}</span>
                  </p>
                </div>
              ) : (
                <EmptyState message={loading ? 'Loading…' : 'Not tracked yet'} />
              )}
            </Card>

            <Card title="OpenAI in Career Assistant">
              <div className="flex items-center gap-2 text-sm text-emerald-200">
                <ShieldOff className="w-4 h-4" />
                Disabled / not used
              </div>
              <p className="text-xs text-slate-500 mt-2">Ollama-only features; no OpenAI fallback chain.</p>
            </Card>

            <Card title="Ollama">
              {status ? (
                <div className="space-y-2 text-xs">
                  <StatusPill
                    ok={
                      status.ollama_status === 'connected'
                        ? true
                        : status.ollama_status === 'not_connected'
                          ? false
                          : 'unknown'
                    }
                    label={
                      status.ollama_status === 'connected'
                        ? 'Connected'
                        : status.ollama_status === 'not_connected'
                          ? 'Not connected'
                          : 'Unknown'
                    }
                  />
                  <p className="text-slate-400">
                    URL:{' '}
                    <span className="font-mono text-slate-200">
                      {status.ollama_base_url || '—'}
                    </span>
                  </p>
                  <p className="text-slate-400">
                    Model:{' '}
                    <span className="font-mono text-slate-200">
                      {status.ollama_model || '—'}
                    </span>
                  </p>
                  <p className="text-slate-400">
                    Timeout:{' '}
                    <span className="text-slate-200">
                      {status.ollama_timeout_ms != null
                        ? `${status.ollama_timeout_ms} ms`
                        : '—'}
                    </span>
                  </p>
                  <p className="text-slate-400">
                    Last Ollama success:{' '}
                    <span className="text-slate-200">
                      {status.last_ollama_success_at
                        ? fmtTime(status.last_ollama_success_at)
                        : 'None yet'}
                    </span>
                  </p>
                  <p className="text-slate-400">
                    Last Ollama latency:{' '}
                    <span className="text-slate-200">
                      {status.last_ollama_success_latency_ms != null
                        ? `${status.last_ollama_success_latency_ms} ms`
                        : '—'}
                    </span>
                  </p>
                  <p className="text-slate-400">
                    Fallback enabled: <span className="text-slate-200">Yes</span>
                  </p>
                  <p className="text-slate-500">
                    Last error kind:{' '}
                    <span className="text-amber-200">
                      {status.last_ollama_error_kind || '—'}
                    </span>
                  </p>
                  <p className="text-slate-500 break-words">
                    Last Ollama error: {status.last_ollama_error || 'None'}
                  </p>
                  {status.last_ollama_error_detail && (
                    <p className="text-slate-600 break-words">
                      Detail: {status.last_ollama_error_detail}
                    </p>
                  )}
                  <p className="text-slate-500 break-words">
                    Fallback reason: {status.last_fallback_reason || 'None'}
                  </p>
                  <p className="text-[11px] text-slate-600">
                    Health: <span className="font-mono">/api/jaz-career/ollama-health</span>
                  </p>
                </div>
              ) : (
                <EmptyState />
              )}
            </Card>

            <Card title="Last analysis">
              {status ? (
                <div className="space-y-1 text-xs text-slate-300">
                  <p>Success: {fmtTime(status.last_success_at)}</p>
                  <p>Last error: {status.last_error || 'None'}</p>
                  <p>
                    Avg response:{' '}
                    {status.average_duration_ms != null
                      ? `${status.average_duration_ms} ms`
                      : 'Not tracked yet'}
                  </p>
                </div>
              ) : (
                <EmptyState />
              )}
            </Card>
          </div>

          <Card title="Provider / AI status (recent logs)" className="mb-6">
            {status && status.logs_available ? (
              <div className="grid gap-3 sm:grid-cols-4 text-sm">
                <div>
                  <p className="text-xs text-slate-500">jaz (Ollama)</p>
                  <p className="text-lg font-semibold text-cyan-200">{status.provider_counts.jaz}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">jaz_fallback</p>
                  <p className="text-lg font-semibold text-amber-200">
                    {status.provider_counts.jaz_fallback}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">legacy / error</p>
                  <p className="text-lg font-semibold text-slate-200">{status.provider_counts.legacy}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500">Fallback usage %</p>
                  <p className="text-lg font-semibold text-slate-100">
                    {status.fallback_usage_percent != null
                      ? `${status.fallback_usage_percent}%`
                      : 'Not tracked yet'}
                  </p>
                </div>
              </div>
            ) : (
              <EmptyState message="Not tracked yet — run a Career Assistant path to generate logs." />
            )}
            <p className="text-[11px] text-slate-500 mt-3">
              Log source: {status?.logs_source || 'none'}
            </p>
          </Card>
        </>
      )}

      {tab === 'recent_plans' && (
        <>
          <Card title="Latest Career Assistant results" className="mb-6 overflow-x-auto">
            {logs.length === 0 ? (
              <EmptyState message="No activity tracked yet. After analyses run, they appear here." />
            ) : (
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead className="text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="py-2 pr-2 font-medium">created_at</th>
                    <th className="py-2 pr-2 font-medium">goal</th>
                    <th className="py-2 pr-2 font-medium">route</th>
                    <th className="py-2 pr-2 font-medium">focus</th>
                    <th className="py-2 pr-2 font-medium">upgrade</th>
                    <th className="py-2 pr-2 font-medium">source</th>
                    <th className="py-2 pr-2 font-medium">ai</th>
                    <th className="py-2 pr-2 font-medium">matched</th>
                    <th className="py-2 pr-2 font-medium">warnings</th>
                    <th className="py-2 pr-2 font-medium">user</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr
                      key={log.id}
                      onClick={() => setSelectedId(log.id)}
                      className={cn(
                        'border-b border-slate-900/80 cursor-pointer hover:bg-slate-900/50',
                        selectedId === log.id && 'bg-cyan-950/20'
                      )}
                    >
                      <td className="py-2 pr-2 text-slate-400 whitespace-nowrap">
                        {fmtTime(log.created_at)}
                      </td>
                      <td className="py-2 pr-2 text-slate-300">{log.goal_path}</td>
                      <td className="py-2 pr-2 text-slate-200">{log.route_title || '—'}</td>
                      <td className="py-2 pr-2 text-slate-300">{log.current_focus || '—'}</td>
                      <td className="py-2 pr-2 text-slate-300">{log.next_upgrade || '—'}</td>
                      <td className="py-2 pr-2">
                        <span className="font-mono text-cyan-200/90">{log.plan_source}</span>
                      </td>
                      <td className="py-2 pr-2 font-mono text-slate-400">{log.ai_provider}</td>
                      <td className="py-2 pr-2">{log.matched_courses_count}</td>
                      <td className="py-2 pr-2">{log.safety_warnings_count}</td>
                      <td className="py-2 pr-2 text-slate-500">
                        {shortId(log.user_id || log.anonymous_id)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Admin feedback (selected plan)" className="mb-6">
            {!selected ? (
              <EmptyState message="Select a plan to mark feedback." />
            ) : (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  Current:{' '}
                  <span className="text-slate-200">{selected.admin_feedback || 'None yet'}</span>
                </p>
                <div className="flex flex-wrap gap-2">
                  {FEEDBACK_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={feedbackBusy}
                      onClick={() => void saveFeedback(opt.value)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs transition',
                        selected.admin_feedback === opt.value
                          ? 'border-emerald-500/50 bg-emerald-950/40 text-emerald-100'
                          : 'border-slate-700 text-slate-300 hover:border-cyan-500/40'
                      )}
                    >
                      {opt.value === 'good_result' && (
                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                      )}
                      {opt.value !== 'good_result' && (
                        <AlertTriangle className="w-3 h-3 inline mr-1" />
                      )}
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </Card>

          {isDev && (
            <Card title="Dev debug panel">
              {!selected ? (
                <EmptyState message="Select a plan." />
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-[11px] text-slate-500 mb-1">Safety notes</p>
                    <pre className="text-[11px] text-slate-300 bg-slate-950/80 border border-slate-800 rounded-lg p-3 overflow-auto max-h-40">
                      {JSON.stringify(selected.safety_notes, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 mb-1">Request payload (redacted)</p>
                    <pre className="text-[11px] text-slate-300 bg-slate-950/80 border border-slate-800 rounded-lg p-3 overflow-auto max-h-48">
                      {JSON.stringify(selected.request_payload, null, 2)}
                    </pre>
                  </div>
                  <div>
                    <p className="text-[11px] text-slate-500 mb-1">Response payload (compact)</p>
                    <pre className="text-[11px] text-slate-300 bg-slate-950/80 border border-slate-800 rounded-lg p-3 overflow-auto max-h-64">
                      {JSON.stringify(selected.response_payload, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </Card>
          )}
        </>
      )}

      {tab === 'user_behaviour' && (
        <>
          <Card title="User Behaviour Summary" className="mb-6">
            {!behaviour || behaviour.total_events === 0 ? (
              <EmptyState />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Metric label="Career plans generated" value={behaviour.plans_generated} />
                <Metric label="Saved plans" value={behaviour.plans_saved} />
                <Metric label="CV Builder opens" value={behaviour.cv_builder_opens} />
                <Metric label="View Jobs clicks" value={behaviour.view_jobs_clicks} />
                <Metric label="Apply Now clicks" value={behaviour.apply_now_clicks} />
                <Metric label="Save Interest clicks" value={behaviour.save_interest_clicks} />
                <Metric label="Job applications / applied" value={behaviour.job_applications} />
                <Metric
                  label="Most active goal path"
                  value={behaviour.most_active_goal_path || '—'}
                />
              </div>
            )}
          </Card>

          <Card title="Popular Routes" className="mb-6 overflow-x-auto">
            {!learning?.popular_routes?.length ? (
              <EmptyState />
            ) : (
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead className="text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="py-2 pr-2">route_title</th>
                    <th className="py-2 pr-2">goal_path</th>
                    <th className="py-2 pr-2">count</th>
                    <th className="py-2 pr-2">saved</th>
                    <th className="py-2 pr-2">cv_open</th>
                    <th className="py-2 pr-2">job_click</th>
                    <th className="py-2 pr-2">course_click</th>
                    <th className="py-2 pr-2">apply_now</th>
                  </tr>
                </thead>
                <tbody>
                  {learning.popular_routes.map((r) => (
                    <tr
                      key={`${r.route_title}-${r.goal_path}`}
                      className="border-b border-slate-900"
                    >
                      <td className="py-2 pr-2 text-slate-200">{r.route_title}</td>
                      <td className="py-2 pr-2 text-slate-400">{r.goal_path}</td>
                      <td className="py-2 pr-2">{r.count}</td>
                      <td className="py-2 pr-2">{r.saved_plan_count}</td>
                      <td className="py-2 pr-2">{r.cv_open_count}</td>
                      <td className="py-2 pr-2">{r.job_click_count}</td>
                      <td className="py-2 pr-2">{r.course_click_count}</td>
                      <td className="py-2 pr-2">{r.apply_now_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          <Card title="Funnel by Career Path" className="mb-6 overflow-x-auto">
            {!learning?.funnel?.length ? (
              <EmptyState />
            ) : (
              <table className="w-full text-left text-xs min-w-[900px]">
                <thead className="text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="py-2 pr-2">route</th>
                    <th className="py-2 pr-2">goal</th>
                    <th className="py-2 pr-2">generated</th>
                    <th className="py-2 pr-2">saved</th>
                    <th className="py-2 pr-2">cv</th>
                    <th className="py-2 pr-2">jobs</th>
                    <th className="py-2 pr-2">course</th>
                    <th className="py-2 pr-2">apply</th>
                    <th className="py-2 pr-2">applied</th>
                  </tr>
                </thead>
                <tbody>
                  {learning.funnel.map((f) => (
                    <tr
                      key={`${f.route_title}-${f.goal_path}-funnel`}
                      className="border-b border-slate-900"
                    >
                      <td className="py-2 pr-2 text-slate-200">{f.route_title}</td>
                      <td className="py-2 pr-2 text-slate-400">{f.goal_path}</td>
                      <td className="py-2 pr-2">{f.plan_generated}</td>
                      <td className="py-2 pr-2">{f.plan_saved}</td>
                      <td className="py-2 pr-2">{f.cv_builder_opened}</td>
                      <td className="py-2 pr-2">{f.jobs_clicked}</td>
                      <td className="py-2 pr-2">{f.course_clicked}</td>
                      <td className="py-2 pr-2">{f.apply_now_clicked}</td>
                      <td className="py-2 pr-2">{f.marked_applied}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      {tab === 'course_matching' && (
        <Card title="Course matching monitor (selected plan)" className="mb-6">
          {logs.length > 0 && (
            <div className="mb-4 flex flex-wrap gap-2">
              {logs.slice(0, 8).map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setSelectedId(l.id)}
                  className={cn(
                    'rounded-md border px-2 py-1 text-[11px]',
                    selectedId === l.id
                      ? 'border-cyan-500/40 text-cyan-100'
                      : 'border-slate-700 text-slate-400'
                  )}
                >
                  {l.route_title || l.goal_path}
                </button>
              ))}
            </div>
          )}
          {!selected ? (
            <EmptyState message="Select a plan from Recent Plans first." />
          ) : (
            <div className="grid gap-4 lg:grid-cols-2 text-xs">
              <div>
                <p className="text-slate-400 mb-2">Recommended course types</p>
                {selected.recommended_course_types.length === 0 ? (
                  <EmptyState message="None" />
                ) : (
                  <ul className="space-y-1">
                    {selected.recommended_course_types.map((c, i) => (
                      <li key={`${c.title}-${i}`} className="text-slate-200">
                        {c.title}{' '}
                        <span className="text-slate-500">({c.priority || 'n/a'})</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-slate-400 mb-2">Matched JobAZ courses</p>
                {selected.matched_jobaz_courses.length === 0 ? (
                  <EmptyState message="No matched courses" />
                ) : (
                  <ul className="space-y-2">
                    {selected.matched_jobaz_courses.map((c, i) => (
                      <li
                        key={`${c.course_id || c.title}-${i}`}
                        className="rounded-lg border border-slate-800 px-3 py-2"
                      >
                        <p className="text-slate-100">{c.title}</p>
                        <p className="text-slate-500 mt-0.5">
                          status: {c.commercial_status || '—'} · button:{' '}
                          {c.primary_button || '—'} · referral:{' '}
                          {c.referral_url ? 'yes' : 'no'}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}
        </Card>
      )}

      {tab === 'missing_affiliates' && (
        <>
          <Card title="Missing affiliate opportunities (engine logs)" className="mb-6 overflow-x-auto">
            {missing.length === 0 ? (
              <EmptyState message="None aggregated yet — either no missing matches, or no logs." />
            ) : (
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="py-2 pr-2">course_type</th>
                    <th className="py-2 pr-2">route</th>
                    <th className="py-2 pr-2">reason</th>
                    <th className="py-2 pr-2">priority</th>
                    <th className="py-2 pr-2">count</th>
                    <th className="py-2 pr-2">suggested action</th>
                  </tr>
                </thead>
                <tbody>
                  {missing.map((m) => (
                    <tr
                      key={`${m.course_type}-${m.route_category}`}
                      className="border-b border-slate-900"
                    >
                      <td className="py-2 pr-2 text-slate-200">{m.course_type}</td>
                      <td className="py-2 pr-2 text-slate-400">{m.route_category}</td>
                      <td className="py-2 pr-2 text-slate-400 max-w-xs truncate" title={m.reason}>
                        {m.reason}
                      </td>
                      <td className={cn('py-2 pr-2', priorityClass(m.priority))}>{m.priority}</td>
                      <td className="py-2 pr-2">{m.count}</td>
                      <td className="py-2 pr-2 text-cyan-200/90">{m.suggested_admin_action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <p className="text-[11px] text-slate-500 mt-3">
              Tip: add or link courses in{' '}
              <Link href="/admin/courses" className="text-cyan-300 hover:underline">
                Admin Courses
              </Link>
              .
            </p>
          </Card>

          <Card title="Course Demand / Missing Affiliate (Learning Loop)" className="overflow-x-auto">
            {!learning?.course_demand?.length ? (
              <EmptyState />
            ) : (
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead className="text-slate-500 border-b border-slate-800">
                  <tr>
                    <th className="py-2 pr-2">course type</th>
                    <th className="py-2 pr-2">route</th>
                    <th className="py-2 pr-2">recommended</th>
                    <th className="py-2 pr-2">active affiliates</th>
                    <th className="py-2 pr-2">missing</th>
                    <th className="py-2 pr-2">save interest</th>
                    <th className="py-2 pr-2">priority</th>
                  </tr>
                </thead>
                <tbody>
                  {learning.course_demand.map((c) => (
                    <tr
                      key={`${c.recommended_course_type}-${c.route_title}`}
                      className="border-b border-slate-900"
                    >
                      <td className="py-2 pr-2 text-slate-200">{c.recommended_course_type}</td>
                      <td className="py-2 pr-2 text-slate-400">{c.route_title}</td>
                      <td className="py-2 pr-2">{c.times_recommended}</td>
                      <td className="py-2 pr-2">{c.active_affiliate_matches}</td>
                      <td className="py-2 pr-2">{c.missing_affiliate_count}</td>
                      <td className="py-2 pr-2">{c.save_interest_count}</td>
                      <td className={cn('py-2 pr-2', priorityClass(c.suggested_priority))}>
                        {c.suggested_priority}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>
        </>
      )}

      {tab === 'learning_loop' && (
        <>
          <Card title="Weak Result Signals" className="mb-6">
            {!learning?.weak_signals?.length ? (
              <EmptyState message="No weak signals yet — need real plans and events." />
            ) : (
              <ul className="space-y-2 text-xs">
                {learning.weak_signals.map((s, i) => (
                  <li
                    key={`${s.kind}-${i}`}
                    className="rounded-lg border border-slate-800 px-3 py-2"
                  >
                    <span className={cn('font-semibold', priorityClass(s.severity))}>
                      {s.severity}
                    </span>
                    <span className="text-slate-500 mx-2">·</span>
                    <span className="text-slate-200">{s.detail}</span>
                    {(s.route_title || s.goal_path) && (
                      <p className="text-slate-500 mt-1">
                        {s.route_title || '—'} / {s.goal_path || '—'}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="JAZ Improvement Suggestions">
            <p className="text-[11px] text-slate-500 mb-3">
              Rule-based insights only. Admin/founder decides what to change — nothing auto-modifies
              the engine.
            </p>
            {!learning?.suggestions?.length ? (
              <EmptyState message="No improvement suggestions yet." />
            ) : (
              <ul className="space-y-3">
                {learning.suggestions.map((s, i) => (
                  <li
                    key={`${s.title}-${i}`}
                    className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2.5"
                  >
                    <p className="text-sm text-slate-100">
                      <span className={cn('text-xs uppercase mr-2', priorityClass(s.priority))}>
                        {s.priority}
                      </span>
                      {s.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{s.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}

      {tab === 'plan_engine' && (
        <>
          {!planEngine?.table_ready && (
            <div className="mb-4 rounded-lg border border-cyan-500/30 bg-cyan-950/20 px-3 py-3 text-xs text-cyan-100/90 space-y-2">
              <p className="font-semibold text-cyan-100">Apply Plan Engine migration</p>
              <p>
                Run{' '}
                <span className="font-mono text-cyan-200">{planMigrationPath}</span> for{' '}
                <span className="font-mono">jaz_user_action_plans</span> +{' '}
                <span className="font-mono">jaz_plan_steps</span>.
              </p>
            </div>
          )}

          <Card title="Plan Engine status" className="mb-6">
            {planEngine ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                <Metric label="Generated plans" value={planEngine.generated_plans_count} />
                <Metric label="Completed steps" value={planEngine.completed_steps_count} />
                <Metric label="Skipped steps" value={planEngine.skipped_steps_count} />
                <Metric
                  label="Fallback / Ollama"
                  value={`${planEngine.fallback_plans_count} / ${planEngine.ollama_plans_count}`}
                />
                <div className="sm:col-span-2 text-xs text-slate-400 space-y-1">
                  <p>
                    API:{' '}
                    <span className="font-mono text-slate-200">{planEngine.api_endpoint}</span>
                  </p>
                  <p>
                    Version:{' '}
                    <span className="font-mono text-slate-200">{planEngine.engine_version}</span>
                  </p>
                  <p className="text-emerald-200">OpenAI disabled</p>
                </div>
              </div>
            ) : (
              <EmptyState />
            )}
          </Card>

          <Card title="Completion rates" className="mb-6">
            {planEngine ? (
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric
                  label="CV actions"
                  value={
                    planEngine.completion_rates.cv_action != null
                      ? `${planEngine.completion_rates.cv_action}%`
                      : '—'
                  }
                />
                <Metric
                  label="Job actions"
                  value={
                    planEngine.completion_rates.job_action != null
                      ? `${planEngine.completion_rates.job_action}%`
                      : '—'
                  }
                />
                <Metric
                  label="Course actions"
                  value={
                    planEngine.completion_rates.course_action != null
                      ? `${planEngine.completion_rates.course_action}%`
                      : '—'
                  }
                />
              </div>
            ) : (
              <EmptyState />
            )}
          </Card>

          <Card title="Most common next actions" className="mb-6">
            {!planEngine?.most_common_next_actions?.length ? (
              <EmptyState />
            ) : (
              <ul className="space-y-1.5 text-xs">
                {planEngine.most_common_next_actions.map((a) => (
                  <li
                    key={a.title}
                    className="flex justify-between gap-3 border-b border-slate-900 py-1.5"
                  >
                    <span className="text-slate-200">{a.title}</span>
                    <span className="text-slate-500 tabular-nums">{a.count}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Weak plan signals" className="mb-6">
            {!planEngine?.weak_signals?.length ? (
              <EmptyState message="No weak plan signals yet." />
            ) : (
              <ul className="space-y-2 text-xs">
                {planEngine.weak_signals.map((s, i) => (
                  <li key={`${s.kind}-${i}`} className="rounded-lg border border-slate-800 px-3 py-2">
                    <span className={cn('font-semibold', priorityClass(s.severity))}>
                      {s.severity}
                    </span>
                    <span className="text-slate-500 mx-2">·</span>
                    <span className="text-slate-200">{s.detail}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card title="Plan Engine improvement suggestions">
            {!planEngine?.suggestions?.length ? (
              <EmptyState message="No suggestions yet — need real action plans." />
            ) : (
              <ul className="space-y-3">
                {planEngine.suggestions.map((s, i) => (
                  <li
                    key={`${s.title}-${i}`}
                    className="rounded-lg border border-slate-800 bg-slate-950/40 px-3 py-2.5"
                  >
                    <p className="text-sm text-slate-100">
                      <span className={cn('text-xs uppercase mr-2', priorityClass(s.priority))}>
                        {s.priority}
                      </span>
                      {s.title}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{s.detail}</p>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </>
      )}
    </AppShell>
  )
}
