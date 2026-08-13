/**
 * After auth: flush pending Add-to-My-Plan selections into Supabase as the active plan.
 */

import {
  clearPendingPlanItems,
  loadPendingPlanItems,
} from './pendingPlanItems'
import { selectedToJobAZPlan, selectedToJazActions } from './mapSelected'
import { clearStaleMyPlanCaches, writeLocalJazActionPlanCache } from './clearStaleCaches'
import {
  clearGuestPlanLocalKeys,
  syncLocalMirrorAfterServerSave,
} from './activePlanClient'
import { CAREER_PLAN_REFRESH_EVENT } from '@/lib/dashboard/careerOs/types'

/**
 * Returns true when pending items were found and a save was attempted.
 */
export async function promotePendingPlanItems(): Promise<boolean> {
  if (typeof window === 'undefined') return false
  const pending = loadPendingPlanItems()
  if (!pending?.selected?.length) return false

  const catalog = {
    goal_path: pending.goal_path,
    route_title: pending.route_title,
    field: pending.field,
    specialism: pending.specialism,
    result_token: pending.result_token,
    roles: pending.selected.filter((i) => i.group === 'roles'),
    training: pending.selected.filter((i) => i.group === 'training'),
    skills: pending.selected.filter((i) => i.group === 'skills'),
  }

  const mapped = selectedToJobAZPlan(catalog, pending.selected, null)
  clearStaleMyPlanCaches()

  const actions = selectedToJazActions(pending.selected, catalog)
  try {
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
          career_goal_path: pending.goal_path,
          field: pending.field,
          specialism: pending.specialism,
          result_token: pending.result_token,
          promoted_after_auth: true,
          created_at: new Date().toISOString(),
          ca_selection: mapped.ca_selection,
        },
      }),
    })
    const json = (await res.json().catch(() => null)) as {
      ok?: boolean
      plan?: unknown
      jobaz_plan?: unknown
    } | null

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
  } catch {
    // Keep a local mirror so the user is not stuck if the API fails mid-auth
    syncLocalMirrorAfterServerSave(mapped)
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

  clearPendingPlanItems()
  clearGuestPlanLocalKeys()
  window.dispatchEvent(new Event(CAREER_PLAN_REFRESH_EVENT))
  return true
}
