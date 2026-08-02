import { getCareerPathById } from '@/lib/career-paths'
import type { MarketplaceSalaryInfo } from './types'

const SALARY_BY_PATH: Record<string, MarketplaceSalaryInfo> = {
  'security-facilities': {
    starting: '£22k–26k',
    experienced: '£30k+',
    note: 'SIA-licensed roles and event security can pay more',
    levels: [
      { label: 'Entry', range: '£20k–24k' },
      { label: 'Mid', range: '£24k–28k' },
      { label: 'Experienced', range: '£28k–35k+' },
    ],
  },
  'warehouse-logistics': {
    starting: '£22k–25k',
    experienced: '£30k+',
    levels: [
      { label: 'Entry', range: '£21k–24k' },
      { label: 'Mid', range: '£25k–28k' },
      { label: 'Advanced', range: '£30k–35k' },
    ],
  },
  'care-support': {
    starting: '£21k–24k',
    experienced: '£28k+',
    note: 'Shift premiums and NHS roles can pay more',
  },
  electrician: {
    starting: '£24k–28k',
    experienced: '£40k+',
    note: 'Self-employed electricians often earn more',
  },
}

export function defaultSalaryForPath(pathId: string): MarketplaceSalaryInfo {
  if (SALARY_BY_PATH[pathId]) return SALARY_BY_PATH[pathId]!

  const path = getCareerPathById(pathId)
  return {
    starting: '£20k–24k',
    experienced: '£28k+',
    note: path ? `Typical range for ${path.title.toLowerCase()} roles in the UK` : undefined,
  }
}
