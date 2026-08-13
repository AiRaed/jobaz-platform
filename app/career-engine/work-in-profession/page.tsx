import WorkInProfessionClient from '@/components/career-engine/work-in-profession/WorkInProfessionClient'
import { isAdminUser } from '@/lib/auth/adminEmails'
import { getOptionalAuthUserEmail } from '@/lib/career-engine/work-in-education/resolve-flag-server'

export const dynamic = 'force-dynamic'

/**
 * Work in My Profession entry (Career Assistant pathway redirect target).
 * Uses the in-memory profession library — separate from Work in My Education.
 */
export default async function WorkInProfessionPage() {
  const email = await getOptionalAuthUserEmail()
  const isAdmin = isAdminUser(email)
  const showAdminBanner = Boolean(isAdmin && process.env.NODE_ENV === 'development')

  return <WorkInProfessionClient showAdminBanner={showAdminBanner} />
}
