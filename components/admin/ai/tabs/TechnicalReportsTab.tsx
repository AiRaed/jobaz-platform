'use client'

import { useCallback, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type {
  AdminAiPriority,
  HealthModule,
  HealthStatus,
  SiteHealthSnapshot,
} from '@/lib/admin/ai/types'
import {
  ActionButton,
  ReportPanel,
  SectionHeader,
  SiteBrainStatusLine,
  StatusBanner,
  PriorityLegend,
  type SiteBrainStatusMeta,
} from '../AdminAiShared'

const HEALTH_ACTIONS = [
  { scope: 'basic', label: 'Run Basic Health Check', primary: false },
  { scope: 'ai', label: 'Check AI Services', primary: false },
  { scope: 'courses', label: 'Check Courses & Referrals', primary: false },
  { scope: 'cv', label: 'Check CV/Documents', primary: false },
  { scope: 'jobs', label: 'Check Jobs APIs', primary: false },
  { scope: 'interview', label: 'Check Interview Voice', primary: false },
  { scope: 'tracking', label: 'Check Tracking Events', primary: false },
] as const

const MODULE_ORDER = [
  'ai_services',
  'interview_voice',
  'cv_documents',
  'career_assistant',
  'jobs',
  'courses_affiliate',
  'auth_user',
  'supabase_db',
  'tracking',
  'deployment',
] as const

const MODULE_PLACEHOLDER_TITLES: Record<(typeof MODULE_ORDER)[number], string> = {
  ai_services: 'AI Services',
  interview_voice: 'Interview Voice / ElevenLabs',
  cv_documents: 'CV & Documents',
  career_assistant: 'Career Assistant / My Plan',
  jobs: 'Jobs APIs',
  courses_affiliate: 'Courses & Referrals',
  auth_user: 'Auth & User Data',
  supabase_db: 'Supabase / Database',
  tracking: 'Tracking / Analytics',
  deployment: 'Deployment / Environment',
}

function statusStyles(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
    case 'warning':
      return 'border-amber-500/30 bg-amber-950/20 text-amber-200'
    case 'error':
      return 'border-rose-500/30 bg-rose-950/20 text-rose-200'
    default:
      return 'border-slate-600/50 bg-slate-900/40 text-slate-400'
  }
}

function statusLabel(status: HealthStatus): string {
  switch (status) {
    case 'healthy':
      return 'Healthy'
    case 'warning':
      return 'Warning'
    case 'error':
      return 'Error'
    case 'not_wired':
      return 'Not wired yet'
  }
}

function formatCheckedAt(iso: string | null): string {
  if (!iso) return 'Not checked yet'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return iso
  }
}

function ModuleCard({ module }: { module: HealthModule }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full text-left px-3.5 py-3 flex items-start gap-3 hover:bg-slate-900/40 transition"
      >
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-slate-100">{module.title}</p>
            <span
              className={cn(
                'rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide',
                statusStyles(module.status)
              )}
            >
              {statusLabel(module.status)}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 line-clamp-2">{module.explanation}</p>
          <p className="text-[10px] text-slate-600 mt-1">
            Last checked: {formatCheckedAt(module.lastCheckedAt)}
          </p>
        </div>
        <span className="text-slate-500 text-xs shrink-0">{open ? 'Hide' : 'Details'}</span>
      </button>
      {open ? (
        <ul className="border-t border-slate-800 divide-y divide-slate-800 max-h-72 overflow-y-auto">
          {module.checks.map((c) => (
            <li key={c.id} className="px-3.5 py-2.5 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={cn(
                    'rounded-full border px-1.5 py-0.5 text-[10px]',
                    statusStyles(c.status)
                  )}
                >
                  {statusLabel(c.status)}
                </span>
                <span className="text-slate-200 font-medium">{c.label}</span>
                {c.count != null ? (
                  <span className="tabular-nums text-slate-400">{c.count}</span>
                ) : null}
              </div>
              <p className="text-slate-500 mt-1">{c.detail}</p>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

export default function TechnicalReportsTab({
  onClearTestAnalytics,
}: {
  onClearTestAnalytics?: () => Promise<void> | void
}) {
  const [health, setHealth] = useState<SiteHealthSnapshot | null>(null)
  const [loadingHealth, setLoadingHealth] = useState(false)
  const [healthError, setHealthError] = useState<string | null>(null)
  const [activeScope, setActiveScope] = useState<string | null>(null)

  const [loading, setLoading] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<AdminAiPriority | null>(null)
  const [reportId, setReportId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedBanner, setSavedBanner] = useState<string | null>(null)
  const [persistError, setPersistError] = useState<string | null>(null)
  const [siteBrain, setSiteBrain] = useState<SiteBrainStatusMeta | null>(null)

  const isDev = process.env.NODE_ENV === 'development'

  const mergeHealth = useCallback((next: SiteHealthSnapshot, prev: SiteHealthSnapshot | null): SiteHealthSnapshot => {
    if (!prev || next.scope === 'basic' || next.scope === 'all') return next
    const byId = new Map(prev.modules.map((m) => [m.id, m]))
    for (const m of next.modules) byId.set(m.id, m)
    const modules = MODULE_ORDER.map((id) => byId.get(id)).filter(Boolean) as HealthModule[]
    for (const m of byId.values()) {
      if (!modules.find((x) => x.id === m.id)) modules.push(m)
    }
    const overall: HealthStatus =
      modules.some((m) => m.status === 'error')
        ? 'error'
        : modules.some((m) => m.status === 'warning')
          ? 'warning'
          : modules.every((m) => m.status === 'not_wired')
            ? 'not_wired'
            : 'healthy'
    return {
      ...next,
      overallStatus: overall,
      modules,
    }
  }, [])

  const runHealth = async (scope: string) => {
    setLoadingHealth(true)
    setHealthError(null)
    setActiveScope(scope)
    try {
      const res = await fetch('/api/admin/ai/site-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope }),
      })
      const data = await res.json()
      if (!data.ok) {
        setHealthError(data.error || 'Health check failed')
        return
      }
      setHealth((prev) => mergeHealth(data.health as SiteHealthSnapshot, prev))
    } catch {
      setHealthError('Health check failed')
    } finally {
      setLoadingHealth(false)
      setActiveScope(null)
    }
  }

  const generate = async () => {
    setLoading(true)
    setError(null)
    setSavedBanner(null)
    setPersistError(null)
    try {
      const res = await fetch('/api/admin/ai/technical-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'full' }),
      })
      const data = await res.json()
      if (data.health) {
        setHealth(data.health as SiteHealthSnapshot)
      }
      if (!data.ok) {
        setError(data.error || 'Generation failed')
        setMarkdown('')
        return
      }
      setTitle(data.title || 'JobAZ Technical Health Report')
      setMarkdown(data.markdown || '')
      setPriority(data.priority || 'Medium')
      setReportId(data.reportId || null)
      setPersistError(data.persistError || null)
      if (data.siteBrain) setSiteBrain(data.siteBrain)
      if (data.reportId) {
        setSavedBanner('Saved to admin_ai_reports')
      } else if (data.persistError) {
        setPersistError(data.persistError)
      }
    } catch {
      setError('Generation failed')
      setMarkdown('')
    } finally {
      setLoading(false)
    }
  }

  const sortedModules = health
    ? [...health.modules].sort((a, b) => {
        const ai = MODULE_ORDER.indexOf(a.id as (typeof MODULE_ORDER)[number])
        const bi = MODULE_ORDER.indexOf(b.id as (typeof MODULE_ORDER)[number])
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      })
    : []

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Technical Reports"
        purpose="Check site health, AI tools, APIs, saving, tracking, referrals and launch blockers."
        note="Lightweight checks only. Not wired yet = monitoring missing, not necessarily a failure. Secrets never shown. Published course records without provider ≠ Affiliate Scout route-level gaps."
      />
      <SiteBrainStatusLine override={siteBrain} />
      <PriorityLegend />

      {isDev && onClearTestAnalytics ? (
        <div className="flex flex-wrap items-center gap-2">
          <ActionButton variant="secondary" onClick={() => void onClearTestAnalytics()}>
            Clear local/test analytics
          </ActionButton>
          <span className="text-[11px] text-slate-500">
            Dev only — deletes is_test rows and local demo keys. Never touches Site Brain or users.
          </span>
        </div>
      ) : null}

      {health ? (
        <div
          className={cn(
            'rounded-xl border px-3.5 py-3 flex flex-wrap items-center gap-3',
            statusStyles(health.overallStatus)
          )}
        >
          <span className="text-sm font-medium">
            Overall: {statusLabel(health.overallStatus)}
          </span>
          <span className="text-[11px] opacity-80">
            Last run: {formatCheckedAt(health.checkedAt)} · scope {health.scope}
          </span>
        </div>
      ) : (
        <p className="text-sm text-slate-500">
          Run a health check to populate module status. Checks do not run automatically on page load.
        </p>
      )}

      {healthError ? <StatusBanner message={healthError} tone="rose" /> : null}

      {sortedModules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {sortedModules.map((m) => (
            <ModuleCard key={m.id} module={m} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {MODULE_ORDER.map((id) => (
            <div
              key={id}
              className="rounded-xl border border-dashed border-slate-700/60 bg-slate-950/30 px-3.5 py-3"
            >
              <p className="text-sm text-slate-400">
                {MODULE_PLACEHOLDER_TITLES[id]}
              </p>
              <p className="text-[11px] text-slate-600 mt-1">Not checked yet</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <ActionButton variant="primary" disabled={loading || loadingHealth} onClick={() => void generate()}>
          {loading ? 'Generating…' : 'Generate Technical Report'}
        </ActionButton>
        {HEALTH_ACTIONS.map((a) => (
          <ActionButton
            key={a.scope}
            variant="secondary"
            disabled={loading || loadingHealth}
            onClick={() => void runHealth(a.scope)}
          >
            {loadingHealth && activeScope === a.scope ? 'Checking…' : a.label}
          </ActionButton>
        ))}
        <Link
          href="/admin/tasks"
          className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:border-violet-400/50 hover:text-violet-100"
        >
          View Admin Tasks
        </Link>
      </div>

      <StatusBanner message={savedBanner} tone="emerald" />

      <ReportPanel
        title={title}
        markdown={markdown}
        priority={priority}
        reportId={reportId}
        error={error}
        loading={loading}
        persistError={persistError}
        enableSaveAsTask
        source="technical_report"
      />
    </div>
  )
}
