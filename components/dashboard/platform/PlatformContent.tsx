'use client'

import type { ReactNode } from 'react'
import {
  PLATFORM_AMBIENT_CYAN,
  PLATFORM_AMBIENT_VIOLET,
  PLATFORM_CONTENT,
} from '@/lib/dashboard/platformDesignSystem'
import { cn } from '@/lib/utils'

type Props = {
  children: ReactNode
  className?: string
  withAmbient?: boolean
}

export default function PlatformContent({ children, className, withAmbient = false }: Props) {
  return (
    <div className={cn(PLATFORM_CONTENT, className)}>
      {withAmbient && (
        <>
          <div className={PLATFORM_AMBIENT_VIOLET} aria-hidden />
          <div className={PLATFORM_AMBIENT_CYAN} aria-hidden />
        </>
      )}
      {children}
    </div>
  )
}
