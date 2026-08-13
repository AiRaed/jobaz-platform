'use client'

import { StartNewCareerPathWizard } from './StartNewCareerPathWizard'
import { CaJourneyShell } from '@/components/career-engine/shared'

type Props = {
  showAdminBanner?: boolean
}

export default function StartNewCareerLibraryClient({ showAdminBanner = false }: Props) {
  return (
    <CaJourneyShell
      eyebrow="Career Engine · Start a New Career"
      adminBanner={
        showAdminBanner
          ? 'Admin / local test mode — Start New Career library is active for this session.'
          : null
      }
    >
      <StartNewCareerPathWizard />
    </CaJourneyShell>
  )
}
