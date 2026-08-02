'use client'

import type { CurrentUserFeedProfile } from '@/lib/feed/types'

type Props = {
  user: CurrentUserFeedProfile
}

export default function FeedMobileProfileStrip({ user }: Props) {
  return (
    <div className="lg:hidden rounded-2xl border border-violet-500/20 bg-slate-950/70 backdrop-blur-xl p-4 flex items-center gap-3 shadow-[0_0_20px_rgba(139,92,246,0.08)]">
      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-violet-600/50 to-cyan-500/30 border border-violet-400/40 flex items-center justify-center font-bold text-violet-100 text-sm">
        {user.initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-100">{user.name}</p>
        <p className="text-[11px] text-violet-300/90 truncate">{user.careerPath}</p>
        <div className="flex items-center gap-2 mt-1.5">
          <div className="flex-1 h-1 rounded-full bg-slate-800 overflow-hidden max-w-[120px]">
            <div
              className="h-full bg-gradient-to-r from-violet-500 to-cyan-400"
              style={{ width: `${user.careerScore}%` }}
            />
          </div>
          <span className="text-[10px] text-violet-300 font-medium">{user.careerScore}/100</span>
        </div>
      </div>
    </div>
  )
}
