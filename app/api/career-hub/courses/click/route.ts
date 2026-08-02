import { NextResponse } from 'next/server'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import type { CourseClickSource, CourseClickAction } from '@/lib/career-hub/marketplace/track'

export const dynamic = 'force-dynamic'

type ClickBody = {
  courseId: string
  source: CourseClickSource
  action?: CourseClickAction
  userId?: string | null
  providerName?: string | null
  referralUrl?: string | null
  sessionId?: string | null
  route?: string | null
}

export async function POST(req: Request) {
  let body: ClickBody
  try {
    body = (await req.json()) as ClickBody
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!body.courseId?.trim()) {
    return NextResponse.json({ error: 'courseId required' }, { status: 400 })
  }

  const action = body.action ?? 'apply_now'

  const supabase = getAdminCoursesSupabase()
  if (supabase) {
    let providerName = body.providerName?.trim() || null
    let referralUrl = body.referralUrl?.trim() || null

    if (action === 'apply_now' && (!providerName || !referralUrl)) {
      const { data: courseRow } = await supabase
        .from('courses')
        .select('provider_name, referral_url, official_url, clicks')
        .eq('id', body.courseId)
        .maybeSingle()

      if (courseRow) {
        providerName = providerName || courseRow.provider_name || null
        referralUrl =
          referralUrl || courseRow.referral_url?.trim() || courseRow.official_url?.trim() || null
      }
    }

    if (action === 'apply_now') {
      const { data: row } = await supabase
        .from('courses')
        .select('clicks')
        .eq('id', body.courseId)
        .maybeSingle()

      const nextClicks = (row?.clicks ?? 0) + 1
      await supabase.from('courses').update({ clicks: nextClicks }).eq('id', body.courseId)
    }

    if (action === 'save_to_plan') {
      const { data: row } = await supabase
        .from('courses')
        .select('saves')
        .eq('id', body.courseId)
        .maybeSingle()

      const nextSaves = (row?.saves ?? 0) + 1
      await supabase.from('courses').update({ saves: nextSaves }).eq('id', body.courseId)
    }

    const clickRow: Record<string, unknown> = {
      course_id: body.courseId,
      user_id: body.userId ?? null,
      source: body.source ?? 'unknown',
      action,
      provider_name: providerName,
      referral_url: referralUrl,
    }
    if (body.sessionId?.trim()) clickRow.session_id = body.sessionId.trim()
    if (body.route?.trim()) clickRow.route = body.route.trim()

    const { error: insertError } = await supabase.from('course_clicks').insert(clickRow)
    if (insertError && (clickRow.session_id || clickRow.route)) {
      // Schema may not have optional columns yet — retry without them
      delete clickRow.session_id
      delete clickRow.route
      await supabase.from('course_clicks').insert(clickRow)
    }
  } else {
    console.log('[course-event]', {
      courseId: body.courseId,
      source: body.source,
      action,
      userId: body.userId ?? null,
      sessionId: body.sessionId ?? null,
      route: body.route ?? null,
      at: new Date().toISOString(),
    })
  }

  return NextResponse.json({ ok: true })
}
