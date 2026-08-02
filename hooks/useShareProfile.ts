'use client'

import { useCallback, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  copyProfileLink,
  fetchProfileForShare,
  getPublicProfileUrlByUserId,
} from '@/lib/identity-profile/profileActions'

export function useShareProfile(profileUserId: string) {
  const [loading, setLoading] = useState(false)

  const share = useCallback(async () => {
    if (loading) return false
    setLoading(true)
    try {
      const { data } = await supabase.auth.getUser()
      const bundle = await fetchProfileForShare(profileUserId)
      if (bundle) {
        await copyProfileLink(bundle.profile, bundle.business, data.user?.id ?? null)
        return true
      }
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(getPublicProfileUrlByUserId(profileUserId))
        return true
      }
      return false
    } catch {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(getPublicProfileUrlByUserId(profileUserId))
        return true
      }
      return false
    } finally {
      setLoading(false)
    }
  }, [profileUserId, loading])

  return { share, loading }
}
