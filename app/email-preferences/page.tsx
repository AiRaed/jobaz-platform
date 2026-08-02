'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { PlatformToolShell } from '@/components/dashboard/platform'
import PageHeader from '@/components/PageHeader'
import { supabase } from '@/lib/supabase'
import { buildAuthLoginUrl } from '@/lib/auth/redirect'
import type { UserEmailPreferences } from '@/lib/email-campaigns/types'
import { emptyPrefs } from '@/lib/email-campaigns/preferences'

export default function EmailPreferencesPage() {
  return (
    <Suspense
      fallback={
        <AppShell wide platform>
          <PlatformToolShell>
            <div className="py-16 text-center text-sm text-[var(--jaz-muted)]">Loading…</div>
          </PlatformToolShell>
        </AppShell>
      }
    >
      <EmailPreferencesInner />
    </Suspense>
  )
}

function EmailPreferencesInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [checking, setChecking] = useState(true)
  const [prefs, setPrefs] = useState<UserEmailPreferences | null>(null)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        router.replace(buildAuthLoginUrl('/email-preferences'))
        return
      }
      try {
        const res = await fetch('/api/email-preferences')
        const data = await res.json()
        if (!cancelled) {
          setPrefs(data.preferences || emptyPrefs(session.user.email || '', session.user.id))
          if (searchParams.get('unsubscribe') === '1') {
            setMessage('You can unsubscribe from all marketing below.')
          }
        }
      } catch {
        if (!cancelled && session.user.email) {
          setPrefs(emptyPrefs(session.user.email, session.user.id))
        }
      } finally {
        if (!cancelled) setChecking(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [router, searchParams])

  const save = async (patch: Partial<UserEmailPreferences> & { unsubscribe_all?: boolean }) => {
    if (!prefs) return
    setSaving(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/email-preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...prefs, ...patch }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not save')
      setPrefs(data.preferences)
      setMessage(patch.unsubscribe_all ? 'Unsubscribed from all marketing emails.' : 'Preferences saved.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save')
    } finally {
      setSaving(false)
    }
  }

  if (checking || !prefs) {
    return (
      <AppShell wide platform>
        <PlatformToolShell>
          <div className="py-16 text-center text-sm text-[var(--jaz-muted)]">Loading…</div>
        </PlatformToolShell>
      </AppShell>
    )
  }

  return (
    <AppShell wide platform>
      <PlatformToolShell>
        <PageHeader
          title="Email preferences"
          subtitle="Choose which JobAZ emails you want. Marketing is off unless you opt in."
          showBackToDashboard={false}
        />

        <div className="jobaz-card max-w-xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-4 dark:border-slate-700/50 dark:bg-slate-950/40">
          {message && (
            <p className="text-sm text-emerald-700 dark:text-emerald-300">{message}</p>
          )}
          {error && <p className="text-sm text-red-600 dark:text-red-300">{error}</p>}

          <p className="text-xs text-[var(--jaz-muted)] dark:text-slate-400">
            No boxes are pre-ticked for marketing. Plan reminders are optional service messages about
            your saved career plan.
          </p>

          <Toggle
            label="Job alerts"
            checked={prefs.job_alerts}
            onChange={(v) => setPrefs({ ...prefs, job_alerts: v })}
          />
          <Toggle
            label="Course alerts"
            checked={prefs.course_alerts}
            onChange={(v) => setPrefs({ ...prefs, course_alerts: v })}
          />
          <Toggle
            label="Local opportunity alerts"
            checked={prefs.local_opportunity_alerts}
            onChange={(v) => setPrefs({ ...prefs, local_opportunity_alerts: v })}
          />
          <Toggle
            label="Career tips"
            checked={prefs.career_tips}
            onChange={(v) => setPrefs({ ...prefs, career_tips: v })}
          />
          <Toggle
            label="Plan reminders"
            checked={prefs.plan_reminders}
            onChange={(v) => setPrefs({ ...prefs, plan_reminders: v })}
          />
          <Toggle
            label="Product updates"
            checked={prefs.product_updates}
            onChange={(v) => setPrefs({ ...prefs, product_updates: v })}
          />
          <Toggle
            label="General marketing consent"
            checked={prefs.marketing_consent}
            onChange={(v) => setPrefs({ ...prefs, marketing_consent: v })}
          />

          <div className="flex flex-wrap gap-2 pt-2">
            <button
              type="button"
              disabled={saving}
              className="jobaz-btn-primary"
              onClick={() => void save({})}
            >
              {saving ? 'Saving…' : 'Save preferences'}
            </button>
            <button
              type="button"
              disabled={saving}
              className="jobaz-btn-secondary"
              onClick={() => void save({ unsubscribe_all: true, unsubscribed_all: true })}
            >
              Unsubscribe from all marketing
            </button>
          </div>

          <p className="text-[11px] text-[var(--jaz-muted)] dark:text-slate-500">
            Prefer the header theme toggle and account tools?{' '}
            <Link href="/" className="text-violet-600 dark:text-violet-300 underline">
              Back to JobAZ
            </Link>
          </p>
        </div>
      </PlatformToolShell>
    </AppShell>
  )
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <label className="flex items-center justify-between gap-3 text-sm text-[var(--jaz-text)] dark:text-slate-200">
      <span>{label}</span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="rounded border-slate-400"
      />
    </label>
  )
}
