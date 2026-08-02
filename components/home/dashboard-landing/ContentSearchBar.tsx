'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ArrowRight, MapPin, Search } from 'lucide-react'
import { UK_CITIES } from '@/lib/uk-cities'
import { cn } from '@/lib/utils'
import {
  COURSE_LOCATIONS,
  buildOpportunitySearchUrl,
  type SearchMode,
} from './constants'
import { useLandingJobsOptional } from './LandingJobsContext'
import { useLandingCoursesOptional } from './LandingCoursesContext'

const inputClass = 'jobaz-input w-full rounded-lg px-3 py-2 text-sm box-border'

type Props = {
  mode: SearchMode
  className?: string
}

export default function ContentSearchBar({ mode, className }: Props) {
  const router = useRouter()
  const landingJobs = useLandingJobsOptional()
  const landingCourses = useLandingCoursesOptional()

  const [oppQuery, setOppQuery] = useState('')
  const [oppLocation, setOppLocation] = useState('UK (Anywhere)')

  const jobQuery = landingJobs?.keyword ?? ''
  const jobLocation = landingJobs?.location ?? 'UK (Anywhere)'
  const courseQuery = landingCourses?.keyword ?? ''
  const courseLocation = landingCourses?.location ?? 'UK (Anywhere)'

  const submit = () => {
    if (mode === 'pulse') {
      router.push('/feed')
      return
    }
    if (mode === 'jobs') {
      if (landingJobs) {
        void landingJobs.search(jobQuery, jobLocation)
      }
      return
    }
    if (mode === 'courses') {
      if (landingCourses) {
        void landingCourses.search(courseQuery, courseLocation)
      }
      return
    }
    router.push(buildOpportunitySearchUrl(oppQuery, oppLocation))
  }

  if (mode === 'pulse') {
    return (
      <div className={cn('w-full max-w-none min-w-0 box-border', className)}>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
          <p className="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
            Phase 1: JobAZ publishes career tips and opportunities. Community posting opens later.
          </p>
          <button
            type="button"
            onClick={() => router.push('/feed')}
            className="jobaz-btn-primary jobaz-btn-primary-sm shrink-0 whitespace-nowrap"
          >
            Open Pulse
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    )
  }

  const buttonLabel =
    mode === 'jobs' ? 'Search Jobs' : mode === 'courses' ? 'Search Courses' : 'Search Opportunities'

  const placeholder =
    mode === 'jobs'
      ? 'Job title or keyword'
      : mode === 'courses'
        ? 'Search SIA, CSCS, Care, Forklift, English, First Aid...'
        : 'Opportunity keyword'

  const query =
    mode === 'jobs' ? jobQuery : mode === 'courses' ? courseQuery : oppQuery
  const location =
    mode === 'jobs' ? jobLocation : mode === 'courses' ? courseLocation : oppLocation

  const setQuery = (v: string) => {
    if (mode === 'jobs') landingJobs?.setKeyword(v)
    else if (mode === 'courses') landingCourses?.setKeyword(v)
    else setOppQuery(v)
  }

  const setLocation = (v: string) => {
    if (mode === 'jobs') landingJobs?.setLocation(v)
    else if (mode === 'courses') landingCourses?.setLocation(v)
    else setOppLocation(v)
  }

  const locationOptions = mode === 'courses' ? COURSE_LOCATIONS : UK_CITIES

  return (
    <div className={cn('w-full max-w-none min-w-0 box-border', className)}>
      <AnimatePresence mode="wait">
        <motion.div
          key={mode}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.15 }}
          className="w-full min-w-0 flex flex-col sm:flex-row gap-2 sm:items-center box-border"
        >
          <div className="flex-1 relative min-w-0">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] dark:text-slate-500 pointer-events-none" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              placeholder={placeholder}
              className={cn(inputClass, 'pl-9 text-[#0F172A] dark:text-slate-100')}
            />
          </div>
          <div className="sm:w-44 relative shrink-0 min-w-0">
            <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#64748B] dark:text-slate-500 pointer-events-none" />
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className={cn(inputClass, 'pl-9 appearance-none')}
            >
              {locationOptions.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={
              (mode === 'jobs' && landingJobs?.loading) ||
              (mode === 'courses' && landingCourses?.loading)
            }
            className="jobaz-btn-primary jobaz-btn-primary-sm shrink-0 whitespace-nowrap disabled:opacity-60"
          >
            {buttonLabel}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
