/**
 * JobAZ AI Analytics — server-side queries for the internal dashboard.
 *
 * Future modules (profiles, personalization, heatmaps) should add new
 * getters here without changing page layout contracts.
 */

import { getAiAudienceSplit } from './audienceSplit'
import { getCareerPathStats } from './careerPaths'
import { getDropoffStats } from './dropoff'
import { getFunnelStats } from './funnel'
import { getAiAnalyticsOverview } from './overview'
import { getAiProfilesOverview } from './profiles'
import { getReadinessByPath } from './readinessByPath'
import { getRecentAiEvents } from './recentEvents'
import { getToolClickStats } from './toolClickStats'
import { getToolStats } from './tools'
import type { AiAnalyticsDashboardData } from './types'

export { getAiAnalyticsOverview } from './overview'
export { getAiProfilesOverview } from './profiles'
export { getCareerPathStats } from './careerPaths'
export { getToolStats } from './tools'
export { getFunnelStats } from './funnel'
export { getDropoffStats } from './dropoff'
export { getRecentAiEvents } from './recentEvents'

export type {
  AiAnalyticsOverview,
  AiProfilesOverview,
  AiAnalyticsDashboardData,
  AiAudienceSplit,
  CareerPathStatRow,
  DropoffStepStat,
  FunnelStatRow,
  ReadinessByPathRow,
  RecentAiEventRow,
  ToolClickStatRow,
  ToolStatRow,
} from './types'

export async function getAiAnalyticsDashboardData(): Promise<AiAnalyticsDashboardData> {
  const [
    overview,
    profiles,
    careerPaths,
    tools,
    toolClicks,
    audienceSplit,
    readinessByPath,
    funnel,
    dropoff,
    recentEvents,
  ] = await Promise.all([
    getAiAnalyticsOverview(),
    getAiProfilesOverview(),
    getCareerPathStats(),
    getToolStats(),
    getToolClickStats(),
    getAiAudienceSplit(),
    getReadinessByPath(),
    getFunnelStats(),
    getDropoffStats(),
    getRecentAiEvents(),
  ])

  return {
    overview,
    profiles,
    careerPaths,
    tools,
    toolClicks,
    audienceSplit,
    readinessByPath,
    funnel,
    dropoff,
    recentEvents,
  }
}
