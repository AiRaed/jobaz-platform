'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowRight, Brain, Briefcase, Clock, GraduationCap, MapPin, Search, Sparkles } from 'lucide-react'
import { UK_CITIES } from '@/lib/uk-cities'
import { cn } from '@/lib/utils'

const COURSE_SUGGESTIONS = [
  'English',
  'SIA',
  'Excel',
  'Care',
  'Electrician',
  'Warehouse',
  'Forklift',
  'ACCA',
] as const

export default function LandingPillars() {
  return (
    <section id="platform-pillars" className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6">
      <AiAssessmentPillar />
      <JobSearchPillar />
      <CourseSearchPillar />
    </section>
  )
}

function AiAssessmentPillar() {
  return (
    <div
      className={cn(
        'lg:col-span-5 rounded-2xl border border-violet-500/30 bg-gradient-to-br from-violet-950/40 via-slate-950/80 to-indigo-950/30',
        'p-6 shadow-[0_0_50px_rgba(139,92,246,0.12)] flex flex-col'
      )}
    >
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-violet-600/25 border border-violet-500/30 flex items-center justify-center">
          <Brain className="w-5 h-5 text-violet-300" />
        </div>
        <span className="text-[10px] uppercase tracking-widest font-semibold text-violet-300">
          Primary · AI Career Assessment
        </span>
      </div>

      <h2 className="text-xl md:text-2xl font-bold text-slate-50 mb-2">Find the fastest path to work</h2>
      <p className="text-sm text-slate-400 leading-relaxed mb-5 flex-1">
        Answer a few questions and JAZ builds your personalised UK career plan based on your education,
        experience and goals.
      </p>

      <ul className="space-y-2 mb-6">
        {[
          { icon: Clock, text: '2 minute assessment' },
          { icon: Sparkles, text: 'Free' },
          { icon: Brain, text: 'No registration required' },
        ].map(({ icon: Icon, text }) => (
          <li key={text} className="flex items-center gap-2 text-sm text-slate-300">
            <Icon className="w-4 h-4 text-violet-400 shrink-0" />
            {text}
          </li>
        ))}
      </ul>

      <Link
        href="#jaz-panel"
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:from-violet-500 hover:to-fuchsia-500 transition"
      >
        Start Free Assessment
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}

function JobSearchPillar() {
  const router = useRouter()
  const [keyword, setKeyword] = useState('')
  const [location, setLocation] = useState('London')

  const handleSearch = () => {
    const q = keyword.trim()
    if (!q) return
    const params = new URLSearchParams({ query: q, location })
    router.push(`/job-finder?${params.toString()}`)
  }

  return (
    <div className="lg:col-span-4 rounded-2xl border border-slate-700/60 bg-slate-950/60 backdrop-blur-xl p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-cyan-600/15 border border-cyan-500/25 flex items-center justify-center">
          <Briefcase className="w-5 h-5 text-cyan-300" />
        </div>
        <span className="text-[10px] uppercase tracking-widest font-semibold text-cyan-300/90">
          Search Jobs
        </span>
      </div>

      <h2 className="text-lg font-bold text-slate-50 mb-1">Browse UK jobs instantly</h2>
      <p className="text-sm text-slate-400 mb-5">
        Search without an account — sign up only when you apply or save roles.
      </p>

      <div className="space-y-3 flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Job keyword"
            className="w-full rounded-xl bg-slate-900/80 border border-slate-700/60 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-cyan-500/40 focus:outline-none"
          />
        </div>
        <div className="relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full appearance-none rounded-xl bg-slate-900/80 border border-slate-700/60 pl-10 pr-4 py-2.5 text-sm text-slate-100 focus:border-cyan-500/40 focus:outline-none"
          >
            {UK_CITIES.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={handleSearch}
          disabled={!keyword.trim()}
          className="w-full rounded-xl border border-cyan-500/30 bg-cyan-600/20 py-2.5 text-sm font-semibold text-cyan-100 hover:bg-cyan-600/30 disabled:opacity-40 transition"
        >
          Search jobs
        </button>
      </div>
    </div>
  )
}

function CourseSearchPillar() {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const searchCourses = (term: string) => {
    const q = term.trim()
    if (!q) return
    router.push(`/career-hub?tag=${encodeURIComponent(q.toLowerCase())}`)
  }

  return (
    <div className="lg:col-span-3 rounded-2xl border border-slate-700/60 bg-slate-950/60 backdrop-blur-xl p-6 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-10 h-10 rounded-xl bg-amber-600/15 border border-amber-500/25 flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-amber-300" />
        </div>
        <span className="text-[10px] uppercase tracking-widest font-semibold text-amber-300/90">
          Courses
        </span>
      </div>

      <h2 className="text-lg font-bold text-slate-50 mb-1">Professional training</h2>
      <p className="text-sm text-slate-400 mb-4">Build skills UK employers value.</p>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && searchCourses(query)}
          placeholder="Search courses"
          className="w-full rounded-xl bg-slate-900/80 border border-slate-700/60 pl-10 pr-4 py-2.5 text-sm text-slate-100 placeholder:text-slate-500 focus:border-amber-500/40 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4">
        {COURSE_SUGGESTIONS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => searchCourses(tag)}
            className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-slate-700/50 text-slate-400 hover:border-amber-500/35 hover:text-amber-200 transition"
          >
            {tag}
          </button>
        ))}
      </div>

      <p className="mt-auto text-[11px] text-slate-500 border border-slate-800/80 rounded-lg px-3 py-2 bg-slate-900/40">
        Recommended learning paths launching soon · Affiliate courses supported
      </p>
    </div>
  )
}
