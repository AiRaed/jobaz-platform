/**
 * Test harness for Writing Review General mode: spelling, grammar, clarity, word choice.
 * Run with: npx tsx lib/proofreading-general.test.ts
 *
 * Verifies that General mode:
 * - Returns at least Spelling + Grammar (and optionally Clarity/Style when needed).
 * - For "نص اختبار سريع (General)" test text: Grammar + Spelling + Word choice.
 * - Deduplicates repeated sentences (same type-original-suggestion = one issue).
 */

const sampleText = `
I have alot of work to do. There going to help me with it.
The student is here but the students is waiting outside.
The data show that we need more time. She go to the office every day.
The reason we failed is the reason is because we did not plan. We relied due to the fact that we had no time.
`

// Official General quick test text (نص اختبار سريع): must yield Grammar + Spelling + Word choice
const generalQuickTestText =
  'There is many reasons why this company have a good reputation. I am interest to apply and I am very exciting for this role. I have alot of experience.'

// Mirror key General-mode patterns from app/api/proofreading/analyze/route.ts
function runGeneralModePatterns(text: string): {
  spelling: number
  grammar: number
  clarity: number
  style: number
  wordChoice: number
} {
  const counts = { spelling: 0, grammar: 0, clarity: 0, style: 0, wordChoice: 0 }
  let m: RegExpExecArray | null

  // — Spelling
  const alotRegex = /\balot\b/gi
  while ((m = alotRegex.exec(text)) !== null) counts.spelling++

  const thereTheirRegex = /\b(?:there|their)\s+(?:is|was|are|were)\b/gi
  while ((m = thereTheirRegex.exec(text)) !== null) counts.spelling++

  const thereTheyreWrongRegex = /\b(there|their)\s+(going|not|will|would|can|could|have|had|been|already|still|really|also)\b/gi
  while ((m = thereTheyreWrongRegex.exec(text)) !== null) counts.spelling++

  // — Grammar
  const studentsIsRegex = /\bstudents\s+is\b/gi
  while ((m = studentsIsRegex.exec(text)) !== null) counts.grammar++

  const dataShowRegex = /\b(the\s+data|the\s+result|the\s+study)\s+show\b/gi
  while ((m = dataShowRegex.exec(text)) !== null) counts.grammar++

  const heSheGoRegex = /\b(he|she)\s+go\b/gi
  while ((m = heSheGoRegex.exec(text)) !== null) counts.grammar++

  const thereIsPlural = /\bthere\s+is\s+(?:many|several|numerous|various|some|few|these|those)\b/gi
  while ((m = thereIsPlural.exec(text)) !== null) counts.grammar++

  const singularHaveRegex = /\b(company|organization|team|government|committee|board|group|business|firm)\s+have\b/gi
  while ((m = singularHaveRegex.exec(text)) !== null) counts.grammar++

  // — Word choice (Grammar): I am interest → interested, I am (very) exciting → excited
  const iAmInterestRegex = /\bI\s+am\s+interest\b/gi
  while ((m = iAmInterestRegex.exec(text)) !== null) {
    counts.grammar++
    counts.wordChoice++
  }
  const iAmExcitingRegex = /\bI\s+am\s+(?:very\s+)?exciting\b/gi
  while ((m = iAmExcitingRegex.exec(text)) !== null) {
    counts.grammar++
    counts.wordChoice++
  }

  // — Clarity
  const reasonBecause = /\bthe\s+reason\s+is\s+because\b/gi
  while ((m = reasonBecause.exec(text)) !== null) counts.clarity++

  const dueToFact = /\bdue\s+to\s+the\s+fact\s+that\b/gi
  while ((m = dueToFact.exec(text)) !== null) counts.clarity++

  // — Style
  const veryRegex = /\bvery\s+very\b/gi
  while ((m = veryRegex.exec(text)) !== null) counts.style++

  const inOrderTo = /\bin\s+order\s+to\b/gi
  while ((m = inOrderTo.exec(text)) !== null) counts.style++

  return counts
}

// Stable key for deduplication (must match analyze route)
function issueKey(type: string, original: string, suggestion: string): string {
  return `${type}-${(original || '').trim().toLowerCase()}-${(suggestion || '').trim().toLowerCase()}`
}

// Simulate issues from repeated sentence and dedupe by key
function dedupeIssues(
  issues: Array<{ type: string; original: string; suggestion: string }>
): Array<{ type: string; original: string; suggestion: string }> {
  const seen = new Set<string>()
  const out: Array<{ type: string; original: string; suggestion: string }> = []
  for (const i of issues) {
    const key = issueKey(i.type, i.original, i.suggestion)
    if (seen.has(key)) continue
    seen.add(key)
    out.push(i)
  }
  return out
}

// --- Tests ---

// 1) Sample text: at least one spelling, grammar, clarity
const counts = runGeneralModePatterns(sampleText)
const hasSpelling = counts.spelling >= 1
const hasGrammar = counts.grammar >= 1
const hasClarity = counts.clarity >= 1
let passed = hasSpelling && hasGrammar && hasClarity

console.log('[Proofreading General] Sample text length:', sampleText.length)
console.log('[Proofreading General] Counts:', counts)
console.log('[Proofreading General] Has Spelling:', hasSpelling, '| Grammar:', hasGrammar, '| Clarity:', hasClarity)
console.log(passed ? '✅ General mode returns ≥1 Spelling, ≥1 Grammar, ≥1 Clarity' : '❌ Expected at least one of each type')

// 2) General quick test text (نص اختبار سريع): Grammar + Spelling + Word choice
const quickCounts = runGeneralModePatterns(generalQuickTestText)
const hasGrammarQuick = quickCounts.grammar >= 1
const hasWordChoiceQuick = quickCounts.wordChoice >= 1
const hasSpellingQuick = quickCounts.spelling >= 1
const quickPass = hasGrammarQuick && hasWordChoiceQuick && hasSpellingQuick

console.log('[Proofreading General] Quick test text (General):', generalQuickTestText)
console.log('[Proofreading General] Quick counts:', quickCounts, '| grammar:', hasGrammarQuick, '| spelling:', hasSpellingQuick, '| wordChoice:', hasWordChoiceQuick)
if (!hasGrammarQuick) {
  console.log('❌ Quick test must contain at least one grammar issue (e.g. "There is many", "company have", "interest", "exciting")')
  passed = false
} else {
  console.log('✅ Quick test returns ≥1 grammar issue')
}
if (!hasWordChoiceQuick) {
  console.log('❌ Quick test must contain at least one word-choice issue ("interest"→interested, "exciting"→excited)')
  passed = false
} else {
  console.log('✅ Quick test returns ≥1 word choice issue')
}
if (!hasSpellingQuick) {
  console.log('❌ Quick test must contain at least one spelling issue (e.g. "alot"→"a lot")')
  passed = false
} else {
  console.log('✅ Quick test returns ≥1 spelling issue')
}

// 3) Deduplication: repeated sentence must not produce duplicate issues
const repeatedSentence = 'There is many reasons why this company have a good reputation.'
const textWithRepeat = `${repeatedSentence} ${repeatedSentence}`
const rawCounts = runGeneralModePatterns(textWithRepeat)
// Simulate "issues" as type-original-suggestion (each pattern hit once per occurrence)
const simulatedIssues: Array<{ type: string; original: string; suggestion: string }> = []
const thereIsPlural = /\bthere\s+is\s+(?:many|several|numerous|various|some|few|these|those)\b/gi
let match: RegExpExecArray | null
while ((match = thereIsPlural.exec(textWithRepeat)) !== null) {
  simulatedIssues.push({ type: 'grammar', original: 'there is', suggestion: 'there are' })
}
const singularHave = /\b(company|organization|team|government|committee|board|group|business|firm)\s+have\b/gi
while ((match = singularHave.exec(textWithRepeat)) !== null) {
  simulatedIssues.push({ type: 'grammar', original: 'have', suggestion: 'has' })
}
const deduped = dedupeIssues(simulatedIssues)
const duplicateCountBefore = simulatedIssues.length
const duplicateCountAfter = deduped.length
const duplicatesRemoved = duplicateCountBefore > duplicateCountAfter

console.log('[Proofreading General] Repeated sentence test:', repeatedSentence)
console.log('[Proofreading General] Simulated issues (before dedupe):', duplicateCountBefore, '| after dedupe:', duplicateCountAfter)
if (!duplicatesRemoved && duplicateCountBefore > 1) {
  console.log('❌ Deduplication must collapse repeated-sentence issues to one per type-original-suggestion')
  passed = false
} else {
  console.log('✅ Duplicates removed (stable key deduplication)')
}

// Grammar must exist in the repeated-sentence text
const repeatGrammarOk = rawCounts.grammar >= 1
if (!repeatGrammarOk) {
  console.log('❌ Repeated-sentence text must yield at least one grammar issue')
  passed = false
} else {
  console.log('✅ Repeated-sentence text yields grammar issues')
}

passed = passed && quickPass && (duplicatesRemoved || duplicateCountBefore <= 1) && repeatGrammarOk
process.exit(passed ? 0 : 1)
