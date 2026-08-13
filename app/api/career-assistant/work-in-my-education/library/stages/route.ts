import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import { isAdminUser } from '@/lib/auth/adminEmails'
import {
  resolveWieKnowledgeEngineEnabled,
  WIE_ADMIN_OVERRIDE_COOKIE,
} from '@/lib/career-engine/work-in-education/feature-flag'
import { getOptionalAuthUserEmail } from '@/lib/career-engine/work-in-education/resolve-flag-server'
import { loadLibraryStagesForSpecialism } from '@/lib/career-engine/work-in-education/library-browse'

export const dynamic = 'force-dynamic'

/** GET active stages for a specialism (from its stage model, minus disabled keys) */
export async function GET(req: Request) {
  const email = await getOptionalAuthUserEmail()
  const isAdmin = isAdminUser(email)
  const cookieStore = await cookies()
  const cookieOverride = cookieStore.get(WIE_ADMIN_OVERRIDE_COOKIE)?.value ?? null
  const flagOn = resolveWieKnowledgeEngineEnabled({
    isAdmin,
    cookieOverride,
    queryOverride: null,
  })
  if (!flagOn) {
    return NextResponse.json({ error: 'Not available.', code: 'feature_disabled' }, { status: 403 })
  }

  const specialismId = new URL(req.url).searchParams.get('specialism_id')?.trim()
  if (!specialismId) {
    return NextResponse.json(
      { error: 'specialism_id is required.', code: 'missing_specialism' },
      { status: 400 }
    )
  }

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career matching is temporarily unavailable.', code: 'unavailable' },
      { status: 503 }
    )
  }

  try {
    const pack = await loadLibraryStagesForSpecialism(supabase, specialismId)
    if (pack.empty) {
      const adminHint =
        pack.reason === 'no_stage_model'
          ? 'This specialism has no stage model assigned. Set a stage model in /admin/career-library.'
          : 'No active stages for this specialism’s model (or all are disabled for this specialism).'
      return NextResponse.json({
        stages: [],
        empty: true,
        reason: pack.reason,
        message: isAdmin
          ? adminHint
          : 'Career stages are not available for this specialism right now.',
      })
    }
    return NextResponse.json({
      stages: pack.stages.map((s) => ({
        id: s.id,
        stage_key: s.stage_key,
        label: s.label,
        sort_order: s.sort_order ?? null,
      })),
      empty: false,
      specialism: pack.specialism
        ? { id: pack.specialism.id, name: pack.specialism.name }
        : null,
    })
  } catch (err) {
    console.error('[wie-library/stages]', err)
    return NextResponse.json({ error: 'Could not load stages.', code: 'load_failed' }, { status: 500 })
  }
}
