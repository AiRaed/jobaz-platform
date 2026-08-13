import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getCareerLibrarySupabase } from '@/lib/admin/career-library/supabaseServer'
import { isAdminUser } from '@/lib/auth/adminEmails'
import {
  resolveWieKnowledgeEngineEnabled,
  WIE_ADMIN_OVERRIDE_COOKIE,
} from '@/lib/career-engine/work-in-education/feature-flag'
import { getOptionalAuthUserEmail } from '@/lib/career-engine/work-in-education/resolve-flag-server'
import { loadLibrarySpecialismsForField } from '@/lib/career-engine/work-in-education/library-browse'

export const dynamic = 'force-dynamic'

function includeDraftsDefault() {
  const draftFlag = String(process.env.WIE_PUBLIC_INCLUDE_DRAFTS ?? 'true')
    .trim()
    .toLowerCase()
  return !['false', '0', 'no', 'off'].includes(draftFlag)
}

/** GET active specialisms for a career field */
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

  const fieldId = new URL(req.url).searchParams.get('field_id')?.trim()
  if (!fieldId) {
    return NextResponse.json({ error: 'field_id is required.', code: 'missing_field' }, { status: 400 })
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
    const { specialisms, empty } = await loadLibrarySpecialismsForField(supabase, fieldId, {
      includeDrafts,
    })
    if (empty) {
      return NextResponse.json({
        specialisms: [],
        empty: true,
        message: isAdmin
          ? 'No active specialisms for this field. Add them in /admin/career-library.'
          : 'No specialisms are available for this field right now.',
      })
    }
    return NextResponse.json({
      specialisms: specialisms.map((s) => ({
        id: s.id,
        field_id: s.field_id,
        name: s.name,
        slug: s.slug,
        description: s.description,
        regulated_profession: s.regulated_profession,
      })),
      empty: false,
    })
  } catch (err) {
    console.error('[wie-library/specialisms]', err)
    return NextResponse.json(
      { error: 'Could not load specialisms.', code: 'load_failed' },
      { status: 500 }
    )
  }
}
