/** Phase 1 static circle discovery — not live communities */

export const PULSE_PHASE1_DISCOVERY_CIRCLES = [
  {
    id: 'newcastle-job-seekers',
    name: 'Newcastle Job Seekers',
    icon: '🏙️',
    blurb: 'Local jobseekers and UK career tips',
  },
  {
    id: 'warehouse-logistics',
    name: 'Warehouse & Logistics',
    icon: '📦',
    blurb: 'Warehouse, logistics and shift work routes',
  },
  {
    id: 'customer-service-careers',
    name: 'Customer Service Careers',
    icon: '💬',
    blurb: 'Customer service and office support paths',
  },
  {
    id: 'uk-drivers-network',
    name: 'UK Drivers Network',
    icon: '🚚',
    blurb: 'Delivery, driving and vehicle roles',
  },
] as const

/** Post types allowed on the public /feed in Phase 1 (plus safe legacy aliases). */
export const PULSE_PUBLIC_POST_TYPES = new Set([
  'discussion',
  'job_search_tip',
  'job_tip',
  'course_guide',
  'training',
  'opportunity',
  'success_story',
  'project',
  'business_idea',
  'small_business_idea',
  'question',
  'career_advice',
  'video',
  'announcement',
  'win',
  'general',
])
