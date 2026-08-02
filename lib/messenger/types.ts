export type ConversationType = 'direct' | 'opportunity' | 'business' | 'support'

export type MessageType =
  | 'text'
  | 'system'
  | 'image'
  | 'file'
  | 'appointment_request'
  | 'call_request'
  | 'opportunity_interest'

export type ConversationFilter = 'all' | 'opportunities' | 'businesses' | 'connections' | 'requests'

export type MessengerParticipant = {
  userId: string
  role: string
  name: string
  headline: string | null
  avatarUrl: string | null
  username: string | null
}

export type MessengerConversation = {
  id: string
  type: ConversationType
  title: string | null
  updatedAt: string
  lastMessage: string | null
  lastMessageAt: string | null
  unreadCount: number
  participants: MessengerParticipant[]
  relatedOpportunityPostId: string | null
  opportunityTitle: string | null
  opportunityLocation: string | null
}

export type MessengerMessage = {
  id: string
  conversationId: string
  senderId: string
  body: string
  messageType: MessageType
  metadata: Record<string, unknown>
  createdAt: string
  isOwn: boolean
}

export type ConversationRequest = {
  id: string
  requesterId: string
  targetUserId: string
  message: string
  status: 'pending' | 'accepted' | 'declined'
  createdAt: string
  relatedOpportunityPostId: string | null
  requesterName: string
  requesterHeadline: string | null
  requesterAvatarUrl: string | null
  requesterUsername: string | null
}

export type AppointmentRequestRow = {
  id: string
  conversationId: string
  requesterId: string
  proposedTime: string
  message: string
  status: 'pending' | 'accepted' | 'declined' | 'cancelled'
  createdAt: string
  requesterName: string
}

export type CallSessionRow = {
  id: string
  conversationId: string
  createdBy: string
  callType: 'audio' | 'video'
  status: 'requested' | 'scheduled' | 'active' | 'ended' | 'declined'
  scheduledTime: string | null
  provider: string
  meetingUrl: string | null
  createdAt: string
  createdByName: string
}

export type ConnectedContact = {
  userId: string
  name: string
  headline: string | null
  avatarUrl: string | null
  username: string | null
  existingConversationId: string | null
}

export type StartMessageResult =
  | { kind: 'conversation'; conversationId: string; toast: string }
  | { kind: 'request'; toast: string }
