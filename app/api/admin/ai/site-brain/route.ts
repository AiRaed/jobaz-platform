import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getActiveSiteBrain, saveSiteBrain } from '@/lib/admin/ai/siteBrain'
import { DEFAULT_SITE_BRAIN } from '@/lib/admin/ai/types'

export const dynamic = 'force-dynamic'

export async function GET() {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const result = await getActiveSiteBrain()
    return NextResponse.json({ ok: true, ...result })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to load Site Brain' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  try {
    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const str = (key: keyof typeof DEFAULT_SITE_BRAIN, fallback: string) =>
      String(body[key] ?? fallback ?? '')

    const saved = await saveSiteBrain({
      mission: str('mission', DEFAULT_SITE_BRAIN.mission),
      userValueProposition: str(
        'userValueProposition',
        DEFAULT_SITE_BRAIN.userValueProposition
      ),
      businessModel: str('businessModel', DEFAULT_SITE_BRAIN.businessModel),
      coreUserJourney: str('coreUserJourney', DEFAULT_SITE_BRAIN.coreUserJourney),
      founderAdminContext: str(
        'founderAdminContext',
        DEFAULT_SITE_BRAIN.founderAdminContext
      ),
      currentLaunchStage: str(
        'currentLaunchStage',
        DEFAULT_SITE_BRAIN.currentLaunchStage
      ),
      recommendationRules: str(
        'recommendationRules',
        DEFAULT_SITE_BRAIN.recommendationRules
      ),
      courseStrategy: str('courseStrategy', DEFAULT_SITE_BRAIN.courseStrategy),
      affiliateRules: str('affiliateRules', DEFAULT_SITE_BRAIN.affiliateRules),
      successMetrics: str('successMetrics', DEFAULT_SITE_BRAIN.successMetrics),
      knownRisks: str('knownRisks', DEFAULT_SITE_BRAIN.knownRisks),
      toneOfVoice: str('toneOfVoice', DEFAULT_SITE_BRAIN.toneOfVoice),
      mustNotDo: str('mustNotDo', DEFAULT_SITE_BRAIN.mustNotDo),
      adminPriorities: str('adminPriorities', DEFAULT_SITE_BRAIN.adminPriorities),
      isActive: true,
    })

    if (!saved.ok) {
      return NextResponse.json({ ok: false, error: saved.error }, { status: 500 })
    }

    return NextResponse.json({ ok: true, brain: saved.brain })
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'Failed to save Site Brain' },
      { status: 500 }
    )
  }
}
