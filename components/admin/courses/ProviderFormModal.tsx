'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { providerSlugFromName } from '@/lib/admin/providers/constants'
import {
  PROVIDER_ACCOUNT_STATUS_OPTIONS,
  PROVIDER_AFFILIATE_STATUS_OPTIONS,
  PROVIDER_COMMISSION_TYPE_OPTIONS,
  PROVIDER_TRACKING_METHOD_OPTIONS,
} from '@/lib/admin/providers/constants'
import type { CourseProvider, CourseProviderInput } from '@/lib/admin/providers/types'

type Props = {
  open: boolean
  provider: CourseProvider | null
  saving?: boolean
  onClose: () => void
  onSave: (input: CourseProviderInput, id?: string) => void | Promise<void>
}

const inputClass =
  'w-full rounded-xl border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50'

function emptyInput(): CourseProviderInput {
  return {
    name: '',
    slug: '',
    websiteUrl: '',
    affiliateDashboardUrl: '',
    affiliateStatus: 'Unknown',
    accountStatus: 'Unknown',
    defaultCommissionType: 'Unknown',
    defaultCommissionValue: '',
    defaultPublicOfferLabel: '',
    trackingMethod: 'Unknown',
    notes: '',
    contactEmail: '',
    loginNotes: '',
    payoutNotes: '',
    estimatedConversionRatePercent: 5,
    averageOrderValue: null,
    isActive: true,
  }
}

function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500">{hint}</span>}
    </label>
  )
}

export default function ProviderFormModal({ open, provider, saving, onClose, onSave }: Props) {
  const [form, setForm] = useState<CourseProviderInput>(emptyInput())

  useEffect(() => {
    if (!open) return
    if (provider) {
      const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = provider
      setForm(rest)
    } else {
      setForm(emptyInput())
    }
  }, [open, provider])

  if (!open) return null

  const set = <K extends keyof CourseProviderInput>(key: K, value: CourseProviderInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleNameChange = (name: string) => {
    setForm((prev) => ({
      ...prev,
      name,
      slug: provider ? prev.slug : providerSlugFromName(name),
    }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700/60 bg-slate-900 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/95 px-5 py-4">
          <h2 className="text-lg font-semibold text-slate-100">
            {provider ? 'Edit provider' : 'Add provider'}
          </h2>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form
          className="p-5 space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            void onSave(form, provider?.id)
          }}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Provider name">
              <input
                className={inputClass}
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
                required
              />
            </Field>
            <Field label="Slug">
              <input
                className={inputClass}
                value={form.slug}
                onChange={(e) => set('slug', e.target.value)}
                required
              />
            </Field>
            <Field label="Website URL">
              <input
                className={inputClass}
                value={form.websiteUrl}
                onChange={(e) => set('websiteUrl', e.target.value)}
                placeholder="https://"
              />
            </Field>
            <Field label="Affiliate dashboard URL">
              <input
                className={inputClass}
                value={form.affiliateDashboardUrl}
                onChange={(e) => set('affiliateDashboardUrl', e.target.value)}
                placeholder="https://"
              />
            </Field>
            <Field label="Account status">
              <select
                className={inputClass}
                value={form.accountStatus}
                onChange={(e) => set('accountStatus', e.target.value as CourseProviderInput['accountStatus'])}
              >
                {PROVIDER_ACCOUNT_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Affiliate status">
              <select
                className={inputClass}
                value={form.affiliateStatus}
                onChange={(e) => set('affiliateStatus', e.target.value as CourseProviderInput['affiliateStatus'])}
              >
                {PROVIDER_AFFILIATE_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Default commission type">
              <select
                className={inputClass}
                value={form.defaultCommissionType}
                onChange={(e) =>
                  set('defaultCommissionType', e.target.value as CourseProviderInput['defaultCommissionType'])
                }
              >
                {PROVIDER_COMMISSION_TYPE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Default commission value">
              <input
                className={inputClass}
                value={form.defaultCommissionValue}
                onChange={(e) => set('defaultCommissionValue', e.target.value)}
                placeholder="£30 or 20%"
              />
            </Field>
            <Field label="Default public offer label">
              <input
                className={inputClass}
                value={form.defaultPublicOfferLabel}
                onChange={(e) => set('defaultPublicOfferLabel', e.target.value)}
                placeholder="20% OFF"
              />
            </Field>
            <Field label="Tracking method">
              <select
                className={inputClass}
                value={form.trackingMethod}
                onChange={(e) => set('trackingMethod', e.target.value as CourseProviderInput['trackingMethod'])}
              >
                {PROVIDER_TRACKING_METHOD_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Est. conversion rate (%)" hint="Used for estimated revenue calculations">
              <input
                type="number"
                min={0}
                max={100}
                step={0.1}
                className={inputClass}
                value={form.estimatedConversionRatePercent}
                onChange={(e) => set('estimatedConversionRatePercent', Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Average order value (£)" hint="Fallback when course price is unknown">
              <input
                type="number"
                min={0}
                step={1}
                className={inputClass}
                value={form.averageOrderValue ?? ''}
                onChange={(e) =>
                  set('averageOrderValue', e.target.value ? Number(e.target.value) : null)
                }
                placeholder="Optional"
              />
            </Field>
            <Field label="Contact email">
              <input
                className={inputClass}
                value={form.contactEmail}
                onChange={(e) => set('contactEmail', e.target.value)}
              />
            </Field>
            <label className="flex items-center gap-2 text-sm text-slate-300 sm:col-span-2">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => set('isActive', e.target.checked)}
                className="rounded border-slate-600"
              />
              Active partner record
            </label>
          </div>

          <Field label="Notes">
            <textarea
              className={inputClass}
              rows={2}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
            />
          </Field>
          <Field label="Login notes">
            <textarea
              className={inputClass}
              rows={2}
              value={form.loginNotes}
              onChange={(e) => set('loginNotes', e.target.value)}
            />
          </Field>
          <Field label="Payout notes">
            <textarea
              className={inputClass}
              rows={2}
              value={form.payoutNotes}
              onChange={(e) => set('payoutNotes', e.target.value)}
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
              {saving ? 'Saving…' : provider ? 'Save changes' : 'Add provider'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
