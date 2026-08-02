'use client'

import { useEffect, useState } from 'react'
import { JOB_ROUTE_TAGS } from '@/lib/admin/jobs/routeTags'
import { JOB_TYPES, emptyAdminJobInput, type AdminJob, type AdminJobInput } from '@/lib/admin/jobs/types'
import { cn } from '@/lib/utils'

type Props = {
  open: boolean
  initial?: AdminJob | null
  saving: boolean
  onClose: () => void
  onSave: (input: AdminJobInput, id?: string) => void
}

export default function JobFormModal({ open, initial, saving, onClose, onSave }: Props) {
  const [form, setForm] = useState<AdminJobInput>(emptyAdminJobInput())

  useEffect(() => {
    if (!open) return
    if (initial) {
      setForm({
        title: initial.title,
        companyName: initial.companyName,
        location: initial.location,
        salary: initial.salary,
        jobType: initial.jobType,
        description: initial.description,
        requirements: initial.requirements,
        benefits: initial.benefits,
        applyUrl: initial.applyUrl,
        companyWebsite: initial.companyWebsite,
        featured: initial.featured,
        partnerCompany: initial.partnerCompany,
        active: initial.active,
        expiryDate: initial.expiryDate,
        routeTags: initial.routeTags,
        priorityScore: initial.priorityScore,
        skillsTags: initial.skillsTags,
      })
    } else {
      setForm(emptyAdminJobInput())
    }
  }, [open, initial])

  if (!open) return null

  const toggleRoute = (tagId: string) => {
    setForm((f) => ({
      ...f,
      routeTags: f.routeTags.includes(tagId)
        ? f.routeTags.filter((t) => t !== tagId)
        : [...f.routeTags, tagId],
    }))
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-700/60 bg-slate-950 p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          {initial ? 'Edit Job' : 'Add Job'}
        </h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Job Title *" className="sm:col-span-2">
            <input
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Company Name *">
            <input
              value={form.companyName}
              onChange={(e) => setForm({ ...form, companyName: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Location">
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Salary">
            <input
              value={form.salary}
              onChange={(e) => setForm({ ...form, salary: e.target.value })}
              placeholder="e.g. £22,000 - £26,000"
              className={inputClass}
            />
          </Field>
          <Field label="Job Type">
            <select
              value={form.jobType}
              onChange={(e) => setForm({ ...form, jobType: e.target.value })}
              className={inputClass}
            >
              {JOB_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Apply URL" className="sm:col-span-2">
            <input
              value={form.applyUrl}
              onChange={(e) => setForm({ ...form, applyUrl: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Company Website" className="sm:col-span-2">
            <input
              value={form.companyWebsite}
              onChange={(e) => setForm({ ...form, companyWebsite: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Expiry Date" className="sm:col-span-2">
            <input
              type="date"
              value={form.expiryDate?.slice(0, 10) ?? ''}
              onChange={(e) =>
                setForm({
                  ...form,
                  expiryDate: e.target.value ? new Date(e.target.value).toISOString() : null,
                })
              }
              className={inputClass}
            />
            <p className="text-xs text-slate-500 mt-1">
              Optional. Leave empty to keep the listing live indefinitely. Expired jobs are hidden from Job Finder.
            </p>
          </Field>
          <Field label="Description *" className="sm:col-span-2">
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Requirements" className="sm:col-span-2">
            <textarea
              rows={3}
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              className={inputClass}
            />
          </Field>
          <Field label="Benefits" className="sm:col-span-2">
            <textarea
              rows={2}
              value={form.benefits}
              onChange={(e) => setForm({ ...form, benefits: e.target.value })}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="mt-4">
          <p className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Career Routes</p>
          <div className="flex flex-wrap gap-2">
            {JOB_ROUTE_TAGS.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleRoute(tag.id)}
                className={cn(
                  'text-xs px-2.5 py-1 rounded-full border transition',
                  form.routeTags.includes(tag.id)
                    ? 'border-violet-500/50 bg-violet-950/40 text-violet-200'
                    : 'border-slate-700 text-slate-500 hover:border-slate-600'
                )}
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={form.featured}
              onChange={(e) => setForm({ ...form, featured: e.target.checked })}
            />
            Featured
          </label>
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={form.partnerCompany}
              onChange={(e) => setForm({ ...form, partnerCompany: e.target.checked })}
            />
            Partner Company
          </label>
          <label className="flex items-center gap-2 text-slate-300">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm({ ...form, active: e.target.checked })}
            />
            Active
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button type="button" onClick={onClose} className={btnSecondary} disabled={saving}>
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave(form, initial?.id)}
            className={btnPrimary}
          >
            {saving ? 'Saving…' : 'Save Job'}
          </button>
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
  className,
}: {
  label: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <label className={cn('block', className)}>
      <span className="text-xs text-slate-500 mb-1 block">{label}</span>
      {children}
    </label>
  )
}

const inputClass =
  'w-full rounded-lg border border-slate-700/60 bg-slate-900/60 px-3 py-2 text-sm text-slate-100 focus:border-violet-500/50 focus:outline-none'
const btnPrimary =
  'px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50'
const btnSecondary =
  'px-4 py-2 rounded-lg text-sm font-medium border border-slate-600 text-slate-300 hover:bg-slate-800'
