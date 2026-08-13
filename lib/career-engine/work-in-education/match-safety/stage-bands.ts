/**
 * Global stage bands for Work in My Education safety ranking.
 * Keyword-based — applies to every field’s stage labels/keys (not Civil-only).
 */

export type StageBand =
  | 'foundation'
  | 'apprentice'
  | 'graduate'
  | 'officer'
  | 'leadership'
  | 'specialist'
  | 'senior'
  | 'chartered'
  | 'academic'
  | 'unknown'

/** Higher = more advanced / later career. */
export const STAGE_BAND_RANK: Record<StageBand, number> = {
  foundation: 1,
  apprentice: 2,
  graduate: 3,
  officer: 3,
  leadership: 4,
  specialist: 4,
  senior: 5,
  chartered: 6,
  academic: 6,
  unknown: 3,
}

const BAND_PATTERNS: Array<{ band: StageBand; re: RegExp }> = [
  {
    band: 'academic',
    re: /\b(academic[_/\s-]*research|academic|lecturer|postdoctoral|post[\s-]?doc|phd|doctorate|fellow)\b/i,
  },
  {
    band: 'chartered',
    re: /\b(chartered|registered\s+(nurse|teacher|social\s+worker|practitioner|engineer)|licensed|licenced|regulated|professional\s+engineer)\b/i,
  },
  // Leadership stage (e.g. humanities "Leadership") — before senior so it does not
  // collapse into senior and wipe all immediate routes.
  {
    band: 'leadership',
    re: /\b(leadership)\b/i,
  },
  {
    band: 'senior',
    re: /\b(senior|principal|manager|management|head\b|director|consultant|experienced|executive)\b/i,
  },
  // professional_practitioner → officer-level practical band (not "specialist" wall)
  {
    band: 'officer',
    re: /\b(professional_practitioner|officer|coordinator|co-ordinator|administrator|admin\b)\b/i,
  },
  {
    band: 'specialist',
    re: /\b(specialist|practitioner)\b/i,
  },
  {
    band: 'graduate',
    re: /\b(graduate|junior|associate|entry[\s-]?level|early[\s-]?career)\b/i,
  },
  {
    band: 'apprentice',
    re: /\b(apprentice|trainee|technician)\b/i,
  },
  {
    band: 'foundation',
    re: /\b(foundation|support|assistant|labourer|laborer|helper|entry)\b/i,
  },
]

export function classifyStageBand(
  stageKey: string | null | undefined,
  stageLabel: string | null | undefined,
  roleTitle?: string | null
): StageBand {
  const hay = `${stageKey ?? ''} ${stageLabel ?? ''} ${roleTitle ?? ''}`.trim()
  if (!hay) return 'unknown'
  // Prefer stage key/label over role title for band (callers pass title separately when needed)
  for (const { band, re } of BAND_PATTERNS) {
    if (re.test(hay)) return band
  }
  return 'unknown'
}

/**
 * Stages where "best immediate" is allowed when the role is stage-aligned /
 * on the selected stage with practical titles.
 */
export function stageBandAllowsImmediate(band: StageBand): boolean {
  return (
    band === 'foundation' ||
    band === 'apprentice' ||
    band === 'graduate' ||
    band === 'officer' ||
    band === 'leadership' ||
    band === 'unknown'
  )
}
