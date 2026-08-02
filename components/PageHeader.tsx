'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

type Props = {
  title: string
  subtitle?: string
  showBackToDashboard?: boolean // default true
  showBackToJobFinder?: boolean // default false
  showBackToAllPaths?: boolean // default false
  showBackToCareerAssistant?: boolean // default false
  caSessionId?: string | null // Session ID for Career Assistant round-trip navigation
  jobId?: string | null
  mode?: string | null
  from?: string // query param to add when navigating back to job details
  horizontalLayout?: boolean // if true, uses 2-column layout with disclaimer on right
  disclaimer?: string // disclaimer text to show on right side of header
  notice?: string // notice text to show on right side of header (smaller, for beta/under development)
  compact?: boolean // if true, reduces padding and title size (e.g. Writing Review page)
}

function jobDetailsHref(jobId: string, mode?: string | null, from?: string) {
  const modeParam = mode || 'tailorCv'
  return `/job-details/${jobId}?mode=${modeParam}${from ? `&from=${from}` : ''}`
}

function careerAssistantResumeHref(caSessionId: string) {
  return `/uk-career-assistant?resume=1&ca_session=${encodeURIComponent(caSessionId)}`
}

export default function PageHeader({
  title,
  subtitle,
  showBackToDashboard = true,
  showBackToJobFinder = false,
  showBackToAllPaths = false,
  showBackToCareerAssistant = false,
  caSessionId,
  jobId,
  mode,
  from,
  horizontalLayout = false,
  disclaimer,
  notice,
  compact = false,
}: Props) {
  const backButtonClass = horizontalLayout
    ? compact
      ? 'inline-flex items-center gap-1.5 text-xs md:text-sm font-medium text-slate-300 hover:text-slate-100 transition-colors mb-0.5'
      : 'inline-flex items-center gap-1.5 text-sm md:text-base font-medium text-slate-300 hover:text-slate-100 transition-colors mb-2'
    : 'hover:text-slate-100 transition inline-flex items-center gap-1'

  const backLinkClass = `${backButtonClass}`

  return (
    <header
      className={
        compact
          ? 'mb-1 pb-1 border-b border-[var(--border-subtle)] dark:border-slate-800/60'
          : 'mb-2 pb-2 border-b border-[var(--border-subtle)] dark:border-slate-800/60'
      }
      data-no-translate
    >
      {horizontalLayout ? (
        <div className="max-w-[1920px] mx-auto px-4">
          <div
            className={
              compact
                ? 'flex flex-col md:flex-row md:items-center md:justify-between gap-1 md:gap-2'
                : 'flex flex-col md:flex-row md:items-center md:justify-between gap-2 md:gap-4'
            }
          >
            <div className="flex-1 min-w-0">
              {(showBackToDashboard !== false ||
                showBackToJobFinder ||
                showBackToAllPaths ||
                showBackToCareerAssistant ||
                jobId) && (
                <div className={compact ? 'mb-0.5' : 'mb-1'}>
                  {showBackToCareerAssistant && caSessionId && (
                    <Link
                      href={careerAssistantResumeHref(caSessionId)}
                      prefetch
                      className={backLinkClass}
                    >
                      <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                      Back to Career Assistant results
                    </Link>
                  )}
                  {showBackToDashboard !== false && (
                    <Link href="/dashboard" prefetch className={backLinkClass}>
                      <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                      Back to Dashboard
                    </Link>
                  )}
                  {showBackToJobFinder && (
                    <Link href="/job-finder" prefetch className={backLinkClass}>
                      <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                      Back to Job Finder
                    </Link>
                  )}
                  {showBackToAllPaths && (
                    <Link href="/career-hub" prefetch className={backLinkClass}>
                      <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                      Back to Courses & Licences
                    </Link>
                  )}
                  {jobId && (
                    <Link href={jobDetailsHref(jobId, mode, from)} prefetch className={backLinkClass}>
                      <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                      Back to Job Details
                    </Link>
                  )}
                </div>
              )}
              <h1
                className={
                  compact
                    ? 'text-xl md:text-2xl font-semibold text-slate-50 m-0 leading-tight'
                    : 'text-2xl md:text-3xl font-semibold text-slate-50 m-0'
                }
              >
                {title}
              </h1>
              {subtitle && (
                <p
                  className={
                    compact
                      ? 'mt-0.5 text-xs text-slate-400 m-0 leading-tight'
                      : 'mt-1 text-xs md:text-sm text-slate-400 m-0'
                  }
                >
                  {subtitle}
                </p>
              )}
            </div>

            {(disclaimer || notice) && (
              <div
                className={
                  compact
                    ? 'md:flex-shrink-0 md:max-w-md md:min-w-0 md:pl-4 flex flex-col gap-0.5'
                    : 'md:flex-shrink-0 md:max-w-md md:min-w-0 md:pl-4 flex flex-col gap-1.5'
                }
              >
                {notice && (
                  <p className="text-[11px] md:text-xs text-slate-400 leading-tight m-0 px-2 md:px-0">
                    {notice}
                  </p>
                )}
                {disclaimer && (
                  <p className="text-xs md:text-sm text-slate-300 leading-tight md:leading-snug m-0 px-2 md:px-0">
                    {disclaimer}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className={compact ? 'flex flex-col gap-0.5' : 'flex flex-col gap-1'}>
          {(showBackToDashboard !== false ||
            showBackToJobFinder ||
            showBackToAllPaths ||
            showBackToCareerAssistant ||
            jobId) && (
            <div
              className={
                compact
                  ? 'flex items-center gap-4 text-xs text-slate-400 mb-1'
                  : 'flex items-center gap-4 text-xs md:text-sm text-slate-400 mb-3'
              }
            >
              {showBackToCareerAssistant && caSessionId && (
                <Link href={careerAssistantResumeHref(caSessionId)} prefetch className={backLinkClass}>
                  ← Back to Career Assistant results
                </Link>
              )}
              {showBackToDashboard !== false && (
                <Link href="/dashboard" prefetch className={backLinkClass}>
                  ← Back to Dashboard
                </Link>
              )}
              {showBackToJobFinder && (
                <Link href="/job-finder" prefetch className={backLinkClass}>
                  ← Back to Job Finder
                </Link>
              )}
              {showBackToAllPaths && (
                <Link href="/career-hub" prefetch className={backLinkClass}>
                  ← Back to Courses & Licences
                </Link>
              )}
              {jobId && (
                <Link href={jobDetailsHref(jobId, mode, from)} prefetch className={backLinkClass}>
                  ← Back to Job Details
                </Link>
              )}
            </div>
          )}
          <h1
            className={
              compact
                ? 'text-xl md:text-2xl font-semibold text-slate-50 m-0 leading-tight'
                : 'text-2xl md:text-3xl font-semibold text-slate-50 m-0'
            }
          >
            {title}
          </h1>
          {disclaimer && (
            <p
              className={
                compact
                  ? 'mt-0.5 text-xs text-slate-500 m-0 leading-tight'
                  : 'mt-1.5 text-xs text-slate-500 m-0'
              }
            >
              {disclaimer}
            </p>
          )}
          {subtitle && (
            <p
              className={
                compact
                  ? 'mt-0.5 text-xs text-slate-400 m-0 leading-tight'
                  : 'mt-1 text-xs md:text-sm text-slate-400 m-0'
              }
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </header>
  )
}
