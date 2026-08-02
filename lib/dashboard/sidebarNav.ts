import type { LucideIcon } from 'lucide-react'
import {
  Activity,
  Briefcase,
  Compass,
  FileText,
  FolderOpen,
  LayoutDashboard,
  Mail,
  Map,
  MapPin,
  MessageSquare,
  Mic,
  PenLine,
  Radio,
  Search,
  User,
} from 'lucide-react'
import type { DashboardTabId } from '@/lib/dashboard/platformNav'
import { DASHBOARD_TABS } from '@/lib/dashboard/platformNav'
import { isProfileRoute } from '@/lib/dashboard/navigateDashboardTab'

export type SidebarNavItem = {
  href: string
  label: string
  shortLabel: string
  icon: LucideIcon
  description?: string
  /** Nested visual style under My Workspace */
  navLevel?: 'root' | 'child'
  /** Maps to dashboard workspace tab for active-state sync with top pills */
  tabId?: DashboardTabId
  /**
   * Highlight when any workspace tab is active
   * (Identity / My Plan / Documents / Saved Jobs / Saved Opportunities / Pulse Activity / Relay).
   */
  matchWorkspace?: boolean
}

export type SidebarNavSection = {
  id: string
  title: string
  description: string
  items: SidebarNavItem[]
}

export const SIDEBAR_AI_TOOLS: SidebarNavItem[] = [
  {
    href: '/cv-builder',
    label: 'CV Builder',
    shortLabel: 'CV',
    icon: FileText,
    description: 'Build and optimise your UK CV',
  },
  {
    href: '/cover-letter',
    label: 'Cover Letter',
    shortLabel: 'Cover',
    icon: Mail,
    description: 'Create tailored cover letters',
  },
  {
    href: '/interview-coach',
    label: 'Interview Coach',
    shortLabel: 'Interview',
    icon: Mic,
    description: 'Practice interviews with AI',
  },
  {
    href: '/writing-review',
    label: 'Writing Review',
    shortLabel: 'Writing',
    icon: PenLine,
    description: 'Polish applications and professional writing',
  },
]

/** Public main product actions — distinct from private workspace tabs. */
export const SIDEBAR_CAREER_EXPLORATION: SidebarNavItem[] = [
  {
    href: '/career-assistant',
    label: 'Start Career Assistant',
    shortLabel: 'Assistant',
    icon: MessageSquare,
    description: 'AI-guided career assessment and route planning',
  },
  {
    href: '/courses',
    label: 'Browse Courses',
    shortLabel: 'Courses',
    icon: Compass,
    description: 'Browse UK courses, licences and training providers',
  },
  {
    href: '/job-finder',
    label: 'Find Jobs',
    shortLabel: 'Jobs',
    icon: Search,
    description: 'Search UK job opportunities',
  },
  {
    href: '/opportunities',
    label: 'Local Opportunities',
    shortLabel: 'Opps',
    icon: MapPin,
    description: 'Small/local/quick work opportunities',
  },
  {
    href: '/feed',
    label: 'Career Tips / Pulse',
    shortLabel: 'Pulse',
    icon: Activity,
    description: 'Career tips from the JobAZ Career Team',
  },
]

/** Private workspace areas — synced with top pills. */
export const SIDEBAR_DASHBOARD_AREAS: SidebarNavItem[] = [
  {
    href: '/profile',
    label: 'Career Identity',
    shortLabel: 'Identity',
    icon: User,
    navLevel: 'child',
    tabId: 'profile',
  },
  {
    href: '/dashboard',
    label: 'My Plan',
    shortLabel: 'Plan',
    icon: Map,
    navLevel: 'child',
    tabId: 'overview',
  },
  {
    href: '/dashboard?tab=documents',
    label: 'Documents',
    shortLabel: 'Docs',
    icon: FolderOpen,
    navLevel: 'child',
    tabId: 'documents',
  },
  {
    href: '/dashboard?tab=jobs',
    label: 'Saved Jobs',
    shortLabel: 'Jobs',
    icon: Briefcase,
    navLevel: 'child',
    tabId: 'jobs',
  },
  {
    href: '/opportunities',
    label: 'Saved Opportunities',
    shortLabel: 'Opps',
    description: 'Local opportunities you saved or showed interest in',
    icon: MapPin,
    navLevel: 'child',
    tabId: 'opportunities',
  },
  {
    href: '/feed',
    label: 'Pulse Activity',
    shortLabel: 'Pulse',
    description: 'Saved posts and your Pulse activity',
    icon: Activity,
    navLevel: 'child',
    tabId: 'feed',
  },
  {
    href: '/messages',
    label: 'Relay',
    shortLabel: 'Relay',
    description: 'Professional work messages — limited Phase 1.',
    icon: Radio,
    navLevel: 'child',
    tabId: 'messages',
  },
]

export const SIDEBAR_DASHBOARD: SidebarNavItem[] = [
  {
    href: '/dashboard',
    label: 'My Workspace',
    shortLabel: 'Home',
    icon: LayoutDashboard,
    description: 'Your private career workspace',
    matchWorkspace: true,
  },
  ...SIDEBAR_DASHBOARD_AREAS,
]

export const SIDEBAR_SECTIONS: SidebarNavSection[] = [
  {
    id: 'career-exploration',
    title: 'Main actions',
    description: 'Browse jobs, courses, opportunities and tips',
    items: SIDEBAR_CAREER_EXPLORATION,
  },
  {
    id: 'ai-tools',
    title: 'Tools',
    description: 'Prepare applications and interviews',
    items: SIDEBAR_AI_TOOLS,
  },
  {
    id: 'dashboard',
    title: 'My Workspace',
    description: 'Your private career workspace',
    items: SIDEBAR_DASHBOARD,
  },
]

/** @deprecated Use SIDEBAR_SECTIONS — kept for legacy callers */
export const CAREER_TOOL_NAV = [
  ...SIDEBAR_AI_TOOLS,
  ...SIDEBAR_CAREER_EXPLORATION,
].map(({ href, label, shortLabel }) => ({ href, label, shortLabel }))

export function isCareerToolActive(pathname: string, href: string): boolean {
  if (href === '/cv-builder') {
    return pathname === '/cv-builder' || pathname === '/cv-builder-v2' || pathname.startsWith('/cv-builder/')
  }
  if (href === '/cover-letter') {
    return pathname === '/cover-letter' || pathname === '/cover' || pathname.startsWith('/cover/')
  }
  if (href === '/writing-review') {
    return (
      pathname === '/writing-review' ||
      pathname === '/proofreading' ||
      pathname.startsWith('/proofreading/')
    )
  }
  if (href === '/courses' || href === '/career-hub') {
    return (
      pathname === '/courses' ||
      pathname === '/career-hub' ||
      pathname.startsWith('/career-hub/') ||
      pathname.startsWith('/career-path/') ||
      pathname === '/build-your-path' ||
      pathname.startsWith('/build-your-path/') ||
      pathname.startsWith('/courses/')
    )
  }
  if (href === '/career-assistant' || href === '/uk-career-assistant') {
    return (
      pathname === '/career-assistant' ||
      pathname === '/uk-career-assistant' ||
      pathname.startsWith('/uk-career-assistant/')
    )
  }
  if (href === '/job-finder') {
    return pathname === '/job-finder' || pathname.startsWith('/job-details/')
  }
  if (href === '/opportunities') {
    return pathname === '/opportunities' || pathname.startsWith('/opportunities/')
  }
  if (href === '/feed') {
    return (
      pathname === '/feed' ||
      pathname.startsWith('/feed/') ||
      pathname === '/pulse' ||
      pathname.startsWith('/pulse/')
    )
  }
  if (href === '/dashboard' || href.startsWith('/dashboard?')) {
    return pathname === '/dashboard' || pathname.startsWith('/dashboard/')
  }
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** True when user is in a dashboard workspace area (any of the workspace tabs). */
export function isDashboardWorkspaceActive(pathname: string, tabParam: string | null): boolean {
  return DASHBOARD_TABS.some((tab) => isDashboardChildActive(pathname, tabParam, tab.id))
}

/** Active state for a dashboard sidebar child — synced with top pills. */
export function isDashboardChildActive(
  pathname: string,
  tabParam: string | null,
  tabId: DashboardTabId
): boolean {
  if (tabId === 'profile') return isProfileRoute(pathname)
  if (tabId === 'feed') {
    return (
      pathname === '/feed' ||
      pathname.startsWith('/feed/') ||
      pathname === '/pulse' ||
      pathname.startsWith('/pulse/')
    )
  }
  if (tabId === 'messages') {
    return (
      pathname === '/messages' ||
      pathname.startsWith('/messages/') ||
      pathname === '/relay'
    )
  }
  if (tabId === 'opportunities') {
    return pathname === '/opportunities' || pathname.startsWith('/opportunities/')
  }
  if (!(pathname === '/dashboard' || pathname.startsWith('/dashboard/'))) {
    return false
  }
  if (tabId === 'jobs') return tabParam === 'jobs'
  if (tabId === 'documents') return tabParam === 'documents'
  if (tabId === 'overview') {
    return !tabParam || tabParam === 'overview' || tabParam === 'training'
  }
  return false
}
