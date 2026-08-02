'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import {
  addComment,
  bootstrapFeedIfEmpty,
  createFeedPost,
  createGroup,
  createOpportunityPost,
  ensureFeedProfile,
  getCommunityStats,
  getFeedPosts,
  getSavedPostsForSidebar,
  improvePostWithAi,
  joinGroup,
  mapCreatedPostForUi,
  mapProfileToCurrentUser,
  toggleReaction,
  toggleOpportunityInterest,
  toggleSavePost,
  uploadPulseMedia,
} from '@/lib/feed/feedService'
import { togglePersonalConnection } from '@/lib/network/connectionsService'
import { fetchSuggestedConnections } from '@/lib/network/suggestedConnections'
import { avatarColorForId, initialsFromName } from '@/lib/feed/mappers'
import { FEED_MIGRATION_INSTRUCTIONS } from '@/lib/feed/errors'
import {
  guestProfilePreview,
  mapDbComment,
  matchesFeedFilter,
} from '@/lib/feed/mappers'
import { AI_GROUP_SUGGESTIONS } from '@/lib/feed/sampleData'
import type { FeedPostType } from '@/lib/feed/dbTypes'
import type {
  CreateOpportunityPayload,
  CurrentUserFeedProfile,
  FeedFilter,
  ComposerHubOption,
  FeedGroup,
  FeedPost,
  PostVisibility,
  ReactionType,
  SuggestedFriend,
} from '@/lib/feed/types'
import { calculatePostScore } from '@/lib/feed/reactions/scoring'

export function useFeed(authorFilterId?: string | null) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [posts, setPosts] = useState<FeedPost[]>([])
  const [groups, setGroups] = useState<FeedGroup[]>([])
  const [friends, setFriends] = useState<SuggestedFriend[]>([])
  const [savedPosts, setSavedPosts] = useState<FeedPost[]>([])
  const [savedCount, setSavedCount] = useState(0)
  const [currentUser, setCurrentUser] = useState<CurrentUserFeedProfile>(guestProfilePreview())
  const [filter, setFilter] = useState<FeedFilter>('all')
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tableMissing, setTableMissing] = useState(false)
  const [communityStats, setCommunityStats] = useState({
    activeToday: 0,
    postsToday: 0,
    newMembers: 0,
    successStoriesWeek: 0,
  })

  const loadFeed = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError(null)

    try {
      let result = await getFeedPosts(filter)

      if (result.tableMissing) {
        setTableMissing(true)
        setPosts([])
        setGroups([])
        setError(FEED_MIGRATION_INSTRUCTIONS)
        return
      }

      setTableMissing(false)

      if (result.posts.length === 0) {
        await bootstrapFeedIfEmpty()
        result = await getFeedPosts(filter)
      }

      const [stats, connections, sidebarSaved] = await Promise.all([
        getCommunityStats(),
        fetchSuggestedConnections(6),
        isAuthenticated ? getSavedPostsForSidebar() : Promise.resolve([]),
      ])

      setPosts(result.posts)
      setGroups(result.groups)
      setFriends(
        connections.map((s) => ({
          id: s.userId,
          profileId: s.profileId,
          name: s.name,
          careerPath: s.role,
          headline: s.headline,
          avatarUrl: s.avatarUrl,
          mutualGroup: s.mutualGroups,
          initials: initialsFromName(s.name),
          color: avatarColorForId(s.userId),
          profileType: s.profileType,
          connectionStatus: s.connectionStatus,
          username: s.username,
          businessSlug: s.businessSlug,
          requestSent: s.connectionStatus === 'pending_out' || s.connectionStatus === 'connected',
          isFollowing: s.connectionStatus === 'connected',
        }))
      )
      setCommunityStats(stats)
      setSavedPosts(sidebarSaved)
      setSavedCount(sidebarSaved.length)

      if (result.error) setError(result.error)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load Pulse')
      setPosts([])
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [filter, isAuthenticated])

  useEffect(() => {
    void loadFeed()
  }, [loadFeed])

  useEffect(() => {
    let mounted = true

    const initAuth = async () => {
      const { data } = await supabase.auth.getUser()
      const authed = Boolean(data.user)
      if (!mounted) return
      setIsAuthenticated(authed)

      if (authed && data.user) {
        const profile = await ensureFeedProfile()
        if (profile && mounted) setCurrentUser(mapProfileToCurrentUser(profile))
      } else if (mounted) {
        setCurrentUser(guestProfilePreview())
      }
    }

    void initAuth()

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const authed = Boolean(session?.user)
      setIsAuthenticated(authed)
      if (authed && session?.user) {
        const profile = await ensureFeedProfile()
        if (profile) setCurrentUser(mapProfileToCurrentUser(profile))
      } else {
        setCurrentUser(guestProfilePreview())
      }
      void loadFeed(true)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [loadFeed])

  const requireAuth = useCallback(
    (action: () => void | Promise<void>) => {
      if (!isAuthenticated) {
        setAuthModalOpen(true)
        return
      }
      void action()
    },
    [isAuthenticated]
  )

  const joinedGroupIds = useMemo(
    () => new Set(groups.filter((g) => g.joined).map((g) => g.id)),
    [groups]
  )

  const joinedGroups = useMemo(() => groups.filter((g) => g.joined), [groups])

  const filteredPosts = useMemo(() => {
    let list = posts.filter((p) => matchesFeedFilter(p, filter, joinedGroupIds))
    if (authorFilterId) {
      list = list.filter((p) => p.authorId === authorFilterId)
    }
    return list
  }, [posts, filter, joinedGroupIds, authorFilterId])

  const composerHubs = useMemo((): ComposerHubOption[] => {
    return [
      { id: null, name: 'Public Pulse' },
      ...joinedGroups.map((g) => ({ id: g.id, name: g.name })),
    ]
  }, [joinedGroups])

  const refreshSavedSidebar = useCallback(async () => {
    if (!isAuthenticated) {
      setSavedPosts([])
      setSavedCount(0)
      return
    }
    const saved = await getSavedPostsForSidebar()
    setSavedPosts(saved)
    setSavedCount(saved.length)
  }, [isAuthenticated])

  const toggleReactionOnPost = useCallback(
    (postId: string, reactionType: ReactionType) => {
      requireAuth(async () => {
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
          void loadFeed(true)
        }
      })
    },
    [requireAuth, loadFeed]
  )

  const toggleSavePostLocal = useCallback(
    (postId: string) => {
      requireAuth(async () => {
        setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, saved: !p.saved } : p)))
        try {
          const result = await toggleSavePost(postId)
          setPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, saved: result.saved } : p))
          )
          await refreshSavedSidebar()
        } catch {
          void loadFeed(true)
        }
      })
    },
    [requireAuth, loadFeed, refreshSavedSidebar]
  )

  const addCommentToPost = useCallback(
    (postId: string, text: string) => {
      requireAuth(async () => {
        const trimmed = text.trim()
        if (!trimmed) return

        try {
          const row = await addComment(postId, trimmed)
          const mapped = mapDbComment(row)
          setPosts((prev) =>
            prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, mapped] } : p))
          )
          setExpandedComments((prev) => new Set(prev).add(postId))
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to add comment')
        }
      })
    },
    [requireAuth]
  )

  const toggleCommentsExpanded = useCallback((postId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev)
      if (next.has(postId)) next.delete(postId)
      else next.add(postId)
      return next
    })
  }, [])

  const createPost = useCallback(
    async (opts: {
      text: string
      visibility: PostVisibility
      hubId: string | null
      postType: FeedPostType
      imageUrl?: string | null
    }): Promise<string | null> => {
      if (!isAuthenticated) {
        setAuthModalOpen(true)
        return null
      }
      const trimmed = opts.text.trim()
      if (!trimmed) return null

      const hubMatch = opts.hubId ? groups.find((g) => g.id === opts.hubId) : null

      try {
        await createFeedPost({
          content: trimmed,
          postType: opts.postType,
          visibility: opts.visibility === 'anonymous' ? 'public' : opts.visibility,
          groupId: hubMatch?.id ?? null,
          careerPath: currentUser.careerPath,
          imageUrl: opts.imageUrl ?? null,
        })
        setError(null)
        return 'Submitted for review — JobAZ publishes community posts after approval.'
      } catch (e) {
        const msg = e instanceof Error ? e.message : 'Failed to create post'
        setError(msg)
        return null
      }
    },
    [isAuthenticated, groups, currentUser.careerPath]
  )

  const createOpportunity = useCallback(
    (payload: CreateOpportunityPayload) => {
      return new Promise<void>((resolve, reject) => {
        requireAuth(async () => {
          try {
            await createOpportunityPost(payload)
            // Phase 1: pending review — do not inject into public feed
            resolve()
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to post opportunity')
            reject(e)
          }
        })
      })
    },
    [requireAuth]
  )

  const showOpportunityInterest = useCallback(
    (postId: string) => {
      requireAuth(async () => {
        try {
          const post = posts.find((p) => p.id === postId)
          const result = await toggleOpportunityInterest(postId)
          setPosts((prev) =>
            prev.map((p) => {
              if (p.id !== postId || !p.opportunity) return p
              const delta = result.interested ? 1 : -1
              return {
                ...p,
                opportunity: {
                  ...p.opportunity,
                  userInterested: result.interested,
                  interestCount: Math.max(0, p.opportunity.interestCount + delta),
                },
              }
            })
          )
          // Phase 1: route enquiries to JobAZ Team Relay inbox (not user-to-user chat)
          if (result.interested) {
            const title = post?.opportunity?.title || 'opportunity'
            const params = new URLSearchParams({
              type: 'opportunity_enquiry',
              feed_post: postId,
              subject: `Interested: ${title}`,
            })
            router.push(`/messages?${params.toString()}`)
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to register interest')
        }
      })
    },
    [requireAuth, posts, router]
  )

  const messageFromPost = useCallback(
    (post: FeedPost, asOpportunity = false) => {
      requireAuth(() => {
        // Phase 1: no random user-to-user chats — open Relay guided form to JobAZ Team
        if (asOpportunity || post.postType === 'opportunity' || post.isOfficial) {
          const title = post.opportunity?.title || post.text.slice(0, 60) || 'Pulse post'
          const params = new URLSearchParams({
            type: asOpportunity || post.postType === 'opportunity' ? 'opportunity_enquiry' : 'jobaz_support',
            feed_post: post.id,
            subject: asOpportunity ? `Enquiry: ${title}` : `About: ${title}`,
          })
          router.push(`/messages?${params.toString()}`)
          return
        }
        router.push('/messages?type=jobaz_support')
      })
    },
    [requireAuth, router]
  )

  const joinGroupAction = useCallback(
    (groupId: string): Promise<boolean | null> => {
      return new Promise((resolve) => {
        requireAuth(async () => {
          try {
            const result = await joinGroup(groupId)
            setGroups((prev) =>
              prev.map((g) =>
                g.id === groupId
                  ? {
                      ...g,
                      joined: result.joined,
                      memberCount: result.joined ? g.memberCount + 1 : Math.max(0, g.memberCount - 1),
                    }
                  : g
              )
            )
            void loadFeed(true)
            resolve(result.joined)
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to update circle')
            resolve(null)
          }
        })
      })
    },
    [requireAuth, loadFeed]
  )

  const addGroupAction = useCallback(
    (group: Omit<FeedGroup, 'id' | 'joined' | 'memberCount' | 'slug' | 'activityLevel' | 'postsToday'> & {
      visibility?: 'public' | 'private'
    }): Promise<FeedGroup | null> => {
      return new Promise((resolve) => {
        requireAuth(async () => {
          try {
            const created = await createGroup({
              name: group.name,
              description: group.description,
              category: group.category,
              icon: group.icon,
              visibility: group.visibility,
            })
            const mapped: FeedGroup = {
              id: created.id,
              name: created.name,
              slug: created.slug,
              description: created.description ?? '',
              memberCount: 1,
              category: created.category ?? 'Community',
              joined: true,
              icon: created.icon ?? '👥',
              visibility: created.visibility === 'private' ? 'private' : 'public',
              activityLevel: 'Active now',
              postsToday: 0,
            }
            setGroups((prev) => [mapped, ...prev])
            resolve(mapped)
          } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to create circle')
            resolve(null)
          }
        })
      })
    },
    [requireAuth]
  )

  const connectFromPost = useCallback(
    (post: FeedPost) => {
      requireAuth(async () => {
        try {
          if (post.authorProfileType === 'business' && post.authorId) {
            const { getProfileIdByUserId, toggleBusinessFollow } = await import(
              '@/lib/network/connectionsService'
            )
            const profileId = await getProfileIdByUserId(post.authorId)
            if (profileId) await toggleBusinessFollow(profileId)
          } else if (post.authorId) {
            await togglePersonalConnection(post.authorId)
          }
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Could not connect')
        }
      })
    },
    [requireAuth]
  )

  const sendFriendRequest = useCallback(
    (friendId: string) => {
      requireAuth(async () => {
        try {
          const result = await togglePersonalConnection(friendId)
          setFriends((prev) =>
            prev.map((f) =>
              f.id === friendId
                ? {
                    ...f,
                    connectionStatus: result.status,
                    requestSent: result.status === 'pending_out' || result.status === 'connected',
                    isFollowing: result.status === 'connected',
                  }
                : f
            )
          )
        } catch (e) {
          setError(e instanceof Error ? e.message : 'Failed to connect')
        }
      })
    },
    [requireAuth]
  )

  const improvePostWithAiAction = useCallback(async (text: string, postType?: FeedPostType): Promise<string> => {
    const improved = await improvePostWithAi(text, postType)
    return improved ?? text
  }, [])

  const uploadPulseImage = useCallback(
    (file: File) => {
      return new Promise<string>((resolve, reject) => {
        requireAuth(async () => {
          try {
            const url = await uploadPulseMedia(file)
            resolve(url)
          } catch (e) {
            reject(e)
          }
        })
      })
    },
    [requireAuth]
  )

  const polishComment = useCallback((text: string): string => {
    if (!text.trim()) return text
    const t = text.trim()
    if (t.endsWith('.')) return t
    return `${t.charAt(0).toUpperCase()}${t.slice(1)}.`
  }, [])

  const aiSuggestions = useMemo(() => {
    const nameByMockId: Record<string, string> = {
      'g-warehouse': 'Warehouse & Logistics UK',
      'g-english': 'Beginner English Support',
      'g-drivers': 'UK Drivers Network',
      'g-newcastle': 'Newcastle Job Seekers',
    }
    return AI_GROUP_SUGGESTIONS.map((s) => {
      const byId = groups.find((g) => g.id === s.groupId)
      const byName = groups.find((g) => g.name === nameByMockId[s.groupId])
      const group = byId ?? byName
      return group ? { groupId: group.id, reason: s.reason } : null
    }).filter((s): s is { groupId: string; reason: string } => s !== null)
  }, [groups])

  return {
    loading,
    refreshing,
    error,
    tableMissing,
    isAuthenticated,
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
    toggleReaction: toggleReactionOnPost,
    toggleSave: toggleSavePostLocal,
    toggleCommentLike: () => {},
    addComment: addCommentToPost,
    toggleCommentsExpanded,
    createPost,
    createOpportunity,
    showOpportunityInterest,
    messageFromPost,
    uploadPulseImage,
    joinGroup: joinGroupAction,
    addGroup: addGroupAction,
    sendFriendRequest,
    connectFromPost,
    improvePostWithAi: improvePostWithAiAction,
    polishComment,
    aiSuggestions,
    composerHubs,
    currentUser: isAuthenticated ? currentUser : guestProfilePreview(),
    communityStats,
    authModalOpen,
    setAuthModalOpen,
    refresh: () => loadFeed(true),
  }
}

export { FEED_PROMPTS } from '@/lib/feed/sampleData'
