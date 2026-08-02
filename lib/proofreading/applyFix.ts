/**
 * Slice-only text fix application for Writing Review.
 * Replaces exact spans — never rewrites the whole document.
 */

export type FixableIssue = {
  original_text?: string
  suggestion_text?: string
  start_index?: number
  end_index?: number
  startIndex?: number
  endIndex?: number
  type?: string
  action?: 'replace' | 'delete' | 'insert'
}

export function canApplyIssue(issue: FixableIssue): boolean {
  const isDelete = issue.action === 'delete' || issue.type === 'repetition'
  if (isDelete) return Boolean(issue.original_text?.trim())
  return Boolean(issue.suggestion_text?.trim())
}

export function collapseDoubleSpaces(text: string): string {
  return text.replace(/  +/g, ' ')
}

export function normalizeTrailingDots(text: string): string {
  if (!text.length) return text
  let out = text
  while (/[\r\n][\s.]*$/.test(out)) {
    out = out.replace(/[\r\n][\s.]*$/, '')
  }
  out = out.replace(/[\s.]*\.{2,}\s*$/, '.')
  out = out.replace(/(?:\.\s*){2,}\s*$/, '.')
  return out
}

/** Fix "Word ." → "Word." spacing artifacts after apply. */
export function fixBrokenCapitalizationSpacing(text: string): string {
  return text.replace(/(\w)\s+\./g, '$1.').replace(/(\w)\s+,/g, '$1,')
}

export type ApplyFixResult =
  | { ok: true; content: string; start: number; end: number }
  | { ok: false; reason: 'empty_original' | 'no_replacement' | 'stale_offset' | 'no_match' }

/**
 * Apply one fix to content. Verifies slice matches original_text before replacing.
 */
export function applyTextFix(content: string, issue: FixableIssue): ApplyFixResult {
  const originalText = issue.original_text ?? ''
  const isDelete = issue.action === 'delete' || issue.type === 'repetition'
  const suggestion = (issue.suggestion_text ?? '').trim()

  if (!originalText.trim()) return { ok: false, reason: 'empty_original' }
  if (!isDelete && !suggestion) return { ok: false, reason: 'no_replacement' }

  const start = issue.start_index ?? issue.startIndex ?? 0
  const end = issue.end_index ?? issue.endIndex ?? start
  const textLen = content.length
  const startClamp = Math.max(0, Math.min(start, textLen))
  const endClamp = Math.max(startClamp, Math.min(end, textLen))
  const currentSlice = content.substring(startClamp, endClamp)

  if (currentSlice !== originalText) {
    const SEARCH_WINDOW = 80
    const windowStart = Math.max(0, startClamp - SEARCH_WINDOW)
    const windowEnd = Math.min(textLen, startClamp + SEARCH_WINDOW + originalText.length)
    const candidates: number[] = []
    let pos = content.indexOf(originalText, windowStart)
    while (pos !== -1 && pos + originalText.length <= windowEnd) {
      candidates.push(pos)
      pos = content.indexOf(originalText, pos + 1)
    }
    if (candidates.length === 0) return { ok: false, reason: 'no_match' }
    if (candidates.length > 1) {
      const closest = candidates.reduce((best, idx) =>
        Math.abs(idx - startClamp) < Math.abs(best - startClamp) ? idx : best
      )
      const tie = candidates.filter((idx) => Math.abs(idx - startClamp) === Math.abs(closest - startClamp))
      if (tie.length > 1) return { ok: false, reason: 'stale_offset' }
    }
    const resolvedStart = candidates.length === 1 ? candidates[0] : candidates.reduce((best, idx) =>
      Math.abs(idx - startClamp) < Math.abs(best - startClamp) ? idx : best
    )
    const resolvedEnd = resolvedStart + originalText.length
    if (content.substring(resolvedStart, resolvedEnd) !== originalText) {
      return { ok: false, reason: 'stale_offset' }
    }
    return applyAt(content, resolvedStart, resolvedEnd, isDelete ? '' : suggestion)
  }

  return applyAt(content, startClamp, endClamp, isDelete ? '' : suggestion)
}

function applyAt(content: string, start: number, end: number, replacement: string): ApplyFixResult {
  let repl = replacement
  if (repl) {
    const charBefore = start > 0 ? content[start - 1] : ' '
    const charAfter = end < content.length ? content[end] : ' '
    if (/[a-zA-Z]/.test(charBefore) && /[a-zA-Z]/.test(repl[0])) repl = ' ' + repl
    if (/[a-zA-Z]/.test(repl[repl.length - 1]) && /[a-zA-Z]/.test(charAfter)) repl = repl + ' '
  }
  let newContent = content.substring(0, start) + repl + content.substring(end)
  newContent = collapseDoubleSpaces(newContent)
  newContent = normalizeTrailingDots(newContent)
  newContent = fixBrokenCapitalizationSpacing(newContent)
  return { ok: true, content: newContent, start, end }
}

/** Sort issues bottom-to-top for safe multi-apply. */
export function sortIssuesForApply<T extends FixableIssue>(issues: T[]): T[] {
  return [...issues].sort(
    (a, b) =>
      (b.start_index ?? b.startIndex ?? 0) - (a.start_index ?? a.startIndex ?? 0)
  )
}
