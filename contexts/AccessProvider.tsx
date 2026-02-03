'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

const FREE_LIMIT = 15

interface AccessState {
  paid: boolean
  freeUsed: number
  loading: boolean
}

interface AccessContextType extends AccessState {
  refetchAccess: () => Promise<void>
  incrementFreeUsed: () => Promise<void>
  verifyPayment: () => Promise<void>
}

const AccessContext = createContext<AccessContextType | undefined>(undefined)

export function AccessProvider({ children }: { children: React.ReactNode }) {
  // Keep previous state during loading to prevent flicker
  const [access, setAccess] = useState<AccessState>({
    paid: false,
    freeUsed: 0,
    loading: true,
  })
  
  // Store previous stable state to restore during loading
  const previousStableStateRef = useRef<Omit<AccessState, 'loading'>>({
    paid: false,
    freeUsed: 0,
  })
  
  // Track if we've initialized to prevent default resets
  const initializedRef = useRef(false)

  // Fetch access status from API
  const fetchAccess = useCallback(async () => {
    try {
      setAccess(prev => ({ ...prev, loading: true }))
      
      const response = await fetch('/api/practice/access', {
        method: 'GET',
        credentials: 'include',
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch access status')
      }
      
      const data = await response.json()
      
      // Update stable state
      const newState = {
        paid: data.paid || false,
        freeUsed: data.freeUsed || 0,
      }
      
      previousStableStateRef.current = newState
      initializedRef.current = true
      
      setAccess({
        ...newState,
        loading: false,
      })
    } catch (error) {
      console.error('[AccessProvider] Error fetching access:', error)
      // On error, keep previous stable state but mark as not loading
      setAccess(prev => ({
        ...previousStableStateRef.current,
        loading: false,
      }))
    }
  }, [])

  // Refetch access (called after incrementing freeUsed or payment verification)
  const refetchAccess = useCallback(async () => {
    await fetchAccess()
  }, [fetchAccess])

  // Increment freeUsed (called when user submits an answer)
  const incrementFreeUsed = useCallback(async () => {
    try {
      setAccess(prev => ({ ...prev, loading: true }))
      
      const response = await fetch('/api/practice/increment', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      })
      
      if (!response.ok) {
        throw new Error('Failed to increment freeUsed')
      }
      
      const data = await response.json()
      
      // Update stable state
      const newState = {
        paid: data.paid || false,
        freeUsed: data.freeUsed || 0,
      }
      
      previousStableStateRef.current = newState
      
      setAccess({
        ...newState,
        loading: false,
      })
    } catch (error) {
      console.error('[AccessProvider] Error incrementing freeUsed:', error)
      // On error, keep previous stable state but mark as not loading
      setAccess(prev => ({
        ...previousStableStateRef.current,
        loading: false,
      }))
    }
  }, [])

  // Verify payment (called after successful payment)
  const verifyPayment = useCallback(async () => {
    await refetchAccess()
  }, [refetchAccess])

  // Fetch access on mount only
  useEffect(() => {
    fetchAccess()
  }, [fetchAccess])

  return (
    <AccessContext.Provider
      value={{
        paid: access.paid,
        freeUsed: access.freeUsed,
        loading: access.loading,
        refetchAccess,
        incrementFreeUsed,
        verifyPayment,
      }}
    >
      {children}
    </AccessContext.Provider>
  )
}

export function useAccess() {
  const context = useContext(AccessContext)
  if (context === undefined) {
    throw new Error('useAccess must be used within an AccessProvider')
  }
  return context
}

export { FREE_LIMIT }

