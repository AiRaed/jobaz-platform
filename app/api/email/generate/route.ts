import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { generateEmail } from '@/lib/email-templates'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/email/generate
 * Generates a professional email from wizard data.
 */
export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore in route handler
          }
        },
      },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    let body
    try {
      body = await req.json()
    } catch (parseError: any) {
      console.error('[Email Generate] JSON parse error:', parseError)
      return NextResponse.json(
        { ok: false, error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    const { 
      recipient_type, 
      tone, 
      purpose, 
      sender_name,
      sender_role,
      sender_phone,
      ...additionalFields 
    } = body

    if (!recipient_type || !tone || !purpose) {
      return NextResponse.json(
        { ok: false, error: 'recipient_type, tone, and purpose are required' },
        { status: 400 }
      )
    }

    try {
      const email = generateEmail({
        recipientType: recipient_type,
        tone,
        purpose,
        senderName: sender_name || 'Your Name',
        senderRole: sender_role || '',
        senderPhone: sender_phone || '',
        ...additionalFields,
      })

      return NextResponse.json({ ok: true, email })
    } catch (error: any) {
      console.error('[Email Generate] Generation error:', error)
      return NextResponse.json(
        { ok: false, error: error.message || 'Failed to generate email' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('[Email Generate] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

