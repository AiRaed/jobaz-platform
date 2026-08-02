/**
 * Active CV resolution — one source of truth for Documents + CV Builder.
 *
 * Priority:
 * 1. URL cvId → that exact saved CV
 * 2. Stored activeCvId (user preference)
 * 3. Primary saved account CV
 * 4. Guest draft only if no saved CV OR user explicitly chose guest
 * 5. null
 */

import type { CvData } from '@/app/cv-builder-v2/page'
import { isMeaningfulCv } from './isMeaningfulCv'
import { clearGuestDraft, hasGuestDraft, readGuestDraft } from '@/lib/guest-tools/storage'

export type ActiveCvSource = 'saved' | 'guest_draft' | 'none'

export type ActiveCvResult = {
  cv: CvData | null
  source: ActiveCvSource
  activeCvId: string | null
  isMeaningfulCv: boolean
  lastUpdated: string | null
  warnings: string[]
}

export const ACTIVE_CV_ID_KEY = 'jobaz_active_cv_id'
export const CV_DRAFT_STORAGE_KEY = 'jobaz-cv-v2-draft'
export const CV_GUEST_CHOICE_SESSION_KEY = 'jobaz_cv_draft_choice'
export const CV_GUEST_PICKER_SHOWN_SESSION_KEY = 'jobaz_cv_guest_picker_shown'

export type CvDraftSessionChoice = 'saved' | 'guest' | 'later'

export function getStoredActiveCvId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(ACTIVE_CV_ID_KEY)
  } catch {
    return null
  }
}

export function setStoredActiveCvId(id: string | null): void {
  if (typeof window === 'undefined') return
  try {
    if (!id) localStorage.removeItem(ACTIVE_CV_ID_KEY)
    else localStorage.setItem(ACTIVE_CV_ID_KEY, id)
  } catch {
    // ignore
  }
}

export function getSessionDraftChoice(): CvDraftSessionChoice | null {
  if (typeof window === 'undefined') return null
  const v = sessionStorage.getItem(CV_GUEST_CHOICE_SESSION_KEY)
  if (v === 'saved' || v === 'guest' || v === 'later') return v
  return null
}

export function setSessionDraftChoice(choice: CvDraftSessionChoice): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(CV_GUEST_CHOICE_SESSION_KEY, choice)
  sessionStorage.setItem(CV_GUEST_PICKER_SHOWN_SESSION_KEY, '1')
  if (choice === 'saved') {
    // Ignore guest draft for this session (and clear so it stops conflicting)
    clearGuestDraft('cv')
  }
}

export function wasGuestPickerShownThisSession(): boolean {
  if (typeof window === 'undefined') return false
  return sessionStorage.getItem(CV_GUEST_PICKER_SHOWN_SESSION_KEY) === '1'
}

export function markGuestPickerShownThisSession(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(CV_GUEST_PICKER_SHOWN_SESSION_KEY, '1')
}

/** Normalize API / storage payload into CvData. */
export function normalizeToCvData(raw: unknown): CvData {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, any>
  const personal = r.personalInfo || r.personal_info || {}
  return {
    personalInfo: {
      fullName: typeof personal.fullName === 'string' ? personal.fullName : '',
      email: typeof personal.email === 'string' ? personal.email : '',
      phone: typeof personal.phone === 'string' ? personal.phone : '',
      location: typeof personal.location === 'string' ? personal.location : '',
      linkedin: typeof personal.linkedin === 'string' ? personal.linkedin : '',
      website: typeof personal.website === 'string' ? personal.website : '',
    },
    summary: typeof r.summary === 'string' ? r.summary : '',
    experience: Array.isArray(r.experience) ? r.experience : [],
    education: Array.isArray(r.education) ? r.education : [],
    skills: Array.isArray(r.skills) ? r.skills : [],
    projects: Array.isArray(r.projects) ? r.projects : [],
    languages: Array.isArray(r.languages) ? r.languages : [],
    certifications: Array.isArray(r.certifications) ? r.certifications : [],
    publications: Array.isArray(r.publications) ? r.publications : [],
  }
}

export type SavedCvFetchResult = {
  cv: CvData
  cvId: string
  lastUpdated: string | null
  title?: string | null
} | null

/** Fetch a saved CV from the account API (primary or by id). */
export async function fetchSavedCv(cvId?: string | null): Promise<SavedCvFetchResult> {
  const qs = cvId ? `?cvId=${encodeURIComponent(cvId)}` : ''
  const res = await fetch(`/api/cv/get-latest${qs}`, { cache: 'no-store' })
  if (!res.ok) return null
  const data = await res.json()
  if (!data?.ok || !data?.hasCv || !data?.cv) return null
  const cv = normalizeToCvData(data.cv)
  return {
    cv,
    cvId: typeof data.cvId === 'string' ? data.cvId : '',
    lastUpdated: data.readiness?.lastUpdated || data.profile?.updatedAt || null,
    title: data.profile?.title || null,
  }
}

function readGuestCvData(): CvData | null {
  const draft = readGuestDraft<{ cvData?: CvData } | CvData>('cv')
  if (!draft) return null
  if ('cvData' in draft && draft.cvData) return normalizeToCvData(draft.cvData)
  if ('personalInfo' in draft || 'summary' in draft) return normalizeToCvData(draft)
  return null
}

export type ResolveActiveCvOptions = {
  /** Prefer this id from the URL */
  cvIdFromUrl?: string | null
  /** Force guest draft (after explicit user choice) */
  forceGuestDraft?: boolean
  /** Skip guest draft even if present */
  ignoreGuestDraft?: boolean
}

/**
 * Resolve the active CV for Builder / Documents consistency checks.
 * Documents should prefer source === 'saved' only.
 */
export async function resolveActiveCv(
  options: ResolveActiveCvOptions = {}
): Promise<ActiveCvResult> {
  const warnings: string[] = []
  const sessionChoice = getSessionDraftChoice()

  if (options.forceGuestDraft || sessionChoice === 'guest') {
    const guest = readGuestCvData()
    if (guest) {
      return {
        cv: guest,
        source: 'guest_draft',
        activeCvId: null,
        isMeaningfulCv: isMeaningfulCv(guest),
        lastUpdated: null,
        warnings: ['Editing guest draft — not the saved account CV until you save.'],
      }
    }
  }

  const preferIds = [options.cvIdFromUrl, getStoredActiveCvId()].filter(
    (id): id is string => Boolean(id && id.trim())
  )

  for (const id of preferIds) {
    try {
      const saved = await fetchSavedCv(id)
      if (saved?.cvId) {
        setStoredActiveCvId(saved.cvId)
        return {
          cv: saved.cv,
          source: 'saved',
          activeCvId: saved.cvId,
          isMeaningfulCv: isMeaningfulCv(saved.cv),
          lastUpdated: saved.lastUpdated,
          warnings: isMeaningfulCv(saved.cv)
            ? []
            : ['Saved CV exists but has little real content.'],
        }
      }
      warnings.push(`Could not load CV id ${id}; trying primary.`)
    } catch {
      warnings.push(`Failed to load CV id ${id}`)
    }
  }

  // Primary / latest saved CV
  try {
    const primary = await fetchSavedCv(null)
    if (primary?.cvId) {
      setStoredActiveCvId(primary.cvId)
      const meaningful = isMeaningfulCv(primary.cv)
      return {
        cv: primary.cv,
        source: 'saved',
        activeCvId: primary.cvId,
        isMeaningfulCv: meaningful,
        lastUpdated: primary.lastUpdated,
        warnings: meaningful ? warnings : [...warnings, 'Saved CV exists but has little real content.'],
      }
    }
  } catch {
    warnings.push('Failed to load primary saved CV')
  }

  // Guest draft only when no saved CV (unless session said later/saved and draft cleared)
  if (!options.ignoreGuestDraft && sessionChoice !== 'saved' && hasGuestDraft('cv')) {
    const guest = readGuestCvData()
    if (guest) {
      return {
        cv: guest,
        source: 'guest_draft',
        activeCvId: null,
        isMeaningfulCv: isMeaningfulCv(guest),
        lastUpdated: null,
        warnings: [
          ...warnings,
          'No saved account CV — using guest draft. Save to keep it on your account.',
        ],
      }
    }
  }

  return {
    cv: null,
    source: 'none',
    activeCvId: null,
    isMeaningfulCv: false,
    lastUpdated: null,
    warnings,
  }
}

export function hasCertifications(cv: CvData | null | undefined): boolean {
  return Boolean(cv?.certifications && cv.certifications.length > 0)
}
