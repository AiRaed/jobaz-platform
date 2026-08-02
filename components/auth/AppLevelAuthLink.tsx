'use client'

import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react'
import {
  loadCaResultSnapshot,
  preserveAssessmentBeforeAuth,
} from '@/lib/uk-career-assistant/guestSession'
import { openAppLevelAuth } from '@/lib/uk-career-assistant/pendingCareerPlan'

type Props = Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> & {
  href: string
  children: ReactNode
  /** Persist CA snapshot before leaving (default true). */
  preserveAssessment?: boolean
  onBeforeNavigate?: () => void
}

/**
 * Auth link that always opens at the top browsing context.
 * Prevents /auth from loading inside the Career Assistant iframe.
 */
export default function AppLevelAuthLink({
  href,
  children,
  preserveAssessment = true,
  onBeforeNavigate,
  className,
  ...rest
}: Props) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    onBeforeNavigate?.()
    if (preserveAssessment) {
      const snapshot = loadCaResultSnapshot()
      if (snapshot) preserveAssessmentBeforeAuth(snapshot)
    }
    openAppLevelAuth(href)
  }

  return (
    <a href={href} className={className} onClick={handleClick} {...rest}>
      {children}
    </a>
  )
}
