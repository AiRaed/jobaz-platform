/**
 * Coverage audit: Career Knowledge Library fields/specialisms vs Course Opportunities.
 */

import type { CourseOpportunity } from '@/lib/admin/opportunities/types'
import { classifyOpportunityLike } from './classify'
import { titleMatchesEducationField } from './purpose-rules'
import { matchContamination, fieldContextBlob } from './contamination'
import { suggestCourseTypesForWieRoute, type SuggestedCourseType } from './suggested-course-types'
import type { WieCoursePurpose } from './types'
import { WIE_GOAL } from './types'

export type WieCoverageStatus =
  | 'covered'
  | 'partially_covered'
  | 'missing_course_coverage'
  | 'contaminated_only'

export type WieMatchTier =
  | 'exact_specialism'
  | 'field_level'
  | 'uk_workplace_bridge'
  | 'professional_pathway'
  | 'cpd_add_on'
  | 'no_match'

export type LibraryFieldRef = { id: string; name: string; slug?: string | null }
export type LibrarySpecialismRef = {
  id: string
  field_id: string
  name: string
  slug?: string | null
}
export type LibraryStageRef = {
  id: string
  stage_key?: string | null
  label: string
  specialism_id?: string | null
}

export type WieCourseHit = {
  opportunity_id: string
  title: string
  tier: WieMatchTier
  purpose: WieCoursePurpose
  has_provider_link: boolean
}

export type WieSpecialismCoverage = {
  field_id: string
  field_name: string
  specialism_id: string
  specialism_name: string
  status: WieCoverageStatus
  exact_specialism_count: number
  field_level_count: number
  bridge_count: number
  professional_count: number
  cpd_count: number
  contaminated_nearby_count: number
  hits: WieCourseHit[]
  suggested_course_types: SuggestedCourseType[]
}

export type WieFieldCoverage = {
  field_id: string
  field_name: string
  status: WieCoverageStatus
  specialism_count: number
  specialisms_covered: number
  specialisms_partial: number
  specialisms_missing: number
  specialisms_contaminated_only: number
  total_safe_hits: number
  suggested_course_types: SuggestedCourseType[]
}

export type WieCoverageAudit = {
  total_fields: number
  total_specialisms: number
  fields_covered: number
  fields_partially_covered: number
  fields_missing_course_coverage: number
  fields_contaminated_only: number
  specialisms_missing_courses: number
  high_priority_missing_course_types: string[]
  contamination_risks: number
  fields: WieFieldCoverage[]
  specialisms: WieSpecialismCoverage[]
  generated_at: string
}

function norm(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

function looseOverlap(a: string, b: string): boolean {
  const na = norm(a)
  const nb = norm(b)
  if (!na || !nb) return false
  if (na === nb || na.includes(nb) || nb.includes(na)) return true
  const tokens = na.split(/[^a-z0-9]+/).filter((t) => t.length > 3)
  return tokens.some((t) => nb.includes(t))
}

function hasProviderLink(opp: CourseOpportunity): boolean {
  if ((opp.linkedPublishedCourseReferralUrl || '').trim()) return true
  if ((opp.linkedPublishedCourseOfficialUrl || '').trim()) return true
  return opp.providers.some((p) => (p.referralUrl || p.officialUrl || '').trim())
}

function classifyHitTier(
  opp: CourseOpportunity,
  fieldName: string,
  specialismName: string
): { tiers: WieMatchTier[]; purpose: WieCoursePurpose; contaminated: boolean } {
  const alignment = classifyOpportunityLike(opp)
  const title = opp.courseName
  const fieldCtx = fieldContextBlob([fieldName, specialismName])
  const contamination = matchContamination(title, fieldCtx)

  if (contamination && !contamination.allowedForField) {
    return { tiers: ['no_match'], purpose: alignment.purpose, contaminated: true }
  }

  if (
    alignment.purpose === 'not_suitable_for_work_in_education' ||
    alignment.excluded_goal_paths.includes(WIE_GOAL)
  ) {
    return { tiers: ['no_match'], purpose: alignment.purpose, contaminated: alignment.contamination_risk }
  }

  const tiers: WieMatchTier[] = []
  const specs = (opp.specialisations ?? []).map(norm)
  const fields = (opp.educationFields ?? []).map(norm)

  if (specs.some((s) => looseOverlap(s, specialismName))) {
    tiers.push('exact_specialism')
  }

  const fieldHit =
    fields.some((f) => looseOverlap(f, fieldName)) ||
    titleMatchesEducationField(title, fieldName, specialismName)
  if (fieldHit) tiers.push('field_level')

  // Purpose tiers only count when the course is relevant to this field/specialism
  const relevant = tiers.length > 0
  if (relevant && alignment.purpose === 'uk_workplace_bridge') tiers.push('uk_workplace_bridge')
  if (relevant && alignment.purpose === 'professional_pathway') tiers.push('professional_pathway')
  if (relevant && alignment.purpose === 'cpd_add_on') tiers.push('cpd_add_on')

  // Global employability bridges (General / Other education tags) may support any field
  const generalBridge =
    alignment.purpose === 'uk_workplace_bridge' &&
    (fields.some((f) => /general|other|employability/.test(f)) ||
      /\b(uk\s*cv|interview\s*preparation|english\s*for\s*work)\b/i.test(title))
  if (generalBridge && !tiers.includes('uk_workplace_bridge')) {
    tiers.push('uk_workplace_bridge')
  }

  if (!tiers.length) tiers.push('no_match')
  return { tiers, purpose: alignment.purpose, contaminated: false }
}

function statusFromCounts(c: {
  exact: number
  field: number
  bridge: number
  professional: number
  cpd: number
  contaminated: number
  safe: number
}): WieCoverageStatus {
  if (c.safe === 0 && c.contaminated > 0) return 'contaminated_only'
  if (c.safe === 0) return 'missing_course_coverage'
  if (c.exact >= 2 || (c.exact >= 1 && c.field >= 1) || c.field >= 3) return 'covered'
  if (c.exact >= 1 || c.field >= 1 || c.professional >= 1) return 'partially_covered'
  if (c.bridge >= 1 || c.cpd >= 1) return 'partially_covered'
  return 'missing_course_coverage'
}

function rollupFieldStatus(specs: WieSpecialismCoverage[]): WieCoverageStatus {
  if (!specs.length) return 'missing_course_coverage'
  const covered = specs.filter((s) => s.status === 'covered').length
  const partial = specs.filter((s) => s.status === 'partially_covered').length
  const missing = specs.filter((s) => s.status === 'missing_course_coverage').length
  const contaminated = specs.filter((s) => s.status === 'contaminated_only').length
  if (covered >= Math.ceil(specs.length * 0.5) || (covered >= 1 && partial >= 1)) return 'covered'
  if (covered + partial > 0) return 'partially_covered'
  if (contaminated === specs.length) return 'contaminated_only'
  if (missing === specs.length) return 'missing_course_coverage'
  return 'partially_covered'
}

/**
 * Build full library ↔ course coverage audit (pure; no DB).
 */
export function buildWieCourseCoverageAudit(input: {
  fields: LibraryFieldRef[]
  specialisms: LibrarySpecialismRef[]
  opportunities: CourseOpportunity[]
}): WieCoverageAudit {
  const { fields, specialisms, opportunities } = input
  const specialismRows: WieSpecialismCoverage[] = []

  for (const field of fields) {
    const specs = specialisms.filter((s) => s.field_id === field.id)
    const targets = specs.length
      ? specs
      : [
          {
            id: `${field.id}__field`,
            field_id: field.id,
            name: field.name,
            slug: field.slug,
          },
        ]

    for (const spec of targets) {
      const hits: WieCourseHit[] = []
      let exact = 0
      let fieldLevel = 0
      let bridge = 0
      let professional = 0
      let cpd = 0
      let contaminated = 0

      for (const opp of opportunities) {
        const { tiers, purpose, contaminated: isContam } = classifyHitTier(
          opp,
          field.name,
          spec.name
        )
        if (isContam) {
          // Only count contamination against this route when the row is trying to attach
          // to WIE broadly (empty mapping + WIE goal) or is wrongly mapped to this field.
          const mappedHere =
            (opp.educationFields ?? []).some((f) => looseOverlap(f, field.name)) ||
            (opp.specialisations ?? []).some((s) => looseOverlap(s, spec.name))
          const floatingWie =
            (opp.goals ?? []).some((g) => g.goalKey === WIE_GOAL) &&
            (opp.educationFields ?? []).length === 0 &&
            (opp.specialisations ?? []).length === 0
          if (mappedHere || floatingWie) contaminated += 1
          continue
        }
        const primary = tiers.find((t) => t !== 'no_match')
        if (!primary) continue

        hits.push({
          opportunity_id: opp.id,
          title: opp.courseName,
          tier: primary,
          purpose,
          has_provider_link: hasProviderLink(opp),
        })
        if (tiers.includes('exact_specialism')) exact += 1
        if (tiers.includes('field_level')) fieldLevel += 1
        if (tiers.includes('uk_workplace_bridge')) bridge += 1
        if (tiers.includes('professional_pathway')) professional += 1
        if (tiers.includes('cpd_add_on')) cpd += 1
      }

      const safe = exact + fieldLevel + bridge + professional + cpd
      // Deduplicate safe count roughly by unique hits
      const uniqueSafe = hits.length
      const status = statusFromCounts({
        exact,
        field: fieldLevel,
        bridge,
        professional,
        cpd,
        contaminated,
        safe: uniqueSafe,
      })

      specialismRows.push({
        field_id: field.id,
        field_name: field.name,
        specialism_id: spec.id,
        specialism_name: spec.name,
        status,
        exact_specialism_count: exact,
        field_level_count: fieldLevel,
        bridge_count: bridge,
        professional_count: professional,
        cpd_count: cpd,
        contaminated_nearby_count: contaminated,
        hits: hits.slice(0, 12),
        suggested_course_types:
          status === 'missing_course_coverage' || status === 'contaminated_only' || status === 'partially_covered'
            ? suggestCourseTypesForWieRoute({
                fieldName: field.name,
                specialismName: spec.name,
                limit: status === 'partially_covered' ? 3 : 5,
              })
            : [],
      })
    }
  }

  const fieldRows: WieFieldCoverage[] = fields.map((field) => {
    const specs = specialismRows.filter((s) => s.field_id === field.id)
    const status = rollupFieldStatus(specs)
    return {
      field_id: field.id,
      field_name: field.name,
      status,
      specialism_count: specs.length,
      specialisms_covered: specs.filter((s) => s.status === 'covered').length,
      specialisms_partial: specs.filter((s) => s.status === 'partially_covered').length,
      specialisms_missing: specs.filter((s) => s.status === 'missing_course_coverage').length,
      specialisms_contaminated_only: specs.filter((s) => s.status === 'contaminated_only').length,
      total_safe_hits: specs.reduce((n, s) => n + s.hits.length, 0),
      suggested_course_types: suggestCourseTypesForWieRoute({
        fieldName: field.name,
        limit: 5,
      }),
    }
  })

  const missingSpecs = specialismRows.filter((s) => s.status === 'missing_course_coverage')
  const highPriorityTypes = new Set<string>()
  for (const s of missingSpecs) {
    for (const t of s.suggested_course_types.filter((x) => x.priority === 'high')) {
      highPriorityTypes.add(`${s.field_name} → ${t.title}`)
    }
  }

  let contaminationRisks = 0
  for (const opp of opportunities) {
    if (classifyOpportunityLike(opp).contamination_risk) contaminationRisks += 1
  }

  return {
    total_fields: fields.length,
    total_specialisms: specialisms.length,
    fields_covered: fieldRows.filter((f) => f.status === 'covered').length,
    fields_partially_covered: fieldRows.filter((f) => f.status === 'partially_covered').length,
    fields_missing_course_coverage: fieldRows.filter((f) => f.status === 'missing_course_coverage')
      .length,
    fields_contaminated_only: fieldRows.filter((f) => f.status === 'contaminated_only').length,
    specialisms_missing_courses: missingSpecs.length,
    high_priority_missing_course_types: [...highPriorityTypes].slice(0, 40),
    contamination_risks: contaminationRisks,
    fields: fieldRows,
    specialisms: specialismRows,
    generated_at: new Date().toISOString(),
  }
}

export function lookupWieCoverageForRoute(
  audit: WieCoverageAudit,
  fieldName: string,
  specialismName?: string | null
): {
  field: WieFieldCoverage | null
  specialism: WieSpecialismCoverage | null
  status: WieCoverageStatus
} {
  const field =
    audit.fields.find((f) => looseOverlap(f.field_name, fieldName)) ??
    audit.fields.find((f) => norm(f.field_name) === norm(fieldName)) ??
    null
  const specialism = specialismName
    ? audit.specialisms.find(
        (s) =>
          (!field || s.field_id === field.field_id) &&
          looseOverlap(s.specialism_name, specialismName)
      ) ?? null
    : null

  const status =
    specialism?.status ?? field?.status ?? ('missing_course_coverage' as WieCoverageStatus)

  return { field, specialism, status }
}

export function formatWieCoverageMarkdown(audit: WieCoverageAudit): string {
  const covered = audit.fields.filter((f) => f.status === 'covered')
  const partial = audit.fields.filter((f) => f.status === 'partially_covered')
  const missing = audit.fields.filter((f) => f.status === 'missing_course_coverage')
  const contaminated = audit.fields.filter((f) => f.status === 'contaminated_only')
  const missingSpecs = audit.specialisms.filter((s) => s.status === 'missing_course_coverage')

  const lines = [
    '# Work in My Education — Course Coverage Audit',
    '',
    `Generated: ${audit.generated_at}`,
    '',
    '## Summary',
    '',
    `- Total fields: **${audit.total_fields}**`,
    `- Fields covered: **${audit.fields_covered}**`,
    `- Fields partially covered: **${audit.fields_partially_covered}**`,
    `- Fields missing course coverage: **${audit.fields_missing_course_coverage}**`,
    `- Fields contaminated-only: **${audit.fields_contaminated_only}**`,
    `- Specialisms missing courses: **${audit.specialisms_missing_courses}**`,
    `- Contamination risks (opportunity rows): **${audit.contamination_risks}**`,
    '',
    '## Fields with good coverage',
    ...covered.map((f) => `- ${f.field_name} (${f.specialisms_covered}/${f.specialism_count} specialisms covered)`),
    '',
    '## Fields with partial coverage',
    ...partial.map(
      (f) =>
        `- ${f.field_name} — covered ${f.specialisms_covered}, partial ${f.specialisms_partial}, missing ${f.specialisms_missing}`
    ),
    '',
    '## Fields with no coverage',
    ...missing.map((f) => `- ${f.field_name}`),
    '',
    '## Contaminated-only fields',
    ...(contaminated.length ? contaminated.map((f) => `- ${f.field_name}`) : ['- None']),
    '',
    '## Specialisms missing courses (sample)',
    ...missingSpecs.slice(0, 40).map((s) => `- ${s.field_name} → ${s.specialism_name}`),
    '',
    '## Suggested missing course types (high priority)',
    ...audit.high_priority_missing_course_types.map((t) => `- ${t}`),
    '',
    '## Next admin actions',
    '',
    '1. Map education fields/specialisms on existing WIE-aligned opportunities where badges show gaps.',
    '2. Research providers for high-priority suggested course types (do not invent Apply Now links).',
    '3. Keep SIA/Forklift/Taxi/Warehouse excluded from WIE unless the education field clearly supports them.',
    '4. Prefer specialism matches; treat UK workplace bridges as optional/bridge, not primary.',
    '',
  ]
  return lines.join('\n')
}
