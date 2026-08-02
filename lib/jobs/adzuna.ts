/**
 * Adzuna Job Fetcher
 * Fetches raw job data from Adzuna UK API
 * No UI logic, just data fetching
 */

export interface AdzunaSearchParams {
  keyword: string
  location?: string
  page?: number
  pageSize?: number
}

export interface AdzunaApiResponse {
  results: Array<{
    id: string
    title: string
    company: {
      display_name: string
    }
    location: {
      display_name: string
    }
    description: string
    redirect_url: string
    salary_min?: number
    salary_max?: number
    salary_is_predicted?: string
    created?: string
    category?: {
      label: string
    }
  }>
  count: number
}

/**
 * Fetch raw jobs from Adzuna UK API
 * Returns raw API response data (not normalized)
 */
export async function fetchAdzunaJobs(
  params: AdzunaSearchParams
): Promise<AdzunaApiResponse['results']> {
  const appId = process.env.ADZUNA_APP_ID
  const appKey = process.env.ADZUNA_APP_KEY
  const apiBase = process.env.ADZUNA_API_BASE || 'https://api.adzuna.com/v1/api'

  if (!appId || !appKey) {
    throw new Error('Missing Adzuna API credentials (ADZUNA_APP_ID or ADZUNA_APP_KEY)')
  }

  // Default to UK if no location specified
  const location = params.location || 'UK'
  const page = params.page || 1
  const keyword = params.keyword.trim()

  if (!keyword) {
    throw new Error('Keyword is required')
  }

  // Build Adzuna API URL for UK jobs
  // Adzuna UK endpoint: /jobs/gb/search/{page}
  const url = new URL(`${apiBase}/jobs/gb/search/${page}`)
  url.searchParams.set('app_id', appId)
  url.searchParams.set('app_key', appKey)
  url.searchParams.set('what', keyword)
  url.searchParams.set('where', location)
  url.searchParams.set('results_per_page', String(params.pageSize ?? 20))
  url.searchParams.set('content-type', 'application/json')

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Adzuna API error:', response.status, response.statusText, errorText)
      throw new Error(`Adzuna API error: ${response.status} ${response.statusText}`)
    }

    const data: AdzunaApiResponse = await response.json()

    // Return raw results array
    return data.results || []
  } catch (error) {
    console.error('Error fetching jobs from Adzuna:', error)
    throw error
  }
}

