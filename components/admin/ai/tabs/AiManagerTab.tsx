'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { AdminAiDateRange } from '@/lib/admin/ai/dateRange'
import type { AdminAiMetricsSnapshot, AdminAiPriority } from '@/lib/admin/ai/types'
import {
  ActionButton,
  MetricCards,
  PriorityLegend,
  ReportPanel,
  SectionHeader,
  SiteBrainStatusLine,
  StatusBanner,
  type SiteBrainStatusMeta,
} from '../AdminAiShared'

export default function AiManagerTab({ range }: { range: AdminAiDateRange }) {
  const [metrics, setMetrics] = useState<AdminAiMetricsSnapshot | null>(null)
  const [loadingMetrics, setLoadingMetrics] = useState(true)
  const [loading, setLoading] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [title, setTitle] = useState('AI Manager Report')
  const [priority, setPriority] = useState<AdminAiPriority | null>(null)
  const [reportId, setReportId] = useState<string | null>(null)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [persistError, setPersistError] = useState<string | null>(null)
  const [savedBanner, setSavedBanner] = useState<string | null>(null)
  const [siteBrain, setSiteBrain] = useState<SiteBrainStatusMeta | null>(null)

  const loadMetrics = useCallback(async () => {
    setLoadingMetrics(true)
    try {
      const res = await fetch(`/api/admin/ai/metrics?kind=manager&range=${range}`)
      const data = await res.json()
      if (data.ok) setMetrics(data.metrics)
    } finally {
      setLoadingMetrics(false)
    }
  }, [range])

  const loadLatestReport = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/ai/manager-report')
      const data = await res.json()
      if (!data.ok || !data.report) return
      setTitle(data.report.title || 'AI Manager Report')
      setMarkdown(data.report.markdown || '')
      setPriority(data.report.priority || 'Medium')
      setReportId(data.report.id || null)
      setSavedAt(data.report.createdAt || null)
      setSavedBanner(
        data.report.createdAt
          ? `Latest saved report from ${new Date(data.report.createdAt).toLocaleString()}`
          : 'Latest saved report loaded'
      )
    } catch {
      // ignore — empty state is fine
    }
  }, [])

  useEffect(() => {
    void loadMetrics()
  }, [loadMetrics])

  useEffect(() => {
    void loadLatestReport()
  }, [loadLatestReport])

  const generate = async () => {
    setLoading(true)
    setError(null)
    setPersistError(null)
    setSavedBanner(null)
    try {
      const res = await fetch('/api/admin/ai/manager-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ range }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'Generation failed')
        setMarkdown('')
        return
      }
      setTitle(data.title || 'AI Manager Report')
      setMarkdown(data.markdown || '')
      setPriority(data.priority || 'Medium')
      setReportId(data.reportId || null)
      setSavedAt(data.createdAt || null)
      setPersistError(data.persistError || null)
      if (data.siteBrain) setSiteBrain(data.siteBrain)
      if (data.reportId) {
        setSavedBanner('Report saved to admin_ai_reports')
      } else if (data.persistError) {
        setPersistError(data.persistError)
      }
    } catch {
      setError('Generation failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-5">
      <SectionHeader
        title="AI Manager"
        purpose="Generate a structured business report from Site Brain rules and available metrics for the selected period."
        note="Unavailable metrics show as Not wired yet — monitoring missing, not necessarily a failure."
      />
      <SiteBrainStatusLine override={siteBrain} />
      <PriorityLegend />

      {loadingMetrics ? (
        <p className="text-sm text-slate-500 animate-pulse">Loading metrics…</p>
      ) : (
        <>
          <MetricCards cards={metrics?.cards || []} />
          {metrics?.notes?.length ? (
            <ul className="text-xs text-slate-500 space-y-1">
              {metrics.notes.map((n) => (
                <li key={n}>• {n}</li>
              ))}
            </ul>
          ) : null}
        </>
      )}

      <div className="flex flex-wrap gap-2">
        <ActionButton onClick={() => void generate()} disabled={loading}>
          {loading ? 'Generating…' : 'Generate AI Manager Report'}
        </ActionButton>
        <ActionButton variant="secondary" onClick={() => void loadMetrics()} disabled={loadingMetrics}>
          Refresh metrics
        </ActionButton>
        <ActionButton variant="secondary" onClick={() => void loadLatestReport()} disabled={loading}>
          Load latest saved
        </ActionButton>
        <Link
          href="/admin/tasks"
          className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:border-violet-400/50 hover:text-violet-100"
        >
          View Admin Tasks
        </Link>
      </div>

      <StatusBanner
        message={savedBanner}
        tone={savedBanner?.includes('saved') ? 'emerald' : 'amber'}
      />

      <ReportPanel
        title={title}
        markdown={markdown}
        priority={priority}
        reportId={reportId}
        error={error}
        loading={loading}
        persistError={persistError}
        enableSaveAsTask
        source="ai_manager_report"
      />

      {savedAt && reportId && !loading && markdown ? (
        <p className="text-[11px] text-slate-500">
          Stored {new Date(savedAt).toLocaleString()} · id {reportId.slice(0, 8)}…
        </p>
      ) : null}
    </div>
  )
}
