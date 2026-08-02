'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Check, Trash2, X, Ban, CircleDot, Plus, Pencil } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import AdminOpportunityFormModal from '@/components/admin/local-opportunities/AdminOpportunityFormModal'
import type { OpportunityRow, OpportunityStatus } from '@/lib/opportunities/types'
import { cn } from '@/lib/utils'

const FILTERS: { id: string; label: string }[] = [
  { id: 'pending_review', label: 'Pending' },
  { id: 'draft', label: 'Draft' },
  { id: 'published', label: 'Published' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'filled', label: 'Filled' },
  { id: 'all', label: 'All' },
]

export default function AdminLocalOpportunitiesManager() {
  const [status, setStatus] = useState('all')
  const [items, setItems] = useState<OpportunityRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<OpportunityRow | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/admin/opportunities?status=${encodeURIComponent(status)}`, {
        cache: 'no-store',
      })
      const body = (await res.json()) as { opportunities?: OpportunityRow[]; error?: string }
      if (!res.ok) throw new Error(body.error || 'Failed to load')
      setItems(body.opportunities ?? [])
    } catch (err) {
      setItems([])
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [status])

  useEffect(() => {
    void load()
  }, [load])

  const setItemStatus = async (id: string, next: OpportunityStatus) => {
    setBusyId(id)
    try {
      const res = await fetch('/api/admin/opportunities', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: next }),
      })
      const body = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(body.error || 'Update failed')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setBusyId(null)
    }
  }

  const softDelete = async (id: string) => {
    if (!confirm('Delete this opportunity? It will no longer appear publicly.')) return
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/opportunities?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      })
      const body = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(body.error || 'Delete failed')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setBusyId(null)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (item: OpportunityRow) => {
    setEditing(item)
    setFormOpen(true)
  }

  return (
    <AppShell>
      <header className="mb-6 pb-4 border-b border-slate-800/60">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Admin home
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-50">Local Work Opportunities</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Add real local opportunities yourself, or review user submissions. Only{' '}
              <strong className="text-slate-300 font-medium">published</strong> listings appear
              publicly.
            </p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold bg-violet-600 hover:bg-violet-500 text-white shadow-lg shadow-violet-900/30"
          >
            <Plus className="w-4 h-4" />
            Add Opportunity
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 mb-5">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setStatus(f.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold border transition',
              status === f.id
                ? 'border-violet-400/50 bg-violet-600/30 text-white'
                : 'border-slate-700 text-slate-400 hover:text-slate-200'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-slate-400 py-10 text-center">Loading…</p>
      ) : items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700 px-4 py-12 text-center">
          <p className="text-sm text-slate-400 mb-3">No opportunities in this filter.</p>
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-violet-600 text-white"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Opportunity
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-xl border border-slate-700/60 bg-slate-950/50 p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                <div>
                  <div className="flex flex-wrap items-center gap-1.5 mb-1">
                    <span className="text-[10px] uppercase tracking-widest text-violet-300/80">
                      {item.status.replace('_', ' ')}
                    </span>
                    <span className="text-[10px] text-slate-600">·</span>
                    <span className="text-[10px] uppercase tracking-widest text-slate-500">
                      {item.category || 'Uncategorised'}
                    </span>
                    <span
                      className={cn(
                        'text-[10px] font-semibold px-1.5 py-0.5 rounded border',
                        item.created_by_admin
                          ? 'border-cyan-500/30 text-cyan-200 bg-cyan-950/30'
                          : 'border-amber-500/30 text-amber-200 bg-amber-950/20'
                      )}
                    >
                      {item.created_by_admin ? 'Admin added' : 'User submitted'}
                    </span>
                  </div>
                  <h2 className="text-base font-semibold text-slate-50">{item.title}</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    {item.business_name || item.poster_name || 'Unknown poster'}
                    {item.user_email ? ` · ${item.user_email}` : ''}
                    {item.source ? ` · Source: ${item.source}` : ''}
                  </p>
                </div>
                <p className="text-[11px] text-slate-500 tabular-nums">
                  {new Date(item.created_at).toLocaleString()}
                </p>
              </div>

              <p className="text-sm text-slate-300 leading-relaxed mb-3 whitespace-pre-wrap line-clamp-4">
                {item.description}
              </p>

              <dl className="grid gap-1 sm:grid-cols-2 text-xs text-slate-400 mb-3">
                <div>
                  <dt className="inline text-slate-500">Location: </dt>
                  <dd className="inline">{item.location || '—'}</dd>
                </div>
                <div>
                  <dt className="inline text-slate-500">Pay: </dt>
                  <dd className="inline">{item.pay_text || '—'}</dd>
                </div>
                <div>
                  <dt className="inline text-slate-500">Date: </dt>
                  <dd className="inline">{item.date_text || '—'}</dd>
                </div>
                <div>
                  <dt className="inline text-slate-500">Contact: </dt>
                  <dd className="inline">{item.contact_preference || '—'}</dd>
                </div>
              </dl>

              {item.internal_note && (
                <p className="text-[11px] text-slate-500 mb-3 rounded-lg border border-slate-800 bg-slate-900/50 px-2.5 py-2">
                  <span className="font-semibold text-slate-400">Internal: </span>
                  {item.internal_note}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <ActionBtn
                  disabled={busyId === item.id}
                  onClick={() => openEdit(item)}
                  icon={<Pencil className="w-3.5 h-3.5" />}
                  label="Edit"
                />
                {item.status !== 'published' && (
                  <ActionBtn
                    disabled={busyId === item.id}
                    onClick={() => void setItemStatus(item.id, 'published')}
                    icon={<Check className="w-3.5 h-3.5" />}
                    label={item.created_by_admin ? 'Publish' : 'Approve'}
                    tone="ok"
                  />
                )}
                {item.status === 'published' && (
                  <ActionBtn
                    disabled={busyId === item.id}
                    onClick={() =>
                      void setItemStatus(
                        item.id,
                        item.created_by_admin ? 'draft' : 'pending_review'
                      )
                    }
                    icon={<Ban className="w-3.5 h-3.5" />}
                    label="Unpublish"
                  />
                )}
                {!item.created_by_admin && item.status !== 'rejected' && (
                  <ActionBtn
                    disabled={busyId === item.id}
                    onClick={() => void setItemStatus(item.id, 'rejected')}
                    icon={<X className="w-3.5 h-3.5" />}
                    label="Reject"
                    tone="warn"
                  />
                )}
                {item.status !== 'filled' && (
                  <ActionBtn
                    disabled={busyId === item.id}
                    onClick={() => void setItemStatus(item.id, 'filled')}
                    icon={<CircleDot className="w-3.5 h-3.5" />}
                    label="Mark filled"
                  />
                )}
                <ActionBtn
                  disabled={busyId === item.id}
                  onClick={() => void softDelete(item.id)}
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  label="Delete"
                  tone="danger"
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminOpportunityFormModal
        open={formOpen}
        initial={editing}
        onClose={() => {
          setFormOpen(false)
          setEditing(null)
        }}
        onSaved={() => void load()}
      />
    </AppShell>
  )
}

function ActionBtn({
  label,
  icon,
  onClick,
  disabled,
  tone,
}: {
  label: string
  icon: React.ReactNode
  onClick: () => void
  disabled?: boolean
  tone?: 'ok' | 'warn' | 'danger'
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition disabled:opacity-40',
        tone === 'ok' && 'border-emerald-500/40 text-emerald-200 hover:bg-emerald-950/40',
        tone === 'warn' && 'border-amber-500/40 text-amber-200 hover:bg-amber-950/40',
        tone === 'danger' && 'border-red-500/40 text-red-200 hover:bg-red-950/40',
        !tone && 'border-slate-600 text-slate-300 hover:bg-slate-800/60'
      )}
    >
      {icon}
      {label}
    </button>
  )
}
