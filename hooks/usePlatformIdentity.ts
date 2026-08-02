'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useCareerJourney } from '@/hooks/useCareerJourney'
import { platformLogout } from '@/lib/dashboard/platformLogout'
import { supabase } from '@/lib/supabase'

const DEFAULT_JOURNEY_SIGNALS = {
  hasAssessment: false,
  readinessScore: 0,
  cvQualityScore: 0,
  hasBaseCv: false,
  applicationsCount: 0,
  interviewConfidence: 0,
  savedJobsCount: 0,
}

export type PlatformIdentity = {
  displayName: string
  displayEmail?: string
  careerStateLabel?: string | null
  onLogout: () => void | Promise<void>
  loading: boolean
}

export function usePlatformIdentity(overrides?: Partial<PlatformIdentity>): PlatformIdentity {
  const [displayName, setDisplayName] = useState(overrides?.displayName ?? '')
  const [displayEmail, setDisplayEmail] = useState<string | undefined>(overrides?.displayEmail)
  const [loading, setLoading] = useState(!overrides?.displayName)

  const journeySignals = useMemo(() => DEFAULT_JOURNEY_SIGNALS, [])
  const { snapshot } = useCareerJourney(journeySignals)

  useEffect(() => {
    if (overrides?.displayName) {
      setLoading(false)
      return
    }

    let cancelled = false

    void (async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (cancelled || !user) {
          if (!cancelled) setLoading(false)
          return
        }

        const email = user.email ?? undefined
        const meta = user.user_metadata as { full_name?: string; name?: string } | undefined
        const fullName = meta?.full_name ?? meta?.name ?? ''
        const name = fullName || (email ? email.split('@')[0] : 'Your career')

        if (!cancelled) {
          setDisplayName(name)
          setDisplayEmail(email)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [overrides?.displayName])

  const onLogout = useCallback(async () => {
    if (overrides?.onLogout) {
      await overrides.onLogout()
      return
    }
    await platformLogout()
  }, [overrides?.onLogout])

  return {
    displayName: overrides?.displayName ?? (displayName || 'Your career'),
    displayEmail: overrides?.displayEmail ?? displayEmail,
    careerStateLabel: overrides?.careerStateLabel ?? snapshot?.stateLabel,
    onLogout,
    loading,
  }
}
