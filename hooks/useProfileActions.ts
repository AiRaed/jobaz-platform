'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { recordProfileView } from '@/lib/identity-profile/profileActions'
import type { ProfileType } from '@/lib/identity-profile/types'
import type { ConnectionStatus } from '@/lib/network/types'
import { useConnectUser } from './useConnectUser'
import { useFollowBusiness } from './useFollowBusiness'
import { useShareProfile } from './useShareProfile'
import { isIdentityPublicSocialEnabled } from '@/lib/identity-profile/phase1'

export type ProfileToastPayload = {
  variant: 'success' | 'error' | 'default'
  title: string
  description?: string
}

type Options = {
  profileUserId: string
  profileId: string
  profileType: ProfileType
  isOwnProfile: boolean
  onToast?: (t: ProfileToastPayload) => void
}

function connectLabel(status: ConnectionStatus): string {
  switch (status) {
    case 'connected':
      return 'Connected'
    case 'pending_out':
      return 'Pending'
    case 'pending_in':
      return 'Connect'
    default:
      return 'Connect'
  }
}

function connectToast(status: ConnectionStatus): ProfileToastPayload {
  switch (status) {
    case 'connected':
      return { variant: 'success', title: 'Connected', description: 'You are now professionally connected.' }
    case 'pending_out':
      return { variant: 'success', title: 'Request sent', description: 'Connection pending until they accept.' }
    case 'pending_in':
      return { variant: 'success', title: 'Connection accepted' }
    default:
      return { variant: 'default', title: 'Connection removed' }
  }
}

export function useProfileActions({
  profileUserId,
  profileId,
  profileType,
  isOwnProfile,
  onToast,
}: Options) {
  const router = useRouter()
  const isBusiness = profileType === 'business'
  const connect = useConnectUser(isOwnProfile || isBusiness ? null : profileUserId)
  const businessFollow = useFollowBusiness(isBusiness ? profileId : null, profileUserId)
  const share = useShareProfile(profileUserId)
  const [editLoading, setEditLoading] = useState(false)

  useEffect(() => {
    if (!isIdentityPublicSocialEnabled()) return
    if (!profileUserId || isOwnProfile) return
    void recordProfileView(profileUserId, connect.currentUserId)
  }, [profileUserId, isOwnProfile, connect.currentUserId])

  const toast = useCallback((p: ProfileToastPayload) => onToast?.(p), [onToast])

  const handleNetworkAction = useCallback(async () => {
    if (!isIdentityPublicSocialEnabled()) {
      toast({
        variant: 'default',
        title: 'Connections coming later',
        description: 'Public career profiles and connections open in Phase 2.',
      })
      return
    }
    if (isOwnProfile) return
    if (isBusiness) {
      if (!businessFollow.canFollow) {
        toast({ variant: 'error', title: 'Sign in to follow businesses' })
        return
      }
      try {
        const r = await businessFollow.toggleFollow()
        toast({
          variant: 'success',
          title: r.following ? 'Following business' : 'Unfollowed',
          description: r.following ? 'See their opportunities on Pulse.' : undefined,
        })
      } catch (e) {
        toast({
          variant: 'error',
          title: 'Could not update follow',
          description: e instanceof Error ? e.message : undefined,
        })
      }
      return
    }

    if (!connect.canConnect) {
      toast({ variant: 'error', title: 'Sign in to connect' })
      return
    }
    try {
      const r = await connect.toggleConnect()
      toast(connectToast(r.status))
    } catch (e) {
      toast({
        variant: 'error',
        title: 'Could not update connection',
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }, [isOwnProfile, isBusiness, businessFollow, connect, toast])

  const handleShare = useCallback(async () => {
    if (!isIdentityPublicSocialEnabled()) {
      toast({
        variant: 'default',
        title: 'Public profile coming later',
        description: 'You’ll be able to share your career profile when Pulse and Relay open fully.',
      })
      return
    }
    try {
      if (await share.share()) toast({ variant: 'success', title: 'Identity link copied' })
      else toast({ variant: 'error', title: 'Could not copy link' })
    } catch (e) {
      toast({
        variant: 'error',
        title: 'Share failed',
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }, [share, toast])

  const handlePulse = useCallback(() => {
    router.push(isOwnProfile ? '/feed' : `/feed?author=${profileUserId}`)
  }, [isOwnProfile, profileUserId, router])

  const handleMessage = useCallback(async () => {
    if (isOwnProfile) return
    if (!connect.currentUserId) {
      toast({ variant: 'error', title: 'Sign in to open Relay' })
      return
    }
    // Phase 1: no user-to-user chat — open professional inbox to JobAZ Team
    const params = new URLSearchParams({
      type: isBusiness ? 'business_enquiry' : 'jobaz_support',
      subject: isBusiness ? 'Business / work enquiry' : 'JobAZ support',
    })
    router.push(`/messages?${params.toString()}`)
  }, [isOwnProfile, connect.currentUserId, isBusiness, toast, router])

  const handleEdit = useCallback(
    (openEditor: () => void) => {
      if (!isOwnProfile) return
      setEditLoading(true)
      openEditor()
      requestAnimationFrame(() => {
        document.getElementById('profile-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        setEditLoading(false)
      })
    },
    [isOwnProfile]
  )

  const networkLoading = isBusiness ? businessFollow.loading || businessFollow.checking : connect.loading || connect.checking
  const networkLabel = isBusiness
    ? businessFollow.following
      ? 'Following'
      : 'Follow Business'
    : connectLabel(connect.status)

  const canNetwork = isBusiness ? businessFollow.canFollow : connect.canConnect
  const isNetworkActive = isBusiness ? businessFollow.following : connect.status === 'connected'

  return {
    connect,
    businessFollow,
    share,
    messageLoading: false,
    editLoading,
    handleNetworkAction,
    handleShare,
    handlePulse,
    handleMessage,
    handleEdit,
    networkLoading,
    networkLabel,
    canNetwork,
    isNetworkActive,
    connectionStatus: connect.status,
    isBusinessProfile: isBusiness,
  }
}
