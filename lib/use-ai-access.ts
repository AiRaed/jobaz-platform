'use client'

import { useState, useEffect, useCallback } from 'react'
import { getAiAccess, setAiAccess, clearAiAccess, formatTimeRemaining, AiAccessInfo, markTrialUsed } from './ai-access'

export interface UseAiAccessReturn {
  valid: boolean
  expiresAt?: number
  remainingMs?: number
  remainingFormatted: string | null
  source?: string
  trialAvailable?: boolean
  trialUsed?: boolean
  setAccess: (source?: string) => void
  clearAccess: () => void
  markTrialUsed: () => void
}

/**
 * React hook that tracks AI access status
 * - Updates every minute when valid
 * - Listens to storage events for cross-tab sync
 * - Returns formatted time remaining
 * - Defers localStorage reads until after mount to prevent hydration mismatch
 */
export function useAiAccess(): UseAiAccessReturn {
  // Initialize with SSR-safe defaults to prevent hydration mismatch
  const [accessInfo, setAccessInfo] = useState<AiAccessInfo>(() => ({
    valid: false,
    trialAvailable: false,
    trialUsed: false,
  }))

  // Update access info
  const updateAccessInfo = useCallback(() => {
    const info = getAiAccess()
    setAccessInfo(info)
    return info
  }, [])

  // Initialize on mount - defer localStorage reads until after mount
  useEffect(() => {
    updateAccessInfo()
  }, [updateAccessInfo])

  // Listen to storage events for cross-tab sync
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'ai_access_until' || e.key === 'ai_access_source' || e.key === 'ai_trial_used') {
        updateAccessInfo()
      }
    }

    window.addEventListener('storage', handleStorageChange)
    
    // Also listen to custom storage events (same-tab updates)
    const handleCustomStorage = () => {
      updateAccessInfo()
    }
    window.addEventListener('localStorageChange', handleCustomStorage as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('localStorageChange', handleCustomStorage as EventListener)
    }
  }, [updateAccessInfo])

  // Update every minute when valid
  useEffect(() => {
    if (!accessInfo.valid) return

    const interval = setInterval(() => {
      const info = updateAccessInfo()
      
      // If expired, notify the component
      if (!info.valid) {
        // Access expired, cleared automatically by getAiAccess
      }
    }, 60000) // Check every minute

    return () => clearInterval(interval)
  }, [accessInfo.valid, updateAccessInfo])

  // Wrapper functions
  const setAccess = useCallback((source: string = 'donation') => {
    try {
      setAiAccess(source)
      updateAccessInfo()
    } catch (error) {
      console.error('[useAiAccess] Error setting access:', error)
      throw error
    }
  }, [updateAccessInfo])

  const clearAccessWrapper = useCallback(() => {
    clearAiAccess()
    updateAccessInfo()
  }, [updateAccessInfo])

  const markTrialUsedWrapper = useCallback(() => {
    markTrialUsed()
    updateAccessInfo()
  }, [updateAccessInfo])

  return {
    valid: accessInfo.valid,
    expiresAt: accessInfo.expiresAt,
    remainingMs: accessInfo.remainingMs,
    remainingFormatted: formatTimeRemaining(accessInfo.remainingMs),
    source: accessInfo.source,
    trialAvailable: accessInfo.trialAvailable,
    trialUsed: accessInfo.trialUsed,
    setAccess,
    clearAccess: clearAccessWrapper,
    markTrialUsed: markTrialUsedWrapper,
  }
}

