/**
 * CV Builder ↔ Training Journey bridge.
 * Qualification status comes only from career plan items + roadmap requirements.
 */

import type { CvData } from '@/app/cv-builder-v2/page'
import type { RouteRequirement, RouteRequirementStatus, TrainingSectionTier } from '@/lib/dashboard/careerOs/types'
import { getUserScopedKeySync, getCurrentUserIdSync } from '@/lib/user-storage'
import {
  buildCareerPlanCertification,
  certificationTitle,
} from '@/lib/cv/cvCertification'

export type CvTrainingQualification = {
  id: string
  slug: string
  name: string
  status: RouteRequirementStatus
  type: RouteRequirement['type']
  sectionTier?: TrainingSectionTier
  actionLabel?: string
  courseHref?: string
  expectedImpact?: string
}

export type CvQualificationSection = 'education' | 'certifications' | 'skills'

const DISMISSAL_KEY = 'jobaz_cv_qualification_dismissals_v1'
const RECENT_BOOST_KEY = 'jobaz_cv_qualification_recent_boost_v1'

type DismissalStore = { slugs: string[] }
type RecentBoost = { slug: string; name: string; delta: number; at: string }

export function qualificationFromRequirement(req: RouteRequirement): CvTrainingQualification {
  return {
    id: req.id,
    slug: req.slug,
    name: req.name,
    status: req.status,
    type: req.type,
    sectionTier: req.sectionTier,
    actionLabel: req.actionLabel,
    courseHref: req.courseHref,
    expectedImpact: req.expectedImpact,
  }
}

export function resolveCvSectionForQualification(
  qual: Pick<CvTrainingQualification, 'name' | 'type'>
): CvQualificationSection {
  const name = qual.name.trim()
  if (qual.type === 'licence') return 'certifications'
  if (qual.type === 'skill') return 'skills'
  if (/enic|recognition|university|degree|bachelor|master|phd|diploma|nvq|btec|hnc|hnd/i.test(name)) {
    return 'education'
  }
  if (/\b(ACCA|CIMA|ICAEW|ACA|AAT|CFA|CPA|chartered)\b/i.test(name)) return 'education'
  if (/certificate|certification|licence|license|cpd|level \d/i.test(name)) return 'certifications'
  if (qual.type === 'course') return 'education'
  return 'certifications'
}

export function sectionLabel(section: CvQualificationSection): string {
  switch (section) {
    case 'education':
      return 'Education'
    case 'certifications':
      return 'Certifications'
    case 'skills':
      return 'Skills'
  }
}

export function normalizeQualificationName(name: string): string {
  return name.trim().toLowerCase()
}

export function isQualificationInCvData(cv: CvData, name: string): boolean {
  const target = normalizeQualificationName(name)
  if (!target) return false

  const matches = (value?: string) => {
    if (!value?.trim()) return false
    const v = value.trim().toLowerCase()
    return v === target || v.includes(target) || target.includes(v)
  }

  if (
    cv.certifications?.some((c) => matches(typeof c === 'string' ? c : certificationTitle(c)))
  ) {
    return true
  }
  if (cv.education?.some((e) => matches(e.degree) || matches(e.school) || matches(e.details))) return true
  if (cv.skills?.some(matches)) return true
  return false
}

export function applyQualificationToCvData(
  cv: CvData,
  qual: Pick<CvTrainingQualification, 'name' | 'type'>
): Partial<CvData> {
  const name = qual.name.trim()
  if (!name || isQualificationInCvData(cv, name)) return {}

  const section = resolveCvSectionForQualification(qual)
  const year = new Date().getFullYear().toString()

  switch (section) {
    case 'certifications': {
      const entry = buildCareerPlanCertification({
        title: name,
        provider: /sia/i.test(name) ? 'Get Licensed' : undefined,
        status: 'completed',
        source: 'career_plan',
      })
      return { certifications: [...(cv.certifications ?? []), entry] }
    }
    case 'skills':
      return { skills: [...(cv.skills ?? []), name] }
    case 'education':
      return {
        education: [
          ...cv.education,
          {
            degree: name,
            school: /enic|recognition/i.test(name) ? 'UK ENIC' : 'Professional development',
            year,
            details:
              qual.type === 'course'
                ? 'Training course — completed'
                : 'Professional qualification — completed',
          },
        ],
      }
  }
}

function readDismissals(): DismissalStore {
  if (typeof window === 'undefined') return { slugs: [] }
  try {
    const raw = localStorage.getItem(getUserScopedKeySync(DISMISSAL_KEY, getCurrentUserIdSync()))
    if (!raw) return { slugs: [] }
    const parsed = JSON.parse(raw) as DismissalStore
    return { slugs: Array.isArray(parsed.slugs) ? parsed.slugs : [] }
  } catch {
    return { slugs: [] }
  }
}

function writeDismissals(store: DismissalStore): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    getUserScopedKeySync(DISMISSAL_KEY, getCurrentUserIdSync()),
    JSON.stringify(store)
  )
  window.dispatchEvent(new CustomEvent('jobaz-cv-qualifications-updated'))
}

export function isQualificationDismissed(slug: string): boolean {
  return readDismissals().slugs.includes(slug)
}

export function dismissQualificationPermanently(slug: string): void {
  const store = readDismissals()
  if (store.slugs.includes(slug)) return
  writeDismissals({ slugs: [...store.slugs, slug] })
}

export function saveRecentQualificationBoost(slug: string, name: string, delta: number): void {
  if (typeof window === 'undefined') return
  const payload: RecentBoost = { slug, name, delta, at: new Date().toISOString() }
  sessionStorage.setItem(
    getUserScopedKeySync(RECENT_BOOST_KEY, getCurrentUserIdSync()),
    JSON.stringify(payload)
  )
}

export function loadRecentQualificationBoost(): RecentBoost | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(getUserScopedKeySync(RECENT_BOOST_KEY, getCurrentUserIdSync()))
    if (!raw) return null
    return JSON.parse(raw) as RecentBoost
  } catch {
    return null
  }
}

export function clearRecentQualificationBoost(): void {
  if (typeof window === 'undefined') return
  sessionStorage.removeItem(getUserScopedKeySync(RECENT_BOOST_KEY, getCurrentUserIdSync()))
}

export function statusIcon(status: RouteRequirementStatus): string {
  if (status === 'completed') return '✅'
  if (status === 'in_progress') return '🟡'
  return '○'
}

export function statusLabel(status: RouteRequirementStatus): string {
  if (status === 'completed') return 'Completed'
  if (status === 'in_progress') return 'In progress'
  return 'Not started'
}

export function pickQualificationReminder(
  qualifications: CvTrainingQualification[],
  cv: CvData,
  cvScore: number
): CvTrainingQualification | null {
  if (cvScore < 40) return null
  return (
    qualifications.find(
      (q) => q.status !== 'completed' && !isQualificationInCvData(cv, q.name)
    ) ?? null
  )
}

export function pickPendingCvCompletionPrompt(
  qualifications: CvTrainingQualification[],
  cv: CvData
): CvTrainingQualification | null {
  return (
    qualifications.find(
      (q) =>
        q.status === 'completed' &&
        !isQualificationInCvData(cv, q.name) &&
        !isQualificationDismissed(q.slug)
    ) ?? null
  )
}

export function computeQualificationReadinessBoost(
  completed: number,
  total: number
): number {
  if (total <= 0) return 0
  return Math.min(18, Math.round((completed / total) * 18))
}
