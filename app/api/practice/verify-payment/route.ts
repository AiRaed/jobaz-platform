import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const cookieStore = await cookies()
    
    // Set paid cookie (24 hours from now)
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000)
    cookieStore.set('practice_paid', 'true', {
      maxAge: 24 * 60 * 60,
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
    })

    return NextResponse.json({
      paid: true,
      expiresAt,
    })
  } catch (error) {
    console.error('[Practice Verify Payment API] Error:', error)
    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    )
  }
}

