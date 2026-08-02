'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react'
import CommissionReportFormModal from '@/components/admin/courses/CommissionReportFormModal'
import ProviderFormModal from '@/components/admin/courses/ProviderFormModal'
import { EstimatedBadge, ProviderBadge } from '@/components/admin/courses/providerBadges'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import {
  ESTIMATED_REVENUE_DISCLAIMER,
  PROVIDER_ACCOUNT_STATUS_OPTIONS,
  PROVIDER_AFFILIATE_STATUS_OPTIONS,
  PROVIDER_COMMISSION_TYPE_OPTIONS,
  PROVIDERS_TAB_INTRO,
  SUMMARY_CARD_HINTS,
} from '@/lib/admin/providers/constants'
import { formatGbp } from '@/lib/admin/providers/revenue'
import {
  createCommissionReportRecord,
  createProviderFromCourseName,
  createProviderRecord,
  fetchProviderDashboard,
  seedProviderRecords,
  syncProvidersFromPublishedCourses,
  updateProviderRecord,
  type ProviderDataSource,
} from '@/lib/admin/providers/repository'
import { filterProviderMetrics, reportsForProvider, type ProviderQuickFilter } from '@/lib/admin/providers/query'
import type {
  CourseProviderInput,
  ProviderCommissionReportInput,
  ProviderDashboardData,
  ProviderWithMetrics,
} from '@/lib/admin/providers/types'

type Props = {
  onEditCourse: (courseId: string) => void
}

const QUICK_FILTERS: { id: ProviderQuickFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'active', label: 'Active' },
  { id: 'has-published', label: 'Has published courses' },
  { id: 'has-clicks', label: 'Has clicks' },
  { id: 'has-confirmed', label: 'Has confirmed revenue' },
]

const SUMMARY_CARDS: {
  key: keyof ProviderDashboardData['summary']
  label: string
  hintKey: keyof typeof SUMMARY_CARD_HINTS
  format?: (n: number) => string
}[] = [
  { key: 'activeProviders', label: 'Active providers', hintKey: 'activeProviders' },
  {
    key: 'publishedPartnerCourses',
    label: 'Published partner courses',
    hintKey: 'publishedPartnerCourses',
  },
  { key: 'applyClicks', label: 'Apply clicks', hintKey: 'applyClicks' },
  {
    key: 'estimatedRevenue',
    label: 'Estimated revenue',
    hintKey: 'estimatedRevenue',
    format: formatGbp,
  },
  {
    key: 'confirmedCommission',
    label: 'Confirmed commission',
    hintKey: 'confirmedCommission',
    format: formatGbp,
  },
  { key: 'paidCommission', label: 'Paid commission', hintKey: 'paidCommission', format: formatGbp },
]

export default function ProvidersPartnersManager({ onEditCourse }: Props) {
  const { addToast } = useToast()
  const [dashboard, setDashboard] = useState<ProviderDashboardData | null>(null)
  const [dataSource, setDataSource] = useState<ProviderDataSource>('mock')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [accountStatusFilter, setAccountStatusFilter] = useState('all')
  const [affiliateStatusFilter, setAffiliateStatusFilter] = useState('all')
  const [commissionTypeFilter, setCommissionTypeFilter] = useState('all')
  const [quickFilter, setQuickFilter] = useState<ProviderQuickFilter>('all')
  const [selected, setSelected] = useState<ProviderWithMetrics | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<ProviderWithMetrics | null>(null)
  const [reportOpen, setReportOpen] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    const result = await fetchProviderDashboard()
    setLoading(false)

    if (!result.ok) {
      addToast({
        title: 'Could not load providers',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      return
    }

    setDashboard(result.data.dashboard)
    setDataSource(result.data.source)
    setSelected((prev) => {
      if (!prev) return null
      return result.data.dashboard.providers.find((p) => p.id === prev.id) ?? null
    })
  }, [addToast])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filtered = useMemo(() => {
    if (!dashboard) return []
    return filterProviderMetrics(dashboard.providers, {
      search,
      accountStatus: accountStatusFilter,
      affiliateStatus: affiliateStatusFilter,
      commissionType: commissionTypeFilter,
      quickFilter,
    })
  }, [dashboard, search, accountStatusFilter, affiliateStatusFilter, commissionTypeFilter, quickFilter])

  const handleSync = async () => {
    setSaving(true)
    const result = await syncProvidersFromPublishedCourses()
    setSaving(false)

    if (!result.ok) {
      addToast({ title: 'Sync failed', description: result.error, variant: 'error' })
      return
    }

    const names = result.data.providerNames.join(', ') || 'none'
    addToast({
      title: 'Providers synced from published courses',
      description: `${result.data.created} created, ${result.data.reused} reused. Found: ${names}`,
      variant: 'success',
      duration: 6000,
    })
    await refresh()
  }

  const handleSeed = async () => {
    setSaving(true)
    const result = await seedProviderRecords()
    setSaving(false)
    if (!result.ok) {
      addToast({ title: 'Seed failed', description: result.error, variant: 'error' })
      return
    }
    addToast({
      title: 'Providers seeded',
      description: `${result.data.created} created, ${result.data.skipped} already existed.`,
      variant: 'success',
    })
    await refresh()
  }

  const handleSaveProvider = async (input: CourseProviderInput, id?: string) => {
    setSaving(true)
    const result = id
      ? await updateProviderRecord(id, input)
      : await createProviderRecord(input)
    setSaving(false)

    if (!result.ok) {
      addToast({ title: 'Could not save provider', description: result.error, variant: 'error' })
      return
    }

    addToast({ title: id ? 'Provider updated' : 'Provider added', variant: 'success' })
    setFormOpen(false)
    setEditing(null)
    await refresh()
  }

  const handleCreateFromUnmatched = async (providerName: string) => {
    setSaving(true)
    const result = await createProviderFromCourseName(providerName)
    setSaving(false)

    if (!result.ok) {
      addToast({ title: 'Could not create provider', description: result.error, variant: 'error' })
      return
    }

    addToast({ title: 'Provider created', description: providerName, variant: 'success' })
    await refresh()
  }

  const handleSaveReport = async (input: ProviderCommissionReportInput) => {
    setSaving(true)
    const result = await createCommissionReportRecord(input)
    setSaving(false)

    if (!result.ok) {
      addToast({ title: 'Could not save report', description: result.error, variant: 'error' })
      return
    }

    addToast({ title: 'Commission report added', variant: 'success' })
    setReportOpen(false)
    await refresh()
  }

  const storageLabel = dataSource === 'supabase' ? 'Supabase' : 'Local mock'
  const showSyncEmptyState =
    !loading &&
    dashboard &&
    dashboard.providers.length === 0 &&
    (dashboard.unmatchedCourseProviders.length > 0 ||
      dashboard.summary.publishedPartnerCourses > 0)

  return (
    <div>
      <div className="rounded-xl border border-cyan-500/20 bg-cyan-950/15 px-4 py-3 mb-4 text-xs text-cyan-200/90">
        {PROVIDERS_TAB_INTRO}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          type="button"
          onClick={() => void handleSync()}
          disabled={loading || saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white disabled:opacity-50"
        >
          <RefreshCw className={cn('w-4 h-4', saving && 'animate-spin')} />
          Sync providers from published courses
        </button>
        <button
          type="button"
          onClick={() => {
            setEditing(null)
            setFormOpen(true)
          }}
          disabled={loading || saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-700/60 bg-slate-950/40 text-slate-200 hover:border-slate-600 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add provider
        </button>
        <button
          type="button"
          onClick={() => void handleSeed()}
          disabled={loading || saving}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-700/60 bg-slate-950/40 text-slate-500 hover:text-slate-300 disabled:opacity-50"
          title="Optional preset records (e.g. British Council) — sync from published courses is preferred"
        >
          <Sparkles className="w-4 h-4" />
          Seed preset providers
        </button>
      </div>

      {showSyncEmptyState && (
        <div className="rounded-2xl border border-violet-500/30 bg-violet-950/15 px-5 py-8 mb-4 text-center">
          <p className="text-sm text-slate-200 mb-1">No partner records yet</p>
          <p className="text-xs text-slate-500 mb-4 max-w-lg mx-auto">
            You have published courses with provider names. Click sync to create partner records
            automatically from Published Courses — no manual entry required.
          </p>
          <button
            type="button"
            onClick={() => void handleSync()}
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
          >
            <RefreshCw className={cn('w-4 h-4', saving && 'animate-spin')} />
            Sync providers from published courses
          </button>
        </div>
      )}

      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 mb-4">
        {SUMMARY_CARDS.map((card) => (
          <div
            key={card.key}
            className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-3 py-2.5"
          >
            <p className="text-[10px] uppercase tracking-wide text-slate-500">{card.label}</p>
            <p className="text-xl font-semibold text-slate-100 tabular-nums mt-0.5">
              {loading || !dashboard
                ? '—'
                : card.format
                  ? card.format(dashboard.summary[card.key])
                  : dashboard.summary[card.key]}
            </p>
            <p className="text-[9px] text-slate-600 mt-1 leading-snug">{SUMMARY_CARD_HINTS[card.hintKey]}</p>
          </div>
        ))}
      </div>

      <p className="text-xs text-violet-300/80 mb-4">{ESTIMATED_REVENUE_DISCLAIMER}</p>

      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search providers…"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/60 bg-slate-950/50 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 disabled:opacity-50"
            />
          </div>
          <select
            value={accountStatusFilter}
            onChange={(e) => setAccountStatusFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-200"
          >
            <option value="all">All account statuses</option>
            {PROVIDER_ACCOUNT_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={affiliateStatusFilter}
            onChange={(e) => setAffiliateStatusFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-200"
          >
            <option value="all">All affiliate statuses</option>
            {PROVIDER_AFFILIATE_STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <select
            value={commissionTypeFilter}
            onChange={(e) => setCommissionTypeFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-200"
          >
            <option value="all">All commission types</option>
            {PROVIDER_COMMISSION_TYPE_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setQuickFilter(f.id)}
              disabled={loading}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition disabled:opacity-50',
                quickFilter === f.id
                  ? 'border-violet-500/50 bg-violet-950/40 text-violet-200'
                  : 'border-slate-700/60 bg-slate-950/40 text-slate-400 hover:text-slate-200'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left min-w-[1100px]">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/50 text-[9px] uppercase tracking-widest text-slate-500">
                <th className="px-3 py-2.5 font-medium">Provider</th>
                <th className="px-3 py-2.5 font-medium">Account</th>
                <th className="px-3 py-2.5 font-medium">Affiliate</th>
                <th className="px-3 py-2.5 font-medium text-right">Published</th>
                <th className="px-3 py-2.5 font-medium text-right">Clicks</th>
                <th className="px-3 py-2.5 font-medium text-right">Est. revenue</th>
                <th className="px-3 py-2.5 font-medium text-right">Confirmed</th>
                <th className="px-3 py-2.5 font-medium text-right">Paid</th>
                <th className="px-3 py-2.5 font-medium">Next action</th>
                <th className="px-3 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-3 py-10 text-center text-slate-500">
                    <Loader2 className="w-5 h-5 animate-spin inline-block mr-2" />
                    Loading providers…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-3 py-10 text-center text-slate-500">
                    {dashboard?.providers.length === 0
                      ? 'No partner records yet — sync from published courses to get started.'
                      : 'No providers match your filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map((provider) => (
                  <tr
                    key={provider.id}
                    className={cn(
                      'border-b border-slate-800/50 hover:bg-slate-900/40 cursor-pointer',
                      selected?.id === provider.id && 'bg-violet-950/20'
                    )}
                    onClick={() => setSelected(provider)}
                  >
                    <td className="px-3 py-2.5 font-medium text-slate-200">{provider.name}</td>
                    <td className="px-3 py-2.5">
                      <ProviderBadge value={provider.accountStatus} />
                    </td>
                    <td className="px-3 py-2.5">
                      <ProviderBadge value={provider.affiliateStatus} />
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">
                      {provider.publishedCoursesCount}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-slate-300">
                      {provider.applyClicks}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <EstimatedBadge label={provider.estimatedRevenueLabel} />
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-cyan-300">
                      {formatGbp(provider.confirmedCommission)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-emerald-300">
                      {formatGbp(provider.paidCommission)}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 max-w-[140px] truncate" title={provider.nextAction}>
                      {provider.nextAction}
                    </td>
                    <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1">
                        {provider.affiliateDashboardUrl && (
                          <a
                            href={provider.affiliateDashboardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/60"
                            title="Open dashboard"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(provider)
                            setFormOpen(true)
                          }}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-violet-300 hover:bg-slate-800/60"
                          title="Edit provider"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <p className="px-3 py-2 text-[10px] text-slate-600 border-t border-slate-800/60">
          {loading
            ? 'Loading…'
            : `${filtered.length} shown · ${dashboard?.providers.length ?? 0} total · ${storageLabel}`}
        </p>
      </div>

      {dashboard && dashboard.unmatchedCourseProviders.length > 0 && (
        <div className="rounded-2xl border border-amber-500/25 bg-amber-950/10 p-4 mb-6">
          <h3 className="text-sm font-semibold text-amber-200 mb-2">Unmatched course providers</h3>
          <p className="text-xs text-slate-500 mb-3">
            Published courses reference these provider names but no partner record exists yet. Use sync
            or create individually.
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => void handleSync()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-violet-500/35 text-violet-200 hover:bg-violet-950/30 disabled:opacity-50"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Sync all from published courses
            </button>
          </div>
          <div className="space-y-2">
            {dashboard.unmatchedCourseProviders.map((u) => (
              <div
                key={u.providerName}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-700/50 bg-slate-950/40 px-3 py-2"
              >
                <div>
                  <p className="text-sm text-slate-200">{u.providerName}</p>
                  <p className="text-[10px] text-slate-500">
                    {u.publishedCoursesCount} published · {u.applyClicks} clicks
                  </p>
                </div>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void handleCreateFromUnmatched(u.providerName)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-amber-500/35 text-amber-200 hover:bg-amber-950/30 disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Create provider
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {selected && (
        <div className="rounded-2xl border border-violet-500/30 bg-slate-950/50 overflow-hidden">
          <div className="flex items-start justify-between gap-3 border-b border-slate-800/80 px-4 py-3">
            <div>
              <h3 className="text-base font-semibold text-slate-100">{selected.name}</h3>
              <div className="flex flex-wrap gap-2 mt-1.5">
                <ProviderBadge value={selected.accountStatus} />
                <ProviderBadge value={selected.affiliateStatus} />
                <span className="text-[10px] text-slate-500">{selected.trackingMethod}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setReportOpen(true)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-cyan-500/35 text-cyan-200 hover:bg-cyan-950/30"
              >
                Add confirmed report
              </button>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid gap-4 p-4 lg:grid-cols-2">
            <div className="space-y-3 text-xs">
              <DetailRow label="Website" value={selected.websiteUrl} link />
              <DetailRow label="Affiliate dashboard" value={selected.affiliateDashboardUrl} link />
              <DetailRow label="Commission" value={`${selected.defaultCommissionType} · ${selected.defaultCommissionValue}`} />
              <DetailRow label="Public offer" value={selected.defaultPublicOfferLabel} />
              <DetailRow label="Conversion assumption" value={`${selected.estimatedConversionRatePercent}%`} />
              <DetailRow
                label="Avg order value"
                value={selected.averageOrderValue ? formatGbp(selected.averageOrderValue) : '—'}
              />
              <DetailRow label="Contact" value={selected.contactEmail || '—'} />
              <DetailRow label="Notes" value={selected.notes || '—'} multiline />
              <DetailRow label="Login notes" value={selected.loginNotes || '—'} multiline />
              <DetailRow label="Payout notes" value={selected.payoutNotes || '—'} multiline />
            </div>

            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                Linked published courses
                <span className="normal-case font-normal text-slate-600 ml-1">
                  — from Published Courses tab
                </span>
              </h4>
              {selected.linkedCourses.length === 0 ? (
                <p className="text-xs text-slate-500">No published courses linked yet.</p>
              ) : (
                <div className="space-y-2">
                  {selected.linkedCourses.map((course) => (
                    <div
                      key={course.id}
                      className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-3 py-2.5"
                    >
                      <p className="text-sm font-medium text-slate-200">{course.title}</p>
                      <dl className="mt-2 grid gap-1.5 text-[10px]">
                        <div className="flex gap-2">
                          <dt className="text-slate-600 shrink-0 w-24">Referral URL</dt>
                          <dd className="text-slate-400 truncate" title={course.referralUrl || '—'}>
                            {course.referralUrl || '—'}
                          </dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="text-slate-600 shrink-0 w-24">Apply clicks</dt>
                          <dd className="text-slate-300 tabular-nums">{course.applyClicks}</dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="text-slate-600 shrink-0 w-24">Commission</dt>
                          <dd className="text-slate-300">
                            {course.commissionType} · {course.commissionValue || '—'}
                          </dd>
                        </div>
                        <div className="flex gap-2 items-center">
                          <dt className="text-slate-600 shrink-0 w-24">Est. revenue</dt>
                          <dd>
                            <EstimatedBadge label={course.estimatedRevenueLabel} />
                          </dd>
                        </div>
                        <div className="flex gap-2">
                          <dt className="text-slate-600 shrink-0 w-24">Public offer</dt>
                          <dd className="text-slate-300">{course.publicOfferLabel || '—'}</dd>
                        </div>
                      </dl>
                      <div className="flex flex-wrap gap-3 mt-2.5 pt-2 border-t border-slate-800/60">
                        <button
                          type="button"
                          onClick={() => onEditCourse(course.id)}
                          className="text-[10px] text-violet-300 hover:underline"
                        >
                          Edit course
                        </button>
                        <Link
                          href={`/courses/${course.slug}`}
                          target="_blank"
                          className="text-[10px] text-cyan-300 hover:underline"
                        >
                          Open course
                        </Link>
                        {selected.affiliateDashboardUrl && (
                          <a
                            href={selected.affiliateDashboardUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[10px] text-slate-400 hover:underline"
                          >
                            Provider dashboard
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {dashboard && reportsForProvider(dashboard.reports, selected.id).length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-2">
                    Commission reports
                  </h4>
                  <div className="space-y-1.5">
                    {reportsForProvider(dashboard.reports, selected.id).map((r) => (
                      <div
                        key={r.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-800/80 px-2.5 py-1.5 text-[10px]"
                      >
                        <span className="text-slate-400">{r.reportDate}</span>
                        <ProviderBadge value={r.status} />
                        <span className="text-cyan-300 tabular-nums">
                          {formatGbp(r.confirmedCommission)} {r.currency}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ProviderFormModal
        open={formOpen}
        provider={editing}
        saving={saving}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSave={handleSaveProvider}
      />

      <CommissionReportFormModal
        open={reportOpen}
        provider={selected}
        saving={saving}
        onClose={() => setReportOpen(false)}
        onSave={handleSaveReport}
      />
    </div>
  )
}

function DetailRow({
  label,
  value,
  link,
  multiline,
}: {
  label: string
  value: string
  link?: boolean
  multiline?: boolean
}) {
  return (
    <div>
      <p className="text-[10px] uppercase tracking-wide text-slate-600">{label}</p>
      {link && value?.startsWith('http') ? (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-cyan-300 hover:underline break-all"
        >
          {value}
        </a>
      ) : (
        <p className={cn('text-slate-300', multiline && 'whitespace-pre-wrap')}>{value || '—'}</p>
      )}
    </div>
  )
}
