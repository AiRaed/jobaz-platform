/**
 * Limit clarification options for public UX (max 6–8 relevant choices).
 */

export type ClarificationOptionLike = {
  specialism_id: string
  name: string
  slug?: string
  score?: number
  reason?: string
}

const LAW_PRIORITY = [
  /commercial/i,
  /criminal/i,
  /family/i,
  /employment/i,
  /immigration|asylum/i,
  /public|administrative/i,
  /corporate/i,
  /property|conveyanc/i,
]

/**
 * Prefer high-score + known-priority names; hard-cap at `max`.
 * Does not invent specialisms — only filters returned options.
 */
export function limitClarificationOptions<T extends ClarificationOptionLike>(
  options: T[],
  max = 8
): T[] {
  if (options.length <= max) return options

  const scored = options.map((o, index) => {
    let boost = (o.score ?? 0) * 10
    for (let i = 0; i < LAW_PRIORITY.length; i++) {
      if (LAW_PRIORITY[i].test(o.name) || LAW_PRIORITY[i].test(o.slug ?? '')) {
        boost += 50 - i
        break
      }
    }
    return { o, boost, index }
  })

  scored.sort((a, b) => b.boost - a.boost || a.index - b.index)
  return scored.slice(0, max).map((s) => s.o)
}

export const NOT_SURE_CLARIFICATION_VALUE = '__not_sure__'
