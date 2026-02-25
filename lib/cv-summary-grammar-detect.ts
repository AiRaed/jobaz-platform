/**
 * Client-side grammar and spelling detection for the CV Summary field.
 * Used to show the "Fix Grammar" button and real-time issue indicator.
 * Checks: spelling, grammar, punctuation, spacing, capitalization, subject-verb agreement.
 * Runs on every (debounced) input so results appear in real time.
 */

/** Returns true if the text has any detectable grammar, spelling, punctuation, spacing, or capitalization issues. */
export function hasSummaryGrammarOrSpellingIssues(text: string): boolean {
  const t = text.trim()
  if (!t) return false

  // --- Spacing issues ---
  if (/\s{2,}/.test(t)) return true // double/multiple spaces
  if (/\.([A-Za-z])/.test(t)) return true // missing space after period
  if (/\s+([,.!?;:])/.test(t)) return true // space before punctuation

  // --- Punctuation & formatting ---
  if (/\.{2,}|\,{2,}|;{2,}/.test(t)) return true // repeated punctuation
  if (!/^[A-Z]/.test(t)) return true // sentence must start with capital
  if (!/[.!?]$/.test(t)) return true // must end with sentence-ending punctuation
  // Missing period: lowercase word then space(s) then capital (sentence boundary)
  if (/[a-z]\s+([A-Z])/.test(t)) return true

  // --- Spelling (common typos) ---
  const spellingPatterns = [
    /\balot\b/i,
    /\bteh\b/i,
    /\badn\b/i,
    /\brecieve\b/i,
    /\brecieved\b/i,
    /\bseperate\b/i,
    /\bdefinately\b/i,
    /\baccomodate\b/i,
    /\bneccessary\b/i,
    /\bacheive\b/i,
    /\boccured\b/i,
    /\binteressted\b/i,
    /\boccassion\b/i,
    /\brefered\b/i,
    /\bcommited\b/i,
    /\bembarass\b/i,
    /\bgoverment\b/i,
    /\benviroment\b/i,
    /\barguement\b/i,
    /\boccuring\b/i,
    /\bbenefitted\b/i,
    /\bthier\b/i,
    /\bexperiance\b/i,
    /\bresponsability\b/i,
    /\boccurence\b/i,
    /\bmaintainance\b/i,
    /\bacheivement\b/i,
    /\bjudgement\b/i, // US: judgment
    /\bmanagment\b/i,
    /\bdevelopement\b/i,
  ]
  if (spellingPatterns.some((re) => re.test(t))) return true

  // --- Subject-verb agreement & wrong word ---
  const thereIsPlural = /\bthere\s+(?:is|was)\s+(?:many|several|numerous|various|some|few|these|those|a\s+lot\s+of)\b/i
  if (thereIsPlural.test(t)) return true
  if (/\b(?:company|team|organisation|organization|data|research|study)\s+have\b/i.test(t)) return true
  if (/\b(?:students|people|others|things)\s+is\b/i.test(t)) return true
  if (/\b(?:data|research|study)\s+show\b/i.test(t)) return true // data shows
  if (/\b(?:he|she|it)\s+go\b/i.test(t)) return true // he/she/it goes
  if (/\b(?:there|their)\s+(?:going|not|will|would|can|could|have|had|been|already|still|really|also)\b/i.test(t)) return true
  if (/\bloose\s+(?:the|a|an|your|their|its)\b/i.test(t)) return true
  if (/\byour\s+you're\b/i.test(t)) return true
  // "Its" used for "It's" (e.g. "Its important" → "It's important")
  if (/\bIts\s+(?:important|clear|possible|likely|essential|critical|vital|necessary|not)\b/.test(t)) return true

  return false
}
