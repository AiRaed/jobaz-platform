import { NextResponse } from 'next/server'
import { resolveCareerAssistantCourseTitles } from '@/lib/recommendations/buildStructuredRecommendations'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      titles?: string[]
      pathId?: string
      limit?: number
    }

    const titles = (body.titles ?? []).filter((t) => typeof t === 'string' && t.trim())
    if (titles.length === 0) {
      return NextResponse.json({ cards: [], plainAdvice: [] })
    }

    const result = await resolveCareerAssistantCourseTitles(titles, {
      pathId: body.pathId,
      limit: body.limit ?? 4,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('[recommendations/resolve-courses]', error)
    return NextResponse.json({ error: 'Failed to resolve courses' }, { status: 500 })
  }
}
