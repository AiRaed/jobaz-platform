'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, GraduationCap, Target, Sparkles } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import PageHeader from '@/components/PageHeader'
import { CAREER_PATHS } from '@/lib/career-paths'
import { cn } from '@/lib/utils'

export default function BuildYourPathPage() {
  const router = useRouter()

  return (
    <AppShell>
      <PageHeader 
        title="Build Your Path" 
        subtitle="Not ready to apply for a job yet? Explore career paths, build your skills, and prepare for the right opportunity."
        showBackToDashboard={true}
      />

      {/* Intro reassurance */}
      <p className="text-sm text-slate-400 mb-8">
        Not sure where to start? These paths show realistic routes into work — no degree required, just practical steps.
      </p>

      {/* Career Path Grid */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Target className="w-5 h-5 text-violet-400" />
          <h2 className="text-2xl font-bold text-slate-200">
            Explore Career Paths
          </h2>
        </div>
        <p className="text-slate-400 mb-8 text-sm">
          These paths don't require a university degree. Each one shows realistic steps, 
          short courses, and certificates to help you get job-ready.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {CAREER_PATHS.map((path) => (
            <Link
              key={path.id}
              href={`/build-your-path/${path.id}`}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-950/50",
                "p-6 hover:border-violet-500/50 hover:shadow-[0_0_40px_rgba(139,92,246,0.3)]",
                "transition-all duration-300 cursor-pointer"
              )}
            >
              <div className="pointer-events-none absolute inset-x-0 -top-10 h-24 bg-gradient-to-b from-violet-500/25 to-transparent opacity-0 group-hover:opacity-100 transition" />
              
              <div className="relative">
                <div className="flex items-start gap-4 mb-4">
                  <div className="text-4xl flex-shrink-0">{path.icon}</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-slate-50 mb-2 group-hover:text-violet-300 transition-colors">
                      {path.title}
                    </h3>
                    <p className="text-sm text-slate-400 leading-relaxed mb-3">
                      {path.description}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs text-slate-500 italic">
                    Who this path is good for:
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    {path.whoFor}
                  </p>
                </div>

                <div className="flex items-center gap-2 text-violet-400 group-hover:text-violet-300 transition-colors">
                  <span className="text-sm font-medium">Explore this path</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  No degree required • Entry-level friendly
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* JobAZ AI Integration Preview */}
      <div className="mt-16 p-8 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/20 to-fuchsia-950/20">
        <div className="flex items-center gap-3 mb-4">
          <Sparkles className="w-5 h-5 text-violet-400" />
          <h2 className="text-2xl font-bold text-slate-200">
            Ready to Apply? Use JobAZ AI
          </h2>
        </div>
        <p className="text-slate-400 mb-6 text-sm">
          Once you've chosen a path, JobAZ helps you turn it into real applications — CVs, cover letters, and interview practice.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/cv-builder-v2"
            className="p-4 rounded-lg border border-violet-500/20 bg-slate-950/50 hover:border-violet-400/50 hover:bg-violet-500/10 transition-colors"
          >
            <div className="text-sm font-semibold text-slate-200 mb-1">CV Builder</div>
            <div className="text-xs text-slate-400">Create a professional CV</div>
          </Link>
          <Link
            href="/interview-coach"
            className="p-4 rounded-lg border border-violet-500/20 bg-slate-950/50 hover:border-violet-400/50 hover:bg-violet-500/10 transition-colors"
          >
            <div className="text-sm font-semibold text-slate-200 mb-1">Interview Coach</div>
            <div className="text-xs text-slate-400">Practice interview answers</div>
          </Link>
          <Link
            href="/cover"
            className="p-4 rounded-lg border border-violet-500/20 bg-slate-950/50 hover:border-violet-400/50 hover:bg-violet-500/10 transition-colors"
          >
            <div className="text-sm font-semibold text-slate-200 mb-1">Cover Letter</div>
            <div className="text-xs text-slate-400">Write tailored cover letters</div>
          </Link>
          <Link
            href="/job-finder"
            className="p-4 rounded-lg border border-violet-500/20 bg-slate-950/50 hover:border-violet-400/50 hover:bg-violet-500/10 transition-colors"
          >
            <div className="text-sm font-semibold text-slate-200 mb-1">Job Finder</div>
            <div className="text-xs text-slate-400">Find matching jobs</div>
          </Link>
        </div>
      </div>

      {/* Soft legal clarity */}
      <p className="text-xs text-slate-500 mt-12 text-center">
        JobAZ provides career guidance and preparation tools. We don't guarantee job offers or course availability.
      </p>
    </AppShell>
  )
}


