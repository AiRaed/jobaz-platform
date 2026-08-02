'use client'

import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'
import type {
  AdminUserDetail,
  AdminUserListItem,
  AdminUsersSummary,
  AdminUsersTracking,
} from '@/lib/admin/users'
import AdminSendEmailModal, {
  type AdminEmailContext,
} from '@/components/admin/AdminSendEmailModal'

const ENGAGEMENT_OPTIONS = [
  'all',
  'New',
  'Active',
  'High intent',
  'Dormant',
  'Test/demo',
] as const

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

function engagementTone(label: string): string {
  if (label === 'High intent') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
  if (label === 'Active') return 'border-sky-500/40 bg-sky-500/10 text-sky-200'
  if (label === 'New') return 'border-violet-500/40 bg-violet-500/10 text-violet-200'
  if (label === 'Dormant') return 'border-slate-600 bg-slate-800/50 text-slate-400'
  if (label === 'Test/demo') return 'border-amber-500/40 bg-amber-500/10 text-amber-200'
  return 'border-slate-600 bg-slate-800/40 text-slate-300'
}

function SummaryCard({
  label,
  value,
  available,
  hint,
}: {
  label: string
  value: string | number | null
  available?: boolean
  hint?: string
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
      {!ok && hint ? <p className="text-[10px] text-slate-600 mt-1">{hint}</p> : null}
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

export default function AdminUsersPageClient() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<AdminUserListItem[]>([])
  const [summary, setSummary] = useState<AdminUsersSummary | null>(null)
  const [tracking, setTracking] = useState<AdminUsersTracking | null>(null)
  const [routes, setRoutes] = useState<string[]>([])

  const [search, setSearch] = useState('')
  const [route, setRoute] = useState('all')
  const [joinedFrom, setJoinedFrom] = useState('')
  const [hasSavedPlan, setHasSavedPlan] = useState<'all' | 'yes' | 'no'>('all')
  const [hasCv, setHasCv] = useState<'all' | 'yes' | 'no'>('all')
  const [hasApplyNow, setHasApplyNow] = useState<'all' | 'yes' | 'no'>('all')
  const [engagement, setEngagement] = useState('all')

  const [detailId, setDetailId] = useState<string | null>(null)
  const [detail, setDetail] = useState<AdminUserDetail | null>(null)
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
      if (joinedFrom) params.set('joinedFrom', new Date(joinedFrom).toISOString())
      if (hasSavedPlan !== 'all') params.set('hasSavedPlan', hasSavedPlan)
      if (hasCv !== 'all') params.set('hasCv', hasCv)
      if (hasApplyNow !== 'all') params.set('hasApplyNow', hasApplyNow)
      if (engagement !== 'all') params.set('engagement', engagement)

      const res = await fetch(`/api/admin/users?${params}`)
      const data = await res.json()
      if (!data.ok && !data.users) {
        setError(data.error || 'Failed to load users')
        setUsers([])
        return
      }
      setUsers(data.users || [])
      setSummary(data.summary || null)
      setTracking(data.tracking || null)
      setRoutes(data.routes || [])
      if (data.error) setError(data.error)
    } catch {
      setError('Failed to load users')
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [search, route, joinedFrom, hasSavedPlan, hasCv, hasApplyNow, engagement])

  useEffect(() => {
    void load()
  }, [load])

  const openDetail = async (id: string) => {
    setDetailId(id)
    setDetail(null)
    setDetailError(null)
    setDetailLoading(true)
    try {
      const res = await fetch(`/api/admin/users/${id}`)
      const data = await res.json()
      if (!data.ok) {
        setDetailError(data.error || 'Failed to load user')
        return
      }
      setDetail(data.user)
    } catch {
      setDetailError('Failed to load user')
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
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3">
        <SummaryCard
          label="Total users"
          value={summary?.totalUsers ?? 0}
          available={summary?.usersAvailable}
          hint="Auth users not available"
        />
        <SummaryCard label="New users this week" value={summary?.newUsersThisWeek ?? 0} />
        <SummaryCard
          label="Users with saved plans"
          value={summary?.usersWithSavedPlans ?? 0}
          available={tracking?.assessments.available}
        />
        <SummaryCard
          label="Users with CVs"
          value={summary?.usersWithCvs ?? 0}
          available={tracking?.cvs.available}
        />
        <SummaryCard
          label="Users with Apply Now clicks"
          value={summary?.usersWithApplyNow ?? 0}
          available={tracking?.courseClicks.available}
        />
        <SummaryCard
          label="Most common route"
          value={summary?.mostCommonRoute || '—'}
          available={tracking?.assessments.available}
        />
        <SummaryCard label="Returning users" value={summary?.returningUsers ?? 0} />
      </div>

      {summary?.notes?.length ? (
        <ul className="text-xs text-slate-500 space-y-1">
          {summary.notes.map((n) => (
            <li key={n}>• {n}</li>
          ))}
        </ul>
      ) : null}

      {/* Filters */}
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
            <span>Joined from</span>
            <input
              type="date"
              value={joinedFrom}
              onChange={(e) => setJoinedFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="block text-xs text-slate-400 space-y-1">
            <span>Engagement</span>
            <select
              value={engagement}
              onChange={(e) => setEngagement(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              {ENGAGEMENT_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o === 'all' ? 'All engagement' : o}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs text-slate-400 space-y-1">
            <span>Saved plan</span>
            <select
              value={hasSavedPlan}
              onChange={(e) => setHasSavedPlan(e.target.value as 'all' | 'yes' | 'no')}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              <option value="all">All</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
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
            Export users CSV — coming soon
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-xs rounded-lg border border-amber-500/25 bg-amber-950/20 text-amber-100 px-3 py-2">
          {error}
        </p>
      ) : null}

      {/* Table */}
      <div className="rounded-xl border border-slate-700/60 bg-slate-950/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm min-w-[1100px]">
            <thead className="bg-slate-900/80 text-[10px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2.5 font-medium">Name</th>
                <th className="px-3 py-2.5 font-medium">Email</th>
                <th className="px-3 py-2.5 font-medium">Joined</th>
                <th className="px-3 py-2.5 font-medium">Last active</th>
                <th className="px-3 py-2.5 font-medium">Route / goal</th>
                <th className="px-3 py-2.5 font-medium">Saved plan</th>
                <th className="px-3 py-2.5 font-medium">CV</th>
                <th className="px-3 py-2.5 font-medium">Apply Now</th>
                <th className="px-3 py-2.5 font-medium">Course interest</th>
                <th className="px-3 py-2.5 font-medium">Engagement</th>
                <th className="px-3 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-slate-500 animate-pulse">
                    Loading users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-3 py-8 text-center text-slate-500">
                    No users match these filters.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-900/40">
                    <td className="px-3 py-2.5 text-slate-100">{u.name}</td>
                    <td className="px-3 py-2.5 text-slate-300 font-mono text-xs">{u.email}</td>
                    <td className="px-3 py-2.5 text-slate-400">{fmtDate(u.joinedAt)}</td>
                    <td className="px-3 py-2.5 text-slate-400">{fmtDate(u.lastActiveAt)}</td>
                    <td className="px-3 py-2.5 text-slate-300">
                      <div>{u.selectedRoute || '—'}</div>
                      {u.goal ? (
                        <div className="text-[10px] text-slate-500 truncate max-w-[160px]">
                          {u.goal}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300">
                      {!u.savedPlanTracked
                        ? 'Not tracked yet'
                        : u.hasSavedPlan
                          ? 'Yes'
                          : 'No'}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300 capitalize">
                      {!u.cvTracked ? 'Not tracked yet' : u.cvStatus}
                    </td>
                    <td className="px-3 py-2.5 text-slate-300 tabular-nums">
                      {!u.applyNowTracked ? 'Not tracked yet' : u.applyNowClicks}
                    </td>
                    <td className="px-3 py-2.5 text-slate-400 text-xs max-w-[140px] truncate">
                      {u.courseInterest || '—'}
                    </td>
                    <td className="px-3 py-2.5">
                      <span
                        className={cn(
                          'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-medium',
                          engagementTone(u.engagement)
                        )}
                      >
                        {u.engagement}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => void openDetail(u.id)}
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
        Privacy: full CV content and private assessment JSON are not shown. Missing sources show as
        Not tracked yet.
      </p>

      {/* Detail drawer */}
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
              <h2 className="text-sm font-semibold text-slate-100">User details</h2>
              <div className="flex items-center gap-3">
                {detail && detail.profile.email && detail.profile.email.includes('@') ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEmailContext({
                        to: detail.profile.email,
                        userId: detail.profile.id,
                        userName: detail.profile.name,
                        route: detail.career.latestRoute,
                        targetRole: detail.career.currentTargetRole,
                        nextUpgrade: detail.career.nextUpgrade,
                        courseTitle: detail.courses.clickedCourses[0] || null,
                        providerName: detail.courses.clickedProviders[0] || null,
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
                      engagementTone(detail.engagement)
                    )}
                  >
                    <span className="font-medium">{detail.engagement}</span>
                    <span className="text-slate-400"> — {detail.insight}</span>
                  </p>

                  <section>
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                      Profile
                    </h3>
                    <dl>
                      <Field label="Name">{detail.profile.name}</Field>
                      <Field label="Email">{detail.profile.email}</Field>
                      <Field label="Created">{fmtDateTime(detail.profile.createdAt)}</Field>
                      <Field label="Last sign-in">
                        {fmtDateTime(detail.profile.lastSignInAt)}
                      </Field>
                      <Field label="Status">{detail.profile.accountStatus}</Field>
                    </dl>
                  </section>

                  <section>
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                      Career activity
                    </h3>
                    {!detail.career.tracked ? (
                      <p className="text-sm text-slate-500">Not tracked yet</p>
                    ) : (
                      <dl>
                        <Field label="Latest goal">{detail.career.latestGoal || '—'}</Field>
                        <Field label="Route">{detail.career.latestRoute || '—'}</Field>
                        <Field label="Target role">
                          {detail.career.currentTargetRole || '—'}
                        </Field>
                        <Field label="Next upgrade">{detail.career.nextUpgrade || '—'}</Field>
                        <Field label="Saved plan">
                          {detail.career.savedPlan ? 'Yes' : 'No'}
                        </Field>
                        <Field label="Sessions">{detail.career.assessmentCount}</Field>
                        <Field label="Readiness">
                          {detail.career.readinessTracked
                            ? detail.career.readinessScore
                            : 'Not tracked yet'}
                        </Field>
                      </dl>
                    )}
                  </section>

                  <section>
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                      Documents
                    </h3>
                    <dl>
                      <Field label="CV exists">
                        {!detail.documents.cvTracked
                          ? 'Not tracked yet'
                          : detail.documents.cvExists
                            ? 'Yes'
                            : 'No'}
                      </Field>
                      <Field label="CV status">
                        {!detail.documents.cvTracked
                          ? 'Not tracked yet'
                          : detail.documents.cvStatus}
                      </Field>
                      <Field label="CV updated">
                        {fmtDateTime(detail.documents.cvLastUpdated)}
                      </Field>
                      <Field label="CV readiness">
                        {detail.documents.cvReadinessTracked
                          ? detail.documents.cvReadinessScore
                          : 'Not tracked yet'}
                      </Field>
                      <Field label="Cover letter">
                        {!detail.documents.coverLetterTracked
                          ? 'Not tracked yet'
                          : detail.documents.coverLetterExists
                            ? 'Yes'
                            : 'No'}
                      </Field>
                      <Field label="Writing review">
                        {!detail.documents.writingReviewTracked
                          ? 'Not tracked yet'
                          : detail.documents.writingReviewUsed
                            ? 'Yes'
                            : 'No'}
                      </Field>
                    </dl>
                  </section>

                  <section>
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                      Course / affiliate
                    </h3>
                    {!detail.courses.tracked ? (
                      <p className="text-sm text-slate-500">Not tracked yet</p>
                    ) : (
                      <dl>
                        <Field label="Apply Now clicks">{detail.courses.applyNowClicks}</Field>
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

                  <section>
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                      AI tool usage
                    </h3>
                    <dl>
                      <Field label="Career Assistant">
                        {detail.aiUsage.careerAssistantTracked
                          ? `${detail.aiUsage.careerAssistantSessions} session(s)`
                          : 'Not tracked yet'}
                      </Field>
                      <Field label="CV Builder">{detail.aiUsage.cvBuilderUsage}</Field>
                      <Field label="Cover Letter">{detail.aiUsage.coverLetterUsage}</Field>
                      <Field label="Writing Review">
                        {detail.aiUsage.writingReviewUsage}
                      </Field>
                      <Field label="Interview Coach">
                        {detail.aiUsage.interviewCoachUsage}
                      </Field>
                    </dl>
                  </section>

                  <section>
                    <h3 className="text-xs uppercase tracking-wider text-slate-500 mb-2">
                      Admin notes
                    </h3>
                    <p className="text-sm text-slate-500">{detail.adminNotes.placeholder}</p>
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
