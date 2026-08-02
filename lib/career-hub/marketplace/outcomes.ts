import { getCareerPathById } from '@/lib/career-paths'
import { defaultSalaryForPath } from '@/lib/career-hub/marketplace/salary'
import type { MarketplaceCareerOutcome, MarketplaceSalaryInfo } from './types'

const ROUTE_OUTCOMES: Record<string, string[]> = {
  'security-facilities': ['Security Officer', 'Door Supervisor', 'Event Security', 'CCTV Operator'],
  'care-support': ['Support Worker', 'Healthcare Assistant', 'Care Home Assistant'],
  'warehouse-logistics': ['Warehouse Operative', 'Forklift Driver', 'Picker / Packer'],
  'driving-transport': ['Delivery Driver', 'Courier Driver', 'HGV Trainee'],
  'construction-trades': ['Construction Labourer', 'Site Operative', 'Skilled Trade Trainee'],
  'office-admin': ['Admin Assistant', 'Receptionist', 'Data Entry Clerk'],
  'digital-ai-beginner': ['IT Support Trainee', 'Digital Skills Assistant', 'Helpdesk Support'],
  'hospitality-front': ['Kitchen Porter', 'Front of House', 'Food Service Assistant'],
  'teaching-support': ['Teaching Assistant', 'Learning Support Assistant', 'Classroom Helper'],
  'electrician': ['Electrician Trainee', 'Electrical Improver', 'Maintenance Electrician'],
  'plumbing-handyman': ['Plumbing Trainee', 'Handyman', 'Property Maintenance'],
  cleaner: ['Commercial Cleaner', 'Domestic Cleaner', 'Facilities Cleaner'],
  'maintenance-facilities': ['Facilities Assistant', 'Maintenance Operative', 'Handyman'],
  'translator-interpreter': ['Community Interpreter', 'Language Support Worker', 'Freelance Translator'],
  'self-employed-freelance': ['Freelancer', 'Sole Trader', 'Consultant'],
}

export function getCareerOutcomesForPath(pathId: string): MarketplaceCareerOutcome[] {
  const preset = ROUTE_OUTCOMES[pathId]
  if (preset?.length) {
    return preset.map((title) => ({ title }))
  }

  const path = getCareerPathById(pathId)
  if (!path) return []

  const fromCerts = path.requirements.certificates.slice(0, 3).map((c) => ({ title: c }))
  if (fromCerts.length) return fromCerts

  return [{ title: path.title.replace(/\s*path$/i, '').trim() || path.title }]
}

export function getSalaryInfoForPath(pathId: string): MarketplaceSalaryInfo {
  return defaultSalaryForPath(pathId)
}
