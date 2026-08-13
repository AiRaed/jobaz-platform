'use client'

import type { RoleEligibilityResult } from '@/lib/career-engine/work-in-education'
import { matchSummaryFromEligibility } from '@/lib/career-engine/pathway-knowledge'
import { CareerPathwayCard } from '@/components/career-engine/pathway'

type Props = {
  role: RoleEligibilityResult
}

/** Admin/internal result card — now a Career Knowledge Engine pathway gateway. */
export function RecommendationCard({ role }: Props) {
  return <CareerPathwayCard match={matchSummaryFromEligibility(role)} />
}
