'use client'

import { useCallback, useMemo, useState } from 'react'
import {
  AI_GROUP_SUGGESTIONS,
  COMMUNITY_STATS,
  COMPOSER_GROUPS,
  CURRENT_USER,
  SAMPLE_GROUPS,
  SAMPLE_POSTS,
  SUGGESTED_FRIENDS,
} from '@/lib/feed/sampleData'
import type {
  FeedFilter,
  FeedGroup,
  FeedPost,
  PostCategory,
  PostVisibility,
  ReactionType,
  SuggestedFriend,
} from '@/lib/feed/types'
import { matchesFeedFilter } from '@/lib/feed/mappers'
import { calculatePostScore } from '@/lib/feed/reactions/scoring'
import { EMPTY_REACTION_COUNTS, EMPTY_USER_REACTIONS } from '@/lib/feed/reactions/types'

function newId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}

function matchesFilter(post: FeedPost, filter: FeedFilter, joinedGroupIds: Set<string>): boolean {
  return matchesFeedFilter(post, filter, joinedGroupIds)
}

export function useFeedPrototype() {
  const [posts, setPosts] = useState<FeedPost[]>(SAMPLE_POSTS)
  const [groups, setGroups] = useState<FeedGroup[]>(SAMPLE_GROUPS)
  const [friends, setFriends] = useState<SuggestedFriend[]>(SUGGESTED_FRIENDS)
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())

  const joinedGroupIds = useMemo(
    () => new Set(groups.filter((g) => g.joined).map((g) => g.id)),
    [groups]
  )

  const joinedGroups = useMemo(() => groups.filter((g) => g.joined), [groups])
  const savedCount = useMemo(() => posts.filter((p) => p.saved).length, [posts])
  const savedPosts = useMemo(() => posts.filter((p) => p.saved).slice(0, 5), [posts])

  const filteredPosts = useMemo(
    () => posts.filter((p) => matchesFilter(p, filter, joinedGroupIds)),
    [posts, filter, joinedGroupIds]
  )

  const toggleReaction = useCallback((postId: string, reactionType: ReactionType) => {
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
  }, [])

  const toggleSave = useCallback((postId: string) => {
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, saved: !p.saved } : p)))
  }, [])

  const addComment = useCallback((postId: string, text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              comments: [
                ...p.comments,
                {
                  id: newId('comment'),
                  authorName: CURRENT_USER.name,
                  text: trimmed,
                  timeAgo: 'Just now',
                },
              ],
            }
          : p
      )
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

  const createPost = useCallback(
    (opts: {
      text: string
      visibility: PostVisibility
      group: string
      category?: PostCategory
      media?: FeedPost['media']
    }) => {
      const trimmed = opts.text.trim()
      if (!trimmed && !opts.media) return
      const post: FeedPost = {
        id: newId('post'),
        authorName: opts.visibility === 'anonymous' ? 'Anonymous' : CURRENT_USER.name,
        authorInitials: opts.visibility === 'anonymous' ? '?' : CURRENT_USER.initials,
        authorBadge: CURRENT_USER.careerPath,
        authorColor: 'from-violet-600/50 to-cyan-500/30',
        groupName: opts.group === 'Public Pulse' ? undefined : opts.group,
        text: trimmed || '(Shared a career moment)',
        timeAgo: 'Just now',
        category: opts.category ?? 'question',
        isFriend: false,
        isFromMyGroup: opts.group !== 'Public Pulse',
        visibility: opts.visibility,
        media: opts.media,
        reactionCounts: { ...EMPTY_REACTION_COUNTS },
        userReactions: { ...EMPTY_USER_REACTIONS },
        saved: false,
        comments: [],
      }
      setPosts((prev) => [post, ...prev])
    },
    []
  )

  const joinGroup = useCallback((groupId: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, joined: true, memberCount: g.memberCount + 1 } : g))
    )
  }, [])

  const addGroup = useCallback((group: Omit<FeedGroup, 'id' | 'joined' | 'memberCount'>) => {
    setGroups((prev) => [
      {
        ...group,
        id: newId('group'),
        joined: true,
        memberCount: 1,
      },
      ...prev,
    ])
  }, [])

  const sendFriendRequest = useCallback((friendId: string) => {
    setFriends((prev) =>
      prev.map((f) => (f.id === friendId ? { ...f, requestSent: true } : f))
    )
  }, [])

  const improvePostWithAi = (text: string): string => {
    if (!text.trim()) return text
    return `${text.trim()}\n\n(I'm looking for supportive, practical advice from people on a similar path in the UK.)`
  }

  const polishComment = (text: string): string => {
    if (!text.trim()) return text
    const t = text.trim()
    if (t.endsWith('.')) return t
    return `${t.charAt(0).toUpperCase()}${t.slice(1)}.`
  }

  return {
    posts: filteredPosts,
    allPosts: posts,
    groups,
    joinedGroups,
    savedCount,
    savedPosts,
    friends,
    filter,
    setFilter,
    expandedComments,
    toggleReaction,
    toggleSave,
    addComment,
    toggleCommentsExpanded,
    createPost,
    joinGroup,
    addGroup,
    sendFriendRequest,
    improvePostWithAi,
    polishComment,
    aiSuggestions: AI_GROUP_SUGGESTIONS,
    composerGroups: COMPOSER_GROUPS,
    currentUser: CURRENT_USER,
    communityStats: COMMUNITY_STATS,
  }
}
