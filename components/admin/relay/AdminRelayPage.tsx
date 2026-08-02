'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, MessageSquare } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import {
  RELAY_STATUS_LABELS,
  RELAY_STATUSES,
  RELAY_TYPE_LABELS,
  RELAY_TYPES,
  type RelayMessage,
  type RelayStatus,
  type RelayThread,
  type RelayType,
} from '@/lib/relay/types'
import { cn } from '@/lib/utils'

const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/40'

export default function AdminRelayPage() {
  const [threads, setThreads] = useState<RelayThread[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [messages, setMessages] = useState<RelayMessage[]>([])
  const [selected, setSelected] = useState<RelayThread | null>(null)
  const [statusFilter, setStatusFilter] = useState('open')
  const [typeFilter, setTypeFilter] = useState('all')
  const [reply, setReply] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [note, setNote] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('type', typeFilter)
      const res = await fetch(`/api/admin/relay?${params}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setThreads(data.threads || [])
      if (data.note) setNote(data.note)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter])

  useEffect(() => {
    void load()
  }, [load])

  const openThread = async (id: string) => {
    setSelectedId(id)
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/relay?id=${encodeURIComponent(id)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setSelected(data.thread)
      setMessages(data.messages || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const sendReply = async () => {
    if (!selectedId || !reply.trim()) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reply', thread_id: selectedId, message: reply }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Reply failed')
      setReply('')
      setMessage('Reply sent as JobAZ Team.')
      await openThread(selectedId)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Reply failed')
    } finally {
      setBusy(false)
    }
  }

  const setStatus = async (status: RelayStatus) => {
    if (!selectedId) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_status', thread_id: selectedId, status }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Update failed')
      setMessage(`Marked ${status}.`)
      if (data.thread) setSelected(data.thread)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusy(false)
    }
  }

  const archive = async () => {
    if (!selectedId) return
    if (!confirm('Archive this Relay thread?')) return
    setBusy(true)
    try {
      const res = await fetch('/api/admin/relay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive', thread_id: selectedId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Archive failed')
      setSelectedId(null)
      setSelected(null)
      setMessages([])
      setMessage('Thread archived.')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Archive failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <header className="mb-6 pb-5 border-b border-slate-800/60">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Admin home
        </Link>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl border border-cyan-500/30 bg-cyan-950/30 flex items-center justify-center">
            <MessageSquare className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-50">Relay Inbox</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Phase 1 professional inbox — opportunity enquiries, CV help, course questions, and
              support. Reply as JobAZ Team.
            </p>
          </div>
        </div>
      </header>

      {note && (
        <p className="mb-3 text-xs text-amber-200/90 rounded-lg border border-amber-500/30 bg-amber-950/20 px-3 py-2">
          {note}
        </p>
      )}
      {error && (
        <p className="mb-3 text-sm text-red-200 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2">
          {error}
        </p>
      )}
      {message && (
        <p className="mb-3 text-sm text-emerald-200 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-3 py-2">
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        <select
          className={cn(inputClass, 'w-auto')}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All statuses</option>
          {RELAY_STATUSES.map((s) => (
            <option key={s} value={s}>
              {RELAY_STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <select
          className={cn(inputClass, 'w-auto')}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All types</option>
          {RELAY_TYPES.map((t) => (
            <option key={t} value={t}>
              {RELAY_TYPE_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-[340px_1fr]">
        <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <p className="text-sm text-slate-500 py-8 text-center">Loading…</p>
          ) : threads.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">No Relay requests yet.</p>
          ) : (
            <ul className="space-y-1.5">
              {threads.map((t) => (
                <li key={t.id}>
                  <button
                    type="button"
                    onClick={() => void openThread(t.id)}
                    className={cn(
                      'w-full text-left rounded-lg px-3 py-2 border',
                      selectedId === t.id
                        ? 'border-cyan-500/40 bg-cyan-950/30'
                        : 'border-transparent hover:bg-slate-900/60'
                    )}
                  >
                    <p className="text-sm font-medium text-slate-100 truncate">{t.subject}</p>
                    <p className="text-[10px] text-slate-500">
                      {RELAY_TYPE_LABELS[t.type as RelayType] || t.type} · {t.status}
                    </p>
                    {t.body_preview && (
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">{t.body_preview}</p>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-950/40 p-4 min-h-[420px]">
          {!selected ? (
            <p className="text-sm text-slate-500 py-16 text-center">Select a request to reply.</p>
          ) : (
            <div className="flex flex-col h-full min-h-[400px]">
              <div className="border-b border-slate-800 pb-3 mb-3">
                <h2 className="text-base font-semibold text-slate-100">{selected.subject}</h2>
                <p className="text-xs text-slate-500 mt-1">
                  {RELAY_TYPE_LABELS[selected.type]} · {selected.status}
                  {selected.user_email ? ` · ${selected.user_email}` : ''}
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(['open', 'needs_follow_up', 'closed'] as RelayStatus[]).map((s) => (
                    <button
                      key={s}
                      type="button"
                      disabled={busy}
                      onClick={() => void setStatus(s)}
                      className="rounded-md border border-slate-700 px-2 py-1 text-[10px] text-slate-300"
                    >
                      {RELAY_STATUS_LABELS[s]}
                    </button>
                  ))}
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void archive()}
                    className="rounded-md border border-slate-700 px-2 py-1 text-[10px] text-slate-500"
                  >
                    Archive
                  </button>
                </div>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto mb-3">
                {messages.map((m) => (
                  <div
                    key={m.id}
                    className={cn(
                      'rounded-lg px-3 py-2 text-sm',
                      m.sender_role === 'admin'
                        ? 'bg-cyan-950/40 border border-cyan-500/20 text-cyan-50'
                        : m.sender_role === 'user'
                          ? 'bg-slate-900 border border-slate-700 text-slate-200'
                          : 'bg-slate-950 border border-slate-800 text-slate-500 text-xs'
                    )}
                  >
                    <p className="text-[9px] uppercase tracking-wider opacity-70 mb-1">
                      {m.sender_role === 'admin'
                        ? 'JobAZ Team'
                        : m.sender_role === 'user'
                          ? 'User'
                          : 'System'}
                    </p>
                    <p className="whitespace-pre-wrap">{m.body}</p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 border-t border-slate-800 pt-3">
                <textarea
                  className={cn(inputClass, 'min-h-[70px]')}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Reply as JobAZ Team…"
                />
                <button
                  type="button"
                  disabled={busy || !reply.trim()}
                  onClick={() => void sendReply()}
                  className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white self-end"
                >
                  Reply
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
