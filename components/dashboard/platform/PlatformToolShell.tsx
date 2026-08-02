'use client'

import type { ReactNode } from 'react'
import PlatformChrome from '@/components/dashboard/platform/PlatformChrome'
import { usePlatformIdentity, type PlatformIdentity } from '@/hooks/usePlatformIdentity'

type Props = {
  children: ReactNode
  pageHeader?: ReactNode
  identity?: Partial<PlatformIdentity>
}

/** Tool pages — header + sidebar, no dashboard workspace tabs. */
export default function PlatformToolShell({ children, pageHeader, identity: identityOverride }: Props) {
  const identity = usePlatformIdentity(identityOverride)

  return (
    <PlatformChrome onLogout={identity.onLogout}>
      {pageHeader}
      {children}
    </PlatformChrome>
  )
}
