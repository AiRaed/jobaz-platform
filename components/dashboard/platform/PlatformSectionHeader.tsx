'use client'

import {
  PLATFORM_DOT,
  PLATFORM_SECTION_DESCRIPTION,
  PLATFORM_SECTION_GAP,
  PLATFORM_SECTION_TITLE,
  type PlatformDotColor,
} from '@/lib/dashboard/platformDesignSystem'
import { cn } from '@/lib/utils'

type Props = {
  title: string
  description?: string
  dotColor?: PlatformDotColor
  className?: string
}

/** In-page section title (dashboard tabs, profile blocks). */
export default function PlatformSectionHeader({
  title,
  description,
  dotColor = 'violet',
  className,
}: Props) {
  return (
    <section className={cn(PLATFORM_SECTION_GAP, className)}>
      <h3 className={PLATFORM_SECTION_TITLE}>
        <span className={PLATFORM_DOT[dotColor]} aria-hidden />
        {title}
      </h3>
      {description && <p className={PLATFORM_SECTION_DESCRIPTION}>{description}</p>}
    </section>
  )
}
