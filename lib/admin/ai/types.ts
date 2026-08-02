/** JobAZ Admin AI — shared types */

export type AdminAiTabId =
  | 'manager'
  | 'marketing'
  | 'supervisor'
  | 'affiliate'
  | 'technical'
  | 'site-brain'

export type AdminAiReportType =
  | 'manager'
  | 'marketing'
  | 'supervisor'
  | 'affiliate'
  | 'technical'
  | 'site_brain_test'
  | 'site_brain_advisor'

export type AdminAiPriority = 'High' | 'Medium' | 'Low'

export type MetricValue = {
  label: string
  value: number | string | null
  available: boolean
  hint?: string
}

export type AdminAiMetricsSnapshot = {
  generatedAt: string
  range: 'today' | '7d' | '30d' | 'all'
  cards: MetricValue[]
  notes: string[]
  incompleteCount?: number
  excludedTestCount?: number
}

export type SiteBrainRules = {
  id?: string
  version: number
  /** Product mission */
  mission: string
  /** User value proposition */
  userValueProposition: string
  /** Business model */
  businessModel: string
  /** Core user journey */
  coreUserJourney: string
  /** Founder / admin context */
  founderAdminContext: string
  /** Current launch stage */
  currentLaunchStage: string
  /** Recommendation rules */
  recommendationRules: string
  /** Course strategy (routes) */
  courseStrategy: string
  /** Affiliate / provider rules */
  affiliateRules: string
  /** Success metrics to track */
  successMetrics: string
  /** Known risks */
  knownRisks: string
  /** Tone of voice */
  toneOfVoice: string
  /** Must not do */
  mustNotDo: string
  /** Admin priorities */
  adminPriorities: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export type SupervisorSessionStatus =
  | 'complete'
  | 'incomplete'
  | 'test'
  | 'old'
  | 'possible_mismatch'

/** Route-aware quality bucket for AI Supervisor */
export type SupervisorQualityClassification =
  | 'good'
  | 'needs_data'
  | 'needs_improvement'
  | 'risky'
  | 'possible_test_old'

export type SupervisorPriorityHint = 'high' | 'medium' | 'low'

export type SupervisorSessionRow = {
  id: string
  date: string
  goal: string
  route: string
  /** Anonymised short id for reports (no PII) */
  anonId: string
  currentTarget: string
  nextUpgrade: string
  status: SupervisorSessionStatus
  source: string
  savedPlan: boolean
  resultSaved: boolean
  recommendedCourse: string
  /** true/false when measurable; null = not wired yet */
  publishedCourseUsed: boolean | null
  applyClick: boolean | null
  isTest: boolean
  /** Short flag for table, e.g. "route vs target mismatch" */
  supervisorFlag: string | null
  hasCvAction: boolean | null
  workNowCount: number | null
  qualityClassification: SupervisorQualityClassification
  priorityHint: SupervisorPriorityHint
  isHistoricalOrTest: boolean
  isSecurityExtraIncomeRoute: boolean
  hasWorkNowStewardRole: boolean | null
  hasSiaDoorSupervisorUpgrade: boolean | null
}

export type SupervisorSessionsResult = {
  rows: SupervisorSessionRow[]
  available: boolean
  message?: string
  isTestColumnAvailable: boolean
}

export type AffiliateProviderSummary = {
  activeProviders: number
  pendingProviders: number
  publishedPartnerCourses: number
  coursesWithLiveReferral: number
  missingByRoute: Array<{
    route: string
    note: string
    missingProvider: boolean
    /** Default Scout priority — not every gap is High */
    suggestedPriority: AdminAiPriority
  }>
  available: boolean
  basisNote: string
}

export type TechnicalCheck = {
  id: string
  label: string
  count: number | null
  available: boolean
  hint?: string
}

/** Site health / Technical Intelligence */
export type HealthStatus = 'healthy' | 'warning' | 'error' | 'not_wired'

export type HealthModuleId =
  | 'ai_services'
  | 'interview_voice'
  | 'cv_documents'
  | 'career_assistant'
  | 'jobs'
  | 'courses_affiliate'
  | 'auth_user'
  | 'supabase_db'
  | 'tracking'
  | 'deployment'

export type HealthCheckItem = {
  id: string
  label: string
  status: HealthStatus
  detail: string
  /** Optional measured count when available (e.g. missing referral URLs) */
  count?: number | null
}

export type HealthModule = {
  id: HealthModuleId
  title: string
  status: HealthStatus
  explanation: string
  lastCheckedAt: string | null
  checks: HealthCheckItem[]
}

export type SiteHealthSnapshot = {
  checkedAt: string
  scope: string
  overallStatus: HealthStatus
  modules: HealthModule[]
  notes: string[]
}

export type SiteHealthScope =
  | 'basic'
  | 'ai'
  | 'courses'
  | 'cv'
  | 'jobs'
  | 'interview'
  | 'tracking'
  | 'all'

export const MARKETING_ROUTES = [
  'Extra Income',
  'Security',
  'Care',
  'Construction',
  'Warehouse',
  'English',
  'Digital',
  'Teaching Assistant',
  'Other',
] as const

export const MARKETING_AUDIENCES = [
  'Arabic speakers in UK',
  'new arrivals',
  'job seekers',
  'students',
  'career changers',
  'general UK users',
] as const

export const MARKETING_CHANNELS = [
  'Facebook',
  'TikTok',
  'Google Ads',
  'Email',
  'Landing Page',
] as const

export const AFFILIATE_PRIORITY_ROUTES = [
  'SIA / Security',
  'CSCS / Construction',
  'First Aid / Food Safety',
  'Care / Health & Social Care',
  'Forklift / Warehouse',
  'TEFL / Teaching Assistant',
  'IT / CompTIA / Digital skills',
  'AAT / Bookkeeping',
] as const

export const DEFAULT_SITE_BRAIN: Omit<SiteBrainRules, 'id' | 'createdAt' | 'updatedAt'> = {
  version: 1,
  mission:
    'JobAZ helps people in the UK find practical career routes by connecting their goals, background and availability to work-now options, training/licence recommendations, CV improvement actions and job/application steps.',
  userValueProposition:
    'JobAZ is not just a jobs site, course site or CV tool. It gives users a practical route:\nTell us your goal → get your UK career route → see work you can start now → find the training/licence you need next → improve your CV → apply with confidence.',
  businessModel:
    'JobAZ grows first through course/licence affiliate referrals and provider partnerships. The platform recommends useful and relevant training/licence routes when they genuinely help the user move forward. Later revenue may include job/opportunity listings, provider dashboards, premium tools and business partnerships.',
  coreUserJourney:
    'Homepage → Career Assistant → My Plan → Courses/Licences → Documents/CV → Jobs/Opportunities.',
  founderAdminContext:
    'JobAZ is currently managed by one solo founder. Admin AI should act like a small support team: product advisor, technical checker, marketing assistant, affiliate scout, user-flow reviewer and task organiser. Advice must be practical, prioritised and focused on helping the founder launch and improve the platform.',
  currentLaunchStage:
    'Pre-launch MVP. Current focus is to test admin pages, preserve the Knowledge Layer, stabilise the Career Assistant → My Plan → Apply Now journey, fix launch blockers only, then soft launch with real users.',
  recommendationRules:
    '- Recommend published affiliate courses first when relevant.\n- If no published course exists, recommend the course type only.\n- Recommendation-only courses must not show Apply Now.\n- Do not invent providers.\n- Do not invent course prices.\n- Do not guarantee jobs, income or visas.\n- My Plan is the centre of the user journey.\n- CV Builder should improve the CV for the active plan, not become a second career planner.',
  courseStrategy:
    'Prioritise high-intent UK routes that can lead to practical work or career progression:\nSIA/Security, CSCS/Construction, Care, First Aid/Food Safety, Forklift/Warehouse, TEFL/Teaching Assistant, Digital/IT, AAT/Bookkeeping.',
  affiliateRules:
    '- Only promote approved/active providers when a real referral or official URL exists.\n- Prefer courses with clear Apply Now tracking.\n- Flag missing providers by priority route for Affiliate Scout.',
  successMetrics:
    'Track saved career plans, Apply Now clicks, course interest, published course coverage, missing referral links, completed CVs, signups, return visits, AI tool usage and affiliate/provider readiness.',
  knownRisks:
    '- Overbuilding before launch.\n- AI giving generic advice.\n- Fake or missing provider links.\n- Career Assistant recommending unavailable courses as live.\n- CV Builder becoming a second career planner.\n- Admin reports becoming too generic.\n- Missing tracking for Apply Now and user journey conversion.\n- Not preserving JobAZ knowledge in a structured Knowledge Layer.',
  toneOfVoice:
    'Clear, practical, supportive, UK-focused, short sentences, action-based, honest, no hype, no false promises.',
  mustNotDo:
    '- Do not invent providers, prices, jobs or guarantees.\n- Do not recommend unpublished or fake courses as live partners.\n- Do not show Apply Now for recommendation-only courses.\n- Do not replace My Plan with a second career planner inside CV Builder.\n- Do not expose secrets or private user data.\n- Do not suggest big new features before launch unless they solve a launch blocker.',
  adminPriorities:
    '1) Fix launch blockers only.\n2) Preserve Knowledge Layer locally and in Supabase.\n3) Test Admin AI pages.\n4) Test Career Assistant → My Plan → Apply Now flow.\n5) Fix missing referral links.\n6) Fill priority provider gaps.\n7) Add email/notifications MVP if time allows.\n8) Soft launch and measure real user behaviour.',
  isActive: true,
}
