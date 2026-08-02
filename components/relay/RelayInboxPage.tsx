'use client'

import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  BookOpen,
  Briefcase,
  FileText,
  Headphones,
  Loader2,
  MessageSquare,
  Send,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import {
  PlatformContent,
  PlatformPageHeader,
  PlatformShell,
} from '@/components/dashboard/platform'
import CareerAuthWallModal from '@/components/home/CareerAuthWallModal'
import { supabase } from '@/lib/supabase'
import {
  RELAY_TYPE_LABELS,
  RELAY_TYPES,
  type RelayMessage,
  type RelayThread,
  type RelayType,
} from '@/lib/relay/types'
import { cn } from '@/lib/utils'

const QUICK: { type: RelayType; label: string; icon: typeof Headphones; hint: string }[] = [
  {
    type: 'jobaz_support',
    label: 'Contact JobAZ Support',
    icon: Headphones,
    hint: 'Account, product, or general help',
  },
  {
    type: 'cv_help',
    label: 'Ask for CV Help',
    icon: FileText,
    hint: 'CV Builder, layout, or UK CV tips',
  },
  {
    type: 'course_question',
    label: 'Ask about a course',
    icon: BookOpen,
    hint: 'Training types and Career Hub courses',
  },
  {
    type: 'opportunity_enquiry',
    label: 'Message about an opportunity',
    icon: Briefcase,
    hint: 'Enquiries go to the JobAZ Team in Phase 1',
  },
]

const inputClass =
  'w-full rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-surface)] px-3 py-2 text-sm text-[var(--jaz-text)] placeholder:text-[var(--jaz-muted)] focus:outline-none focus:ring-2 focus:ring-violet-500/40 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'

export default function RelayInboxPage() {
  const searchParams = useSearchParams()
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [authModal, setAuthModal] = useState(false)
  const [threads, setThreads] = useState<RelayThread[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<RelayMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [composeOpen, setComposeOpen] = useState(false)
  const [reply, setReply] = useState('')

  const [form, setForm] = useState({
    type: 'jobaz_support' as RelayType,
    subject: '',
    message: '',
    preferred_contact_time: '',
    related_opportunity_id: '',
    related_course_id: '',
    related_job_id: '',
    related_feed_post_id: '',
  })

  useEffect(() => {
    const type = searchParams.get('type') as RelayType | null
    if (type && RELAY_TYPES.includes(type)) {
      setForm((f) => ({ ...f, type }))
      setComposeOpen(true)
    }
    const opp = searchParams.get('opportunity') || searchParams.get('opportunity_id')
    const feedPost = searchParams.get('feed_post') || searchParams.get('post')
    const subject = searchParams.get('subject')
    if (opp) {
      setForm((f) => ({
        ...f,
        type: 'opportunity_enquiry',
        related_opportunity_id: opp,
        subject: subject || f.subject || 'Opportunity enquiry',
      }))
      setComposeOpen(true)
    }
    if (feedPost) {
      setForm((f) => ({
        ...f,
        type: 'opportunity_enquiry',
        related_feed_post_id: feedPost,
        subject: subject || f.subject || 'Pulse opportunity enquiry',
      }))
      setComposeOpen(true)
    }
    if (subject && !opp && !feedPost) {
      setForm((f) => ({ ...f, subject }))
    }
  }, [searchParams])

  const loadThreads = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        setAuthed(false)
        setThreads([])
        return
      }
      setAuthed(true)
      const res = await fetch('/api/relay', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setThreads(data.threads || [])
      if (data.note) setNote(data.note)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load Relay')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadThreads()
  }, [loadThreads])

  const openThread = async (id: string) => {
    setSelectedId(id)
    setComposeOpen(false)
    setBusy(true)
    try {
      const res = await fetch(`/api/relay?id=${encodeURIComponent(id)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setMessages(data.messages || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open thread')
    } finally {
      setBusy(false)
    }
  }

  const requireAuth = () => {
    if (authed) return true
    setAuthModal(true)
    return false
  }

  const startCompose = (type: RelayType) => {
    if (!requireAuth()) return
    setSelectedId(null)
    setMessages([])
    setForm((f) => ({
      ...f,
      type,
      subject:
        type === 'cv_help'
          ? 'CV help request'
          : type === 'course_question'
            ? 'Course question'
            : type === 'opportunity_enquiry'
              ? 'Opportunity enquiry'
              : type === 'business_enquiry'
                ? 'Business / work enquiry'
                : 'JobAZ support',
      message: '',
    }))
    setComposeOpen(true)
  }

  const submitCompose = async () => {
    if (!requireAuth()) return
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          type: form.type,
          subject: form.subject,
          message: form.message,
          preferred_contact_time: form.preferred_contact_time || null,
          related_opportunity_id: form.related_opportunity_id || null,
          related_course_id: form.related_course_id || null,
          related_job_id: form.related_job_id || null,
          related_feed_post_id: form.related_feed_post_id || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not send')
      setComposeOpen(false)
      setForm((f) => ({ ...f, message: '', preferred_contact_time: '' }))
      await loadThreads()
      if (data.thread?.id) await openThread(data.thread.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send')
    } finally {
      setBusy(false)
    }
  }

  const sendReply = async () => {
    if (!selectedId || !reply.trim()) return
    setBusy(true)
    try {
      const res = await fetch('/api/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', thread_id: selectedId, message: reply }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Reply failed')
      setReply('')
      await openThread(selectedId)
      await loadThreads()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reply failed')
    } finally {
      setBusy(false)
    }
  }

  const selected = threads.find((t) => t.id === selectedId) || null

  return (
    <AppShell wide platform>
      <PlatformShell
        pageHeader={
          <PlatformPageHeader
            title="Relay"
            dotColor="cyan"
            description="Professional work messages — limited Phase 1."
            badges={
              <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full border border-cyan-500/40 bg-cyan-500/10 text-cyan-300">
                Phase 1 inbox
              </span>
            }
          />
        }
      >
        <PlatformContent withAmbient>
          <p className="text-sm text-[var(--jaz-muted)] dark:text-slate-400 mb-4 max-w-2xl">
            Relay is your professional work inbox for opportunities, CV help, course questions, and
            JobAZ support. Full user-to-user messaging will open later as the community grows.
          </p>

          <div className="mb-4 rounded-xl border border-cyan-500/25 bg-cyan-950/15 dark:bg-cyan-950/20 px-4 py-3 text-xs text-cyan-900 dark:text-cyan-100/90">
            <p className="font-medium">Professional work messages — limited Phase 1.</p>
            <p className="opacity-80 mt-0.5">JobAZ support and opportunity enquiries only for now.</p>
          </div>

          {note && (
            <p className="mb-3 text-xs text-amber-700 dark:text-amber-200/90">{note}</p>
          )}
          {error && (
            <div className="mb-3 rounded-xl border border-red-500/30 bg-red-950/20 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-[280px_1fr] items-start">
            <aside className="space-y-3">
              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] dark:border-slate-800 dark:bg-slate-950/50 p-3 space-y-2">
                <p className="text-[10px] uppercase tracking-wider text-[var(--jaz-muted)] dark:text-slate-500 px-1">
                  New request
                </p>
                {QUICK.map((q) => (
                  <button
                    key={q.type}
                    type="button"
                    onClick={() => startCompose(q.type)}
                    className="w-full flex items-start gap-2 rounded-xl border border-[var(--border-subtle)] dark:border-slate-800 px-3 py-2.5 text-left hover:border-cyan-500/40 transition"
                  >
                    <q.icon className="w-4 h-4 text-cyan-500 mt-0.5 shrink-0" />
                    <span>
                      <span className="block text-xs font-semibold text-[var(--jaz-text)] dark:text-slate-100">
                        {q.label}
                      </span>
                      <span className="block text-[10px] text-[var(--jaz-muted)] dark:text-slate-500">
                        {q.hint}
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] dark:border-slate-800 dark:bg-slate-950/50 p-3">
                <p className="text-[10px] uppercase tracking-wider text-[var(--jaz-muted)] dark:text-slate-500 px-1 mb-2">
                  Your conversations
                </p>
                {loading ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-4 justify-center">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading…
                  </div>
                ) : !authed ? (
                  <p className="text-xs text-[var(--jaz-muted)] dark:text-slate-500 px-1 py-2">
                    Sign in to see your Relay inbox.
                  </p>
                ) : threads.length === 0 ? (
                  <p className="text-xs text-[var(--jaz-muted)] dark:text-slate-500 px-1 py-2">
                    No conversations yet.
                  </p>
                ) : (
                  <ul className="space-y-1.5">
                    {threads.map((t) => (
                      <li key={t.id}>
                        <button
                          type="button"
                          onClick={() => void openThread(t.id)}
                          className={cn(
                            'w-full text-left rounded-lg px-2.5 py-2 border transition',
                            selectedId === t.id
                              ? 'border-cyan-500/40 bg-cyan-500/10'
                              : 'border-transparent hover:bg-slate-900/40'
                          )}
                        >
                          <p className="text-xs font-medium text-[var(--jaz-text)] dark:text-slate-100 truncate">
                            {t.subject}
                          </p>
                          <p className="text-[10px] text-[var(--jaz-muted)] dark:text-slate-500">
                            {RELAY_TYPE_LABELS[t.type]} · {t.status}
                          </p>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </aside>

            <main className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] dark:border-slate-800 dark:bg-slate-950/40 min-h-[420px] p-4 md:p-5">
              {composeOpen ? (
                <div className="space-y-3 max-w-xl">
                  <h2 className="text-sm font-semibold text-[var(--jaz-text)] dark:text-slate-100">
                    New Relay message
                  </h2>
                  <label className="block text-xs text-[var(--jaz-muted)] dark:text-slate-400 space-y-1">
                    Message type
                    <select
                      className={inputClass}
                      value={form.type}
                      onChange={(e) =>
                        setForm({ ...form, type: e.target.value as RelayType })
                      }
                    >
                      {RELAY_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {RELAY_TYPE_LABELS[t]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block text-xs text-[var(--jaz-muted)] dark:text-slate-400 space-y-1">
                    Subject
                    <input
                      className={inputClass}
                      value={form.subject}
                      onChange={(e) => setForm({ ...form, subject: e.target.value })}
                    />
                  </label>
                  <label className="block text-xs text-[var(--jaz-muted)] dark:text-slate-400 space-y-1">
                    Message
                    <textarea
                      className={cn(inputClass, 'min-h-[140px]')}
                      value={form.message}
                      onChange={(e) => setForm({ ...form, message: e.target.value })}
                      placeholder="How can the JobAZ Team help?"
                    />
                  </label>
                  <label className="block text-xs text-[var(--jaz-muted)] dark:text-slate-400 space-y-1">
                    Preferred contact time (optional)
                    <input
                      className={inputClass}
                      value={form.preferred_contact_time}
                      onChange={(e) =>
                        setForm({ ...form, preferred_contact_time: e.target.value })
                      }
                      placeholder="e.g. Weekday evenings"
                    />
                  </label>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      className={inputClass}
                      placeholder="Opportunity ID (optional)"
                      value={form.related_opportunity_id}
                      onChange={(e) =>
                        setForm({ ...form, related_opportunity_id: e.target.value })
                      }
                    />
                    <input
                      className={inputClass}
                      placeholder="Course ID (optional)"
                      value={form.related_course_id}
                      onChange={(e) => setForm({ ...form, related_course_id: e.target.value })}
                    />
                    <input
                      className={inputClass}
                      placeholder="Job ID (optional)"
                      value={form.related_job_id}
                      onChange={(e) => setForm({ ...form, related_job_id: e.target.value })}
                    />
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void submitCompose()}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {busy ? 'Sending…' : 'Send to JobAZ Team'}
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-slate-600 px-3 py-2 text-xs text-slate-300"
                      onClick={() => setComposeOpen(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : selected ? (
                <div className="flex flex-col h-full min-h-[380px]">
                  <div className="border-b border-slate-800/60 pb-3 mb-3">
                    <p className="text-[10px] uppercase tracking-wider text-slate-500">
                      {RELAY_TYPE_LABELS[selected.type]} · {selected.status}
                    </p>
                    <h2 className="text-base font-semibold text-[var(--jaz-text)] dark:text-slate-100">
                      {selected.subject}
                    </h2>
                  </div>
                  <div className="flex-1 space-y-3 overflow-y-auto mb-3">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={cn(
                          'rounded-xl px-3 py-2 text-sm max-w-[90%]',
                          m.sender_role === 'user'
                            ? 'ml-auto bg-violet-600/20 border border-violet-500/25 text-slate-100'
                            : m.sender_role === 'admin'
                              ? 'bg-cyan-950/40 border border-cyan-500/25 text-cyan-50'
                              : 'bg-slate-900/60 border border-slate-700/50 text-slate-400 text-xs'
                        )}
                      >
                        <p className="text-[9px] uppercase tracking-wider opacity-70 mb-1">
                          {m.sender_role === 'admin'
                            ? 'JobAZ Team'
                            : m.sender_role === 'user'
                              ? 'You'
                              : 'System'}
                        </p>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                      </div>
                    ))}
                  </div>
                  {selected.status !== 'closed' && selected.status !== 'archived' && (
                    <div className="flex gap-2 border-t border-slate-800/60 pt-3">
                      <input
                        className={inputClass}
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Write a follow-up…"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            void sendReply()
                          }
                        }}
                      />
                      <button
                        type="button"
                        disabled={busy || !reply.trim()}
                        onClick={() => void sendReply()}
                        className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white shrink-0"
                      >
                        Send
                      </button>
                    </div>
                  )}
                </div>
              ) : threads.length > 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                  <MessageSquare className="w-10 h-10 text-cyan-500/50 mb-3" />
                  <p className="text-base font-semibold text-[var(--jaz-text)] dark:text-slate-100">
                    Select a conversation
                  </p>
                  <p className="text-sm text-[var(--jaz-muted)] dark:text-slate-400 mt-2 max-w-md">
                    Open a thread from the left, or start a new request to the JobAZ Team.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center text-center py-16 px-4">
                  <MessageSquare className="w-10 h-10 text-cyan-500/50 mb-3" />
                  <p className="text-base font-semibold text-[var(--jaz-text)] dark:text-slate-100">
                    No Relay messages yet.
                  </p>
                  <p className="text-sm text-[var(--jaz-muted)] dark:text-slate-400 mt-2 max-w-md">
                    When you ask about an opportunity, request CV help, or contact JobAZ support, your
                    conversations will appear here.
                  </p>
                  <div className="flex flex-wrap justify-center gap-2 mt-5">
                    {QUICK.slice(0, 3).map((q) => (
                      <button
                        key={q.type}
                        type="button"
                        onClick={() => startCompose(q.type)}
                        className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-xs font-semibold text-cyan-200"
                      >
                        {q.label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </main>
          </div>
        </PlatformContent>
      </PlatformShell>

      <CareerAuthWallModal
        isOpen={authModal}
        onClose={() => setAuthModal(false)}
        redirectTo="/messages"
        title="Sign in to use Relay"
        description="Create a free account to send opportunity enquiries, CV help requests, and JobAZ support messages."
        bullets={[
          'Contact JobAZ Support',
          'Ask for CV help',
          'Enquire about opportunities and courses',
        ]}
      />
    </AppShell>
  )
}
