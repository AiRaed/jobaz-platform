'use client'

import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type {
  SavedPlanDetail,
  SavedPlanListItem,
  SavedPlansSummary,
} from '@/lib/admin/savedPlans'
import AdminSendEmailModal, {
  type AdminEmailContext,
} from '@/components/admin/AdminSendEmailModal'

const STATUS_OPTIONS = ['all', 'active', 'stale', 'test'] as const

function fmtDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString()
  } catch {
    return '—'
  }
}

function fmtDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString()
  } catch {
    return '—'
  }
}

function statusTone(status: string): string {
  if (status === 'active') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
  if (status === 'stale') return 'border-slate-600 bg-slate-800/50 text-slate-400'
  if (status === 'test') return 'border-amber-500/40 bg-amber-500/10 text-amber-200'
  return 'border-slate-600 bg-slate-800/40 text-slate-300'
}

function insightTone(insight: string): string {
  if (insight === 'High intent') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
  if (insight === 'Needs CV follow-up') return 'border-amber-500/40 bg-amber-500/10 text-amber-200'
  if (insight === 'Course interest') return 'border-sky-500/40 bg-sky-500/10 text-sky-200'
  if (insight === 'Dormant plan') return 'border-slate-600 bg-slate-800/50 text-slate-400'
  if (insight === 'Test/demo') return 'border-amber-500/40 bg-amber-500/10 text-amber-200'
  return 'border-violet-500/40 bg-violet-500/10 text-violet-200'
}

function SummaryCard({
  label,
  value,
  available,
}: {
  label: string
  value: string | number | null
  available?: boolean
}) {
  const ok = available !== false
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3.5 py-3">
      <p className="text-[10px] uppercase tracking-wider text-slate-500">{label}</p>
      <p
        className={cn(
          'mt-1 text-lg font-semibold tabular-nums',
          ok ? 'text-slate-100' : 'text-slate-500'
        )}
      >
        {ok ? (value ?? '—') : 'Not tracked yet'}
      </p>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-2 text-sm py-1.5 border-b border-slate-800/60 last:border-0">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-200">{children}</dd>
    </div>
  )
}

export default function AdminSavedPlansPageClient() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [plans, setPlans] = useState<SavedPlanListItem[]>([])
  const [summary, setSummary] = useState<SavedPlansSummary | null>(null)
  const [routes, setRoutes] = useState<string[]>([])
  const [goals, setGoals] = useState<string[]>([])

  const [search, setSearch] = useState('')
  const [route, setRoute] = useState('all')
  const [goal, setGoal] = useState('all')
  const [hasCv, setHasCv] = useState<'all' | 'yes' | 'no'>('all')
  const [hasApplyNow, setHasApplyNow] = useState<'all' | 'yes' | 'no'>('all')
  const [savedFrom, setSavedFrom] = useState('')
  const [status, setStatus] = useState('all')

  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<SavedPlanDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [emailOpen, setEmailOpen] = useState(false)
  const [emailContext, setEmailContext] = useState<AdminEmailContext | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (search.trim()) params.set('search', search.trim())
      if (route !== 'all') params.set('route', route)
      if (goal !== 'all') params.set('goal', goal)
      if (hasCv !== 'all') params.set('hasCv', hasCv)
      if (hasApplyNow !== 'all') params.set('hasApplyNow', hasApplyNow)
      if (savedFrom) params.set('savedFrom', new Date(savedFrom).toISOString())
      if (status !== 'all') params.set('status', status)

      const res = await fetch(`/api/admin/saved-plans?${params}`)
      const data = await res.json()
      setPlans(data.plans || [])
      setSummary(data.summary || null)
      setRoutes(data.routes || [])
      setGoals(data.goals || [])
      if (!data.ok && data.error) setError(data.error)
    } catch {
      setError('Failed to load saved plans')
      setPlans([])
    } finally {
      setLoading(false)
    }
  }, [search, route, goal, hasCv, hasApplyNow, savedFrom, status])

  useEffect(() => {
    void load()
  }, [load])

  const openDetail = async (id: string) => {
    setDetailId(id)
    setDetail(null)
    setDetailError(null)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/saved-plans/${id}`)
      const data = await res.json()
      if (!data.ok) {
        setDetailError(data.error || 'Failed to load plan')
        return
      }
      setDetail(data.plan)
    } catch {
      setDetailError('Failed to load plan')
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setDetailId(null)
    setDetail(null)
    setDetailError(null)
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <SummaryCard
          label="Total saved plans"
          value={summary?.totalSavedPlans ?? 0}
          available={summary?.assessmentsAvailable}
        />
        <SummaryCard label="Saved plans this week" value={summary?.savedThisWeek ?? 0} />
        <SummaryCard
          label="Most common route"
          value={summary?.mostCommonRoute || '—'}
          available={summary?.assessmentsAvailable}
        />
        <SummaryCard
          label="Most common target role"
          value={summary?.mostCommonTargetRole || '—'}
          available={summary?.assessmentsAvailable}
        />
        <SummaryCard
          label="Plans with recommended course"
          value={summary?.plansWithRecommendedCourse ?? 0}
        />
        <SummaryCard label="Plans with Apply Now click" value={summary?.plansWithApplyNow ?? 0} />
        <SummaryCard label="Plans with CV" value={summary?.plansWithCv ?? 0} />
      </div>

      {summary?.notes?.length ? (
        <ul className="text-xs text-slate-500 space-y-1">
          {summary.notes.map((n) => (
            <li key={n}>• {n}</li>
          ))}
        </ul>
      ) : null}

      <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 p-4 space-y-3">
        <p className="text-xs font-medium text-slate-300">Filters</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <label className="block text-xs text-slate-400 space-y-1">
            <span>Search email or name</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="block text-xs text-slate-400 space-y-1">
            <span>Route</span>
            <select
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              <option value="all">All routes</option>
              {routes.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-slate-400 space-y-1">
            <span>Goal</span>
            <select
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              <option value="all">All goals</option>
              {goals.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-slate-400 space-y-1">
            <span>Date saved from</span>
            <input
              type="date"
              value={savedFrom}
              onChange={(e) => setSavedFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="block text-xs text-slate-400 space-y-1">
            <span>Has CV</span>
            <select
              value={hasCv}
              onChange={(e) => setHasCv(e.target.value as 'all' | 'yes' | 'no')}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              <option value="all">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="block text-xs text-slate-400 space-y-1">
            <span>Apply Now click</span>
            <select
              value={hasApplyNow}
              onChange={(e) => setHasApplyNow(e.target.value as 'all' | 'yes' | 'no')}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              <option value="all">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="block text-xs text-slate-400 space-y-1">
            <span>Status</span>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o === 'all' ? 'All statuses' : o}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-500"
          >
            Refresh
          </button>
          <button
            type="button"
            disabled
            title="Coming soon"
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-medium text-slate-500 cursor-not-allowed"
          >
            Export saved plans CSV — coming soon
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-xs rounded-lg border border-amber-500/25 bg-amber-950/20 text-amber-100 px-3 py-2">
          {error}
        </p>
      ) : null}

      <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1200px]">
            <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2.5 font-medium">User</th>
                <th className="px-3 py-2.5 font-medium">Email</th>
                <th className="px-3 py-2.5 font-medium">Goal</th>
                <th className="px-3 py-2.5 font-medium">Route</th>
                <th className="px-3 py-2.5 font-medium">Target role</th>
                <th className="px-3 py-2.5 font-medium">Next upgrade</th>
                <th className="px-3 py-2.5 font-medium">Recommended course</th>
                <th className="px-3 py-2.5 font-medium">Readiness</th>
                <th className="px-3 py-2.5 font-medium">Saved</th>
                <th className="px-3 py-2.5 font-medium">CV</th>
                <th className="px-3 py-2.5 font-medium">Apply Now</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={13} className="px-3 py-8 text-center text-slate-500 animate-pulse">
                    Loading saved plans…
                  </td>
                </tr>
              ) : plans.length === 0 ? (
                <tr>
                  <td colSpan={13} className="px-3 py-8 text-center text-slate-500">
                    {summary?.assessmentsAvailable === false
                      ? 'Saved plans not tracked yet.'
                      : 'No saved plans match these filters.'}
                  </td>
                </tr>
              ) : (
                plans.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/40">
                    <td className="px-3 py-2.5 text-slate-100">{p.userName}</td>
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-xs">{p.email}</td>
                    <td className="px-3 py-2.5 text-slate-300 max-w-[120px] truncate">
                      {p.goal || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">{p.route || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-300">{p.targetRole || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-300">{p.nextUpgrade || '—'}</td>
                    <td className="px-3 py-2.5 text-slate-300 max-w-[140px] truncate">
                      {p.recommendedCourse || '—'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300 tabular-nums">
                      {p.readinessTracked ? p.readiness : 'Not tracked yet'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400">{fmtDate(p.savedAt)}</td>
                    <td className="px-3 py-2.5 text-slate-300 capitalize">
                      {p.cvStatus === 'not_tracked' ? 'Not tracked yet' : p.cvStatus}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300 tabular-nums">
                      {!p.applyNowTracked ? 'Not tracked yet' : p.applyNowClicks}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize',
                          statusTone(p.status)
                        )}
                      >
                        {p.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => void openDetail(p.id)}
                        className="text-xs text-violet-300 hover:text-violet-200 underline-offset-2 hover:underline"
                      >
                        View details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-[11px] text-slate-500">
        Privacy: full CV content and raw assessment JSON are not shown. Missing sources show as Not
        tracked yet.
      </p>

      {detailId ? (
        <div className="fixed inset-0 z-50 flex justify-end">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close"
            onClick={closeDetail}
          />
          <aside className="relative w-full max-w-lg h-full overflow-y-auto border-l border-slate-700 bg-slate-950 shadow-2xl">
            <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
              <h2 className="text-sm font-semibold text-slate-100">Saved plan details</h2>
              <div className="flex items-center gap-3">
                {detail && detail.profile.email && detail.profile.email.includes('@') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEmailContext({
                        to: detail.profile.email,
                        userId: detail.profile.userId,
                        userName: detail.profile.name,
                        route: detail.plan.route,
                        targetRole: detail.plan.targetRole,
                        nextUpgrade: detail.plan.nextUpgrade,
                        courseTitle:
                          detail.plan.recommendedCourse ||
                          detail.courses.clickedCourses[0] ||
                          null,
                        providerName:
                          detail.courses.relatedProvider ||
                          detail.courses.clickedProviders[0] ||
                          null,
                      })
                      setEmailOpen(true)
                    }}
                    className="text-xs text-violet-300 hover:text-violet-200 underline-offset-2 hover:underline"
                  >
                    Send email
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={closeDetail}
                  className="text-xs text-slate-400 hover:text-slate-200"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-4 space-y-5">
              {detailLoading ? (
                <p className="text-sm text-slate-500 animate-pulse">Loading…</p>
              ) : detailError ? (
                <p className="text-sm text-rose-300">{detailError}</p>
              ) : detail ? (
                <>
                  <p
                    className={cn(
                      'text-xs rounded-lg border px-3 py-2',
                      insightTone(detail.insight)
                    )}
                  >
                    <span className="font-medium">{detail.insight}</span>
                    <span className="text-slate-400"> — {detail.insightDetail}</span>
                  </p>

                  <section>
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                      User profile
                    </h3>
                    <dl>
                      <Field label="Name">{detail.profile.name}</Field>
                      <Field label="Email">{detail.profile.email}</Field>
                    </dl>
                  </section>

                  <section>
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                      Saved plan summary
                    </h3>
                    <dl>
                      <Field label="Goal">{detail.plan.goal || '—'}</Field>
                      <Field label="Route">{detail.plan.route || '—'}</Field>
                      <Field label="Target role">{detail.plan.targetRole || '—'}</Field>
                      <Field label="Saved">{fmtDateTime(detail.plan.savedAt)}</Field>
                      <Field label="Status">
                        <span
                          className={cn(
                            'inline-flex rounded-full border px-2 py-0.5 text-[10px] capitalize',
                            statusTone(detail.plan.status)
                          )}
                        >
                          {detail.plan.status}
                        </span>
                      </Field>
                      <Field label="Readiness">
                        {detail.plan.readinessTracked
                          ? detail.plan.readiness
                          : 'Not tracked yet'}
                      </Field>
                    </dl>
                  </section>

                  <section>
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                      Work-now roles
                    </h3>
                    <p className="text-sm text-slate-300">
                      {detail.plan.workNowRoles.length
                        ? detail.plan.workNowRoles.join(', ')
                        : '—'}
                    </p>
                  </section>

                  <section>
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                      Next upgrade / course
                    </h3>
                    <dl>
                      <Field label="Next upgrade">{detail.plan.nextUpgrade || '—'}</Field>
                      <Field label="Recommended">
                        {detail.plan.recommendedCourse || '—'}
                      </Field>
                      <Field label="Provider">
                        {detail.courses.relatedProvider || '—'}
                      </Field>
                      <Field label="Optional add-ons">
                        {detail.plan.optionalAddons.length
                          ? detail.plan.optionalAddons.join(', ')
                          : '—'}
                      </Field>
                      <Field label="CV action">{detail.plan.cvAction || '—'}</Field>
                    </dl>
                  </section>

                  <section>
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                      Documents
                    </h3>
                    <dl>
                      <Field label="CV status">
                        {!detail.documents.cvTracked
                          ? 'Not tracked yet'
                          : detail.documents.cvStatus}
                      </Field>
                      <Field label="CV updated">
                        {fmtDateTime(detail.documents.cvUpdatedAt)}
                      </Field>
                    </dl>
                  </section>

                  <section>
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                      Apply Now activity
                    </h3>
                    {!detail.courses.tracked ? (
                      <p className="text-sm text-slate-500">Not tracked yet</p>
                    ) : (
                      <dl>
                        <Field label="Clicks">{detail.courses.applyNowClicks}</Field>
                        <Field label="Courses">
                          {detail.courses.clickedCourses.length
                            ? detail.courses.clickedCourses.join(', ')
                            : '—'}
                        </Field>
                        <Field label="Providers">
                          {detail.courses.clickedProviders.length
                            ? detail.courses.clickedProviders.join(', ')
                            : '—'}
                        </Field>
                        <Field label="Latest click">
                          {fmtDateTime(detail.courses.latestClickAt)}
                        </Field>
                      </dl>
                    )}
                  </section>
                </>
              ) : null}
            </div>
          </aside>
        </div>
      ) : null}

      <AdminSendEmailModal
        open={emailOpen}
        onClose={() => {
          setEmailOpen(false)
          setEmailContext(null)
        }}
        context={emailContext}
      />
    </div>
  )
}
