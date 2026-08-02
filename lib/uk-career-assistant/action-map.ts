/**
 * Action mapping for UK Career Assistant results.
 * Maps catalog_id to job finder and Career Hub URLs.
 */

export interface ActionMapEntry {
  jobFinderUrl: string
  buildPathUrl: string
}

const hubRoute = (pathId: string, category?: string) =>
  category
    ? `/career-hub?route=${pathId}&category=${category}`
    : `/career-hub?route=${pathId}`

export const ACTION_MAP: Record<string, ActionMapEntry> = {
  warehouse_logistics: {
    jobFinderUrl: '/job-finder?query=warehouse%20operative',
    buildPathUrl: hubRoute('warehouse-logistics', 'warehouse'),
  },
  security_facilities: {
    jobFinderUrl: '/job-finder?query=security%20sia',
    buildPathUrl: hubRoute('security-facilities', 'security'),
  },
  cleaning: {
    jobFinderUrl: '/job-finder?query=cleaner',
    buildPathUrl: hubRoute('cleaner', 'cleaner'),
  },
  hospitality_front: {
    jobFinderUrl: '/job-finder?query=hospitality%20front%20of%20house',
    buildPathUrl: hubRoute('hospitality-front', 'hospitality'),
  },
  care_support: {
    jobFinderUrl: '/job-finder?query=care%20support',
    buildPathUrl: hubRoute('care-support', 'care'),
  },
  driving_transport: {
    jobFinderUrl: '/job-finder?query=driver%20delivery',
    buildPathUrl: hubRoute('driving-transport', 'driving'),
  },
  maintenance_facilities: {
    jobFinderUrl: '/job-finder?query=maintenance%20facilities',
    buildPathUrl: hubRoute('maintenance-facilities', 'maintenance'),
  },
  office_admin_support: {
    jobFinderUrl: '/job-finder?query=admin%20assistant',
    buildPathUrl: hubRoute('office-admin', 'office'),
  },
  digital_ai_adjacent: {
    jobFinderUrl: '/job-finder?query=junior%20digital%20support',
    buildPathUrl: hubRoute('digital-ai-beginner', 'digital'),
  },
  construction_trades: {
    jobFinderUrl: '/job-finder?query=construction%20labour',
    buildPathUrl: hubRoute('construction-trades', 'construction'),
  },
}

/**
 * Get action URLs for a catalog_id with safe fallback.
 * Handles both kebab-case (direction_id format) and snake_case (ACTION_MAP keys).
 */
export function getActionUrls(catalogId: string, directionTitle?: string): ActionMapEntry {
  let mapped = ACTION_MAP[catalogId]
  if (mapped) {
    return mapped
  }

  const snakeCaseId = catalogId.replace(/-/g, '_')
  mapped = ACTION_MAP[snakeCaseId]
  if (mapped) {
    return mapped
  }

  const fallbackQuery = directionTitle
    ? encodeURIComponent(directionTitle)
    : encodeURIComponent(catalogId.replace(/-/g, ' '))

  return {
    jobFinderUrl: `/job-finder?query=${fallbackQuery}`,
    buildPathUrl: `/career-hub?tag=${encodeURIComponent(catalogId)}`,
  }
}
