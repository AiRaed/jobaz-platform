'use client'

import { useState } from 'react'
import { ExternalLink, BookmarkPlus, Check } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { CareerPath } from '@/lib/career-paths'
import { inferCourseMeta } from '@/lib/build-your-path/pathIntelligence'
import { slugifyCourseName } from '@/lib/career-hub/slug'
import { upsertCareerPlanItem } from '@/lib/career-hub/myPlan'

type Course = CareerPath['courses'][number]

type Props = {
  course: Course
  pathId?: string
  sourceType: 'GOV.UK' | 'National Careers Service' | 'Professional Body' | 'College' | 'Other'
  configStyle: string
  configLabel: string
  isOfficialCourse: boolean
  isProfessionalBody: boolean
  onViewOfficial: () => void
  onFindNearYou: () => void
  helperNote?: string
}

export default function PathCourseCard({
  course,
  pathId,
  sourceType,
  configStyle,
  configLabel,
  isOfficialCourse,
  isProfessionalBody,
  onViewOfficial,
  onFindNearYou,
  helperNote,
}: Props) {
  const meta = inferCourseMeta(course)
  const [saved, setSaved] = useState(false)
  const isExternal = isOfficialCourse || (!isProfessionalBody && !course.externalLink)

  const handleSave = () => {
    if (!pathId) return
    upsertCareerPlanItem({
      courseName: course.name,
      courseSlug: slugifyCourseName(course.name),
      pathId,
      status: 'saved',
      source: 'career_hub',
    })
    setSaved(true)
  }

  return (
    <div className="p-5 rounded-xl border border-slate-700/50 bg-slate-900/30 hover:border-violet-500/40 transition-colors">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h3 className="text-base font-semibold text-slate-200">{course.name}</h3>
            <span className={cn('px-2 py-0.5 rounded text-xs font-medium border', configStyle)}>{configLabel}</span>
            {meta.official && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-emerald-500/30 bg-emerald-950/20 text-emerald-300">
                Official provider
              </span>
            )}
            {meta.beginnerFriendly && (
              <span className="px-2 py-0.5 rounded text-[10px] font-medium border border-violet-500/30 bg-violet-950/20 text-violet-300">
                Beginner friendly
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mb-2">
            <Chip label="Duration" value={course.duration} />
            <Chip label="Funding" value={course.funding} />
            <Chip label="Format" value={meta.format} />
            <Chip label="Level" value={meta.difficulty} />
          </div>
          <p className="text-xs text-slate-500">{course.type}</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2">
          {isOfficialCourse && (
            <button
              type="button"
              onClick={onViewOfficial}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all',
                'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500',
                'shadow-[0_0_12px_rgba(139,92,246,0.4)]'
              )}
            >
              <ExternalLink className="w-4 h-4" />
              Official UK Course Search
            </button>
          )}
          {isProfessionalBody && course.externalLink && (
            <button
              type="button"
              onClick={onViewOfficial}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-800/50 text-slate-200 border border-slate-700/50 hover:bg-slate-700/50"
            >
              <ExternalLink className="w-4 h-4" />
              Visit provider
            </button>
          )}
          {!isOfficialCourse && !isProfessionalBody && (
            <button
              type="button"
              onClick={onFindNearYou}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium',
                'bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500'
              )}
            >
              <ExternalLink className="w-4 h-4" />
              Official UK Course Search
            </button>
          )}
          {pathId && (
            <button
              type="button"
              onClick={handleSave}
              disabled={saved}
              className={cn(
                'inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium border transition',
                saved
                  ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                  : 'border-slate-600/60 text-slate-200 hover:border-violet-500/40 hover:bg-violet-500/10'
              )}
            >
              {saved ? <Check className="w-4 h-4" /> : <BookmarkPlus className="w-4 h-4" />}
              {saved ? 'Saved' : 'Save To My Plan'}
            </button>
          )}
        </div>
        {isExternal && (
          <p className="text-xs text-blue-300/80 flex items-center gap-1.5">
            <ExternalLink className="w-3 h-3 shrink-0" />
            Opens the official National Careers Service course search in a new tab
          </p>
        )}
        {helperNote && <p className="text-xs text-slate-400 mt-1">{helperNote}</p>}
      </div>
    </div>
  )
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-md border border-slate-700/50 bg-slate-950/50 text-slate-400">
      <span className="text-slate-600">{label}:</span>
      <span className="text-slate-300 font-medium">{value}</span>
    </span>
  )
}
