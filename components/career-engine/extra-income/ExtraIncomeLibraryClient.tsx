'use client'

import { ExtraIncomePathWizard } from './ExtraIncomePathWizard'
import { CaJourneyShell } from '@/components/career-engine/shared'

type Props = {
  showAdminBanner?: boolean
}

export default function ExtraIncomeLibraryClient({ showAdminBanner = false }: Props) {
  return (
    <CaJourneyShell
      eyebrow="Career Engine · Looking for Extra Income"
      adminBanner={
        showAdminBanner
          ? 'Admin / local test mode — Looking for Extra Income library is active for this session.'
          : null
      }
    >
      <ExtraIncomePathWizard />
    </CaJourneyShell>
  )
}
