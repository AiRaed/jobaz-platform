'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'

type Props = {
  title: string
  subtitle?: string
  showBackToDashboard?: boolean // default true
  showBackToJobFinder?: boolean // default false
  showBackToAllPaths?: boolean // default false
  jobId?: string | null
  mode?: string | null
  from?: string // query param to add when navigating back to job details
  horizontalLayout?: boolean // if true, uses 2-column layout with disclaimer on right
  disclaimer?: string // disclaimer text to show on right side of header
}

export default function PageHeader({ title, subtitle, showBackToDashboard = true, showBackToJobFinder = false, showBackToAllPaths = false, jobId, mode, from, horizontalLayout = false, disclaimer }: Props) {
  const router = useRouter()

  const handleBackToJobDetails = () => {
    if (!jobId) return
    const modeParam = mode || 'tailorCv'
    const url = `/job-details/${jobId}?mode=${modeParam}${from ? `&from=${from}` : ''}`
    router.push(url)
  }

  const backButtonClass = horizontalLayout 
    ? "inline-flex items-center gap-1.5 text-sm md:text-base font-medium text-slate-300 hover:text-slate-100 transition-colors mb-2" 
    : "hover:text-slate-100 transition"

  return (
    <header className="mb-2 pb-2 border-b border-slate-800/60" data-no-translate>
      {horizontalLayout ? (
        // 2-column layout: LEFT (title block), RIGHT (disclaimer)
        <div className="max-w-[1920px] mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4">
            {/* LEFT: Title block with back button */}
            <div className="flex-1 min-w-0">
              {(showBackToDashboard !== false || showBackToJobFinder || showBackToAllPaths || jobId) && (
                <div className="mb-1">
                  {showBackToDashboard !== false && (
                    <button
                      type="button"
                      onClick={() => router.push('/dashboard')}
                      className={backButtonClass}
                    >
                      <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                      Back to Dashboard
                    </button>
                  )}
                  {showBackToJobFinder && (
                    <button
                      type="button"
                      onClick={() => router.push('/job-finder')}
                      className={backButtonClass}
                    >
                      <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                      Back to Job Finder
                    </button>
                  )}
                  {showBackToAllPaths && (
                    <button
                      type="button"
                      onClick={() => router.push('/build-your-path')}
                      className={backButtonClass}
                    >
                      <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                      Back to All Paths
                    </button>
                  )}
                  {jobId && (
                    <button
                      type="button"
                      onClick={handleBackToJobDetails}
                      className={backButtonClass}
                    >
                      <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                      Back to Job Details
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
            
            {/* RIGHT: Disclaimer */}
            {disclaimer && (
              <div className="md:flex-shrink-0 md:max-w-md md:min-w-0 md:pl-4">
                <p className="text-xs md:text-sm text-slate-300 leading-tight md:leading-snug m-0 px-2 md:px-0">
                  {disclaimer}
                </p>
              </div>
            )}
          </div>
        </div>
      ) : (
        // Vertical layout: back button above title (original layout)
        <div className="flex flex-col gap-1">
          {(showBackToDashboard !== false || showBackToJobFinder || showBackToAllPaths || jobId) && (
            <div className="flex items-center gap-4 text-xs md:text-sm text-slate-400 mb-3">
              {showBackToDashboard !== false && (
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className={backButtonClass}
                >
                  ← Back to Dashboard
                </button>
              )}
              {showBackToJobFinder && (
                <button
                  type="button"
                  onClick={() => router.push('/job-finder')}
                  className={backButtonClass}
                >
                  ← Back to Job Finder
                </button>
              )}
              {showBackToAllPaths && (
                <button
                  type="button"
                  onClick={() => router.push('/build-your-path')}
                  className={backButtonClass}
                >
                  ← Back to All Paths
                </button>
              )}
              {jobId && (
                <button
                  type="button"
                  onClick={handleBackToJobDetails}
                  className={backButtonClass}
                >
                  ← Back to Job Details
                </button>
              )}
            </div>
          )}
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-50 m-0">
            {title}
          </h1>
          {disclaimer && (
            <p className="mt-1.5 text-xs text-slate-500 m-0">
              {disclaimer}
            </p>
          )}
          {subtitle && (
            <p className="mt-1 text-xs md:text-sm text-slate-400 m-0">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </header>
  )
}
