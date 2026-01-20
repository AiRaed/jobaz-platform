import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * GET /api/proofreading/projects
 * Fetches all proofreading projects for the authenticated user.
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

    const { data: projects, error } = await supabase
      .from('proofreading_projects')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[Proofreading Projects] Error:', error)
      return NextResponse.json(
        { ok: false, error: 'Failed to fetch projects' },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, projects: projects || [] })
  } catch (error: any) {
    console.error('[Proofreading Projects] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { status: 500 }
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
  
  // If already a valid slug, return it
  const validSlugs = ['general', 'academic_standard', 'academic_research_phd']
  if (validSlugs.includes(trimmed.toLowerCase())) {
    return trimmed.toLowerCase()
  }
  
  // Map old labels to slugs (backward compatibility)
  const lowerTrimmed = trimmed.toLowerCase()
  
  if (lowerTrimmed === 'general' || trimmed === 'General') {
    return 'general'
  }
  
  // Academic – Standard or Academic - Standard (with em dash or hyphen)
  if (lowerTrimmed === 'academic' || 
      lowerTrimmed.includes('academic') && lowerTrimmed.includes('standard') ||
      trimmed === 'Academic' ||
      trimmed.includes('Academic – Standard') || 
      trimmed.includes('Academic - Standard')) {
    return 'academic_standard'
  }
  
  // Academic – Research / PhD or Academic - Research / PhD
  if (lowerTrimmed.includes('academic') && (lowerTrimmed.includes('research') || lowerTrimmed.includes('phd')) ||
      trimmed === 'Academic Research' ||
      trimmed.includes('Academic – Research') || 
      trimmed.includes('Academic - Research') || 
      trimmed.includes('PhD')) {
    return 'academic_research_phd'
  }
  
  // Default fallback
  return 'general'
}

/**
 * POST /api/proofreading/projects
 * Creates a new proofreading project.
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
      console.error('[Proofreading Projects] JSON parse error:', parseError)
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Invalid JSON in request body',
          message: parseError?.message || 'Failed to parse request body'
        },
        { status: 400 }
      )
    }

    const { title, category = 'general' } = body

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json(
        { ok: false, error: 'Title is required and must be a non-empty string' },
        { status: 400 }
      )
    }

    // Map category label to slug (backward compatible)
    const categorySlug = normalizeCategoryToSlug(category)
    
    const payload = {
      user_id: user.id,
      title: title.trim(),
      category: categorySlug,
    }

    console.log('[Proofreading Projects] Creating project with payload:', {
      ...payload,
      originalCategory: category,
      normalizedCategory: categorySlug,
    })

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
        originalCategory: category,
        payload,
        fullError: error,
      })
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Failed to create project',
          code: error.code || 'UNKNOWN_ERROR',
          message: error.message || 'Unknown error occurred',
          details: error.details || null,
          hint: error.hint || null,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ ok: true, project })
  } catch (error: any) {
    console.error('[Proofreading Projects] Unexpected error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      fullError: error,
    })
    return NextResponse.json(
      { 
        ok: false, 
        error: error?.message || 'Internal server error',
        message: error?.message || 'An unexpected error occurred while creating the project'
      },
      { status: 500 }
    )
  }
}

