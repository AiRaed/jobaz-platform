import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import { isAdminUser } from '@/lib/auth/adminEmails'
import { getOptionalAuthUserEmail } from '@/lib/career-engine/work-in-education/resolve-flag-server'
import {
  resolveWieKnowledgeEngineEnabled,
  WIE_ADMIN_OVERRIDE_COOKIE,
} from '@/lib/career-engine/work-in-education/feature-flag'
import { checkWieAssessmentRateLimit } from '@/lib/career-engine/work-in-education/rate-limit'
import {
  loadPathwayDetailFromLibrary,
  loadPathwayKnowledgeFromLibrary,
} from '@/lib/career-engine/pathway-knowledge'
import type { PathwayMatchContextPayload } from '@/lib/career-engine/pathway-knowledge'

export const dynamic = 'force-dynamic'

/**
 * GET /api/career-assistant/work-in-my-education/pathway?id=<role_uuid>
 * Optional: &detail=1 for Batch 7 PathwayDetailResponse
 *
 * Loads Career Knowledge Library enrichment for a recommended role.
 * Does not run matching/assessment. Placeholders when fields are missing.
 */
export async function GET(req: Request) {
  const email = await getOptionalAuthUserEmail()
  const cookieStore = await cookies()
  const cookieOverride = cookieStore.get(WIE_ADMIN_OVERRIDE_COOKIE)?.value ?? null
  const flagOn = resolveWieKnowledgeEngineEnabled({
    isAdmin: isAdminUser(email),
    cookieOverride,
  })
  if (!flagOn) {
    return NextResponse.json({ error: 'Not available.', code: 'feature_disabled' }, { status: 403 })
  }

  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  const rate = checkWieAssessmentRateLimit(`wie-pathway:${ip}`, { limit: 60, windowMs: 60_000 })
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many requests.', code: 'rate_limited' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfterSec) } }
    )
  }

  const url = new URL(req.url)
  const id = url.searchParams.get('id')?.trim() || ''
  if (!id || id.length > 80) {
    return NextResponse.json({ error: 'Missing pathway id.', code: 'missing_id' }, { status: 400 })
  }

  const wantDetail =
    url.searchParams.get('detail') === '1' || url.searchParams.get('detail') === 'true'

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Knowledge library temporarily unavailable.', code: 'unavailable' },
      { status: 503 }
    )
  }

  try {
    if (wantDetail) {
      // Optional match hints from query — display only; never invent eligibility.
      let matchContext: PathwayMatchContextPayload | null = null
      const scoreRaw = url.searchParams.get('score')
      const category = url.searchParams.get('category')
      const eligibility = url.searchParams.get('eligibility')
      if (category || eligibility || scoreRaw) {
        matchContext = {
          role_id: id,
          title: url.searchParams.get('title') || '',
          field_name: url.searchParams.get('field') || '',
          specialism_name: url.searchParams.get('specialism') || '',
          stage_label: url.searchParams.get('stage') || null,
          category: category || '',
          eligibility_label: eligibility || '',
          match_score: scoreRaw ? Number(scoreRaw) : 0,
          lead_in: url.searchParams.get('lead_in') || '',
          why: [],
          requirements: [],
          next_step: null,
          saved_at: new Date().toISOString(),
        }
      }

      const detail = await loadPathwayDetailFromLibrary(supabase, id, {
        matchContext,
        matchContextSource: matchContext ? 'query' : 'none',
      })

      if (!detail.found) {
        return NextResponse.json(
          { detail, error: 'Pathway not found.', code: detail.error_code || 'not_found' },
          { status: 404 }
        )
      }

      console.info('[wie-public/pathway] detail', {
        pathway_id: id,
        source: detail.provenance.knowledge_source,
        regulated: detail.role?.is_regulated ?? false,
      })
      return NextResponse.json({ detail, pathway: detail.knowledge })
    }

    const pathway = await loadPathwayKnowledgeFromLibrary(supabase, id)
    console.info('[wie-public/pathway] loaded', {
      pathway_id: id,
      source: pathway.source,
      has_courses: pathway.recommended_courses.items.length,
    })
    return NextResponse.json({ pathway })
  } catch (err) {
    console.error('[wie-public/pathway] failed', {
      message: err instanceof Error ? err.message : 'unknown',
    })
    return NextResponse.json(
      { error: 'Could not load pathway details.', code: 'pathway_failed' },
      { status: 500 }
    )
  }
}
