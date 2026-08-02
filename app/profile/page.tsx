'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import ProfilePageV2 from '@/components/profile/v2/ProfilePageV2'
import { IDENTITY_PHASE1_PRIVATE_ONLY } from '@/lib/identity-profile/phase1'

export default function ProfilePage() {
  const router = useRouter()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const uid = params.get('uid')
    if (!uid) return
    // Phase 1: do not open other users' profiles
    if (IDENTITY_PHASE1_PRIVATE_ONLY) {
      router.replace('/profile')
      return
    }
    router.replace(`/profile/${uid}`)
  }, [router])

  return <ProfilePageV2 target={{ mode: 'self' }} />
}
