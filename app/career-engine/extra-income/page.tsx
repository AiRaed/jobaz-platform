import ExtraIncomeLibraryClient from '@/components/career-engine/extra-income/ExtraIncomeLibraryClient'
import { isAdminUser } from '@/lib/auth/adminEmails'
import { getOptionalAuthUserEmail } from '@/lib/career-engine/work-in-education/resolve-flag-server'

export const dynamic = 'force-dynamic'

/**
 * Looking for Extra Income — library MVP (category → option → result).
 * Replaces the longer chat questionnaire for this Career Assistant path.
 */
export default async function ExtraIncomePage() {
  const email = await getOptionalAuthUserEmail()
  const isAdmin = isAdminUser(email)
  const showAdminBanner = Boolean(isAdmin && process.env.NODE_ENV === 'development')

  return <ExtraIncomeLibraryClient showAdminBanner={showAdminBanner} />
}
