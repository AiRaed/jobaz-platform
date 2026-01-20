import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/proofreading/import-docx
 * 
 * Extracts text from a DOCX file.
 * For now, returns a message that client-side parsing should be used.
 * In production, you'd use mammoth or similar library server-side.
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

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Note: DOCX files are ZIP archives containing XML
    // For proper DOCX parsing, install mammoth: npm install mammoth
    // For now, we'll return a helpful message
    // Client-side can handle DOCX using mammoth.js or similar
    
    return NextResponse.json({
      ok: false,
      error: 'DOCX import coming soon. Please use .txt files for now. For DOCX support, install mammoth server-side.',
      suggestion: 'Use .txt files or wait for DOCX support',
    }, { status: 501 })
  } catch (error: any) {
    console.error('[Proofreading Import DOCX] Error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to import DOCX file' },
      { status: 500 }
    )
  }
}

