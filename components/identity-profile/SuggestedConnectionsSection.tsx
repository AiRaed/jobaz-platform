'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { fetchSuggestedConnections } from '@/lib/network/suggestedConnections'
import { personalProfilePath, businessProfilePath } from '@/lib/network/publicProfileUrls'
import ProfileConnectionButton from '@/components/network/ProfileConnectionButton'
import { togglePersonalConnection, toggleBusinessFollow } from '@/lib/network/connectionsService'
import ProfileGlassCard from './ProfileGlassCard'
import type { SuggestedConnection } from '@/lib/network/types'

type Props = {
  onToast?: (t: { variant: 'success' | 'error'; title: string }) => void
}

export default function SuggestedConnectionsSection({ onToast }: Props) {
  const [items, setItems] = useState<SuggestedConnection[]>([])
  const [loading, setLoading] = useState(true)
  const [actionId, setActionId] = useState<string | null>(null)

  useEffect(() => {
    void (async () => {
      setLoading(true)
      try {
        setItems(await fetchSuggestedConnections(5))
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const handleConnect = async (s: SuggestedConnection) => {
    setActionId(s.userId)
    try {
      if (s.profileType === 'business') {
        await toggleBusinessFollow(s.profileId)
        onToast?.({ variant: 'success', title: 'Following business' })
      } else {
        const r = await togglePersonalConnection(s.userId)
        onToast?.({
          variant: 'success',
          title: r.status === 'connected' ? 'Connected' : 'Request sent',
        })
      }
      setItems(await fetchSuggestedConnections(5))
    } catch (e) {
      onToast?.({
        variant: 'error',
        title: e instanceof Error ? e.message : 'Could not connect',
      })
    } finally {
      setActionId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading suggestions…
      </div>
    )
  }

  if (items.length === 0) return null

  return (
    <ProfileGlassCard title="Suggested connections" subtitle="People and businesses near your career path.">
      <ul className="space-y-3">
        {items.map((s) => (
          <li
            key={s.userId}
            className="flex items-center gap-3 rounded-xl border border-slate-800/50 bg-slate-900/30 p-3 hover:border-violet-500/25 transition"
          >
            <Link
              href={
                s.profileType === 'business'
                  ? businessProfilePath(
                      s.businessSlug ? { business_slug: s.businessSlug } : null,
                      s.username,
                      s.userId
                    )
                  : personalProfilePath(s.username, s.userId)
              }
              className="shrink-0"
            >
              {s.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-violet-500/30" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-200">
                  {s.name.slice(0, 2).toUpperCase()}
                </div>
              )}
            </Link>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{s.name}</p>
              <p className="text-[10px] text-violet-300/80 truncate">{s.role}</p>
              <p className="text-[9px] text-slate-600">{s.mutualGroups}</p>
            </div>
            <ProfileConnectionButton
              profileType={s.profileType}
              connectionStatus={s.connectionStatus}
              loading={actionId === s.userId}
              compact
              onClick={() => void handleConnect(s)}
            />
          </li>
        ))}
      </ul>
    </ProfileGlassCard>
  )
}
