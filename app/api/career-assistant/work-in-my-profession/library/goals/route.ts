import { NextResponse } from 'next/server'
import { PROFESSION_GOAL_OPTIONS } from '@/lib/career-engine/work-in-profession'

export const dynamic = 'force-dynamic'

/** GET profession pathway goals (step 4). */
export async function GET() {
  return NextResponse.json({
    goals: PROFESSION_GOAL_OPTIONS.map((g) => ({
      value: g.value,
      label: g.label,
      description: g.description,
    })),
  })
}
