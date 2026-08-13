/**
 * Audit summary for Work in My Education course alignment.
 */

import { classifyOpportunityLike } from './classify'
import type { WieAlignmentAuditSummary } from './types'
import type { CourseOpportunity } from '@/lib/admin/opportunities/types'
import { needsProvider, isHighPriority } from '@/lib/admin/opportunities/query'

export function buildWieCourseAlignmentAudit(
  opportunities: CourseOpportunity[]
): WieAlignmentAuditSummary {
  let aligned = 0
  let missingField = 0
  let missingSpec = 0
  let missingStage = 0
  let excluded = 0
  let contamination = 0
  let missingProvider = 0

  const sampleExcluded: string[] = []
  const sampleContamination: string[] = []
  const sampleMissingProvider: string[] = []

  for (const opp of opportunities) {
    const a = classifyOpportunityLike(opp)

    if (a.admin_badges.includes('work_in_education_aligned')) aligned += 1
    if (a.admin_badges.includes('needs_education_field_mapping')) missingField += 1
    if (a.admin_badges.includes('needs_specialism_mapping')) missingSpec += 1
    if (a.admin_badges.includes('needs_stage_mapping')) missingStage += 1
    if (a.admin_badges.includes('not_for_work_in_education')) {
      excluded += 1
      if (sampleExcluded.length < 12) sampleExcluded.push(opp.courseName)
    }
    if (a.contamination_risk) {
      contamination += 1
      if (sampleContamination.length < 12) sampleContamination.push(opp.courseName)
    }

    const wieRelevant =
      a.admin_badges.includes('work_in_education_aligned') ||
      (opp.goals ?? []).some((g) => g.goalKey === 'work_in_education')

    if (wieRelevant && isHighPriority(opp) && needsProvider(opp)) {
      missingProvider += 1
      if (sampleMissingProvider.length < 12) sampleMissingProvider.push(opp.courseName)
    }
  }

  return {
    total_reviewed: opportunities.length,
    work_in_education_aligned: aligned,
    missing_education_field: missingField,
    missing_specialism: missingSpec,
    missing_stage: missingStage,
    excluded_from_work_in_education: excluded,
    contamination_risks: contamination,
    high_priority_missing_providers: missingProvider,
    sample_excluded: sampleExcluded,
    sample_contamination: sampleContamination,
    sample_missing_provider: sampleMissingProvider,
  }
}

export function formatWieAuditMarkdown(summary: WieAlignmentAuditSummary): string {
  return [
    '# Work in My Education — Course Alignment Audit',
    '',
    `- Total opportunities reviewed: **${summary.total_reviewed}**`,
    `- Work in Education aligned: **${summary.work_in_education_aligned}**`,
    `- Missing education field: **${summary.missing_education_field}**`,
    `- Missing specialism: **${summary.missing_specialism}**`,
    `- Missing stage mapping: **${summary.missing_stage}**`,
    `- Excluded from Work in Education: **${summary.excluded_from_work_in_education}**`,
    `- Contamination risks: **${summary.contamination_risks}**`,
    `- High-priority missing providers (WIE-relevant): **${summary.high_priority_missing_providers}**`,
    '',
    '## Sample excluded',
    ...summary.sample_excluded.map((t) => `- ${t}`),
    '',
    '## Sample contamination risks',
    ...summary.sample_contamination.map((t) => `- ${t}`),
    '',
    '## Sample missing providers',
    ...summary.sample_missing_provider.map((t) => `- ${t}`),
    '',
  ].join('\n')
}
