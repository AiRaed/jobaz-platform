'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  BookmarkPlus,
  Building2,
  Check,
  Clock,
  ExternalLink,
  GraduationCap,
  MapPin,
  Sparkles,
  Star,
  TrendingUp,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { cn } from '@/lib/utils'
import type { MarketplaceCourse } from '@/lib/career-hub/marketplace/types'
import { canApplyToCourse, openCourseApply } from '@/lib/career-hub/marketplace/apply'
import { trackCourseEvent } from '@/lib/career-hub/marketplace/track'
import { getCareerOutcomesForPath, getSalaryInfoForPath } from '@/lib/career-hub/marketplace/outcomes'
import { isCourseSaved, saveCourseToPlan } from '@/lib/career-hub/marketplace/savedPlan'
import { upsertCareerPlanItem } from '@/lib/career-hub/myPlan'
import CourseOfferBadge from '@/components/career-hub/marketplace/CourseOfferBadge'
import CoursePurposePill from '@/components/career-hub/marketplace/CoursePurposePill'
import CourseMediaImage from '@/components/career-hub/CourseMediaImage'
import { formatOfferExpiry } from '@/lib/admin/courses/publicOffer'

type Props = {
  course: MarketplaceCourse
}

export default function CourseDetailView({ course }: Props) {
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setSaved(isCourseSaved(course.id))
  }, [course.id])

  const outcomes = getCareerOutcomesForPath(course.primaryPathId)
  const salary = getSalaryInfoForPath(course.primaryPathId)

  const canApply = canApplyToCourse(course)
  const offer = course.publicOffer
  const offerExpiry = offer?.expiresAt ? formatOfferExpiry(offer.expiresAt) : null

  const handleSave = () => {
    void trackCourseEvent({ courseId: course.id, source: 'course_detail', action: 'save_to_plan' })
    saveCourseToPlan(course, 'course_detail')
    upsertCareerPlanItem({
      courseName: course.title,
      courseSlug: course.slug,
      pathId: course.primaryPathId,
      status: 'saved',
      source: 'career_hub',
      priceFrom: course.priceLabel,
    })
    setSaved(true)
  }

  const handleApply = () => {
    openCourseApply(course, 'course_detail', 'apply_now')
  }

  return (
    <AppShell className="max-w-4xl">
      <Link
        href="/courses"
        className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Courses & Licences
      </Link>

      {/* SECTION 1 — Hero */}
      <section className="rounded-3xl border border-slate-700/60 bg-slate-950/60 overflow-hidden mb-8">
        {course.imageUrl ? (
          <div className="relative aspect-[21/9] bg-slate-900">
            <CourseMediaImage
              src={course.imageUrl}
              fit="cover"
              priority
              sizes="(max-width: 1280px) 100vw, 1200px"
            />
          </div>
        ) : (
          <div className="aspect-[21/9] bg-gradient-to-br from-violet-950/40 via-slate-900 to-cyan-950/30 flex items-center justify-center">
            <GraduationCap className="w-16 h-16 text-violet-400/40" />
          </div>
        )}

        <div className="p-6 md:p-8 space-y-5">
          <div className="flex flex-wrap gap-2">
            {course.isFeatured && (
              <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest rounded-full border border-violet-500/30 bg-violet-950/40 px-3 py-1 text-violet-300">
                <Sparkles className="w-3 h-3" />
                Featured
              </span>
            )}
            {course.isPartner && (
              <span className="text-[10px] uppercase tracking-widest rounded-full border border-cyan-500/30 bg-cyan-950/30 px-3 py-1 text-cyan-300">
                Partner course
              </span>
            )}
          </div>

          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {course.coursePurpose && <CoursePurposePill label={course.coursePurpose} />}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-50 leading-tight">{course.title}</h1>
            <p className="text-sm text-slate-400 mt-2">{course.shortDescription}</p>
            {course.coursePurpose && (
              <p className="text-xs text-slate-500 mt-2">
                Course purpose: <span className="text-slate-300">{course.coursePurpose}</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
            <MetaItem icon={Building2} label="Provider" value={course.providerLabel} />
            <MetaItem icon={MapPin} label="Location" value={course.locationSummary || course.location} />
            <MetaItem icon={Clock} label="Duration" value={course.durationLabel.replace(/^Duration:\s*/i, '')} />
            <MetaItem icon={Star} label="Price" value={course.priceLabel} />
            <MetaItem icon={GraduationCap} label="Level" value={course.levelLabel.replace(/^Level:\s*/i, '')} />
            <MetaItem icon={ExternalLink} label="Delivery" value={course.deliveryModeLabel} />
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2 course-actions min-w-0">
            {canApply ? (
              <button
                type="button"
                onClick={handleApply}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 shadow-[0_4px_24px_rgba(139,92,246,0.25)] transition"
              >
                Apply Now
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="space-y-1">
                <button
                  type="button"
                  disabled
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-medium border border-slate-700/50 bg-slate-900/40 text-slate-500 cursor-not-allowed"
                >
                  Provider not listed yet
                </button>
                <p className="text-[11px] text-slate-500">
                  Coming soon on JobAZ — save interest or search courses later.
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saved}
              className={cn(
                'inline-flex items-center justify-center gap-2 px-6 py-2 text-sm font-medium transition',
                saved ? 'text-emerald-400/90' : 'text-slate-400 hover:text-violet-300'
              )}
            >
              {saved ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
              {saved ? 'Saved to Plan' : 'Save to Plan'}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2 — Partner offer */}
      {offer?.visible && offer.badgeDisplay && (
        <Section title="Partner offer">
          <div className="rounded-xl border border-emerald-500/25 bg-emerald-950/15 p-4 space-y-3">
            <CourseOfferBadge display={offer.badgeDisplay} size="md" />
            {offer.description && (
              <p className="text-sm text-slate-300 leading-relaxed">{offer.description}</p>
            )}
            {offer.code && (
              <p className="text-sm text-slate-400">
                Code: <span className="font-mono text-emerald-300">{offer.code}</span>
              </p>
            )}
            {offer.terms && <p className="text-xs text-slate-500 leading-relaxed">{offer.terms}</p>}
            {offerExpiry && (
              <p className="text-xs text-amber-400/90">Offer expires: {offerExpiry}</p>
            )}
          </div>
        </Section>
      )}

      {/* SECTION 3 — Overview */}
      <Section title="Course Overview">
        <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
          {course.fullDescription || course.shortDescription || 'Course overview coming soon.'}
        </p>
      </Section>

      {course.availableLocations.length > 0 && (
        <Section title="Available locations">
          <div className="flex flex-wrap gap-2">
            {course.availableLocations.map((place) => (
              <span
                key={place}
                className="inline-flex items-center rounded-full border border-violet-500/25 bg-violet-950/25 px-3 py-1.5 text-sm text-slate-200"
              >
                {place}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* SECTION 4 — Funding */}
      <Section title="Funding Information">
        <p className="text-sm text-slate-300">{course.fundingLabel}</p>
        {course.priceLabel !== 'Contact provider for pricing' && (
          <p className="text-sm text-slate-400 mt-2">Typical price: {course.priceLabel}</p>
        )}
      </Section>

      {/* SECTION 5 — Career Outcomes */}
      <Section title="Career Outcomes">
        <ul className="grid sm:grid-cols-2 gap-2">
          {outcomes.map((o) => (
            <li
              key={o.title}
              className="rounded-xl border border-slate-700/50 bg-slate-900/40 px-4 py-3 text-sm text-slate-200"
            >
              {o.title}
            </li>
          ))}
        </ul>
      </Section>

      {/* SECTION 6 — Salary */}
      <Section title="Salary Information">
        <div className="grid sm:grid-cols-2 gap-4">
          <SalaryCard label="Starting" value={salary.starting} />
          <SalaryCard label="Experienced" value={salary.experienced} />
        </div>
        {salary.note && <p className="text-xs text-slate-500 mt-3">{salary.note}</p>}
        {salary.levels && salary.levels.length > 0 && (
          <ul className="mt-4 space-y-2">
            {salary.levels.map((l) => (
              <li key={l.label} className="flex justify-between text-sm text-slate-400 border-b border-slate-800/60 pb-2">
                <span>{l.label}</span>
                <span className="text-slate-200">{l.range}</span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* SECTION 7 — Apply CTA */}
      <section className="rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/30 to-fuchsia-950/20 p-8 text-center">
        <TrendingUp className="w-8 h-8 text-violet-400 mx-auto mb-3" />
        {canApply ? (
          <>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Ready to start this course?</h2>
            <p className="text-sm text-slate-400 mb-6 max-w-md mx-auto">
              Apply via JobAZ — we&apos;ll take you to the partner provider enrolment page.
            </p>
            <button
              type="button"
              onClick={handleApply}
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-base font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 transition"
            >
              Apply Now
              <ArrowRight className="w-5 h-5" />
            </button>
          </>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Provider not listed yet</h2>
            <p className="text-sm text-slate-400 max-w-md mx-auto">
              This course type is listed on JobAZ, but a partner enrolment link is not available yet.
              Save it to your plan or search courses later.
            </p>
          </>
        )}
      </section>
    </AppShell>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-950/40 p-6 mb-6">
      <h2 className="text-lg font-semibold text-slate-100 mb-4">{title}</h2>
      {children}
    </section>
  )
}

function MetaItem({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
}) {
  return (
    <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 px-3 py-2.5">
      <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-1">{label}</p>
      <p className="flex items-center gap-1.5 text-sm text-slate-200">
        <Icon className="w-3.5 h-3.5 text-violet-400 shrink-0" />
        <span className="line-clamp-2">{value}</span>
      </p>
    </div>
  )
}

function SalaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-emerald-500/20 bg-emerald-950/10 px-4 py-4">
      <p className="text-[10px] uppercase tracking-widest text-emerald-400/80 mb-1">{label}</p>
      <p className="text-lg font-semibold text-slate-100">{value}</p>
    </div>
  )
}
