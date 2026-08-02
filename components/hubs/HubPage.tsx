'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Loader2, Users } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import DashboardTabs from '@/components/dashboard/DashboardTabs'
import FeedPostCard from '@/components/feed/FeedPostCard'
import { useHub } from '@/hooks/useHub'
import { cn } from '@/lib/utils'
import type { CurrentUserFeedProfile } from '@/lib/feed/types'

type Props = {
  slug: string
  currentUser: CurrentUserFeedProfile
  isAuthenticated: boolean
  onRequireAuth: () => void
  onToast?: (message: string) => void
}

export default function HubPage({ slug, currentUser, isAuthenticated, onRequireAuth, onToast }: Props) {
  const router = useRouter()
  const hubState = useHub(slug)

  const handleJoin = async () => {
    if (!isAuthenticated) {
      onRequireAuth()
      return
    }
    const joined = await hubState.toggleJoin()
    if (joined === true) onToast?.('Joined circle')
    if (joined === false) onToast?.('Left circle')
  }

  if (hubState.loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
          Loading circle…
        </div>
      </AppShell>
    )
  }

  if (!hubState.hub) {
    return (
      <AppShell>
        <div className="max-w-lg mx-auto py-16 text-center">
          <p className="text-slate-300 font-medium mb-2">Circle not found</p>
          <p className="text-sm text-slate-500 mb-6">{hubState.error}</p>
          <Link href="/feed" className="text-violet-300 hover:underline text-sm">
            Back to Pulse
          </Link>
        </div>
      </AppShell>
    )
  }

  const hub = hubState.hub
  const coverStyle = hub.coverColor
    ? { background: `linear-gradient(135deg, ${hub.coverColor}40, rgb(15 23 42))` }
    : undefined

  return (
    <AppShell>
      <div className="max-w-3xl mx-auto pb-12">
        <Link
          href="/feed"
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-violet-300 mb-4 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Pulse
        </Link>

        <DashboardTabs />

        <header
          className="rounded-2xl border border-violet-500/25 bg-slate-950/80 overflow-hidden mb-6 shadow-[0_0_32px_rgba(139,92,246,0.12)]"
          style={coverStyle}
        >
          <div className="h-24 bg-gradient-to-r from-violet-950/60 via-slate-900/80 to-cyan-950/40 border-b border-slate-800/50" />
          <div className="px-5 pb-5 -mt-8">
            <div className="flex items-start gap-4">
              <span className="text-4xl w-16 h-16 flex items-center justify-center rounded-2xl bg-slate-900 border border-violet-500/30 shadow-lg">
                {hub.icon}
              </span>
              <div className="flex-1 min-w-0 pt-6">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-50">{hub.name}</h1>
                  {hub.isOfficial && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
                      Official
                    </span>
                  )}
                </div>
                <p className="text-xs text-violet-300/90 mt-0.5">{hub.category}</p>
                <p className="text-sm text-slate-400 mt-2 leading-relaxed">{hub.description}</p>
                <div className="flex flex-wrap items-center gap-3 mt-3 text-[11px] text-slate-500">
                  <span>{hub.memberCount.toLocaleString()} members</span>
                  <span>· {hub.postsToday} posts today</span>
                  <span className="text-emerald-400/80">· Active now</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => void handleJoin()}
                disabled={hubState.joining}
                className={cn(
                  'mt-8 shrink-0 px-4 py-2 text-xs font-semibold rounded-lg transition disabled:opacity-50',
                  hub.joined
                    ? 'text-emerald-300 border border-emerald-500/40 bg-emerald-500/10 hover:border-red-500/40 hover:text-red-300'
                    : 'text-white bg-gradient-to-r from-violet-600 to-cyan-600 shadow-[0_0_16px_rgba(139,92,246,0.3)] hover:opacity-90'
                )}
              >
                {hubState.joining ? '…' : hub.joined ? 'Joined' : 'Join Circle'}
              </button>
            </div>
          </div>
        </header>

        {hubState.members.length > 0 && (
          <section className="rounded-2xl border border-slate-700/40 bg-slate-950/60 p-4 mb-6">
            <h2 className="text-xs font-semibold text-slate-200 mb-3 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-400" />
              Members
            </h2>
            <ul className="flex flex-wrap gap-2">
              {hubState.members.map((m) => (
                <li key={m.userId}>
                  <Link
                    href={`/profile/${m.userId}`}
                    className="inline-flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-slate-800/60 bg-slate-900/40 hover:border-violet-500/30 transition text-xs text-slate-300"
                  >
                    {m.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={m.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <span className="w-6 h-6 rounded-full bg-violet-600/30 flex items-center justify-center text-[9px] font-bold">
                        {m.initials}
                      </span>
                    )}
                    {m.displayName}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mb-6 rounded-xl border border-emerald-500/25 bg-emerald-950/20 px-4 py-3 text-sm text-emerald-100/90">
          <p className="font-medium text-emerald-100">Community posting is coming soon.</p>
          <p className="text-xs text-emerald-200/70 mt-1">
            For launch, JobAZ publishes verified career tips and opportunities. Circles are discovery-only.
          </p>
        </div>

        <h2 className="text-sm font-semibold text-slate-200 mb-3">Circle feed</h2>
        {hubState.posts.length === 0 ? (
          <div className="rounded-2xl border border-slate-700/40 bg-slate-950/50 p-8 text-center text-slate-500 text-sm">
            No posts in this circle yet. Be the first to share on Pulse.
          </div>
        ) : (
          <div className="space-y-4">
            {hubState.posts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                expanded={hubState.expandedComments.has(post.id)}
                onToggleReaction={(type) => void hubState.toggleReaction(post.id, type)}
                onToggleSave={() => void hubState.toggleSave(post.id)}
                onToggleComments={() => hubState.toggleCommentsExpanded(post.id)}
                onAddComment={(text) => void hubState.addComment(post.id, text)}
                onPolishComment={(t) => t}
                onShowInterest={() => router.push('/feed')}
                onMessageAuthor={() => router.push('/messages')}
                onMessagePoster={() => router.push('/messages')}
                onRequireAuth={onRequireAuth}
              />
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
