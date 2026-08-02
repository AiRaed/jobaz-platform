'use client'

import { useEffect, useMemo, useState } from 'react'
import { cn } from '@/lib/utils'
import type { AdminAiPriority, MetricValue } from '@/lib/admin/ai/types'
import { extractRecommendedActionItems } from '@/lib/admin/ai/reportUtils'

export function SectionHeader({
  title,
  purpose,
  note,
}: {
  title: string
  purpose: string
  note?: string | null
}) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      <p className="text-sm text-slate-400 mt-1 max-w-2xl">{purpose}</p>
      {note ? <p className="text-[11px] text-violet-300/80 mt-2">{note}</p> : null}
    </div>
  )
}

export function MetricCards({ cards }: { cards: MetricValue[] }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.label}
          className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3.5 py-3"
          title={c.hint}
        >
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{c.label}</p>
          <p
            className={cn(
              'mt-1 text-lg font-semibold tabular-nums',
              c.available ? 'text-slate-100' : 'text-slate-500'
            )}
          >
            {c.available ? (c.value ?? '—') : 'Not wired yet'}
          </p>
          {!c.available && (
            <p className="text-[10px] text-slate-600 mt-1 line-clamp-2">
              {c.hint || 'Not wired yet — monitoring missing, not necessarily a failure'}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

export function PlaceholderCard({
  label,
  hint = 'Not wired yet',
  value,
  available,
}: {
  label: string
  hint?: string
  value?: number | string | null
  available?: boolean
}) {
  const show = available && value != null
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3.5 py-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p className={cn('mt-1 text-lg font-semibold tabular-nums', show ? 'text-slate-100' : 'text-slate-500')}>
        {show ? value : 'Not wired yet'}
      </p>
      {!show && <p className="text-[10px] text-slate-600 mt-1">{hint}</p>}
    </div>
  )
}

export function EmptyPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-950/30 px-4 py-6 text-sm text-slate-500">
      {children}
    </div>
  )
}

export function ActionButton({
  children,
  onClick,
  disabled,
  variant = 'primary',
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'rounded-lg px-3 py-2 text-xs font-medium transition disabled:opacity-50',
        variant === 'primary'
          ? 'bg-violet-600 text-white hover:bg-violet-500'
          : 'border border-slate-600 text-slate-200 hover:border-violet-400/50 hover:text-violet-100'
      )}
    >
      {children}
    </button>
  )
}

export function StatusBanner({ message, tone = 'amber' }: { message: string | null; tone?: 'amber' | 'rose' | 'emerald' }) {
  if (!message) return null
  const styles =
    tone === 'emerald'
      ? 'border-emerald-500/25 bg-emerald-950/20 text-emerald-100'
      : tone === 'rose'
        ? 'border-rose-500/25 bg-rose-950/20 text-rose-100'
        : 'border-amber-500/25 bg-amber-950/20 text-amber-100'
  return (
    <p className={cn('text-xs rounded-lg border px-3 py-2', styles)}>{message}</p>
  )
}

export type SiteBrainStatusMeta = {
  version: number
  source: 'database' | 'defaults'
  updatedAt?: string | null
  isActive?: boolean
}

/** Small status line: which Site Brain version each Admin AI tool will use. */
export function SiteBrainStatusLine({
  override,
}: {
  override?: SiteBrainStatusMeta | null
}) {
  const [meta, setMeta] = useState<SiteBrainStatusMeta | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch('/api/admin/ai/site-brain')
        const data = await res.json()
        if (!data.ok || cancelled) return
        const brain = data.brain
        setMeta({
          version: Number(brain?.version ?? 1),
          source: data.source === 'defaults' ? 'defaults' : 'database',
          updatedAt: brain?.updatedAt || brain?.createdAt || null,
          isActive: Boolean(brain?.isActive),
        })
      } catch {
        // ignore — status is best-effort
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const shown = override || meta
  if (!shown) {
    return <p className="text-[11px] text-slate-500">Loading Site Brain status…</p>
  }

  const primary =
    shown.source === 'defaults'
      ? 'Using Site Brain fallback defaults'
      : `Using active Site Brain: v${shown.version}`

  const details = [
    `Site Brain source: ${shown.source}`,
    shown.source !== 'defaults' ? `active version ${shown.version}` : null,
    shown.updatedAt
      ? `last updated ${new Date(shown.updatedAt).toLocaleDateString()}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <p className="text-[11px] text-violet-300/80" title="Loaded into Admin AI prompts before generation">
      {primary}
      {details ? <span className="text-slate-500"> — {details}</span> : null}
    </p>
  )
}

export function PriorityBadge({ priority }: { priority?: AdminAiPriority | string | null }) {
  if (!priority) return null
  const tone =
    priority === 'High'
      ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
      : priority === 'Low'
        ? 'border-slate-600 bg-slate-800/50 text-slate-300'
        : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
  const guide =
    priority === 'High'
      ? 'launch blocker, revenue blocker, safety/trust risk, or current user-flow problem'
      : priority === 'Low'
        ? 'monitoring, old/test data, or future improvement'
        : 'important improvement or missing useful data'
  return (
    <span
      className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium', tone)}
      title={guide}
    >
      Priority: {priority}
    </span>
  )
}

export function PriorityLegend() {
  return (
    <p className="text-[10px] text-slate-500 leading-relaxed">
      <span className="text-rose-300/90">High</span> = launch/revenue/safety/current flow ·{' '}
      <span className="text-amber-300/90">Medium</span> = important improvement ·{' '}
      <span className="text-slate-400">Low</span> = monitoring / old-test / later. Old/test data is
      never High unless it affects the current flow.
    </p>
  )
}

type ReportPanelProps = {
  title?: string
  markdown?: string
  priority?: AdminAiPriority | string | null
  reportId?: string | null
  error?: string | null
  loading?: boolean
  persistError?: string | null
  /** When true, Save as task uses /api/admin/tasks/create with ai_manager_report source */
  enableSaveAsTask?: boolean
  source?: string
}

export function ReportPanel({
  title,
  markdown,
  priority,
  reportId,
  error,
  loading,
  persistError,
  enableSaveAsTask = true,
  source = 'ai_manager_report',
}: ReportPanelProps) {
  const [taskMsg, setTaskMsg] = useState<string | null>(null)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  /** Map of normalized action title → task id */
  const [savedByTitle, setSavedByTitle] = useState<Record<string, string>>({})
  const actions = useMemo(() => extractRecommendedActionItems(markdown || ''), [markdown])

  const normalizeTitle = (t: string) => t.toLowerCase().replace(/\s+/g, ' ').trim()

  // Restore Saved state after refresh when reportId is known
  useEffect(() => {
    if (!reportId || !enableSaveAsTask) {
      setSavedByTitle({})
      return
    }
    let cancelled = false
    ;(async () => {
      try {
        const res = await fetch(
          `/api/admin/tasks?related_report_id=${encodeURIComponent(reportId)}`
        )
        const data = await res.json()
        if (cancelled || !data.ok) return
        const map: Record<string, string> = {}
        for (const t of data.tasks || []) {
          const key = normalizeTitle(String(t.title || ''))
          if (key) map[key] = t.id
        }
        setSavedByTitle(map)
      } catch {
        // ignore
      }
    })()
    return () => {
      cancelled = true
    }
  }, [reportId, enableSaveAsTask, markdown])

  const saveTask = async (action: {
    key: string
    title: string
    priority: AdminAiPriority
  }) => {
    const norm = normalizeTitle(action.title)
    if (savedByTitle[norm]) return

    setSavingKey(action.key)
    setTaskMsg(null)
    try {
      const res = await fetch('/api/admin/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: action.title.slice(0, 200),
          description: [
            `From Admin AI report: ${title || 'report'}`,
            `Source: ${source}`,
            reportId ? `Report id: ${reportId}` : null,
            `Section priority: ${action.priority}`,
            `Overall report priority: ${priority || 'Medium'}`,
          ]
            .filter(Boolean)
            .join('\n'),
          priority: action.priority,
          source,
          related_report_id: reportId || undefined,
        }),
      })
      const data = await res.json()
      if (!data.ok) {
        setTaskMsg(data.error || 'Failed to save task')
        return
      }
      setSavedByTitle((prev) => ({
        ...prev,
        [norm]: data.id || data.task?.id || 'saved',
      }))
      setTaskMsg(
        data.message ||
          (data.alreadyExists
            ? 'Task already saved for this report action'
            : 'Task saved. View Admin Tasks')
      )
    } catch {
      setTaskMsg('Failed to save task')
    } finally {
      setSavingKey(null)
    }
  }

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-4 py-6 text-sm text-slate-400 animate-pulse">
        Generating report…
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-4 text-sm text-amber-100">
        {error}
      </div>
    )
  }

  if (!markdown) {
    return (
      <EmptyPanel>
        No report yet. Generate one to see suggestions. You decide what to act on.
      </EmptyPanel>
    )
  }

  return (
    <div className="rounded-xl border border-violet-500/20 bg-slate-950/60 px-4 py-4 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-slate-100">{title || 'Report'}</h3>
        <div className="flex items-center gap-2">
          <PriorityBadge priority={priority} />
          {reportId && (
            <span className="text-[10px] text-slate-500 font-mono">saved {reportId.slice(0, 8)}…</span>
          )}
        </div>
      </div>

      {persistError && (
        <StatusBanner
          tone="amber"
          message={`Report generated but not persisted: ${persistError}`}
        />
      )}

      <pre className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed font-sans">
        {markdown}
      </pre>

      {enableSaveAsTask && actions.length > 0 && (
        <div className="border-t border-slate-800 pt-3 space-y-2">
          <p className="text-xs font-medium text-slate-400">Save recommended action as admin task</p>
          <ul className="space-y-2">
            {actions.map((action) => {
              const norm = normalizeTitle(action.title)
              const isSaved = Boolean(savedByTitle[norm])
              const isSaving = savingKey === action.key
              return (
                <li
                  key={action.key}
                  className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-300">{action.title}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">{action.priority} priority</p>
                  </div>
                  <ActionButton
                    variant="secondary"
                    disabled={isSaved || isSaving}
                    onClick={() => void saveTask(action)}
                  >
                    {isSaved ? 'Saved' : isSaving ? 'Saving…' : 'Save as task'}
                  </ActionButton>
                </li>
              )
            })}
          </ul>
          <StatusBanner
            message={taskMsg}
            tone={
              taskMsg?.includes('saved') || taskMsg?.includes('Saved') || taskMsg?.includes('already')
                ? 'emerald'
                : 'amber'
            }
          />
          <p className="text-[11px] text-slate-500">
            <a href="/admin/tasks" className="text-violet-300 hover:underline">
              View Admin Tasks
            </a>
          </p>
        </div>
      )}
    </div>
  )
}

export async function generateAdminReport(body: Record<string, unknown>) {
  const res = await fetch('/api/admin/ai/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ persist: true, ...body }),
  })
  return res.json()
}

export function DateRangeFilter({
  value,
  onChange,
}: {
  value: string
  onChange: (next: 'today' | '7d' | '30d' | 'all') => void
}) {
  const options: Array<{ id: 'today' | '7d' | '30d' | 'all'; label: string }> = [
    { id: 'today', label: 'Today' },
    { id: '7d', label: 'Last 7 days' },
    { id: '30d', label: 'Last 30 days' },
    { id: 'all', label: 'All time' },
  ]
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-[10px] uppercase tracking-wider text-slate-500">Period</span>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={cn(
            'rounded-lg px-2.5 py-1 text-xs font-medium transition',
            value === o.id
              ? 'bg-slate-100 text-slate-900'
              : 'border border-slate-700 text-slate-400 hover:text-slate-200'
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function DevModeNotice() {
  if (process.env.NODE_ENV !== 'development') return null
  return (
    <p className="text-xs rounded-lg border border-amber-500/25 bg-amber-950/20 text-amber-100 px-3 py-2">
      Development mode: metrics may include test data.
    </p>
  )
}
