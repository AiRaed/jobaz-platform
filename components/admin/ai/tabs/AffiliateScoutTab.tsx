'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import type { AdminAiDateRange } from '@/lib/admin/ai/dateRange'
import type { AdminAiPriority, AffiliateProviderSummary } from '@/lib/admin/ai/types'
import {
  ActionButton,
  PlaceholderCard,
  PriorityBadge,
  PriorityLegend,
  ReportPanel,
  SectionHeader,
  SiteBrainStatusLine,
  StatusBanner,
  type SiteBrainStatusMeta,
} from '../AdminAiShared'

const ACTIONS = [
  { mode: 'suggest', label: 'Suggest Affiliate Programmes', primary: true },
  { mode: 'tasks', label: 'Create Affiliate Tasks', primary: false },
  { mode: 'missing', label: 'Find Missing Providers by Route', primary: false },
  { mode: 'prioritise', label: 'Prioritise Providers', primary: false },
] as const

export default function AffiliateScoutTab({ range }: { range: AdminAiDateRange }) {
  const [summary, setSummary] = useState<AffiliateProviderSummary | null>(null)
  const [loadingSummary, setLoadingSummary] = useState(true)
  const [loading, setLoading] = useState(false)
  const [markdown, setMarkdown] = useState('')
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<AdminAiPriority | null>(null)
  const [reportId, setReportId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [savedBanner, setSavedBanner] = useState<string | null>(null)
  const [persistError, setPersistError] = useState<string | null>(null)
  const [siteBrain, setSiteBrain] = useState<SiteBrainStatusMeta | null>(null)

  const load = useCallback(async () => {
    setLoadingSummary(true)
    try {
      const res = await fetch(`/api/admin/ai/metrics?kind=affiliate&range=${range}`)
      const data = await res.json()
      if (data.ok) setSummary(data.summary)
    } finally {
      setLoadingSummary(false)
    }
  }, [range])

  useEffect(() => {
    void load()
  }, [load])

  const generate = async (mode: string) => {
    setLoading(true)
    setError(null)
    setSavedBanner(null)
    setPersistError(null)
    try {
      const res = await fetch('/api/admin/ai/affiliate-scout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, range }),
      })
      const data = await res.json()
      if (!data.ok) {
        setError(data.error || 'Generation failed')
        setMarkdown('')
        return
      }
      setTitle(data.title || 'Affiliate Scout Report')
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

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Affiliate Scout"
        purpose="Find missing provider/affiliate opportunities by priority route. Suggests research targets — never invents approved partnerships."
        note={summary?.basisNote}
      />
      <SiteBrainStatusLine override={siteBrain} />
      <PriorityLegend />

      <p className="text-xs text-slate-500">
        Based on published courses and opportunity tracker. Missing provider means no live
        published course/referral link for this route. Not every gap is High — CSCS / First Aid /
        Forklift default High; TEFL / Digital / AAT Medium; SIA/Care often Low (verify Get Licensed /
        UKPDA). Date range applies to click context when available.
      </p>

      {loadingSummary ? (
        <p className="text-sm text-slate-500 animate-pulse">Loading provider summary…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <PlaceholderCard
            label="Active providers"
            available={summary?.available}
            value={summary?.activeProviders}
          />
          <PlaceholderCard
            label="Pending providers"
            available={summary?.available}
            value={summary?.pendingProviders}
          />
          <PlaceholderCard
            label="Published partner courses"
            available={summary?.available}
            value={summary?.publishedPartnerCourses}
          />
          <PlaceholderCard
            label="With live referral link"
            available={summary?.available}
            value={summary?.coursesWithLiveReferral}
          />
        </div>
      )}

      {summary?.missingByRoute?.length ? (
        <div className="rounded-xl border border-slate-700/60 overflow-hidden">
          <div className="px-3 py-2 bg-slate-900/80 text-xs font-medium text-slate-400">
            Missing provider by route
          </div>
          <ul className="divide-y divide-slate-800 max-h-64 overflow-y-auto">
            {summary.missingByRoute.map((m) => (
              <li key={m.route} className="px-3 py-2.5 text-xs">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-slate-200 font-medium">{m.route}</p>
                  {m.missingProvider ? (
                    <span className="rounded-full border border-rose-500/30 bg-rose-500/10 px-2 py-0.5 text-[10px] text-rose-200">
                      Missing provider by route
                    </span>
                  ) : (
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] text-emerald-200">
                      Covered
                    </span>
                  )}
                  <PriorityBadge priority={m.suggestedPriority} />
                </div>
                <p className="text-slate-500 mt-0.5">{m.note}</p>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {ACTIONS.map((a) => (
          <ActionButton
            key={a.mode}
            variant={a.primary ? 'primary' : 'secondary'}
            disabled={loading}
            onClick={() => void generate(a.mode)}
          >
            {loading ? 'Generating…' : a.label}
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
        source="affiliate_scout"
      />
    </div>
  )
}
