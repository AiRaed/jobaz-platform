import StartNewCareerLibraryClient from '@/components/career-engine/start-new-career/StartNewCareerLibraryClient'
import { isAdminUser } from '@/lib/auth/adminEmails'
import { getOptionalAuthUserEmail } from '@/lib/career-engine/work-in-education/resolve-flag-server'

export const dynamic = 'force-dynamic'

/**
 * Start New Career — library MVP (work type → route → training-first result).
 * Reuses Work in My Profession fields/specialisms/courses. Beginner default.
 */
export default async function StartNewCareerPage() {
  const email = await getOptionalAuthUserEmail()
  const isAdmin = isAdminUser(email)
  const showAdminBanner = Boolean(isAdmin && process.env.NODE_ENV === 'development')

  return <StartNewCareerLibraryClient showAdminBanner={showAdminBanner} />
}
