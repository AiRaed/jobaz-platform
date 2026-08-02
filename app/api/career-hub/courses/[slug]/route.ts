import { NextResponse } from 'next/server'
import { fetchMarketplaceCourseBySlug } from '@/lib/career-hub/marketplace/fetch'
import { normalizeCourseSlug } from '@/lib/career-hub/marketplace/slug'

export const dynamic = 'force-dynamic'

type RouteContext = { params: Promise<{ slug: string }> }

export async function GET(_req: Request, context: RouteContext) {
  const { slug } = await context.params
  const normalized = normalizeCourseSlug(slug)

  try {
    const course = await fetchMarketplaceCourseBySlug(normalized)
    if (!course) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 })
    }
    return NextResponse.json({ course })
  } catch (err) {
    console.error('[career-hub/courses/slug]', err)
    return NextResponse.json({ error: 'Failed to load course' }, { status: 500 })
  }
}
