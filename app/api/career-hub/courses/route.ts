import { NextResponse } from 'next/server'
import { fetchListingsForPath, fetchMarketplaceListings } from '@/lib/career-hub/marketplace/fetch'
import { normalizeRouteSlug } from '@/lib/career-hub/courseVisibility'
import type { CourseDeliveryMode } from '@/lib/admin/courses/types'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const pathId = url.searchParams.get('pathId')?.trim()

  if (pathId) {
    try {
      const normalizedPath = normalizeRouteSlug(pathId)
      const courses = await fetchListingsForPath(normalizedPath)
      return NextResponse.json({ courses, pathId: normalizedPath })
    } catch (err) {
      console.error('[career-hub/courses]', err)
      return NextResponse.json({ error: 'Failed to load courses' }, { status: 500 })
    }
  }

  const delivery = url.searchParams.get('delivery') as CourseDeliveryMode | 'all' | null

  try {
    const courses = await fetchMarketplaceListings({
      search: url.searchParams.get('q') ?? undefined,
      category: url.searchParams.get('category') ?? undefined,
      provider: url.searchParams.get('provider') ?? undefined,
      fundingType: url.searchParams.get('funding') ?? undefined,
      route: url.searchParams.get('route') ?? undefined,
      deliveryMode: delivery && delivery !== 'all' ? delivery : undefined,
    })

    return NextResponse.json({ courses, total: courses.length })
  } catch (err) {
    console.error('[career-hub/courses marketplace]', err)
    return NextResponse.json({ error: 'Failed to load marketplace courses' }, { status: 500 })
  }
}
