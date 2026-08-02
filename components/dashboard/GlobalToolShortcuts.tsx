'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { CAREER_TOOL_NAV, isCareerToolActive } from '@/lib/dashboard/careerToolNav'
import {
  PLATFORM_EYEBROW,
  PLATFORM_PILL_BASE,
  PLATFORM_PILL_GAP,
  PLATFORM_PILL_TOOL_ACTIVE,
  PLATFORM_PILL_TOOL_INACTIVE,
  PLATFORM_TOOLS_INNER,
} from '@/lib/dashboard/platformDesignSystem'
import { cn } from '@/lib/utils'

export default function GlobalToolShortcuts() {
  const pathname = usePathname()

  return (
    <section className={PLATFORM_TOOLS_INNER} aria-label="Global workspace tools">
      <p className={PLATFORM_EYEBROW}>Workspace tools</p>
      <nav className="overflow-x-auto scrollbar-none">
        <div className={cn('flex flex-wrap min-w-0', PLATFORM_PILL_GAP)}>
          {CAREER_TOOL_NAV.map((tool) => {
            const isActive = isCareerToolActive(pathname, tool.href)
            return (
              <Link
                key={tool.href}
                href={tool.href}
                prefetch
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  PLATFORM_PILL_BASE,
                  isActive ? PLATFORM_PILL_TOOL_ACTIVE : PLATFORM_PILL_TOOL_INACTIVE
                )}
              >
                <span className="hidden lg:inline">{tool.label}</span>
                <span className="lg:hidden">{tool.shortLabel}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    </section>
  )
}
