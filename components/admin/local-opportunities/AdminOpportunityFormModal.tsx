'use client'

import { useEffect, useState } from 'react'
import {
  ADMIN_SAVE_STATUSES,
  CONTACT_METHODS,
  OPPORTUNITY_CATEGORIES,
  type AdminSaveStatus,
  type OpportunityRow,
} from '@/lib/opportunities/types'

type Props = {
  open: boolean
  initial?: OpportunityRow | null
  onClose: () => void
  onSaved: () => void
}

const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40 focus:border-violet-500/50'

const empty = {
  title: '',
  category: '',
  location: '',
  date_text: '',
  pay_text: '',
  description: '',
  contact_preference: 'Apply through JobAZ',
  contact_name: '',
  contact_email: '',
  contact_phone: '',
  business_name: '',
  poster_name: '',
  source: '',
  internal_note: '',
  contact_public: false,
  status: 'draft' as AdminSaveStatus,
  confirmed_real: false,
}

export default function AdminOpportunityFormModal({ open, initial, onClose, onSaved }: Props) {
  const [form, setForm] = useState(empty)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    if (initial) {
      const status = (ADMIN_SAVE_STATUSES as readonly string[]).includes(initial.status)
        ? (initial.status as AdminSaveStatus)
        : 'draft'
      setForm({
        title: initial.title ?? '',
        category: initial.category ?? '',
        location: initial.location ?? '',
        date_text: initial.date_text ?? '',
        pay_text: initial.pay_text ?? '',
        description: initial.description ?? '',
        contact_preference: initial.contact_preference || 'Apply through JobAZ',
        contact_name: initial.contact_name ?? '',
        contact_email: initial.contact_email ?? '',
        contact_phone: initial.contact_phone ?? '',
        business_name: initial.business_name ?? '',
        poster_name: initial.poster_name ?? '',
        source: initial.source ?? '',
        internal_note: initial.internal_note ?? '',
        contact_public: initial.contact_public ?? false,
        status,
        confirmed_real: true,
      })
    } else {
      setForm(empty)
    }
    setError(null)
  }, [open, initial])

  if (!open) return null

  const set = <K extends keyof typeof form>(key: K, value: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const submit = async (statusOverride?: AdminSaveStatus) => {
    setSubmitting(true)
    setError(null)
    const status = statusOverride ?? form.status
    try {
      const payload = { ...form, status, confirmed_real: form.confirmed_real }
      const res = await fetch('/api/admin/opportunities', {
        method: initial ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(initial ? { id: initial.id, ...payload } : payload),
      })
      const body = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(body.error || 'Save failed')
      onSaved()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={initial ? 'Edit opportunity' : 'Add opportunity'}
        className="relative z-10 w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
          <div>
            <h2 className="text-base font-semibold text-slate-50">
              {initial ? 'Edit opportunity' : 'Add opportunity'}
            </h2>
            <p className="text-[11px] text-slate-500">
              Admin listings can be saved as draft or published immediately.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg px-2 py-1 text-slate-400 hover:text-slate-100 hover:bg-white/5"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          {error && (
            <div className="rounded-lg border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">
              {error}
            </div>
          )}

          <Field label="Title *">
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="e.g. Weekend cleaner needed — Leeds"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Category *">
              <select
                className={inputClass}
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
              >
                <option value="">Select category</option>
                {OPPORTUNITY_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Location / postcode area *">
              <input
                className={inputClass}
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
                placeholder="e.g. Manchester M1"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Date or flexible">
              <input
                className={inputClass}
                value={form.date_text}
                onChange={(e) => set('date_text', e.target.value)}
                placeholder="This Saturday / Flexible"
              />
            </Field>
            <Field label="Estimated pay or budget">
              <input
                className={inputClass}
                value={form.pay_text}
                onChange={(e) => set('pay_text', e.target.value)}
                placeholder="£80 / day"
              />
            </Field>
          </div>

          <Field label="Description *">
            <textarea
              className={`${inputClass} min-h-[100px]`}
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder="What needs doing, when, requirements…"
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Contact method">
              <select
                className={inputClass}
                value={form.contact_preference}
                onChange={(e) => set('contact_preference', e.target.value)}
              >
                {CONTACT_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Business / person name">
              <input
                className={inputClass}
                value={form.business_name}
                onChange={(e) => set('business_name', e.target.value)}
                placeholder="Salon / shop / person"
              />
            </Field>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Contact name">
              <input
                className={inputClass}
                value={form.contact_name}
                onChange={(e) => set('contact_name', e.target.value)}
              />
            </Field>
            <Field label="Contact email">
              <input
                type="email"
                className={inputClass}
                value={form.contact_email}
                onChange={(e) => set('contact_email', e.target.value)}
              />
            </Field>
            <Field label="Contact phone">
              <input
                className={inputClass}
                value={form.contact_phone}
                onChange={(e) => set('contact_phone', e.target.value)}
              />
            </Field>
          </div>

          <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.contact_public}
              onChange={(e) => set('contact_public', e.target.checked)}
              className="mt-0.5 rounded border-slate-600"
            />
            <span>
              Show phone/email publicly (only for phone/email contact methods — never show internal
              notes).
            </span>
          </label>

          <Field label="Posted by display name (optional)">
            <input
              className={inputClass}
              value={form.poster_name}
              onChange={(e) => set('poster_name', e.target.value)}
              placeholder="Defaults to business name"
            />
          </Field>

          <Field label="Source note (internal)">
            <input
              className={inputClass}
              value={form.source}
              onChange={(e) => set('source', e.target.value)}
              placeholder="e.g. Walk-in salon / WhatsApp contact"
            />
          </Field>

          <Field label="Internal note (not public)">
            <textarea
              className={`${inputClass} min-h-[72px]`}
              value={form.internal_note}
              onChange={(e) => set('internal_note', e.target.value)}
              placeholder="Private admin notes…"
            />
          </Field>

          <Field label="Status">
            <select
              className={inputClass}
              value={form.status}
              onChange={(e) => set('status', e.target.value as AdminSaveStatus)}
            >
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="filled">Filled</option>
            </select>
          </Field>

          <label className="flex items-start gap-2 text-xs text-slate-300 cursor-pointer">
            <input
              type="checkbox"
              checked={form.confirmed_real}
              onChange={(e) => set('confirmed_real', e.target.checked)}
              className="mt-0.5 rounded border-slate-600"
            />
            <span>This is a real opportunity collected by JobAZ/admin.</span>
          </label>
        </div>

        <div className="sticky bottom-0 flex flex-wrap gap-2 border-t border-slate-800 bg-slate-950/95 px-4 py-3">
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit('draft')}
            className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-600 text-slate-200 hover:bg-slate-800 disabled:opacity-40"
          >
            Save draft
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit('published')}
            className="px-3 py-2 rounded-lg text-xs font-semibold bg-violet-600 hover:bg-violet-500 text-white disabled:opacity-40"
          >
            {submitting ? 'Saving…' : 'Publish'}
          </button>
          <button
            type="button"
            disabled={submitting}
            onClick={() => void submit()}
            className="px-3 py-2 rounded-lg text-xs font-semibold border border-violet-500/40 text-violet-200 hover:bg-violet-950/40 disabled:opacity-40"
          >
            Save as {form.status}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-[10px] uppercase tracking-wider font-semibold text-slate-500">
        {label}
      </span>
      {children}
    </label>
  )
}
