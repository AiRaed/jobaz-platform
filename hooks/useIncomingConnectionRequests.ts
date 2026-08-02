'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  acceptConnectionRequest,
  declineConnectionRequest,
  fetchIncomingConnectionRequests,
  getAuthUserId,
} from '@/lib/network/connectionsService'
import type { IncomingConnectionRequest } from '@/lib/network/types'

export function useIncomingConnectionRequests(enabled: boolean) {
  const [requests, setRequests] = useState<IncomingConnectionRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!enabled) {
      setRequests([])
      return
    }
    const uid = await getAuthUserId()
    if (!uid) {
      setRequests([])
      return
    }
    setLoading(true)
    try {
      setRequests(await fetchIncomingConnectionRequests(uid))
    } finally {
      setLoading(false)
    }
  }, [enabled])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const accept = useCallback(
    async (connectionId: string) => {
      setActionId(connectionId)
      setRequests((prev) => prev.filter((r) => r.id !== connectionId))
      try {
        await acceptConnectionRequest(connectionId)
      } catch (e) {
        await refresh()
        throw e
      } finally {
        setActionId(null)
      }
    },
    [refresh]
  )

  const decline = useCallback(
    async (connectionId: string) => {
      setActionId(connectionId)
      setRequests((prev) => prev.filter((r) => r.id !== connectionId))
      try {
        await declineConnectionRequest(connectionId)
      } catch (e) {
        await refresh()
        throw e
      } finally {
        setActionId(null)
      }
    },
    [refresh]
  )

  return {
    requests,
    pendingCount: requests.length,
    loading,
    actionId,
    accept,
    decline,
    refresh,
  }
}
