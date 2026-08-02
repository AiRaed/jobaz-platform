'use client'

import Link from 'next/link'
import {
  ArrowRight,
  FileText,
  Mail,
  Search,
  GraduationCap,
  Compass,
  MessageSquare,
  FileCheck,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import UkCareerAssistantLink from '@/components/uk-career-assistant/UkCareerAssistantLink'

type ToolBadge = 'Beta' | 'Recommended' | 'Popular'

type CareerTool = {
  href: string
  title: string
  description: string
  icon: LucideIcon
  badge?: ToolBadge
}

const BADGE_STYLES: Record<ToolBadge, string> = {
  Beta: 'border-cyan-500/30 bg-cyan-500/10 text-cyan-300/90',
  Recommended: 'border-violet-500/35 bg-violet-500/10 text-violet-200/90',
  Popular: 'border-amber-500/30 bg-amber-500/10 text-amber-200/90',
}

const TOOLS: CareerTool[] = [
  {
    href: '/cv-builder',
    title: 'CV Builder',
    description: 'Create or edit your CV',
    icon: FileText,
    badge: 'Popular',
  },
  {
    href: '/cover-letter',
    title: 'Cover Letter',
    description: 'Tailored cover letters',
    icon: Mail,
  },
  {
    href: '/job-finder',
    title: 'Job Finder',
    description: 'Search UK jobs',
    icon: Search,
    badge: 'Popular',
  },
  {
    href: '/interview-coach',
    title: 'Interview Coach',
    description: 'Practice with AI feedback',
    icon: GraduationCap,
  },
  {
    href: '/build-your-path',
    title: 'Build Your Path',
    description: 'Explore career paths',
    icon: Compass,
  },
  {
    href: '/uk-career-assistant',
    title: 'UK Career Assistant',
    description: 'AI career assessment',
    icon: MessageSquare,
    badge: 'Recommended',
  },
  {
    href: '/writing-review',
    title: 'Writing Review',
    description: 'Polish professional text',
    icon: FileCheck,
    badge: 'Beta',
  },
]

export default function CareerToolsGrid() {
  return (
    <section className="mb-8" aria-labelledby="quick-tools-heading">
      <div className="mb-3">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-medium mb-0.5">
          Career tools
        </p>
        <h2 id="quick-tools-heading" className="text-sm font-semibold text-slate-300">
          Quick tools
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Fast access to dashboard modules — open any tool without leaving your overview.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2.5">
        {TOOLS.map((tool) => {
          const Icon = tool.icon
          const className = cn(
            'group relative flex items-start gap-2.5 rounded-xl border px-3 py-2.5 min-h-0',
            'border-slate-800/80 bg-slate-900/50',
            'hover:border-slate-600/80 hover:bg-slate-800/60 transition-colors duration-200'
          )
          const inner = (
            <>
              {tool.badge && (
                <span
                  className={cn(
                    'absolute top-1.5 right-1.5 rounded px-1 py-px text-[8px] font-semibold uppercase leading-none',
                    BADGE_STYLES[tool.badge]
                  )}
                >
                  {tool.badge}
                </span>
              )}

              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-700/60 bg-slate-800/80 text-violet-400/90">
                <Icon className="h-3.5 w-3.5" />
              </div>

              <div className="min-w-0 flex-1 pr-4">
                <h3 className="text-xs font-semibold text-slate-200 group-hover:text-slate-50 truncate">
                  {tool.title}
                </h3>
                <p className="text-[10px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
                  {tool.description}
                </p>
                <span className="mt-1.5 inline-flex items-center gap-0.5 text-[10px] font-medium text-slate-500 group-hover:text-violet-300/90">
                  Open
                  <ArrowRight className="h-2.5 w-2.5 opacity-70 group-hover:translate-x-0.5 transition-transform" />
                </span>
              </div>
            </>
          )

          if (tool.href === '/uk-career-assistant') {
            return (
              <UkCareerAssistantLink key={tool.href} className={className}>
                {inner}
              </UkCareerAssistantLink>
            )
          }

          return (
            <Link key={tool.href} href={tool.href} className={className}>
              {inner}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
