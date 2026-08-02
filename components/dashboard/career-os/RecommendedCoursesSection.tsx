'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, GraduationCap, Loader2 } from 'lucide-react'
import CareerHubCourseCard from '@/components/career-hub/CareerHubCourseCard'
import type { CareerHubCourseListing } from '@/lib/career-hub/types'
import { careerHubPathHref } from '@/lib/career-hub/myPlan'

type Props = {
  pathId: string | null
}

export default function RecommendedCoursesSection({ pathId }: Props) {
  const [courses, setCourses] = useState<CareerHubCourseListing[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!pathId) {
      setCourses([])
      return
    }
    let cancelled = false
    setLoading(true)
    fetch(`/api/career-hub/courses?pathId=${encodeURIComponent(pathId)}`, { cache: 'no-store' })
      .then(async (res) => {
        const body = (await res.json()) as { courses?: CareerHubCourseListing[] }
        if (!cancelled) setCourses(body.courses ?? [])
      })
      .catch(() => {
        if (!cancelled) setCourses([])
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [pathId])

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-cyan-400" />
          <h3 className="text-lg font-semibold text-slate-100">Recommended Courses & Licences</h3>
        </div>
        {pathId && (
          <Link
            href={careerHubPathHref(pathId)}
            className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-violet-300 transition"
          >
            Browse all in Career Hub
            <ArrowRight className="w-3 h-3" />
          </Link>
        )}
      </div>

      {!pathId ? (
        <EmptyState message="Select a career route to see recommended training." href="/uk-career-assistant" />
      ) : loading ? (
        <div className="flex items-center justify-center py-12 text-slate-400 gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-violet-400" />
          Loading courses…
        </div>
      ) : courses.length === 0 ? (
        <EmptyState message="No published courses for your route yet." href={careerHubPathHref(pathId)} />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {courses.slice(0, 3).map((course) => (
            <CareerHubCourseCard key={course.slug} course={course} />
          ))}
        </div>
      )}
    </section>
  )
}

function EmptyState({ message, href }: { message: string; href: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-700/60 bg-slate-900/30 px-6 py-10 text-center">
      <p className="text-sm text-slate-400 mb-4">{message}</p>
      <Link
        href={href}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-violet-500/30 text-violet-200 hover:bg-violet-500/10 transition"
      >
        Get started
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  )
}
