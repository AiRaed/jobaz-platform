import type { CareerHubRouteCategory } from './types'

/** Career Hub explorer categories — one primary path per category */
export const CAREER_HUB_CATEGORIES: CareerHubRouteCategory[] = [
  {
    id: 'security',
    label: 'Security & Facilities',
    description: 'SIA licences, CCTV, concierge and site security roles.',
    icon: '🛡️',
    pathIds: ['security-facilities'],
  },
  {
    id: 'care',
    label: 'Care & Support',
    description: 'Care Certificate, support work and healthcare entry.',
    icon: '💙',
    pathIds: ['care-support'],
  },
  {
    id: 'translator',
    label: 'Translator / Interpreter',
    description: 'Language services, CIOL pathways and freelance interpreting.',
    icon: '🌐',
    pathIds: ['translator-interpreter'],
  },
  {
    id: 'construction',
    label: 'Construction & Skilled Trades',
    description: 'CSCS, trades, site work and skilled labour routes.',
    icon: '🚧',
    pathIds: ['construction-trades'],
  },
  {
    id: 'driving',
    label: 'Driving & Transport',
    description: 'Taxi, delivery, HGV and transport licences.',
    icon: '🚗',
    pathIds: ['driving-transport'],
  },
  {
    id: 'warehouse',
    label: 'Warehouse & Logistics',
    description: 'Forklift, picking, packing and logistics roles.',
    icon: '📦',
    pathIds: ['warehouse-logistics'],
  },
  {
    id: 'teaching',
    label: 'Teaching Assistant',
    description: 'Classroom support, safeguarding and QTS pathways.',
    icon: '📚',
    pathIds: ['teaching-support'],
  },
  {
    id: 'office',
    label: 'Office & Admin',
    description: 'Admin, reception, finance support and digital skills.',
    icon: '📋',
    pathIds: ['office-admin'],
  },
  {
    id: 'digital',
    label: 'Digital & AI-Adjacent',
    description: 'IT support, digital skills and tech starter routes.',
    icon: '💻',
    pathIds: ['digital-ai-beginner'],
  },
  {
    id: 'hospitality',
    label: 'Hospitality',
    description: 'Food hygiene, kitchen and front-of-house work.',
    icon: '🍽️',
    pathIds: ['hospitality-front'],
  },
  {
    id: 'self-employment',
    label: 'Self Employment',
    description: 'Freelance, small business and consultancy paths.',
    icon: '🚀',
    pathIds: ['self-employed-freelance'],
  },
  {
    id: 'electrician',
    label: 'Electrician',
    description: 'Electrical training, apprenticeships and trade routes.',
    icon: '⚡',
    pathIds: ['electrician'],
  },
  {
    id: 'plumbing',
    label: 'Plumbing / Handyman',
    description: 'Plumbing, handyman and property maintenance skills.',
    icon: '🔧',
    pathIds: ['plumbing-handyman'],
  },
  {
    id: 'cleaner',
    label: 'Cleaner',
    description: 'Cleaning roles, hygiene standards and quick entry work.',
    icon: '🧹',
    pathIds: ['cleaner'],
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    description: 'Facilities maintenance, repairs and site upkeep.',
    icon: '🏢',
    pathIds: ['maintenance-facilities'],
  },
]

/** Map UK transition route IDs to Career Hub path IDs */
export const UK_ROUTE_TO_PATH: Record<string, string> = {
  entry_security: 'security-facilities',
  entry_warehouse: 'warehouse-logistics',
  entry_construction: 'construction-trades',
  entry_care: 'care-support',
  entry_hospitality: 'hospitality-front',
  entry_office: 'office-admin',
  entry_no_course: 'warehouse-logistics',
  exp_chef: 'hospitality-front',
  exp_electrician: 'electrician',
  exp_plumber: 'plumbing-handyman',
  exp_driver: 'driving-transport',
  exp_construction: 'construction-trades',
  exp_transferable: 'office-admin',
  degree_healthcare: 'care-support',
  degree_education: 'teaching-support',
  degree_engineering: 'construction-trades',
  degree_accounting: 'office-admin',
  degree_it: 'digital-ai-beginner',
  degree_business: 'office-admin',
  degree_general: 'office-admin',
  biz_background: 'self-employed-freelance',
  biz_startup: 'self-employed-freelance',
}

export const COURSE_ICONS: Record<string, string> = {
  sia: '🛡️',
  cscs: '🚧',
  forklift: '🚜',
  care: '💙',
  food: '🍽️',
  taxi: '🚕',
  hgv: '🚛',
  first: '🩹',
  cctv: '📹',
  default: '🎓',
}

export function iconForCourse(name: string): string {
  const n = name.toLowerCase()
  if (/sia|security|door supervisor/.test(n)) return COURSE_ICONS.sia!
  if (/cscs|construction/.test(n)) return COURSE_ICONS.cscs!
  if (/forklift|warehouse|reach truck/.test(n)) return COURSE_ICONS.forklift!
  if (/care certificate|moving|handling|healthcare|oet|ielts|plab|osce/.test(n)) return COURSE_ICONS.care!
  if (/food|hygiene|haccp|chef/.test(n)) return COURSE_ICONS.food!
  if (/taxi|private hire/.test(n)) return COURSE_ICONS.taxi!
  if (/hgv|cpc|driver/.test(n)) return COURSE_ICONS.hgv!
  if (/first aid|cpr/.test(n)) return COURSE_ICONS.first!
  if (/cctv/.test(n)) return COURSE_ICONS.cctv!
  return COURSE_ICONS.default!
}

export function getCategoryById(categoryId: string): CareerHubRouteCategory | undefined {
  return CAREER_HUB_CATEGORIES.find((c) => c.id === categoryId)
}

export function getCategoryForPathId(pathId: string): CareerHubRouteCategory | undefined {
  return CAREER_HUB_CATEGORIES.find((c) => c.pathIds.includes(pathId))
}

export function getPrimaryPathIdForCategory(categoryId: string): string | null {
  return getCategoryById(categoryId)?.pathIds[0] ?? null
}

export function searchCategories(query: string): CareerHubRouteCategory[] {
  const q = query.trim().toLowerCase()
  if (!q) return CAREER_HUB_CATEGORIES
  return CAREER_HUB_CATEGORIES.filter((cat) => {
    if (cat.label.toLowerCase().includes(q)) return true
    if (cat.description.toLowerCase().includes(q)) return true
    if (cat.id.replace(/-/g, ' ').includes(q)) return true
    return cat.pathIds.some((pathId) => pathId.replace(/-/g, ' ').includes(q))
  })
}
