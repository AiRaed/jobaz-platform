'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  SIDEBAR_SECTIONS,
  isCareerToolActive,
  isDashboardChildActive,
  isDashboardWorkspaceActive,
  type SidebarNavItem,
} from '@/lib/dashboard/sidebarNav'
import { usePlatformSidebar } from '@/contexts/PlatformSidebarContext'
import { useUkCareerAssistantFloatOptional } from '@/contexts/UkCareerAssistantFloatContext'
import { platformSidebarWidthClass } from '@/lib/dashboard/platformDesignSystem'

function itemIsActive(
  item: SidebarNavItem,
  pathname: string,
  tabParam: string | null
): boolean {
  if (item.tabId) {
    return isDashboardChildActive(pathname, tabParam, item.tabId)
  }
  if (item.matchWorkspace) {
    return isDashboardWorkspaceActive(pathname, tabParam)
  }
  return isCareerToolActive(pathname, item.href)
}

function NavLink({
  item,
  pathname,
  tabParam,
  collapsed,
  workspaceChildActive,
  onNavigate,
}: {
  item: SidebarNavItem
  pathname: string
  tabParam: string | null
  collapsed: boolean
  workspaceChildActive: boolean
  onNavigate: () => void
}) {
  const float = useUkCareerAssistantFloatOptional()
  const isChild = item.navLevel === 'child'
  const isActive = itemIsActive(item, pathname, tabParam)

  // Dashboard root: softer parent-active when a child area is selected
  const parentActive = Boolean(item.matchWorkspace && workspaceChildActive)
  const strongActive = isActive && !parentActive

  const Icon = item.icon

  // When collapsed, skip indented children — Dashboard root covers workspace
  if (collapsed && isChild) return null

  const isCareerAssistant =
    item.href === '/uk-career-assistant' || item.href === '/career-assistant'
  const openAsFloat =
    isCareerAssistant &&
    float &&
    !pathname.startsWith('/uk-career-assistant') &&
    !pathname.startsWith('/career-assistant')

  return (
    <li>
      <Link
        href={item.href}
        prefetch
        onClick={(e) => {
          if (openAsFloat) {
            e.preventDefault()
            float.startAssistantWithTransition()
            onNavigate()
            return
          }
          onNavigate()
        }}
        title={collapsed ? item.label : undefined}
        aria-current={strongActive ? 'page' : undefined}
        className={cn(
          'jobaz-shell-nav',
          isChild && 'jobaz-shell-nav--child',
          strongActive && 'jobaz-shell-nav--active',
          parentActive && 'jobaz-shell-nav--parent-active',
          collapsed && 'justify-center px-1.5'
        )}
      >
        <Icon className={cn('shrink-0 opacity-95', isChild ? 'w-3.5 h-3.5' : 'w-4 h-4')} />
        {!collapsed && (
          <span
            className={cn(
              'truncate font-medium',
              isChild ? 'text-[11px]' : 'text-xs font-semibold'
            )}
          >
            {item.label}
          </span>
        )}
      </Link>
    </li>
  )
}

export default function PlatformSidebar() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')
  const { collapsed, toggleCollapsed, mobileOpen, setMobileOpen } = usePlatformSidebar()

  const closeMobile = () => setMobileOpen(false)
  const workspaceChildActive = isDashboardWorkspaceActive(pathname, tabParam)

  const sidebarContent = (
    <aside
      className={cn(
        'flex flex-col shrink-0 border-r jobaz-platform-sidebar h-full min-h-0 w-full',
        'transition-[width] duration-200 ease-out'
      )}
      aria-label="Platform tools"
    >
      {/* Sidebar-only scroll if the menu is taller than the viewport */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden overscroll-contain py-3 px-2 space-y-5">
        {SIDEBAR_SECTIONS.map((section) => {
          const childItems = section.items.filter((i) => i.navLevel === 'child')
          const rootItems = section.items.filter((i) => i.navLevel !== 'child')
          const hasChildBlock = childItems.length > 0 && !collapsed

          return (
            <div key={section.id}>
              {!collapsed && (
                <div className="px-2 mb-2">
                  <p className="jobaz-shell-section-label text-[10px] uppercase tracking-widest font-semibold">
                    {section.title}
                  </p>
                  <p className="jobaz-shell-section-desc text-[10px] leading-snug mt-0.5">
                    {section.description}
                  </p>
                </div>
              )}
              <ul className="space-y-0.5">
                {rootItems.map((item) => (
                  <NavLink
                    key={`${item.label}-${item.href}`}
                    item={item}
                    pathname={pathname}
                    tabParam={tabParam}
                    collapsed={collapsed}
                    workspaceChildActive={workspaceChildActive}
                    onNavigate={closeMobile}
                  />
                ))}
              </ul>
              {hasChildBlock && (
                <ul className="mt-0.5 ml-2 pl-2 border-l border-[color:var(--shell-sidebar-border)] space-y-0.5">
                  {childItems.map((item) => (
                    <NavLink
                      key={`${item.label}-${item.href}`}
                      item={item}
                      pathname={pathname}
                      tabParam={tabParam}
                      collapsed={collapsed}
                      workspaceChildActive={workspaceChildActive}
                      onNavigate={closeMobile}
                    />
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>

      <div className="shrink-0 border-t border-[var(--shell-sidebar-border)] p-2 hidden lg:block">
        <button
          type="button"
          onClick={toggleCollapsed}
          className={cn(
            'flex items-center justify-center gap-1 w-full rounded-lg py-1.5 text-[10px]',
            'jobaz-shell-section-label hover:text-white hover:bg-white/10 transition-colors',
            collapsed && 'px-0'
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )

  return (
    <>
      {/*
        Fixed desktop sidebar (lg+): left edge of viewport, below header.
        Width matches the in-flow spacer in PlatformChrome.
      */}
      <div
        className={cn(
          'hidden lg:flex fixed z-40 left-0',
          'bg-[var(--shell-sidebar-bg)] border-r border-[var(--shell-sidebar-border)]',
          'transition-[width] duration-200 ease-out',
          platformSidebarWidthClass(collapsed)
        )}
        style={{
          top: 'var(--jobaz-header-h, 4.5rem)',
          height: 'calc(100vh - var(--jobaz-header-h, 4.5rem))',
        }}
      >
        {sidebarContent}
      </div>

      {mobileOpen && (
        <button
          type="button"
          className="lg:hidden fixed inset-0 z-[55] bg-black/60 backdrop-blur-sm"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 left-0 z-[56] transition-transform duration-200',
          'h-full w-[15.5rem] bg-[var(--shell-sidebar-bg)]',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </div>
    </>
  )
}
