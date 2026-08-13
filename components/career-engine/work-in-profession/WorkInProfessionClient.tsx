'use client'

/**
 * Work in My Profession Career Assistant journey.
 */

import { CaJourneyShell } from '@/components/career-engine/shared'
import { ProfessionPathWizard } from './ProfessionPathWizard'

type Props = {
  showAdminBanner?: boolean
}

export default function WorkInProfessionClient({ showAdminBanner }: Props) {
  return (
    <CaJourneyShell
      eyebrow="Career Engine · Work in My Profession"
      adminBanner={
        showAdminBanner
          ? 'Admin / local test mode — Work in My Profession library is active for this session.'
          : null
      }
    >
      <ProfessionPathWizard
        adminMode={Boolean(showAdminBanner)}
        sessionKey="jobaz.wip.library_path.ca.v1"
      />
    </CaJourneyShell>
  )
}
