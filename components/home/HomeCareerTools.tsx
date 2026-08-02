'use client'

import Link from 'next/link'
import {
  FileText,
  Mail,
  GraduationCap,
  FileCheck,
  Compass,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const TOOLS = [
  {
    href: '/cv-builder',
    title: 'CV Builder',
    description: 'Build and improve your CV for UK applications.',
    icon: FileText,
  },
  {
    href: '/cover-letter',
    title: 'Cover Letters',
    description: 'Tailored letters for each role you apply to.',
    icon: Mail,
  },
  {
    href: '/interview-coach',
    title: 'Interview Coach',
    description: 'Practice answers and build confidence.',
    icon: GraduationCap,
  },
  {
    href: '/writing-review',
    title: 'Writing Review',
    description: 'Polish CVs, emails, and application text.',
    icon: FileCheck,
    badge: 'Beta',
  },
  {
    href: '/build-your-path',
    title: 'Skill Paths',
    description: 'Explore training routes before you apply.',
    icon: Compass,
  },
] as const

export default function HomeCareerTools() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-16 md:py-20">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-slate-50 mb-2">Career tools that work together</h2>
        <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto">
          CV, applications, interviews, and writing — one platform for your UK job search.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {TOOLS.map((tool) => {
          const Icon = tool.icon
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className={cn(
                'group relative rounded-2xl border border-slate-700/60 bg-slate-950/50 p-5',
                'hover:border-violet-500/50 hover:shadow-[0_18px_50px_rgba(76,29,149,0.45)] transition-all duration-300'
              )}
            >
              {'badge' in tool && tool.badge && (
                <span className="absolute top-3 right-3 text-[10px] uppercase tracking-wide text-violet-300 border border-violet-500/40 rounded-full px-2 py-0.5">
                  {tool.badge}
                </span>
              )}
              <Icon className="h-5 w-5 text-violet-400 mb-3" />
              <h3 className="text-base font-semibold text-slate-50 mb-1">{tool.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{tool.description}</p>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
