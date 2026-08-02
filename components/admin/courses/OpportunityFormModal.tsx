'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  AFFILIATE_STATUS_OPTIONS,
  COMMERCIAL_STATUS_OPTIONS,
  OPPORTUNITY_COMMISSION_TYPE_OPTIONS,
  OPPORTUNITY_IMPORTANCE_OPTIONS,
  OPPORTUNITY_PRIORITY_PRESETS,
  OPPORTUNITY_PUBLISH_STATUS_OPTIONS,
  OPPORTUNITY_PURPOSE_OPTIONS,
  OPPORTUNITY_GOAL_OPTIONS,
  OPPORTUNITY_ROUTE_OPTIONS,
  OPPORTUNITY_STATUS_OPTIONS,
  PROVIDER_NAME_PRESETS,
  PROVIDER_STATUS_OPTIONS,
  RECOMMENDATION_TYPE_OPTIONS,
  TRACKING_METHOD_OPTIONS,
  VISIBILITY_STATUS_OPTIONS,
  EDUCATION_FIELD_FILTER_OPTIONS,
} from '@/lib/admin/opportunities/constants'
import type {
  CourseOpportunity,
  CourseOpportunityInput,
  OpportunityProviderInput,
} from '@/lib/admin/opportunities/types'
import {
  emptyCourseOpportunityInput,
  emptyOpportunityProviderInput,
} from '@/lib/admin/opportunities/types'

type Props = {
  open: boolean
  opportunity: CourseOpportunity | null
  saving?: boolean
  focusProviders?: boolean
  onClose: () => void
  onSave: (input: CourseOpportunityInput, id?: string) => void | Promise<void>
}

function Field({
  label,
  children,
  className,
  hint,
}: {
  label: string
  children: React.ReactNode
  className?: string
  hint?: string
}) {
  return (
    <label className={cn('block space-y-1.5', className)}>
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500">{hint}</span>}
    </label>
  )
}

const inputClass =
  'w-full rounded-xl border border-slate-700/60 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-violet-500/50'

export default function OpportunityFormModal({
  open,
  opportunity,
  saving = false,
  focusProviders = false,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<CourseOpportunityInput>(emptyCourseOpportunityInput())

  useEffect(() => {
    if (!open) return
    if (opportunity) {
      setForm({
        courseName: opportunity.courseName,
        shortLabel: opportunity.shortLabel,
        coursePurpose: opportunity.coursePurpose,
        priority: opportunity.priority,
        opportunityStatus: opportunity.opportunityStatus,
        publishStatus: opportunity.publishStatus,
        importance: opportunity.importance,
        notes: opportunity.notes,
        nextAction: opportunity.nextAction,
        publishedCourseId: opportunity.publishedCourseId,
        visibilityStatus: opportunity.visibilityStatus ?? 'internal',
        educationFields: opportunity.educationFields ?? [],
        specialisations: opportunity.specialisations ?? [],
        commercialStatus: opportunity.commercialStatus ?? 'no_link',
        suggestedSearchKeywords: opportunity.suggestedSearchKeywords ?? '',
        adminNotes: opportunity.adminNotes ?? '',
        canBeCourseCard: opportunity.canBeCourseCard ?? true,
        recommendationType: opportunity.recommendationType ?? 'course_type',
        routes: opportunity.routes.map((r) => ({
          routeKey: r.routeKey,
          routeLabel: r.routeLabel,
        })),
        goals: (opportunity.goals ?? []).map((g) => ({
          goalKey: g.goalKey,
          goalLabel: g.goalLabel,
        })),
        providers: opportunity.providers.map((p) => ({
          id: p.id,
          providerName: p.providerName,
          providerStatus: p.providerStatus,
          affiliateStatus: p.affiliateStatus,
          officialUrl: p.officialUrl,
          referralUrl: p.referralUrl,
          dashboardUrl: p.dashboardUrl,
          commissionType: p.commissionType,
          commissionValue: p.commissionValue,
          publicOfferLabel: p.publicOfferLabel,
          trackingMethod: p.trackingMethod,
          notes: p.notes,
          isPreferred: p.isPreferred,
        })),
      })
    } else {
      setForm(emptyCourseOpportunityInput())
    }
  }, [open, opportunity])

  if (!open) return null

  const set = <K extends keyof CourseOpportunityInput>(key: K, value: CourseOpportunityInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const toggleRoute = (routeKey: string, routeLabel: string, checked: boolean) => {
    setForm((prev) => {
      const routes = checked
        ? [...prev.routes, { routeKey, routeLabel }]
        : prev.routes.filter((r) => r.routeKey !== routeKey)
      return { ...prev, routes }
    })
  }

  const toggleGoal = (goalKey: string, goalLabel: string, checked: boolean) => {
    setForm((prev) => {
      const goals = checked
        ? [...(prev.goals ?? []), { goalKey, goalLabel }]
        : (prev.goals ?? []).filter((g) => g.goalKey !== goalKey)
      return { ...prev, goals }
    })
  }

  const updateProvider = (index: number, patch: Partial<OpportunityProviderInput>) => {
    setForm((prev) => {
      const providers = prev.providers.map((p, i) => (i === index ? { ...p, ...patch } : p))
      if (patch.isPreferred) {
        return {
          ...prev,
          providers: providers.map((p, i) => ({ ...p, isPreferred: i === index })),
        }
      }
      return { ...prev, providers }
    })
  }

  const addProvider = () => {
    setForm((prev) => ({
      ...prev,
      providers: [...prev.providers, emptyOpportunityProviderInput()],
    }))
  }

  const removeProvider = (index: number) => {
    setForm((prev) => ({
      ...prev,
      providers: prev.providers.filter((_, i) => i !== index),
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.courseName.trim()) return
    void onSave(form, opportunity?.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 md:p-8">
      <div className="relative w-full max-w-4xl rounded-2xl border border-slate-700/60 bg-slate-950 shadow-2xl">
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-violet-300">Internal tracker</p>
            <h2 className="text-lg font-semibold text-slate-50">
              {opportunity ? 'Edit course opportunity' : 'Add course opportunity'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 px-5 py-5">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Course / licence name *">
              <input
                required
                value={form.courseName}
                onChange={(e) => set('courseName', e.target.value)}
                placeholder="Food Safety Level 2"
                className={inputClass}
              />
            </Field>
            <Field label="Short label">
              <input
                value={form.shortLabel}
                onChange={(e) => set('shortLabel', e.target.value)}
                placeholder="Food Safety L2"
                className={inputClass}
              />
            </Field>
            <Field label="Course purpose">
              <select
                value={form.coursePurpose}
                onChange={(e) => set('coursePurpose', e.target.value)}
                className={inputClass}
              >
                <option value="">Select purpose…</option>
                {OPPORTUNITY_PURPOSE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select
                value={form.priority}
                onChange={(e) => set('priority', Number(e.target.value))}
                className={inputClass}
              >
                {OPPORTUNITY_PRIORITY_PRESETS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Importance">
              <select
                value={form.importance}
                onChange={(e) => set('importance', e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {OPPORTUNITY_IMPORTANCE_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Opportunity status">
              <select
                value={form.opportunityStatus}
                onChange={(e) => set('opportunityStatus', e.target.value)}
                className={inputClass}
              >
                {OPPORTUNITY_STATUS_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Publish status">
              <select
                value={form.publishStatus}
                onChange={(e) => set('publishStatus', e.target.value)}
                className={inputClass}
              >
                {OPPORTUNITY_PUBLISH_STATUS_OPTIONS.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Next action" className="md:col-span-2">
              <input
                value={form.nextAction}
                onChange={(e) => set('nextAction', e.target.value)}
                placeholder="Search affiliate providers"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Visibility status">
              <select
                value={form.visibilityStatus ?? 'internal'}
                onChange={(e) => set('visibilityStatus', e.target.value as CourseOpportunityInput['visibilityStatus'])}
                className={inputClass}
              >
                {VISIBILITY_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Commercial status">
              <select
                value={form.commercialStatus ?? 'no_link'}
                onChange={(e) => set('commercialStatus', e.target.value)}
                className={inputClass}
              >
                {COMMERCIAL_STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Recommendation type">
              <select
                value={form.recommendationType ?? ''}
                onChange={(e) => set('recommendationType', e.target.value)}
                className={inputClass}
              >
                <option value="">—</option>
                {RECOMMENDATION_TYPE_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Can be course card">
              <label className="inline-flex items-center gap-2 text-sm text-slate-300">
                <input
                  type="checkbox"
                  checked={form.canBeCourseCard ?? true}
                  onChange={(e) => set('canBeCourseCard', e.target.checked)}
                  className="rounded border-slate-600"
                />
                Show as structured recommendation card in Career Coach
              </label>
            </Field>
            <Field label="Suggested Google search keywords" className="md:col-span-2">
              <input
                value={form.suggestedSearchKeywords ?? ''}
                onChange={(e) => set('suggestedSearchKeywords', e.target.value)}
                placeholder="APM Project Management Foundation course UK"
                className={inputClass}
              />
            </Field>
            <Field label="Education fields" className="md:col-span-2">
              <div className="flex flex-wrap gap-2">
                {EDUCATION_FIELD_FILTER_OPTIONS.map((field) => {
                  const checked = (form.educationFields ?? []).includes(field)
                  return (
                    <label
                      key={field}
                      className={cn(
                        'inline-flex items-center gap-1.5 rounded-lg border px-2 py-1 text-xs cursor-pointer',
                        checked
                          ? 'border-fuchsia-500/40 bg-fuchsia-950/30 text-fuchsia-100'
                          : 'border-slate-800 text-slate-400'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const current = form.educationFields ?? []
                          set(
                            'educationFields',
                            e.target.checked
                              ? [...current, field]
                              : current.filter((f) => f !== field)
                          )
                        }}
                        className="rounded border-slate-600"
                      />
                      {field}
                    </label>
                  )
                })}
              </div>
            </Field>
            <Field label="Specialisations (comma-separated)" className="md:col-span-2">
              <input
                value={(form.specialisations ?? []).join(', ')}
                onChange={(e) =>
                  set(
                    'specialisations',
                    e.target.value
                      .split(',')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                placeholder="Electronic Engineering, Electrical Engineering"
                className={inputClass}
              />
            </Field>
            <Field label="Admin notes (why recommended)" className="md:col-span-2">
              <textarea
                value={form.adminNotes ?? ''}
                onChange={(e) => set('adminNotes', e.target.value)}
                rows={2}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Career routes">
            <div className="max-h-48 overflow-y-auto rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {OPPORTUNITY_ROUTE_OPTIONS.map((route) => {
                  const checked = form.routes.some((r) => r.routeKey === route.routeKey)
                  return (
                    <label
                      key={route.routeKey}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition',
                        checked
                          ? 'border-violet-500/40 bg-violet-950/30 text-violet-100'
                          : 'border-slate-800/80 text-slate-400 hover:border-slate-700'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleRoute(route.routeKey, route.routeLabel, e.target.checked)}
                        className="rounded border-slate-600"
                      />
                      <span>{route.routeLabel}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </Field>

          <Field label="Career goals">
            <div className="rounded-xl border border-slate-800/80 bg-slate-950/40 p-3">
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {OPPORTUNITY_GOAL_OPTIONS.map((goal) => {
                  const checked = (form.goals ?? []).some((g) => g.goalKey === goal.goalKey)
                  return (
                    <label
                      key={goal.goalKey}
                      className={cn(
                        'flex cursor-pointer items-center gap-2 rounded-lg border px-2.5 py-2 text-xs transition',
                        checked
                          ? 'border-fuchsia-500/40 bg-fuchsia-950/25 text-fuchsia-100'
                          : 'border-slate-800/80 text-slate-400 hover:border-slate-700'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => toggleGoal(goal.goalKey, goal.goalLabel, e.target.checked)}
                        className="rounded border-slate-600"
                      />
                      <span>{goal.goalLabel}</span>
                    </label>
                  )
                })}
              </div>
            </div>
          </Field>

          <Field label="Notes">
            <textarea
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              rows={3}
              className={cn(inputClass, 'resize-y')}
            />
          </Field>

          <div
            id="opportunity-providers"
            className={cn(
              'space-y-3 rounded-2xl border p-4',
              focusProviders ? 'border-violet-500/40 bg-violet-950/10' : 'border-slate-800/80 bg-slate-900/20'
            )}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">Provider options</h3>
                <p className="text-xs text-slate-500">Add multiple providers — mark one as preferred.</p>
              </div>
              <button
                type="button"
                onClick={addProvider}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700/60 px-3 py-1.5 text-xs text-slate-300 hover:border-violet-500/40 hover:text-violet-200"
              >
                <Plus className="h-3.5 w-3.5" />
                Add provider
              </button>
            </div>

            {!form.providers.length ? (
              <p className="text-sm text-slate-500">No providers yet.</p>
            ) : (
              <div className="space-y-4">
                {form.providers.map((provider, index) => (
                  <div
                    key={provider.id ?? index}
                    className="rounded-xl border border-slate-800/80 bg-slate-950/50 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-medium text-slate-400">Provider {index + 1}</p>
                      <button
                        type="button"
                        onClick={() => removeProvider(index)}
                        className="rounded-lg p-1.5 text-slate-500 hover:bg-red-500/10 hover:text-red-400"
                        title="Remove provider"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                      <Field label="Provider name">
                        <input
                          list="provider-name-presets"
                          value={provider.providerName}
                          onChange={(e) => updateProvider(index, { providerName: e.target.value })}
                          placeholder="Get Licensed"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Provider status">
                        <select
                          value={provider.providerStatus}
                          onChange={(e) => updateProvider(index, { providerStatus: e.target.value })}
                          className={inputClass}
                        >
                          {PROVIDER_STATUS_OPTIONS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Affiliate status">
                        <select
                          value={provider.affiliateStatus}
                          onChange={(e) => updateProvider(index, { affiliateStatus: e.target.value })}
                          className={inputClass}
                        >
                          {AFFILIATE_STATUS_OPTIONS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <label className="flex items-center gap-2 pt-6 text-sm text-slate-300">
                        <input
                          type="checkbox"
                          checked={provider.isPreferred}
                          onChange={(e) => updateProvider(index, { isPreferred: e.target.checked })}
                          className="rounded border-slate-600"
                        />
                        Preferred provider
                      </label>
                      <Field label="Official URL">
                        <input
                          value={provider.officialUrl}
                          onChange={(e) => updateProvider(index, { officialUrl: e.target.value })}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Referral URL">
                        <input
                          value={provider.referralUrl}
                          onChange={(e) => updateProvider(index, { referralUrl: e.target.value })}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Dashboard URL">
                        <input
                          value={provider.dashboardUrl}
                          onChange={(e) => updateProvider(index, { dashboardUrl: e.target.value })}
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Commission type">
                        <select
                          value={provider.commissionType}
                          onChange={(e) => updateProvider(index, { commissionType: e.target.value })}
                          className={inputClass}
                        >
                          {OPPORTUNITY_COMMISSION_TYPE_OPTIONS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Commission value">
                        <input
                          value={provider.commissionValue}
                          onChange={(e) => updateProvider(index, { commissionValue: e.target.value })}
                          placeholder="£30, 20%, Unknown"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Public offer label">
                        <input
                          value={provider.publicOfferLabel}
                          onChange={(e) => updateProvider(index, { publicOfferLabel: e.target.value })}
                          placeholder="20% OFF"
                          className={inputClass}
                        />
                      </Field>
                      <Field label="Tracking method">
                        <select
                          value={provider.trackingMethod}
                          onChange={(e) => updateProvider(index, { trackingMethod: e.target.value })}
                          className={inputClass}
                        >
                          {TRACKING_METHOD_OPTIONS.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Provider notes" className="md:col-span-2">
                        <textarea
                          value={provider.notes}
                          onChange={(e) => updateProvider(index, { notes: e.target.value })}
                          rows={2}
                          className={cn(inputClass, 'resize-y')}
                        />
                      </Field>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <datalist id="provider-name-presets">
            {PROVIDER_NAME_PRESETS.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-800/80 pt-4 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-xl border border-slate-700/60 px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-900 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || !form.courseName.trim()}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-5 py-2.5 text-sm font-semibold text-white hover:from-violet-500 hover:to-fuchsia-500 disabled:opacity-50"
            >
              {saving ? 'Saving…' : opportunity ? 'Save changes' : 'Add opportunity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
