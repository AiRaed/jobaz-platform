'use client'

import Link from 'next/link'
import { Bookmark, FileText, Sparkles, Users } from 'lucide-react'
import type { CurrentUserFeedProfile, FeedPost } from '@/lib/feed/types'
import { PULSE_PHASE1_DISCOVERY_CIRCLES } from '@/lib/pulse/phase1'

const SHORTCUTS = [
  { label: 'Saved', href: '#saved', icon: Bookmark },
  { label: 'Success Stories', href: '#', icon: Sparkles },
  { label: 'Circles (Phase 2)', href: '#circles', icon: Users },
  { label: 'Career tips', href: '#', icon: FileText },
]

type Props = {
  user: CurrentUserFeedProfile
  savedCount: number
  savedPosts: FeedPost[]
  compact?: boolean
}

export default function FeedLeftSidebar({ user, savedCount, savedPosts, compact }: Props) {
  return (
    <aside className={compact ? 'space-y-3' : 'space-y-4 lg:sticky lg:top-6'}>
      <div className="rounded-2xl border border-violet-500/20 bg-slate-950/70 backdrop-blur-xl p-4 shadow-[0_0_24px_rgba(139,92,246,0.08)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-600/50 to-cyan-500/30 border border-violet-400/40 flex items-center justify-center font-bold text-violet-100 shadow-[0_0_16px_rgba(139,92,246,0.25)]">
            {user.initials}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-100">{user.name}</p>
            <p className="text-[11px] text-violet-300/90">{user.careerPath}</p>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 italic border-t border-slate-800/50 pt-3">
          Browse JobAZ Career Team tips — community posting is coming soon.
        </p>
      </div>

      <nav className="rounded-2xl border border-slate-700/40 bg-slate-950/50 p-2">
        {SHORTCUTS.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="flex items-center justify-between px-3 py-2.5 text-xs text-slate-400 hover:text-violet-300 hover:bg-violet-500/5 rounded-lg transition"
          >
            <span className="flex items-center gap-2">
              <s.icon className="w-3.5 h-3.5" />
              {s.label}
            </span>
            {s.label === 'Saved' && savedCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25">
                {savedCount}
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div id="saved" className="rounded-2xl border border-slate-700/40 bg-slate-950/60 p-4">
        <h3 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
          <Bookmark className="w-3.5 h-3.5 text-amber-400" />
          Saved posts
          {savedCount > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/25 ml-auto">
              {savedCount}
            </span>
          )}
        </h3>
        {savedPosts.length === 0 ? (
          <p className="text-[11px] text-slate-600">Save posts to read later — tap Save on any update.</p>
        ) : (
          <ul className="space-y-2">
            {savedPosts.map((p) => (
              <li
                key={p.id}
                className="text-[11px] text-slate-400 line-clamp-2 rounded-lg border border-slate-800/50 bg-slate-900/30 px-2.5 py-2"
              >
                <span className="text-slate-500">{p.authorName}: </span>
                {p.text.slice(0, 80)}
                {p.text.length > 80 ? '…' : ''}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div id="circles" className="rounded-2xl border border-slate-700/40 bg-slate-950/60 p-4">
        <h3 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-cyan-400" />
          Circles
          <span className="ml-1 text-[9px] font-normal uppercase tracking-wider text-slate-500">
            Phase 2
          </span>
        </h3>
        <p className="text-[10px] text-slate-500 mb-3">
          Community groups are coming soon. For launch, JobAZ publishes verified career tips and
          opportunities.
        </p>
        <ul className="space-y-2">
          {PULSE_PHASE1_DISCOVERY_CIRCLES.map((g) => (
            <li
              key={g.id}
              className="flex items-start gap-2 rounded-lg border border-slate-800/60 bg-slate-900/40 px-2.5 py-2"
            >
              <span className="text-base leading-none mt-0.5">{g.icon}</span>
              <div className="min-w-0 flex-1">
                <p className="text-xs text-slate-200 font-medium">{g.name}</p>
                <p className="text-[10px] text-slate-500">{g.blurb}</p>
              </div>
              <span className="text-[9px] uppercase tracking-wider text-slate-500 shrink-0 border border-slate-700/60 rounded px-1.5 py-0.5">
                Coming soon
              </span>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  )
}
