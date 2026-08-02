'use client'

import { useRef } from 'react'
import {
  Camera,
  MapPin,
  Share2,
  MessageCircle,
  Pencil,
  Sparkles,
  Activity,
  ImageIcon,
  Loader2,
  Eye,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import ProfileConnectionButton from '@/components/network/ProfileConnectionButton'
import type { ConnectionStatus } from '@/lib/network/types'
import type { IdentityProfileBundle } from '@/lib/identity-profile/types'

export type ProfileHeroActions = {
  isOwnProfile: boolean
  isBusinessProfile: boolean
  connectionStatus: ConnectionStatus
  businessFollowing: boolean
  networkLoading: boolean
  shareLoading: boolean
  editLoading?: boolean
  canNetwork: boolean
  networkLabel: string
  onNetworkAction: () => void
  onShare: () => void
  onPulse: () => void
  onMessage: () => void
  onEdit: () => void
}

type Props = {
  bundle: IdentityProfileBundle
  displayName: string
  saving?: boolean
  avatarUploading?: boolean
  onAvatarUpload: (file: File) => void
  onBannerUpload: (file: File) => void
  actions: ProfileHeroActions
}

const btn =
  'rounded-full px-3 py-2 text-xs font-medium border transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5'

export default function IdentityProfileHero({
  bundle,
  displayName,
  saving,
  avatarUploading,
  onAvatarUpload,
  onBannerUpload,
  actions,
}: Props) {
  const p = bundle.profile
  const isBusiness = p.profile_type === 'business'
  const avatarRef = useRef<HTMLInputElement>(null)
  const bannerRef = useRef<HTMLInputElement>(null)
  const { isOwnProfile } = actions

  const initials = (displayName || p.username || 'JZ')
    .split(' ')
    .map((x) => x[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const trust =
    p.trust_score || bundle.personal?.career_score || bundle.business?.customer_trust_score || 0

  const stats = [
    {
      label: isBusiness ? 'Followers' : 'Connections',
      value: bundle.stats.followersCount,
    },
    { label: 'Following', value: bundle.stats.followingCount },
    { label: 'Pulse posts', value: bundle.stats.pulsePostsCount },
    {
      label: isBusiness ? 'Opportunities' : 'Projects',
      value: isBusiness ? bundle.stats.opportunitiesCount : bundle.stats.projectsCount,
    },
  ]

  const showRemoveHint =
    !isOwnProfile &&
    !actions.isBusinessProfile &&
    actions.connectionStatus === 'connected'

  return (
    <section
      id="profile-hero"
      className="relative rounded-2xl border border-violet-500/25 overflow-hidden bg-slate-950/80 shadow-[0_0_48px_rgba(88,28,135,0.18)] pointer-events-none"
    >
      {/* Cover — decorative only; Cover button re-enables pointer events */}
      <div className="relative z-0 h-32 md:h-40 bg-gradient-to-r from-violet-950/80 via-indigo-950/60 to-slate-950 pointer-events-none">
        {p.banner_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.banner_url}
            alt=""
            className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70"
          />
        ) : (
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(139,92,246,0.35),transparent_55%)]" />
        )}
        {isOwnProfile && (
          <>
            <button
              type="button"
              onClick={() => bannerRef.current?.click()}
              disabled={saving}
              className="pointer-events-auto absolute top-3 right-3 z-10 rounded-full px-3 py-1.5 text-xs font-medium border border-white/10 bg-slate-950/60 text-slate-200 hover:bg-violet-500/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              Cover
            </button>
            <input
              ref={bannerRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) onBannerUpload(f)
              }}
            />
          </>
        )}
      </div>

      {/* Interactive body — above cover layer in the stack */}
      <div className="pointer-events-auto relative z-10 px-5 md:px-7 pb-6 -mt-14">
        {isOwnProfile && bundle.stats.weeklyProfileViews > 0 && (
          <p className="mb-3 text-xs text-cyan-300/90 flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5" />
            {bundle.stats.weeklyProfileViews} people viewed your profile this week
          </p>
        )}

        <div className="flex flex-col lg:flex-row lg:items-end gap-5">
          <div className="flex items-end gap-4 min-w-0 flex-1">
            <div className="relative shrink-0">
              <div className="pointer-events-none absolute inset-0 rounded-full bg-violet-500/25 blur-lg" />
              <div className="relative h-28 w-28 md:h-32 md:w-32 rounded-full border-2 border-violet-400/50 overflow-hidden bg-slate-900 shadow-[0_0_28px_rgba(139,92,246,0.4)] flex items-center justify-center">
                {p.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={p.avatar_url}
                    alt=""
                    className="pointer-events-none h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-violet-200">{initials}</span>
                )}
                {avatarUploading && (
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-slate-950/70">
                    <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
                  </div>
                )}
              </div>
              {isOwnProfile && (
                <>
                  <button
                    type="button"
                    onClick={() => avatarRef.current?.click()}
                    disabled={saving || avatarUploading}
                    className="pointer-events-auto absolute bottom-1 right-1 z-10 p-2 rounded-full bg-violet-600 hover:bg-violet-500 text-white shadow-lg transition cursor-pointer disabled:opacity-50"
                    aria-label="Upload photo"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                  <input
                    ref={avatarRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) onAvatarUpload(f)
                    }}
                  />
                </>
              )}
            </div>
            <div className="pb-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold text-slate-50 truncate">
                  {p.username ? `@${p.username}` : displayName}
                </h2>
                <span
                  className={cn(
                    'text-[10px] px-2.5 py-0.5 rounded-full border font-medium uppercase tracking-wide shrink-0',
                    isBusiness
                      ? 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                      : 'bg-violet-500/10 text-violet-300 border-violet-500/30'
                  )}
                >
                  {isBusiness ? 'Business' : 'Personal'}
                </span>
              </div>
              <p className="text-sm text-slate-300 mt-1 line-clamp-2">{p.headline ?? 'Add your headline'}</p>
              {p.location && (
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                  <MapPin className="w-3 h-3 shrink-0" />
                  {p.location}
                </p>
              )}
            </div>
          </div>

          <div
            className="relative z-20 flex flex-wrap gap-2 lg:ml-auto lg:pb-1 w-full lg:w-auto"
            role="toolbar"
            aria-label="Identity actions"
          >
            {isOwnProfile && (
              <button
                type="button"
                onClick={() => {
                  console.log('[Profile] Edit profile click')
                  actions.onEdit()
                }}
                disabled={actions.editLoading || saving}
                className={cn(
                  btn,
                  'bg-violet-600 hover:bg-violet-500 text-white border-violet-500/50 shadow-[0_0_20px_rgba(139,92,246,0.35)] px-4'
                )}
              >
                {actions.editLoading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Pencil className="w-3.5 h-3.5" />
                )}
                Edit Identity
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                console.log('[Profile] Share click')
                actions.onShare()
              }}
              disabled={actions.shareLoading}
              className={cn(
                btn,
                'border-slate-600/60 text-slate-300 hover:border-violet-500/40 hover:text-violet-200 hover:shadow-[0_0_12px_rgba(139,92,246,0.12)]'
              )}
            >
              {actions.shareLoading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Share2 className="w-3.5 h-3.5" />
              )}
              Share
            </button>
            <button
              type="button"
              onClick={() => {
                console.log('[Profile] Pulse click')
                actions.onPulse()
              }}
              className={cn(
                btn,
                'border-slate-600/60 text-slate-300 hover:border-cyan-500/40 hover:text-cyan-200'
              )}
            >
              <Activity className="w-3.5 h-3.5" />
              Pulse
            </button>
            {!isOwnProfile && (
              <ProfileConnectionButton
                profileType={actions.isBusinessProfile ? 'business' : 'personal'}
                connectionStatus={actions.connectionStatus}
                following={actions.businessFollowing}
                loading={actions.networkLoading}
                disabled={!actions.canNetwork}
                onClick={() => {
                  console.log('[Profile] Connect click')
                  actions.onNetworkAction()
                }}
              />
            )}
            {showRemoveHint && (
              <button
                type="button"
                onClick={actions.onNetworkAction}
                disabled={actions.networkLoading}
                className={cn(
                  btn,
                  'border-slate-700/50 text-slate-500 hover:text-red-300 hover:border-red-500/30 text-[10px]'
                )}
              >
                Remove connection
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                console.log('[Profile] Message click')
                actions.onMessage()
              }}
              className={cn(
                btn,
                'border-slate-600/60 text-slate-300 hover:border-violet-500/40 hover:text-violet-200'
              )}
            >
              <MessageCircle className="w-3.5 h-3.5" />
              Open Relay
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          <div className="rounded-xl border border-violet-500/20 bg-violet-950/20 px-3 py-2.5 col-span-2 sm:col-span-1">
            <p className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-violet-400" />
              AI trust
            </p>
            <p className="text-lg font-bold text-violet-200">{trust}</p>
          </div>
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-3 py-2.5"
            >
              <p className="text-[10px] text-slate-500 uppercase tracking-wide">{s.label}</p>
              <p className="text-lg font-semibold text-slate-100">{s.value}</p>
            </div>
          ))}
        </div>

        {(saving || avatarUploading) && (
          <p className="text-xs text-violet-300/80 mt-3 flex items-center gap-2">
            <Loader2 className="w-3 h-3 animate-spin" />
            Saving profile…
          </p>
        )}
      </div>
    </section>
  )
}
