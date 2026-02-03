import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const FREE_LIMIT = 15

// Mark as dynamic since we use cookies
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const paidCookie = cookieStore.get('practice_paid')
    const freeUsedCookie = cookieStore.get('practice_free_used')

    const paid = paidCookie?.value === 'true'
    const freeUsed = freeUsedCookie ? parseInt(freeUsedCookie.value, 10) : 0

    return NextResponse.json({
      paid,
      freeUsed: Math.max(0, Math.min(freeUsed, FREE_LIMIT)),
    })
  } catch (error) {
    console.error('[Practice Access API] Error:', error)
    // Return default values on error
    return NextResponse.json({
      paid: false,
      freeUsed: 0,
    })
  }
}

