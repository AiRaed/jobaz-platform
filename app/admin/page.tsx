import Link from 'next/link'
import { ArrowLeft, Shield } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import AdminSectionCard from '@/components/admin/AdminSectionCard'
import { APP_HOME_HREF } from '@/lib/navigation/appHome'

export const metadata = {
  title: 'Admin | JobAZ',
  description: 'JobAZ administration area',
}

/** UK Career Assistant libraries + engine — grouped for clarity. */
const UK_CAREER_ASSISTANT = [
  {
    href: '/admin/career-library',
    title: 'Work in My Education Library',
    description:
      'Controls the Work in My Education path. Education-based career knowledge for users who want to use their degree, academic field, or studied subject in the UK.',
    comingSoon: false,
  },
  {
    href: '/admin/career-library/work-in-profession',
    title: 'Profession & Start New Career Library',
    description:
      'Controls Work in My Profession and Start a New Career. One shared practical profession library — Profession prioritises roles/jobs; Start a New Career prioritises courses, licences, and first steps.',
    comingSoon: false,
  },
  {
    href: '/admin/career-library/extra-income',
    title: 'Extra Income Library',
    description:
      'Controls the Looking for Extra Income path. Side-income and flexible work routes, short training, supported jobs, and provider matching (admin editor coming after launch).',
    comingSoon: false,
  },
  {
    href: '/admin/jaz-career-engine',
    title: 'Career Assistant Engine',
    description:
      'Controls engine health across Career Assistant paths — JAZ status, assistant logs, behaviour analytics, course matching, missing affiliates, and test tools.',
    comingSoon: false,
  },
] as const

const OTHER_SECTIONS = [
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

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="mb-4">
      <p className="text-[10px] uppercase tracking-widest text-cyan-300/90 mb-1">{eyebrow}</p>
      <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
      <p className="text-sm text-slate-400 mt-1 max-w-3xl">{description}</p>
    </div>
  )
}

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

      <section
        id="uk-career-assistant"
        className="mb-10 scroll-mt-6"
        aria-labelledby="uk-career-assistant-heading"
      >
        <SectionHeading
          eyebrow="Career paths"
          title="UK Career Assistant"
          description="Each library below controls a Career Assistant path. Profession and Start a New Career share one library with different result priority — they are not separate databases."
        />
        <h2 id="uk-career-assistant-heading" className="sr-only">
          UK Career Assistant
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {UK_CAREER_ASSISTANT.map((section) => (
            <AdminSectionCard key={section.href} {...section} tone="cyan" />
          ))}
        </div>
      </section>

      <section aria-labelledby="platform-ops-heading">
        <SectionHeading
          eyebrow="Platform"
          title="Operations & content"
          description="AI tools, marketplace content, users, and day-to-day platform operations."
        />
        <h2 id="platform-ops-heading" className="sr-only">
          Operations and content
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {OTHER_SECTIONS.map((section) => (
            <AdminSectionCard key={section.href} {...section} />
          ))}
        </div>
      </section>
    </AppShell>
  )
}
