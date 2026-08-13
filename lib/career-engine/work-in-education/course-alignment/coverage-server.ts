/**
 * Server helper: load Knowledge Library + Course Opportunities → coverage audit.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { loadLibraryFields, loadLibrarySpecialismsForField } from '../library-browse'
import { loadAllCourseOpportunities } from '@/lib/admin/opportunities/supabaseOpportunities'
import {
  buildWieCourseCoverageAudit,
  formatWieCoverageMarkdown,
  type WieCoverageAudit,
} from './coverage'
import { buildWieCourseAlignmentAudit, formatWieAuditMarkdown } from './audit'

export async function loadWieCourseCoverageAudit(
  supabase: SupabaseClient,
  opts?: { includeDrafts?: boolean }
): Promise<WieCoverageAudit> {
  const includeDrafts = opts?.includeDrafts ?? true
  const { fields } = await loadLibraryFields(supabase, { includeDrafts })

  const specialisms = []
  for (const field of fields) {
    const pack = await loadLibrarySpecialismsForField(supabase, field.id, { includeDrafts })
    specialisms.push(...pack.specialisms)
  }

  const opportunities = await loadAllCourseOpportunities(supabase)

  return buildWieCourseCoverageAudit({
    fields: fields.map((f) => ({ id: f.id, name: f.name, slug: f.slug })),
    specialisms: specialisms.map((s) => ({
      id: s.id,
      field_id: s.field_id,
      name: s.name,
      slug: s.slug,
    })),
    opportunities,
  })
}

export async function buildCombinedWieCourseAudits(supabase: SupabaseClient) {
  const opportunities = await loadAllCourseOpportunities(supabase)
  const alignment = buildWieCourseAlignmentAudit(opportunities)
  const coverage = await loadWieCourseCoverageAudit(supabase)
  return { alignment, coverage, opportunities }
}

export function formatCombinedWieAuditMarkdown(input: {
  alignment: ReturnType<typeof buildWieCourseAlignmentAudit>
  coverage: WieCoverageAudit
}): string {
  return [
    formatWieCoverageMarkdown(input.coverage),
    '',
    '---',
    '',
    formatWieAuditMarkdown(input.alignment),
  ].join('\n')
}
