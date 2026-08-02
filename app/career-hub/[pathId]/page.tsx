'use client'

import { useEffect } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import { careerHubRouteUrl } from '@/lib/career-hub/explorerUrl'

export default function CareerHubPathRedirect() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const pathId = params.pathId as string
    const caSession = searchParams.get('ca_session')
    router.replace(careerHubRouteUrl(pathId, { caSessionId: caSession }))
  }, [params.pathId, router, searchParams])

  return (
    <div className="min-h-[40vh] flex items-center justify-center text-slate-400 text-sm">
      Opening Career Hub…
    </div>
  )
}
