'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import type { AdminAiTabId } from '@/lib/admin/ai/types'
import {
  DEFAULT_ADMIN_AI_DATE_RANGE,
  type AdminAiDateRange,
} from '@/lib/admin/ai/dateRange'
import { clearCareerTestData } from '@/lib/cv/clearCareerTestData'
import {
  ActionButton,
  DateRangeFilter,
  DevModeNotice,
  StatusBanner,
} from './AdminAiShared'
import AdminAiOverviewPanel from './AdminAiOverviewPanel'

function TabLoading() {
  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-6 space-y-3" aria-busy>
      <div className="h-4 w-40 rounded bg-slate-800/50 animate-pulse" />
      <div className="h-24 rounded-lg bg-slate-800/30 animate-pulse" />
      <div className="h-24 rounded-lg bg-slate-800/30 animate-pulse" />
    </div>
  )
}

const AiManagerTab = dynamic(() => import('./tabs/AiManagerTab'), {
  ssr: false,
  loading: () => <TabLoading />,
})
const MarketingAiTab = dynamic(() => import('./tabs/MarketingAiTab'), {
  ssr: false,
  loading: () => <TabLoading />,
})
const AiSupervisorTab = dynamic(() => import('./tabs/AiSupervisorTab'), {
  ssr: false,
  loading: () => <TabLoading />,
})
const AffiliateScoutTab = dynamic(() => import('./tabs/AffiliateScoutTab'), {
  ssr: false,
  loading: () => <TabLoading />,
})
const TechnicalReportsTab = dynamic(() => import('./tabs/TechnicalReportsTab'), {
  ssr: false,
  loading: () => <TabLoading />,
})
const SiteBrainTab = dynamic(() => import('./tabs/SiteBrainTab'), {
  ssr: false,
  loading: () => <TabLoading />,
})

const TABS: Array<{ id: AdminAiTabId; label: string }> = [
  { id: 'manager', label: 'AI Manager' },
  { id: 'marketing', label: 'Marketing AI' },
  { id: 'supervisor', label: 'AI Supervisor' },
  { id: 'affiliate', label: 'Affiliate Scout' },
  { id: 'technical', label: 'Technical Reports' }, // Site Health / Technical Intelligence
  { id: 'site-brain', label: 'Site Brain' },
]

const isDev = process.env.NODE_ENV === 'development'

export default function AdminAiPageClient() {
  const [tab, setTab] = useState<AdminAiTabId>('manager')
  const [range, setRange] = useState<AdminAiDateRange>(DEFAULT_ADMIN_AI_DATE_RANGE)
  const [clearMsg, setClearMsg] = useState<string | null>(null)
  const [clearing, setClearing] = useState(false)

  const clearTestAnalytics = async () => {
    if (!isDev) return
    const ok = window.confirm(
      'Clear local/test analytics?\n\nThis removes known local test keys and DB rows marked is_test only.\nIt will NOT delete real users, CVs, courses, providers, or Site Brain.'
    )
    if (!ok) return
    setClearing(true)
    setClearMsg(null)
    try {
      const localRemoved = clearCareerTestData()
      const res = await fetch('/api/admin/ai/clear-test-analytics', { method: 'POST' })
      const data = await res.json()
      const parts = [
        localRemoved.length
          ? `Cleared ${localRemoved.length} local key(s).`
          : 'No local test keys found.',
        data.message || data.error,
        data.historicalUnmarkedHint,
      ].filter(Boolean)
      setClearMsg(parts.join(' '))
    } catch {
      setClearMsg('Failed to clear test analytics')
    } finally {
      setClearing(false)
    }
  }

  return (
    <div className="space-y-6">
      <AdminAiOverviewPanel />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <DevModeNotice />
        <div className="flex flex-wrap gap-2">
          {isDev ? (
            <ActionButton variant="secondary" onClick={() => void clearTestAnalytics()} disabled={clearing}>
              {clearing ? 'Clearing…' : 'Clear local/test analytics'}
            </ActionButton>
          ) : null}
        </div>
      </div>
      <StatusBanner
        message={clearMsg}
        tone={clearMsg?.includes('Deleted') || clearMsg?.includes('Cleared') ? 'emerald' : 'amber'}
      />

      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
        <div className="flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                'rounded-lg px-3 py-1.5 text-xs font-medium transition',
                tab === t.id
                  ? 'bg-violet-600/90 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
        {(tab === 'manager' || tab === 'supervisor' || tab === 'affiliate') && (
          <DateRangeFilter value={range} onChange={setRange} />
        )}
      </div>

      {tab === 'manager' && <AiManagerTab range={range} />}
      {tab === 'marketing' && <MarketingAiTab />}
      {tab === 'supervisor' && <AiSupervisorTab range={range} />}
      {tab === 'affiliate' && <AffiliateScoutTab range={range} />}
      {tab === 'technical' && <TechnicalReportsTab onClearTestAnalytics={clearTestAnalytics} />}
      {tab === 'site-brain' && <SiteBrainTab />}
    </div>
  )
}
