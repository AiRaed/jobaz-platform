'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  acceptConversationRequest,
  countPendingConversationRequests,
  declineConversationRequest,
  fetchAppointmentRequests,
  fetchCallSessions,
  fetchConnectedContacts,
  fetchConversationById,
  fetchConversationRequests,
  fetchConversations,
  fetchMessages,
  getTotalUnreadCount,
  markConversationRead,
  openOrCreateDirectConversation,
  respondToAppointmentRequest,
  respondToCallSession,
  sendMessage,
} from '@/lib/messenger/messengerService'
import type {
  AppointmentRequestRow,
  CallSessionRow,
  ConnectedContact,
  ConversationFilter,
  ConversationRequest,
  MessengerConversation,
  MessengerMessage,
} from '@/lib/messenger/types'

export function useWorkMessenger(activeConversationId: string | null) {
  const [filter, setFilter] = useState<ConversationFilter>('all')
  const [conversations, setConversations] = useState<MessengerConversation[]>([])
  const [connectedContacts, setConnectedContacts] = useState<ConnectedContact[]>([])
  const [requests, setRequests] = useState<ConversationRequest[]>([])
  const [messages, setMessages] = useState<MessengerMessage[]>([])
  const [activeConversation, setActiveConversation] = useState<MessengerConversation | null>(null)
  const [appointments, setAppointments] = useState<AppointmentRequestRow[]>([])
  const [calls, setCalls] = useState<CallSessionRow[]>([])
  const [loadingList, setLoadingList] = useState(true)
  const [loadingChat, setLoadingChat] = useState(false)
  const [sending, setSending] = useState(false)
  const [search, setSearch] = useState('')
  const [totalUnread, setTotalUnread] = useState(0)
  const [pendingRequestCount, setPendingRequestCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [startingChatUserId, setStartingChatUserId] = useState<string | null>(null)
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  const refreshList = useCallback(async () => {
    setLoadingList(true)
    setError(null)
    try {
      const [convs, contacts, reqs, unread, pendingReqs] = await Promise.all([
        fetchConversations(filter === 'requests' ? 'all' : filter),
        fetchConnectedContacts(),
        fetchConversationRequests(),
        getTotalUnreadCount(),
        countPendingConversationRequests(),
      ])
      setConversations(convs)
      setConnectedContacts(contacts)
      setRequests(reqs)
      setTotalUnread(unread)
      setPendingRequestCount(pendingReqs)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load conversations')
    } finally {
      setLoadingList(false)
    }
  }, [filter])

  const loadConversation = useCallback(async (conversationId: string) => {
    setLoadingChat(true)
    setError(null)
    try {
      const [conv, msgs, appts, callRows] = await Promise.all([
        fetchConversationById(conversationId),
        fetchMessages(conversationId),
        fetchAppointmentRequests(conversationId),
        fetchCallSessions(conversationId),
      ])
      setActiveConversation(conv)
      setMessages(msgs)
      setAppointments(appts)
      setCalls(callRows)
      await markConversationRead(conversationId)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load conversation')
    } finally {
      setLoadingChat(false)
    }
  }, [])

  useEffect(() => {
    void refreshList()
  }, [refreshList])

  useEffect(() => {
    if (activeConversationId) {
      void loadConversation(activeConversationId)
    } else {
      setActiveConversation(null)
      setMessages([])
      setAppointments([])
      setCalls([])
    }
  }, [activeConversationId, loadConversation])

  useEffect(() => {
    if (!activeConversationId) {
      channelRef.current?.unsubscribe()
      channelRef.current = null
      return
    }

    const channel = supabase
      .channel(`messages:${activeConversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${activeConversationId}`,
        },
        () => {
          void loadConversation(activeConversationId)
          void refreshList()
        }
      )
      .subscribe()

    channelRef.current = channel
    return () => {
      channel.unsubscribe()
    }
  }, [activeConversationId, loadConversation, refreshList])

  const send = useCallback(
    async (body: string) => {
      if (!activeConversationId || !body.trim()) return
      setSending(true)
      try {
        const msg = await sendMessage(activeConversationId, body.trim())
        setMessages((prev) => [...prev, msg])
        await refreshList()
      } finally {
        setSending(false)
      }
    },
    [activeConversationId, refreshList]
  )

  const acceptRequest = useCallback(
    async (requestId: string) => {
      const convId = await acceptConversationRequest(requestId)
      await refreshList()
      return convId
    },
    [refreshList]
  )

  const declineRequest = useCallback(
    async (requestId: string) => {
      await declineConversationRequest(requestId)
      await refreshList()
    },
    [refreshList]
  )

  const respondAppointment = useCallback(
    async (id: string, accept: boolean) => {
      if (!activeConversationId) return
      await respondToAppointmentRequest(id, accept)
      await loadConversation(activeConversationId)
    },
    [activeConversationId, loadConversation]
  )

  const respondCall = useCallback(
    async (id: string, accept: boolean) => {
      if (!activeConversationId) return
      await respondToCallSession(id, accept)
      await loadConversation(activeConversationId)
    },
    [activeConversationId, loadConversation]
  )

  const startChatWithUser = useCallback(
    async (targetUserId: string) => {
      setStartingChatUserId(targetUserId)
      try {
        const convId = await openOrCreateDirectConversation(targetUserId)
        await refreshList()
        return convId
      } finally {
        setStartingChatUserId(null)
      }
    },
    [refreshList]
  )

  const filteredConversations = conversations.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      c.title?.toLowerCase().includes(q) ||
      c.participants.some((p) => p.name.toLowerCase().includes(q) || p.headline?.toLowerCase().includes(q))
    )
  })

  const filteredConnectedContacts = connectedContacts.filter((c) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || c.headline?.toLowerCase().includes(q)
  })

  const incomingRequests = requests.filter((r) => r.status === 'pending')

  return {
    filter,
    setFilter,
    search,
    setSearch,
    conversations: filteredConversations,
    connectedContacts: filteredConnectedContacts,
    requests: incomingRequests,
    messages,
    activeConversation,
    appointments,
    calls,
    loadingList,
    loadingChat,
    sending,
    totalUnread,
    pendingRequestCount,
    startingChatUserId,
    error,
    refreshList,
    loadConversation,
    startChatWithUser,
    send,
    acceptRequest,
    declineRequest,
    respondAppointment,
    respondCall,
  }
}
