'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Briefcase,
  Building2,
  Calendar,
  Check,
  Loader2,
  MessageSquare,
  Phone,
  Search,
  Send,
  Shield,
  Sparkles,
  User,
  Users,
  Video,
  X,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import {
  PlatformContent,
  PlatformPageHeader,
  PlatformShell,
} from '@/components/dashboard/platform'
import { useToast } from '@/components/ui/toast'
import { useWorkMessenger } from '@/hooks/useWorkMessenger'
import { cn } from '@/lib/utils'
import { personalProfilePath } from '@/lib/network/publicProfileUrls'
import { improveMessage, safetyCheckMessage } from '@/lib/ai/messenger'
import {
  createAppointmentRequest,
  createCallRequest,
  getAuthUserId,
} from '@/lib/messenger/messengerService'
import type { ConnectedContact, ConversationFilter, MessengerParticipant } from '@/lib/messenger/types'
import { AppointmentRequestModal, CallRequestModal } from './MessengerModals'

const FILTERS: { id: ConversationFilter; label: string; icon: typeof MessageSquare }[] = [
  { id: 'all', label: 'All', icon: MessageSquare },
  { id: 'opportunities', label: 'Opportunities', icon: Briefcase },
  { id: 'businesses', label: 'Businesses', icon: Building2 },
  { id: 'connections', label: 'Connections', icon: Users },
  { id: 'requests', label: 'Requests', icon: User },
]

type Props = {
  conversationId?: string | null
}

function otherParticipant(participants: MessengerParticipant[], viewerId: string | null) {
  return participants.find((p) => p.userId !== viewerId) ?? participants[0]
}

export default function WorkMessengerPage({ conversationId = null }: Props) {
  const router = useRouter()
  const { addToast } = useToast()
  const messenger = useWorkMessenger(conversationId)
  const [draft, setDraft] = useState('')
  const [viewerId, setViewerId] = useState<string | null>(null)
  const [appointmentOpen, setAppointmentOpen] = useState(false)
  const [callOpen, setCallOpen] = useState(false)
  const [callType, setCallType] = useState<'audio' | 'video'>('audio')
  const [aiLoading, setAiLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    void getAuthUserId().then(setViewerId)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messenger.messages])

  const peer = messenger.activeConversation
    ? otherParticipant(messenger.activeConversation.participants, viewerId)
    : null

  const selectConversation = (id: string) => router.push(`/messages/${id}`)

  const handleStartChat = async (contact: ConnectedContact) => {
    try {
      const convId =
        contact.existingConversationId ?? (await messenger.startChatWithUser(contact.userId))
      selectConversation(convId)
    } catch (e) {
      addToast({ variant: 'error', title: e instanceof Error ? e.message : 'Could not open Relay' })
    }
  }
  const handleSend = async () => {
    if (!draft.trim()) return
    const safety = await safetyCheckMessage(draft)
    if (!safety.ok) {
      addToast({ variant: 'error', title: safety.reason ?? 'Message blocked' })
      return
    }
    try {
      await messenger.send(draft)
      setDraft('')
    } catch (e) {
      addToast({ variant: 'error', title: e instanceof Error ? e.message : 'Send failed' })
    }
  }

  const handleAiImprove = async () => {
    if (!draft.trim()) {
      addToast({ variant: 'default', title: 'Enter a message first' })
      return
    }
    setAiLoading(true)
    try {
      const result = await improveMessage(draft, {
        conversationType: messenger.activeConversation?.type,
        opportunityTitle: messenger.activeConversation?.opportunityTitle,
      })
      if (result.text) setDraft(result.text)
      addToast({
        variant: result.ok ? 'success' : 'default',
        title: result.ok ? 'Message improved' : (result.reason ?? 'AI help unavailable'),
      })
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <AppShell wide platform>
      <PlatformShell
        pageHeader={
          <PlatformPageHeader
            title="Relay"
            dotColor="cyan"
            description="Professional Relay for connections, opportunities, and business inquiries — focused work communication."
            badges={
              <>
                {messenger.totalUnread > 0 && (
                  <span className="rounded-full bg-violet-600 px-2 py-0.5 text-xs font-semibold text-white">
                    {messenger.totalUnread} unread
                  </span>
                )}
                {messenger.pendingRequestCount > 0 && (
                  <span className="rounded-full bg-cyan-600/90 px-2 py-0.5 text-xs font-semibold text-white">
                    {messenger.pendingRequestCount} request{messenger.pendingRequestCount === 1 ? '' : 's'}
                  </span>
                )}
              </>
            }
          />
        }
      >
      <PlatformContent>
        {messenger.error && (
          <p className="mb-4 text-sm text-rose-400 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-2">
            {messenger.error}
          </p>
        )}

        <div className="grid gap-4 lg:grid-cols-[260px_1fr_240px] min-h-[520px]">
          {/* Sidebar */}
          <aside className="rounded-2xl border border-slate-700/40 bg-slate-950/60 p-3 flex flex-col">
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input
                value={messenger.search}
                onChange={(e) => messenger.setSearch(e.target.value)}
                placeholder="Search conversations…"
                className="w-full rounded-xl border border-slate-700/50 bg-slate-900/50 pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-600"
              />
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {FILTERS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => messenger.setFilter(f.id)}
                  className={cn(
                    'rounded-full px-2.5 py-1 text-[10px] border cursor-pointer inline-flex items-center gap-1',
                    messenger.filter === f.id
                      ? 'bg-violet-600/25 border-violet-500/40 text-violet-200'
                      : 'border-slate-700/50 text-slate-500 hover:text-slate-300'
                  )}
                >
                  <f.icon className="w-3 h-3" />
                  {f.label}
                  {f.id === 'requests' && messenger.pendingRequestCount > 0 && (
                    <span className="bg-cyan-500 text-white rounded-full px-1 min-w-[14px] text-[9px]">
                      {messenger.pendingRequestCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {messenger.filter !== 'requests' && messenger.connectedContacts.length > 0 && (
              <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wide text-slate-500 font-medium px-1 mb-2">
                  Connected people
                </p>
                <div className="space-y-2 max-h-[180px] overflow-y-auto">
                  {messenger.connectedContacts.map((contact) => (
                    <ConnectedContactCard
                      key={contact.userId}
                      contact={contact}
                      busy={messenger.startingChatUserId === contact.userId}
                      onStartChat={() => void handleStartChat(contact)}
                    />
                  ))}
                </div>
              </div>
            )}

            {messenger.filter !== 'requests' && messenger.connectedContacts.length > 0 && (
              <p className="text-[10px] uppercase tracking-wide text-slate-500 font-medium px-1 mb-2 mt-1">
                Conversations
              </p>
            )}

            <div className="flex-1 overflow-y-auto space-y-1 min-h-[120px]">
              {messenger.loadingList ? (
                <div className="flex items-center justify-center py-8 text-slate-500 gap-2 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                </div>
              ) : messenger.filter === 'requests' ? (
                messenger.requests.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">No pending requests</p>
                ) : (
                  messenger.requests.map((req) => (
                    <RequestCard
                      key={req.id}
                      request={req}
                      viewerId={viewerId}
                      onAccept={async () => {
                        try {
                          const convId = await messenger.acceptRequest(req.id)
                          addToast({ variant: 'success', title: 'Request accepted' })
                          router.push(`/messages/${convId}`)
                        } catch (e) {
                          addToast({ variant: 'error', title: e instanceof Error ? e.message : 'Failed' })
                        }
                      }}
                      onDecline={async () => {
                        try {
                          await messenger.declineRequest(req.id)
                          addToast({ variant: 'default', title: 'Request declined' })
                        } catch (e) {
                          addToast({ variant: 'error', title: e instanceof Error ? e.message : 'Failed' })
                        }
                      }}
                    />
                  ))
                )
              ) : messenger.conversations.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-6">
                  {messenger.connectedContacts.length > 0
                    ? 'No conversations yet. Open Relay with someone from your connections above.'
                    : 'No conversations yet. Connect on Identity or Pulse, then open Relay here.'}
                </p>
              ) : (
                messenger.conversations.map((conv) => {
                  const other = otherParticipant(conv.participants, viewerId)
                  const active = conv.id === conversationId
                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => selectConversation(conv.id)}
                      className={cn(
                        'w-full text-left rounded-xl px-3 py-2.5 border transition cursor-pointer',
                        active
                          ? 'border-violet-500/40 bg-violet-500/10'
                          : 'border-transparent hover:border-slate-700/50 hover:bg-slate-900/40'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar name={other?.name ?? '?'} url={other?.avatarUrl} size="sm" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-slate-200 truncate">
                            {conv.title ?? other?.name ?? 'Conversation'}
                          </p>
                          <p className="text-[10px] text-slate-500 truncate">{conv.lastMessage ?? 'No messages yet'}</p>
                        </div>
                        {conv.unreadCount > 0 && (
                          <span className="shrink-0 rounded-full bg-violet-600 text-white text-[9px] px-1.5 py-0.5">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </aside>

          {/* Main chat */}
          <main className="rounded-2xl border border-slate-700/40 bg-slate-950/60 flex flex-col min-h-[480px]">
            {!conversationId ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <MessageSquare className="w-12 h-12 text-violet-500/40 mb-3" />
                <p className="text-slate-300 font-medium">Select a conversation</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs">
                  Use Identity or Pulse to start a professional conversation about work or opportunities.
                </p>
              </div>
            ) : messenger.loadingChat ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 gap-2">
                <Loader2 className="w-5 h-5 animate-spin" /> Loading conversation…
              </div>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-slate-800/60 flex items-center gap-3">
                  {peer && <Avatar name={peer.name} url={peer.avatarUrl} />}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-100 truncate">
                      {messenger.activeConversation?.title ?? peer?.name ?? 'Conversation'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">{peer?.headline ?? messenger.activeConversation?.type}</p>
                  </div>
                  {peer && (
                    <Link
                      href={personalProfilePath(peer.username, peer.userId)}
                      className="text-xs text-violet-300 hover:underline shrink-0"
                    >
                      View identity
                    </Link>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[360px]">
                  {messenger.messages.map((msg) => (
                    <MessageBubble key={msg.id} message={msg} peerName={peer?.name ?? 'Member'} />
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                <div className="px-3 py-2 border-t border-slate-800/60 flex flex-wrap gap-1.5">
                  <QuickBtn icon={Calendar} label="Appointment" onClick={() => setAppointmentOpen(true)} />
                  <QuickBtn icon={Phone} label="Audio call" onClick={() => { setCallType('audio'); setCallOpen(true) }} />
                  <QuickBtn icon={Video} label="Video call" onClick={() => { setCallType('video'); setCallOpen(true) }} />
                  <QuickBtn icon={Sparkles} label="Improve with AI" onClick={() => void handleAiImprove()} loading={aiLoading} />
                </div>

                <div className="p-3 border-t border-slate-800/60 flex gap-2">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        void handleSend()
                      }
                    }}
                    rows={2}
                    placeholder="Write a professional message…"
                    className="flex-1 rounded-xl border border-slate-700/50 bg-slate-900/50 px-3 py-2 text-sm text-slate-200 resize-none"
                  />
                  <button
                    type="button"
                    disabled={messenger.sending || !draft.trim()}
                    onClick={() => void handleSend()}
                    className="shrink-0 self-end rounded-xl bg-violet-600 hover:bg-violet-500 px-4 py-2 text-white cursor-pointer disabled:opacity-50"
                  >
                    {messenger.sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </>
            )}
          </main>

          {/* Right panel */}
          <aside className="rounded-2xl border border-slate-700/40 bg-slate-950/60 p-4 space-y-4 hidden lg:block">
            <ContextPanel
              peer={peer ?? undefined}
              conversation={messenger.activeConversation}
              appointments={messenger.appointments}
              calls={messenger.calls}
              viewerId={viewerId}
              onRespondAppointment={messenger.respondAppointment}
              onRespondCall={messenger.respondCall}
            />
          </aside>
        </div>
      </PlatformContent>
      </PlatformShell>

      <AppointmentRequestModal
        open={appointmentOpen}
        onClose={() => setAppointmentOpen(false)}
        onSubmit={async (time, msg) => {
          if (!conversationId) return
          await createAppointmentRequest(conversationId, time, msg)
          await messenger.loadConversation(conversationId)
          addToast({ variant: 'success', title: 'Appointment request sent' })
        }}
      />
      <CallRequestModal
        open={callOpen}
        callType={callType}
        onClose={() => setCallOpen(false)}
        onSubmit={async (scheduled, msg) => {
          if (!conversationId) return
          await createCallRequest(conversationId, callType, scheduled, msg)
          await messenger.loadConversation(conversationId)
          addToast({ variant: 'success', title: 'Call request sent' })
        }}
      />
    </AppShell>
  )
}

function Avatar({ name, url, size = 'md' }: { name: string; url?: string | null; size?: 'sm' | 'md' }) {
  const sz = size === 'sm' ? 'w-8 h-8 text-[10px]' : 'w-10 h-10 text-xs'
  const initials = name.replace('@', '').slice(0, 2).toUpperCase()
  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={url} alt="" className={cn('rounded-full object-cover border border-violet-500/30 shrink-0', sz)} />
    )
  }
  return (
    <div className={cn('rounded-full bg-violet-500/20 flex items-center justify-center font-bold text-violet-200 shrink-0', sz)}>
      {initials}
    </div>
  )
}

function MessageBubble({
  message,
  peerName,
}: {
  message: { body: string; isOwn: boolean; messageType: string; createdAt: string; metadata: Record<string, unknown> }
  peerName: string
}) {
  const isSystem = message.messageType === 'system'
  const isSpecial = message.messageType === 'appointment_request' || message.messageType === 'call_request'

  if (isSystem) {
    return (
      <p className="text-center text-[10px] text-slate-500 px-4 py-1">{message.body}</p>
    )
  }

  return (
    <div className={cn('flex', message.isOwn ? 'justify-end' : 'justify-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-3 py-2 text-sm',
          message.isOwn
            ? 'bg-violet-600/80 text-white rounded-br-md'
            : 'bg-slate-800/80 text-slate-200 rounded-bl-md',
          isSpecial && 'border border-cyan-500/30'
        )}
      >
        {!message.isOwn && <p className="text-[9px] text-slate-400 mb-0.5">{peerName}</p>}
        <p className="leading-relaxed whitespace-pre-wrap">{message.body}</p>
        <p className="text-[9px] opacity-60 mt-1">{new Date(message.createdAt).toLocaleString()}</p>
      </div>
    </div>
  )
}

function QuickBtn({
  icon: Icon,
  label,
  onClick,
  loading,
}: {
  icon: typeof Calendar
  label: string
  onClick: () => void
  loading?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1 rounded-lg border border-slate-700/50 px-2 py-1 text-[10px] text-slate-400 hover:border-violet-500/30 hover:text-violet-200 cursor-pointer disabled:opacity-50"
    >
      {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
      {label}
    </button>
  )
}

function ConnectedContactCard({
  contact,
  busy,
  onStartChat,
}: {
  contact: ConnectedContact
  busy: boolean
  onStartChat: () => void
}) {
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-2.5">
      <div className="flex items-center gap-2">
        <Avatar name={contact.name} url={contact.avatarUrl} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-slate-200 truncate">{contact.name}</p>
          <p className="text-[10px] text-slate-500 truncate">{contact.headline ?? 'Connected on JobAZ'}</p>
        </div>
      </div>
      <button
        type="button"
        disabled={busy}
        onClick={onStartChat}
        className="mt-2 w-full rounded-lg bg-violet-600/80 hover:bg-violet-500/80 py-1.5 text-[10px] font-medium text-white cursor-pointer disabled:opacity-50 inline-flex items-center justify-center gap-1"
      >
        {busy ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
        {contact.existingConversationId ? 'Open Relay' : 'Open Relay'}
      </button>
    </div>
  )
}

function RequestCard({
  request,
  viewerId,
  onAccept,
  onDecline,
}: {
  request: import('@/lib/messenger/types').ConversationRequest
  viewerId: string | null
  onAccept: () => void
  onDecline: () => void
}) {
  const isIncoming = viewerId === request.targetUserId
  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-3 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <Avatar name={request.requesterName} url={request.requesterAvatarUrl} size="sm" />
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-200 truncate">{request.requesterName}</p>
          <p className="text-[10px] text-slate-500 truncate">{request.requesterHeadline ?? 'Work inquiry'}</p>
        </div>
      </div>
      <p className="text-[11px] text-slate-400 mb-2 line-clamp-2">{request.message}</p>
      {isIncoming && (
        <div className="flex gap-1.5">
          <button type="button" onClick={onAccept} className="flex-1 rounded-lg bg-emerald-600/80 py-1 text-[10px] text-white cursor-pointer inline-flex items-center justify-center gap-1">
            <Check className="w-3 h-3" /> Accept
          </button>
          <button type="button" onClick={onDecline} className="flex-1 rounded-lg border border-slate-600 py-1 text-[10px] text-slate-400 cursor-pointer inline-flex items-center justify-center gap-1">
            <X className="w-3 h-3" /> Decline
          </button>
        </div>
      )}
    </div>
  )
}

function ContextPanel({
  peer,
  conversation,
  appointments,
  calls,
  viewerId,
  onRespondAppointment,
  onRespondCall,
}: {
  peer: MessengerParticipant | undefined
  conversation: import('@/lib/messenger/types').MessengerConversation | null
  appointments: import('@/lib/messenger/types').AppointmentRequestRow[]
  calls: import('@/lib/messenger/types').CallSessionRow[]
  viewerId: string | null
  onRespondAppointment: (id: string, accept: boolean) => Promise<void>
  onRespondCall: (id: string, accept: boolean) => Promise<void>
}) {
  return (
    <>
      <div>
        <h3 className="text-xs font-semibold text-slate-300 mb-2">Identity</h3>
        {peer ? (
          <div className="rounded-xl border border-slate-800/50 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Avatar name={peer.name} url={peer.avatarUrl} size="sm" />
              <div>
                <p className="text-xs font-medium text-slate-200">{peer.name}</p>
                <p className="text-[10px] text-slate-500">{peer.headline ?? 'JobAZ member'}</p>
              </div>
            </div>
            <Link href={personalProfilePath(peer.username, peer.userId)} className="text-[10px] text-violet-300 hover:underline">
              View full profile →
            </Link>
          </div>
        ) : (
          <p className="text-[10px] text-slate-500">Select a conversation</p>
        )}
      </div>

      {conversation?.relatedOpportunityPostId && (
        <div>
          <h3 className="text-xs font-semibold text-slate-300 mb-2">Related opportunity</h3>
          <div className="rounded-xl border border-cyan-500/20 bg-cyan-500/5 p-3">
            <p className="text-xs text-cyan-200 font-medium">{conversation.opportunityTitle ?? 'Pulse opportunity'}</p>
            {conversation.opportunityLocation && (
              <p className="text-[10px] text-slate-500 mt-1">{conversation.opportunityLocation}</p>
            )}
            <Link href="/feed" className="text-[10px] text-cyan-300/80 hover:underline mt-2 inline-block">
              View on Pulse →
            </Link>
          </div>
        </div>
      )}

      {appointments.filter((a) => a.status === 'pending').length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-300 mb-2">Appointment requests</h3>
          {appointments
            .filter((a) => a.status === 'pending')
            .map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-800/50 p-2 mb-2 text-[10px]">
                <p className="text-slate-300">{new Date(a.proposedTime).toLocaleString()}</p>
                <p className="text-slate-500 mt-0.5">{a.message}</p>
                {viewerId !== a.requesterId && (
                  <div className="flex gap-1 mt-2">
                    <button type="button" onClick={() => void onRespondAppointment(a.id, true)} className="flex-1 rounded bg-emerald-600/80 py-1 text-white cursor-pointer">Accept</button>
                    <button type="button" onClick={() => void onRespondAppointment(a.id, false)} className="flex-1 rounded border border-slate-600 py-1 cursor-pointer">Decline</button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      {calls.filter((c) => c.status === 'requested' || c.status === 'scheduled').length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-slate-300 mb-2">Call requests</h3>
          {calls
            .filter((c) => c.status === 'requested' || c.status === 'scheduled')
            .map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-800/50 p-2 mb-2 text-[10px]">
                <p className="text-slate-300 capitalize">{c.callType} call — {c.status}</p>
                {c.scheduledTime && <p className="text-slate-500">{new Date(c.scheduledTime).toLocaleString()}</p>}
                {c.status === 'scheduled' && (
                  <p className="text-cyan-400/80 mt-1">Live calls coming soon. Use this to agree a time.</p>
                )}
                {viewerId !== c.createdBy && c.status === 'requested' && (
                  <div className="flex gap-1 mt-2">
                    <button type="button" onClick={() => void onRespondCall(c.id, true)} className="flex-1 rounded bg-cyan-600/80 py-1 text-white cursor-pointer">Accept</button>
                    <button type="button" onClick={() => void onRespondCall(c.id, false)} className="flex-1 rounded border border-slate-600 py-1 cursor-pointer">Decline</button>
                  </div>
                )}
              </div>
            ))}
        </div>
      )}

      <div className="rounded-xl border border-slate-800/40 bg-slate-900/30 p-3">
        <div className="flex items-start gap-2">
          <Shield className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <p className="text-[10px] text-slate-500 leading-relaxed">
            Relay is for professional opportunities and business inquiries only. Report misuse via support.
          </p>
        </div>
      </div>
    </>
  )
}
