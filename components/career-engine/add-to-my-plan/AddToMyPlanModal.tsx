'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, X } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { cn } from '@/lib/utils'
import type { PlanPickCatalog, PlanPickItem } from '@/lib/career-assistant/add-to-my-plan/types'
import { savePendingPlanItems } from '@/lib/career-assistant/add-to-my-plan/pendingPlanItems'
import { clearAddToPlanSessionState } from '@/lib/career-assistant/add-to-my-plan/clearAddToPlanSession'
import {
  buildAddToPlanInitialSelection,
  catalogSelectionKey,
} from '@/lib/career-assistant/add-to-my-plan/buildAddToPlanInitialSelection'
import {
  selectedToJobAZPlan,
  selectedToJazActions,
} from '@/lib/career-assistant/add-to-my-plan/mapSelected'
import { splitRolesByTiming } from '@/lib/career-assistant/add-to-my-plan/rolePriority'
import {
  clearStaleMyPlanCaches,
  writeLocalJazActionPlanCache,
} from '@/lib/career-assistant/add-to-my-plan/clearStaleCaches'
import {
  openAppLevelAuth,
  saveCareerPlanLocally,
  savePendingCareerPlan,
} from '@/lib/uk-career-assistant/pendingCareerPlan'
import { getUkCareerAuthUrls } from '@/lib/uk-career-assistant/guestSession'
import { trackJazEvent } from '@/lib/analytics/jazTrackEvent'
import { CAREER_PLAN_REFRESH_EVENT } from '@/lib/dashboard/careerOs/types'

type Props = {
  open: boolean
  onClose: () => void
  catalog: PlanPickCatalog
}

const MY_PLAN_HREF = '/dashboard?tab=plan'

function kindBadge(item: PlanPickItem): string {
  if (item.badge) return item.badge
  if (item.kind === 'cv') return 'CV'
  if (item.kind === 'interview') return 'Interview'
  if (item.kind === 'portfolio') return 'Portfolio'
  if (item.kind === 'first_step') return 'First step'
  if (item.kind === 'job_search') return 'Job search'
  if (item.kind === 'licence' || item.kind === 'check') return 'Licence / check'
  if (item.kind === 'course') return 'Training'
  return 'Role'
}

function providerLabel(item: PlanPickItem): string | null {
  if (item.group !== 'training') return null
  if (item.provider_status === 'apply_now') return 'Apply Now available'
  if (item.provider_status === 'check') return 'Check / licence'
  if (item.provider_status === 'provider_not_listed') return 'Provider not listed yet'
  return null
}

export function AddToMyPlanModal({ open, onClose, catalog }: Props) {
  const router = useRouter()
  const catalogKey = catalogSelectionKey(catalog)
  const allItems = useMemo(
    () => [...catalog.roles, ...catalog.training, ...catalog.skills],
    [catalog]
  )
  const { startNow: startNowRoles, future: futureRoles } = useMemo(
    () => splitRolesByTiming(catalog.roles),
    [catalog.roles]
  )
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ count: number } | null>(null)

  useEffect(() => {
    if (!open) {
      // Discard temporary selections when closed without save
      setSelectedIds(new Set())
      setSuccess(null)
      setError(null)
      setBusy(false)
      return
    }
    setSuccess(null)
    setError(null)
    // Fresh from CURRENT catalog only — never merge prior modal / storage state
    const { selectedIds: ids } = buildAddToPlanInitialSelection(catalog)
    setSelectedIds(new Set(ids))
  }, [open, catalogKey, catalog])

  if (!open) return null

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllStartNow = () => setSelectedIds(new Set(startNowRoles.map((i) => i.id)))
  const clearAll = () => setSelectedIds(new Set())

  const selected = allItems.filter((i) => selectedIds.has(i.id))

  const handleClose = () => {
    setSelectedIds(new Set())
    setSuccess(null)
    setError(null)
    onClose()
  }

  const renderGroup = (title: string, items: PlanPickItem[], hint?: string) => {
    if (!items.length) return null
    return (
      <section className="space-y-2" aria-label={title}>
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">{title}</h3>
          {hint ? <p className="mt-0.5 text-[11px] text-slate-500">{hint}</p> : null}
        </div>
        <ul className="space-y-2">
          {items.map((item) => {
            const checked = selectedIds.has(item.id)
            const provider = providerLabel(item)
            return (
              <li key={item.id}>
                <label
                  className={cn(
                    'flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition',
                    checked
                      ? 'border-cyan-500/40 bg-cyan-950/25'
                      : 'border-slate-700/70 bg-slate-950/40 hover:border-slate-500'
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-cyan-500"
                    checked={checked}
                    onChange={() => toggle(item.id)}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-slate-100">{item.title}</span>
                      <span className="rounded-full border border-slate-600/60 px-2 py-0.5 text-[10px] text-slate-300">
                        {kindBadge(item)}
                      </span>
                    </span>
                    {item.reason ? (
                      <span className="mt-1 block text-xs text-slate-400">{item.reason}</span>
                    ) : null}
                    {provider ? (
                      <span className="mt-1 block text-[11px] text-slate-500">{provider}</span>
                    ) : null}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      </section>
    )
  }

  const goToMyPlan = () => {
    handleClose()
    router.push(MY_PLAN_HREF)
    // Hard navigation fallback so My Plan remounts with fresh caches
    window.setTimeout(() => {
      if (typeof window !== 'undefined' && !window.location.href.includes('tab=plan')) {
        window.location.href = MY_PLAN_HREF
      }
    }, 400)
  }

  const handleAdd = async () => {
    if (!selected.length) {
      setError('Select at least one item to add.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const mapped = selectedToJobAZPlan(catalog, selected, null)
      const actions = selectedToJazActions(selected, catalog)

      const { data } = await supabase.auth.getUser()
      const userId = data.user?.id || null

      if (!userId) {
        savePendingPlanItems({
          goal_path: catalog.goal_path,
          route_title: catalog.route_title,
          field: catalog.field,
          specialism: catalog.specialism,
          result_token: catalog.result_token,
          selected,
        })
        savePendingCareerPlan(mapped, { goal: catalog.goal_path })
        clearStaleMyPlanCaches()
        saveCareerPlanLocally(mapped)
        void trackJazEvent({
          event_type: 'career_plan_saved',
          event_source: 'add_to_my_plan',
          goal_path: catalog.goal_path,
          route_title: catalog.route_title,
          tool_name: 'career_assistant',
          metadata: { pending: true, selected_count: selected.length, replace_active: true },
        })
        const auth = getUkCareerAuthUrls()
        openAppLevelAuth(
          auth.signupUrl ||
            `/auth?mode=signup&redirectTo=${encodeURIComponent(MY_PLAN_HREF)}`
        )
        return
      }

      clearStaleMyPlanCaches()
      saveCareerPlanLocally(mapped)

      const res = await fetch('/api/jaz-plan/add-from-career-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          goal_path: mapped.source_path_id,
          route_title: mapped.route_summary.route_title,
          current_focus: mapped.route_summary.current_target_role,
          next_upgrade: mapped.route_summary.next_upgrade_role,
          actions,
          jobaz_plan: mapped,
          metadata: {
            source: 'career_assistant_selected_items',
            replace_active: true,
            career_goal_path: catalog.goal_path,
            field: catalog.field,
            specialism: catalog.specialism,
            result_token: catalog.result_token,
            created_at: new Date().toISOString(),
            ca_selection: mapped.ca_selection,
            items: selected.map((s) => ({
              title: s.title,
              kind: s.kind,
              step_key: s.step_key,
              provider_status: s.provider_status,
              referral_url: s.metadata?.referral_url || null,
              search_keywords: s.metadata?.search_keywords || [],
            })),
          },
        }),
      })

      const json = (await res.json().catch(() => null)) as {
        ok?: boolean
        added?: number
        plan?: unknown
        jobaz_plan?: unknown
        error?: string
        persist_warning?: string | null
      } | null

      if (!res.ok || !json?.ok) {
        if (res.status === 401) {
          savePendingPlanItems({
            goal_path: catalog.goal_path,
            route_title: catalog.route_title,
            field: catalog.field,
            specialism: catalog.specialism,
            result_token: catalog.result_token,
            selected,
          })
          savePendingCareerPlan(mapped, { goal: catalog.goal_path })
          const auth = getUkCareerAuthUrls()
          openAppLevelAuth(
            auth.loginUrl || `/auth?mode=login&redirectTo=${encodeURIComponent(MY_PLAN_HREF)}`
          )
          return
        }
        setError(json?.error || 'Could not save to My Plan. Your selection was kept locally.')
      }

      // Server is source of truth — mirror locally for instant paint, clear stale caches
      const { syncLocalMirrorAfterServerSave } = await import(
        '@/lib/career-assistant/add-to-my-plan/activePlanClient'
      )
      syncLocalMirrorAfterServerSave(mapped)

      if (json?.plan) {
        writeLocalJazActionPlanCache(json.plan, mapped.source_path_id)
      } else {
        writeLocalJazActionPlanCache(
          {
            plan_source: 'jaz_plan_fallback',
            goal_path: mapped.source_path_id,
            route_title: mapped.route_summary.route_title,
            current_focus: mapped.route_summary.current_target_role,
            next_upgrade: mapped.route_summary.next_upgrade_role,
            this_week_actions: actions,
            next_best_action: actions[0] || null,
          },
          mapped.source_path_id
        )
      }

      window.dispatchEvent(new Event(CAREER_PLAN_REFRESH_EVENT))
      try {
        const { notifyJobsForYouRefresh } = await import('@/lib/jobs/resolveJobsForYouSource')
        notifyJobsForYouRefresh('plan')
      } catch {
        // ignore
      }
      // Do not keep modal selections for the next Career Assistant result
      clearAddToPlanSessionState()
      setSelectedIds(new Set())
      setSuccess({ count: selected.length })
      void trackJazEvent({
        event_type: 'career_plan_saved',
        event_source: 'add_to_my_plan',
        goal_path: catalog.goal_path,
        route_title: catalog.route_title,
        tool_name: 'career_assistant',
        metadata: {
          added: json?.added,
          replace_active: true,
          selected_count: selected.length,
        },
      })

      // Auto-open My Plan with the replaced active plan
      window.setTimeout(() => {
        goToMyPlan()
      }, 600)
    } catch {
      setError('Something went wrong while saving. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-end justify-center bg-black/60 p-3 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-to-my-plan-title"
        className="flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 px-4 py-4 sm:px-5">
          <div className="min-w-0">
            <h2 id="add-to-my-plan-title" className="text-lg font-semibold text-slate-50">
              Add to My Plan
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Choose the roles, training, and actions you want JobAZ to track. This replaces your
              current active plan.
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-slate-200"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {success ? (
          <div className="space-y-4 px-4 py-6 sm:px-5">
            <p className="text-base font-medium text-emerald-200">
              Career plan saved — job matches updated
            </p>
            <p className="text-sm text-slate-400">
              {success.count} selected item{success.count === 1 ? '' : 's'} saved as your current
              active plan. Opening My Plan…
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={goToMyPlan}
                className="inline-flex min-h-10 items-center justify-center rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500"
              >
                Go to My Plan
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                Continue exploring
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4 sm:px-5">
              <div className="flex flex-wrap gap-3 text-xs">
                <button
                  type="button"
                  onClick={selectAllStartNow}
                  className="text-cyan-300 hover:text-cyan-200"
                >
                  Select start-now defaults
                </button>
                <button type="button" onClick={clearAll} className="text-slate-400 hover:text-slate-200">
                  Clear all
                </button>
              </div>
              {renderGroup(
                'Start now roles',
                startNowRoles,
                'These become your current focus, CV target, and job search roles.'
              )}
              {renderGroup('Training / licences / courses', catalog.training)}
              {renderGroup(
                'Future / progression roles',
                futureRoles,
                'Optional. Saved as future routes only — never as current focus.'
              )}
              {renderGroup('Skills / preparation steps', catalog.skills)}
              {!allItems.length ? (
                <p className="text-sm text-slate-500">No selectable items in this result yet.</p>
              ) : null}
              {error ? <p className="text-sm text-rose-300">{error}</p> : null}
            </div>
            <div className="flex flex-wrap gap-2 border-t border-slate-800 px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={() => void handleAdd()}
                disabled={busy || selected.length === 0}
                className="inline-flex min-h-10 flex-1 items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50 sm:flex-none"
              >
                {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
                Add selected to My Plan
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={busy}
                className="inline-flex min-h-10 items-center justify-center rounded-xl border border-white/15 px-4 text-sm font-medium text-slate-200 hover:bg-white/5"
              >
                Cancel
              </button>
            </div>
            <p className="px-4 pb-3 text-[11px] text-slate-500 sm:px-5">
              Create a free account to save this plan and continue from your dashboard. Your selected
              items are kept until you sign in.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
