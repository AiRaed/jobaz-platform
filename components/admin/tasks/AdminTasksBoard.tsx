'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { AdminAiPriority } from '@/lib/admin/ai/types'
import type { AdminTaskRow, AdminTasksSummary } from '@/lib/admin/ai/tasks'

const EMPTY_SUMMARY: AdminTasksSummary = {
  open: 0,
  highPriority: 0,
  inProgress: 0,
  doneThisWeek: 0,
  ignored: 0,
}

const SOURCE_OPTIONS = [
  'ai_manager_report',
  'technical_report',
  'affiliate_scout',
  'marketing_ai',
  'manual',
] as const

function PriorityBadge({ priority }: { priority: string }) {
  const tone =
    priority === 'High'
      ? 'border-rose-500/40 bg-rose-500/10 text-rose-200'
      : priority === 'Low'
        ? 'border-slate-600 bg-slate-800/50 text-slate-300'
        : 'border-amber-500/40 bg-amber-500/10 text-amber-200'
  return (
    <span className={cn('inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium', tone)}>
      {priority}
    </span>
  )
}

function StatusBadge({ status }: { status: string }) {
  const label = status === 'in_progress' ? 'In progress' : status
  const tone =
    status === 'open'
      ? 'border-sky-500/40 bg-sky-500/10 text-sky-200'
      : status === 'in_progress'
        ? 'border-violet-500/40 bg-violet-500/10 text-violet-200'
        : status === 'done'
          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
          : 'border-slate-600 bg-slate-800/50 text-slate-400'
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize',
        tone
      )}
    >
      {label}
    </span>
  )
}

function SourceBadge({ source }: { source: string }) {
  return (
    <span className="inline-flex rounded-full border border-slate-600 bg-slate-900/60 px-2 py-0.5 text-[10px] font-mono text-slate-400">
      {source}
    </span>
  )
}

export default function AdminTasksBoard() {
  const [tasks, setTasks] = useState<AdminTaskRow[]>([])
  const [summary, setSummary] = useState<AdminTasksSummary>(EMPTY_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  const [status, setStatus] = useState('all')
  const [priority, setPriority] = useState('all')
  const [source, setSource] = useState('all')
  const [search, setSearch] = useState('')

  const [showManual, setShowManual] = useState(false)
  const [manualTitle, setManualTitle] = useState('')
  const [manualDesc, setManualDesc] = useState('')
  const [manualPriority, setManualPriority] = useState<AdminAiPriority>('Medium')
  const [savingManual, setSavingManual] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (status !== 'all') params.set('status', status)
      if (priority !== 'all') params.set('priority', priority)
      if (source !== 'all') params.set('source', source)
      const res = await fetch(`/api/admin/tasks?${params}`)
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'Failed to load tasks')
        setTasks([])
        return
      }
      setTasks(data.tasks || [])
      setSummary({ ...EMPTY_SUMMARY, ...(data.summary || {}) })
    } catch {
      setError('Failed to load tasks')
    } finally {
      setLoading(false)
    }
  }, [status, priority, source])

  useEffect(() => {
    void load()
  }, [load])

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return tasks
    return tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.source.toLowerCase().includes(q) ||
        (t.related_route || '').toLowerCase().includes(q) ||
        (t.related_provider || '').toLowerCase().includes(q) ||
        (t.related_course || '').toLowerCase().includes(q)
    )
  }, [tasks, search])

  const updateStatus = async (id: string, next: string) => {
    setBusyId(id)
    setNotice(null)
    try {
      const res = await fetch('/api/admin/tasks/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      })
      const data = await res.json()
      if (!data.ok) {
        setNotice(data.error || 'Update failed')
        return
      }
      setNotice(
        next === 'done'
          ? 'Marked done'
          : next === 'ignored'
            ? 'Ignored'
            : next === 'in_progress'
              ? 'Marked in progress'
              : 'Reopened'
      )
      void load()
    } catch {
      setNotice('Update failed')
    } finally {
      setBusyId(null)
    }
  }

  const addManual = async () => {
    if (!manualTitle.trim()) {
      setNotice('Title is required')
      return
    }
    setSavingManual(true)
    setNotice(null)
    try {
      const res = await fetch('/api/admin/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: manualTitle.trim(),
          description: manualDesc.trim(),
          priority: manualPriority,
          source: 'manual',
        }),
      })
      const data = await res.json()
      if (!data.ok) {
        setNotice(data.error || 'Failed to create task')
        return
      }
      setManualTitle('')
      setManualDesc('')
      setManualPriority('Medium')
      setShowManual(false)
      setNotice('Manual task added')
      void load()
    } catch {
      setNotice('Failed to create task')
    } finally {
      setSavingManual(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
        {[
          { label: 'Open tasks', value: summary.open },
          { label: 'High priority', value: summary.highPriority },
          { label: 'In progress', value: summary.inProgress },
          { label: 'Done this week', value: summary.doneThisWeek },
          { label: 'Ignored', value: summary.ignored },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3.5 py-3"
          >
            <p className="text-[10px] uppercase tracking-wider text-slate-500">{c.label}</p>
            <p className="mt-1 text-xl font-semibold tabular-nums text-slate-100">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-wrap gap-2 items-end">
          <label className="text-xs text-slate-400 space-y-1">
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="block rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-100"
            >
              <option value="all">All</option>
              <option value="open">Open</option>
              <option value="in_progress">In progress</option>
              <option value="done">Done</option>
              <option value="ignored">Ignored</option>
            </select>
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            <span>Priority</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="block rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-100"
            >
              <option value="all">All</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            <span>Source</span>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value)}
              className="block rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-100"
            >
              <option value="all">All</option>
              {SOURCE_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            <span>Search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Title, route, provider…"
              className="block w-48 rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-100"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/ai"
            className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:border-violet-400/50"
          >
            Back to Admin AI
          </Link>
          <button
            type="button"
            onClick={() => setShowManual((v) => !v)}
            className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-500"
          >
            Add manual task
          </button>
        </div>
      </div>

      {showManual && (
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-4 space-y-3">
          <p className="text-sm font-medium text-slate-200">New manual task</p>
          <input
            value={manualTitle}
            onChange={(e) => setManualTitle(e.target.value)}
            placeholder="Title"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <textarea
            value={manualDesc}
            onChange={(e) => setManualDesc(e.target.value)}
            placeholder="Description (optional)"
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={manualPriority}
              onChange={(e) => setManualPriority(e.target.value as AdminAiPriority)}
              className="rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-sm text-slate-100"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
            <button
              type="button"
              disabled={savingManual}
              onClick={() => void addManual()}
              className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {savingManual ? 'Saving…' : 'Save task'}
            </button>
            <button
              type="button"
              onClick={() => setShowManual(false)}
              className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {notice && (
        <p className="text-xs rounded-lg border border-emerald-500/25 bg-emerald-950/20 text-emerald-100 px-3 py-2">
          {notice}
        </p>
      )}
      {error && (
        <p className="text-xs rounded-lg border border-rose-500/25 bg-rose-950/20 text-rose-100 px-3 py-2">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 animate-pulse">Loading tasks…</p>
      ) : filteredTasks.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700/70 bg-slate-950/30 px-4 py-10 text-center text-sm text-slate-500">
          {tasks.length === 0
            ? 'No admin tasks yet. Generate an AI Manager Report or add a manual task.'
            : 'No tasks match the current filters.'}
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredTasks.map((t) => {
            const displayStatus = t.status === 'cancelled' ? 'ignored' : t.status
            return (
              <li
                key={t.id}
                className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-4 py-3 space-y-2"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <PriorityBadge priority={t.priority} />
                      <StatusBadge status={displayStatus} />
                      <SourceBadge source={t.source} />
                    </div>
                    <h3 className="text-sm font-semibold text-slate-100">{t.title}</h3>
                    {t.description ? (
                      <p className="text-xs text-slate-400 mt-1 whitespace-pre-wrap line-clamp-4">
                        {t.description}
                      </p>
                    ) : null}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-[11px] text-slate-500">
                      {t.related_route ? <span>Route: {t.related_route}</span> : null}
                      {t.related_provider ? <span>Provider: {t.related_provider}</span> : null}
                      {t.related_course ? <span>Course: {t.related_course}</span> : null}
                      {t.related_report_id ? (
                        <span className="font-mono">Report {t.related_report_id.slice(0, 8)}…</span>
                      ) : null}
                      {t.created_at ? (
                        <span>Created {new Date(t.created_at).toLocaleString()}</span>
                      ) : null}
                      {t.updated_at ? (
                        <span>Updated {new Date(t.updated_at).toLocaleString()}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-1">
                  {displayStatus !== 'in_progress' && (
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => void updateStatus(t.id, 'in_progress')}
                      className="rounded-lg border border-slate-600 px-2.5 py-1 text-[11px] text-slate-200 hover:border-violet-400/50 disabled:opacity-50"
                    >
                      {displayStatus === 'open' ? 'Start' : 'Mark in progress'}
                    </button>
                  )}
                  {displayStatus !== 'done' && (
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => void updateStatus(t.id, 'done')}
                      className="rounded-lg border border-emerald-600/40 px-2.5 py-1 text-[11px] text-emerald-200 hover:bg-emerald-950/30 disabled:opacity-50"
                    >
                      Mark done
                    </button>
                  )}
                  {displayStatus !== 'ignored' && displayStatus !== 'done' && (
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => void updateStatus(t.id, 'ignored')}
                      className="rounded-lg border border-slate-600 px-2.5 py-1 text-[11px] text-slate-400 hover:text-slate-200 disabled:opacity-50"
                    >
                      Ignore
                    </button>
                  )}
                  {(displayStatus === 'done' ||
                    displayStatus === 'ignored' ||
                    displayStatus === 'in_progress') && (
                    <button
                      type="button"
                      disabled={busyId === t.id}
                      onClick={() => void updateStatus(t.id, 'open')}
                      className="rounded-lg border border-sky-600/40 px-2.5 py-1 text-[11px] text-sky-200 hover:bg-sky-950/30 disabled:opacity-50"
                    >
                      Reopen
                    </button>
                  )}
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
