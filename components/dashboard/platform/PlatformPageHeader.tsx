'use client'

import type { ReactNode } from 'react'
import {
  PLATFORM_DOT,
  PLATFORM_PAGE_DESCRIPTION,
  PLATFORM_PAGE_DIVIDER,
  PLATFORM_PAGE_HEADER,
  PLATFORM_PAGE_TITLE,
  PLATFORM_SECTION_GAP,
  type PlatformDotColor,
} from '@/lib/dashboard/platformDesignSystem'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  description?: string
  dotColor?: PlatformDotColor
  badges?: ReactNode
  actions?: ReactNode
  meta?: ReactNode
  showDivider?: boolean
  className?: string
}

/** Workspace page title block — sits below identity card, above tab content. */
export default function PlatformPageHeader({
  title,
  description,
  dotColor = 'violet',
  badges,
  actions,
  meta,
  showDivider = true,
  className,
}: Props) {
  return (
    <header className={cn(PLATFORM_PAGE_HEADER, PLATFORM_SECTION_GAP, className)}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={PLATFORM_DOT[dotColor]} aria-hidden />
            <h2 className={PLATFORM_PAGE_TITLE}>{title}</h2>
            {badges}
          </div>
          {description && <p className={PLATFORM_PAGE_DESCRIPTION}>{description}</p>}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div> : null}
      </div>
      {meta ? <div className="mt-4">{meta}</div> : null}
      {showDivider && <div className={PLATFORM_PAGE_DIVIDER} />}
    </header>
  )
}
