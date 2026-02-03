/**
 * Action mapping for UK Career Assistant results.
 * Maps catalog_id to job finder and build-your-path URLs.
 */

export interface ActionMapEntry {
  jobFinderUrl: string
  buildPathUrl: string
}

export const ACTION_MAP: Record<string, ActionMapEntry> = {
  warehouse_logistics: {
    jobFinderUrl: "/jobs?query=warehouse%20operative",
    buildPathUrl: "/build-your-path/warehouse-logistics"
  },
  security_facilities: {
    jobFinderUrl: "/jobs?query=security%20sia",
    buildPathUrl: "/build-your-path/security-facilities"
  },
  cleaning: {
    jobFinderUrl: "/jobs?query=cleaner",
    buildPathUrl: "/build-your-path/cleaning"
  },
  hospitality_front: {
    jobFinderUrl: "/jobs?query=hospitality%20front%20of%20house",
    buildPathUrl: "/build-your-path/hospitality-front"
  },
  care_support: {
    jobFinderUrl: "/jobs?query=care%20support",
    buildPathUrl: "/build-your-path/care-support"
  },
  driving_transport: {
    jobFinderUrl: "/jobs?query=driver%20delivery",
    buildPathUrl: "/build-your-path/driving-transport"
  },
  maintenance_facilities: {
    jobFinderUrl: "/jobs?query=maintenance%20facilities",
    buildPathUrl: "/build-your-path/maintenance-facilities"
  },
  office_admin_support: {
    jobFinderUrl: "/jobs?query=admin%20assistant",
    buildPathUrl: "/build-your-path/office-admin"
  },
  digital_ai_adjacent: {
    jobFinderUrl: "/jobs?query=junior%20digital%20support",
    buildPathUrl: "/build-your-path/digital-ai-adjacent"
  },
  construction_trades: {
    jobFinderUrl: "/jobs?query=construction%20labour",
    buildPathUrl: "/build-your-path/construction-trades"
  }
}

/**
 * Get action URLs for a catalog_id with safe fallback.
 * Handles both kebab-case (direction_id format) and snake_case (ACTION_MAP keys).
 */
export function getActionUrls(catalogId: string, directionTitle?: string): ActionMapEntry {
  // Try exact match first
  let mapped = ACTION_MAP[catalogId]
  if (mapped) {
    return mapped
  }
  
  // Try converting kebab-case to snake_case (e.g., "warehouse-logistics" -> "warehouse_logistics")
  const snakeCaseId = catalogId.replace(/-/g, '_')
  mapped = ACTION_MAP[snakeCaseId]
  if (mapped) {
    return mapped
  }
  
  // Safe fallback: generate URLs from catalog_id or direction_title
  const fallbackQuery = directionTitle 
    ? encodeURIComponent(directionTitle)
    : encodeURIComponent(catalogId.replace(/-/g, ' '))
  
  return {
    jobFinderUrl: `/jobs?query=${fallbackQuery}`,
    buildPathUrl: `/build-your-path?tag=${encodeURIComponent(catalogId)}`
  }
}

