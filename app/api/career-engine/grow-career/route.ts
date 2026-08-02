/**
 * POST /api/career-engine/grow-career
 * JAZ-first structured plan for Grow in Current Career.
 */

import { NextResponse } from 'next/server'
import { attachJazToCareerResult } from '@/lib/jaz-career-engine/attachJazToCareerResult'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, string>
    if (!body.current_role && !body.grow_field) {
      return NextResponse.json({ error: 'Missing grow career answers' }, { status: 400 })
    }

    const jaz = await attachJazToCareerResult('grow_career', body)

    return NextResponse.json({
      result: {
        pathId: 'grow_career',
        phase: 'roadmap',
        answers: body,
        ...jaz,
      },
    })
  } catch (error) {
    console.error('[career-engine/grow-career]', error)
    return NextResponse.json({ error: 'Failed to generate growth plan' }, { status: 500 })
  }
}
