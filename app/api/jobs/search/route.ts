import { NextRequest, NextResponse } from 'next/server'
import { fetchAdzunaJobs } from '@/lib/jobs/adzuna'
import { fetchReedJobs } from '@/lib/jobs/reed'
import { searchJobazJobs } from '@/lib/jobs/jobaz'
import { normalizeAdzunaJob, normalizeReedJob, removeDuplicates } from '@/lib/jobs/normalize'
import { mergeJobSearchResults } from '@/lib/jobs/merge-results'
import { rankAndFilterJobResults } from '@/lib/jobs/rankResults'
import type { UnifiedJob } from '@/lib/jobs/types'

export const dynamic = 'force-dynamic'

function formatSalary(min?: number, max?: number, display?: string): string | undefined {
  if (display) return display
  if (!min && !max) return undefined

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  if (min && max) return `${formatAmount(min)} - ${formatAmount(max)}`
  if (min) return `From ${formatAmount(min)}`
  if (max) return `Up to ${formatAmount(max)}`
  return undefined
}

/**
 * GET /api/jobs/search
 * Unified results: JobAZ managed + Adzuna + Reed
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const keyword = searchParams.get('keyword') || ''
    const location = searchParams.get('location') || 'UK'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const routeTags = searchParams.get('routeTags')?.split(',').filter(Boolean)

    if (!keyword.trim()) {
      return NextResponse.json({ error: 'Keyword parameter is required' }, { status: 400 })
    }

    const searchParamsObj = {
      keyword: keyword.trim(),
      location: location.trim() || 'UK',
      page,
      routeTags,
    }

    const [adzunaJobsRaw, reedJobsRaw, jobazJobsRaw] = await Promise.allSettled([
      fetchAdzunaJobs(searchParamsObj),
      fetchReedJobs(searchParamsObj),
      searchJobazJobs(searchParamsObj),
    ])

    const externalJobs: UnifiedJob[] = []

    if (adzunaJobsRaw.status === 'fulfilled') {
      externalJobs.push(...adzunaJobsRaw.value.map(normalizeAdzunaJob))
    } else {
      console.error('Adzuna API error:', adzunaJobsRaw.reason)
    }

    if (reedJobsRaw.status === 'fulfilled') {
      externalJobs.push(...reedJobsRaw.value.map(normalizeReedJob))
    } else {
      console.error('Reed API error:', reedJobsRaw.reason)
    }

    const uniqueExternal = removeDuplicates(externalJobs)

    const jobazJobs = jobazJobsRaw.status === 'fulfilled' ? jobazJobsRaw.value : []
    if (jobazJobsRaw.status === 'rejected') {
      console.error('JobAZ jobs error:', jobazJobsRaw.reason)
    }

    const withSalaries = mergeJobSearchResults(jobazJobs, uniqueExternal).map((result) => {
      const unified =
        jobazJobs.find((j) => j.id === result.id) ??
        uniqueExternal.find((j) => j.id === result.id)
      return {
        ...result,
        salary: unified?.salary ?? formatSalary(unified?.salaryMin, unified?.salaryMax),
      }
    })

    const ranked = rankAndFilterJobResults(withSalaries, keyword.trim())

    return NextResponse.json({ results: ranked }, { status: 200 })
  } catch (error) {
    console.error('Error in jobs/search route:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('Missing') && errorMessage.includes('API credentials')) {
      return NextResponse.json(
        { error: 'Server configuration error: Missing API credentials' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to search jobs', details: errorMessage },
      { status: 500 }
    )
  }
}
