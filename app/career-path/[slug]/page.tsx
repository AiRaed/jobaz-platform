'use client'

import { useEffect, useState } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import AppShell from '@/components/layout/AppShell'
import { PlatformToolShell } from '@/components/dashboard/platform'
import PageHeader from '@/components/PageHeader'
import CareerHubRoutePanel from '@/components/career-hub/CareerHubRoutePanel'
import { useTrainingRoutes } from '@/hooks/useTrainingRoutes'
import { getCareerPathById } from '@/lib/career-paths'
import { getCategoryForPathId } from '@/lib/career-hub/routeCategories'
import Link from 'next/link'

export default function CareerPathResultPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const slug = typeof params.slug === 'string' ? params.slug : ''
  const path = getCareerPathById(slug)
  const { routes: recommendedRoutes } = useTrainingRoutes()

  const [caSessionId, setCaSessionId] = useState<string | null>(null)

  useEffect(() => {
    const sessionParam = searchParams.get('ca_session')
    if (sessionParam) setCaSessionId(sessionParam)
    else {
      try {
        const snapshot = localStorage.getItem('jobaz_ca_last_result_v1')
        if (snapshot) {
          const id = JSON.parse(snapshot).sessionId
          if (id) setCaSessionId(id)
        }
      } catch {
        /* ignore */
      }
    }
  }, [searchParams])

  const recommendedRoute = recommendedRoutes.find((r) => r.pathId === slug) ?? null
  const category = getCategoryForPathId(slug)

  if (!path) {
    return (
      <AppShell wide platform>
        <PlatformToolShell>
          <div className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-8 text-center">
            <p className="text-slate-400">Pathway not found.</p>
            <Link href="/career-hub" className="text-sm text-violet-300 hover:underline mt-3 inline-block">
              Browse Courses & Licences
            </Link>
          </div>
        </PlatformToolShell>
      </AppShell>
    )
  }

  return (
    <AppShell wide platform>
      <PlatformToolShell>
        <PageHeader
          title={path.title}
          subtitle={category?.description ?? 'Your personalised UK career pathway'}
          showBackToDashboard={false}
          showBackToCareerAssistant={!!caSessionId}
          caSessionId={caSessionId}
        />

        <div className="mb-4">
          <Link
            href="/career-hub"
            className="text-xs text-slate-500 hover:text-violet-300 transition"
          >
            ← Back to Courses & Licences
          </Link>
        </div>

        <CareerHubRoutePanel
          pathId={slug}
          caSessionId={caSessionId}
          recommendedRoute={recommendedRoute}
        />
      </PlatformToolShell>
    </AppShell>
  )
}
