import { NextResponse } from 'next/server'
import { bootstrapFeedData } from '@/lib/feed/bootstrapFeed'

export const dynamic = 'force-dynamic'

/** POST /api/feed/bootstrap — seed official groups + starter posts if empty (service role) */
export async function POST() {
  try {
    const result = await bootstrapFeedData()
    if (!result.ok) {
      return NextResponse.json(result, { status: result.error.includes('not found') ? 503 : 500 })
    }
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Bootstrap failed' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return POST()
}
