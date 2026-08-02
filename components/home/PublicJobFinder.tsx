'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  MapPin,
  Target,
  MoreHorizontal,
  Bookmark,
  FileText,
  GraduationCap,
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { UK_CITIES } from '@/lib/uk-cities'
import { cn } from '@/lib/utils'
import CareerAuthWallModal from './CareerAuthWallModal'
import { usePublicJobSearch, type PublicJob } from './usePublicJobSearch'

type Props = {
  variant?: 'hero' | 'section'
  maxCards?: number
}

export function PublicJobFinderPanel({ variant = 'section', maxCards }: Props) {
  const router = useRouter()
  const [authOpen, setAuthOpen] = useState(false)
  const [redirectTo, setRedirectTo] = useState<string | null>(null)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const { keyword, setKeyword, location, setLocation, jobs, loading, searched, runSearch } =
    usePublicJobSearch()

  const isHero = variant === 'hero'
  const cardLimit = maxCards ?? (isHero ? 6 : 9)
  const visibleJobs = jobs.slice(0, cardLimit)

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      setIsLoggedIn(Boolean(session?.user))
    })
  }, [])

  const requireAuth = (action: string, jobId: string) => {
    const path = `/job-details/${encodeURIComponent(jobId)}?action=${action}`
    if (isLoggedIn) {
      router.push(path)
      return
    }
    setRedirectTo(path)
    setAuthOpen(true)
  }

  const panel = (
    <JobFinderPanel
      isHero={isHero}
      keyword={keyword}
      setKeyword={setKeyword}
      location={location}
      setLocation={setLocation}
      loading={loading}
      searched={searched}
      jobs={jobs}
      visibleJobs={visibleJobs}
      cardLimit={cardLimit}
      openMenuId={openMenuId}
      setOpenMenuId={setOpenMenuId}
      onSearch={() => void runSearch()}
      requireAuth={requireAuth}
    />
  )

  const authModal = (
    <CareerAuthWallModal isOpen={authOpen} onClose={() => setAuthOpen(false)} redirectTo={redirectTo} />
  )

  if (isHero) {
    return (
      <>
        {panel}
        {authModal}
      </>
    )
  }

  return (
    <>
      <section id="job-search" className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-50 mb-2">Search UK jobs</h2>
          <p className="text-slate-400 text-sm md:text-base">
            Browse openings instantly — sign in only when you&apos;re ready to apply.
          </p>
        </div>
        {panel}
      </section>
      {authModal}
    </>
  )
}

export function PublicJobFinderSection() {
  return <PublicJobFinderPanel variant="section" />
}

function JobFinderPanel({
  isHero,
  keyword,
  setKeyword,
  location,
  setLocation,
  loading,
  searched,
  jobs,
  visibleJobs,
  cardLimit,
  openMenuId,
  setOpenMenuId,
  onSearch,
  requireAuth,
}: {
  isHero: boolean
  keyword: string
  setKeyword: (v: string) => void
  location: string
  setLocation: (v: string) => void
  loading: boolean
  searched: boolean
  jobs: PublicJob[]
  visibleJobs: PublicJob[]
  cardLimit: number
  openMenuId: string | null
  setOpenMenuId: (fn: (id: string | null) => string | null) => void
  onSearch: () => void
  requireAuth: (action: string, jobId: string) => void
}) {
  return (
    <div
      id={isHero ? 'job-search-panel' : undefined}
      className="rounded-2xl border border-slate-700/60 bg-slate-950/60 backdrop-blur-xl shadow-[0_18px_40px_rgba(15,23,42,0.85)] p-4 md:p-6"
    >
      {isHero && (
        <div className="text-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-slate-50 mb-1.5">Search UK jobs</h2>
          <p className="text-slate-400 text-sm md:text-base">
            Browse openings instantly — sign in only when you&apos;re ready to apply.
          </p>
        </div>
      )}

      <SearchBar
        keyword={keyword}
        setKeyword={setKeyword}
        location={location}
        setLocation={setLocation}
        loading={loading}
        onSearch={onSearch}
      />

      <div>
        {loading && (
          <div className="flex justify-center py-8">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
          </div>
        )}

        {!loading && searched && jobs.length === 0 && (
          <p className="text-center text-slate-500 text-sm py-6">No jobs found — try another keyword.</p>
        )}

        {!loading && visibleJobs.length > 0 && (
          <div
            className={cn(
              'grid gap-4 md:gap-5',
              isHero ? 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3 mt-5' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6'
            )}
          >
            {visibleJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                menuOpen={openMenuId === job.id}
                onToggleMenu={() => setOpenMenuId((id) => (id === job.id ? null : job.id))}
                onView={() => requireAuth('view', job.id)}
                onSave={() => requireAuth('save', job.id)}
                onTailor={() => requireAuth('tailor', job.id)}
                onTrain={() => requireAuth('apply', job.id)}
              />
            ))}
          </div>
        )}

        {isHero && !loading && jobs.length > cardLimit && (
          <p className="text-sm text-slate-500 mt-5 text-center">
            +{jobs.length - cardLimit} more matches — refine your search to see them
          </p>
        )}
      </div>
    </div>
  )
}

function SearchBar({
  keyword,
  setKeyword,
  location,
  setLocation,
  loading,
  onSearch,
}: {
  keyword: string
  setKeyword: (v: string) => void
  location: string
  setLocation: (v: string) => void
  loading: boolean
  onSearch: () => void
}) {
  return (
    <div className="mb-2">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onSearch()}
            placeholder="Job title or keyword"
            className="w-full rounded-xl bg-slate-900/80 border border-slate-700/60 pl-10 pr-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/30"
          />
        </div>
        <div className="md:w-48 relative">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 pointer-events-none" />
          <select
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="w-full appearance-none rounded-xl bg-slate-900/80 border border-slate-700/60 pl-10 pr-4 py-3 text-sm text-slate-100 focus:border-violet-500/50 focus:outline-none"
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
          onClick={onSearch}
          disabled={loading || !keyword.trim()}
          className="rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white hover:from-violet-500 hover:to-purple-500 transition shadow-[0_0_20px_rgba(139,92,246,0.5)] disabled:opacity-50 whitespace-nowrap"
        >
          {loading ? 'Searching…' : 'Search jobs'}
        </button>
      </div>
    </div>
  )
}

function MatchBadge({ pct }: { pct: number }) {
  return (
    <span
      className={cn(
        'shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold tabular-nums',
        pct >= 70
          ? 'bg-emerald-500/20 text-emerald-300'
          : pct >= 50
            ? 'bg-amber-500/20 text-amber-300'
            : 'bg-slate-700/50 text-slate-400'
      )}
    >
      <Target className="w-3 h-3" />
      {pct}% Match
    </span>
  )
}

function JobCard({
  job,
  menuOpen,
  onToggleMenu,
  onView,
  onSave,
  onTailor,
  onTrain,
}: {
  job: PublicJob
  menuOpen: boolean
  onToggleMenu: () => void
  onView: () => void
  onSave: () => void
  onTailor: () => void
  onTrain: () => void
}) {
  return (
    <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 px-5 py-4 hover:border-violet-500/50 transition flex flex-col">
      <MatchBadge pct={job.matchPercentage} />
      <h3 className="text-base font-semibold text-slate-50 line-clamp-2 mb-1 mt-2">{job.title}</h3>
      <p className="text-sm text-violet-300 font-medium">{job.company}</p>
      <p className="text-xs text-slate-400 mb-3">{job.location}</p>
      {job.description && (
        <p className="text-xs text-slate-300 line-clamp-2 mb-4 flex-1">
          {job.description.replace(/<[^>]+>/g, '')}
        </p>
      )}
      <div className="flex items-center gap-2 relative">
        <button
          type="button"
          onClick={onView}
          className="flex-1 rounded-full bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 transition"
        >
          View Job
        </button>
        <div className="relative">
          <button
            type="button"
            onClick={onToggleMenu}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-600/70 bg-slate-800/80 text-slate-300 hover:border-violet-400/60"
            aria-label="More actions"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 bottom-full mb-1 z-10 min-w-[150px] rounded-xl border border-slate-700/60 bg-slate-950/95 py-1 shadow-xl">
              <MenuBtn icon={<Bookmark className="h-3.5 w-3.5" />} label="Save" onClick={onSave} />
              <MenuBtn icon={<FileText className="h-3.5 w-3.5" />} label="Tailor CV" onClick={onTailor} />
              <MenuBtn icon={<GraduationCap className="h-3.5 w-3.5" />} label="Train Interview" onClick={onTrain} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MenuBtn({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-200 hover:bg-violet-500/10"
    >
      {icon}
      {label}
    </button>
  )
}
