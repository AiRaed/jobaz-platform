'use client'

import type { ReactNode } from 'react'
import {
  PLATFORM_CARD,
  PLATFORM_CARD_HOVER,
  PLATFORM_CARD_PADDING,
} from '@/lib/dashboard/platformDesignSystem'
import { cn } from '@/lib/utils'

type Props = {
  children: ReactNode
  className?: string
  hover?: boolean
  padding?: boolean
}

export default function PlatformCard({
  children,
  className,
  hover = true,
  padding = true,
}: Props) {
  return (
    <div
      className={cn(
        PLATFORM_CARD,
        padding && PLATFORM_CARD_PADDING,
        hover && PLATFORM_CARD_HOVER,
        className
      )}
    >
      {children}
    </div>
  )
}
