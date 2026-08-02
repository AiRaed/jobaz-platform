/**
 * Reed Job Fetcher
 * Fetches raw job data from Reed UK API
 * No UI logic, just data fetching
 */

export interface ReedSearchParams {
  keyword: string
  location?: string
  page?: number
  pageSize?: number
}

export interface ReedApiResponse {
  results: Array<{
    jobId: number
    jobTitle: string
    employerName: string
    locationName: string
    jobDescription: string
    jobUrl: string
    minimumSalary?: number
    maximumSalary?: number
    date?: string
    jobType?: string
  }>
  totalResults: number
}

/**
 * Fetch raw jobs from Reed UK API
 * Returns raw API response data (not normalized)
 */
export async function fetchReedJobs(
  params: ReedSearchParams
): Promise<ReedApiResponse['results']> {
  const apiKey = process.env.REED_API_KEY
  const apiBase = process.env.REED_API_BASE || 'https://www.reed.co.uk/api/1.0'

  if (!apiKey) {
    throw new Error('Missing Reed API credentials (REED_API_KEY)')
  }

  // Default to UK if no location specified
  const location = params.location || 'UK'
  const page = params.page || 1
  const keyword = params.keyword.trim()

  if (!keyword) {
    throw new Error('Keyword is required')
  }

  // Build Reed API URL for job search
  // Reed UK endpoint: /search
  const url = new URL(`${apiBase}/search`)
  url.searchParams.set('keywords', keyword)
  url.searchParams.set('locationName', location)
  url.searchParams.set('resultsToTake', String(params.pageSize ?? 20))
  url.searchParams.set('resultsToSkip', String((page - 1) * 20))

  try {
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        Authorization: 'Basic ' + Buffer.from(apiKey + ':').toString('base64'),
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Reed API error:', response.status, response.statusText, errorText)
      throw new Error(`Reed API error: ${response.status} ${response.statusText}`)
    }

    const data: ReedApiResponse = await response.json()

    // Return raw results array
    return data.results || []
  } catch (error) {
    console.error('Error fetching jobs from Reed:', error)
    throw error
  }
}

