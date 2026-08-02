'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { isBusinessFollower, toggleBusinessFollow } from '@/lib/network/connectionsService'

export function useFollowBusiness(businessProfileId: string | null | undefined, ownerUserId?: string | null) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [following, setFollowing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  const isOwnProfile = Boolean(
    currentUserId && ownerUserId && currentUserId === ownerUserId
  )

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getUser()
      const uid = data.user?.id ?? null
      setCurrentUserId(uid)
      if (!uid || !businessProfileId) {
        setFollowing(false)
        setChecking(false)
        return
      }
      if (ownerUserId && uid === ownerUserId) {
        setFollowing(false)
        setChecking(false)
        return
      }
      setFollowing(await isBusinessFollower(uid, businessProfileId))
      setChecking(false)
    })()
  }, [businessProfileId, ownerUserId])

  const toggleFollow = useCallback(async () => {
    if (!businessProfileId || isOwnProfile || !currentUserId) {
      throw new Error('Sign in to follow this business.')
    }
    if (loading) return { following }
    setLoading(true)
    try {
      const result = await toggleBusinessFollow(businessProfileId)
      setFollowing(result.following)
      return result
    } finally {
      setLoading(false)
    }
  }, [businessProfileId, isOwnProfile, currentUserId, loading, following])

  return {
    currentUserId,
    following,
    loading,
    checking,
    toggleFollow,
    canFollow: Boolean(businessProfileId && currentUserId && !isOwnProfile),
    isOwnProfile,
  }
}
