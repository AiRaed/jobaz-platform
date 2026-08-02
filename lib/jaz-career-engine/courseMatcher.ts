/**
 * Match recommended course TYPES to Admin Course Inventory.
 * Relevance first — Ollama never chooses affiliate links.
 */

import type { JazInventoryCourse } from './courseInventoryAdapter'
import type {
  JazBrainReasoning,
  JazMatchedCourse,
  JazMissingAffiliateOpportunity,
  JazRecommendedCourseType,
} from './types'

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function tokens(s: string): string[] {
  return norm(s)
    .split(/\s+/)
    .filter((t) => t.length > 2)
}

/** Strong title overlap score 0–100 */
export function courseRelevanceScore(
  courseType: JazRecommendedCourseType,
  inventory: JazInventoryCourse,
  routeCategory: string
): number {
  const typeNorm = norm(courseType.title)
  const invNorm = norm(inventory.title)
  if (!typeNorm || !invNorm) return 0

  let score = 0
  if (invNorm.includes(typeNorm) || typeNorm.includes(invNorm)) score += 70
  else {
    const typeToks = tokens(courseType.title)
    const invToks = new Set(tokens(inventory.title))
    const overlap = typeToks.filter((t) => invToks.has(t)).length
    if (typeToks.length) score += Math.round((overlap / typeToks.length) * 55)
  }

  const route = norm(routeCategory)
  if (route && inventory.related_routes.some((r) => norm(r).includes(route) || route.includes(norm(r)))) {
    score += 15
  }
  if (route && norm(inventory.category).includes(route)) score += 10

  const purpose = norm(inventory.purpose || '')
  if (purpose && tokens(courseType.title).some((t) => purpose.includes(t))) score += 8

  // Keyword aliases
  const aliases: Array<[RegExp, RegExp]> = [
    [/sia|door\s*supervisor/, /sia|door\s*supervisor/],
    [/cscs|health\s*&\s*safety.*construction/, /cscs|construction/],
    [/care\s*certificate/, /care\s*certificate/],
    [/safeguard/, /safeguard/],
    [/manual\s*handling|moving\s*&\s*handling/, /manual\s*handling|moving/],
    [/forklift/, /forklift/],
    [/food\s*(safety|hygiene)/, /food\s*(safety|hygiene)/],
    [/microsoft\s*office|ms\s*office|excel/, /microsoft|office|excel/],
    [/tefl|teaching\s*english/, /tefl|teaching\s*english/],
    [/customer\s*service/, /customer\s*service/],
    [/first\s*aid/, /first\s*aid/],
    [/aat|bookkeeping|xero|quickbooks/, /aat|bookkeeping|xero|quickbooks|account/],
  ]
  for (const [a, b] of aliases) {
    if (a.test(typeNorm) && b.test(invNorm)) score += 25
  }

  return Math.min(100, score)
}

export type CourseMatchBundle = {
  matched: Array<{ course: JazInventoryCourse; type: JazRecommendedCourseType; score: number }>
  missing: JazMissingAffiliateOpportunity[]
}

export function matchCourseTypesToInventory(
  reasoning: JazBrainReasoning,
  inventory: JazInventoryCourse[],
  opts?: { minScore?: number; maxMatches?: number }
): CourseMatchBundle {
  const minScore = opts?.minScore ?? 40
  const maxMatches = opts?.maxMatches ?? 3
  const matched: CourseMatchBundle['matched'] = []
  const missing: JazMissingAffiliateOpportunity[] = []
  const usedIds = new Set<string>()

  const orderedTypes = [...reasoning.recommended_course_types].sort((a, b) => {
    const rank = { primary: 0, secondary: 1, optional: 2 }
    return rank[a.priority] - rank[b.priority]
  })

  for (const type of orderedTypes) {
    let best: { course: JazInventoryCourse; score: number } | null = null
    for (const course of inventory) {
      if (!course.is_published) continue
      if (usedIds.has(course.course_id)) continue
      const score = courseRelevanceScore(type, course, reasoning.route_category)
      if (score < minScore) continue
      if (!best || score > best.score) best = { course, score }
    }

    if (best) {
      usedIds.add(best.course.course_id)
      matched.push({ course: best.course, type, score: best.score })
    } else if (type.priority === 'primary' || type.priority === 'secondary') {
      missing.push({
        course_type: type.title,
        reason: `No published Admin course matched "${type.title}" for route ${reasoning.route_category}.`,
        suggested_category: reasoning.route_category,
        priority: type.priority === 'primary' ? 'high' : 'medium',
      })
    }

    if (matched.length >= maxMatches) break
  }

  return { matched, missing }
}

export function toMatchedJobazCourse(
  course: JazInventoryCourse,
  type: JazRecommendedCourseType,
  commercial: {
    commercial_status: JazMatchedCourse['commercial_status']
    primary_button: JazMatchedCourse['primary_button']
    referral_url: string | null
  }
): JazMatchedCourse {
  return {
    course_id: course.course_id,
    title: course.title,
    provider: course.provider,
    match_reason: type.reason || `Relevant to ${type.title}`,
    commercial_status: commercial.commercial_status,
    primary_button: commercial.primary_button,
    referral_url: commercial.referral_url,
    official_url: course.official_url,
    slug: course.slug ?? null,
  }
}
