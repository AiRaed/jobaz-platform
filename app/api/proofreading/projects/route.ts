import { NextRequest, NextResponse } from 'next/server'
import {
  createProofreadingServerClient,
  isSupabaseConfigured,
  proofreadingProjectsJsonError,
  proofreadingProjectsJsonSuccess,
} from '@/lib/proofreading/supabaseServer'

export const dynamic = 'force-dynamic'

/**
 * GET /api/proofreading/projects
 * Fetches all proofreading projects for the authenticated user.
 */
export async function GET(_req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      if (process.env.NODE_ENV === 'development') {
        console.error('[Proofreading Projects] Supabase env vars are missing')
      }
      return proofreadingProjectsJsonSuccess([])
    }

    const supabase = createProofreadingServerClient()
    if (!supabase) {
      return proofreadingProjectsJsonSuccess([])
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error('[Proofreading Projects] Auth error:', authError)
    }

    if (authError || !user) {
      // Not signed in — return empty list so the UI can show "No projects yet"
      return proofreadingProjectsJsonSuccess([])
    }

    const { data: projects, error } = await supabase
      .from('proofreading_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[Proofreading Projects] Fetch error:', error)
      return proofreadingProjectsJsonError('Failed to load projects', 500, {
        code: error.code ?? 'DB_ERROR',
      })
    }

    return proofreadingProjectsJsonSuccess(projects || [])
  } catch (error: unknown) {
    console.error('[Proofreading Projects] Unexpected GET error:', error)
    return proofreadingProjectsJsonError(
      error instanceof Error ? error.message : 'Failed to load projects',
      500
    )
  }
}

/**
 * Maps category labels to slugs for safe database storage
 * Handles both UI labels and slug values (backward compatible)
 */
function normalizeCategoryToSlug(category: string): string {
  if (!category || typeof category !== 'string') {
    return 'general'
  }

  const trimmed = category.trim()

  const validSlugs = ['general', 'academic_standard', 'academic_research_phd']
  if (validSlugs.includes(trimmed.toLowerCase())) {
    return trimmed.toLowerCase()
  }

  const lowerTrimmed = trimmed.toLowerCase()

  if (lowerTrimmed === 'general' || trimmed === 'General') {
    return 'general'
  }

  if (
    lowerTrimmed === 'academic' ||
    (lowerTrimmed.includes('academic') && lowerTrimmed.includes('standard')) ||
    trimmed === 'Academic' ||
    trimmed.includes('Academic – Standard') ||
    trimmed.includes('Academic - Standard')
  ) {
    return 'academic_standard'
  }

  if (
    (lowerTrimmed.includes('academic') &&
      (lowerTrimmed.includes('research') || lowerTrimmed.includes('phd'))) ||
    trimmed === 'Academic Research' ||
    trimmed.includes('Academic – Research') ||
    trimmed.includes('Academic - Research') ||
    trimmed.includes('PhD')
  ) {
    return 'academic_research_phd'
  }

  return 'general'
}

/**
 * POST /api/proofreading/projects
 * Creates a new proofreading project.
 */
export async function POST(req: NextRequest) {
  try {
    if (!isSupabaseConfigured()) {
      console.error('[Proofreading Projects] Supabase env vars are missing')
      return proofreadingProjectsJsonError(
        'Writing Review is not configured yet. Please try again later.',
        503,
        { code: 'NOT_CONFIGURED' }
      )
    }

    const supabase = createProofreadingServerClient()
    if (!supabase) {
      return proofreadingProjectsJsonError(
        'Writing Review is not configured yet. Please try again later.',
        503,
        { code: 'NOT_CONFIGURED' }
      )
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return proofreadingProjectsJsonError('Authentication required', 401, {
        code: 'AUTH_REQUIRED',
      })
    }

    let body: Record<string, unknown>
    try {
      body = (await req.json()) as Record<string, unknown>
    } catch (parseError: unknown) {
      console.error('[Proofreading Projects] JSON parse error:', parseError)
      return proofreadingProjectsJsonError('Invalid JSON in request body', 400, {
        code: 'INVALID_JSON',
      })
    }

    const title = typeof body.title === 'string' ? body.title : ''
    const category = typeof body.category === 'string' ? body.category : 'general'

    if (!title.trim()) {
      return proofreadingProjectsJsonError(
        'Title is required and must be a non-empty string',
        400,
        { code: 'VALIDATION_ERROR' }
      )
    }

    const categorySlug = normalizeCategoryToSlug(category)

    const payload = {
      user_id: user.id,
      title: title.trim(),
      category: categorySlug,
    }

    const { data: project, error } = await supabase
      .from('proofreading_projects')
      .insert(payload)
      .select()
      .single()

    if (error) {
      console.error('[Proofreading Projects] Create error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        category: categorySlug,
        payload,
      })
      return NextResponse.json(
        {
          ok: false,
          projects: [],
          error: 'Failed to create project',
          message: error.message || 'Failed to create project',
          code: error.code || 'DB_ERROR',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, project, projects: project ? [project] : [] })
  } catch (error: unknown) {
    console.error('[Proofreading Projects] Unexpected POST error:', error)
    return proofreadingProjectsJsonError(
      error instanceof Error ? error.message : 'Failed to create project',
      500
    )
  }
}
