'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ArrowLeft, Mail, AlertTriangle, Sparkles, Send, Users } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import {
  CAMPAIGN_TYPE_LABELS,
  CAMPAIGN_TYPES,
  type AudienceRules,
  type CampaignDashboardStats,
  type CampaignRecipient,
  type CampaignType,
  type EmailCampaign,
  type MatchCandidate,
} from '@/lib/email-campaigns/types'
import { cn } from '@/lib/utils'

type TabId = 'campaigns' | 'create' | 'matching' | 'logs' | 'preferences'

const inputClass =
  'w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/40'

const TABS: { id: TabId; label: string }[] = [
  { id: 'campaigns', label: 'Campaigns' },
  { id: 'create', label: 'Create Campaign' },
  { id: 'matching', label: 'AI Recipient Matching' },
  { id: 'logs', label: 'Email Logs' },
  { id: 'preferences', label: 'Preferences / Consent' },
]

const emptyStats: CampaignDashboardStats = {
  total_campaigns: 0,
  draft_campaigns: 0,
  sent_campaigns: 0,
  users_with_consent: 0,
  users_unsubscribed: 0,
  last_campaign_sent_at: null,
  plan_reminder_sent: 0,
  alert_emails_sent: 0,
  email_configured: false,
  email_config_message: 'Email sending is not configured yet.',
  tracking_notes: [],
}

export default function AdminEmailsPage() {
  const searchParams = useSearchParams()
  const initialTab = (searchParams.get('tab') as TabId | null) || 'campaigns'
  const initialType = searchParams.get('type') as CampaignType | null

  const [tab, setTab] = useState<TabId>(
    TABS.some((t) => t.id === initialTab) ? initialTab : 'campaigns'
  )
  const [stats, setStats] = useState<CampaignDashboardStats>(emptyStats)
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([])
  const [matchPreview, setMatchPreview] = useState<MatchCandidate[]>([])
  const [aiSummary, setAiSummary] = useState('')
  const [excludedSummary, setExcludedSummary] = useState('')
  const [warnings, setWarnings] = useState<string[]>([])
  const [logs, setLogs] = useState<Array<Record<string, unknown>>>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [campaignType, setCampaignType] = useState<CampaignType>(
    initialType && CAMPAIGN_TYPES.includes(initialType) ? initialType : 'plan_reminder'
  )
  const [rules, setRules] = useState<AudienceRules>({ inactive_days: 14 })
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')

  const selected = useMemo(
    () => campaigns.find((c) => c.id === selectedId) || null,
    [campaigns, selectedId]
  )

  const loadCampaigns = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/email-campaigns', { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to load')
      setCampaigns(data.campaigns || [])
      if (data.stats) setStats(data.stats)
      if (data.note) setMessage(data.note)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadCampaigns()
  }, [loadCampaigns])

  const loadCampaignDetail = async (id: string) => {
    setSelectedId(id)
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/email-campaigns?id=${encodeURIComponent(id)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed')
      setRecipients(data.recipients || [])
      if (data.campaign) {
        setSubject(data.campaign.draft_subject || '')
        setBody(data.campaign.draft_body || '')
        setAiSummary(data.campaign.ai_summary || '')
      }
      setTab('matching')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setBusy(false)
    }
  }

  const loadLogs = async () => {
    setBusy(true)
    try {
      const res = await fetch('/api/admin/email-campaigns?view=logs')
      const data = await res.json()
      setLogs(data.logs || [])
      if (data.note) setMessage(data.note)
    } finally {
      setBusy(false)
    }
  }

  const api = async (payload: Record<string, unknown>) => {
    setBusy(true)
    setError(null)
    setMessage(null)
    try {
      const res = await fetch('/api/admin/email-campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Request failed')
      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed')
      return null
    } finally {
      setBusy(false)
    }
  }

  const generateDraft = async () => {
    const data = await api({
      action: 'generate_draft',
      campaign_type: campaignType,
      audience_rules: rules,
    })
    if (!data) return
    setSubject(data.subject || '')
    setBody(data.body || '')
    setMessage('AI draft generated — review before saving.')
  }

  const createCampaign = async () => {
    const data = await api({
      action: 'create',
      title: title || `${CAMPAIGN_TYPE_LABELS[campaignType]} ${new Date().toLocaleDateString()}`,
      campaign_type: campaignType,
      audience_rules: rules,
      draft_subject: subject,
      draft_body: body,
      source_type: rules.source_title ? 'manual' : null,
    })
    if (!data?.campaign) return
    setMessage('Draft campaign saved.')
    await loadCampaigns()
    setSelectedId(data.campaign.id)
    setTab('matching')
  }

  const findMatches = async () => {
    if (!selectedId) {
      setError('Create or select a campaign first.')
      return
    }
    const data = await api({ action: 'match', campaign_id: selectedId })
    if (!data) return
    setMatchPreview(data.candidates || data.recipients || [])
    setAiSummary(data.ai_summary || '')
    setExcludedSummary(data.excluded_summary || '')
    setWarnings(data.compliance_warnings || [])
    if (data.tracking_notes?.length) {
      setMessage(data.tracking_notes.join(' · '))
    }
    await loadCampaignDetail(selectedId)
  }

  const approveAllAllowed = async () => {
    if (!selectedId) return
    const data = await api({
      action: 'update_recipients',
      campaign_id: selectedId,
      status: 'approve_all_allowed',
      recipient_ids: ['*'],
    })
    if (!data) return
    setMessage('Approved all consent-allowed recipients.')
    await loadCampaignDetail(selectedId)
  }

  const sendTest = async () => {
    if (!selectedId) return
    const data = await api({ action: 'send', campaign_id: selectedId, test_only: true })
    if (!data) return
    setMessage(data.result?.message || 'Test email attempted.')
  }

  const sendCampaign = async () => {
    if (!selectedId) return
    const allowed = recipients.filter((r) => r.status === 'approved' && r.consent_status === 'allowed')
    if (
      !confirm(
        `Send campaign to ${allowed.length} approved recipients?\n\nAdmin approval required. AI does not send automatically.`
      )
    ) {
      return
    }
    const data = await api({ action: 'send', campaign_id: selectedId })
    if (!data) return
    setMessage(data.message || 'Send finished.')
    await loadCampaigns()
    await loadCampaignDetail(selectedId)
  }

  const allowedCount = recipients.filter(
    (r) => r.consent_status === 'allowed' && (r.status === 'approved' || r.status === 'suggested')
  ).length
  const approvedCount = recipients.filter((r) => r.status === 'approved').length
  const excludedConsent = recipients.filter((r) => r.consent_status === 'excluded_no_consent').length
  const excludedUnsub = recipients.filter((r) => r.consent_status === 'excluded_unsubscribed').length

  return (
    <AppShell>
      <header className="mb-6 pb-4 border-b border-slate-800/60">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Admin home
        </Link>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl border border-violet-500/30 bg-violet-950/30 flex items-center justify-center">
            <Mail className="w-5 h-5 text-violet-300" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-50">Email Campaigns</h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              AI suggests matched recipients and draft copy. Admin must review and click Send.
              Only users with matching consent/preferences can be included.
            </p>
          </div>
        </div>
      </header>

      {!stats.email_configured && (
        <div className="mb-4 rounded-xl border border-amber-500/40 bg-amber-950/30 px-4 py-3 text-sm text-amber-100 flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold">Email sending is not configured yet.</p>
            <p className="text-amber-200/80 text-xs mt-1">
              {stats.email_config_message} You can still create drafts, match recipients, and preview.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <StatCard label="Total campaigns" value={stats.total_campaigns} />
        <StatCard label="Drafts" value={stats.draft_campaigns} />
        <StatCard label="Sent campaigns" value={stats.sent_campaigns} />
        <StatCard label="Users with consent" value={stats.users_with_consent} />
        <StatCard label="Unsubscribed" value={stats.users_unsubscribed} />
        <StatCard label="Plan reminders sent" value={stats.plan_reminder_sent} />
        <StatCard label="Alert campaigns sent" value={stats.alert_emails_sent} />
        <StatCard
          label="Last sent"
          value={
            stats.last_campaign_sent_at
              ? new Date(stats.last_campaign_sent_at).toLocaleDateString()
              : '—'
          }
        />
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id)
              if (t.id === 'logs') void loadLogs()
            }}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-semibold border',
              tab === t.id
                ? 'border-violet-400/50 bg-violet-600/30 text-white'
                : 'border-slate-700 text-slate-400 hover:text-slate-200'
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-500/40 bg-red-950/30 px-3 py-2 text-sm text-red-200">
          {error}
        </div>
      )}
      {message && (
        <div className="mb-4 rounded-xl border border-slate-700 bg-slate-900/50 px-3 py-2 text-sm text-slate-300">
          {message}
        </div>
      )}

      {tab === 'campaigns' && (
        <section>
          {loading ? (
            <p className="text-sm text-slate-400 py-8 text-center">Loading…</p>
          ) : campaigns.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">
              No campaigns yet. Create one in the Create Campaign tab.
            </p>
          ) : (
            <ul className="space-y-2">
              {campaigns.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-4 py-3 flex flex-wrap items-center justify-between gap-2"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-50">{c.title}</p>
                    <p className="text-[11px] text-slate-500">
                      {CAMPAIGN_TYPE_LABELS[c.campaign_type]} · {c.status} ·{' '}
                      {new Date(c.created_at).toLocaleString()}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-xs px-3 py-1.5 rounded-lg border border-violet-500/40 text-violet-200"
                    onClick={() => void loadCampaignDetail(c.id)}
                  >
                    Open / match
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'create' && (
        <section className="space-y-4 max-w-3xl">
          <Field label="Campaign title">
            <input
              className={inputClass}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. March SIA course alert"
            />
          </Field>
          <Field label="Campaign type">
            <select
              className={inputClass}
              value={campaignType}
              onChange={(e) => setCampaignType(e.target.value as CampaignType)}
            >
              {CAMPAIGN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {CAMPAIGN_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Target route">
              <input
                className={inputClass}
                value={rules.target_route || ''}
                onChange={(e) => setRules((r) => ({ ...r, target_route: e.target.value }))}
              />
            </Field>
            <Field label="Target role">
              <input
                className={inputClass}
                value={rules.target_role || ''}
                onChange={(e) => setRules((r) => ({ ...r, target_role: e.target.value }))}
              />
            </Field>
            <Field label="Location">
              <input
                className={inputClass}
                value={rules.location || ''}
                onChange={(e) => setRules((r) => ({ ...r, location: e.target.value }))}
              />
            </Field>
            <Field label="Source title (course/job/opportunity)">
              <input
                className={inputClass}
                value={rules.source_title || ''}
                onChange={(e) => setRules((r) => ({ ...r, source_title: e.target.value }))}
              />
            </Field>
            <Field label="User intent keywords">
              <input
                className={inputClass}
                value={rules.user_intent || ''}
                onChange={(e) => setRules((r) => ({ ...r, user_intent: e.target.value }))}
              />
            </Field>
            <Field label="Inactive days (plan reminders)">
              <input
                type="number"
                className={inputClass}
                value={rules.inactive_days ?? 14}
                onChange={(e) =>
                  setRules((r) => ({ ...r, inactive_days: Number(e.target.value) || 14 }))
                }
              />
            </Field>
          </div>
          <Field label="Draft subject">
            <input
              className={inputClass}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </Field>
          <Field label="Draft body">
            <textarea
              className="admin-email-input min-h-[180px]"
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </Field>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void generateDraft()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-cyan-500/40 text-cyan-100"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate AI draft
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void createCampaign()}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-violet-600 text-white"
            >
              Save draft
            </button>
          </div>
        </section>
      )}

      {tab === 'matching' && (
        <section className="space-y-4">
          {!selectedId ? (
            <p className="text-sm text-slate-400">Select or create a campaign first.</p>
          ) : (
            <>
              <div className="rounded-xl border border-violet-500/30 bg-violet-950/20 px-4 py-3 text-sm text-violet-100">
                <p className="font-semibold mb-1">{selected?.title}</p>
                <p className="text-xs text-violet-200/80 whitespace-pre-wrap">{aiSummary || 'No match summary yet.'}</p>
                {excludedSummary && (
                  <p className="text-xs text-amber-200/90 mt-2">{excludedSummary}</p>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void findMatches()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold border border-cyan-500/40 text-cyan-100"
                >
                  <Users className="w-3.5 h-3.5" />
                  Find matching users
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void approveAllAllowed()}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-emerald-500/40 text-emerald-100"
                >
                  Approve all allowed
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void sendTest()}
                  className="px-3 py-2 rounded-lg text-xs font-semibold border border-slate-600 text-slate-200"
                >
                  Send test to admin
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void sendCampaign()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-violet-600 text-white"
                >
                  <Send className="w-3.5 h-3.5" />
                  Send approved emails
                </button>
              </div>

              <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 px-4 py-3 text-xs text-amber-100 space-y-1">
                <p className="font-semibold">Admin approval required. AI does not send automatically.</p>
                <p>Subject: {subject || selected?.draft_subject || '—'}</p>
                <p>
                  Allowed (suggested): {allowedCount} · Approved: {approvedCount} · Excluded no
                  consent: {excludedConsent} · Unsubscribed: {excludedUnsub}
                </p>
                {warnings.map((w) => (
                  <p key={w}>• {w}</p>
                ))}
              </div>

              <div className="rounded-xl border border-slate-700 bg-slate-950/40 px-4 py-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2">
                  Preview subject / body
                </p>
                <p className="text-sm font-semibold text-slate-100 mb-2">
                  {subject || selected?.draft_subject}
                </p>
                <pre className="text-xs text-slate-400 whitespace-pre-wrap font-sans max-h-40 overflow-y-auto">
                  {body || selected?.draft_body}
                </pre>
              </div>

              <RecipientTable
                rows={
                  recipients.length
                    ? recipients.map((r) => ({
                        id: r.id,
                        email: r.email,
                        score: r.match_score,
                        reasons: r.match_reasons,
                        consent: r.consent_status,
                        status: r.status,
                        route: r.route,
                        role: r.target_role,
                        name: r.display_name,
                      }))
                    : matchPreview.map((c, i) => ({
                        id: String(i),
                        email: c.email,
                        score: c.match_score,
                        reasons: c.match_reasons,
                        consent: c.consent_status,
                        status: c.recommended_action,
                        route: c.route,
                        role: c.target_role,
                        name: c.display_name,
                      }))
                }
              />
            </>
          )}
        </section>
      )}

      {tab === 'logs' && (
        <section>
          {logs.length === 0 ? (
            <p className="text-sm text-slate-400 py-8 text-center">No email logs yet.</p>
          ) : (
            <ul className="space-y-2">
              {logs.map((log) => (
                <li
                  key={String(log.id)}
                  className="rounded-lg border border-slate-800 px-3 py-2 text-xs text-slate-300"
                >
                  <span className="font-semibold text-slate-100">{String(log.status)}</span>
                  {' · '}
                  {String(log.to_email)} · {String(log.subject)} ·{' '}
                  {log.created_at ? new Date(String(log.created_at)).toLocaleString() : ''}
                  {log.error_message ? (
                    <span className="text-red-300"> · {String(log.error_message)}</span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}

      {tab === 'preferences' && (
        <section className="max-w-xl space-y-3 text-sm text-slate-300">
          <p>
            Users manage preferences at{' '}
            <Link href="/email-preferences" className="text-violet-300 underline">
              /email-preferences
            </Link>
            .
          </p>
          <ul className="list-disc pl-5 space-y-1 text-slate-400 text-xs">
            <li>marketing_consent defaults to false (no assumed consent).</li>
            <li>Channel toggles: job / course / local opportunity / career tips / plan reminders.</li>
            <li>unsubscribed_all excludes all marketing campaigns.</li>
            <li>Users with consent: {stats.users_with_consent}</li>
            <li>Users unsubscribed: {stats.users_unsubscribed}</li>
          </ul>
          {stats.tracking_notes.map((n) => (
            <p key={n} className="text-xs text-amber-200/80">
              {n}
            </p>
          ))}
        </section>
      )}
    </AppShell>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950/50 px-3 py-3">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-50">{value}</p>
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

function RecipientTable({
  rows,
}: {
  rows: Array<{
    id: string
    email: string
    score: number
    reasons: string[]
    consent: string
    status: string
    route?: string | null
    role?: string | null
    name?: string | null
  }>
}) {
  if (!rows.length) {
    return <p className="text-sm text-slate-500">No recipients yet. Run Find matching users.</p>
  }
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800">
      <table className="min-w-full text-left text-xs">
        <thead className="bg-slate-900/80 text-slate-400">
          <tr>
            <th className="px-3 py-2">User</th>
            <th className="px-3 py-2">Route / role</th>
            <th className="px-3 py-2">Score</th>
            <th className="px-3 py-2">Consent</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">Why</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, 50).map((r) => (
            <tr key={r.id} className="border-t border-slate-800/80 text-slate-300">
              <td className="px-3 py-2">
                <div className="font-medium text-slate-100">{r.name || '—'}</div>
                <div className="text-slate-500">{r.email}</div>
              </td>
              <td className="px-3 py-2">
                {r.route || '—'}
                <div className="text-slate-500">{r.role || ''}</div>
              </td>
              <td className="px-3 py-2 tabular-nums">{r.score}</td>
              <td className="px-3 py-2">{r.consent}</td>
              <td className="px-3 py-2">{r.status}</td>
              <td className="px-3 py-2 max-w-xs">{(r.reasons || []).slice(0, 3).join('; ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
