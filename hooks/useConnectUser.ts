'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { ConnectionStatus } from '@/lib/network/types'
import { getConnectionStatus, togglePersonalConnection } from '@/lib/network/connectionsService'

export function useConnectUser(targetUserId: string | null | undefined) {
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [status, setStatus] = useState<ConnectionStatus>('none')
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  const isOwnProfile = Boolean(currentUserId && targetUserId && currentUserId === targetUserId)

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.getUser()
    const uid = data.user?.id ?? null
    setCurrentUserId(uid)
    if (!uid || !targetUserId || uid === targetUserId) {
      setStatus('none')
      setChecking(false)
      return
    }
    setStatus(await getConnectionStatus(uid, targetUserId))
    setChecking(false)
  }, [targetUserId])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const toggleConnect = useCallback(async () => {
    if (!targetUserId || isOwnProfile || !currentUserId) {
      throw new Error('Sign in to connect.')
    }
    if (loading) return { status }
    setLoading(true)
    try {
      const result = await togglePersonalConnection(targetUserId)
      setStatus(result.status)
      return result
    } finally {
      setLoading(false)
    }
  }, [targetUserId, isOwnProfile, currentUserId, loading, status])

  return {
    currentUserId,
    status,
    loading,
    checking,
    toggleConnect,
    canConnect: Boolean(targetUserId && currentUserId && !isOwnProfile),
    isOwnProfile,
  }
}
