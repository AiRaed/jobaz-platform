'use client'

import type { CSSProperties, ReactNode } from 'react'
import { Suspense } from 'react'
import { PlatformSidebarProvider, usePlatformSidebar } from '@/contexts/PlatformSidebarContext'
import PlatformHeader from '@/components/dashboard/PlatformHeader'
import PlatformSidebar from '@/components/dashboard/PlatformSidebar'
import {
  PLATFORM_HEADER_HEIGHT,
  PLATFORM_MAIN_PADDING,
  PLATFORM_SHELL_MAX_WIDTH,
  PLATFORM_STICKY_CHROME,
  platformSidebarWidthClass,
} from '@/lib/dashboard/platformDesignSystem'
import { cn } from '@/lib/utils'

type Props = {
  children: ReactNode
  onLogout: () => void | Promise<void>
  /** Identity card + dashboard tabs (workspace pages only) */
  workspaceNav?: ReactNode
}

function SidebarFallback({ collapsed }: { collapsed: boolean }) {
  return (
    <>
      <div
        className={cn('hidden lg:block shrink-0', platformSidebarWidthClass(collapsed))}
        aria-hidden
      />
      <div
        className={cn(
          'hidden lg:block fixed z-40 left-0 bg-[var(--shell-sidebar-bg)] border-r border-[var(--shell-sidebar-border)]',
          platformSidebarWidthClass(collapsed)
        )}
        style={{
          top: 'var(--jobaz-header-h)',
          height: 'calc(100vh - var(--jobaz-header-h))',
        }}
        aria-hidden
      />
    </>
  )
}

function PlatformBody({
  children,
  workspaceNav,
}: {
  children: ReactNode
  workspaceNav?: ReactNode
}) {
  const { collapsed } = usePlatformSidebar()
  const widthClass = platformSidebarWidthClass(collapsed)

  return (
    <div
      className="jobaz-platform-body flex items-stretch bg-[var(--bg-main)]"
      style={{ minHeight: 'calc(100vh - var(--jobaz-header-h))' }}
    >
      {/* In-flow spacer — reserves width for fixed lg+ sidebar */}
      <div
        className={cn('hidden lg:block shrink-0 transition-[width] duration-200 ease-out', widthClass)}
        aria-hidden
      />

      <Suspense fallback={<SidebarFallback collapsed={collapsed} />}>
        <PlatformSidebar />
      </Suspense>

      <main
        className={cn('flex-1 min-w-0 bg-[var(--bg-main)]', PLATFORM_MAIN_PADDING)}
        style={{ minHeight: 'calc(100vh - var(--jobaz-header-h))' }}
      >
        <div className="mx-auto w-full max-w-[1440px]">
          {workspaceNav}
          {children}
        </div>
      </main>
    </div>
  )
}

/**
 * Shared platform chrome: sticky header + fixed desktop sidebar + scrolling main content.
 */
export default function PlatformChrome({ children, onLogout, workspaceNav }: Props) {
  return (
    <PlatformSidebarProvider>
      <div
        className="min-h-screen"
        style={
          {
            ['--jobaz-header-h' as string]: PLATFORM_HEADER_HEIGHT,
            ['--jobaz-shell-max' as string]: PLATFORM_SHELL_MAX_WIDTH,
          } as CSSProperties
        }
      >
        <div className={PLATFORM_STICKY_CHROME}>
          <PlatformHeader onLogout={onLogout} />
        </div>

        <PlatformBody workspaceNav={workspaceNav}>{children}</PlatformBody>
      </div>
    </PlatformSidebarProvider>
  )
}
