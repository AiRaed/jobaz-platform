/**
 * POST /api/career-engine/start-business
 * Phase-1 JAZ-controlled business setup plan (no fake affiliate push).
 */

import { NextResponse } from 'next/server'
import { attachJazToCareerResult } from '@/lib/jaz-career-engine/attachJazToCareerResult'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, string>
    if (!body.biz_idea) {
      return NextResponse.json({ error: 'Missing business answers' }, { status: 400 })
    }

    const jaz = await attachJazToCareerResult('start_business', body)

    return NextResponse.json({
      result: {
        pathId: 'start_business',
        phase: 'roadmap',
        answers: body,
        ...jaz,
      },
    })
  } catch (error) {
    console.error('[career-engine/start-business]', error)
    return NextResponse.json({ error: 'Failed to generate business plan' }, { status: 500 })
  }
}
