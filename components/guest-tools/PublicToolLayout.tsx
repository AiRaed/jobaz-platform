'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import type { ReactNode } from 'react'
import AppShell from '@/components/layout/AppShell'
import { PlatformToolShell } from '@/components/dashboard/platform'
import { getToolBackLink } from '@/lib/guest-tools/backLink'
import type { useToolGuestMode } from '@/lib/guest-tools/useToolGuestMode'
import { cn } from '@/lib/utils'
import GuestModeBanner from './GuestModeBanner'
import ToolAuthPromptModal from './ToolAuthPromptModal'

export type ToolGuestMode = ReturnType<typeof useToolGuestMode>

export type SecondaryBackLink = {
  label: string
  href?: string
  onClick?: () => void
}

type Props = {
  title: string
  subtitle?: string
  notice?: ReactNode
  headerAside?: ReactNode
  secondaryBackLinks?: SecondaryBackLink[]
  guest: ToolGuestMode
  maxWidthClass?: string
  continueGuestLabel?: string
  children: ReactNode
  footer?: ReactNode
  /** Optional short hero line under the title (Courses-style blue card) */
  heroHint?: string
  /** Hide the blue hero strip */
  hideHero?: boolean
  /** Tighter hero padding / margins for dense tool pages (e.g. CV Builder) */
  compactHero?: boolean
}

function SecondaryBackLinkItem({ link }: { link: SecondaryBackLink }) {
  const className =
    'inline-flex items-center gap-1.5 text-xs md:text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors'

  if (link.href) {
    return (
      <Link href={link.href} className={className}>
        <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 shrink-0" aria-hidden />
        {link.label}
      </Link>
    )
  }

  return (
    <button type="button" onClick={link.onClick} className={className}>
      <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 shrink-0" aria-hidden />
      {link.label}
    </button>
  )
}

/**
 * Shared tool page chrome — matches Courses & Licences / Landing day mode:
 * dark header, blue sidebar, light main background.
 */
export default function PublicToolLayout({
  title,
  subtitle,
  notice,
  headerAside,
  secondaryBackLinks = [],
  guest,
  maxWidthClass = 'max-w-none',
  continueGuestLabel = 'Continue as guest',
  children,
  footer,
  heroHint,
  hideHero = false,
  compactHero = false,
}: Props) {
  const back = getToolBackLink(guest.isLoggedIn)

  return (
    <AppShell wide platform className="text-[var(--text-main)]">
      <PlatformToolShell>
        <div className={cn('w-full min-w-0 box-border', maxWidthClass)}>
          <header className={cn(compactHero ? 'mb-2' : 'mb-4')} data-no-translate>
            <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1', compactHero ? 'mb-1.5' : 'mb-3')}>
              <Link
                href={back.href}
                className="inline-flex items-center gap-1.5 text-xs md:text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bg-primary)]/40 rounded"
              >
                <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 shrink-0" aria-hidden />
                {back.label}
              </Link>
              {secondaryBackLinks.map((link) => (
                <SecondaryBackLinkItem key={link.label} link={link} />
              ))}
            </div>

            {!hideHero ? (
              <section
                className={cn(
                  'jobaz-hero jobaz-keep-light rounded-2xl border border-slate-400/20',
                  compactHero
                    ? 'mb-2 px-3.5 py-2.5 md:px-4 md:py-2.5'
                    : 'mb-4 px-4 py-4 md:px-5 md:py-4'
                )}
              >
                <div
                  className={cn(
                    'flex flex-col gap-1.5',
                    headerAside && 'sm:flex-row sm:items-start sm:justify-between'
                  )}
                >
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-slate-300/90 font-medium mb-0.5">
                      JobAZ
                    </p>
                    <h1
                      className={cn(
                        'font-semibold text-slate-50 m-0 leading-tight tracking-tight',
                        compactHero ? 'text-lg md:text-xl' : 'text-xl md:text-2xl'
                      )}
                    >
                      {title}
                    </h1>
                    {subtitle && (
                      <p
                        className={cn(
                          'text-slate-200/90 m-0 leading-relaxed max-w-2xl',
                          compactHero ? 'mt-1 text-xs' : 'mt-1.5 text-xs md:text-sm'
                        )}
                      >
                        {subtitle}
                      </p>
                    )}
                    {heroHint && (
                      <p className="mt-1.5 text-[11px] text-slate-300/85 m-0">{heroHint}</p>
                    )}
                    {notice && <div className="mt-2">{notice}</div>}
                  </div>
                  {headerAside && <div className="shrink-0 sm:max-w-md">{headerAside}</div>}
                </div>
              </section>
            ) : (
              <div
                className={cn(
                  'flex flex-col gap-2 mb-4',
                  headerAside && 'sm:flex-row sm:items-start sm:justify-between'
                )}
              >
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[var(--bg-primary)] font-semibold mb-1">
                    JobAZ
                  </p>
                  <h1 className="text-2xl md:text-3xl font-semibold text-[var(--text-primary)] m-0 leading-tight">
                    {title}
                  </h1>
                  {subtitle && (
                    <p className="mt-1 text-xs md:text-sm text-[var(--text-secondary)] m-0 leading-relaxed">
                      {subtitle}
                    </p>
                  )}
                  {notice && <div className="mt-2">{notice}</div>}
                </div>
                {headerAside && <div className="shrink-0 sm:max-w-md">{headerAside}</div>}
              </div>
            )}
          </header>

          <GuestModeBanner
            visible={guest.authReady && guest.isGuest && !guest.bannerDismissed}
            redirectTo={guest.redirectTo}
            onDismiss={guest.dismissBanner}
          />

          {children}
        </div>
      </PlatformToolShell>

      <ToolAuthPromptModal
        isOpen={guest.authModalOpen}
        onClose={guest.closeAuthModal}
        redirectTo={guest.redirectTo}
        title={guest.authPrompt.title}
        description={guest.authPrompt.description}
        continueGuestLabel={continueGuestLabel}
      />

      {footer}
    </AppShell>
  )
}
