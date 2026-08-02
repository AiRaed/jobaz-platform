'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  addComment,
  createFeedPost,
  joinGroup,
  mapCreatedPostForUi,
  toggleReaction,
  toggleSavePost,
} from '@/lib/feed/feedService'
import { getHubBySlug, getHubMembersPreview, getHubPosts } from '@/lib/feed/hubsService'
import { mapDbComment } from '@/lib/feed/mappers'
import type { HubDetail, HubMemberPreview } from '@/lib/feed/hubsService'
import type { FeedPost, FeedPostType, PostVisibility, ReactionType } from '@/lib/feed/types'
import { calculatePostScore } from '@/lib/feed/reactions/scoring'
import { EMPTY_REACTION_COUNTS, EMPTY_USER_REACTIONS } from '@/lib/feed/reactions/types'

export function useHub(slug: string) {
  const [loading, setLoading] = useState(true)
  const [hub, setHub] = useState<HubDetail | null>(null)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [members, setMembers] = useState<HubMemberPreview[]>([])
  const [error, setError] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [posting, setPosting] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const detail = await getHubBySlug(slug)
      if (!detail) {
        setHub(null)
        setPosts([])
        setMembers([])
        setError('Circle not found')
        return
      }
      setHub(detail)
      const [hubPosts, preview] = await Promise.all([
        getHubPosts(detail.id, detail.name, detail.slug),
        getHubMembersPreview(detail.id),
      ])
      setPosts(hubPosts)
      setMembers(preview)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load circle')
    } finally {
      setLoading(false)
    }
  }, [slug])

  useEffect(() => {
    void load()
  }, [load])

  const toggleJoin = useCallback(async (): Promise<boolean | null> => {
    if (!hub) return null
    setJoining(true)
    try {
      const result = await joinGroup(hub.id)
      setHub((prev) =>
        prev
          ? {
              ...prev,
              joined: result.joined,
              memberCount: result.joined
                ? prev.memberCount + 1
                : Math.max(0, prev.memberCount - 1),
            }
          : null
      )
      if (result.joined) {
        const preview = await getHubMembersPreview(hub.id)
        setMembers(preview)
      }
      return result.joined
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update membership')
      return null
    } finally {
      setJoining(false)
    }
  }, [hub])

  const createPost = useCallback(
    async (opts: {
      text: string
      visibility: PostVisibility
      postType: FeedPostType
      imageUrl?: string | null
    }) => {
      if (!hub?.joined) throw new Error('Join this circle to post')
      setPosting(true)
      try {
        const created = await createFeedPost({
          content: opts.text.trim(),
          postType: opts.postType,
          visibility: opts.visibility === 'anonymous' ? 'public' : opts.visibility,
          groupId: hub.id,
          imageUrl: opts.imageUrl ?? null,
        })
        const uiPost = await mapCreatedPostForUi(created, hub.name)
        setPosts((prev) => [
          {
            ...uiPost,
            groupId: hub.id,
            groupSlug: hub.slug,
            groupName: hub.name,
            reactionCounts: uiPost.reactionCounts ?? { ...EMPTY_REACTION_COUNTS },
            userReactions: uiPost.userReactions ?? { ...EMPTY_USER_REACTIONS },
          },
          ...prev,
        ])
        setHub((prev) => (prev ? { ...prev, postsToday: prev.postsToday + 1 } : null))
      } finally {
        setPosting(false)
      }
    },
    [hub]
  )

  const toggleReactionOnPost = useCallback(
    async (postId: string, reactionType: ReactionType) => {
      setPosts((prev) =>
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
        setPosts((prev) =>
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
        void load()
      }
    },
    [load]
  )

  const toggleSavePostLocal = useCallback(async (postId: string) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, saved: !p.saved } : p)))
    try {
      const result = await toggleSavePost(postId)
      setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, saved: result.saved } : p)))
    } catch {
      void load()
    }
  }, [load])

  const addCommentToPost = useCallback(async (postId: string, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const row = await addComment(postId, trimmed)
    const mapped = mapDbComment(row)
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, mapped] } : p))
    )
    setExpandedComments((prev) => new Set(prev).add(postId))
  }, [])

  const toggleCommentsExpanded = useCallback((postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }, [])

  return {
    loading,
    hub,
    posts,
    members,
    error,
    joining,
    posting,
    expandedComments,
    refresh: load,
    toggleJoin,
    createPost,
    toggleReaction: toggleReactionOnPost,
    toggleSave: toggleSavePostLocal,
    addComment: addCommentToPost,
    toggleCommentsExpanded,
  }
}
