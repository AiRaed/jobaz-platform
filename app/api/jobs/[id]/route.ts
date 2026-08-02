import { NextRequest, NextResponse } from 'next/server'
import { parseJobId } from '@/lib/jobs/parse-id'
import { fetchJobazJobById } from '@/lib/jobs/jobaz'
import { mockJobs } from '@/lib/jobs/mock-jobs'

export const dynamic = 'force-dynamic'

/**
 * Fetch a single Reed job by ID
 */
async function fetchReedJobById(rawId: string) {
  const apiKey = process.env.REED_API_KEY
  const base = process.env.REED_API_BASE || 'https://www.reed.co.uk/api/1.0'

  if (!apiKey) {
    throw new Error('Missing Reed API config')
  }

  const url = `${base}/jobs/${rawId}`
  const response = await fetch(url, {
    headers: {
      Authorization: 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      return null
    }
    throw new Error(`Reed API error: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Fetch a single Adzuna job by ID
 * Uses Adzuna Job Details endpoint: /jobs/gb/{jobId}.json
 * IMPORTANT: The .json suffix is REQUIRED
 */
async function fetchAdzunaJobById(rawId: string) {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  const apiBase = process.env.ADZUNA_API_BASE || 'https://api.adzuna.com/v1/api'

  if (!appId || !appKey) {
    throw new Error('Missing Adzuna API credentials')
  }

  try {
    // Adzuna Job Details endpoint: /jobs/gb/{jobId}.json
    // IMPORTANT: The .json suffix is REQUIRED
    // Use "gb" to match the country code used in search endpoint (NOT "uk")
    const url = new URL(`${apiBase}/jobs/gb/${rawId}.json`)
    url.searchParams.set('app_id', appId)
    url.searchParams.set('app_key', appKey)

    const fullUrl = url.toString()
    const response = await fetch(fullUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      if (response.status === 404) {
        // Log full URL in dev mode only
        if (process.env.NODE_ENV === 'development') {
          console.error(`Adzuna job not found. Full URL used: ${fullUrl}`)
        }
        return null
      }
      const errorText = await response.text()
      console.error(`Adzuna API error for job ${rawId}:`, response.status, response.statusText, errorText)
      // Log full URL in dev mode
      if (process.env.NODE_ENV === 'development') {
        console.error(`Adzuna API URL used: ${fullUrl}`)
      }
      throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`Error fetching Adzuna job ${rawId}:`, error)
    throw error
  }
}

/**
 * Normalize Reed job to common format
 */
function normalizeReedJobForDetails(reedJob: any, fullId: string) {
  return {
    id: fullId,
    title: reedJob.jobTitle || 'Untitled Job',
    company: reedJob.employerName || 'Unknown Company',
    location: reedJob.locationName || 'Location not specified',
    description: reedJob.fullDescription || reedJob.jobDescription || '',
    type: reedJob.contractType || (reedJob.fullTime ? 'Full-time' : reedJob.partTime ? 'Part-time' : undefined),
    link: reedJob.jobUrl || undefined,
    salary: reedJob.minimumSalary && reedJob.maximumSalary
      ? `£${reedJob.minimumSalary.toLocaleString()} - £${reedJob.maximumSalary.toLocaleString()}`
      : reedJob.minimumSalary
      ? `From £${reedJob.minimumSalary.toLocaleString()}`
      : reedJob.maximumSalary
      ? `Up to £${reedJob.maximumSalary.toLocaleString()}`
      : undefined,
    source: 'reed',
    // Store full Reed job object for compatibility
    _reedJob: reedJob,
  }
}

/**
 * Normalize Adzuna job to common format
 */
function normalizeAdzunaJobForDetails(adzunaJob: any, fullId: string) {
  return {
    id: fullId,
    title: adzunaJob.title || 'Untitled Job',
    company: adzunaJob.company?.display_name || 'Unknown Company',
    location: adzunaJob.location?.display_name || 'Location not specified',
    description: adzunaJob.description || '',
    type: adzunaJob.contract_type || 'Full-time',
    link: adzunaJob.redirect_url || undefined,
    salary: adzunaJob.salary_min && adzunaJob.salary_max
      ? `£${adzunaJob.salary_min.toLocaleString()} - £${adzunaJob.salary_max.toLocaleString()}`
      : adzunaJob.salary_min
      ? `From £${adzunaJob.salary_min.toLocaleString()}`
      : adzunaJob.salary_max
      ? `Up to £${adzunaJob.salary_max.toLocaleString()}`
      : undefined,
    contract_time: adzunaJob.contract_time,
    salary_min: adzunaJob.salary_min,
    salary_max: adzunaJob.salary_max,
    category: adzunaJob.category?.label,
    provider: 'adzuna',
    source: 'adzuna',
    // Store full Adzuna job object for compatibility
    _adzunaJob: adzunaJob,
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    if (!id) {
      return NextResponse.json(
        { error: 'Job ID is required' },
        { status: 400 }
      )
    }

    // Parse the job ID to extract provider and raw ID
    const parsed = parseJobId(id)

    let job: any = null

    // Fetch from the appropriate provider
    if (parsed.provider === 'jobaz') {
      const jobaz = await fetchJobazJobById(parsed.rawId)
      if (jobaz) {
        job = {
          id: jobaz.id,
          title: jobaz.title,
          company: jobaz.company,
          location: jobaz.location,
          description: jobaz.description,
          type: jobaz.jobType,
          link: jobaz.url,
          salary: jobaz.salary,
          source: 'jobaz',
          featured: jobaz.featured,
          partnerCompany: jobaz.partnerCompany,
          requirements: jobaz.requirements,
          benefits: jobaz.benefits,
          companyWebsite: jobaz.companyWebsite,
          routeTags: jobaz.routeTags,
        }
      }
    } else if (parsed.provider === 'reed') {
      const reedJob = await fetchReedJobById(parsed.rawId)
      if (reedJob) {
        job = normalizeReedJobForDetails(reedJob, parsed.fullId)
      }
    } else if (parsed.provider === 'adzuna') {
      try {
        const adzunaJob = await fetchAdzunaJobById(parsed.rawId)
        if (adzunaJob) {
          job = normalizeAdzunaJobForDetails(adzunaJob, parsed.fullId)
        }
      } catch (error) {
        console.error(`Error fetching Adzuna job ${parsed.rawId}:`, error)
        // Re-throw to be handled by error handler below
        throw error
      }
    }

    // If not found from provider, try mock jobs as fallback
    if (!job) {
      const mockJob = mockJobs.find((j) => j.id === id)
      if (mockJob) {
        job = mockJob
      }
    }

    if (!job) {
      // Provide more specific error message for Adzuna jobs
      let errorMessage = 'Job not found'
      if (parsed.provider === 'adzuna') {
        errorMessage = `Adzuna job not found (ID: ${parsed.rawId}). The job may have been removed or the ID is incorrect.`
        // Log full URL in dev mode only
        if (process.env.NODE_ENV === 'development') {
          const appId = process.env.ADZUNA_APP_ID
          const apiBase = process.env.ADZUNA_API_BASE || 'https://api.adzuna.com/v1/api'
          const debugUrl = `${apiBase}/jobs/gb/${parsed.rawId}.json?app_id=${appId}&app_key=***`
          console.error(`Adzuna job not found. Full URL used: ${debugUrl}`)
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 404 }
      )
    }

    return NextResponse.json({ job })
  } catch (error) {
    console.error('Error fetching job:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to fetch job', details: errorMessage },
      { status: 500 }
    )
  }
}

