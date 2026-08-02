'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import {
  COMMISSION_REPORT_STATUS_OPTIONS,
  COMMISSION_REPORT_TYPE_OPTIONS,
} from '@/lib/admin/providers/constants'
import type {
  LinkedPublishedCourse,
  ProviderCommissionReportInput,
  ProviderWithMetrics,
} from '@/lib/admin/providers/types'

type Props = {
  open: boolean
  provider: ProviderWithMetrics | null
  saving?: boolean
  onClose: () => void
  onSave: (input: ProviderCommissionReportInput) => void | Promise<void>
}

const inputClass =
  'w-full rounded-xl border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50'

function emptyInput(providerId: string): ProviderCommissionReportInput {
  return {
    providerId,
    courseId: null,
    reportDate: new Date().toISOString().slice(0, 10),
    reportType: 'Manual',
    clicks: 0,
    referrals: 0,
    confirmedSales: 0,
    confirmedCommission: 0,
    currency: 'GBP',
    status: 'Pending',
    notes: '',
  }
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {children}
    </label>
  )
}

export default function CommissionReportFormModal({
  open,
  provider,
  saving,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<ProviderCommissionReportInput>(emptyInput(''))

  useEffect(() => {
    if (!open || !provider) return
    setForm(emptyInput(provider.id))
  }, [open, provider])

  if (!open || !provider) return null

  const set = <K extends keyof ProviderCommissionReportInput>(
    key: K,
    value: ProviderCommissionReportInput[K]
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const linkedCourses: LinkedPublishedCourse[] = provider.linkedCourses

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/95 px-5 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-100">Add confirmed report</h2>
            <p className="text-xs text-slate-500 mt-0.5">{provider.name}</p>
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          className="p-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void onSave(form)
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Report date">
              <input
                type="date"
                className={inputClass}
                value={form.reportDate}
                onChange={(e) => set('reportDate', e.target.value)}
                required
              />
            </Field>
            <Field label="Report type">
              <select
                className={inputClass}
                value={form.reportType}
                onChange={(e) =>
                  set('reportType', e.target.value as ProviderCommissionReportInput['reportType'])
                }
              >
                {COMMISSION_REPORT_TYPE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Course (optional)">
              <select
                className={inputClass}
                value={form.courseId ?? ''}
                onChange={(e) => set('courseId', e.target.value || null)}
              >
                <option value="">All courses / provider total</option>
                {linkedCourses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Status">
              <select
                className={inputClass}
                value={form.status}
                onChange={(e) =>
                  set('status', e.target.value as ProviderCommissionReportInput['status'])
                }
              >
                {COMMISSION_REPORT_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Clicks reported (optional)">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.clicks}
                onChange={(e) => set('clicks', Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Referrals">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.referrals}
                onChange={(e) => set('referrals', Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Confirmed sales">
              <input
                type="number"
                min={0}
                className={inputClass}
                value={form.confirmedSales}
                onChange={(e) => set('confirmedSales', Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Confirmed commission">
              <input
                type="number"
                min={0}
                step={0.01}
                className={inputClass}
                value={form.confirmedCommission}
                onChange={(e) => set('confirmedCommission', Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Currency">
              <input
                className={inputClass}
                value={form.currency}
                onChange={(e) => set('currency', e.target.value)}
              />
            </Field>
          </div>

          <Field label="Notes">
            <textarea
              className={inputClass}
              rows={3}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Dashboard period, invoice ref, etc."
            />
          </Field>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm text-slate-400 hover:text-slate-200 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white disabled:opacity-50"
            >
              {saving ? 'Saving…' : 'Save report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
