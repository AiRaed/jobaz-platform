import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { calculateCvReadiness } from '@/lib/cv/calculateCvReadiness'
import { isMeaningfulCv } from '@/lib/cv/isMeaningfulCv'
import { mapCvsRowToProfile } from '@/lib/cv/cvProfile'
import type { CvData } from '@/app/cv-builder-v2/page'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/cv/get-latest
 *
 * Fetches the primary/latest saved CV for the authenticated user.
 * Readiness uses shared calculateCvReadiness (same as Documents + Builder).
 * Does not change the upsert / single-CV save path.
 */
export async function GET(req: NextRequest) {
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
            // Route Handler cookie set may be ignored when middleware refreshes sessions.
          }
        },
      },
    })

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ ok: false, error: 'Authentication required' }, { status: 401 })
    }

    const cvIdParam = req.nextUrl.searchParams.get('cvId')

    // Prefer exact cvId when requested; else primary; else latest
    let cvRows: Record<string, any>[] | null = null
    let queryError: { message?: string } | null = null

    if (cvIdParam) {
      const byId = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', user.id)
        .eq('id', cvIdParam)
        .limit(1)
      cvRows = byId.data
      queryError = byId.error
    }

    if ((!cvRows || cvRows.length === 0) && !cvIdParam) {
      const primaryQuery = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_primary', true)
        .order('updated_at', { ascending: false })
        .limit(1)

      if (!primaryQuery.error && primaryQuery.data && primaryQuery.data.length > 0) {
        cvRows = primaryQuery.data
      } else {
        const latestQuery = await supabase
          .from('cvs')
          .select('*')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1)
        cvRows = latestQuery.data
        queryError = latestQuery.error
      }
    } else if (cvIdParam && (!cvRows || cvRows.length === 0) && !queryError) {
      // Requested id missing — fall back to primary so Builder can still open
      const latestQuery = await supabase
        .from('cvs')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
      cvRows = latestQuery.data
      queryError = latestQuery.error
    }

    if (queryError) {
      console.error('[CV Get Latest] Database error:', queryError)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch CV from database' },
        { status: 500 }
      )
    }

    if (!cvRows || cvRows.length === 0) {
      return NextResponse.json({
        ok: true,
        hasCv: false,
        cv: null,
        readiness: null,
        profile: null,
      })
    }

    const cvRow = cvRows[0]
    const profile = mapCvsRowToProfile({
      id: cvRow.id,
      user_id: cvRow.user_id,
      title: cvRow.title,
      target_role: cvRow.target_role,
      target_route: cvRow.target_route,
      linked_plan_id: cvRow.linked_plan_id,
      is_primary: cvRow.is_primary,
      created_at: cvRow.created_at,
      updated_at: cvRow.updated_at,
      saved_at: cvRow.saved_at,
      data: cvRow.data,
    })

    const rawCvData = cvRow.data || {}

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
      certifications: Array.isArray(rawCvData.certifications)
        ? rawCvData.certifications
        : undefined,
      publications: Array.isArray(rawCvData.publications) ? rawCvData.publications : undefined,
    }

    const readinessResult = calculateCvReadiness(cvData)
    const meaningful = isMeaningfulCv(cvData)

    const readiness = {
      score: readinessResult.score,
      level: readinessResult.statusLabel,
      status: readinessResult.status,
      topFixes: readinessResult.missing.slice(0, 5),
      suggestedNextStep: readinessResult.suggestedNextStep,
      lastUpdated: cvRow.updated_at || cvRow.saved_at || new Date().toISOString(),
      isMeaningfulCv: meaningful,
    }

    return NextResponse.json({
      ok: true,
      hasCv: true,
      cvId: cvRow.id,
      cv: cvData,
      readiness,
      isMeaningfulCv: meaningful,
      profile: {
        id: profile.id,
        title: profile.title,
        isPrimary: profile.is_primary,
        targetRole: profile.target_role,
        targetRoute: profile.target_route,
        linkedPlanId: profile.linked_plan_id,
        updatedAt: profile.updated_at,
      },
    })
  } catch (error: any) {
    console.error('[CV Get Latest] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to fetch CV' },
      { status: 500 }
    )
  }
}
