'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import CoursePreviewPanel from '@/components/admin/courses/CoursePreviewPanel'
import CourseImageUpload from '@/components/admin/courses/CourseImageUpload'
import { cn } from '@/lib/utils'
import {
  ADMIN_ROUTE_TARGETS,
  categoryIdsForPathIds,
  isCategorySelected,
  toggleRouteCategory,
} from '@/lib/admin/courses/routeTargets'
import {
  COURSE_COMMISSION_TYPES,
  COURSE_LEVEL_OPTIONS,
  COURSE_PURPOSE_OPTIONS,
  COURSE_STATUSES,
  type AdminCourse,
  type AdminCourseInput,
  type CourseDeliveryMode,
  emptyAdminCourseInput,
} from '@/lib/admin/courses/types'
import {
  COURSE_DELIVERY_MODE_OPTIONS,
  OPTIONAL_COURSE_DELIVERY_MODE_OPTIONS,
} from '@/lib/admin/courses/deliveryModes'
import {
  COURSE_PUBLIC_BADGE_OPTIONS,
  type CoursePublicBadge,
} from '@/lib/admin/courses/publicBadges'
import { isKnownCourseLevel } from '@/lib/admin/courses/courseLevels'
import {
  formatAvailableLocationsForInput,
  parseAvailableLocationsInput,
  resolveLocationSummary,
} from '@/lib/admin/courses/courseLocations'
import { resolvePublicOffer } from '@/lib/admin/courses/publicOffer'
import CourseOfferBadge from '@/components/career-hub/marketplace/CourseOfferBadge'
import { CAREER_HUB_CATEGORIES } from '@/lib/career-hub/routeCategories'

type Props = {
  open: boolean
  course: AdminCourse | null
  /** Pre-fill when creating from Course Opportunity Tracker */
  initialInput?: Partial<AdminCourseInput> | null
  saving?: boolean
  onClose: () => void
  onSave: (input: AdminCourseInput, id?: string) => void | Promise<void>
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

export default function CourseFormModal({
  open,
  course,
  initialInput = null,
  saving = false,
  onClose,
  onSave,
}: Props) {
  const [form, setForm] = useState<AdminCourseInput>(emptyAdminCourseInput())

  useEffect(() => {
    if (!open) return
    if (course) {
      const { id: _id, clicks: _c, saves: _s, createdAt: _ca, updatedAt: _ua, ...rest } = course
      setForm(rest)
    } else if (initialInput) {
      setForm({ ...emptyAdminCourseInput(), ...initialInput })
    } else {
      setForm(emptyAdminCourseInput())
    }
  }, [open, course, initialInput])

  if (!open) return null

  const set = <K extends keyof AdminCourseInput>(key: K, value: AdminCourseInput[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const previewOffer = resolvePublicOffer(form)
  const previewLocation = resolveLocationSummary(form.locationSummary, form.location)

  const togglePublicBadge = (badge: CoursePublicBadge) => {
    setForm((prev) => {
      const current = prev.publicBadges ?? []
      const next = current.includes(badge)
        ? current.filter((b) => b !== badge)
        : [...current, badge]
      return { ...prev, publicBadges: next }
    })
  }

  const toggleDeliveryMode = (mode: CourseDeliveryMode) => {
    setForm((prev) => {
      const current = prev.deliveryModes ?? []
      const next = current.includes(mode)
        ? current.filter((m) => m !== mode)
        : [...current, mode]
      return {
        ...prev,
        deliveryModes: next,
        deliveryMode: next[0] ?? 'in_person',
      }
    })
  }

  const handleRouteToggle = (categoryId: string, checked: boolean) => {
    setForm((prev) => {
      const routeIds = toggleRouteCategory(prev.routeIds, categoryId, checked)
      const categories = categoryIdsForPathIds(routeIds)
      return {
        ...prev,
        routeIds,
        category: categories[0] ?? prev.category,
      }
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onSave(form, course?.id)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-2xl border border-violet-500/25 bg-slate-950 shadow-[0_0_60px_rgba(139,92,246,0.15)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-800/80 bg-slate-950/95 px-5 py-4 backdrop-blur">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-violet-300">
              {course ? 'Edit course' : 'Add course'}
            </p>
            <h2 className="text-lg font-semibold text-slate-100">
              {course ? course.title : 'New course listing'}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-700/60 p-2 text-slate-400 hover:text-slate-200 hover:border-slate-600 transition"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5">
          <div className="grid gap-8 xl:grid-cols-[1fr_320px]">
            <div className="space-y-8 min-w-0">
              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">Basic information</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Course title *" className="md:col-span-2">
                    <input
                      required
                      value={form.title}
                      onChange={(e) => set('title', e.target.value)}
                      className={inputClass}
                      placeholder="SIA Door Supervisor Training"
                    />
                  </Field>
                  <Field label="Short description *" className="md:col-span-2">
                    <textarea
                      required
                      rows={2}
                      value={form.shortDescription}
                      onChange={(e) => set('shortDescription', e.target.value)}
                      className={cn(inputClass, 'resize-y min-h-[64px]')}
                      placeholder="One-line summary for cards and search"
                    />
                  </Field>
                  <Field label="Full description" className="md:col-span-2">
                    <textarea
                      rows={4}
                      value={form.fullDescription}
                      onChange={(e) => set('fullDescription', e.target.value)}
                      className={cn(inputClass, 'resize-y min-h-[96px]')}
                      placeholder="Detailed course overview for future detail pages"
                    />
                  </Field>
                  <Field label="Primary category">
                    <select
                      value={form.category}
                      onChange={(e) => set('category', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Select category…</option>
                      {CAREER_HUB_CATEGORIES.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.id === 'maintenance' ? 'Maintenance & Facilities' : c.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field
                    label="Provider name"
                    hint="Free text for now — future providers table will replace this field."
                  >
                    <input
                      value={form.provider}
                      onChange={(e) => set('provider', e.target.value)}
                      className={inputClass}
                      placeholder="e.g. Newcastle College, Get Licensed, Reed"
                    />
                  </Field>
                  <Field
                    label="Location summary"
                    hint="Short label on course cards, e.g. UK-wide, Selected UK locations"
                  >
                    <input
                      value={form.locationSummary}
                      onChange={(e) => set('locationSummary', e.target.value)}
                      className={inputClass}
                      placeholder="Selected UK locations"
                    />
                  </Field>
                  <Field
                    label="Available locations"
                    className="md:col-span-2"
                    hint="One per line or comma-separated — shown on the course details page only"
                  >
                    <textarea
                      rows={4}
                      value={formatAvailableLocationsForInput(form.availableLocations)}
                      onChange={(e) =>
                        set('availableLocations', parseAvailableLocationsInput(e.target.value))
                      }
                      className={cn(inputClass, 'resize-y min-h-[96px]')}
                      placeholder="London, Nottingham, Derby, Southampton..."
                    />
                  </Field>
                  <Field
                    label="Legacy location (optional)"
                    hint="Fallback if summary is empty — older courses only"
                    className="md:col-span-2"
                  >
                    <input
                      value={form.location}
                      onChange={(e) => set('location', e.target.value)}
                      className={inputClass}
                      placeholder="London / Online / UK-wide"
                    />
                  </Field>
                  {previewLocation && (
                    <p className="md:col-span-2 text-[11px] text-slate-500">
                      Card preview location: <span className="text-slate-300">{previewLocation}</span>
                      {form.availableLocations.length > 0 && (
                        <span className="text-slate-600">
                          {' '}
                          · {form.availableLocations.length} detail location
                          {form.availableLocations.length === 1 ? '' : 's'}
                        </span>
                      )}
                    </p>
                  )}
                  <Field label="Delivery modes" className="md:col-span-2">
                    <div className="space-y-3">
                      <div className="flex flex-wrap gap-2">
                        {COURSE_DELIVERY_MODE_OPTIONS.map((option) => {
                          const selected = form.deliveryModes.includes(option.value)
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => toggleDeliveryMode(option.value)}
                              className={cn(
                                'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                                selected
                                  ? 'border-violet-500/50 bg-violet-500/15 text-violet-200'
                                  : 'border-slate-700/60 bg-slate-950/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                              )}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {OPTIONAL_COURSE_DELIVERY_MODE_OPTIONS.map((option) => {
                          const selected = form.deliveryModes.includes(option.value)
                          return (
                            <button
                              key={option.value}
                              type="button"
                              onClick={() => toggleDeliveryMode(option.value)}
                              className={cn(
                                'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                                selected
                                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-200'
                                  : 'border-slate-800/80 bg-slate-950/40 text-slate-500 hover:border-slate-700 hover:text-slate-300'
                              )}
                            >
                              {option.label}
                            </button>
                          )
                        })}
                      </div>
                      {form.deliveryModes.length === 0 && (
                        <p className="text-[11px] text-amber-400/90">Select at least one delivery mode.</p>
                      )}
                    </div>
                  </Field>
                  <Field
                    label="Course purpose"
                    hint="Used to help JobAZ recommend the right course based on the user's goal."
                  >
                    <select
                      value={form.coursePurpose}
                      onChange={(e) => set('coursePurpose', e.target.value)}
                      className={inputClass}
                    >
                      <option value="">Not set</option>
                      {COURSE_PURPOSE_OPTIONS.map((purpose) => (
                        <option key={purpose} value={purpose}>
                          {purpose}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Duration">
                    <input
                      value={form.duration}
                      onChange={(e) => set('duration', e.target.value)}
                      className={inputClass}
                      placeholder="4–6 days"
                    />
                  </Field>
                  <Field label="Level">
                    <select
                      value={form.level}
                      onChange={(e) => set('level', e.target.value)}
                      className={inputClass}
                    >
                      {COURSE_LEVEL_OPTIONS.map((level) => (
                        <option key={level} value={level}>
                          {level}
                        </option>
                      ))}
                      {form.level && !isKnownCourseLevel(form.level) && (
                        <option value={form.level}>{form.level} (custom)</option>
                      )}
                    </select>
                  </Field>
                  <Field label="Price">
                    <input
                      value={form.price}
                      onChange={(e) => set('price', e.target.value)}
                      className={inputClass}
                      placeholder="£200–300"
                    />
                  </Field>
                  <Field label="Funding type">
                    <input
                      value={form.fundingType}
                      onChange={(e) => set('fundingType', e.target.value)}
                      className={inputClass}
                      placeholder="Self-funded / Employer-funded"
                    />
                  </Field>
                  <CourseImageUpload
                    imageUrl={form.imageUrl}
                    courseId={course?.id}
                    onChange={(url) => set('imageUrl', url)}
                    inputClass={inputClass}
                  />
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Public badges / tags</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Optional labels shown on public course cards. Not visible in commission or internal fields.
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 rounded-xl border border-slate-800/80 bg-slate-900/30 p-4">
                  {COURSE_PUBLIC_BADGE_OPTIONS.map((badge) => {
                    const selected = form.publicBadges.includes(badge)
                    return (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => togglePublicBadge(badge)}
                        className={cn(
                          'rounded-full border px-3 py-1.5 text-xs font-medium transition',
                          selected
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                            : 'border-slate-700/60 bg-slate-950/60 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                        )}
                      >
                        {badge}
                      </button>
                    )
                  })}
                </div>
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Appears in routes *</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Select every career route where this course should appear in Career Hub.
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2 rounded-xl border border-slate-800/80 bg-slate-900/30 p-4 max-h-64 overflow-y-auto">
                  {ADMIN_ROUTE_TARGETS.map((target) => (
                    <label
                      key={target.categoryId}
                      className="flex items-start gap-2 text-sm text-slate-300 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-slate-800/40"
                    >
                      <input
                        type="checkbox"
                        checked={isCategorySelected(form.routeIds, target.categoryId)}
                        onChange={(e) => handleRouteToggle(target.categoryId, e.target.checked)}
                        className="mt-0.5 rounded border-slate-600"
                      />
                      <span>{target.label}</span>
                    </label>
                  ))}
                </div>
                {form.routeIds.length === 0 && (
                  <p className="text-xs text-amber-400/90">Select at least one route before saving.</p>
                )}
              </section>

              <section className="space-y-4">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Public user offer</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    User-facing marketing offer on course cards. Separate from internal commission fields below.
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 p-4 space-y-4">
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.publicOfferEnabled}
                      onChange={(e) => set('publicOfferEnabled', e.target.checked)}
                      className="rounded border-slate-600"
                    />
                    Show public offer on course card
                  </label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <Field
                      label="Offer label"
                      hint="Examples: 20% OFF, £30 OFF, Limited Offer"
                    >
                      <input
                        value={form.publicOfferLabel}
                        onChange={(e) => set('publicOfferLabel', e.target.value)}
                        className={inputClass}
                        placeholder="20% off"
                      />
                    </Field>
                    <Field label="Offer expiry date">
                      <input
                        type="date"
                        value={form.publicOfferExpiresAt}
                        onChange={(e) => set('publicOfferExpiresAt', e.target.value)}
                        className={inputClass}
                      />
                    </Field>
                    <Field
                      label="Offer description"
                      className="md:col-span-2"
                      hint="Short public message shown under the price, e.g. Partner offer via JobAZ"
                    >
                      <textarea
                        rows={2}
                        value={form.publicOfferDescription}
                        onChange={(e) => set('publicOfferDescription', e.target.value)}
                        className={cn(inputClass, 'resize-y')}
                        placeholder="Available when booking through our partner link"
                      />
                    </Field>
                    <Field label="Offer code">
                      <input
                        value={form.publicOfferCode}
                        onChange={(e) => set('publicOfferCode', e.target.value)}
                        className={inputClass}
                        placeholder="Optional discount code"
                      />
                    </Field>
                    <Field label="Offer terms" className="md:col-span-2">
                      <textarea
                        rows={2}
                        value={form.publicOfferTerms}
                        onChange={(e) => set('publicOfferTerms', e.target.value)}
                        className={cn(inputClass, 'resize-y')}
                        placeholder="Provider terms apply. Prices and availability may change."
                      />
                    </Field>
                  </div>
                  {previewOffer.badgeDisplay && (
                    <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-800/80 bg-slate-950/50 px-3 py-2.5">
                      <span className="text-xs text-slate-500">Card badge preview</span>
                      <CourseOfferBadge display={previewOffer.badgeDisplay} />
                      <span className="text-[11px] text-slate-600 hidden sm:inline">
                        Desktop shows two lines; mobile shows one line.
                      </span>
                    </div>
                  )}
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">Business information</h3>
                <p className="text-xs text-slate-500">Admin-only commission and priority fields are not shown publicly.</p>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Official URL">
                    <input
                      type="url"
                      value={form.officialUrl}
                      onChange={(e) => set('officialUrl', e.target.value)}
                      className={inputClass}
                      placeholder="https://…"
                    />
                  </Field>
                  <Field label="Referral URL">
                    <input
                      type="url"
                      value={form.referralUrl}
                      onChange={(e) => set('referralUrl', e.target.value)}
                      className={inputClass}
                      placeholder="https://…"
                    />
                  </Field>
                  <Field label="Priority order (higher = first)">
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={form.priorityOrder}
                      onChange={(e) => set('priorityOrder', Number(e.target.value) || 0)}
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Commission type">
                    <select
                      value={form.commissionType}
                      onChange={(e) =>
                        set('commissionType', e.target.value as AdminCourseInput['commissionType'])
                      }
                      className={inputClass}
                    >
                      {COURSE_COMMISSION_TYPES.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Commission value">
                    <input
                      value={form.commissionValue}
                      onChange={(e) => set('commissionValue', e.target.value)}
                      className={inputClass}
                      placeholder="e.g. 10% or £25"
                    />
                  </Field>
                  <Field label="Internal notes" className="md:col-span-2">
                    <textarea
                      rows={2}
                      value={form.internalNotes}
                      onChange={(e) => set('internalNotes', e.target.value)}
                      className={cn(inputClass, 'resize-y')}
                    />
                  </Field>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.partnerCourse}
                      onChange={(e) => set('partnerCourse', e.target.checked)}
                      className="rounded border-slate-600"
                    />
                    Partner course
                  </label>
                  <label className="flex items-center gap-2 text-sm text-slate-300">
                    <input
                      type="checkbox"
                      checked={form.featuredCourse}
                      onChange={(e) => set('featuredCourse', e.target.checked)}
                      className="rounded border-slate-600"
                    />
                    Featured course
                  </label>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">Publishing</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Status">
                    <select
                      value={form.status}
                      onChange={(e) => {
                        const status = e.target.value as AdminCourseInput['status']
                        setForm((prev) => ({
                          ...prev,
                          status,
                          showInCareerHub: status === 'published' ? true : prev.showInCareerHub,
                        }))
                      }}
                      className={inputClass}
                    >
                      {COURSE_STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 text-sm text-slate-300">
                      <input
                        type="checkbox"
                        checked={form.showInCareerHub}
                        onChange={(e) => set('showInCareerHub', e.target.checked)}
                        className="rounded border-slate-600"
                      />
                      Show in Career Hub
                    </label>
                  </div>
                </div>
              </section>

              <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2 border-t border-slate-800/60 xl:hidden">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-700/60 text-slate-300 hover:bg-slate-900/60 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={form.routeIds.length === 0 || form.deliveryModes.length === 0 || saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving…' : course ? 'Save changes' : 'Add course'}
                </button>
              </div>
            </div>

            <div className="xl:sticky xl:top-[72px] xl:self-start space-y-4">
              <CoursePreviewPanel form={form} />
              <div className="hidden xl:flex flex-col-reverse sm:flex-row gap-3 justify-end pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-slate-700/60 text-slate-300 hover:bg-slate-900/60 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={form.routeIds.length === 0 || form.deliveryModes.length === 0 || saving}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Saving…' : course ? 'Save changes' : 'Add course'}
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
