'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Briefcase, ArrowRight, ExternalLink, Loader2 } from 'lucide-react'
import { getCareerPathById } from '@/lib/career-paths'
import { useBuildYourPathProfile } from '@/hooks/useBuildYourPathProfile'
import {
  computePathMatch,
  getPathIntelligence,
  getTrackedPathIds,
  trackPathLocally,
} from '@/lib/build-your-path/pathIntelligence'
import YourMatchSection from '@/components/build-your-path/YourMatchSection'
import CareerTimelineSection from '@/components/build-your-path/CareerTimelineSection'
import SalaryProgressionCard from '@/components/build-your-path/SalaryProgressionCard'
import PathPrepareSidebar from '@/components/build-your-path/PathPrepareSidebar'
import CareerHubCourseCard from '@/components/career-hub/CareerHubCourseCard'
import CareerAuthWallModal from '@/components/home/CareerAuthWallModal'
import { upsertCareerPlanItem } from '@/lib/career-hub/myPlan'
import { OFFICIAL_UK_COURSE_SEARCH } from '@/lib/career-hub/supabaseCourses'
import type { CareerHubCourseListing } from '@/lib/career-hub/types'
import type { RecommendedTrainingRoute } from '@/lib/career-hub/trainingPlan'

type Props = {
  pathId: string
  caSessionId?: string | null
  recommendedRoute?: RecommendedTrainingRoute | null
}

function getJobSearchKeyword(id: string, fallback: string): string {
  const keywordMap: Record<string, string> = {
    'translator-interpreter': 'Interpreter',
    electrician: 'Electrician',
    'plumbing-handyman': 'Plumber',
    'driving-transport': 'Delivery Driver',
    'security-facilities': 'Security Officer',
    cleaner: 'Cleaner',
    'warehouse-logistics': 'Warehouse Operative',
    'office-admin': 'Admin Assistant',
    'care-support': 'Support Worker',
    'hospitality-front': 'Front of House',
    'teaching-support': 'Teaching Assistant',
    'construction-trades': 'Construction Worker',
    'digital-ai-beginner': 'Data Entry',
    'maintenance-facilities': 'Maintenance Worker',
    'self-employed-freelance': 'Freelance',
  }
  return keywordMap[id] || fallback
}

export default function CareerHubRoutePanel({ pathId, caSessionId, recommendedRoute }: Props) {
  const router = useRouter()
  const profile = useBuildYourPathProfile()
  const path = getCareerPathById(pathId)

  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'track' | 'jobs'>('track')
  const [trackedIds, setTrackedIds] = useState<string[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    setTrackedIds(getTrackedPathIds())
  }, [pathId])

  const intelligence = useMemo(
    () => (path ? getPathIntelligence(path, profile) : null),
    [path, profile]
  )
  const profileMatch = useMemo(
    () => (path ? computePathMatch(path, profile) : null),
    [path, profile]
  )

  const assessmentMatch = useMemo(() => {
    if (!recommendedRoute || !path) return null
    return {
      score: recommendedRoute.readinessPercent,
      readinessRange: `${recommendedRoute.readinessPercent}% ready for applications`,
      hasPersonalization: true,
      signals: [
        {
          type: 'positive' as const,
          text: `Recommended from your Career Assistant assessment — next step: ${recommendedRoute.nextStepLabel}`,
        },
        {
          type: 'neutral' as const,
          text: 'Based on your profile, this is a realistic route into UK employment.',
        },
      ],
    }
  }, [recommendedRoute, path])

  const match = caSessionId && assessmentMatch ? assessmentMatch : profileMatch
  const isTracked = trackedIds.includes(pathId)
  const [courses, setCourses] = useState<CareerHubCourseListing[]>([])
  const [coursesLoading, setCoursesLoading] = useState(true)
  const [coursesError, setCoursesError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setCoursesLoading(true)
    setCoursesError(null)

    fetch(`/api/career-hub/courses?pathId=${encodeURIComponent(pathId)}`, { cache: 'no-store' })
      .then(async (res) => {
        const body = (await res.json()) as {
          courses?: CareerHubCourseListing[]
          pathId?: string
          debug?: Array<Record<string, unknown>>
          supabaseError?: string
          error?: string
        }
        if (!res.ok) throw new Error(body.error || 'Failed to load courses')

        console.log('[CareerHub UI] current route slug:', body.pathId ?? pathId)
        if (body.supabaseError) {
          console.warn('[CareerHub UI] Supabase error:', body.supabaseError)
        }
        if (body.debug?.length) {
          console.log('[CareerHub UI] course visibility debug:', body.debug)
          for (const entry of body.debug) {
            console.log('[CareerHub UI] Supabase row check:', {
              title: entry.title,
              status: entry.status,
              show_in_career_hub: entry.show_in_career_hub,
              appears_in_routes: entry.appears_in_routes,
            })
            if (!entry.visible) {
              console.log('[CareerHub UI] filtered out:', entry.title, '→', entry.filteredOutBecause, entry.details)
            }
          }
        }
        console.log('[CareerHub UI] courses shown:', body.courses?.length ?? 0)

        if (!cancelled) setCourses(body.courses ?? [])
      })
      .catch((err) => {
        if (!cancelled) {
          setCourses([])
          setCoursesError(err instanceof Error ? err.message : 'Failed to load courses')
        }
      })
      .finally(() => {
        if (!cancelled) setCoursesLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [pathId])

  const navigateToJobs = useCallback(() => {
    if (!path) return
    void import('@/lib/jobaz-ai/skillPathSignals').then(({ emitSkillGoalSelected }) =>
      emitSkillGoalSelected({ pathId: path.id, pathName: path.title, goalType: 'jobs' })
    )
    if (typeof window !== 'undefined') {
      localStorage.setItem('jobaz_career_path', JSON.stringify({ pathId: path.id, pathTitle: path.title }))
    }
    const keyword = getJobSearchKeyword(path.id, path.title)
    const jobParams = new URLSearchParams()
    jobParams.set('query', keyword)
    jobParams.set('location', 'UK (Anywhere)')
    router.push(`/job-finder?${jobParams.toString()}`)
  }, [path, router])

  const handleCreateCV = useCallback(() => {
    if (!path) return
    void import('@/lib/jobaz-ai/skillPathSignals').then(({ emitSkillGoalSelected }) =>
      emitSkillGoalSelected({ pathId: path.id, pathName: path.title, goalType: 'cv' })
    )
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'jobaz_career_path',
        JSON.stringify({
          pathId: path.id,
          pathTitle: path.title,
          skills: path.requirements.certificates.concat(path.requirements.shortCourses),
        })
      )
    }
    router.push('/cv-builder-v2')
  }, [path, router])

  const handleUnlockJobs = useCallback(() => {
    if (profile.isLoggedIn) {
      navigateToJobs()
      return
    }
    setAuthMode('jobs')
    setAuthOpen(true)
  }, [profile.isLoggedIn, navigateToJobs])

  const handleTrackProgress = useCallback(() => {
    if (profile.isLoggedIn) {
      trackPathLocally(pathId)
      setTrackedIds(getTrackedPathIds())
      return
    }
    setAuthMode('track')
    setAuthOpen(true)
  }, [profile.isLoggedIn, pathId])

  if (!path || !intelligence || !match) {
    return (
      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-8 text-center">
        <p className="text-slate-400">Select a career route to view courses and training options.</p>
      </div>
    )
  }

  const jobsRedirect = `/job-finder?query=${encodeURIComponent(getJobSearchKeyword(path.id, path.title))}&location=UK%20(Anywhere)`

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-5 md:p-6">
        <div className="flex items-start gap-4">
          <span className="text-4xl md:text-5xl">{path.icon}</span>
          <div className="min-w-0 flex-1">
            <h2 className="text-xl md:text-2xl font-bold text-slate-50">{path.title}</h2>
            <p className="text-sm text-slate-400 mt-2 leading-relaxed">{path.description}</p>
            <p className="text-xs text-slate-500 italic mt-2">{path.whoFor}</p>
          </div>
        </div>
      </header>

      <YourMatchSection match={match} pathTitle={path.title} />

      <section className="rounded-2xl border border-emerald-500/25 bg-emerald-950/10 p-5 md:p-6">
        <p className="text-[10px] uppercase tracking-widest text-emerald-300 mb-1">Recommended courses & licences</p>
        <p className="text-sm text-slate-400 mb-5">
          Start with training that gets you job-ready — save courses to your plan as you go.
        </p>

        {coursesLoading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-slate-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Loading courses…
          </div>
        ) : courses.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700/60 bg-slate-950/40 px-5 py-10 text-center">
            <p className="text-sm text-slate-300 max-w-md mx-auto">
              Courses coming soon for this route. Use the official UK course search for now.
            </p>
            {coursesError && (
              <p className="text-xs text-amber-400/90 mt-2">{coursesError}</p>
            )}
            <a
              href={OFFICIAL_UK_COURSE_SEARCH}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-5 text-sm font-medium text-blue-300 hover:text-blue-200 border border-blue-500/25 bg-blue-950/20 rounded-xl px-4 py-2.5 transition"
            >
              <ExternalLink className="w-4 h-4" />
              Official UK Course Search
            </a>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {courses.map((listing, index) => (
              <div key={listing.adminCourseId ?? listing.slug} id={`course-${listing.slug}`} className="scroll-mt-24">
                <CareerHubCourseCard
                  course={listing}
                  featured={listing.isFeatured}
                  inline
                  applySource="pathway_result"
                  pathwayBadge={
                    index === 0
                      ? 'Required first step'
                      : index === 1
                        ? 'Recommended for your path'
                        : 'Good next step'
                  }
                  onSave={() =>
                    upsertCareerPlanItem({
                      courseName: listing.name,
                      courseSlug: listing.slug,
                      pathId,
                      status: 'saved',
                      source: 'career_hub',
                    })
                  }
                />
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="grid md:grid-cols-2 gap-6">
        <SalaryProgressionCard salary={intelligence.salary} />
        <CareerTimelineSection steps={intelligence.timeline} />
      </div>

      <section className="rounded-2xl border border-cyan-500/25 bg-cyan-950/10 p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Briefcase className="w-4 h-4 text-cyan-400" />
              <h3 className="text-lg font-bold text-slate-200">Suggested jobs</h3>
            </div>
            <p className="text-sm text-slate-400">
              When your training is underway, search real openings for {path.title.toLowerCase()} roles.
            </p>
          </div>
          <button
            type="button"
            onClick={handleUnlockJobs}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-cyan-600 to-violet-600 text-white hover:opacity-90 transition shrink-0"
          >
            Search matching jobs
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      <PathPrepareSidebar
        isLoggedIn={profile.isLoggedIn}
        isTracked={isTracked}
        onCreateCv={handleCreateCV}
        onCoverLetter={() => router.push('/cover')}
        onUnlockJobs={handleUnlockJobs}
        onPracticeInterview={() => {
          if (typeof window !== 'undefined') {
            localStorage.setItem(
              'jobaz_career_path',
              JSON.stringify({ pathId: path.id, pathTitle: path.title, jobTitle: path.title })
            )
          }
          router.push('/interview-coach')
        }}
        onTrackProgress={handleTrackProgress}
      />

      <CareerAuthWallModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        redirectTo={authMode === 'jobs' ? jobsRedirect : `/career-hub?route=${pathId}`}
        title={
          authMode === 'jobs'
            ? 'Create a free account to unlock matching jobs'
            : 'Create a free account to track your journey'
        }
        description={
          authMode === 'jobs'
            ? 'View real openings for this path and track your applications in one place.'
            : 'Save your career path, track progress, and unlock the full JobAZ toolkit.'
        }
        bullets={
          authMode === 'jobs'
            ? ['View real job openings for this path', 'Save and track applications', 'Tailor your CV to each role']
            : [
                'Save your career path',
                'Track progress step by step',
                'Save courses and milestones',
                'Unlock matching jobs',
                'Build your CV later with JobAZ',
              ]
        }
      />
    </div>
  )
}
