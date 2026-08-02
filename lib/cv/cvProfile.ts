/**
 * CV profile / version abstraction.
 * Existing single saved CV = Main CV (is_primary).
 * Multi-version UI can build on this without changing the upsert path yet.
 */

export const MAIN_CV_TITLE = 'Main CV'

export type CvProfileRecord = {
  id: string
  user_id: string
  title: string
  target_role: string | null
  target_route: string | null
  linked_plan_id: string | null
  is_primary: boolean
  created_at: string
  updated_at: string
  /** Nested builder payload (same shape as /api/cv/upsert `data`) */
  cv_data: Record<string, unknown> | null
}

export type CvProfileListItem = {
  id: string
  title: string
  targetRole: string | null
  targetRoute: string | null
  linkedPlanId: string | null
  isPrimary: boolean
  updatedAt: string
}

/** Map a `cvs` table row (current or future columns) into a profile record. */
export function mapCvsRowToProfile(row: {
  id: string
  user_id: string
  title?: string | null
  target_role?: string | null
  target_route?: string | null
  linked_plan_id?: string | null
  is_primary?: boolean | null
  created_at?: string | null
  updated_at?: string | null
  saved_at?: string | null
  data?: Record<string, unknown> | null
}): CvProfileRecord {
  const updated =
    row.updated_at || row.saved_at || new Date().toISOString()
  return {
    id: row.id,
    user_id: row.user_id,
    title: (row.title && String(row.title).trim()) || MAIN_CV_TITLE,
    target_role: row.target_role ?? null,
    target_route: row.target_route ?? null,
    linked_plan_id: row.linked_plan_id ?? null,
    is_primary: row.is_primary !== false,
    created_at: row.created_at || updated,
    updated_at: updated,
    cv_data: row.data ?? null,
  }
}

export function toCvProfileListItem(profile: CvProfileRecord): CvProfileListItem {
  return {
    id: profile.id,
    title: profile.is_primary ? MAIN_CV_TITLE : profile.title,
    targetRole: profile.target_role,
    targetRoute: profile.target_route,
    linkedPlanId: profile.linked_plan_id,
    isPrimary: profile.is_primary,
    updatedAt: profile.updated_at,
  }
}

/** Future: create targeted CV — UI may show Coming soon until multi-upsert ships. */
export const TARGETED_CV_COMING_SOON = true
