'use client'

import Link from 'next/link'
import { ArrowRight, Compass, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { PlatformSectionHeader } from '@/components/dashboard/platform'
import { useTrainingCentre } from '@/hooks/useTrainingCentre'
import TrainingProgressSection from './TrainingProgressSection'
import TrainingCourseCard, { TrainingEmptyHint } from './TrainingCourseCard'
import TrainingUnlockSection from './TrainingUnlockSection'
import type { TrainingCourseItem } from '@/lib/training/types'

function TrainingSection({
  title,
  icon,
  courses,
  variant,
  onUpdate,
  empty,
}: {
  title: string
  icon?: React.ReactNode
  courses: TrainingCourseItem[]
  variant: 'recommended' | 'plan' | 'completed'
  onUpdate?: () => void
  empty?: ReactNode
}) {
  if (courses.length === 0 && !empty) return null
  return (
    <section>
      <div className="flex items-center gap-1.5 mb-2">
        {icon}
        <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
      </div>
      {courses.length > 0 ? (
        <div className="space-y-2">
          {courses.map((course) => (
            <TrainingCourseCard key={`${title}-${course.id}`} course={course} variant={variant} onUpdate={onUpdate} />
          ))}
        </div>
      ) : (
        empty
      )}
    </section>
  )
}

export default function TrainingCentreDashboard() {
  const { state, loaded, refresh } = useTrainingCentre()

  if (!loaded) {
    return (
      <div className="space-y-3 animate-pulse max-w-5xl mx-auto">
        <div className="h-12 rounded-xl bg-slate-900/50" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-lg bg-slate-900/50" />
          ))}
        </div>
        <div className="h-40 rounded-xl bg-slate-900/50" />
      </div>
    )
  }

  const required = state.recommended.filter((c) => c.required && c.status !== 'completed')
  const recommended = state.recommended.filter((c) => !c.required && c.status !== 'completed')
  const saved = state.plan.filter((c) => c.status === 'saved' || c.status === 'interested')
  const inProgress = state.plan.filter((c) => c.status === 'in_progress')

  return (
    <div className="space-y-4 pb-4 max-w-5xl mx-auto">
      <PlatformSectionHeader
        title="My Training Plan"
        description="Your saved, recommended and in-progress courses — personalised to your career pathway."
        dotColor="violet"
      />

      <TrainingProgressSection stats={state.stats} />

      <TrainingSection
        title="Required"
        courses={required}
        variant="recommended"
        onUpdate={refresh}
        empty={
          required.length === 0 && !state.hasAssessment ? (
            <TrainingEmptyHint
              title="No required training yet"
              description="Complete the Career Assistant to see qualifications required for your pathway."
              href="/uk-career-assistant"
              linkLabel="Start Career Assistant"
            />
          ) : null
        }
      />

      <TrainingSection
        title="Recommended for you"
        icon={<Sparkles className="w-3.5 h-3.5 text-violet-400" />}
        courses={recommended}
        variant="recommended"
        onUpdate={refresh}
        empty={
          recommended.length === 0 ? (
            <TrainingEmptyHint
              title="No recommendations yet"
              description="Browse Courses & Licences or complete your career assessment for personalised suggestions."
              href="/career-hub"
              linkLabel="Find a course"
            />
          ) : null
        }
      />

      <TrainingSection title="Saved" courses={saved} variant="plan" onUpdate={refresh} />

      <TrainingSection title="In progress" courses={inProgress} variant="plan" onUpdate={refresh} />

      {state.completed.length > 0 && (
        <TrainingSection title="Completed" courses={state.completed} variant="completed" />
      )}

      <TrainingUnlockSection unlocks={state.unlocks} />

      <section className="rounded-xl border border-slate-700/50 bg-slate-950/40 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-200">Looking for more courses?</p>
          <p className="text-xs text-slate-500">
            Courses & Licences is where you browse — this tab is your personal training plan only.
          </p>
        </div>
        <Link
          href="/career-hub"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 border border-violet-500/30 text-violet-200 hover:bg-slate-700/80 transition"
        >
          <Compass className="w-3.5 h-3.5" />
          Find a course
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </section>
    </div>
  )
}
