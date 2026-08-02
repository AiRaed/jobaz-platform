import { getUserScopedKeySync, getCurrentUserIdSync } from '@/lib/user-storage'
import type { ProfileExtensions, ProfileVisibility } from './types'

export type { ProfileVisibility }

const BASE_KEY = 'profile_extensions'

const DEFAULTS: ProfileExtensions = {
  aboutMe: '',
  visibility: 'private',
  username: '',
  availabilityStatus: 'Open to opportunities',
  careerDirection: '',
  avatarUrl: null,
  linkedinUrl: '',
  portfolioUrl: '',
  githubUrl: '',
  languagesSpoken: '',
  privacy: {
    hideEmail: false,
    hidePhone: false,
    hideLocation: false,
    anonymousMode: false,
    recruitersOnly: false,
  },
}

export function loadProfileExtensions(): ProfileExtensions {
  if (typeof window === 'undefined') return { ...DEFAULTS, privacy: { ...DEFAULTS.privacy } }
  try {
    const key = getUserScopedKeySync(BASE_KEY, getCurrentUserIdSync())
    const raw = localStorage.getItem(key)
    if (!raw) return { ...DEFAULTS, privacy: { ...DEFAULTS.privacy } }
    const parsed = JSON.parse(raw)
    return {
      ...DEFAULTS,
      ...parsed,
      privacy: { ...DEFAULTS.privacy, ...(parsed.privacy ?? {}) },
    }
  } catch {
    return { ...DEFAULTS, privacy: { ...DEFAULTS.privacy } }
  }
}

export function saveProfileExtensions(partial: Partial<ProfileExtensions>): ProfileExtensions {
  const current = loadProfileExtensions()
  const next: ProfileExtensions = {
    ...current,
    ...partial,
    privacy: partial.privacy ? { ...current.privacy, ...partial.privacy } : current.privacy,
  }
  if (typeof window !== 'undefined') {
    const key = getUserScopedKeySync(BASE_KEY, getCurrentUserIdSync())
    localStorage.setItem(key, JSON.stringify(next))
  }
  return next
}

export function slugifyUsername(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 32)
}

export function publicProfileUrl(username: string): string | null {
  if (!username.trim()) return null
  return `jobaz.io/u/${username.trim()}`
}

export const VISIBILITY_OPTIONS: {
  id: ProfileVisibility
  label: string
  description: string
}[] = [
  {
    id: 'private',
    label: 'Private Profile',
    description: 'Only you can view your professional identity.',
  },
  {
    id: 'public',
    label: 'Public JobAZ Profile',
    description: 'Share a modern public profile with employers and peers.',
  },
  {
    id: 'recruiter',
    label: 'Recruiter Visible',
    description: 'Allow verified recruiters to discover your profile on JobAZ.',
  },
]

export const AVAILABILITY_OPTIONS = [
  'Open to opportunities',
  'Interviewing',
  'Private',
  'Recruiter visible',
] as const
