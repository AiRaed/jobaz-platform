'use client'

import { useCallback, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import {
  GUEST_AUTH_PROMPTS,
  type GuestAuthAction,
  type GuestToolId,
} from '@/lib/guest-tools/constants'
import { dismissGuestBanner, isGuestBannerDismissed } from '@/lib/guest-tools/storage'

export function useToolGuestMode(tool: GuestToolId) {
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [bannerDismissed, setBannerDismissed] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authAction, setAuthAction] = useState<GuestAuthAction>('save')

  useEffect(() => {
    setBannerDismissed(isGuestBannerDismissed(tool))
  }, [tool])

  useEffect(() => {
    let mounted = true

    void supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      setUser(session?.user ?? null)
      setAuthReady(true)
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const isLoggedIn = authReady && Boolean(user)
  const isGuest = authReady && !user
  const redirectTo = pathname || '/'

  const dismissBanner = useCallback(() => {
    dismissGuestBanner(tool)
    setBannerDismissed(true)
  }, [tool])

  const promptForAuth = useCallback(
    (action: GuestAuthAction = 'save') => {
      if (isLoggedIn) return false
      setAuthAction(action)
      setAuthModalOpen(true)
      return true
    },
    [isLoggedIn]
  )

  const closeAuthModal = useCallback(() => {
    setAuthModalOpen(false)
  }, [])

  const authPrompt = GUEST_AUTH_PROMPTS[tool][authAction]

  return {
    user,
    authReady,
    isLoggedIn,
    isGuest,
    bannerDismissed,
    dismissBanner,
    promptForAuth,
    authModalOpen,
    closeAuthModal,
    authPrompt,
    redirectTo,
  }
}
