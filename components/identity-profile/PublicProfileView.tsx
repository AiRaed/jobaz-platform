'use client'

import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
import Link from 'next/link'
import AppShell from '@/components/layout/AppShell'
import Logo from '@/components/Logo'
import DashboardTabs from '@/components/dashboard/DashboardTabs'
import { useToast } from '@/components/ui/toast'
import { useProfileActions } from '@/hooks/useProfileActions'
import IdentityProfileHero from './IdentityProfileHero'
import IdentityBusinessGallery from './IdentityBusinessGallery'
import ProfileGlassCard from './ProfileGlassCard'
import type { IdentityProfileBundle } from '@/lib/identity-profile/types'

type Props = {
  bundle: IdentityProfileBundle | null
  loading: boolean
  error: string | null
  viewerUserId: string | null
}

export default function PublicProfileView({ bundle, loading, error, viewerUserId }: Props) {
  const { addToast } = useToast()

  const profileUserId = bundle?.profile.user_id ?? ''
  const isOwnProfile = Boolean(viewerUserId && profileUserId && viewerUserId === profileUserId)

  const onToast = useMemo(
    () => (t: { variant: 'success' | 'error' | 'default'; title: string; description?: string }) => {
      addToast({ variant: t.variant, title: t.title, description: t.description })
    },
    [addToast]
  )

  const actions = useProfileActions({
    profileUserId,
    profileId: bundle?.profile.id ?? '',
    profileType: bundle?.profile.profile_type ?? 'personal',
    isOwnProfile,
    onToast,
  })

  const displayName =
    bundle?.profile.profile_type === 'business'
      ? bundle.business?.business_name ?? bundle.profile.username ?? 'Business'
      : bundle?.profile.username ?? 'Member'

  const heroActions = useMemo(
    () => ({
      isOwnProfile,
      isBusinessProfile: actions.isBusinessProfile,
      connectionStatus: actions.connectionStatus,
      businessFollowing: actions.businessFollow.following,
      networkLoading: actions.networkLoading,
      shareLoading: actions.share.loading,
      editLoading: actions.editLoading,
      canNetwork: actions.canNetwork,
      networkLabel: actions.networkLabel,
      onNetworkAction: () => void actions.handleNetworkAction(),
      onShare: () => void actions.handleShare(),
      onPulse: actions.handlePulse,
      onMessage: actions.handleMessage,
      onEdit: () => {},
    }),
    [isOwnProfile, actions]
  )

  return (
    <AppShell>
      <header className="mb-6">
        <Link href="/dashboard" className="inline-block mb-3">
          <Logo />
        </Link>
        <h1 className="text-xl md:text-2xl font-bold text-slate-50 tracking-tight">Pulse profile</h1>
        <p className="text-sm text-slate-400 mt-1">Professional identity on JobAZ</p>
        <div className="mt-4 h-px w-full bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
      </header>

      <DashboardTabs />

      {loading ? (
        <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
          Loading profile…
        </div>
      ) : bundle ? (
        <div className="space-y-6 pb-10">
          <IdentityProfileHero
            bundle={bundle}
            displayName={displayName}
            onAvatarUpload={() => {}}
            onBannerUpload={() => {}}
            actions={heroActions}
          />

          {bundle.profile.bio && (
            <ProfileGlassCard title="About" subtitle="">
              <p className="text-sm text-slate-300 leading-relaxed">{bundle.profile.bio}</p>
            </ProfileGlassCard>
          )}

          {bundle.profile.profile_type === 'business' && bundle.media.length > 0 && (
            <IdentityBusinessGallery media={bundle.media} saving={false} onUpload={() => {}} />
          )}

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => actions.handlePulse()}
              className="rounded-full px-4 py-2 text-sm font-medium text-cyan-200 border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/15 transition cursor-pointer"
            >
              View Pulse posts
            </button>
            {isOwnProfile && (
              <Link
                href="/profile"
                className="rounded-full px-4 py-2 text-sm font-medium text-violet-200 border border-violet-500/40 hover:bg-violet-500/10 transition cursor-pointer"
              >
                Manage profile
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center text-slate-400 text-sm">{error ?? 'Identity not found'}</div>
      )}

    </AppShell>
  )
}
