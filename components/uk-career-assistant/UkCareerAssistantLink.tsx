'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ComponentProps, MouseEvent, ReactNode } from 'react'
import { useUkCareerAssistantFloatOptional } from '@/contexts/UkCareerAssistantFloatContext'

type Props = Omit<ComponentProps<typeof Link>, 'href'> & {
  href?: string
  children: ReactNode
  /** Force full-page navigation even when float is available */
  forceFullPage?: boolean
}

/**
 * Opens floating Career Assistant with a short JAZ brain transition when available;
 * otherwise runs the same transition then navigates to the page.
 * On the assistant route itself, uses normal navigation (no entry show).
 */
export default function UkCareerAssistantLink({
  href = '/uk-career-assistant',
  children,
  forceFullPage = false,
  onClick,
  ...rest
}: Props) {
  const pathname = usePathname()
  const float = useUkCareerAssistantFloatOptional()
  const onAssistantPage = Boolean(pathname?.startsWith('/uk-career-assistant'))

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented) return
    if (onAssistantPage) return
    if (!float) return

    e.preventDefault()
    float.startAssistantWithTransition({
      href,
      forceFullPage,
    })
  }

  return (
    <Link href={href} prefetch onClick={handleClick} {...rest}>
      {children}
    </Link>
  )
}
