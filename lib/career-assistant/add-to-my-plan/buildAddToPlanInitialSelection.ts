/**
 * Pure initial selection for Add to My Plan modal.
 * Must only use the CURRENT catalog — never old modal / storage state.
 */

import type { PlanPickCatalog, PlanPickItem } from './types'
import { splitRolesByTiming } from './rolePriority'
import { isCourseLikeTitle } from './planIdentity'

export type AddToPlanInitialSelection = {
  /** Item ids to pre-check */
  selectedIds: string[]
  /** Convenience: resolved items */
  selectedItems: PlanPickItem[]
}

/**
 * Build checkbox defaults from the current Career Assistant catalog only.
 *
 * Rules:
 * - Preselect the best immediate / start-now role only (catalog default_selected or first start-now).
 * - Never auto-select courses, licences, boosters, or future routes.
 * - Never auto-select optional skills/boosters (CV/interview stay unchecked).
 * - Does not read localStorage, sessionStorage, or prior modal state.
 */
export function buildAddToPlanInitialSelection(
  catalog: PlanPickCatalog | null | undefined
): AddToPlanInitialSelection {
  if (!catalog) return { selectedIds: [], selectedItems: [] }

  const { startNow } = splitRolesByTiming(catalog.roles || [])
  const startNowRoles = startNow.filter(
    (r) => r.title?.trim() && !isCourseLikeTitle(r.title) && r.route_timing !== 'future_progression'
  )

  const preferred =
    startNowRoles.find((r) => r.default_selected) ||
    startNowRoles[0] ||
    null

  const selectedItems: PlanPickItem[] = preferred ? [preferred] : []
  return {
    selectedIds: selectedItems.map((i) => i.id),
    selectedItems,
  }
}

/**
 * Catalog identity for remounting the modal when the CA result changes.
 */
export function catalogSelectionKey(catalog: PlanPickCatalog | null | undefined): string {
  if (!catalog) return 'empty'
  return [
    catalog.goal_path || '',
    catalog.result_token || '',
    catalog.specialism || '',
    catalog.field || '',
    catalog.route_title || '',
  ].join('|')
}
