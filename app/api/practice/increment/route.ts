import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const FREE_LIMIT = 15

// Mark as dynamic since we use cookies
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    const paidCookie = cookieStore.get('practice_paid')
    const freeUsedCookie = cookieStore.get('practice_free_used')

    const paid = paidCookie?.value === 'true'
    let freeUsed = freeUsedCookie ? parseInt(freeUsedCookie.value, 10) : 0

    // Only increment if not paid and under limit
    if (!paid && freeUsed < FREE_LIMIT) {
      freeUsed = Math.min(freeUsed + 1, FREE_LIMIT)
      
      // Set cookie with 1 year expiry
      cookieStore.set('practice_free_used', freeUsed.toString(), {
        maxAge: 365 * 24 * 60 * 60,
        httpOnly: false,
        sameSite: 'lax',
        path: '/',
      })
    }

    return NextResponse.json({
      paid,
      freeUsed,
    })
  } catch (error) {
    console.error('[Practice Increment API] Error:', error)
    // Return current state on error (don't fail the request)
    const cookieStore = await cookies()
    const paidCookie = cookieStore.get('practice_paid')
    const freeUsedCookie = cookieStore.get('practice_free_used')
    
    return NextResponse.json({
      paid: paidCookie?.value === 'true' || false,
      freeUsed: freeUsedCookie ? parseInt(freeUsedCookie.value, 10) : 0,
    })
  }
}

