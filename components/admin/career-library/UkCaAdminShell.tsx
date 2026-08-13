'use client'

/**
 * Shared UK Career Assistant admin library chrome.
 * Layout/visual only — no matching or library logic.
 */

import type { ReactNode, SelectHTMLAttributes } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { cn } from '@/lib/utils'

export const UK_CA_ADMIN_HASH = '#uk-career-assistant'
export const UK_CA_ADMIN_HREF = `/admin${UK_CA_ADMIN_HASH}`

export type UkCaAction = {
  href: string
  label: string
  primary?: boolean
}

export type UkCaStat = {
  label: string
  value: string | number
  hint?: string
}

export type UkCaTab = {
  id: string
  label: string
  ready?: boolean
}

type ShellProps = {
  icon: ReactNode
  breadcrumb: string
  title: string
  description: string
  notes?: ReactNode
  actions?: UkCaAction[]
  stats?: UkCaStat[]
  tabs?: UkCaTab[]
  activeTab?: string
  onTabChange?: (id: string) => void
  headerAside?: ReactNode
  children: ReactNode
}

export function UkCaAdminShell({
  icon,
  breadcrumb,
  title,
  description,
  notes,
  actions = [],
  stats = [],
  tabs,
  activeTab,
  onTabChange,
  headerAside,
  children,
}: ShellProps) {
  return (
    <AppShell>
      <header className="mb-6 border-b border-slate-800/60 pb-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <Link
            href={UK_CA_ADMIN_HREF}
            className="inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-slate-200"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden />
            UK Career Assistant
          </Link>
          {headerAside}
        </div>

        <div className="flex items-start gap-3">
          <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-cyan-500/30 bg-cyan-950/30">
            {icon}
          </div>
          <div className="min-w-0 flex-1">
            <p className="mb-1 text-[10px] uppercase tracking-widest text-cyan-300/90">
              UK Career Assistant · {breadcrumb}
            </p>
            <h1 className="text-2xl font-bold text-slate-50">{title}</h1>
            <p className="mt-1.5 max-w-3xl text-sm text-slate-400">{description}</p>
            {notes ? <div className="mt-3 space-y-2">{notes}</div> : null}

            {actions.length > 0 ? (
              <div className="mt-4 flex flex-wrap gap-2">
                {actions.map((a) => (
                  <Link
                    key={a.href + a.label}
                    href={a.href}
                    className={cn(
                      'inline-flex min-h-9 items-center justify-center rounded-xl px-3.5 text-xs font-semibold transition',
                      a.primary
                        ? 'bg-cyan-600 text-white hover:bg-cyan-500'
                        : 'border border-slate-600/70 bg-slate-950/40 text-slate-200 hover:border-slate-400'
                    )}
                  >
                    {a.label}
                  </Link>
                ))}
                <Link
                  href={UK_CA_ADMIN_HREF}
                  className="inline-flex min-h-9 items-center justify-center rounded-xl border border-transparent px-3 text-xs font-medium text-slate-500 hover:text-slate-300"
                >
                  Back to UK Career Assistant
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {stats.length > 0 ? <UkCaStatGrid stats={stats} className="mb-6" /> : null}

      {tabs && tabs.length > 0 && onTabChange && activeTab ? (
        <UkCaTabNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={onTabChange}
          className="mb-6"
        />
      ) : null}

      {children}
    </AppShell>
  )
}

export function UkCaStatGrid({
  stats,
  className,
}: {
  stats: UkCaStat[]
  className?: string
}) {
  return (
    <div
      className={cn(
        'grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
        className
      )}
    >
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl border border-slate-700/60 bg-slate-950/40 px-4 py-3"
        >
          <p className="text-[10px] uppercase tracking-wider text-slate-500">{s.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums text-slate-100">{s.value}</p>
          {s.hint ? <p className="mt-1 text-[10px] text-slate-500">{s.hint}</p> : null}
        </div>
      ))}
    </div>
  )
}

export function UkCaTabNav({
  tabs,
  activeTab,
  onTabChange,
  className,
  ariaLabel = 'Library sections',
}: {
  tabs: UkCaTab[]
  activeTab: string
  onTabChange: (id: string) => void
  className?: string
  ariaLabel?: string
}) {
  return (
    <nav className={cn('flex flex-wrap gap-2', className)} aria-label={ariaLabel}>
      {tabs.map((item) => {
        const ready = item.ready !== false
        const active = activeTab === item.id
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={cn(
              'rounded-lg border px-3 py-1.5 text-xs font-medium transition',
              active
                ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-100'
                : 'border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-200',
              !ready && !active && 'opacity-70'
            )}
          >
            {item.label}
            {!ready ? (
              <span className="ml-1.5 text-[9px] uppercase tracking-wider text-slate-500">
                later
              </span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}

export function UkCaNote({
  children,
  tone = 'slate',
}: {
  children: ReactNode
  tone?: 'slate' | 'amber' | 'sky' | 'violet' | 'emerald'
}) {
  const styles =
    tone === 'amber'
      ? 'border-amber-500/25 bg-amber-950/20 text-amber-100/90'
      : tone === 'sky'
        ? 'border-sky-500/25 bg-sky-950/25 text-sky-100/90'
        : tone === 'violet'
          ? 'border-violet-500/25 bg-violet-950/25 text-violet-100/90'
          : tone === 'emerald'
            ? 'border-emerald-500/25 bg-emerald-950/25 text-emerald-100/90'
            : 'border-slate-700/60 bg-slate-950/40 text-slate-500'
  return (
    <div className={cn('max-w-3xl rounded-xl border px-3 py-2.5 text-xs leading-relaxed', styles)}>
      {children}
    </div>
  )
}

export function UkCaPanel({
  title,
  description,
  toolbar,
  children,
  className,
}: {
  title?: string
  description?: string
  toolbar?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950/40',
        className
      )}
    >
      {(title || description || toolbar) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/80 px-4 py-3">
          <div className="min-w-0">
            {title ? <h2 className="text-sm font-semibold text-slate-100">{title}</h2> : null}
            {description ? (
              <p className="mt-0.5 text-xs text-slate-500">{description}</p>
            ) : null}
          </div>
          {toolbar}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function UkCaFilterRow({ children }: { children: ReactNode }) {
  return <div className="mb-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
}

export function UkCaSelect(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2 text-sm text-slate-200 disabled:opacity-50',
        props.className
      )}
    />
  )
}

export function UkCaStatusBadge({
  children,
  tone = 'amber',
}: {
  children: ReactNode
  tone?: 'amber' | 'emerald' | 'slate' | 'sky'
}) {
  const styles =
    tone === 'emerald'
      ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200'
      : tone === 'sky'
        ? 'border-sky-500/30 bg-sky-950/40 text-sky-200'
        : tone === 'slate'
          ? 'border-slate-600/50 bg-slate-900/60 text-slate-400'
          : 'border-amber-500/25 bg-amber-950/20 text-amber-200'
  return (
    <span
      className={cn(
        'inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider',
        styles
      )}
    >
      {children}
    </span>
  )
}

export function UkCaTable({ children, minWidth = 980 }: { children: ReactNode; minWidth?: number }) {
  return (
    <div className="-mx-4 -mb-4 overflow-x-auto sm:mx-0 sm:mb-0 sm:rounded-xl sm:border sm:border-slate-800/80">
      <table
        className="w-full text-left text-xs"
        style={{ minWidth }}
      >
        {children}
      </table>
    </div>
  )
}

export function UkCaTableHead({ children }: { children: ReactNode }) {
  return (
    <thead className="sticky top-0 z-10 border-b border-slate-800 bg-slate-900/90 text-[10px] uppercase tracking-wider text-slate-500 backdrop-blur">
      {children}
    </thead>
  )
}
