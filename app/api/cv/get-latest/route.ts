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

    // The CV data is stored in the 'data' column as a JSONB object
    // Read from cvRow.data instead of trying to access flattened fields
    const rawCvData = cvRow.data || {}
    
    // Map database row to CvData format - read from data column
    const cvData: CvData = {
      personalInfo: {
        fullName: rawCvData.personalInfo?.fullName || rawCvData.personal_info?.fullName || '',
        email: rawCvData.personalInfo?.email || rawCvData.personal_info?.email || '',
        phone: rawCvData.personalInfo?.phone || rawCvData.personal_info?.phone || '',
        location: rawCvData.personalInfo?.location || rawCvData.personal_info?.location || '',
        linkedin: rawCvData.personalInfo?.linkedin || rawCvData.personal_info?.linkedin || '',
        website: rawCvData.personalInfo?.website || rawCvData.personal_info?.website || '',
      },
      summary: typeof rawCvData.summary === 'string' ? rawCvData.summary : '',
      experience: Array.isArray(rawCvData.experience) ? rawCvData.experience : [],
      education: Array.isArray(rawCvData.education) ? rawCvData.education : [],
      skills: Array.isArray(rawCvData.skills) ? rawCvData.skills : [],
      projects: Array.isArray(rawCvData.projects) ? rawCvData.projects : undefined,
      languages: Array.isArray(rawCvData.languages) ? rawCvData.languages : undefined,
      certifications: Array.isArray(rawCvData.certifications) ? rawCvData.certifications : undefined,
      publications: Array.isArray(rawCvData.publications) ? rawCvData.publications : undefined,
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

