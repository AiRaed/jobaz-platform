export type {
  AdminAiTabId,
  AdminAiReportType,
  AdminAiPriority,
  MetricValue,
  AdminAiMetricsSnapshot,
  SiteBrainRules,
  SupervisorSessionRow,
  SupervisorSessionStatus,
  SupervisorQualityClassification,
  SupervisorPriorityHint,
  SupervisorSessionsResult,
  AffiliateProviderSummary,
  TechnicalCheck,
  HealthStatus,
  HealthModuleId,
  HealthCheckItem,
  HealthModule,
  SiteHealthSnapshot,
  SiteHealthScope,
} from './types'

export {
  MARKETING_ROUTES,
  MARKETING_AUDIENCES,
  MARKETING_CHANNELS,
  AFFILIATE_PRIORITY_ROUTES,
  DEFAULT_SITE_BRAIN,
} from './types'

export {
  getAdminAiMetrics,
  getSupervisorSessions,
  getAffiliateProviderSummary,
  getTechnicalChecks,
  getAdminReportCatalogueContext,
  markAssessmentIsTest,
  clearMarkedTestAnalytics,
} from './metrics'

export { generateSiteBrainAdvisor } from './siteBrainAdvisor'
export { getActiveSiteBrain, saveSiteBrain, formatSiteBrainForPrompt, mergeSiteBrainDefaults, buildActiveSiteBrainContextBlock, logSiteBrainLoaded, toSiteBrainLoadMeta } from './siteBrain'
export type { SiteBrainLoadMeta, SiteBrainEditable } from './siteBrain'
export { generateAdminAiReport, persistAdminAiReport } from './generate'
export {
  generateManagerReport,
  getLatestManagerReport,
  persistManagerReport,
} from './managerReport'
export { generateMarketingCopy } from './marketingReport'
export { generateAffiliateScoutReport } from './affiliateScout'
export { generateTechnicalReport } from './technicalReport'
export { generateSupervisorReport } from './supervisorReport'
export {
  runSiteHealthCheck,
  parseSiteHealthScope,
  summarizeSiteHealthForPrompt,
} from './siteHealth'
export { getAdminAiOverview } from './overview'
export {
  ADMIN_AI_PRIORITY_GUIDE,
  NOT_WIRED_YET_MEANING,
  getAffiliateRouteDefaultPriority,
} from './priorityGuide'
export {
  createAdminTask,
  listAdminTasks,
  listTasksForReport,
  updateAdminTaskStatus,
  extractRecommendedActions,
} from './tasks'
export {
  ADMIN_AI_DATE_RANGES,
  DEFAULT_ADMIN_AI_DATE_RANGE,
  parseAdminAiDateRange,
  rangeStartIso,
} from './dateRange'
export type { AdminAiDateRange } from './dateRange'
