import type { AdminAiPriority } from './types'

export type RecommendedActionItem = {
  /** Stable key for dedupe within a report */
  key: string
  title: string
  priority: AdminAiPriority
  section: 'High' | 'Medium' | 'Low' | 'General'
}

export function normalizePriority(value: unknown): AdminAiPriority {
  const v = String(value || '').toLowerCase()
  if (v === 'high') return 'High'
  if (v === 'low') return 'Low'
  return 'Medium'
}

function actionKey(title: string, index: number): string {
  const normalized = title
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 160)
  return `${index}:${normalized}`
}

/** Pull numbered recommended actions from report markdown for quick-save buttons. */
export function extractRecommendedActions(markdown: string): string[] {
  return extractRecommendedActionItems(markdown).map((a) => a.title)
}

/**
 * Extract recommended actions with priority inferred from
 * ### High priority / ### Medium priority / ### Low priority subsections.
 */
export function extractRecommendedActionItems(markdown: string): RecommendedActionItem[] {
  if (!markdown) return []

  const section = markdown.match(
    /##\s*(?:Recommended actions|Actions to create)\s*([\s\S]*?)(?=\n##\s(?!#)|$)/i
  )
  if (!section?.[1]) return []

  const body = section[1]
  const items: RecommendedActionItem[] = []
  let currentPriority: AdminAiPriority = 'Medium'
  let currentSection: RecommendedActionItem['section'] = 'General'

  const lines = body.split('\n')
  for (const raw of lines) {
    const line = raw.trim()
    if (!line) continue

    const heading = line.match(/^###\s*(High|Medium|Low)\s*priority\b/i)
    if (heading) {
      const p = normalizePriority(heading[1])
      currentPriority = p
      currentSection = p
      continue
    }

    // Inline priority tags: "Apply to CSCS… (High)" or "- High: …"
    const tagged = line.match(/^(?:High|Medium|Low)\s*:\s*(.+)$/i)
    if (tagged?.[1]) {
      const p = normalizePriority(line.split(':')[0])
      items.push({
        key: actionKey(tagged[1].trim(), items.length),
        title: tagged[1].trim(),
        priority: p,
        section: p,
      })
      continue
    }

    const m = line.match(/^(\d+[\).\]]|-|\*)\s+(.+)$/)
    if (m?.[2]) {
      let title = m[2].trim()
      let priority = currentPriority
      const priInTitle = title.match(/\((High|Medium|Low)\)\s*$/i)
      if (priInTitle) {
        priority = normalizePriority(priInTitle[1])
        title = title.replace(/\((High|Medium|Low)\)\s*$/i, '').trim()
      }
      if (!title) continue
      items.push({
        key: actionKey(title, items.length),
        title,
        priority,
        section: currentSection === 'General' ? priority : currentSection,
      })
    }
  }

  return items.slice(0, 12)
}
