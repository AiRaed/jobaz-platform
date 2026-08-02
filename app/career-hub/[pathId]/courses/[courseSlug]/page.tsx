'use client'

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { courseDetailPath } from '@/lib/career-hub/marketplace/slug'

export default function LegacyCareerHubCourseRedirect() {
  const params = useParams()
  const router = useRouter()

  useEffect(() => {
    const courseSlug = params.courseSlug as string
    router.replace(courseDetailPath(courseSlug))
  }, [params.courseSlug, router])

  return (
    <div className="min-h-[40vh] flex items-center justify-center text-slate-400 text-sm">
      Opening course…
    </div>
  )
}
