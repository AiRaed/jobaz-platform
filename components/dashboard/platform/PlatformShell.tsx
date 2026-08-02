'use client'

import type { ReactNode } from 'react'
import DashboardIdentityHeader from '@/components/dashboard/DashboardIdentityHeader'
import PlatformChrome from '@/components/dashboard/platform/PlatformChrome'
import { usePlatformIdentity, type PlatformIdentity } from '@/hooks/usePlatformIdentity'

type Props = {
  children: ReactNode
  pageHeader?: ReactNode
  identity?: Partial<PlatformIdentity>
}

/**
 * Career workspace shell: header, tool sidebar, identity + dashboard tabs, page content.
 */
export default function PlatformShell({ children, pageHeader, identity: identityOverride }: Props) {
  const identity = usePlatformIdentity(identityOverride)

  return (
    <PlatformChrome
      onLogout={identity.onLogout}
      workspaceNav={
        <DashboardIdentityHeader
          displayName={identity.displayName}
          displayEmail={identity.displayEmail}
          careerStateLabel={identity.careerStateLabel}
        />
      }
    >
      {pageHeader}
      {children}
    </PlatformChrome>
  )
}
