'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, Radio } from 'lucide-react'
import CareerAuthWallModal from '@/components/home/CareerAuthWallModal'
import LandingPulsePostCard from './LandingPulsePostCard'
import { buildAuthLoginUrl } from '@/lib/auth/redirect'
import { getFeedPosts, toggleReaction, toggleSavePost } from '@/lib/feed/feedService'
import { calculatePostScore } from '@/lib/feed/reactions/scoring'
import type { ReactionType } from '@/lib/feed/reactions/types'
import type { FeedPost } from '@/lib/feed/types'
import { supabase } from '@/lib/supabase'

const PREVIEW_LIMIT = 3

export default function FeaturedPulseRow() {
  const [items, setItems] = useState<FeedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [authOpen, setAuthOpen] = useState(false)
  const [authModalTitle, setAuthModalTitle] = useState('Sign in to open Pulse')
  const [authed, setAuthed] = useState(false)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!cancelled) setAuthed(Boolean(session?.user))
    })()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(Boolean(session?.user))
    })
    return () => {
      cancelled = true
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void (async () => {
      try {
        const result = await getFeedPosts('all')
        if (!cancelled) setItems((result.posts ?? []).slice(0, PREVIEW_LIMIT))
      } catch {
        if (!cancelled) setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const openPulseHref = authed ? '/feed' : buildAuthLoginUrl('/feed')

  const requireAuth = useCallback(
    (fn: () => void | Promise<void>, title = 'Sign in to join Pulse') => {
      if (!authed) {
        setAuthModalTitle(title)
        setAuthOpen(true)
        return
      }
      void fn()
    },
    [authed]
  )

  const onToggleReaction = useCallback(
    (postId: string, reactionType: ReactionType) => {
      requireAuth(async () => {
        setItems((prev) =>
          prev.map((p) => {
            if (p.id !== postId) return p
            const active = p.userReactions[reactionType]
            const reactionCounts = { ...p.reactionCounts }
            reactionCounts[reactionType] = Math.max(0, reactionCounts[reactionType] + (active ? -1 : 1))
            const userReactions = { ...p.userReactions, [reactionType]: !active }
            return {
              ...p,
              reactionCounts,
              userReactions,
              engagementScore: calculatePostScore(reactionCounts),
            }
          })
        )
        try {
          const result = await toggleReaction(postId, reactionType)
          setItems((prev) =>
            prev.map((p) =>
              p.id === postId
                ? {
                    ...p,
                    reactionCounts: result.counts,
                    userReactions: result.user,
                    engagementScore: calculatePostScore(result.counts),
                  }
                : p
            )
          )
        } catch {
          // ignore — UI already optimistic; full feed can refresh
        }
      }, 'Sign in to react on Pulse')
    },
    [requireAuth]
  )

  const onToggleSave = useCallback(
    (postId: string) => {
      requireAuth(async () => {
        setItems((prev) => prev.map((p) => (p.id === postId ? { ...p, saved: !p.saved } : p)))
        try {
          const result = await toggleSavePost(postId)
          setItems((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, saved: result.saved } : p))
          )
        } catch {
          setItems((prev) => prev.map((p) => (p.id === postId ? { ...p, saved: !p.saved } : p)))
        }
      }, 'Sign in to save Pulse posts')
    },
    [requireAuth]
  )

  return (
    <section className="w-full max-w-none min-w-0 box-border">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h2 className="text-sm font-semibold text-[var(--text-primary)]">Pulse</h2>
        <Link href={openPulseHref} className="jobaz-btn-primary jobaz-btn-primary-sm shrink-0">
          Open Pulse
        </Link>
      </div>

      <div className="w-full max-w-[980px] mx-auto space-y-4 px-0 sm:px-1">
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-50/80 dark:bg-emerald-950/20 px-4 py-3 text-xs text-emerald-900 dark:text-emerald-100/90">
          <p className="font-medium">
            Phase 1: JobAZ publishes verified career tips and opportunities. Community posting opens
            later.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-[var(--jaz-muted)] dark:text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin text-emerald-500" aria-hidden />
            Loading Pulse…
          </div>
        ) : items.length === 0 ? (
          <div className="jobaz-card rounded-2xl border border-[var(--jaz-border)] bg-[var(--jaz-surface)] px-5 py-10 text-center dark:border-slate-700/60 dark:bg-slate-950/40">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] dark:border-emerald-500/30 dark:bg-emerald-950/30">
              <Radio className="h-4 w-4 text-emerald-600 dark:text-emerald-300" aria-hidden />
            </div>
            <p className="text-sm font-semibold text-[var(--jaz-text)] dark:text-slate-50 mb-4 max-w-md mx-auto">
              Career tips and opportunity updates are coming soon.
            </p>
            <Link href={openPulseHref} className="jobaz-btn-primary jobaz-btn-primary-sm inline-flex">
              Open Pulse
            </Link>
          </div>
        ) : (
          <>
            {items.map((post) => (
              <LandingPulsePostCard
                key={post.id}
                post={post}
                readHref={
                  authed
                    ? `/feed?post=${encodeURIComponent(post.id)}`
                    : buildAuthLoginUrl(`/feed?post=${encodeURIComponent(post.id)}`)
                }
                onToggleReaction={(type) => onToggleReaction(post.id, type)}
                onToggleSave={() => onToggleSave(post.id)}
              />
            ))}
            <div className="pt-1">
              <Link
                href={openPulseHref}
                className="inline-flex text-xs font-semibold text-emerald-700 hover:underline dark:text-emerald-300"
              >
                See all on Pulse →
              </Link>
            </div>
          </>
        )}
      </div>

      <CareerAuthWallModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        redirectTo="/feed"
        title={authModalTitle}
        description="Create a free account to open Pulse, react, and save JobAZ Career Team posts."
        bullets={['Open the full Pulse feed', 'Boost career tips', 'Save posts to read later']}
      />
    </section>
  )
}
