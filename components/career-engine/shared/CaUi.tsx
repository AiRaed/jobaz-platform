'use client'

/**
 * Shared Career Assistant chrome — visual language from Work in My Education.
 * Layout/interaction only; no matching logic.
 */

import type { ReactNode } from 'react'
// ReactNode used by CaNextWithJobaz leadingAction
import Link from 'next/link'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import UkCareerBackground from '@/components/uk-career-assistant/UkCareerBackground'
import { cn } from '@/lib/utils'

export const CA_ACTION_BTN =
  'inline-flex min-h-10 items-center justify-center rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-medium text-slate-800 hover:bg-slate-50 dark:border-white/15 dark:bg-white/5 dark:text-slate-100 dark:hover:bg-white/10'

export const CA_CARD_SHELL =
  'rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm dark:border-slate-800/90 dark:bg-slate-900/50 dark:shadow-none'

type JourneyShellProps = {
  eyebrow: string
  backHref?: string
  backLabel?: string
  adminBanner?: string | null
  children: ReactNode
}

/** Page shell matching Work in My Education / Work in My Profession. */
export function CaJourneyShell({
  eyebrow,
  backHref = '/uk-career-assistant',
  backLabel = 'Career Assistant',
  adminBanner,
  children,
}: JourneyShellProps) {
  return (
    <div className="relative min-h-screen overflow-x-hidden text-slate-900 dark:text-slate-100">
      <UkCareerBackground />
      <div className="relative z-10 mx-auto max-w-2xl px-4 py-8 sm:py-10">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            {backLabel}
          </Link>
        </div>

        {adminBanner ? (
          <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
            {adminBanner}
          </p>
        ) : null}

        <p className="mb-4 text-[11px] uppercase tracking-wider text-blue-700/80 dark:text-violet-300/80">{eyebrow}</p>

        {children}
      </div>
    </div>
  )
}

type MetaFact = { label: string; value: string }

type ResultHeaderProps = {
  pathLabel: string
  title: string
  framing?: string | null
  badge?: ReactNode
  facts?: MetaFact[]
  note?: string | null
  children?: ReactNode
}

export function CaResultHeader({
  pathLabel,
  title,
  framing,
  badge,
  facts = [],
  note,
  children,
}: ResultHeaderProps) {
  return (
    <header className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-5 sm:p-7">
      <p className="text-xs font-medium uppercase tracking-wider text-cyan-300/90">{pathLabel}</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">{title}</h1>
      {framing ? <p className="mt-2 text-sm text-slate-300">{framing}</p> : null}
      {badge ? <div className="mt-4">{badge}</div> : null}
      {facts.length > 0 ? (
        <dl className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
          {facts.map((f) => (
            <div key={f.label}>
              <dt className="text-[10px] uppercase tracking-wider text-slate-500">{f.label}</dt>
              <dd className="mt-0.5 font-medium text-slate-100">{f.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {note ? <p className="mt-3 text-xs text-slate-400">{note}</p> : null}
      {children}
    </header>
  )
}

type CalloutProps = {
  tone?: 'amber' | 'sky'
  children: ReactNode
}

export function CaCallout({ tone = 'amber', children }: CalloutProps) {
  return (
    <p
      className={cn(
        'rounded-xl px-4 py-3 text-sm',
        tone === 'amber' && 'border border-amber-500/25 bg-amber-950/25 text-amber-100/90',
        tone === 'sky' && 'border border-sky-500/20 bg-sky-950/25 text-sky-100/90'
      )}
    >
      {children}
    </p>
  )
}

type ResultSectionProps = {
  title: string
  description?: string
  count?: number
  emptyMessage?: string
  children?: ReactNode
  className?: string
}

export function CaResultSection({
  title,
  description,
  count,
  emptyMessage,
  children,
  className,
}: ResultSectionProps) {
  const hasContent = children != null && children !== false
  return (
    <section className={cn('space-y-3', className)} aria-label={title}>
      <div>
        <h2 className="text-sm font-semibold text-slate-100">
          {title}
          {typeof count === 'number' ? (
            <span className="ml-2 font-normal text-slate-500">({count})</span>
          ) : null}
        </h2>
        {description ? <p className="mt-1 text-xs text-slate-400">{description}</p> : null}
      </div>
      {hasContent ? (
        children
      ) : emptyMessage ? (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-slate-500">
          {emptyMessage}
        </p>
      ) : null}
    </section>
  )
}

export function CaMatchBadge({
  label,
  tone = 'sky',
}: {
  label: string
  tone?: 'emerald' | 'sky' | 'violet' | 'amber' | 'slate'
}) {
  const styles =
    tone === 'emerald'
      ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-100'
      : tone === 'violet'
        ? 'border-violet-500/30 bg-violet-950/40 text-violet-100'
        : tone === 'amber'
          ? 'border-amber-500/30 bg-amber-950/40 text-amber-100'
          : tone === 'slate'
            ? 'border-slate-500/30 bg-slate-900/50 text-slate-200'
            : 'border-sky-500/30 bg-sky-950/40 text-sky-100'
  return (
    <span
      className={cn(
        'shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide',
        styles
      )}
    >
      {label}
    </span>
  )
}

type RouteCardProps = {
  title: string
  badge?: ReactNode
  meta?: Array<{ label: string; value: string }>
  description?: string | null
  whyTitle?: string
  whyItems?: string[]
  cvFocus?: string[]
  keywords?: string[]
  actionHref?: string
  actionLabel?: string
  className?: string
  children?: ReactNode
}

/** Role / route card chrome aligned with Work in My Education CareerPathwayCard. */
export function CaRouteCard({
  title,
  badge,
  meta = [],
  description,
  whyTitle = 'Why this matches',
  whyItems = [],
  cvFocus = [],
  keywords = [],
  actionHref,
  actionLabel = 'View pathway',
  className,
  children,
}: RouteCardProps) {
  return (
    <article className={cn(CA_CARD_SHELL, className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-slate-50 sm:text-lg">{title}</h3>
        {badge}
      </div>

      {meta.length > 0 ? (
        <dl className="mt-3 grid gap-2 text-xs text-slate-400 sm:grid-cols-2">
          {meta.map((m) => (
            <div key={m.label}>
              <dt className="uppercase tracking-wider text-slate-500">{m.label}</dt>
              <dd className="mt-0.5 text-sm text-slate-200">{m.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {description ? (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{whyTitle}</p>
          <p className="mt-1.5 text-sm leading-relaxed text-slate-300">{description}</p>
        </div>
      ) : null}

      {whyItems.length > 0 ? (
        <ul className="mt-2 space-y-1.5">
          {whyItems.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-slate-300">
              <span aria-hidden className="mt-0.5 shrink-0">
                ✔️
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : null}

      {cvFocus.length > 0 ? (
        <div className="mt-3 border-t border-slate-800 pt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            CV focus points
          </p>
          <ul className="mt-1.5 list-disc space-y-1 pl-4 text-sm text-slate-300">
            {cvFocus.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {keywords.length > 0 ? (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Job search keywords
          </p>
          <p className="mt-1 text-sm text-slate-300">{keywords.join(' · ')}</p>
        </div>
      ) : null}

      {children}

      {actionHref ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-xl border border-cyan-700/50 bg-cyan-950/30 px-3 py-2 text-sm font-medium text-cyan-100 hover:bg-cyan-950/50 sm:w-auto"
        >
          {actionLabel}
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      ) : null}
    </article>
  )
}

type NextAction = {
  href: string
  label: string
}

type NextWithJobazProps = {
  actions?: NextAction[]
  showCourses?: boolean
  /** Renders beside Save pathway — typically Add to My Plan */
  leadingAction?: ReactNode
}

const DEFAULT_NEXT_ACTIONS: NextAction[] = [
  { href: '/cv-builder-v2', label: 'Prepare my CV' },
  { href: '/jobs', label: 'View jobs' },
  { href: '/dashboard', label: 'Save pathway' },
  { href: '/cover-letter', label: 'Create cover letter' },
  { href: '/interview-coach', label: 'Interview coach' },
]

export function CaNextWithJobaz({
  actions = DEFAULT_NEXT_ACTIONS,
  showCourses = false,
  leadingAction,
}: NextWithJobazProps) {
  const list = showCourses
    ? [...actions, { href: '/courses', label: 'View courses' }]
    : actions
  return (
    <section className="space-y-3" aria-label="Next with JobAZ">
      <h2 className="text-sm font-semibold text-slate-100">Next with JobAZ</h2>
      <div className="flex flex-wrap gap-2">
        {leadingAction}
        {list.map((a) => (
          <Link key={a.href + a.label} href={a.href} className={CA_ACTION_BTN}>
            {a.label}
          </Link>
        ))}
      </div>
    </section>
  )
}

type WizardNavProps = {
  onBack?: () => void
  onStartOver: () => void
  showBack?: boolean
  disabled?: boolean
}

/** Back / Start over row — matches Work in My Education wizard chrome. */
export function CaWizardNav({
  onBack,
  onStartOver,
  showBack = false,
  disabled = false,
}: WizardNavProps) {
  return (
    <div className="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-2">
        {showBack && onBack ? (
          <button
            type="button"
            onClick={onBack}
            disabled={disabled}
            className="min-h-11 flex-1 rounded-xl border border-slate-600 px-4 py-2.5 text-sm font-medium text-slate-200 hover:border-slate-400 disabled:opacity-50 sm:flex-none"
          >
            Back
          </button>
        ) : null}
        <button
          type="button"
          onClick={onStartOver}
          disabled={disabled}
          className="min-h-11 rounded-xl px-3 py-2.5 text-sm text-slate-500 hover:text-slate-300 disabled:opacity-50"
        >
          Start over
        </button>
      </div>
    </div>
  )
}


type ResultFooterProps = {
  onStartAgain?: () => void
  careerAssistantHref?: string
  startAgainHref?: string
}

export function CaResultFooter({
  onStartAgain,
  careerAssistantHref = '/uk-career-assistant',
  startAgainHref,
}: ResultFooterProps) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between">
      {onStartAgain ? (
        <button
          type="button"
          onClick={onStartAgain}
          className="min-h-11 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5"
        >
          Start again
        </button>
      ) : startAgainHref ? (
        <Link
          href={startAgainHref}
          className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5"
        >
          Start again
        </Link>
      ) : (
        <span />
      )}
      <Link
        href={careerAssistantHref}
        className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500"
      >
        Return to Career Assistant
      </Link>
    </div>
  )
}
