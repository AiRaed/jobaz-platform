/**
 * Post-AI and post-matching safety validation for JAZ Career Engine.
 */

import { isSiaCourseType, isFirstAidCourseType } from '@/lib/career-engine/extra-income/routeIntelligence'
import type {
  JazAnalyseResult,
  JazBrainReasoning,
  JazMatchedCourse,
  JazRecommendedCourseType,
} from './types'

const SECURITY_ROUTE_RE = /security|event\s*security|door\s*supervisor|steward/i
const ADMIN_OFFICE_RE = /admin|office|customer\s*service|remote\s*support|reception|digital\s*admin/i
const CARE_ROUTE_RE = /care|support\s*worker|health\s*care|nhs/i
const FOOD_HOSP_RE = /hospitality|food|kitchen|catering|barista/i
const TEACHING_ROUTE_RE = /teach|tutor|language|education|invigilat/i
const DELIVERY_ROLE_RE = /delivery\s*driver|amazon\s*flex|\buber\b|courier|taxi\s*driver/i

function titlesEqual(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

function isTeachingOrLanguagesRoute(routeCategory: string, routeTitle: string): boolean {
  return (
    /teaching|languages|tutor/i.test(routeCategory) ||
    TEACHING_ROUTE_RE.test(routeTitle)
  )
}

function rolesNearlyEqual(a: string, b: string): boolean {
  const na = a.trim().toLowerCase().replace(/\s+/g, ' ')
  const nb = b.trim().toLowerCase().replace(/\s+/g, ' ')
  if (!na || !nb) return false
  if (na === nb) return true
  // Online Tutoring ↔ Online Tutor
  const strip = (s: string) => s.replace(/ing$/, '').replace(/\s+/g, ' ').trim()
  if (strip(na) === strip(nb)) return true
  return false
}

export function routeAllowsSia(routeCategory: string, routeTitle: string, currentFocus: string): boolean {
  const blob = `${routeCategory} ${routeTitle} ${currentFocus}`
  return SECURITY_ROUTE_RE.test(blob)
}

export function routeAllowsFirstAidPrimary(routeCategory: string, routeTitle: string): boolean {
  const blob = `${routeCategory} ${routeTitle}`
  return CARE_ROUTE_RE.test(blob) || SECURITY_ROUTE_RE.test(blob)
}

export function routeAllowsMsOfficePrimary(routeCategory: string, routeTitle: string): boolean {
  if (isTeachingOrLanguagesRoute(routeCategory, routeTitle)) return false
  const blob = `${routeCategory} ${routeTitle}`
  return ADMIN_OFFICE_RE.test(blob)
}

export function sanitizeCourseTypes(
  types: JazRecommendedCourseType[],
  routeCategory: string,
  routeTitle: string
): { types: JazRecommendedCourseType[]; notes: string[] } {
  const notes: string[] = []
  const allowSia = routeAllowsSia(routeCategory, routeTitle, '')
  const allowFaPrimary = routeAllowsFirstAidPrimary(routeCategory, routeTitle)
  const allowOfficePrimary = routeAllowsMsOfficePrimary(routeCategory, routeTitle)

  const out: JazRecommendedCourseType[] = []
  for (const t of types) {
    if (isSiaCourseType(t.title) && !allowSia) {
      notes.push(`Excluded SIA recommendation — route is not security/event security.`)
      continue
    }
    if (isFirstAidCourseType(t.title) && t.priority === 'primary' && !allowFaPrimary) {
      notes.push(`Downgraded First Aid to optional — not primary for this route.`)
      out.push({ ...t, priority: 'optional', pathway_stage: 'optional' })
      continue
    }
    if (/microsoft\s*office|ms\s*office|\bexcel\b/i.test(t.title) && t.priority === 'primary' && !allowOfficePrimary) {
      notes.push(`Downgraded Microsoft Office to secondary — not primary for this route.`)
      out.push({ ...t, priority: 'secondary' })
      continue
    }
    if (/food\s*(safety|hygiene)/i.test(t.title) && !FOOD_HOSP_RE.test(`${routeCategory} ${routeTitle}`)) {
      // Keep only as optional unless hospitality/food retail
      if (t.priority === 'primary') {
        notes.push(`Downgraded Food Safety — route is not clearly food/hospitality.`)
        out.push({ ...t, priority: 'optional', pathway_stage: 'optional' })
        continue
      }
    }
    out.push(t)
  }

  return { types: out.slice(0, 5), notes }
}

export function sanitizeMatchedCourses(
  matched: JazMatchedCourse[],
  routeCategory: string,
  routeTitle: string
): { matched: JazMatchedCourse[]; notes: string[] } {
  const notes: string[] = []
  const allowSia = routeAllowsSia(routeCategory, routeTitle, '')
  const filtered = matched.filter((m) => {
    if (isSiaCourseType(m.title) && !allowSia) {
      notes.push(`Removed irrelevant SIA course card: ${m.title}`)
      return false
    }
    if (m.primary_button === 'Apply Now' && !m.referral_url) {
      notes.push(`Blocked Apply Now without referral URL: ${m.title}`)
      return true // keep but commercial matcher should have fixed; still keep
    }
    return true
  })

  return { matched: filtered.slice(0, 3), notes }
}

export function applySafetyToReasoning(reasoning: JazBrainReasoning): {
  reasoning: JazBrainReasoning
  notes: string[]
} {
  const notes: string[] = []
  let { current_focus, next_upgrade } = reasoning
  const teachingRoute = isTeachingOrLanguagesRoute(reasoning.route_category, reasoning.route_title)

  let work_now_roles = reasoning.work_now_roles.map((r) => ({
    ...r,
    pay_range: /guaranteed|exactly|will earn/i.test(r.pay_range)
      ? 'Varies by employer and hours'
      : r.pay_range,
  }))

  if (teachingRoute) {
    const before = work_now_roles.length
    work_now_roles = work_now_roles.filter((r) => !DELIVERY_ROLE_RE.test(r.title))
    if (work_now_roles.length < before) {
      notes.push('Removed Delivery Driver / driving roles from teaching/tutoring work_now.')
    }
  }

  const firstWorkNow = work_now_roles[0]?.title || current_focus
  if (!current_focus && firstWorkNow) current_focus = firstWorkNow

  if (
    titlesEqual(current_focus, next_upgrade) ||
    rolesNearlyEqual(current_focus, next_upgrade) ||
    rolesNearlyEqual(firstWorkNow, next_upgrade)
  ) {
    const primary = reasoning.recommended_course_types.find(
      (t) =>
        t.priority === 'primary' &&
        !rolesNearlyEqual(t.title, current_focus) &&
        !/microsoft\s*office/i.test(t.title)
    )
    const secondary = reasoning.recommended_course_types.find(
      (t) => !rolesNearlyEqual(t.title, current_focus) && !/microsoft\s*office/i.test(t.title)
    )
    next_upgrade =
      primary?.title ||
      secondary?.title ||
      (teachingRoute ? 'TEFL / Teaching English Online' : `${current_focus} skills upgrade`)
    notes.push('next_upgrade must not duplicate current_focus / first work_now role.')
  }

  if (isSiaCourseType(next_upgrade) && !routeAllowsSia(reasoning.route_category, reasoning.route_title, current_focus)) {
    const alt =
      reasoning.recommended_course_types.find((t) => !isSiaCourseType(t.title))?.title ||
      'Relevant short course'
    next_upgrade = alt
    notes.push('Blocked SIA as next_upgrade for non-security route.')
  }

  let { types, notes: typeNotes } = sanitizeCourseTypes(
    reasoning.recommended_course_types,
    reasoning.route_category,
    reasoning.route_title
  )
  notes.push(...typeNotes)

  if (teachingRoute) {
    const hasBetterPrimary = types.some(
      (t) =>
        t.priority === 'primary' &&
        /tefl|teaching\s*assistant|safeguard|english\s*for\s*work|digital/i.test(t.title)
    )
    types = types.map((t) => {
      if (/microsoft\s*office|ms\s*office/i.test(t.title) && t.priority === 'primary') {
        notes.push('Teaching/tutoring: Microsoft Office demoted from primary.')
        return { ...t, priority: 'optional' as const, pathway_stage: 'optional' as const }
      }
      return t
    })
    if (!hasBetterPrimary && !types.some((t) => t.priority === 'primary')) {
      types = [
        {
          title: 'TEFL / Teaching English Online',
          priority: 'primary',
          reason: 'Practical upgrade for online tutoring routes.',
          related_roles: ['Online Tutor', 'Language Tutor'],
          related_skills: ['teaching'],
          pathway_stage: 'upgrade',
        },
        ...types,
      ]
      notes.push('Injected TEFL as primary for teaching/tutoring route.')
    }
    if (/microsoft\s*office/i.test(next_upgrade)) {
      next_upgrade =
        types.find((t) => t.priority === 'primary')?.title || 'TEFL / Teaching English Online'
      notes.push('Teaching/tutoring: next_upgrade was Microsoft Office — replaced with tutoring upgrade.')
    }
  }

  let readiness = reasoning.readiness
  if ((reasoning.confidence ?? 1) < 0.4) {
    readiness = Math.min(readiness, 50)
    notes.push('Low confidence — showing safer broad guidance.')
  }

  return {
    reasoning: {
      ...reasoning,
      current_focus,
      next_upgrade,
      readiness,
      recommended_course_types: types.slice(0, 5),
      work_now_roles,
    },
    notes,
  }
}

export function finalizeSafetyOnResult(result: JazAnalyseResult): JazAnalyseResult {
  const notes = [...result.safety_notes]
  const { matched, notes: matchNotes } = sanitizeMatchedCourses(
    result.matched_jobaz_courses,
    result.route_category,
    result.route_title
  )
  notes.push(...matchNotes)

  if (titlesEqual(result.current_focus, result.next_upgrade)) {
    notes.push('Final check: next_upgrade still matched current_focus — adjusted.')
  }

  // Never guarantee employment in copy
  const scrub = (s: string) =>
    s
      .replace(/\bguaranteed\s+(job|employment|income|salary)\b/gi, 'possible')
      .replace(/\byou will (definitely|certainly) (get|earn)\b/gi, 'you may')

  return {
    ...result,
    matched_jobaz_courses: matched.slice(0, 3),
    why_this_route_fits: scrub(result.why_this_route_fits),
    cv_focus: scrub(result.cv_focus),
    safety_notes: [...new Set(notes)],
  }
}
