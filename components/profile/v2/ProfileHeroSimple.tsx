'use client'

import { Pencil, Share2, Loader2, MessageCircle, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DbBusinessProfile, DbProfile } from '@/lib/identity-profile/types'

const btn =
  'rounded-full px-4 py-2 text-sm font-medium border transition cursor-pointer inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed'

type Props = {
  profile: DbProfile
  business?: DbBusinessProfile | null
  isOwnProfile: boolean
  isBusinessProfile?: boolean
  saving?: boolean
  shareLoading?: boolean
  networkLoading?: boolean
  networkLabel?: string
  isNetworkActive?: boolean
  messageLoading?: boolean
  onEdit?: () => void
  onShare: () => void
  onNetworkAction?: () => void
  onMessage?: () => void
}

function displayTitle(
  profile: DbProfile,
  business: DbBusinessProfile | null | undefined,
  isOwnProfile: boolean
): string {
  if (profile.profile_type === 'business') {
    return business?.business_name ?? (profile.username ? `@${profile.username}` : 'Business identity')
  }
  if (profile.username) return `@${profile.username}`
  return isOwnProfile ? 'Your identity' : 'Member identity'
}

export default function ProfileHeroSimple({
  profile,
  business,
  isOwnProfile,
  saving,
  shareLoading,
  networkLoading,
  networkLabel = 'Connect',
  isNetworkActive = false,
  messageLoading,
  onEdit,
  onShare,
  onNetworkAction,
  onMessage,
}: Props) {
  const initials = (profile.username ?? business?.business_name ?? 'JZ')
    .replace('@', '')
    .split(/[\s_-]/)
    .map((p) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const title = displayTitle(profile, business, isOwnProfile)
  const headline =
    profile.headline ??
    (isOwnProfile ? 'Add a headline to introduce yourself' : 'No headline yet')

  return (
    <section className="rounded-2xl border border-violet-500/25 bg-slate-950/80 p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-center gap-6">
        <div className="shrink-0 h-24 w-24 md:h-28 md:w-28 rounded-full border-2 border-violet-400/50 overflow-hidden bg-slate-900 flex items-center justify-center">
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="text-2xl font-bold text-violet-200">{initials}</span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-50 truncate">{title}</h1>
          <p className="text-sm text-slate-300 mt-1">{headline}</p>
        </div>

        <div className="flex flex-wrap gap-2 md:flex-col lg:flex-row">
          {isOwnProfile ? (
            <>
              <button
                type="button"
                onClick={onEdit}
                disabled={saving}
                className={cn(btn, 'bg-violet-600 hover:bg-violet-500 text-white border-violet-500/50')}
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Pencil className="w-4 h-4" />}
                Edit Identity
              </button>
              <button
                type="button"
                onClick={onShare}
                disabled={shareLoading || saving}
                className={cn(btn, 'border-slate-600/60 text-slate-200 hover:border-violet-500/40')}
              >
                {shareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                Share
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={onNetworkAction}
                disabled={networkLoading || saving}
                className={cn(
                  btn,
                  isNetworkActive
                    ? 'border-emerald-500/50 text-emerald-200 bg-emerald-500/10'
                    : 'bg-violet-600 hover:bg-violet-500 text-white border-violet-500/50'
                )}
              >
                {networkLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <UserPlus className="w-4 h-4" />
                )}
                {networkLabel}
              </button>
              <button
                type="button"
                onClick={() => void onMessage?.()}
                disabled={saving || messageLoading}
                className={cn(btn, 'border-slate-600/60 text-slate-200 hover:border-violet-500/40')}
              >
                {messageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
                Open Relay
              </button>
              <button
                type="button"
                onClick={onShare}
                disabled={shareLoading || saving}
                className={cn(btn, 'border-slate-600/60 text-slate-200 hover:border-violet-500/40')}
              >
                {shareLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                Share
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
