import type { JobSearchResult } from './types'

const STRONG_TITLE_TERMS = [
  'event steward',
  'matchday steward',
  'stadium steward',
  'crowd safety',
  'door supervisor',
  'event security',
  'security officer',
  'security steward',
  'steward',
]

const WEAK_TITLE_PATTERNS = [
  /^ads?\b/i,
  /\bsecurity\s+ads?\b/i,
  /^untitled$/i,
  /^n\/?a$/i,
  /^job$/i,
  /^vacancy$/i,
]

function meaningfulWordCount(title: string): number {
  return title
    .trim()
    .split(/[\s|/·\-–—,]+/)
    .map((w) => w.replace(/[^a-z0-9]/gi, ''))
    .filter((w) => w.length >= 2).length
}

function isLowQualityTitle(title: string): boolean {
  const t = title.trim()
  if (!t) return true
  if (WEAK_TITLE_PATTERNS.some((re) => re.test(t))) return true
  if (meaningfulWordCount(t) < 2) return true
  // Ultra-short junk like "security ads"
  if (t.length < 8 && !/steward|security|officer|guard/i.test(t)) return true
  return false
}

function relevanceScore(title: string, keyword: string): number {
  const t = title.toLowerCase()
  const k = keyword.toLowerCase().trim()
  let score = 0

  if (k && t.includes(k)) score += 40
  for (const term of STRONG_TITLE_TERMS) {
    if (t.includes(term)) score += term === 'steward' ? 12 : 22
  }
  if (/door\s*supervisor/i.test(t)) score += 18
  if (/matchday|stadium|event/i.test(t) && /steward|security/i.test(t)) score += 25

  // Prefer keyword tokens present in title
  for (const token of k.split(/\s+/).filter((w) => w.length > 2)) {
    if (t.includes(token)) score += 6
  }

  if (isLowQualityTitle(title)) score -= 80
  return score
}

/**
 * Prefer steward/event/security titles; hide/deprioritise junk like "security ads".
 */
export function rankAndFilterJobResults(
  results: JobSearchResult[],
  keyword: string
): Array<JobSearchResult & { bestMatch?: boolean }> {
  const scored = results
    .map((job) => {
      const title = (job.title || '').trim()
      const score = relevanceScore(title, keyword)
      return { job, score, hide: isLowQualityTitle(title) && score < 10 }
    })
    .filter((row) => !row.hide)
    .sort((a, b) => b.score - a.score)

  const planish =
    /steward|event security|door supervisor|crowd safety|matchday/i.test(keyword) ||
    scored.some((r) => r.score >= 40)

  return scored.map((row, index) => ({
    ...row.job,
    bestMatch: Boolean(planish && index < 3 && row.score >= 30),
  }))
}
