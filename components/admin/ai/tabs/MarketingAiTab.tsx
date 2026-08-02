'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  MARKETING_AUDIENCES,
  MARKETING_CHANNELS,
  MARKETING_ROUTES,
  type AdminAiPriority,
} from '@/lib/admin/ai/types'
import {
  ActionButton,
  EmptyPanel,
  PriorityBadge,
  PriorityLegend,
  SectionHeader,
  SiteBrainStatusLine,
  StatusBanner,
  type SiteBrainStatusMeta,
} from '../AdminAiShared'

const FORMATS = [
  { id: 'Facebook Ad', label: 'Generate Facebook Ad' },
  { id: 'TikTok Script', label: 'Generate TikTok Script' },
  { id: 'Email Campaign', label: 'Generate Email Campaign' },
  { id: 'Landing Page Copy', label: 'Generate Landing Page Copy' },
  { id: '5 Post Ideas', label: 'Generate 5 Post Ideas' },
] as const

const MARKETING_TASKS = [
  'Review this copy',
  'Use for Facebook test ad',
  'Create landing page section',
  'Prepare email campaign',
] as const

export default function MarketingAiTab() {
  const [route, setRoute] = useState<string>(MARKETING_ROUTES[0])
  const [audience, setAudience] = useState<string>(MARKETING_AUDIENCES[0])
  const [channel, setChannel] = useState<string>(MARKETING_CHANNELS[0])
  const [loading, setLoading] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<AdminAiPriority | null>(null)
  const [reportId, setReportId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedBanner, setSavedBanner] = useState<string | null>(null)
  const [persistError, setPersistError] = useState<string | null>(null)
  const [taskMsg, setTaskMsg] = useState<string | null>(null)
  const [savingTask, setSavingTask] = useState<string | null>(null)
  const [savedTasks, setSavedTasks] = useState<Record<string, true>>({})
  const [siteBrain, setSiteBrain] = useState<SiteBrainStatusMeta | null>(null)

  const generate = async (contentType: string) => {
    setLoading(true)
    setError(null)
    setSavedBanner(null)
    setPersistError(null)
    setTaskMsg(null)
    setSavedTasks({})
    try {
      const res = await fetch('/api/admin/ai/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ route, audience, channel, contentType }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'Generation failed')
        setMarkdown('')
        return
      }
      setTitle(data.title || `Marketing AI · ${contentType}`)
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

  const saveTask = async (actionTitle: string) => {
    if (savedTasks[actionTitle]) return
    setSavingTask(actionTitle)
    setTaskMsg(null)
    try {
      const res = await fetch('/api/admin/tasks/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: actionTitle,
          description: [
            `From Marketing AI: ${title || 'marketing copy'}`,
            `Route: ${route}`,
            `Audience: ${audience}`,
            `Channel: ${channel}`,
            reportId ? `Report id: ${reportId}` : null,
          ]
            .filter(Boolean)
            .join('\n'),
          priority: 'Medium',
          source: 'marketing_ai',
          related_report_id: reportId || undefined,
          related_route: route,
        }),
      })
      const data = await res.json()
      if (!data.ok) {
        setTaskMsg(data.error || 'Failed to save task')
        return
      }
      setSavedTasks((prev) => ({ ...prev, [actionTitle]: true }))
      setTaskMsg(
        data.alreadyExists
          ? 'Task already saved for this report action'
          : 'Task saved. View Admin Tasks'
      )
    } catch {
      setTaskMsg('Failed to save task')
    } finally {
      setSavingTask(null)
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Marketing AI"
        purpose="Generate route-aware marketing copy using Site Brain tone and published courses only when confirmed."
        note="Never invent providers, prices, discounts, or job guarantees. AI suggests; admin decides."
      />
      <SiteBrainStatusLine override={siteBrain} />
      <PriorityLegend />

      <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 px-4 py-3 space-y-2">
        <p className="text-xs font-medium text-violet-200">Email Matching (admin approval required)</p>
        <p className="text-[11px] text-slate-400">
          AI can draft campaigns and suggest recipients only. No marketing emails send automatically.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/admin/emails?tab=create&type=product_update"
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-violet-400/50 hover:text-violet-100"
          >
            Suggest email campaign
          </Link>
          <Link
            href="/admin/emails?tab=create&type=local_opportunity_alert"
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-violet-400/50 hover:text-violet-100"
          >
            Find users for this opportunity
          </Link>
          <Link
            href="/admin/emails?tab=create&type=course_alert"
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-violet-400/50 hover:text-violet-100"
          >
            Find users for this course
          </Link>
          <Link
            href="/admin/emails?tab=create&type=job_alert"
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-violet-400/50 hover:text-violet-100"
          >
            Find users for this job
          </Link>
          <Link
            href="/admin/emails?tab=create&type=career_tip"
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-violet-400/50 hover:text-violet-100"
          >
            Draft reactivation email
          </Link>
          <Link
            href="/admin/emails?tab=create&type=plan_reminder"
            className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 hover:border-violet-400/50 hover:text-violet-100"
          >
            Draft plan reminder campaign
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="text-xs text-slate-400 space-y-1">
          <span>Route</span>
          <select
            value={route}
            onChange={(e) => setRoute(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            {MARKETING_ROUTES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-400 space-y-1">
          <span>Audience</span>
          <select
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            {MARKETING_AUDIENCES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-400 space-y-1">
          <span>Channel</span>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          >
            {MARKETING_CHANNELS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {FORMATS.map((f) => (
          <ActionButton
            key={f.id}
            onClick={() => void generate(f.id)}
            disabled={loading}
          >
            {loading ? 'Generating…' : f.label}
          </ActionButton>
        ))}
        <Link
          href="/admin/tasks"
          className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:border-violet-400/50 hover:text-violet-100"
        >
          View Admin Tasks
        </Link>
      </div>

      <StatusBanner
        message={savedBanner}
        tone="emerald"
      />
      {persistError && (
        <StatusBanner
          message={`Generated but not persisted: ${persistError}`}
          tone="amber"
        />
      )}

      {loading ? (
        <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-4 py-6 text-sm text-slate-400 animate-pulse">
          Generating marketing copy…
        </div>
      ) : error ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-4 text-sm text-amber-100">
          {error}
        </div>
      ) : !markdown ? (
        <EmptyPanel>
          Select route, audience, and channel, then generate a format. Copy is shaped by Site Brain
          and only names published partners when they exist.
        </EmptyPanel>
      ) : (
        <div className="rounded-xl border border-violet-500/20 bg-slate-950/60 px-4 py-4 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-100">{title || 'Marketing output'}</h3>
            <div className="flex items-center gap-2">
              <PriorityBadge priority={priority} />
              {reportId && (
                <span className="text-[10px] text-slate-500 font-mono">
                  saved {reportId.slice(0, 8)}…
                </span>
              )}
            </div>
          </div>

          <pre className="whitespace-pre-wrap text-sm text-slate-300 leading-relaxed font-sans">
            {markdown}
          </pre>

          <div className="border-t border-slate-800 pt-3 space-y-2">
            <p className="text-xs font-medium text-slate-400">Save as admin task</p>
            <ul className="space-y-2">
              {MARKETING_TASKS.map((action) => {
                const isSaved = Boolean(savedTasks[action])
                const isSaving = savingTask === action
                return (
                  <li
                    key={action}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-2"
                  >
                    <p className="text-xs text-slate-300 flex-1">{action}</p>
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
                taskMsg?.includes('saved') ||
                taskMsg?.includes('Saved') ||
                taskMsg?.includes('already')
                  ? 'emerald'
                  : 'amber'
              }
            />
            <p className="text-[11px] text-slate-500">
              <Link href="/admin/tasks" className="text-violet-300 hover:underline">
                View Admin Tasks
              </Link>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
