'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { OPPORTUNITY_CATEGORIES } from '@/lib/opportunities/types'
import { cn } from '@/lib/utils'

const CONTACT_OPTIONS = [
  'Email via JobAZ after approval',
  'Phone (shared after interest)',
  'In-person / local meetup',
  'Other — described in listing',
] as const

export default function PostOpportunityForm() {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [dateText, setDateText] = useState('')
  const [payText, setPayText] = useState('')
  const [description, setDescription] = useState('')
  const [contactPreference, setContactPreference] = useState('')
  const [posterName, setPosterName] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    try {
      const res = await fetch('/api/opportunities', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          category,
          location,
          date_text: dateText,
          pay_text: payText,
          description,
          contact_preference: contactPreference,
          poster_name: posterName,
          terms_accepted: termsAccepted,
        }),
      })
      const body = (await res.json()) as { error?: string; message?: string }

      if (res.status === 401) {
        router.push(`/auth?mode=login&redirectTo=${encodeURIComponent('/opportunities/post')}`)
        return
      }
      if (!res.ok) throw new Error(body.error || 'Submission failed')

      setSuccess(
        body.message ||
          'Your opportunity has been submitted for review. It will appear after admin approval.'
      )
      setTitle('')
      setCategory('')
      setLocation('')
      setDateText('')
      setPayText('')
      setDescription('')
      setContactPreference('')
      setPosterName('')
      setTermsAccepted(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="jobaz-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 dark:border-slate-700/50 dark:bg-slate-950/40">
        <h2 className="text-lg font-semibold text-[var(--jaz-text)] dark:text-slate-50 mb-2">
          Submitted for review
        </h2>
        <p className="text-sm text-[var(--jaz-muted)] dark:text-slate-400 leading-relaxed mb-4">
          {success}
        </p>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="jobaz-btn-primary" onClick={() => setSuccess(null)}>
            Post another
          </button>
          <button
            type="button"
            className="jobaz-btn-secondary"
            onClick={() => router.push('/opportunities')}
          >
            Back to opportunities
          </button>
        </div>
      </div>
    )
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="jobaz-card rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 md:p-6 space-y-4 dark:border-slate-700/50 dark:bg-slate-950/40"
    >
      {error && (
        <div className="rounded-xl border border-red-300/60 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-500/40 dark:bg-red-950/30 dark:text-red-200">
          {error}
        </div>
      )}

      <Field label="Title" required>
        <input
          className="jobaz-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. One-day warehouse helper needed"
          maxLength={120}
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Category" required>
          <select
            className="jobaz-input"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            required
          >
            <option value="">Select category</option>
            {OPPORTUNITY_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Location / postcode area" required>
          <input
            className="jobaz-input"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Leeds LS1 / Manchester city centre"
            maxLength={120}
            required
          />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Date or flexible">
          <input
            className="jobaz-input"
            value={dateText}
            onChange={(e) => setDateText(e.target.value)}
            placeholder="e.g. This Saturday / Flexible this week"
            maxLength={80}
          />
        </Field>
        <Field label="Estimated pay or budget">
          <input
            className="jobaz-input"
            value={payText}
            onChange={(e) => setPayText(e.target.value)}
            placeholder="e.g. £80 for the day / £12–£14/hr"
            maxLength={80}
          />
        </Field>
      </div>

      <Field label="Short description" required>
        <textarea
          className="jobaz-input min-h-[110px] resize-y"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What needs doing, when, and any requirements…"
          maxLength={2000}
          required
        />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Contact preference" required>
          <select
            className="jobaz-input"
            value={contactPreference}
            onChange={(e) => setContactPreference(e.target.value)}
            required
          >
            <option value="">Select preference</option>
            {CONTACT_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Posted by (name / business)" required>
          <input
            className="jobaz-input"
            value={posterName}
            onChange={(e) => setPosterName(e.target.value)}
            placeholder="Your name or business"
            maxLength={120}
            required
          />
        </Field>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-[var(--jaz-text)] dark:text-slate-200 cursor-pointer">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(e) => setTermsAccepted(e.target.checked)}
          className="mt-1 rounded border-slate-400"
          required
        />
        <span>
          I confirm this is a <strong>real opportunity</strong>. Fake or misleading posts may be
          removed.
        </span>
      </label>

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" className="jobaz-btn-primary" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit for review'}
        </button>
        <button
          type="button"
          className="jobaz-btn-secondary"
          onClick={() => router.push('/opportunities')}
          disabled={submitting}
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

function Field({
  label,
  required,
  children,
}: {
  label: string
  required?: boolean
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span
        className={cn(
          'text-xs font-semibold uppercase tracking-wide text-[var(--jaz-muted)] dark:text-slate-400'
        )}
      >
        {label}
        {required ? ' *' : ''}
      </span>
      {children}
    </label>
  )
}
