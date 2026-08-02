/**
 * JobAZ Work Messenger — Supabase service layer
 */

import { supabase } from '@/lib/supabase'
import { getConnectionStatus } from '@/lib/network/connectionsService'
import type {
  AppointmentRequestRow,
  CallSessionRow,
  ConnectedContact,
  ConversationFilter,
  ConversationRequest,
  ConversationType,
  MessageType,
  MessengerConversation,
  MessengerMessage,
  MessengerParticipant,
  StartMessageResult,
} from './types'

export async function getAuthUserId(): Promise<string | null> {
  const { data } = await supabase.auth.getUser()
  return data.user?.id ?? null
}

type UserPreview = {
  userId: string
  name: string
  headline: string | null
  avatarUrl: string | null
  username: string | null
}

async function fetchUserPreviews(userIds: string[]): Promise<Map<string, UserPreview>> {
  const map = new Map<string, UserPreview>()
  if (userIds.length === 0) return map

  const [{ data: profiles }, { data: feedProfiles }] = await Promise.all([
    supabase.from('profiles').select('user_id, username, headline, avatar_url').in('user_id', userIds),
    supabase.from('feed_profiles').select('id, display_name, headline, avatar_url').in('id', userIds),
  ])

  for (const uid of userIds) {
    const p = profiles?.find((r) => r.user_id === uid)
    const f = feedProfiles?.find((r) => r.id === uid)
    const username = (p?.username as string | null) ?? null
    map.set(uid, {
      userId: uid,
      name: username ? `@${username}` : ((f?.display_name as string | undefined) ?? 'Member'),
      headline: ((p?.headline ?? f?.headline) as string | null) ?? null,
      avatarUrl: ((p?.avatar_url ?? f?.avatar_url) as string | null) ?? null,
      username,
    })
  }
  return map
}

function previewToParticipant(p: UserPreview, role = 'member'): MessengerParticipant {
  return {
    userId: p.userId,
    role,
    name: p.name,
    headline: p.headline,
    avatarUrl: p.avatarUrl,
    username: p.username,
  }
}

async function touchConversation(conversationId: string) {
  await supabase
    .from('conversations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', conversationId)
}

async function addParticipants(conversationId: string, userIds: string[], creatorId: string) {
  const rows = userIds.map((uid) => ({
    conversation_id: conversationId,
    user_id: uid,
    role: uid === creatorId ? 'owner' : 'member',
    last_read_at: uid === creatorId ? new Date().toISOString() : null,
  }))
  const { error } = await supabase.from('conversation_participants').insert(rows)
  if (error) throw new Error(error.message)
}

async function rpcCreateDirectConversation(targetUserId: string): Promise<string> {
  const { data, error } = await supabase.rpc('create_direct_conversation', {
    target_user_id: targetUserId,
  })
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Could not create conversation')
  return data as string
}

async function rpcCreateOpportunityConversation(
  targetUserId: string,
  postId: string,
  title?: string | null
): Promise<string> {
  const { data, error } = await supabase.rpc('create_opportunity_conversation', {
    target_user_id: targetUserId,
    post_id: postId,
    conv_title: title ?? null,
  })
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Could not create opportunity conversation')
  return data as string
}

async function rpcCreateBusinessConversation(
  targetUserId: string,
  businessProfileId?: string | null,
  title?: string | null
): Promise<string> {
  const { data, error } = await supabase.rpc('create_business_conversation', {
    target_user_id: targetUserId,
    business_profile_id: businessProfileId ?? null,
    conv_title: title ?? 'Business inquiry',
  })
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Could not create business conversation')
  return data as string
}

async function rpcCreateConversationFromRequest(
  requesterId: string,
  postId?: string | null
): Promise<string> {
  const { data, error } = await supabase.rpc('create_conversation_from_request', {
    requester_id: requesterId,
    post_id: postId ?? null,
  })
  if (error) throw new Error(error.message)
  if (!data) throw new Error('Could not create conversation from request')
  return data as string
}

async function findDirectConversationBetween(userA: string, userB: string): Promise<string | null> {
  const { data: myRows } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', userA)

  const ids = (myRows ?? []).map((r) => r.conversation_id as string)
  if (ids.length === 0) return null

  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .in('id', ids)
    .eq('type', 'direct')
    .is('related_opportunity_post_id', null)

  for (const conv of convs ?? []) {
    const { data: others } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conv.id)
    const uids = (others ?? []).map((r) => r.user_id as string)
    if (uids.includes(userB) && uids.length === 2) return conv.id as string
  }
  return null
}

async function findOpportunityConversation(
  userA: string,
  userB: string,
  postId: string
): Promise<string | null> {
  const { data } = await supabase
    .from('conversations')
    .select('id')
    .eq('related_opportunity_post_id', postId)
    .eq('type', 'opportunity')

  for (const conv of data ?? []) {
    const { data: parts } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conv.id)
    const uids = (parts ?? []).map((r) => r.user_id as string)
    if (uids.includes(userA) && uids.includes(userB)) return conv.id as string
  }
  return null
}

export async function createDirectConversation(
  viewerId: string,
  targetUserId: string,
  options?: {
    type?: ConversationType
    title?: string
    relatedProfileId?: string | null
    relatedBusinessProfileId?: string | null
    relatedOpportunityPostId?: string | null
    systemMessage?: string
  }
): Promise<string> {
  const type = options?.type ?? 'direct'

  if (type === 'direct' && !options?.relatedOpportunityPostId) {
    const convId = await rpcCreateDirectConversation(targetUserId)
    if (options?.systemMessage) {
      await sendMessage(convId, options.systemMessage, 'system')
    }
    return convId
  }

  if (type === 'opportunity' && options?.relatedOpportunityPostId) {
    const convId = await rpcCreateOpportunityConversation(
      targetUserId,
      options.relatedOpportunityPostId,
      options?.title ?? null
    )
    if (options?.systemMessage) {
      await sendMessage(convId, options.systemMessage, 'system')
    }
    return convId
  }

  if (type === 'business') {
    const convId = await rpcCreateBusinessConversation(
      targetUserId,
      options?.relatedBusinessProfileId ?? null,
      options?.title ?? 'Business inquiry'
    )
    if (options?.systemMessage) {
      await sendMessage(convId, options.systemMessage, 'system')
    }
    return convId
  }

  const { data: conv, error } = await supabase
    .from('conversations')
    .insert({
      type,
      title: options?.title ?? null,
      created_by: viewerId,
      related_profile_id: options?.relatedProfileId ?? null,
      related_business_profile_id: options?.relatedBusinessProfileId ?? null,
      related_opportunity_post_id: options?.relatedOpportunityPostId ?? null,
    })
    .select('id')
    .single()

  if (error || !conv) throw new Error(error?.message ?? 'Could not create conversation')

  await addParticipants(conv.id as string, [viewerId, targetUserId], viewerId)

  if (options?.systemMessage) {
    await sendMessage(conv.id as string, options.systemMessage, 'system')
  }

  return conv.id as string
}

export async function sendMessage(
  conversationId: string,
  body: string,
  messageType: MessageType = 'text',
  metadata: Record<string, unknown> = {}
): Promise<MessengerMessage> {
  const viewerId = await getAuthUserId()
  if (!viewerId) throw new Error('Sign in to send messages.')

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: viewerId,
      body,
      message_type: messageType,
      metadata,
    })
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Could not send message')

  await touchConversation(conversationId)
  await markConversationRead(conversationId)

  return {
    id: data.id as string,
    conversationId,
    senderId: viewerId,
    body: data.body as string,
    messageType: data.message_type as MessageType,
    metadata: (data.metadata as Record<string, unknown>) ?? {},
    createdAt: data.created_at as string,
    isOwn: true,
  }
}

export async function fetchMessages(conversationId: string): Promise<MessengerMessage[]> {
  const viewerId = await getAuthUserId()
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .is('deleted_at', null)
    .order('created_at', { ascending: true })

  if (error) throw new Error(error.message)

  return (data ?? []).map((m) => ({
    id: m.id as string,
    conversationId,
    senderId: m.sender_id as string,
    body: m.body as string,
    messageType: m.message_type as MessageType,
    metadata: (m.metadata as Record<string, unknown>) ?? {},
    createdAt: m.created_at as string,
    isOwn: viewerId === m.sender_id,
  }))
}

export async function markConversationRead(conversationId: string) {
  const viewerId = await getAuthUserId()
  if (!viewerId) return
  await supabase
    .from('conversation_participants')
    .update({ last_read_at: new Date().toISOString() })
    .eq('conversation_id', conversationId)
    .eq('user_id', viewerId)
}

async function buildConversationRow(
  conv: Record<string, unknown>,
  viewerId: string,
  previews: Map<string, UserPreview>
): Promise<MessengerConversation> {
  const convId = conv.id as string

  const { data: parts } = await supabase
    .from('conversation_participants')
    .select('user_id, role, last_read_at')
    .eq('conversation_id', convId)

  const participants: MessengerParticipant[] = (parts ?? []).map((p) => {
    const preview = previews.get(p.user_id as string)
    return preview
      ? previewToParticipant(preview, p.role as string)
      : {
          userId: p.user_id as string,
          role: p.role as string,
          name: 'Member',
          headline: null,
          avatarUrl: null,
          username: null,
        }
  })

  const { data: lastMsg } = await supabase
    .from('messages')
    .select('body, created_at, sender_id')
    .eq('conversation_id', convId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const myPart = parts?.find((p) => p.user_id === viewerId)
  const lastRead = myPart?.last_read_at as string | null

  let unreadCount = 0
  if (lastMsg && lastMsg.sender_id !== viewerId) {
    if (!lastRead || new Date(lastMsg.created_at as string) > new Date(lastRead)) {
      const { count } = await supabase
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('conversation_id', convId)
        .neq('sender_id', viewerId)
        .gt('created_at', lastRead ?? '1970-01-01')
      unreadCount = count ?? 1
    }
  }

  let opportunityTitle: string | null = null
  let opportunityLocation: string | null = null
  const postId = conv.related_opportunity_post_id as string | null
  if (postId) {
    const { data: post } = await supabase
      .from('feed_posts')
      .select('opportunity_title, opportunity_location, content')
      .eq('id', postId)
      .maybeSingle()
    opportunityTitle = (post?.opportunity_title as string) ?? (post?.content as string)?.slice(0, 80) ?? null
    opportunityLocation = (post?.opportunity_location as string | null) ?? null
  }

  return {
    id: convId,
    type: conv.type as ConversationType,
    title: (conv.title as string | null) ?? opportunityTitle,
    updatedAt: conv.updated_at as string,
    lastMessage: (lastMsg?.body as string | undefined) ?? null,
    lastMessageAt: (lastMsg?.created_at as string | undefined) ?? null,
    unreadCount,
    participants,
    relatedOpportunityPostId: postId,
    opportunityTitle,
    opportunityLocation,
  }
}

export async function fetchConversations(filter: ConversationFilter = 'all'): Promise<MessengerConversation[]> {
  const viewerId = await getAuthUserId()
  if (!viewerId) return []

  const { data: memberships } = await supabase
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', viewerId)

  const convIds = (memberships ?? []).map((m) => m.conversation_id as string)
  if (convIds.length === 0) return []

  const { data: convs, error } = await supabase
    .from('conversations')
    .select('*')
    .in('id', convIds)
    .order('updated_at', { ascending: false })

  if (error) throw new Error(error.message)

  let filtered = convs ?? []
  if (filter === 'opportunities') filtered = filtered.filter((c) => c.type === 'opportunity')
  else if (filter === 'businesses') filtered = filtered.filter((c) => c.type === 'business')
  else if (filter === 'connections') filtered = filtered.filter((c) => c.type === 'direct')

  const allUserIds = new Set<string>()
  for (const conv of filtered) {
    const { data: parts } = await supabase
      .from('conversation_participants')
      .select('user_id')
      .eq('conversation_id', conv.id)
    for (const p of parts ?? []) allUserIds.add(p.user_id as string)
  }

  const previews = await fetchUserPreviews([...allUserIds])
  const rows = await Promise.all(
    filtered.map((c) => buildConversationRow(c as Record<string, unknown>, viewerId, previews))
  )
  return rows
}

export async function fetchConversationById(conversationId: string): Promise<MessengerConversation | null> {
  const viewerId = await getAuthUserId()
  if (!viewerId) return null

  const { data: conv, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', conversationId)
    .maybeSingle()

  if (error || !conv) return null

  const { data: parts } = await supabase
    .from('conversation_participants')
    .select('user_id')
    .eq('conversation_id', conversationId)

  const userIds = (parts ?? []).map((p) => p.user_id as string)
  const previews = await fetchUserPreviews(userIds)
  return buildConversationRow(conv as Record<string, unknown>, viewerId, previews)
}

export async function getTotalUnreadCount(): Promise<number> {
  const convs = await fetchConversations('all')
  return convs.reduce((sum, c) => sum + c.unreadCount, 0)
}

export async function createConversationRequest(
  targetUserId: string,
  message: string,
  relatedOpportunityPostId?: string | null
): Promise<void> {
  const viewerId = await getAuthUserId()
  if (!viewerId) throw new Error('Sign in to send a message request.')
  if (viewerId === targetUserId) throw new Error('Cannot message yourself.')

  const { data: existing } = await supabase
    .from('conversation_requests')
    .select('id')
    .eq('requester_id', viewerId)
    .eq('target_user_id', targetUserId)
    .eq('status', 'pending')
    .maybeSingle()

  if (existing) return

  const { error } = await supabase.from('conversation_requests').insert({
    requester_id: viewerId,
    target_user_id: targetUserId,
    message: message.trim() || 'Would like to connect professionally on JobAZ.',
    related_opportunity_post_id: relatedOpportunityPostId ?? null,
  })
  if (error) throw new Error(error.message)
}

export async function fetchConversationRequests(): Promise<ConversationRequest[]> {
  const viewerId = await getAuthUserId()
  if (!viewerId) return []

  const { data, error } = await supabase
    .from('conversation_requests')
    .select('*')
    .or(`target_user_id.eq.${viewerId},requester_id.eq.${viewerId}`)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  if (!data?.length) return []

  const requesterIds = data.map((r) => r.requester_id as string)
  const previews = await fetchUserPreviews(requesterIds)

  return data.map((r) => {
    const preview = previews.get(r.requester_id as string)
    return {
      id: r.id as string,
      requesterId: r.requester_id as string,
      targetUserId: r.target_user_id as string,
      message: r.message as string,
      status: r.status as ConversationRequest['status'],
      createdAt: r.created_at as string,
      relatedOpportunityPostId: (r.related_opportunity_post_id as string | null) ?? null,
      requesterName: preview?.name ?? 'Member',
      requesterHeadline: preview?.headline ?? null,
      requesterAvatarUrl: preview?.avatarUrl ?? null,
      requesterUsername: preview?.username ?? null,
    }
  })
}

export async function acceptConversationRequest(requestId: string): Promise<string> {
  const viewerId = await getAuthUserId()
  if (!viewerId) throw new Error('Sign in required.')

  const { data: req, error } = await supabase
    .from('conversation_requests')
    .select('*')
    .eq('id', requestId)
    .maybeSingle()

  if (error || !req) throw new Error(error?.message ?? 'Request not found')
  if (req.target_user_id !== viewerId) throw new Error('Not authorized')
  if (req.status !== 'pending') throw new Error('Request already handled')

  const convId = await rpcCreateConversationFromRequest(
    req.requester_id as string,
    (req.related_opportunity_post_id as string | null) ?? null
  )

  await sendMessage(
    convId,
    'Conversation request accepted. You can now message about work opportunities.',
    'system'
  )

  if (req.message) {
    await sendMessage(convId, req.message as string, 'text')
  }

  await supabase
    .from('conversation_requests')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', requestId)

  return convId
}

export async function declineConversationRequest(requestId: string): Promise<void> {
  const viewerId = await getAuthUserId()
  if (!viewerId) throw new Error('Sign in required.')

  const { error } = await supabase
    .from('conversation_requests')
    .update({ status: 'declined', updated_at: new Date().toISOString() })
    .eq('id', requestId)

  if (error) throw new Error(error.message)
}

export async function startProfileMessage(
  targetUserId: string,
  profileType: 'personal' | 'business',
  profileId?: string
): Promise<StartMessageResult> {
  const viewerId = await getAuthUserId()
  if (!viewerId) throw new Error('Sign in to message')
  if (viewerId === targetUserId) throw new Error('Cannot message yourself')

  if (profileType === 'business') {
    const convId = await rpcCreateBusinessConversation(
      targetUserId,
      profileId ?? null,
      'Business inquiry'
    )
    return { kind: 'conversation', conversationId: convId, toast: 'Opening business conversation' }
  }

  const status = await getConnectionStatus(viewerId, targetUserId)
  if (status === 'connected') {
    const convId = await openOrCreateDirectConversation(targetUserId)
    return { kind: 'conversation', conversationId: convId, toast: 'Opening conversation' }
  }

  await createConversationRequest(
    targetUserId,
    'Would like to connect and discuss work opportunities on JobAZ.'
  )
  const toast =
    status === 'none'
      ? 'Relay request sent — connect on their identity for faster replies'
      : 'Relay request sent'
  return { kind: 'request', toast }
}

export async function startOpportunityMessage(
  postId: string,
  posterUserId: string,
  options?: { showInterest?: boolean }
): Promise<StartMessageResult> {
  const viewerId = await getAuthUserId()
  if (!viewerId) throw new Error('Sign in to message')
  if (viewerId === posterUserId) throw new Error('Cannot message yourself about your own post')

  const { data: post } = await supabase
    .from('feed_posts')
    .select('opportunity_title, opportunity_location, content')
    .eq('id', postId)
    .maybeSingle()

  const title = (post?.opportunity_title as string) ?? 'Opportunity on Pulse'
  const location = (post?.opportunity_location as string) ?? ''

  const status = await getConnectionStatus(viewerId, posterUserId)
  const systemMsg = `User is interested in this opportunity: ${title}${location ? ` (${location})` : ''}`

  if (status === 'connected') {
    const convId = await rpcCreateOpportunityConversation(posterUserId, postId, title)
    if (options?.showInterest) {
      await sendMessage(convId, systemMsg, 'system')
    } else {
      await sendMessage(convId, `Messaging about: ${title}`, 'system')
    }
    return { kind: 'conversation', conversationId: convId, toast: 'Opening opportunity conversation' }
  }

  await createConversationRequest(
    posterUserId,
    options?.showInterest
      ? `I'm interested in your opportunity: ${title}`
      : `I'd like to discuss your opportunity: ${title}`,
    postId
  )
  return { kind: 'request', toast: options?.showInterest ? 'Interest sent with Relay request' : 'Relay request sent' }
}

export async function createAppointmentRequest(
  conversationId: string,
  proposedTime: string,
  message: string
): Promise<AppointmentRequestRow> {
  const viewerId = await getAuthUserId()
  if (!viewerId) throw new Error('Sign in required')

  const { data, error } = await supabase
    .from('appointment_requests')
    .insert({
      conversation_id: conversationId,
      requester_id: viewerId,
      proposed_time: proposedTime,
      message: message.trim(),
    })
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Could not create appointment request')

  await sendMessage(conversationId, message.trim() || 'Appointment request', 'appointment_request', {
    appointmentRequestId: data.id,
    proposedTime,
    status: 'pending',
  })

  const previews = await fetchUserPreviews([viewerId])
  return {
    id: data.id as string,
    conversationId,
    requesterId: viewerId,
    proposedTime: data.proposed_time as string,
    message: data.message as string,
    status: 'pending',
    createdAt: data.created_at as string,
    requesterName: previews.get(viewerId)?.name ?? 'Member',
  }
}

export async function respondToAppointmentRequest(
  appointmentId: string,
  accept: boolean
): Promise<void> {
  const viewerId = await getAuthUserId()
  if (!viewerId) throw new Error('Sign in required')

  const { data: appt, error } = await supabase
    .from('appointment_requests')
    .select('*')
    .eq('id', appointmentId)
    .maybeSingle()

  if (error || !appt) throw new Error(error?.message ?? 'Appointment not found')

  const status = accept ? 'accepted' : 'declined'
  const { error: updErr } = await supabase
    .from('appointment_requests')
    .update({ status })
    .eq('id', appointmentId)

  if (updErr) throw new Error(updErr.message)

  const time = new Date(appt.proposed_time as string).toLocaleString()
  await sendMessage(
    appt.conversation_id as string,
    accept
      ? `Appointment accepted for ${time}`
      : `Appointment declined for ${time}`,
    'system',
    { appointmentRequestId: appointmentId, status }
  )
}

export async function fetchAppointmentRequests(conversationId: string): Promise<AppointmentRequestRow[]> {
  const { data, error } = await supabase
    .from('appointment_requests')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const requesterIds = [...new Set((data ?? []).map((r) => r.requester_id as string))]
  const previews = await fetchUserPreviews(requesterIds)

  return (data ?? []).map((r) => ({
    id: r.id as string,
    conversationId,
    requesterId: r.requester_id as string,
    proposedTime: r.proposed_time as string,
    message: r.message as string,
    status: r.status as AppointmentRequestRow['status'],
    createdAt: r.created_at as string,
    requesterName: previews.get(r.requester_id as string)?.name ?? 'Member',
  }))
}

export async function createCallRequest(
  conversationId: string,
  callType: 'audio' | 'video',
  scheduledTime: string | null,
  message: string
): Promise<CallSessionRow> {
  const viewerId = await getAuthUserId()
  if (!viewerId) throw new Error('Sign in required')

  const status = scheduledTime ? 'scheduled' : 'requested'

  const { data, error } = await supabase
    .from('call_sessions')
    .insert({
      conversation_id: conversationId,
      created_by: viewerId,
      call_type: callType,
      status,
      scheduled_time: scheduledTime,
      provider: 'placeholder',
    })
    .select('*')
    .single()

  if (error || !data) throw new Error(error?.message ?? 'Could not create call request')

  const label = callType === 'video' ? 'Video' : 'Audio'
  await sendMessage(
    conversationId,
    message.trim() || `${label} call requested`,
    'call_request',
    {
      callSessionId: data.id,
      callType,
      scheduledTime,
      status,
    }
  )

  const previews = await fetchUserPreviews([viewerId])
  return {
    id: data.id as string,
    conversationId,
    createdBy: viewerId,
    callType,
    status: status as CallSessionRow['status'],
    scheduledTime,
    provider: 'placeholder',
    meetingUrl: null,
    createdAt: data.created_at as string,
    createdByName: previews.get(viewerId)?.name ?? 'Member',
  }
}

export async function respondToCallSession(callSessionId: string, accept: boolean): Promise<void> {
  const viewerId = await getAuthUserId()
  if (!viewerId) throw new Error('Sign in required')

  const { data: call, error } = await supabase
    .from('call_sessions')
    .select('*')
    .eq('id', callSessionId)
    .maybeSingle()

  if (error || !call) throw new Error(error?.message ?? 'Call session not found')

  const status = accept ? 'scheduled' : 'declined'
  const { error: updErr } = await supabase
    .from('call_sessions')
    .update({ status })
    .eq('id', callSessionId)

  if (updErr) throw new Error(updErr.message)

  const label = call.call_type === 'video' ? 'Video' : 'Audio'
  await sendMessage(
    call.conversation_id as string,
    accept
      ? `${label} call accepted. Live calls coming soon — use this request to agree a time.`
      : `${label} call declined`,
    'system',
    { callSessionId, status }
  )
}

export async function fetchCallSessions(conversationId: string): Promise<CallSessionRow[]> {
  const { data, error } = await supabase
    .from('call_sessions')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  const creatorIds = [...new Set((data ?? []).map((r) => r.created_by as string))]
  const previews = await fetchUserPreviews(creatorIds)

  return (data ?? []).map((r) => ({
    id: r.id as string,
    conversationId,
    createdBy: r.created_by as string,
    callType: r.call_type as CallSessionRow['callType'],
    status: r.status as CallSessionRow['status'],
    scheduledTime: (r.scheduled_time as string | null) ?? null,
    provider: r.provider as string,
    meetingUrl: (r.meeting_url as string | null) ?? null,
    createdAt: r.created_at as string,
    createdByName: previews.get(r.created_by as string)?.name ?? 'Member',
  }))
}

export async function countPendingConversationRequests(): Promise<number> {
  const viewerId = await getAuthUserId()
  if (!viewerId) return 0
  const { count } = await supabase
    .from('conversation_requests')
    .select('id', { count: 'exact', head: true })
    .eq('target_user_id', viewerId)
    .eq('status', 'pending')
  return count ?? 0
}

export async function fetchConnectedContacts(): Promise<ConnectedContact[]> {
  const viewerId = await getAuthUserId()
  if (!viewerId) return []

  const { data: rows, error } = await supabase
    .from('profile_connections')
    .select('requester_id, target_user_id')
    .eq('status', 'connected')
    .or(`requester_id.eq.${viewerId},target_user_id.eq.${viewerId}`)

  if (error) throw new Error(error.message)
  if (!rows?.length) return []

  const otherIds = [
    ...new Set(
      rows.map((r) =>
        (r.requester_id as string) === viewerId ? (r.target_user_id as string) : (r.requester_id as string)
      )
    ),
  ]

  const previews = await fetchUserPreviews(otherIds)

  const contacts = await Promise.all(
    otherIds.map(async (uid) => {
      const preview = previews.get(uid)
      const existingConversationId = await findDirectConversationBetween(viewerId, uid)
      return {
        userId: uid,
        name: preview?.name ?? 'Member',
        headline: preview?.headline ?? null,
        avatarUrl: preview?.avatarUrl ?? null,
        username: preview?.username ?? null,
        existingConversationId,
      }
    })
  )

  return contacts.sort((a, b) => a.name.localeCompare(b.name))
}

/** Find existing direct chat or create one between the current user and target. */
export async function openOrCreateDirectConversation(targetUserId: string): Promise<string> {
  const viewerId = await getAuthUserId()
  if (!viewerId) throw new Error('Sign in to start a chat')
  if (viewerId === targetUserId) throw new Error('Cannot message yourself')

  return rpcCreateDirectConversation(targetUserId)
}
