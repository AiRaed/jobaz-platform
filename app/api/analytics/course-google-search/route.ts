import { NextResponse } from 'next/server'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'

export const dynamic = 'force-dynamic'

type Body = {
  event_type?: string
  course_opportunity_id?: string | null
  published_course_id?: string | null
  title?: string
  suggested_search_keywords?: string
  source?: string
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Body
    const title = (body.title ?? '').trim()
    if (!title) {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    let userId: string | null = null

    const service = getAdminCoursesSupabase()
    if (service) {
      const { error } = await service.from('course_google_search_events').insert({
        event_type: body.event_type ?? 'course_google_search_click',
        course_opportunity_id: body.course_opportunity_id ?? null,
        published_course_id: body.published_course_id ?? null,
        title,
        suggested_search_keywords: (body.suggested_search_keywords ?? '').trim() || null,
        source: body.source ?? 'career_coach_result',
        user_id: userId,
      })

      if (error) {
        console.error('[analytics/course-google-search]', error.message)
      }
    } else {
      console.info('[analytics/course-google-search:mock]', {
        title,
        keywords: body.suggested_search_keywords,
        source: body.source,
      })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[analytics/course-google-search]', error)
    return NextResponse.json({ error: 'Failed to track event' }, { status: 500 })
  }
}
