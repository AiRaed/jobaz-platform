/**
 * Central JAZ Career Brain system prompt — keep ultra-short for local Ollama CPU speed.
 */

export function buildJazCareerBrainSystemPrompt(): string {
  return `JAZ UK career adviser. Reply with ONE JSON object only.
Keys: route_title, route_category (security|retail|customer_service|languages|tech|care|warehouse|construction|hospitality|driving|teaching|admin|general), user_goal, why_this_route_fits, current_focus, next_upgrade (must differ from current_focus), readiness (0-100), work_now_roles (max 2 objects: title,why,pay_range,job_search_terms), recommended_course_types (max 2 objects: title,priority primary|secondary|optional,reason,related_roles,related_skills,pathway_stage start|upgrade|licence|optional|growth), cv_focus, first_action_plan (max 3 objects: step,why,action_type job_search|course|cv|profile|research), confidence (0-1).
Rules: course TYPES only (no providers/URLs). No SIA unless user wants security. Short strings.`
}

export function buildJazCareerBrainUserPrompt(input: {
  goal: string
  skills: string[]
  education: string
  experience: string
  availability: string
  language_level: string
  has_driving_licence: boolean | null
  work_mode_preference: string
  answers: Record<string, unknown>
  preferences: Record<string, unknown>
}): string {
  // Compact answers — drop empty values to shrink prompt tokens.
  const answers: Record<string, unknown> = {}
  for (const [k, v] of Object.entries(input.answers || {})) {
    if (v === undefined || v === null || v === '') continue
    answers[k] = typeof v === 'string' ? v.slice(0, 120) : v
  }

  return `Profile JSON only.
goal=${input.goal}; skills=${input.skills.slice(0, 8).join('|') || 'n/a'}; education=${(input.education || 'n/a').slice(0, 80)}; experience=${(input.experience || 'n/a').slice(0, 80)}; availability=${input.availability || 'n/a'}; language=${input.language_level || 'n/a'}; driving=${input.has_driving_licence === null ? '?' : input.has_driving_licence}; mode=${input.work_mode_preference}; answers=${JSON.stringify(answers)}`
}
