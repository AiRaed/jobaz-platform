/**
 * Apply JAZ safety / SIA filters to Extra Income course title lists.
 * Phase 3 bridge — full Extra Income unification can call analyseCareerGoal later.
 */

import { routeAllowsSia } from './safetyRules'
import { isSiaCourseType, isFirstAidCourseType } from '@/lib/career-engine/extra-income/routeIntelligence'

export function filterExtraIncomeCourseTitles(opts: {
  routeId: string
  routeTitle: string
  titles: string[]
  allowSia: boolean
  allowFirstAidPrimary?: boolean
}): { titles: string[]; notes: string[] } {
  const notes: string[] = []
  const allowSia =
    opts.allowSia || routeAllowsSia(opts.routeId, opts.routeTitle, opts.routeTitle)
  const out: string[] = []

  for (const title of opts.titles) {
    if (isSiaCourseType(title) && !allowSia) {
      notes.push(`Excluded SIA from Extra Income list: ${title}`)
      continue
    }
    if (
      isFirstAidCourseType(title) &&
      opts.allowFirstAidPrimary === false &&
      out.length === 0
    ) {
      // Don't block entirely — just don't let it sit alone as only item preference
      notes.push(`First Aid kept as non-primary add-on: ${title}`)
    }
    out.push(title)
  }

  return { titles: out, notes }
}
