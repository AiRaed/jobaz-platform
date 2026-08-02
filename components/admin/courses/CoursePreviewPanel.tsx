'use client'

import { Building2, Clock, GraduationCap, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { routeTargetLabels } from '@/lib/admin/courses/routeTargets'
import { formatDeliveryModesDisplay, resolveDeliveryModes } from '@/lib/admin/courses/deliveryModes'
import { courseCardBadges } from '@/lib/admin/courses/publicBadges'
import { resolvePublicOffer } from '@/lib/admin/courses/publicOffer'
import CourseOfferBadge from '@/components/career-hub/marketplace/CourseOfferBadge'
import CourseOfferHelperLine from '@/components/career-hub/marketplace/CourseOfferHelperLine'
import CoursePurposePill from '@/components/career-hub/marketplace/CoursePurposePill'
import type { AdminCourseInput } from '@/lib/admin/courses/types'

type Props = {
  form: AdminCourseInput
  className?: string
}

export default function CoursePreviewPanel({ form, className }: Props) {
  const routeLabels = routeTargetLabels(form.routeIds)
  const title = form.title.trim() || 'Course title'
  const provider = form.provider.trim() || 'Provider name'
  const deliveryLabel = formatDeliveryModesDisplay(
    resolveDeliveryModes(form.deliveryModes, form.deliveryMode)
  )
  const previewBadges = courseCardBadges(form.publicBadges)
  const previewOffer = resolvePublicOffer(form)

  return (
    <aside
      className={cn(
        'rounded-2xl border border-violet-500/20 bg-slate-900/50 p-5 flex flex-col gap-4',
        className
      )}
    >
      <div>
        <p className="text-[10px] uppercase tracking-widest text-violet-300 mb-3">Live preview</p>
        <p className="text-xs text-slate-500 mb-4">Updates as you type — matches Career Hub card layout.</p>
      </div>

      <article
        className={cn(
          'rounded-2xl border bg-slate-950/60 p-4 flex flex-col gap-3',
          form.featuredCourse
            ? 'border-violet-500/35 shadow-[0_0_24px_rgba(139,92,246,0.1)]'
            : 'border-slate-700/50'
        )}
      >
        {form.imageUrl.trim() ? (
          <div
            className="relative h-44 rounded-xl overflow-hidden border border-slate-700/50"
            style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,64,175,0.35))' }}
          >
            <div className="flex h-full w-full items-center justify-center p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={form.imageUrl.trim()}
                alt=""
                className="max-h-full max-w-full object-contain object-center"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
            {previewOffer.badgeDisplay && (
              <div className="absolute top-2 right-2 z-10">
                <CourseOfferBadge display={previewOffer.badgeDisplay} />
              </div>
            )}
          </div>
        ) : (
          <div className="relative h-44 rounded-xl border border-dashed border-slate-700/60 bg-slate-900/40 flex items-center justify-center text-xs text-slate-600">
            Course thumbnail preview
            {previewOffer.badgeDisplay && (
              <div className="absolute top-2 right-2 z-10">
                <CourseOfferBadge display={previewOffer.badgeDisplay} />
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {form.featuredCourse && (
            <span className="inline-flex items-center gap-1 text-[10px] rounded-full border border-violet-500/30 bg-violet-950/40 px-2 py-0.5 text-violet-300">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          )}
          {form.partnerCourse && (
            <span className="text-[10px] rounded-full border border-cyan-500/30 bg-cyan-950/30 px-2 py-0.5 text-cyan-300">
              Partner
            </span>
          )}
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            {form.coursePurpose.trim() && <CoursePurposePill label={form.coursePurpose} />}
          </div>
          <h3 className="text-base font-semibold text-slate-100 leading-snug">{title}</h3>
          {form.shortDescription.trim() && (
            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">{form.shortDescription}</p>
          )}
        </div>

        {previewBadges.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {previewBadges.map((badge) => (
              <span
                key={badge}
                className="text-[10px] uppercase tracking-wider rounded-full border border-slate-600/50 bg-slate-900/60 px-2 py-0.5 text-slate-300"
              >
                {badge}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-xs text-slate-400">
          <Building2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
          {provider}
        </div>

        {routeLabels.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {routeLabels.map((label) => (
              <span
                key={label}
                className="text-[10px] rounded-md border border-slate-700/60 bg-slate-900/80 px-2 py-0.5 text-slate-300"
              >
                {label}
              </span>
            ))}
          </div>
        )}

        <ul className="grid grid-cols-2 gap-2 text-xs text-slate-300 pt-1 border-t border-slate-800/60">
          <li className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            {form.duration.trim() || 'Duration'}
          </li>
          <li className="flex items-center gap-1.5">
            <GraduationCap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            {deliveryLabel}
          </li>
          <li className="col-span-2 flex flex-col gap-1">
            <span className="text-slate-500">
              Price:{' '}
              <span className="text-slate-300">{form.price.trim() || '—'}</span>
            </span>
            {previewOffer.visible && <CourseOfferHelperLine text={previewOffer.cardHint} />}
          </li>
          <li className="col-span-2 text-slate-500">
            Funding:{' '}
            <span className="text-slate-300">{form.fundingType.trim() || form.price.trim() || '—'}</span>
          </li>
        </ul>
      </article>
    </aside>
  )
}
