import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import { isAdminUser } from '@/lib/auth/adminEmails'
import {
  resolveWieKnowledgeEngineEnabled,
  WIE_ADMIN_OVERRIDE_COOKIE,
} from '@/lib/career-engine/work-in-education/feature-flag'
import { getOptionalAuthUserEmail } from '@/lib/career-engine/work-in-education/resolve-flag-server'
import { loadLibraryFields } from '@/lib/career-engine/work-in-education/library-browse'

export const dynamic = 'force-dynamic'

function includeDraftsDefault() {
  const draftFlag = String(process.env.WIE_PUBLIC_INCLUDE_DRAFTS ?? 'true')
    .trim()
    .toLowerCase()
  return !['false', '0', 'no', 'off'].includes(draftFlag)
}

/** GET active career fields from Career Knowledge Library */
export async function GET() {
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

  const supabase = getCareerLibrarySupabase()
  if (!supabase) {
    return NextResponse.json(
      { error: 'Career matching is temporarily unavailable.', code: 'unavailable' },
      { status: 503 }
    )
  }

  try {
    const includeDrafts = includeDraftsDefault() || isAdmin
    const { fields, empty } = await loadLibraryFields(supabase, { includeDrafts })
    if (empty) {
      return NextResponse.json({
        fields: [],
        empty: true,
        message: isAdmin
          ? 'No active career fields in the Career Knowledge Library. Add fields in /admin/career-library.'
          : 'Career pathways are not available right now. Please try again later.',
      })
    }
    return NextResponse.json({
      fields: fields.map((f) => ({
        id: f.id,
        name: f.name,
        slug: f.slug,
        description: f.description,
      })),
      empty: false,
    })
  } catch (err) {
    console.error('[wie-library/fields]', err)
    return NextResponse.json({ error: 'Could not load career fields.', code: 'load_failed' }, { status: 500 })
  }
}
