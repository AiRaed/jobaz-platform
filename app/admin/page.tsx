import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import AdminSectionCard from '@/components/admin/AdminSectionCard'
import { APP_HOME_HREF } from '@/lib/navigation/appHome'

export const metadata = {
  title: 'Admin | JobAZ',
  description: 'JobAZ administration area',
}

const SECTIONS = [
  {
    href: '/admin/ai',
    title: 'Admin AI',
    description:
      'Business reports, marketing copy, Career Assistant review, affiliate scout, technical checks, and Site Brain rules.',
    comingSoon: false,
  },
  {
    href: '/admin/tasks',
    title: 'Admin Tasks',
    description: 'Open actions from AI Manager Reports and manual ops — mark done, ignore, or reopen.',
    comingSoon: false,
  },
  {
    href: '/admin/ai-analytics',
    title: 'AI Analytics',
    description: 'Career Assistant usage, funnel drop-off, tool clicks, and assessment insights.',
    comingSoon: false,
  },
  {
    href: '/admin/jaz-career-engine',
    title: 'JAZ Career Engine',
    description:
      'Career Assistant control room — Ollama/fallback status, recent plans, course matching, missing affiliates.',
    comingSoon: false,
  },
  {
    href: '/admin/career-library',
    title: 'Career Knowledge Library',
    description:
      'Foundation for the next Career Assistant — fields, specialisms, and stage models JobAZ owns.',
    comingSoon: false,
  },
  {
    href: '/admin/courses',
    title: 'Courses',
    description: 'Manage course listings, providers, referral links, and Career Hub training catalogue.',
    comingSoon: false,
  },
  {
    href: '/admin/jobs',
    title: 'Jobs Management',
    description: 'Add, edit, and feature JobAZ managed jobs shown in unified search results.',
    comingSoon: false,
  },
  {
    href: '/admin/opportunities',
    title: 'Local Opportunities',
    description: 'Review, approve, reject, or remove small local work opportunity submissions.',
    comingSoon: false,
  },
  {
    href: '/admin/pulse',
    title: 'Pulse',
    description:
      'Create and publish career tips, course guides, opportunities and video posts. AI suggests drafts; admin publishes.',
    comingSoon: false,
  },
  {
    href: '/admin/relay',
    title: 'Relay Inbox',
    description:
      'Phase 1 professional inbox — opportunity enquiries, CV help, course questions, and JobAZ support. Reply as JobAZ Team.',
    comingSoon: false,
  },
  {
    href: '/admin/emails',
    title: 'Email Campaigns',
    description:
      'Create matched email campaigns for saved plans, jobs, courses, and local opportunities. AI suggests recipients; admin approves sending.',
    comingSoon: false,
  },
  {
    href: '/admin/users',
    title: 'Users',
    description: 'User accounts, activity, and platform engagement overview.',
    comingSoon: false,
  },
  {
    href: '/admin/saved-plans',
    title: 'Saved Plans',
    description: 'Career plans and saved courses across user journeys.',
    comingSoon: false,
  },
] as const

export default function AdminHomePage() {
  return (
    <AppShell>
      <header className="mb-8 pb-6 border-b border-slate-800/60">
        <Link
          href={APP_HOME_HREF}
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        <div className="flex items-start gap-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl border border-violet-500/30 bg-violet-950/30 shrink-0">
            <Shield className="w-6 h-6 text-violet-300" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-violet-300 mb-1">JobAZ Admin</p>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-50">Administration</h1>
            <p className="text-sm text-slate-400 mt-2 max-w-2xl">
              Internal tools for managing analytics, content, and platform operations.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {SECTIONS.map((section) => (
          <AdminSectionCard key={section.href} {...section} />
        ))}
      </div>
    </AppShell>
  )
}
