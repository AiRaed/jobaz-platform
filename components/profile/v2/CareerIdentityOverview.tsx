'use client'

import Link from 'next/link'
import {
  BookOpen,
  Briefcase,
  Compass,
  FileText,
  MapPin,
  Sparkles,
  Target,
} from 'lucide-react'
import type { DbPersonalProfile, DbProfile } from '@/lib/identity-profile/types'
import ProfileSection from './ProfileSection'

type PlanSummary = {
  routeLabel: string
  targetRole: string
  routePathId: string | null
} | null

type Props = {
  profile: DbProfile
  personal: DbPersonalProfile | null
  email: string | null
  plan: PlanSummary
  careerGoal?: string | null
  planItemCount: number
  courseInterestCount: number
  savedJobsCount: number | null
  skills: string[]
}

function StatChip({
  label,
  value,
  href,
}: {
  label: string
  value: string
  href?: string
}) {
  const inner = (
    <div className="rounded-xl border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] px-3 py-2.5 dark:border-slate-700/60 dark:bg-slate-900/50">
      <p className="text-[10px] uppercase tracking-wider text-[var(--jaz-muted)] dark:text-slate-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-[var(--jaz-text)] dark:text-slate-100">
        {value}
      </p>
    </div>
  )
  if (href) {
    return (
      <Link href={href} className="block hover:opacity-90 transition">
        {inner}
      </Link>
    )
  }
  return inner
}

export default function CareerIdentityOverview({
  profile,
  personal,
  email,
  plan,
  careerGoal,
  planItemCount,
  courseInterestCount,
  savedJobsCount,
  skills,
}: Props) {
  const displayName = profile.username
    ? profile.username.replace(/^@/, '')
    : 'Your name'
  const location = profile.location?.trim() || null
  const focus = personal?.current_focus?.trim() || plan?.targetRole || null
  const cvStatus = personal?.cv_status?.trim() || null
  const careerScore =
    typeof personal?.career_score === 'number' && personal.career_score > 0
      ? personal.career_score
      : null
  const atsScore =
    typeof personal?.ats_score === 'number' && personal.ats_score > 0
      ? personal.ats_score
      : null

  return (
    <div className="space-y-4">
      <ProfileSection
        title="Basic profile"
        subtitle="Private to you — used to improve job, course, opportunity and email matching."
      >
        <dl className="grid gap-3 sm:grid-cols-2 text-sm">
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-[var(--jaz-muted)] dark:text-slate-500">
              Name
            </dt>
            <dd className="mt-0.5 text-[var(--jaz-text)] dark:text-slate-100 font-medium">
              {displayName}
            </dd>
          </div>
          <div>
            <dt className="text-[10px] uppercase tracking-wider text-[var(--jaz-muted)] dark:text-slate-500">
              Email
            </dt>
            <dd className="mt-0.5 text-[var(--jaz-text)] dark:text-slate-100 font-medium break-all">
              {email || 'Signed-in account email'}
            </dd>
          </div>
          {location && (
            <div className="sm:col-span-2 flex items-start gap-1.5">
              <MapPin className="h-3.5 w-3.5 mt-0.5 text-violet-500 shrink-0" aria-hidden />
              <div>
                <dt className="text-[10px] uppercase tracking-wider text-[var(--jaz-muted)] dark:text-slate-500">
                  Location
                </dt>
                <dd className="text-[var(--jaz-text)] dark:text-slate-100">{location}</dd>
              </div>
            </div>
          )}
        </dl>
      </ProfileSection>

      <ProfileSection title="Career direction" subtitle="From your assessment and profile">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] p-3 dark:border-slate-700/50 dark:bg-slate-900/40">
            <p className="text-[10px] uppercase tracking-wider text-[var(--jaz-muted)] dark:text-slate-500 flex items-center gap-1.5 mb-1">
              <Target className="h-3 w-3 text-violet-500" aria-hidden />
              Career goal / route
            </p>
            <p className="text-sm text-[var(--jaz-text)] dark:text-slate-100">
              {careerGoal?.trim() || plan?.routeLabel || 'Add a headline or complete UK Career Assistant'}
            </p>
            {plan && (
              <p className="text-xs text-[var(--jaz-muted)] dark:text-slate-500 mt-1">
                Target: {plan.targetRole}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] p-3 dark:border-slate-700/50 dark:bg-slate-900/40">
            <p className="text-[10px] uppercase tracking-wider text-[var(--jaz-muted)] dark:text-slate-500 flex items-center gap-1.5 mb-1">
              <Compass className="h-3 w-3 text-cyan-500" aria-hidden />
              Current focus
            </p>
            <p className="text-sm text-[var(--jaz-text)] dark:text-slate-100">
              {focus || 'Set a focus when you save your plan or edit your profile'}
            </p>
          </div>
        </div>
        {!plan && (
          <Link
            href="/uk-career-assistant"
            className="inline-flex mt-3 text-xs font-medium text-violet-600 dark:text-violet-300 hover:underline"
          >
            Start UK Career Assistant →
          </Link>
        )}
      </ProfileSection>

      <ProfileSection title="Readiness & progress" subtitle="Private scores from your JobAZ tools">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <StatChip
            label="Career readiness"
            value={careerScore != null ? `${careerScore}%` : 'Not scored yet'}
            href="/dashboard?tab=plan"
          />
          <StatChip
            label="CV status"
            value={
              cvStatus ||
              (atsScore != null ? `ATS ${atsScore}%` : 'Open CV Builder')
            }
            href="/cv-builder-v2"
          />
          <StatChip
            label="Saved plan"
            value={
              planItemCount > 0
                ? `${planItemCount} item${planItemCount === 1 ? '' : 's'}`
                : 'No saved plan yet'
            }
            href="/dashboard?tab=plan"
          />
          <StatChip
            label="Course interests"
            value={
              courseInterestCount > 0
                ? `${courseInterestCount} saved`
                : 'Browse courses'
            }
            href="/career-hub"
          />
          <StatChip
            label="Jobs saved"
            value={
              savedJobsCount == null
                ? '—'
                : savedJobsCount > 0
                  ? `${savedJobsCount} saved`
                  : 'None yet'
            }
            href="/job-finder"
          />
          <StatChip
            label="Opportunities"
            value="Browse local work"
            href="/opportunities"
          />
        </div>
      </ProfileSection>

      <ProfileSection title="Skills & interests" subtitle="What you bring to UK roles">
        {skills.length > 0 ? (
          <ul className="flex flex-wrap gap-1.5">
            {skills.slice(0, 24).map((s) => (
              <li
                key={s}
                className="rounded-full border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] px-2.5 py-1 text-[11px] font-medium text-[var(--jaz-text)] dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-200"
              >
                {s}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--jaz-muted)] dark:text-slate-400 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-violet-500 shrink-0" aria-hidden />
            Add skills when you edit your profile — they help match jobs and courses.
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <Link
            href="/job-finder"
            className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-300 hover:underline"
          >
            <Briefcase className="h-3 w-3" aria-hidden />
            Find jobs
          </Link>
          <Link
            href="/career-hub"
            className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-300 hover:underline"
          >
            <BookOpen className="h-3 w-3" aria-hidden />
            Browse courses
          </Link>
          <Link
            href="/cv-builder-v2"
            className="inline-flex items-center gap-1 text-violet-600 dark:text-violet-300 hover:underline"
          >
            <FileText className="h-3 w-3" aria-hidden />
            Improve CV
          </Link>
        </div>
      </ProfileSection>
    </div>
  )
}
