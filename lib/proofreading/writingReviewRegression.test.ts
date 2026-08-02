/**
 * Regression: Writing Review apply-fix sample from product spec.
 * Run: npx tsx lib/proofreading/writingReviewRegression.test.ts
 */

import { applyTextFix, canApplyIssue, sortIssuesForApply } from './applyFix'

const SAMPLE =
  'Many people believes that it improve communication. There is also concerns. This essay will discuss both side of the argument.'

const EXPECTED_FIXES: Array<{ original: string; suggestion: string }> = [
  { original: 'believes', suggestion: 'believe' },
  { original: 'improve', suggestion: 'improves' },
  { original: 'There is', suggestion: 'There are' },
  { original: 'both side', suggestion: 'both sides' },
]

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message)
}

let content = SAMPLE
const issues = EXPECTED_FIXES.map((fix, i) => {
  const start = content.indexOf(fix.original)
  assert(start >= 0, `Missing "${fix.original}" in sample`)
  return {
    id: String(i),
    original_text: fix.original,
    suggestion_text: fix.suggestion,
    start_index: start,
    end_index: start + fix.original.length,
    type: 'grammar',
    status: 'open' as const,
  }
})

for (const issue of sortIssuesForApply(issues)) {
  assert(canApplyIssue(issue), `Should be applicable: ${issue.original_text}`)
  const result = applyTextFix(content, issue)
  assert(result.ok, `Apply failed for ${issue.original_text}`)
  content = result.content
}

assert(content.includes('Many people believe'), 'Expected "Many people believe"')
assert(content.includes('it improves'), 'Expected "it improves"')
assert(content.includes('There are also concerns'), 'Expected "There are also concerns"')
assert(content.includes('both sides'), 'Expected "both sides"')
assert(!content.includes('believes'), 'Should not retain "believes"')
assert(content.split('communication').length - 1 === 1, 'Should not duplicate paragraphs')

console.log('writingReviewRegression.test.ts: all checks passed')
console.log('Result:', content)
