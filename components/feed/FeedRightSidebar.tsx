'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { personalProfilePath, businessProfilePath } from '@/lib/network/publicProfileUrls'
import ProfileConnectionButton from '@/components/network/ProfileConnectionButton'
import type { SuggestedFriend } from '@/lib/feed/types'
import { PULSE_PHASE1_DISCOVERY_CIRCLES } from '@/lib/pulse/phase1'
import { UserPlus } from 'lucide-react'

type Props = {
  friends: SuggestedFriend[]
  onConnect: (id: string) => void
}

function suggestionHref(f: SuggestedFriend): string {
  if (f.profileType === 'business') {
    return businessProfilePath(
      f.businessSlug ? { business_slug: f.businessSlug } : null,
      f.username ?? null,
      f.id
    )
  }
  return personalProfilePath(f.username ?? null, f.id)
}

function connectLabel(f: SuggestedFriend): 'personal' | 'business' {
  return f.profileType === 'business' ? 'business' : 'personal'
}

export default function FeedRightSidebar({ friends, onConnect }: Props) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-6">
      {friends.length > 0 && (
        <div className="rounded-2xl border border-slate-700/40 bg-slate-950/60 p-4">
          <h3 className="text-sm font-semibold text-slate-100 mb-3 flex items-center gap-1.5">
            <UserPlus className="w-4 h-4 text-cyan-400" />
            Suggested connections
            <span className="ml-auto text-[9px] uppercase tracking-wider text-slate-500 font-normal">
              Phase 2
            </span>
          </h3>
          <ul className="space-y-3">
            {friends.slice(0, 5).map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-2.5 rounded-xl border border-slate-800/40 bg-slate-900/30 p-2.5 hover:border-violet-500/20 transition"
              >
                <Link href={suggestionHref(f)} className="shrink-0">
                  {f.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={f.avatarUrl}
                      alt=""
                      className="w-9 h-9 rounded-full object-cover border border-violet-500/30"
                    />
                  ) : (
                    <div
                      className={cn(
                        'w-9 h-9 rounded-full bg-gradient-to-br border border-white/10 flex items-center justify-center text-[10px] font-bold text-white',
                        f.color
                      )}
                    >
                      {f.initials}
                    </div>
                  )}
                </Link>
                <div className="flex-1 min-w-0">
                  <Link
                    href={suggestionHref(f)}
                    className="text-xs font-medium text-slate-200 hover:text-violet-300"
                  >
                    {f.name}
                  </Link>
                  <p className="text-[10px] text-violet-300/80">{f.headline ?? f.careerPath}</p>
                </div>
                <ProfileConnectionButton
                  profileType={connectLabel(f)}
                  connectionStatus={f.connectionStatus ?? 'none'}
                  following={f.isFollowing}
                  compact
                  onClick={() => onConnect(f.id)}
                />
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-2xl border border-slate-700/40 bg-slate-950/60 p-4">
        <h3 className="text-sm font-semibold text-slate-100 mb-1 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-violet-400" />
          Circles
          <span className="ml-auto text-[9px] uppercase tracking-wider text-slate-500 font-normal">
            Phase 2
          </span>
        </h3>
        <p className="text-[10px] text-slate-500 mb-3">
          Community groups are coming soon. For launch, JobAZ publishes verified career tips and
          opportunities.
        </p>
        <ul className="space-y-2.5">
          {PULSE_PHASE1_DISCOVERY_CIRCLES.map((g) => (
            <li
              key={g.id}
              className="flex items-start gap-2.5 rounded-xl border border-slate-800/50 bg-slate-900/35 px-3 py-2.5"
            >
              <span className="text-lg leading-none">{g.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-slate-100">{g.name}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{g.blurb}</p>
              </div>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 border border-slate-700/70 rounded-md px-1.5 py-0.5 shrink-0">
                Coming soon
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-slate-700/40 bg-slate-950/60 p-4">
        <p className="text-[11px] text-slate-400 leading-relaxed">
          For launch, JobAZ publishes verified career tips and opportunities. Community posting and
          live circles open later.
        </p>
      </div>
    </aside>
  )
}
