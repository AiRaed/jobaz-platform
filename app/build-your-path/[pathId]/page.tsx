'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle2, AlertTriangle, Info } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import PageHeader from '@/components/PageHeader'
import { getCareerPathById } from '@/lib/career-paths'
import { LocationSearchModal } from '@/components/LocationSearchModal'
import CareerAuthWallModal from '@/components/home/CareerAuthWallModal'
import { useBuildYourPathProfile } from '@/hooks/useBuildYourPathProfile'
import {
  answerGuideQuestion,
  computePathMatch,
  getPathIntelligence,
  getTrackedPathIds,
  trackPathLocally,
} from '@/lib/build-your-path/pathIntelligence'
import YourMatchSection from '@/components/build-your-path/YourMatchSection'
import CareerTimelineSection from '@/components/build-your-path/CareerTimelineSection'
import SalaryProgressionCard from '@/components/build-your-path/SalaryProgressionCard'
import RealityCheckMetrics from '@/components/build-your-path/RealityCheckMetrics'
import PeopleLikeYouSection from '@/components/build-your-path/PeopleLikeYouSection'
import RelatedPathsCarousel from '@/components/build-your-path/RelatedPathsCarousel'
import PathFeedOpportunities from '@/components/build-your-path/PathFeedOpportunities'
import PathCollapsibleSection from '@/components/build-your-path/PathCollapsibleSection'
import PathCourseCard from '@/components/build-your-path/PathCourseCard'
import PathPrepareSidebar from '@/components/build-your-path/PathPrepareSidebar'
import CareerGuideAssistant from '@/components/build-your-path/CareerGuideAssistant'
import CareerHubCourseCard from '@/components/career-hub/CareerHubCourseCard'
import { listPathCourses } from '@/lib/career-hub/courseCatalog'
import { upsertCareerPlanItem } from '@/lib/career-hub/myPlan'

export default function CareerPathPage() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const pathId = params.pathId as string
  const path = getCareerPathById(pathId)
  const profile = useBuildYourPathProfile()

  const [caSessionId, setCaSessionId] = useState<string | null>(null)
  const [locationModalOpen, setLocationModalOpen] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'track' | 'jobs'>('track')
  const [trackedIds, setTrackedIds] = useState<string[]>([])
  const pathStartedRef = useRef<string | null>(null)

  const [selectedCourse, setSelectedCourse] = useState<{
    name: string
    externalLink?: string
    sourceType: 'GOV.UK' | 'National Careers Service' | 'Professional Body' | 'College' | 'Other'
  } | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setTrackedIds(getTrackedPathIds())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const from = searchParams.get('from')
    const sessionParam = searchParams.get('ca_session')
    const loadSession = (id: string) => {
      try {
        const snapshot = localStorage.getItem('jobaz_ca_last_result_v1')
        if (snapshot) {
          const parsed = JSON.parse(snapshot)
          if (parsed.sessionId === id) setCaSessionId(id)
        }
      } catch {
        /* ignore */
      }
    }
    if ((from === 'career_assistant' || sessionParam) && sessionParam) {
      loadSession(sessionParam)
    } else {
      try {
        const snapshot = localStorage.getItem('jobaz_ca_last_result_v1')
        if (snapshot) {
          const parsed = JSON.parse(snapshot)
          if (parsed.sessionId) setCaSessionId(parsed.sessionId)
        }
      } catch {
        /* ignore */
      }
    }
  }, [searchParams])

  useEffect(() => {
    if (!path || pathStartedRef.current === pathId) return
    pathStartedRef.current = pathId
    void import('@/lib/jobaz-ai/skillPathSignals').then(({ emitSkillPathStarted }) =>
      emitSkillPathStarted({ pathId, pathName: path.title })
    )
  }, [path, pathId])

  const intelligence = useMemo(
    () => (path ? getPathIntelligence(path, profile) : null),
    [path, profile]
  )
  const match = useMemo(
    () => (path ? computePathMatch(path, profile) : null),
    [path, profile]
  )

  const isTracked = trackedIds.includes(pathId)

  const askGuide = useCallback(
    (question: string) => {
      if (!path || !intelligence) return 'Ask a question about this path to get guidance.'
      return answerGuideQuestion(path, question, intelligence)
    },
    [path, intelligence]
  )

  if (!path || !intelligence || !match) {
    return (
      <AppShell>
        <div className="text-center py-12">
          <h1 className="text-2xl font-bold text-slate-200 mb-4">Path Not Found</h1>
          <p className="text-slate-400 mb-6">The career path you&apos;re looking for doesn&apos;t exist.</p>
          <Link
            href="/build-your-path"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to All Paths
          </Link>
        </div>
      </AppShell>
    )
  }

  const handleCreateCV = () => {
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
  }

  const handlePracticeInterview = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'jobaz_career_path',
        JSON.stringify({ pathId: path.id, pathTitle: path.title, jobTitle: path.title })
      )
    }
    router.push('/interview-coach')
  }

  const handleWriteCoverLetter = () => router.push('/cover')

  const getJobSearchKeyword = (id: string): string => {
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
    return keywordMap[id] || path.title
  }

  const navigateToJobs = () => {
    void import('@/lib/jobaz-ai/skillPathSignals').then(({ emitSkillGoalSelected }) =>
      emitSkillGoalSelected({ pathId: path.id, pathName: path.title, goalType: 'jobs' })
    )
    if (typeof window !== 'undefined') {
      localStorage.setItem('jobaz_career_path', JSON.stringify({ pathId: path.id, pathTitle: path.title }))
    }
    const keyword = getJobSearchKeyword(path.id)
    const jobParams = new URLSearchParams()
    jobParams.set('query', keyword)
    jobParams.set('location', 'UK (Anywhere)')
    router.push(`/job-finder?${jobParams.toString()}`)
  }

  const handleUnlockJobs = () => {
    if (profile.isLoggedIn) {
      navigateToJobs()
      return
    }
    setAuthMode('jobs')
    setAuthOpen(true)
  }

  const handleTrackProgress = () => {
    if (profile.isLoggedIn) {
      trackPathLocally(pathId)
      setTrackedIds(getTrackedPathIds())
      return
    }
    setAuthMode('track')
    setAuthOpen(true)
  }

  const getCourseSourceType = (course: {
    externalLink?: string
    type: string
    sourceType?: 'GOV.UK' | 'National Careers Service' | 'Professional Body' | 'College' | 'Other'
  }) => {
    if (course.sourceType) return course.sourceType
    if (course.externalLink) {
      if (course.type.toLowerCase().includes('college') || course.type.toLowerCase().includes('level')) return 'College'
      if (course.type.toLowerCase().includes('professional') || course.type.toLowerCase().includes('certification')) {
        return 'Professional Body'
      }
      return 'Other'
    }
    return 'National Careers Service'
  }

  const handleViewOfficialCourses = (
    sourceType: 'GOV.UK' | 'National Careers Service' | 'Professional Body' | 'College' | 'Other',
    externalLink?: string,
    courseName?: string
  ) => {
    void import('@/lib/jobaz-ai/skillPathSignals').then(({ emitLessonCompleted }) =>
      emitLessonCompleted({ pathId, pathName: path.title, lessonId: courseName ?? sourceType })
    )
    if (sourceType === 'GOV.UK' || sourceType === 'National Careers Service') {
      window.open('https://nationalcareers.service.gov.uk/find-a-course', '_blank', 'noopener,noreferrer')
    } else if (sourceType === 'Professional Body' && externalLink) {
      window.open(externalLink, '_blank', 'noopener,noreferrer')
    } else {
      window.open('https://nationalcareers.service.gov.uk/find-a-course', '_blank', 'noopener,noreferrer')
    }
  }

  const handleFindNearYou = (
    courseName: string,
    externalLink?: string,
    sourceType?: 'GOV.UK' | 'National Careers Service' | 'Professional Body' | 'College' | 'Other'
  ) => {
    void import('@/lib/jobaz-ai/skillPathSignals').then(({ emitLessonCompleted }) =>
      emitLessonCompleted({ pathId, pathName: path.title, lessonId: courseName })
    )
    setSelectedCourse({ name: courseName, externalLink, sourceType: sourceType || 'National Careers Service' })
    setLocationModalOpen(true)
  }

  const sourceTypeConfig = {
    'GOV.UK': { label: 'GOV.UK', style: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    'National Careers Service': { label: 'National Careers Service', style: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
    'Professional Body': { label: 'Professional Body', style: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
    College: { label: 'College', style: 'bg-green-500/20 text-green-300 border-green-500/30' },
    Other: { label: 'Other', style: 'bg-slate-500/20 text-slate-300 border-slate-500/30' },
  }

  const whatItIsPreview = path.whatItIs.split('\n\n')[0]?.slice(0, 120) + '...'
  const jobsRedirect = `/job-finder?query=${encodeURIComponent(getJobSearchKeyword(path.id))}&location=UK%20(Anywhere)`

  return (
    <AppShell>
      <PageHeader
        title={path.title}
        subtitle={path.description}
        showBackToDashboard={true}
        showBackToAllPaths={true}
        showBackToCareerAssistant={!!caSessionId}
        caSessionId={caSessionId}
      />

      <div className="mb-6 flex items-start gap-4">
        <span className="text-5xl">{path.icon}</span>
        <p className="text-sm text-slate-400 italic flex-1 pt-2">{path.whoFor}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] xl:grid-cols-[1fr_320px] gap-8 pb-24 lg:pb-10">
        <div className="min-w-0 space-y-6">
          <YourMatchSection match={match} pathTitle={path.title} />

          <section className="rounded-2xl border border-emerald-500/25 bg-emerald-950/10 p-5 md:p-6">
            <p className="text-[10px] uppercase tracking-widest text-emerald-300 mb-1">What should you do next?</p>
            <h2 className="text-lg font-bold text-slate-100 mb-2">Recommended courses & licences</h2>
            <p className="text-sm text-slate-400 mb-5">
              Start with training that gets you job-ready — jobs come after the right certificates.
            </p>
            <div className="grid gap-4 md:grid-cols-2">
              {listPathCourses(pathId)
                .slice(0, 4)
                .map((listing) => (
                  <CareerHubCourseCard
                    key={listing.slug}
                    course={listing}
                    featured={listing.demand === 'high'}
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
                ))}
            </div>
          </section>

          <div className="grid md:grid-cols-2 gap-6">
            <SalaryProgressionCard salary={intelligence.salary} />
            <CareerTimelineSection steps={intelligence.timeline} />
          </div>

          <PathCollapsibleSection title="What this job really is" preview={whatItIsPreview} defaultOpen={false}>
            {path.whatItIs.split('\n\n').map((paragraph, idx) => (
              <p key={idx} className="text-sm text-slate-300 leading-relaxed mb-3 last:mb-0">
                {paragraph}
              </p>
            ))}
          </PathCollapsibleSection>

          <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-5 md:p-6">
            <h2 className="text-lg font-bold text-slate-200 mb-3">Do you need a degree?</h2>
            <DegreeBadge needsDegree={path.needsDegree} />
            <p className="text-sm text-slate-300 leading-relaxed mt-3">
              {path.degreeExplanation ||
                (path.needsDegree === 'no'
                  ? 'No university degree required — start with short courses, certificates, and on-the-job training.'
                  : 'Check specific role requirements before committing to this path.')}
            </p>
          </section>

          <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-5 md:p-6">
            <h2 className="text-lg font-bold text-slate-200 mb-4">What you actually need</h2>
            <RequirementList title="Short courses" items={path.requirements.shortCourses} />
            <RequirementList title="Certificates" items={path.requirements.certificates} />
            <RequirementList title="Licences" items={path.requirements.licences} />
            {path.requirements.languageLevel && (
              <div className="mt-4 pt-4 border-t border-slate-800/50">
                <h3 className="text-sm font-semibold text-slate-300 mb-1">Language level</h3>
                <p className="text-sm text-slate-400">{path.requirements.languageLevel}</p>
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-amber-500/20 flex gap-2">
              <Info className="w-4 h-4 text-amber-400/80 shrink-0 mt-0.5" />
              <p className="text-xs text-slate-400 leading-relaxed">
                Always verify courses are recognised by UK authorities or professional bodies (National Careers Service, CIOL, ITI, etc.).
              </p>
            </div>
          </section>

          <RealityCheckMetrics
            metrics={intelligence.realityMetrics}
            challenges={path.realityCheck.challenges}
            commonMistakes={path.realityCheck.commonMistakes}
            timeToReady={path.realityCheck.timeToReady}
          />

          <PeopleLikeYouSection items={intelligence.peopleLikeYouStarts} />

          <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-5 md:p-6">
            <h2 className="text-lg font-bold text-slate-200 mb-4">All courses & training options</h2>
            <div className="space-y-4">
              {path.courses.map((course, idx) => {
                const sourceType = getCourseSourceType(course)
                const config = sourceTypeConfig[sourceType]
                const isOfficialCourse = sourceType === 'GOV.UK' || sourceType === 'National Careers Service'
                const isProfessionalBody = sourceType === 'Professional Body'
                let helperNote: string | undefined
                if (course.name === 'First Aid Certificate') {
                  helperNote =
                    'First Aid courses are offered by many providers. Use the official UK course search to find one near you.'
                }
                if (course.name === 'Care Certificate' && path.id === 'care-support') {
                  helperNote =
                    'The Care Certificate is often provided by employers after you are hired — you may not need to pay upfront.'
                }
                if (course.name === 'Microsoft Office Skills' && path.id === 'office-admin') {
                  helperNote = 'Basic Office skills are often gained free online or on the job.'
                }
                return (
                  <PathCourseCard
                    key={idx}
                    course={course}
                    pathId={pathId}
                    sourceType={sourceType}
                    configStyle={config.style}
                    configLabel={config.label}
                    isOfficialCourse={isOfficialCourse}
                    isProfessionalBody={isProfessionalBody}
                    onViewOfficial={() => handleViewOfficialCourses(sourceType, course.externalLink, course.name)}
                    onFindNearYou={() => handleFindNearYou(course.name, course.externalLink, sourceType)}
                    helperNote={helperNote}
                  />
                )
              })}
            </div>
            {path.courseTransparencyNote && (
              <div className="mt-4 p-4 rounded-lg border border-slate-600/50 bg-slate-800/30 flex gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-sm text-slate-300">{path.courseTransparencyNote}</p>
              </div>
            )}
            <div className="mt-4 p-3 rounded-lg border border-amber-500/30 bg-amber-950/10 flex gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              <p className="text-sm text-slate-300">{path.courseWarning}</p>
            </div>
          </section>

          <section className="rounded-2xl border border-violet-500/30 bg-violet-950/10 p-5 md:p-6">
            <h2 className="text-lg font-bold text-slate-200 mb-3">Boost your chances</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'English for Work', desc: 'Workplace English for applications and daily tasks' },
                { title: 'Health & Safety', desc: 'Required knowledge for many UK roles' },
                { title: 'First Aid', desc: 'Shows responsibility to employers' },
                { title: 'Manual Handling', desc: 'Essential for physical roles' },
              ].map((item) => (
                <div key={item.title} className="p-3 rounded-lg border border-slate-700/50 bg-slate-900/30">
                  <h3 className="text-sm font-semibold text-slate-200">{item.title}</h3>
                  <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>

          <RelatedPathsCarousel
            pathIds={intelligence.relatedPathIds}
            currentPathId={path.id}
            caSessionId={caSessionId}
          />

          <PathFeedOpportunities items={intelligence.feedOpportunities} />
        </div>

        <aside className="hidden lg:block space-y-6">
          <CareerGuideAssistant
            insights={intelligence.guideInsights}
            readinessRange={match.readinessRange}
            quickQuestions={intelligence.quickQuestions}
            onAsk={askGuide}
          />
          <PathPrepareSidebar
            isLoggedIn={profile.isLoggedIn}
            isTracked={isTracked}
            onCreateCv={handleCreateCV}
            onCoverLetter={handleWriteCoverLetter}
            onUnlockJobs={handleUnlockJobs}
            onPracticeInterview={handlePracticeInterview}
            onTrackProgress={handleTrackProgress}
          />
        </aside>
      </div>

      <CareerGuideAssistant
        variant="mobile"
        insights={intelligence.guideInsights}
        readinessRange={match.readinessRange}
        quickQuestions={intelligence.quickQuestions}
        onAsk={askGuide}
      />

      {selectedCourse && (
        <LocationSearchModal
          isOpen={locationModalOpen}
          onClose={() => {
            setLocationModalOpen(false)
            setSelectedCourse(null)
          }}
          courseName={selectedCourse.name}
          externalLink={selectedCourse.externalLink}
          sourceType={selectedCourse.sourceType}
        />
      )}

      <CareerAuthWallModal
        isOpen={authOpen}
        onClose={() => setAuthOpen(false)}
        redirectTo={authMode === 'jobs' ? jobsRedirect : `/build-your-path/${pathId}`}
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
    </AppShell>
  )
}

function DegreeBadge({ needsDegree }: { needsDegree: 'no' | 'yes' | 'sometimes' }) {
  if (needsDegree === 'no') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-500/30">
        <CheckCircle2 className="w-4 h-4 text-green-400" />
        <span className="text-sm font-semibold text-green-400">No degree required</span>
      </div>
    )
  }
  if (needsDegree === 'yes') {
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30">
        <AlertTriangle className="w-4 h-4 text-red-400" />
        <span className="text-sm font-semibold text-red-400">Degree may be required</span>
      </div>
    )
  }
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30">
      <AlertTriangle className="w-4 h-4 text-yellow-400" />
      <span className="text-sm font-semibold text-yellow-400">Sometimes required</span>
    </div>
  )
}

function RequirementList({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="text-sm font-semibold text-slate-300 mb-2">{title}</h3>
      <ul className="space-y-1.5">
        {items.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
            <CheckCircle2 className="w-4 h-4 text-violet-400 mt-0.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}
