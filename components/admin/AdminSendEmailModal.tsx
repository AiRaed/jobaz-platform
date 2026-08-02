'use client'

import { useCallback, useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export type AdminEmailContext = {
  to: string
  userId?: string | null
  userName?: string | null
  route?: string | null
  targetRole?: string | null
  nextUpgrade?: string | null
  courseTitle?: string | null
  providerName?: string | null
}

type TemplateOption = {
  key: string
  label: string
  emailType: 'service' | 'marketing'
  description: string
}

const FALLBACK_TEMPLATES: TemplateOption[] = [
  {
    key: 'welcome',
    label: 'Welcome',
    emailType: 'service',
    description: 'Welcome new users.',
  },
  {
    key: 'continue_plan',
    label: 'Continue your plan',
    emailType: 'service',
    description: 'Remind user to open My Plan.',
  },
  {
    key: 'continue_cv',
    label: 'Continue your CV',
    emailType: 'service',
    description: 'Encourage CV improvement for the active plan.',
  },
  {
    key: 'recommended_course',
    label: 'Recommended course reminder',
    emailType: 'marketing',
    description: 'Requires marketing opt-in.',
  },
  {
    key: 'admin_custom',
    label: 'Custom message',
    emailType: 'service',
    description: 'Admin-written service message.',
  },
]

type Props = {
  open: boolean
  onClose: () => void
  context: AdminEmailContext | null
}

export default function AdminSendEmailModal({ open, onClose, context }: Props) {
  const [templates, setTemplates] = useState<TemplateOption[]>(FALLBACK_TEMPLATES)
  const [configured, setConfigured] = useState<boolean | null>(null)
  const [configMessage, setConfigMessage] = useState('Checking email configuration…')
  const [templateKey, setTemplateKey] = useState('welcome')
  const [customSubject, setCustomSubject] = useState('')
  const [customMessage, setCustomMessage] = useState('')
  const [previewHtml, setPreviewHtml] = useState('')
  const [previewSubject, setPreviewSubject] = useState('')
  const [previewType, setPreviewType] = useState<'service' | 'marketing'>('service')
  const [loadingPreview, setLoadingPreview] = useState(false)
  const [sending, setSending] = useState(false)
  const [banner, setBanner] = useState<string | null>(null)
  const [bannerTone, setBannerTone] = useState<'ok' | 'err' | 'warn'>('ok')

  const selected = templates.find((t) => t.key === templateKey) || templates[0]

  const loadStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/email/status')
      const data = await res.json()
      setConfigured(Boolean(data.configured))
      setConfigMessage(data.message || 'Email sending is not configured yet.')
      if (Array.isArray(data.templates) && data.templates.length) {
        setTemplates(data.templates)
      }
    } catch {
      setConfigured(false)
      setConfigMessage('Email sending is not configured yet.')
    }
  }, [])

  const runPreview = useCallback(async () => {
    if (!context?.to) return
    setLoadingPreview(true)
    setBanner(null)
    try {
      const res = await fetch('/api/admin/email/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateKey,
          to: context.to,
          userId: context.userId,
          userName: context.userName,
          route: context.route,
          targetRole: context.targetRole,
          nextUpgrade: context.nextUpgrade,
          courseTitle: context.courseTitle,
          providerName: context.providerName,
          subject: customSubject || undefined,
          customMessage: customMessage || undefined,
        }),
      })
      const data = await res.json()
      if (!data.ok) {
        setBanner(data.error || 'Preview failed')
        setBannerTone('err')
        return
      }
      setPreviewSubject(data.preview?.subject || '')
      setPreviewHtml(data.preview?.html || '')
      setPreviewType(data.preview?.emailType || selected?.emailType || 'service')
    } catch {
      setBanner('Preview failed')
      setBannerTone('err')
    } finally {
      setLoadingPreview(false)
    }
  }, [context, templateKey, customSubject, customMessage, selected?.emailType])

  useEffect(() => {
    if (!open) return
    setBanner(null)
    setTemplateKey('welcome')
    setCustomSubject('')
    setCustomMessage('')
    setPreviewHtml('')
    setPreviewSubject('')
    void loadStatus()
  }, [open, loadStatus])

  useEffect(() => {
    if (!open || !context?.to) return
    void runPreview()
  }, [open, context?.to, templateKey, runPreview])

  if (!open || !context) return null

  const send = async () => {
    setSending(true)
    setBanner(null)
    try {
      const res = await fetch('/api/admin/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateKey,
          to: context.to,
          userId: context.userId,
          userName: context.userName,
          route: context.route,
          targetRole: context.targetRole,
          nextUpgrade: context.nextUpgrade,
          courseTitle: context.courseTitle,
          providerName: context.providerName,
          subject: customSubject || undefined,
          customMessage: customMessage || undefined,
        }),
      })
      const data = await res.json()
      if (!data.ok) {
        setBanner(data.message || data.error || 'Send failed')
        setBannerTone(data.status === 'not_configured' ? 'warn' : 'err')
        return
      }
      setBanner(`Sent — log ${data.logId ? String(data.logId).slice(0, 8) + '…' : 'saved'}`)
      setBannerTone('ok')
    } catch {
      setBanner('Send failed')
      setBannerTone('err')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700 bg-slate-950 shadow-2xl">
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-slate-800 bg-slate-950/95 px-4 py-3 backdrop-blur">
          <div>
            <h2 className="text-sm font-semibold text-slate-100">Send email</h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              JobAZ application email via Resend — not Supabase Auth mail.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-200"
          >
            Close
          </button>
        </div>

        <div className="p-4 space-y-4">
          {configured === false ? (
            <p className="text-xs rounded-lg border border-amber-500/25 bg-amber-950/20 text-amber-100 px-3 py-2">
              {configMessage || 'Email sending is not configured yet.'}
            </p>
          ) : configured ? (
            <p className="text-[11px] text-emerald-300/90">Resend is configured.</p>
          ) : null}

          {banner ? (
            <p
              className={cn(
                'text-xs rounded-lg border px-3 py-2',
                bannerTone === 'ok'
                  ? 'border-emerald-500/25 bg-emerald-950/20 text-emerald-100'
                  : bannerTone === 'warn'
                    ? 'border-amber-500/25 bg-amber-950/20 text-amber-100'
                    : 'border-rose-500/25 bg-rose-950/20 text-rose-100'
              )}
            >
              {banner}
            </p>
          ) : null}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">To</p>
              <p className="text-slate-200 font-mono text-xs mt-1">{context.to}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-slate-500">User</p>
              <p className="text-slate-200 mt-1">{context.userName || '—'}</p>
            </div>
          </div>

          <label className="block text-xs text-slate-400 space-y-1">
            <span>Template</span>
            <select
              value={templateKey}
              onChange={(e) => setTemplateKey(e.target.value)}
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
            >
              {templates.map((t) => (
                <option key={t.key} value={t.key}>
                  {t.label} ({t.emailType})
                </option>
              ))}
            </select>
            <span className="text-[11px] text-slate-500">{selected?.description}</span>
          </label>

          {templateKey === 'admin_custom' ? (
            <div className="space-y-3">
              <label className="block text-xs text-slate-400 space-y-1">
                <span>Custom subject</span>
                <input
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="A message from JobAZ"
                />
              </label>
              <label className="block text-xs text-slate-400 space-y-1">
                <span>Custom message</span>
                <textarea
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  rows={4}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                  placeholder="Clear, practical message — no job/income guarantees."
                />
              </label>
            </div>
          ) : null}

          {previewType === 'marketing' ? (
            <p className="text-[11px] text-amber-200/90 rounded-lg border border-amber-500/20 bg-amber-950/15 px-3 py-2">
              Marketing template — send will be blocked unless marketing_allowed is true for this
              email.
            </p>
          ) : null}

          <div className="rounded-xl border border-slate-700/60 bg-slate-900/40 overflow-hidden">
            <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-slate-800">
              <p className="text-xs text-slate-300">
                Preview{previewSubject ? `: ${previewSubject}` : ''}
              </p>
              <button
                type="button"
                onClick={() => void runPreview()}
                disabled={loadingPreview}
                className="text-[11px] text-violet-300 hover:text-violet-200 disabled:opacity-50"
              >
                {loadingPreview ? 'Updating…' : 'Refresh preview'}
              </button>
            </div>
            <div className="max-h-64 overflow-auto bg-white">
              {previewHtml ? (
                <iframe
                  title="Email preview"
                  sandbox=""
                  srcDoc={previewHtml}
                  className="w-full h-64 border-0"
                />
              ) : (
                <p className="text-sm text-slate-500 p-4">No preview yet.</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void send()}
              disabled={sending || !context.to}
              className="rounded-lg bg-violet-600 px-3 py-2 text-xs font-medium text-white hover:bg-violet-500 disabled:opacity-50"
            >
              {sending ? 'Sending…' : 'Send email'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
