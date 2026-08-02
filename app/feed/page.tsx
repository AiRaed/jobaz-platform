'use client'

import { Suspense, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Loader2, RefreshCw, X } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import {
  PlatformContent,
  PlatformPageHeader,
  PlatformShell,
} from '@/components/dashboard/platform'
import { useFeed } from '@/hooks/useFeed'
import FeedPostCard from '@/components/feed/FeedPostCard'
import FeedFilters from '@/components/feed/FeedFilters'
import PulseSearchBar from '@/components/network/PulseSearchBar'
import CareerAuthWallModal from '@/components/home/CareerAuthWallModal'
import { cn } from '@/lib/utils'

export default function PulsePage() {
  return (
    <Suspense
      fallback={
        <AppShell wide platform>
          <div className="flex items-center justify-center py-24 text-slate-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
            Loading Pulse…
          </div>
        </AppShell>
      }
    >
      <PulsePageContent />
    </Suspense>
  )
}

function PulsePageContent() {
  const searchParams = useSearchParams()
  const authorId = searchParams.get('author')
  const focusPostId = searchParams.get('post')
  const feed = useFeed(authorId)

  useEffect(() => {
    if (!focusPostId || feed.loading || feed.posts.length === 0) return
    const el = document.getElementById(`pulse-post-${focusPostId}`)
    if (!el) return
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('ring-2', 'ring-emerald-500/40')
      window.setTimeout(() => el.classList.remove('ring-2', 'ring-emerald-500/40'), 2200)
    }, 200)
    return () => window.clearTimeout(t)
  }, [focusPostId, feed.loading, feed.posts.length])

  return (
    <AppShell wide platform>
      <PlatformShell
        pageHeader={
          <PlatformPageHeader
            title="Career Tips / Pulse"
            dotColor="emerald"
            description="Official JobAZ feed — verified career tips and opportunities."
            badges={
              <>
                <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-500/40 bg-emerald-500/10 text-emerald-300">
                  Official JobAZ feed
                </span>
                {feed.tableMissing && (
                  <span className="text-[10px] px-2 py-1 rounded-full border border-red-500/40 bg-red-950/40 text-red-300">
                    Database not connected
                  </span>
                )}
              </>
            }
            meta={
              <>
                <PulseSearchBar />
                <div className="mt-3 flex flex-wrap items-center gap-2.5 text-[11px]">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-violet-500/25 bg-violet-950/30 text-violet-300">
                    {feed.allPosts.length} published posts
                  </span>
                  <button
                    type="button"
                    onClick={() => feed.refresh()}
                    disabled={feed.refreshing}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-700/50 bg-slate-900/50 text-slate-400 hover:text-violet-300 transition disabled:opacity-50"
                  >
                    <RefreshCw className={cn('w-3 h-3', feed.refreshing && 'animate-spin')} />
                    Refresh
                  </button>
                </div>
              </>
            }
          />
        }
      >
        <PlatformContent withAmbient>
          <div className="w-full max-w-6xl xl:max-w-7xl mx-auto">
            {authorId && (
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-violet-500/30 bg-violet-950/20 px-4 py-3">
                <p className="text-sm text-violet-200">Showing posts from this member</p>
                <Link
                  href="/feed"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-400 hover:text-slate-200 transition cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                  Clear filter
                </Link>
              </div>
            )}

            {feed.error && (
              <div
                className={cn(
                  'mb-4 rounded-xl px-4 py-3 text-sm',
                  feed.tableMissing
                    ? 'border border-amber-500/40 bg-amber-950/30 text-amber-100'
                    : 'border border-red-500/30 bg-red-950/30 text-red-300'
                )}
              >
                <p className="font-medium mb-1">
                  {feed.tableMissing ? 'Pulse database setup required' : 'Something went wrong'}
                </p>
                <p className="text-xs leading-relaxed opacity-90">{feed.error}</p>
              </div>
            )}

            <p className="mb-3 text-[11px] text-slate-500 dark:text-slate-400 leading-snug px-0.5">
              Phase 1: JobAZ publishes verified career tips and opportunities. Community posting
              opens later.
            </p>

            <div className="space-y-4">
              <FeedFilters active={feed.filter} onChange={feed.setFilter} />

              <p className="text-[11px] text-slate-500 px-0.5">
                Showing {feed.posts.length} post{feed.posts.length !== 1 ? 's' : ''}
                {authorId ? ' · member filter' : ''}
                {feed.filter !== 'all' ? ' · category filter' : ''}
              </p>

              {feed.loading ? (
                <div className="flex items-center justify-center py-16 text-slate-400 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
                  Loading Pulse…
                </div>
              ) : feed.posts.length === 0 ? (
                <div className="rounded-2xl border border-slate-700/40 bg-slate-950/50 p-8 text-center">
                  <p className="text-slate-300 font-medium mb-1">
                    {authorId
                      ? 'No posts from this member yet'
                      : 'No published posts yet'}
                  </p>
                  <p className="text-sm text-slate-500">
                    {authorId
                      ? 'Check back later for updates from this member.'
                      : 'New career tips and opportunities from the JobAZ Career Team will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {feed.posts.map((post) => (
                    <FeedPostCard
                      key={post.id}
                      post={post}
                      expanded={feed.expandedComments.has(post.id)}
                      onToggleReaction={(type) => feed.toggleReaction(post.id, type)}
                      onToggleSave={() => feed.toggleSave(post.id)}
                      onToggleComments={() => feed.toggleCommentsExpanded(post.id)}
                      onAddComment={(text) => feed.addComment(post.id, text)}
                      onPolishComment={feed.polishComment}
                      onShowInterest={() => feed.showOpportunityInterest(post.id)}
                      onMessageAuthor={() => feed.messageFromPost(post, false)}
                      onMessagePoster={() => feed.messageFromPost(post, true)}
                      onRequireAuth={() => feed.setAuthModalOpen(true)}
                      showAuthorConnect={Boolean(feed.isAuthenticated)}
                      onAuthorConnect={feed.connectFromPost}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </PlatformContent>
      </PlatformShell>

      <CareerAuthWallModal
        isOpen={feed.authModalOpen}
        onClose={() => feed.setAuthModalOpen(false)}
        redirectTo="/feed"
        title="Sign in to join Pulse"
        description="Create a free account to react, save updates, and comment on JobAZ Career Team posts."
        bullets={[
          'Boost, Support, and mark posts Useful',
          'Save career tips to read later',
          'Comment on published Pulse posts',
        ]}
      />
    </AppShell>
  )
}
