/**
 * Shared visual identity for Career Assistant handoff + My Plan.
 * Display-only — no recommendation / course logic.
 * Classes are dual-theme: day (default) + dark: for JobAZ dark mode.
 */

import type { LucideIcon } from 'lucide-react'
import {
  Bookmark,
  Briefcase,
  Compass,
  FileText,
  GraduationCap,
  Info,
  ListChecks,
  Rocket,
  Shield,
  Sparkles,
  Sprout,
  Star,
  TrendingUp,
} from 'lucide-react'

export type PlanSectionAccent =
  | 'route'
  | 'work'
  | 'training'
  | 'addons'
  | 'week'
  | 'cv'
  | 'muted'

export type PlanRouteVisualKey =
  | 'side_job'
  | 'work_in_education'
  | 'work_in_profession'
  | 'work_in_experience'
  | 'start_new_career'
  | 'grow_career'
  | 'start_business'
  | 'default'

export const PLAN_SECTION_STYLES: Record<
  PlanSectionAccent,
  {
    iconWrap: string
    icon: string
    title: string
    border: string
    panel: string
    chip: string
  }
> = {
  route: {
    iconWrap:
      'border-cyan-200 bg-cyan-50 dark:border-cyan-500/30 dark:bg-cyan-500/10',
    icon: 'text-cyan-700 dark:text-cyan-300',
    title: 'text-slate-900 dark:text-slate-50',
    border: 'border-cyan-200/80 dark:border-cyan-500/25',
    panel: 'jobaz-card bg-white dark:bg-gradient-to-br dark:from-cyan-950/30 dark:via-slate-950/80 dark:to-slate-950/90',
    chip: 'border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-500/25 dark:bg-cyan-500/10 dark:text-cyan-100',
  },
  work: {
    iconWrap:
      'border-emerald-200 bg-emerald-50 dark:border-emerald-500/30 dark:bg-emerald-500/10',
    icon: 'text-emerald-700 dark:text-emerald-300',
    title: 'text-slate-900 dark:text-slate-50',
    border: 'border-emerald-200/90 dark:border-emerald-500/30',
    panel: 'jobaz-card bg-white dark:bg-emerald-950/15',
    chip: 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/25 dark:bg-emerald-500/10 dark:text-emerald-100',
  },
  training: {
    iconWrap:
      'border-violet-200 bg-violet-50 dark:border-violet-500/35 dark:bg-violet-500/10',
    icon: 'text-violet-700 dark:text-violet-300',
    title: 'text-slate-900 dark:text-slate-50',
    border: 'border-violet-200/90 dark:border-violet-500/30',
    panel:
      'jobaz-card bg-white dark:bg-gradient-to-b dark:from-violet-950/40 dark:via-slate-950/80 dark:to-slate-950/90',
    chip: 'border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-400/30 dark:bg-violet-500/10 dark:text-violet-100',
  },
  addons: {
    iconWrap:
      'border-amber-200 bg-amber-50 dark:border-amber-500/30 dark:bg-amber-500/10',
    icon: 'text-amber-700 dark:text-amber-300',
    title: 'text-slate-900 dark:text-slate-50',
    border: 'border-amber-200/90 dark:border-amber-500/25',
    panel: 'jobaz-card bg-white dark:bg-amber-950/10',
    chip: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/25 dark:bg-amber-500/10 dark:text-amber-100',
  },
  week: {
    iconWrap:
      'border-indigo-200 bg-indigo-50 dark:border-indigo-500/30 dark:bg-indigo-500/10',
    icon: 'text-indigo-700 dark:text-indigo-300',
    title: 'text-slate-900 dark:text-slate-50',
    border: 'border-indigo-200/90 dark:border-indigo-500/30',
    panel: 'jobaz-card-soft bg-[var(--bg-surface-alt)] dark:bg-indigo-950/20',
    chip: 'border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-500/25 dark:bg-indigo-500/10 dark:text-indigo-100',
  },
  cv: {
    iconWrap: 'border-sky-200 bg-sky-50 dark:border-sky-500/30 dark:bg-sky-500/10',
    icon: 'text-sky-700 dark:text-sky-300',
    title: 'text-slate-900 dark:text-slate-50',
    border: 'border-sky-200/90 dark:border-sky-500/25',
    panel: 'jobaz-card bg-white dark:bg-sky-950/15',
    chip: 'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/25 dark:bg-sky-500/10 dark:text-sky-100',
  },
  muted: {
    iconWrap:
      'border-slate-200 bg-slate-100 dark:border-slate-600/50 dark:bg-slate-800/40',
    icon: 'text-slate-600 dark:text-slate-400',
    title: 'text-slate-800 dark:text-slate-200',
    border: 'border-slate-200 dark:border-slate-700/50',
    panel: 'jobaz-card-soft bg-[var(--bg-surface-alt)] dark:bg-slate-950/40',
    chip: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600/40 dark:bg-slate-800/40 dark:text-slate-300',
  },
}

export const PLAN_SECTION_ICONS: Record<PlanSectionAccent, LucideIcon> = {
  route: Compass,
  work: Briefcase,
  training: GraduationCap,
  addons: Star,
  week: ListChecks,
  cv: FileText,
  muted: Info,
}

export type PlanRouteVisual = {
  key: PlanRouteVisualKey
  label: string
  Icon: LucideIcon
  accentClass: string
  badgeClass: string
}

const ROUTE_VISUALS: Record<PlanRouteVisualKey, Omit<PlanRouteVisual, 'key'>> = {
  side_job: {
    label: 'Extra income',
    Icon: Shield,
    accentClass: 'from-cyan-500/20 to-teal-500/5',
    badgeClass:
      'border-cyan-200 bg-cyan-50 text-cyan-900 dark:border-cyan-500/30 dark:bg-cyan-500/10 dark:text-cyan-200',
  },
  work_in_education: {
    label: 'Education route',
    Icon: Compass,
    accentClass: 'from-sky-500/20 to-indigo-500/5',
    badgeClass:
      'border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-500/30 dark:bg-sky-500/10 dark:text-sky-200',
  },
  work_in_profession: {
    label: 'Profession route',
    Icon: Briefcase,
    accentClass: 'from-teal-500/20 to-cyan-500/5',
    badgeClass:
      'border-teal-200 bg-teal-50 text-teal-900 dark:border-teal-500/30 dark:bg-teal-500/10 dark:text-teal-200',
  },
  work_in_experience: {
    label: 'Experience route',
    Icon: Briefcase,
    accentClass: 'from-emerald-500/20 to-cyan-500/5',
    badgeClass:
      'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-200',
  },
  start_new_career: {
    label: 'New career',
    Icon: Rocket,
    accentClass: 'from-violet-500/20 to-fuchsia-500/5',
    badgeClass:
      'border-violet-200 bg-violet-50 text-violet-900 dark:border-violet-500/30 dark:bg-violet-500/10 dark:text-violet-200',
  },
  grow_career: {
    label: 'Grow career',
    Icon: TrendingUp,
    accentClass: 'from-indigo-500/20 to-cyan-500/5',
    badgeClass:
      'border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-500/30 dark:bg-indigo-500/10 dark:text-indigo-200',
  },
  start_business: {
    label: 'Start business',
    Icon: Sprout,
    accentClass: 'from-amber-500/20 to-emerald-500/5',
    badgeClass:
      'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200',
  },
  default: {
    label: 'Your plan',
    Icon: Sparkles,
    accentClass: 'from-slate-500/15 to-transparent',
    badgeClass:
      'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-600/40 dark:bg-slate-800/40 dark:text-slate-300',
  },
}

/** Resolve route visual from engine pathId and/or display route label. */
export function resolvePlanRouteVisual(
  pathId?: string | null,
  routeLabel?: string | null
): PlanRouteVisual {
  const id = (pathId || '').toLowerCase()
  const label = (routeLabel || '').toLowerCase()

  let key: PlanRouteVisualKey = 'default'
  if (id === 'side_job' || /extra income|side.?job|security/.test(label)) key = 'side_job'
  else if (id === 'work_in_education' || /education/.test(label)) key = 'work_in_education'
  else if (id === 'work_in_profession' || /profession/.test(label)) key = 'work_in_profession'
  else if (id === 'work_in_experience' || /experience/.test(label)) key = 'work_in_experience'
  else if (id === 'start_new_career' || /new career|→/.test(label)) key = 'start_new_career'
  else if (id === 'grow_career' || /grow/.test(label)) key = 'grow_career'
  else if (id === 'start_business' || /business/.test(label)) key = 'start_business'

  // Security extra income still uses side_job visual (shield), not a separate path
  const meta = ROUTE_VISUALS[key]
  return { key, ...meta }
}

export const BOOKMARK_ICON = Bookmark
