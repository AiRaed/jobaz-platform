'use client'

import Link from 'next/link'
import { Check, Loader2, User, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { personalProfilePath } from '@/lib/network/publicProfileUrls'
import type { IncomingConnectionRequest } from '@/lib/network/types'
import ProfileSection from './ProfileSection'

const btn =
  'rounded-full px-3 py-1.5 text-xs font-medium border transition cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed'

type Props = {
  requests: IncomingConnectionRequest[]
  loading: boolean
  actionId: string | null
  pendingCount: number
  onAccept: (connectionId: string) => Promise<void>
  onDecline: (connectionId: string) => Promise<void>
  onToast?: (t: { variant: 'success' | 'error' | 'default'; title: string; description?: string }) => void
}

export default function ProfileConnectionRequestsSection({
  requests,
  loading,
  actionId,
  pendingCount,
  onAccept,
  onDecline,
  onToast,
}: Props) {
  if (!loading && pendingCount === 0) return null

  const handleAccept = async (id: string) => {
    try {
      await onAccept(id)
      onToast?.({ variant: 'success', title: 'Connection accepted' })
    } catch (e) {
      onToast?.({
        variant: 'error',
        title: 'Could not accept request',
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  const handleDecline = async (id: string) => {
    try {
      await onDecline(id)
      onToast?.({ variant: 'default', title: 'Request declined' })
    } catch (e) {
      onToast?.({
        variant: 'error',
        title: 'Could not decline request',
        description: e instanceof Error ? e.message : undefined,
      })
    }
  }

  return (
    <ProfileSection
      title="Connection requests"
      subtitle="People who want to connect with you on JobAZ"
      badge={
        pendingCount > 0 ? (
          <span className="inline-flex min-w-[1.25rem] items-center justify-center rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
            {pendingCount}
          </span>
        ) : undefined
      }
    >
      {loading ? (
        <div className="flex items-center gap-2 text-sm text-slate-500 py-2">
          <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
          Loading requests…
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((request) => {
            const busy = actionId === request.id
            const profileHref = personalProfilePath(request.username, request.requesterId)
            const initials = request.name
              .replace('@', '')
              .split(/[\s_-]/)
              .map((p) => p[0])
              .join('')
              .slice(0, 2)
              .toUpperCase()

            return (
              <li
                key={request.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-900/40 p-4"
              >
                <Link href={profileHref} className="flex items-center gap-3 min-w-0 flex-1 group">
                  <div className="shrink-0 h-12 w-12 rounded-full border border-violet-500/30 overflow-hidden bg-slate-900 flex items-center justify-center">
                    {request.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={request.avatarUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-violet-200">{initials}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate group-hover:text-violet-200 transition">
                      {request.name}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
                      {request.headline ?? 'Career seeker on JobAZ'}
                    </p>
                  </div>
                </Link>

                <div className="flex flex-wrap gap-2 sm:justify-end">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleAccept(request.id)}
                    className={cn(btn, 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500/50')}
                  >
                    {busy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    Accept
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleDecline(request.id)}
                    className={cn(btn, 'border-slate-600/60 text-slate-300 hover:border-rose-500/40 hover:text-rose-200')}
                  >
                    <X className="w-3.5 h-3.5" />
                    Decline
                  </button>
                  <Link
                    href={profileHref}
                    className={cn(btn, 'border-slate-600/60 text-slate-300 hover:border-violet-500/40 hover:text-violet-200')}
                  >
                    <User className="w-3.5 h-3.5" />
                    View identity
                  </Link>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </ProfileSection>
  )
}
