'use client'

import Link from 'next/link'
import { Bookmark, Shield } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FeedPost, FeedPostType } from '@/lib/feed/types'
import type { ReactionType } from '@/lib/feed/reactions/types'
import { FEED_POST_TYPE_OPTIONS } from '@/lib/feed/dbTypes'
import PostReactions from '@/components/feed/PostReactions'
import FeedMediaPreview from '@/components/feed/FeedMediaPreview'

type Props = {
  post: FeedPost
  readHref: string
  onToggleReaction: (type: ReactionType) => void
  onToggleSave: () => void
}

function postTypeLabel(postType?: FeedPostType, category?: string): string {
  if (postType) {
    const found = FEED_POST_TYPE_OPTIONS.find((o) => o.value === postType)
    if (found) return found.label
    if (postType === 'career_advice') return 'Career Tip'
    return postType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  }
  if (category === 'job-tip') return 'Job Search Tip'
  if (category === 'opportunity') return 'Opportunity'
  return 'Career Tip'
}

/** Split mapped `title\n\nbody` from feed mappers when present. */
function splitTitleBody(text: string): { title: string | null; body: string } {
  const trimmed = text.trim()
  if (!trimmed) return { title: null, body: '' }
  const parts = trimmed.split(/\n\n+/)
  if (parts.length >= 2 && parts[0].length <= 120 && !parts[0].includes('\n')) {
    return { title: parts[0].trim(), body: parts.slice(1).join('\n\n').trim() }
  }
  return { title: null, body: trimmed }
}

export default function LandingPulsePostCard({
  post,
  readHref,
  onToggleReaction,
  onToggleSave,
}: Props) {
  const { title, body } = splitTitleBody(post.text || '')
  const typeLabel = postTypeLabel(post.postType, post.category)
  const authorName =
    post.isOfficial || post.isModerator ? 'JobAZ Career Team' : post.authorName
  const previewBody = body.length > 280 ? `${body.slice(0, 280).trim()}…` : body

  return (
    <article
      className={cn(
        'rounded-2xl border overflow-hidden transition-colors',
        'border-[var(--jaz-border)] bg-[var(--jaz-surface)]',
        'dark:border-slate-700/40 dark:bg-slate-950/60 dark:backdrop-blur-xl',
        'dark:shadow-[0_0_24px_rgba(139,92,246,0.06)]',
        'hover:border-violet-300/50 dark:hover:border-violet-500/25'
      )}
    >
      <div className="p-4 md:p-5">
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'w-10 h-10 rounded-full bg-gradient-to-br border flex items-center justify-center text-xs font-bold text-white shrink-0',
              post.isOfficial || post.isModerator
                ? 'from-emerald-600 to-cyan-600 border-emerald-400/30'
                : cn(post.authorColor, 'border-white/10')
            )}
            aria-hidden
          >
            {post.isOfficial || post.isModerator ? 'JZ' : post.authorInitials}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-[var(--jaz-text)] dark:text-slate-100">
                {authorName}
              </span>
              {(post.isOfficial || post.isModerator) && (
                <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-700 border border-violet-500/25 dark:text-violet-300">
                  <Shield className="w-2.5 h-2.5" aria-hidden />
                  Official
                </span>
              )}
              <span className="text-[10px] px-2 py-0.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300">
                {typeLabel}
              </span>
              {post.timeAgo && (
                <span className="text-[10px] text-[var(--jaz-muted)] dark:text-slate-500">
                  {post.timeAgo}
                </span>
              )}
            </div>

            {title && (
              <h3 className="text-sm font-bold text-[var(--jaz-text)] dark:text-slate-50 mt-2 leading-snug">
                {title}
              </h3>
            )}

            {post.opportunity ? (
              <div className="mt-2 rounded-xl border border-cyan-500/25 bg-cyan-50/80 dark:bg-cyan-950/20 p-3">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-cyan-700 dark:text-cyan-300">
                  Opportunity
                </span>
                <p className="text-sm font-semibold text-[var(--jaz-text)] dark:text-slate-100 mt-0.5">
                  {post.opportunity.title}
                </p>
                <p className="text-xs text-[var(--jaz-muted)] dark:text-slate-400 mt-1 line-clamp-3">
                  {post.opportunity.details}
                </p>
              </div>
            ) : (
              previewBody && (
                <p className="text-sm text-[var(--jaz-muted)] dark:text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap line-clamp-5">
                  {previewBody}
                </p>
              )
            )}

            {post.media && <FeedMediaPreview media={post.media} />}
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-[var(--jaz-border)] dark:border-slate-800/60 space-y-2">
          <PostReactions
            counts={post.reactionCounts}
            userReactions={post.userReactions}
            onToggle={onToggleReaction}
            compact
          />
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onToggleSave}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-medium transition',
                post.saved
                  ? 'border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300'
                  : 'border-[var(--jaz-border)] text-[var(--jaz-muted)] hover:text-[var(--jaz-text)] dark:border-slate-700/50 dark:text-slate-400 dark:hover:text-slate-200'
              )}
            >
              <Bookmark className="w-3.5 h-3.5" aria-hidden />
              {post.saved ? 'Saved' : 'Save'}
            </button>
            <Link
              href={readHref}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-500/35 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 hover:bg-emerald-500/15 dark:text-emerald-200"
            >
              Read on Pulse
            </Link>
          </div>
        </div>
      </div>
    </article>
  )
}
