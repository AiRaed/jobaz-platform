'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  getAuthUserId,
  loadIdentityProfileBundle,
  loadIdentityProfileBundleForUser,
  updateIdentityProfile,
  setProfileType,
  replaceProfileSkills,
  replaceProfileExperience,
  replaceProfileEducation,
} from '@/lib/identity-profile/profileService'
import {
  loadProfileByBusinessSlug,
  loadProfileByUsername,
} from '@/lib/identity-profile/resolvePublicProfile'
import { copyProfileLink } from '@/lib/identity-profile/profileActions'
import type { IdentityProfileBundle, ProfileType, ProfileVisibility } from '@/lib/identity-profile/types'
import { profileViewTargetKey, type ProfileViewTarget } from './profileViewTarget'

export function useProfileV2(target: ProfileViewTarget = { mode: 'self' }) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [bundle, setBundle] = useState<IdentityProfileBundle | null>(null)
  const [tableMissing, setTableMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [viewerUserId, setViewerUserId] = useState<string | null>(null)
  const [viewUserId, setViewUserId] = useState<string | null>(null)

  const targetKey = profileViewTargetKey(target)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const authUid = await getAuthUserId()
      setViewerUserId(authUid)

      let resolvedUserId: string | null = null
      let loadedBundle: IdentityProfileBundle | null = null
      let loadError: string | null = null
      let missing = false

      if (target.mode === 'self') {
        resolvedUserId = authUid
        if (!authUid) {
          setViewUserId(null)
          setBundle(null)
          return
        }
        const result = await loadIdentityProfileBundle(authUid, false)
        missing = result.tableMissing
        loadError = result.error
        loadedBundle = result.bundle
      } else if (target.mode === 'userId') {
        resolvedUserId = target.userId
        const result = await loadIdentityProfileBundleForUser(target.userId, false)
        missing = result.tableMissing
        loadError = result.error
        loadedBundle = result.bundle
      } else if (target.mode === 'username') {
        const lookup = await loadProfileByUsername(target.username)
        loadError = lookup.error
        loadedBundle = lookup.bundle
        resolvedUserId = lookup.bundle?.profile.user_id ?? null
      } else {
        const lookup = await loadProfileByBusinessSlug(target.slug)
        loadError = lookup.error
        loadedBundle = lookup.bundle
        resolvedUserId = lookup.bundle?.profile.user_id ?? null
      }

      setViewUserId(resolvedUserId)
      setTableMissing(missing)
      setError(loadError)
      setBundle(loadedBundle)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile')
      setBundle(null)
    } finally {
      setLoading(false)
    }
  }, [targetKey, target])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const isOwnProfile = Boolean(viewerUserId && viewUserId && viewerUserId === viewUserId)

  const saveProfile = useCallback(
    async (patch: {
      username?: string
      headline?: string
      bio?: string
      location?: string
      visibility?: ProfileVisibility
    }) => {
      if (!bundle || !viewerUserId || !isOwnProfile) return
      setSaving(true)
      try {
        await updateIdentityProfile(bundle.profile.id, viewerUserId, patch)
        await refresh()
      } finally {
        setSaving(false)
      }
    },
    [bundle, viewerUserId, isOwnProfile, refresh]
  )

  const switchType = useCallback(
    async (type: ProfileType) => {
      if (!bundle || !viewerUserId || !isOwnProfile) return
      setSaving(true)
      try {
        await setProfileType(bundle.profile.id, viewerUserId, type)
        await refresh()
      } finally {
        setSaving(false)
      }
    },
    [bundle, viewerUserId, isOwnProfile, refresh]
  )

  const share = useCallback(async () => {
    if (!bundle || !viewUserId) return false
    try {
      await copyProfileLink(bundle.profile, bundle.business, viewerUserId)
      return true
    } catch {
      return false
    }
  }, [bundle, viewUserId, viewerUserId])

  const saveSkills = useCallback(
    async (names: string[]) => {
      if (!bundle || !isOwnProfile) return
      setSaving(true)
      try {
        await replaceProfileSkills(
          bundle.profile.id,
          names.map((name) => ({ name }))
        )
        await refresh()
      } finally {
        setSaving(false)
      }
    },
    [bundle, isOwnProfile, refresh]
  )

  const saveExperience = useCallback(
    async (
      rows: { company: string; role: string; start_date?: string; end_date?: string; description?: string }[]
    ) => {
      if (!bundle || !isOwnProfile) return
      setSaving(true)
      try {
        await replaceProfileExperience(
          bundle.profile.id,
          rows.map((r, i) => ({
            company: r.company,
            role: r.role,
            start_date: r.start_date ?? null,
            end_date: r.end_date ?? null,
            description: r.description ?? null,
            sort_order: i,
          }))
        )
        await refresh()
      } finally {
        setSaving(false)
      }
    },
    [bundle, isOwnProfile, refresh]
  )

  const saveEducation = useCallback(
    async (rows: { school: string; degree?: string; start_date?: string; end_date?: string }[]) => {
      if (!bundle || !isOwnProfile) return
      setSaving(true)
      try {
        await replaceProfileEducation(
          bundle.profile.id,
          rows.map((r, i) => ({
            school: r.school,
            degree: r.degree ?? null,
            start_date: r.start_date ?? null,
            end_date: r.end_date ?? null,
            sort_order: i,
          }))
        )
        await refresh()
      } finally {
        setSaving(false)
      }
    },
    [bundle, isOwnProfile, refresh]
  )

  return {
    loading,
    saving,
    bundle,
    tableMissing,
    error,
    viewerUserId,
    viewUserId,
    isOwnProfile,
    refresh,
    saveProfile,
    switchType,
    share,
    saveSkills,
    saveExperience,
    saveEducation,
  }
}
