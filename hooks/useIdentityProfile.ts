'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  loadIdentityProfileBundle,
  loadIdentityProfileBundleForUser,
  setProfileType,
  updateBusinessProfile,
  updateIdentityProfile,
  updatePersonalProfile,
  uploadProfileImage,
  addProfileMedia,
  replaceProfileSkills,
  type IdentityProfileBundle,
} from '@/lib/identity-profile'
import type { DbBusinessProfile, DbProfile, ProfileType, ProfileVisibility } from '@/lib/identity-profile/types'

export function useIdentityProfile(hasCv = false, viewUserId?: string | null) {
  const [loading, setLoading] = useState(true)
  const [bundle, setBundle] = useState<IdentityProfileBundle | null>(null)
  const [tableMissing, setTableMissing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      const authId = user?.id ?? null
      setUserId(authId)

      const targetId = viewUserId ?? authId
      if (!targetId) {
        setBundle(null)
        return
      }

      const isOwn = authId === targetId
      const result = isOwn
        ? await loadIdentityProfileBundle(targetId, hasCv)
        : await loadIdentityProfileBundleForUser(targetId, false)

      setTableMissing(result.tableMissing)
      setError(result.error)
      setBundle(result.bundle)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [hasCv, viewUserId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const withSave = useCallback(
    async (fn: () => Promise<void>) => {
      setSaving(true)
      try {
        await fn()
        await refresh()
      } finally {
        setSaving(false)
      }
    },
    [refresh]
  )

  const updateProfile = useCallback(
    async (patch: Partial<DbProfile>) => {
      if (!bundle || !userId) return
      await withSave(async () => {
        await updateIdentityProfile(bundle.profile.id, userId, patch)
      })
    },
    [bundle, userId, withSave]
  )

  const switchType = useCallback(
    async (profileType: ProfileType) => {
      if (!bundle || !userId) return
      await withSave(async () => {
        await setProfileType(bundle.profile.id, userId, profileType)
      })
    },
    [bundle, userId, withSave]
  )

  const updatePersonal = useCallback(
    async (patch: Partial<NonNullable<IdentityProfileBundle['personal']>>) => {
      if (!bundle) return
      await withSave(async () => {
        await updatePersonalProfile(bundle.profile.id, patch)
      })
    },
    [bundle, withSave]
  )

  const updateBusiness = useCallback(
    async (patch: Partial<DbBusinessProfile>) => {
      if (!bundle) return
      await withSave(async () => {
        await updateBusinessProfile(bundle.profile.id, patch)
      })
    },
    [bundle, withSave]
  )

  const uploadAvatar = useCallback(
    async (file: File) => {
      if (!bundle || !userId) return
      setAvatarUploading(true)
      try {
        const url = await uploadProfileImage('avatars', userId, file)
        await updateIdentityProfile(bundle.profile.id, userId, { avatar_url: url })
        setBundle((prev) =>
          prev ? { ...prev, profile: { ...prev.profile, avatar_url: url } } : prev
        )
      } finally {
        setAvatarUploading(false)
      }
    },
    [bundle, userId]
  )

  const uploadBanner = useCallback(
    async (file: File) => {
      if (!bundle || !userId) return
      await withSave(async () => {
        const url = await uploadProfileImage('banners', userId, file)
        await updateIdentityProfile(bundle.profile.id, userId, { banner_url: url })
      })
    },
    [bundle, userId, withSave]
  )

  const uploadBusinessMedia = useCallback(
    async (file: File) => {
      if (!bundle || !userId) return
      await withSave(async () => {
        const url = await uploadProfileImage('business-media', userId, file)
        await addProfileMedia(bundle.profile.id, url, file.type.startsWith('video/') ? 'video' : 'image')
      })
    },
    [bundle, userId, withSave]
  )

  const saveSkills = useCallback(
    async (names: string[]) => {
      if (!bundle || !userId) return
      await withSave(async () => {
        const trimmed = names.map((n) => n.trim()).filter(Boolean)
        await replaceProfileSkills(
          bundle.profile.id,
          trimmed.map((name) => ({ name, score: 60 }))
        )
        await updateIdentityProfile(bundle.profile.id, userId, { skills: trimmed })
      })
    },
    [bundle, userId, withSave]
  )

  const setVisibility = useCallback(
    async (visibility: ProfileVisibility) => {
      await updateProfile({ visibility })
    },
    [updateProfile]
  )

  return {
    loading,
    bundle,
    tableMissing,
    error,
    userId,
    saving,
    avatarUploading,
    refresh,
    updateProfile,
    switchType,
    updatePersonal,
    updateBusiness,
    uploadAvatar,
    uploadBanner,
    uploadBusinessMedia,
    saveSkills,
    setVisibility,
  }
}
