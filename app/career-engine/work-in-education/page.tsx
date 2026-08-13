import WorkInEducationKnowledgeEngineClient from '@/components/career-engine/work-in-education/WorkInEducationKnowledgeEngineClient'
import WorkInEducationLegacyClient from '@/components/career-engine/work-in-education/WorkInEducationLegacyClient'
import { resolveWieKnowledgeEngineForRequest } from '@/lib/career-engine/work-in-education/resolve-flag-server'

export const dynamic = 'force-dynamic'

type SearchParams = Record<string, string | string[] | undefined>

/**
 * Work in My Education entry (Career Assistant pathway redirect target).
 *
 * Routing:
 * - Knowledge engine (Batch 4/5 wizard): when flag is ON
 *   (CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1=true, or development default,
 *   or admin override cookie via /api/.../test-mode).
 * - Legacy conversation: when flag is OFF / explicitly false, or ?legacy=1.
 *
 * Rollback: CAREER_KNOWLEDGE_ENGINE_WORK_IN_EDUCATION_V1=false
 */
export default async function WorkInEducationPage({
  searchParams,
}: {
  searchParams?: SearchParams
}) {
  const forceLegacy = String(searchParams?.legacy ?? '') === '1'
  const { enabled, isAdmin } = await resolveWieKnowledgeEngineForRequest({ searchParams })

  if (process.env.NODE_ENV === 'development') {
    console.info('[work-in-education] route', {
      knowledge_engine: enabled && !forceLegacy,
      force_legacy: forceLegacy,
      is_admin: isAdmin,
    })
  }

  if (!forceLegacy && enabled) {
    // Banner only for verified admins in development — never for normal users.
    const showAdminBanner = Boolean(isAdmin && process.env.NODE_ENV === 'development')
    return <WorkInEducationKnowledgeEngineClient showAdminBanner={showAdminBanner} />
  }

  return <WorkInEducationLegacyClient />
}
