'use client'

import { useRouter } from 'next/navigation'

type Props = {
  title: string
  subtitle?: string
  showBackToDashboard?: boolean // default true
  showBackToJobFinder?: boolean // default false
  showBackToAllPaths?: boolean // default false
  jobId?: string | null
  mode?: string | null
  from?: string // query param to add when navigating back to job details
}

export default function PageHeader({ title, subtitle, showBackToDashboard = true, showBackToJobFinder = false, showBackToAllPaths = false, jobId, mode, from }: Props) {
  const router = useRouter()

  const handleBackToJobDetails = () => {
    if (!jobId) return
    const modeParam = mode || 'tailorCv'
    const url = `/job-details/${jobId}?mode=${modeParam}${from ? `&from=${from}` : ''}`
    router.push(url)
  }

  return (
    <header className="mb-4 pb-4 border-b border-slate-800/60" data-no-translate>
      <div className="flex flex-col gap-1">
        {(showBackToDashboard !== false || showBackToJobFinder || showBackToAllPaths || jobId) && (
          <div className="flex items-center gap-4 text-xs md:text-sm text-slate-400 mb-3">
            {showBackToDashboard !== false && (
              <button
                type="button"
                onClick={() => router.push('/dashboard')}
                className="hover:text-slate-100 transition"
              >
                ← Back to Dashboard
              </button>
            )}
            {showBackToJobFinder && (
              <button
                type="button"
                onClick={() => router.push('/job-finder')}
                className="hover:text-slate-100 transition"
              >
                ← Back to Job Finder
              </button>
            )}
            {showBackToAllPaths && (
              <button
                type="button"
                onClick={() => router.push('/build-your-path')}
                className="hover:text-slate-100 transition"
              >
                ← Back to All Paths
              </button>
            )}
            {jobId && (
              <button
                type="button"
                onClick={handleBackToJobDetails}
                className="hover:text-slate-100 transition text-xs md:text-sm text-slate-400"
              >
                ← Back to Job Details
              </button>
            )}
          </div>
        )}
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-50 m-0">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-xs md:text-sm text-slate-400 m-0">
            {subtitle}
          </p>
        )}
      </div>
    </header>
  )
}
