'use client'

import Link from 'next/link'
import {
  Bookmark,
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Share2,
  Shield,
  Sparkles,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { personalProfilePath, businessProfilePath } from '@/lib/network/publicProfileUrls'
import ProfileConnectionButton from '@/components/network/ProfileConnectionButton'
import type { FeedPost } from '@/lib/feed/types'
import type { ReactionType } from '@/lib/feed/reactions/types'
import { totalReactions } from '@/lib/feed/reactions/types'
import PostReactions from '@/components/feed/PostReactions'
import FeedMediaPreview from '@/components/feed/FeedMediaPreview'
import { useState } from 'react'

type Props = {
  post: FeedPost
  expanded: boolean
  onToggleReaction: (type: ReactionType) => void
  onToggleSave: () => void
  onToggleComments: () => void
  onAddComment: (text: string) => void
  onPolishComment: (text: string) => string
  onShowInterest?: () => void
  onMessageAuthor?: () => void
  onMessagePoster?: () => void
  onRequireAuth?: () => void
  onAuthorConnect?: (post: FeedPost) => void
  showAuthorConnect?: boolean
  reactionsDisabled?: boolean
}

export default function FeedPostCard({
  post,
  expanded,
  onToggleReaction,
  onToggleSave,
  onToggleComments,
  onAddComment,
  onPolishComment,
  onShowInterest,
  onMessageAuthor,
  onMessagePoster,
  onRequireAuth,
  onAuthorConnect,
  showAuthorConnect,
  reactionsDisabled,
}: Props) {
  const [commentDraft, setCommentDraft] = useState('')
  const visibleComments = expanded ? post.comments : post.comments.slice(0, 2)
  const hiddenCount = Math.max(0, post.comments.length - 2)

  const submitComment = () => {
    if (!commentDraft.trim()) return
    onAddComment(commentDraft)
    setCommentDraft('')
  }

  const reactionTotal = totalReactions(post.reactionCounts)
  const tractionLabel =
    post.reactionCounts.boost >= 10
      ? 'High visibility'
      : post.reactionCounts.useful >= 8
        ? 'Valued by the community'
        : null

  const authorHref = post.isOfficial
    ? '/feed'
    : post.authorId
      ? post.authorProfileType === 'business'
        ? businessProfilePath(null, post.authorUsername ?? null, post.authorId)
        : personalProfilePath(post.authorUsername ?? null, post.authorId)
      : '/feed'

  const isBusinessAuthor = !post.isOfficial && post.authorProfileType === 'business'

  return (
    <article
      id={`pulse-post-${post.id}`}
      className="group rounded-2xl border border-slate-700/40 bg-slate-950/60 backdrop-blur-xl shadow-[0_0_24px_rgba(139,92,246,0.06)] overflow-hidden hover:border-violet-500/20 transition-colors"
    >
      <div className="p-4 md:p-5">
        <div className="flex items-start gap-3">
          {post.isOfficial ? (
            <div
              className={cn(
                'w-11 h-11 rounded-full bg-gradient-to-br border border-emerald-400/30 flex items-center justify-center text-sm font-bold text-white shrink-0',
                post.authorColor
              )}
              aria-hidden
            >
              {post.authorInitials}
            </div>
          ) : (
            <Link
              href={authorHref}
              className="shrink-0 rounded-full focus:outline-none focus:ring-2 focus:ring-violet-500/40"
            >
              {post.authorAvatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={post.authorAvatarUrl}
                  alt=""
                  className="w-11 h-11 rounded-full object-cover border border-violet-500/30"
                />
              ) : (
                <div
                  className={cn(
                    'w-11 h-11 rounded-full bg-gradient-to-br border border-white/10 flex items-center justify-center text-sm font-bold text-white',
                    post.authorColor
                  )}
                >
                  {post.authorInitials}
                </div>
              )}
            </Link>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              {post.isOfficial ? (
                <span className="text-sm font-semibold text-slate-100">JobAZ Career Team</span>
              ) : (
                <Link
                  href={authorHref}
                  className="text-sm font-semibold text-slate-100 hover:text-violet-300"
                >
                  {post.authorName}
                </Link>
              )}
              {post.isOfficial && (
                <span className="inline-flex items-center gap-0.5 text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">
                  <Shield className="w-2.5 h-2.5" />
                  Official
                </span>
              )}
              {!post.isOfficial && post.authorBadge && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-300 border border-violet-500/25">
                  {post.authorBadge}
                </span>
              )}
              {post.visibility === 'anonymous' && (
                <span className="text-[9px] text-slate-600">· Anonymous</span>
              )}
              <span className="text-[10px] text-slate-500">{post.timeAgo}</span>
            </div>
            {!post.isOfficial && post.groupName && (
              <p className="text-[11px] mt-0.5 font-medium">
                {post.groupSlug ? (
                  <Link href={`/hubs/${post.groupSlug}`} className="text-cyan-400/90 hover:text-cyan-300">
                    Circle · {post.groupName}
                  </Link>
                ) : (
                  <span className="text-cyan-400/90">Circle · {post.groupName}</span>
                )}
              </p>
            )}
            {!post.isOfficial && post.authorHeadline && (
              <p className="text-[10px] text-slate-500 mt-0.5">{post.authorHeadline}</p>
            )}
            {post.opportunity ? (
              <div className="mt-3 rounded-xl border border-cyan-500/25 bg-cyan-950/20 p-4">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-cyan-300">Opportunity</span>
                <h3 className="text-sm font-bold text-slate-100 mt-1">{post.opportunity.title}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  {post.opportunity.type.replace(/_/g, ' ')} · {post.opportunity.location}
                </p>
                <p className="text-sm text-slate-300 mt-2 line-clamp-4">{post.opportunity.details}</p>
                {post.opportunity.pay && (
                  <p className="text-xs text-emerald-300/90 mt-1">{post.opportunity.pay}</p>
                )}
                <p className="text-[10px] text-slate-500 mt-2">
                  {post.opportunity.interestCount} interested
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-300 mt-2 leading-relaxed whitespace-pre-wrap">{post.text}</p>
            )}
            {post.media && <FeedMediaPreview media={post.media} />}
          </div>
        </div>

        {(reactionTotal > 0 || post.comments.length > 0) && (
          <div className="flex items-center justify-between mt-3 text-[10px] text-slate-500">
            <span className="flex items-center gap-1.5">
              {reactionTotal > 0 && (
                <span>
                  {reactionTotal} professional {reactionTotal === 1 ? 'reaction' : 'reactions'}
                </span>
              )}
              {tractionLabel && reactionTotal > 0 && (
                <span className="text-violet-400/70 hidden sm:inline">· {tractionLabel}</span>
              )}
            </span>
            {post.comments.length > 0 && (
              <button type="button" onClick={onToggleComments} className="hover:text-slate-300">
                {post.comments.length} {post.comments.length === 1 ? 'comment' : 'comments'}
              </button>
            )}
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-slate-800/60 space-y-2">
          <PostReactions
            counts={post.reactionCounts}
            userReactions={post.userReactions}
            onToggle={(type) => onToggleReaction(type)}
            disabled={reactionsDisabled}
          />
          <div className="flex flex-wrap items-center gap-1">
            <ActionBtn
              onClick={onToggleComments}
              icon={MessageCircle}
              label={post.comments.length > 0 ? String(post.comments.length) : 'Comment'}
            />
            <ActionBtn
              active={post.saved}
              onClick={onToggleSave}
              icon={Bookmark}
              label={post.saved ? 'Saved' : 'Save'}
              activeClass="text-amber-400"
            />
            <ActionBtn icon={Share2} label="Share" onClick={() => {}} />
            {showAuthorConnect && onAuthorConnect && post.authorId && !post.isOfficial && (
              <ProfileConnectionButton
                profileType={isBusinessAuthor ? 'business' : 'personal'}
                connectionStatus="none"
                following={post.isFriend}
                compact
                onClick={() => onAuthorConnect(post)}
              />
            )}
            {post.opportunity && (
              <>
                <button
                  type="button"
                  onClick={() => (onShowInterest ? onShowInterest() : onRequireAuth?.())}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition',
                    post.opportunity?.userInterested
                      ? 'border-cyan-500/40 text-cyan-300 bg-cyan-500/10'
                      : 'border-cyan-500/30 text-cyan-200 hover:bg-cyan-500/10'
                  )}
                >
                  {post.opportunity?.userInterested ? 'Interested' : 'Show interest'}
                </button>
                <button
                  type="button"
                  onClick={() => (onMessagePoster ? onMessagePoster() : onRequireAuth?.())}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-violet-500/30 text-violet-200 hover:bg-violet-500/10 transition cursor-pointer"
                >
                  Message JobAZ
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {(expanded || post.comments.length > 0) && (
        <div className="px-4 md:px-5 pb-4 border-t border-slate-800/40 bg-slate-900/30">
          {visibleComments.map((c) => (
            <div key={c.id} className="py-3 border-b border-slate-800/30 last:border-0">
              <div>
                <span className="text-xs font-medium text-slate-200">{c.authorName}</span>
                <span className="text-[10px] text-slate-500 ml-2">{c.timeAgo}</span>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">{c.text}</p>
              </div>
            </div>
          ))}

          {!expanded && hiddenCount > 0 && (
            <button
              type="button"
              onClick={onToggleComments}
              className="text-[11px] text-violet-300 hover:text-violet-200 mt-2 flex items-center gap-1"
            >
              <ChevronDown className="w-3.5 h-3.5" />
              View {hiddenCount} more {hiddenCount === 1 ? 'reply' : 'replies'}
            </button>
          )}
          {expanded && post.comments.length > 2 && (
            <button
              type="button"
              onClick={onToggleComments}
              className="text-[11px] text-slate-500 hover:text-slate-300 mt-2 flex items-center gap-1"
            >
              <ChevronUp className="w-3.5 h-3.5" />
              Show less
            </button>
          )}

          <div className="flex gap-2 mt-3">
            <input
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitComment()}
              placeholder="Write a supportive reply..."
              className="flex-1 text-xs px-3 py-2 rounded-lg bg-slate-900/60 border border-slate-700/50 text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
            <button
              type="button"
              onClick={() => setCommentDraft(onPolishComment(commentDraft))}
              title="AI polite rewrite"
              className="px-2 py-2 rounded-lg border border-violet-500/30 text-violet-300 hover:bg-violet-500/10"
            >
              <Sparkles className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={submitComment}
              className="px-3 py-2 text-xs font-medium rounded-lg bg-violet-600/80 text-white hover:bg-violet-500"
            >
              Reply
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

function ActionBtn({
  icon: Icon,
  label,
  onClick,
  active,
  activeClass,
}: {
  icon: typeof MessageCircle
  label: string
  onClick?: () => void
  active?: boolean
  activeClass?: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 transition',
        active && activeClass
      )}
    >
      <Icon className={cn('w-3.5 h-3.5', active && 'fill-current')} />
      {label}
    </button>
  )
}
