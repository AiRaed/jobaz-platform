import { NextRequest, NextResponse } from 'next/server'
import { searchLandingJobs } from '@/lib/jobs/landing-search'

export const dynamic = 'force-dynamic'

/**
 * GET /api/jobs/landing
 * Landing page jobs — Reed + Adzuna, mixed default browse or keyword search.
 */
export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams
    const defaultBrowse = searchParams.get('default') === '1'
    const keyword = searchParams.get('keyword') || undefined
    const location = searchParams.get('location') || 'UK'

    const payload = await searchLandingJobs({
      keyword,
      location,
      defaultBrowse,
    })

    return NextResponse.json(payload, { status: 200 })
  } catch (error) {
    console.error('Error in jobs/landing route:', error)
    return NextResponse.json(
      {
        results: [],
        providers: { reed: false, adzuna: false },
        error: 'Failed to load jobs',
      },
      { status: 500 }
    )
  }
}
