/**
 * Adds a completed training item to the user's CV draft / active saved CV.
 */

import type { CvData } from '@/app/cv-builder-v2/page'
import { getCurrentUserIdSync, getUserScopedKeySync } from '@/lib/user-storage'
import {
  applyQualificationToCvData,
  type CvTrainingQualification,
} from './trainingQualifications'
import {
  CV_DRAFT_STORAGE_KEY,
  fetchSavedCv,
  getStoredActiveCvId,
  normalizeToCvData,
  setStoredActiveCvId,
} from '@/lib/cv/getActiveCv'

/** Must match CV Builder STORAGE_KEY (`jobaz-cv-v2-draft`). */
const CV_DRAFT_KEY = CV_DRAFT_STORAGE_KEY

export function mergeQualificationIntoCvData(
  cv: CvData,
  qual: Pick<CvTrainingQualification, 'name' | 'type'>
): CvData {
  const updates = applyQualificationToCvData(cv, qual)
  if (Object.keys(updates).length === 0) return cv
  return { ...cv, ...updates }
}

export function persistCvDraftFromData(cv: CvData): void {
  if (typeof window === 'undefined') return
  const userId = getCurrentUserIdSync()
  const draftKey = getUserScopedKeySync(CV_DRAFT_KEY, userId)
  localStorage.setItem(draftKey, JSON.stringify(cv))
  // Also write legacy key so older readers stay in sync briefly
  const legacyKey = getUserScopedKeySync('cv-builder-v2-draft', userId)
  try {
    localStorage.setItem(legacyKey, JSON.stringify(cv))
  } catch {
    // ignore
  }
  window.dispatchEvent(new CustomEvent('jobaz-cv-draft-updated'))
}

/** @deprecated use mergeQualificationIntoCvData — kept for dashboard training panel */
export function addQualificationToCvDraft(qualificationName: string): boolean {
  return addRequirementToCvDraft({ name: qualificationName, type: 'certification' })
}

/**
 * Add qualification into the active draft, migrating from legacy draft key if needed.
 * Prefer calling upsertActiveCvWithQualification from UI when logged in.
 */
export function addRequirementToCvDraft(
  req: Pick<CvTrainingQualification, 'name' | 'type'>
): boolean {
  if (typeof window === 'undefined') return false
  if (!req.name.trim()) return false

  const userId = getCurrentUserIdSync()
  const draftKey = getUserScopedKeySync(CV_DRAFT_KEY, userId)
  const legacyKey = getUserScopedKeySync('cv-builder-v2-draft', userId)

  try {
    let raw = localStorage.getItem(draftKey)
    if (!raw) raw = localStorage.getItem(legacyKey)
    const draft = normalizeToCvData(raw ? JSON.parse(raw) : {})
    const merged = mergeQualificationIntoCvData(draft, req)
    if (merged === draft) return false
    persistCvDraftFromData(merged)
    return true
  } catch {
    return false
  }
}

/**
 * Merge qualification into the account-saved active CV and upsert.
 * Falls back to draft-only when offline / unauthenticated.
 */
export async function upsertActiveCvWithQualification(
  req: Pick<CvTrainingQualification, 'name' | 'type'>
): Promise<{ ok: boolean; cvId: string | null; cv: CvData | null; message: string }> {
  if (typeof window === 'undefined') {
    return { ok: false, cvId: null, cv: null, message: 'Browser only' }
  }

  const preferredId = getStoredActiveCvId()
  let base: CvData | null = null
  let cvId: string | null = preferredId

  try {
    const saved = await fetchSavedCv(preferredId)
    if (saved) {
      base = saved.cv
      cvId = saved.cvId
      setStoredActiveCvId(saved.cvId)
    }
  } catch {
    // continue with draft
  }

  if (!base) {
    const userId = getCurrentUserIdSync()
    const draftKey = getUserScopedKeySync(CV_DRAFT_KEY, userId)
    const legacyKey = getUserScopedKeySync('cv-builder-v2-draft', userId)
    const raw = localStorage.getItem(draftKey) || localStorage.getItem(legacyKey)
    base = normalizeToCvData(raw ? JSON.parse(raw) : {})
  }

  const merged = mergeQualificationIntoCvData(base, req)
  persistCvDraftFromData(merged)

  try {
    const response = await fetch('/api/cv/upsert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: 'Main CV', data: merged }),
    })
    const data = await response.json().catch(() => ({}))
    if (response.ok && data?.ok && data?.cv?.id) {
      setStoredActiveCvId(data.cv.id)
      return {
        ok: true,
        cvId: data.cv.id,
        cv: merged,
        message: `${req.name} added to your CV.`,
      }
    }
    // Draft updated even if upsert failed (e.g. not logged in)
    return {
      ok: true,
      cvId,
      cv: merged,
      message: `${req.name} added to your CV draft. Save your CV to sync to your account.`,
    }
  } catch {
    return {
      ok: true,
      cvId,
      cv: merged,
      message: `${req.name} added to your CV draft.`,
    }
  }
}

export function cvBuilderHrefForQualification(
  qualificationName: string,
  options?: { cvId?: string | null; mode?: string }
): string {
  const q = new URLSearchParams()
  const cvId = options?.cvId || getStoredActiveCvId()
  if (cvId) q.set('cvId', cvId)
  if (options?.mode) q.set('mode', options.mode)
  q.set('highlight', 'certifications')
  q.set('add', qualificationName.trim())
  return `/cv-builder-v2?${q.toString()}`
}
