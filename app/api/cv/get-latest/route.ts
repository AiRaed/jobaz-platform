import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { computeCvScore } from '@/lib/cv-score'
import type { CvData } from '@/app/cv-builder-v2/page'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/cv/get-latest
 * 
 * Fetches the latest saved CV for the authenticated user from the database.
 * Returns CV data and calculated readiness score.
 * 
 * Response:
 * - { ok: true, hasCv: boolean, cv: {...} | null, readiness: {...} | null }
 * - { ok: false, error: string } on error
 * - 401 if not authenticated
 */
export async function GET(req: NextRequest) {
  try {
    // Create Supabase client with route handler (uses cookies for auth)
    const cookieStore = await cookies()
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
            // The `setAll` method was called from a Route Handler.
            // This can be ignored if you have middleware refreshing user sessions.
          }
        },
      },
    })

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Query the latest CV for this user (order by updated_at desc, limit 1)
    const { data: cvRows, error: queryError } = await supabase
      .from('cvs')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)

    if (queryError) {
      console.error('[CV Get Latest] Database error:', queryError)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch CV from database' },
        { status: 500 }
      )
    }

    // If no CV found, return hasCv=false
    if (!cvRows || cvRows.length === 0) {
      return NextResponse.json({
        ok: true,
        hasCv: false,
        cv: null,
        readiness: null,
      })
    }

    const cvRow = cvRows[0]

    // Map database row to CvData format
    const cvData: CvData = {
      personalInfo: {
        fullName: cvRow.personal_info?.fullName || cvRow.personal_info?.name || '',
        email: cvRow.personal_info?.email || '',
        phone: cvRow.personal_info?.phone || '',
        location: cvRow.personal_info?.location || cvRow.personal_info?.city || '',
        linkedin: cvRow.personal_info?.linkedin || '',
        website: cvRow.personal_info?.website || cvRow.personal_info?.portfolio || '',
      },
      summary: cvRow.summary || '',
      experience: Array.isArray(cvRow.experience) ? cvRow.experience : [],
      education: Array.isArray(cvRow.education) ? cvRow.education : [],
      skills: Array.isArray(cvRow.skills) ? cvRow.skills : [],
      projects: Array.isArray(cvRow.projects) ? cvRow.projects : undefined,
      languages: Array.isArray(cvRow.languages) ? cvRow.languages : undefined,
      certifications: Array.isArray(cvRow.certifications) ? cvRow.certifications : undefined,
      publications: Array.isArray(cvRow.publications) ? cvRow.publications : undefined,
    }

    // Calculate readiness score
    const scoreResult = computeCvScore(cvData)

    // Format readiness response
    const readiness = {
      score: scoreResult.score,
      level: scoreResult.level,
      topFixes: scoreResult.fixes,
      lastUpdated: cvRow.updated_at || cvRow.saved_at || new Date().toISOString(),
    }

    return NextResponse.json({
      ok: true,
      hasCv: true,
      cv: cvData,
      readiness,
    })
  } catch (error: any) {
    console.error('[CV Get Latest] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch CV' },
      { status: 500 }
    )
  }
}

