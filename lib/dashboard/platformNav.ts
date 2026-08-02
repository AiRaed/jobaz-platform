export type DashboardTabId =
  | 'overview'
  | 'jobs'
  | 'training'
  | 'career-path'
  | 'documents'
  | 'interview'
  | 'profile'
  | 'opportunities'
  | 'feed'
  | 'messages'

/** Visible platform nav pills — Phase 1 workspace order. */
export const DASHBOARD_TABS: {
  id: DashboardTabId
  label: string
  shortLabel: string
}[] = [
  { id: 'profile', label: 'Career Identity', shortLabel: 'Identity' },
  { id: 'overview', label: 'My Plan', shortLabel: 'Plan' },
  { id: 'documents', label: 'Documents', shortLabel: 'Docs' },
  { id: 'jobs', label: 'Saved Jobs', shortLabel: 'Jobs' },
  { id: 'opportunities', label: 'Saved Opportunities', shortLabel: 'Opps' },
  { id: 'feed', label: 'Pulse Activity', shortLabel: 'Pulse' },
  { id: 'messages', label: 'Relay', shortLabel: 'Relay' },
]

const ALL_TAB_IDS: DashboardTabId[] = [
  'overview',
  'jobs',
  'training',
  'career-path',
  'documents',
  'interview',
  'profile',
  'opportunities',
  'feed',
  'messages',
]

export function parseDashboardTab(raw: string | null): DashboardTabId {
  if (raw && ALL_TAB_IDS.includes(raw as DashboardTabId)) return raw as DashboardTabId
  return 'overview'
}
