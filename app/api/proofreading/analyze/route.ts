import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type WritingMode = 'general' | 'academic' | 'academic_research'
type IssueType = 'grammar' | 'spelling' | 'style' | 'clarity' | 'word_form' | 'tense' | 'tense_consistency' | 'repetition' | 'preposition' | 'academic_tone' | 'academic_objectivity' | 'academic_hedging' | 'academic_citation' | 'academic_logic' | 'structure' | 'academic_style' | 'methodology' | 'evidence' | 'research_quality' | 'agreement' | 'article' | 'uncountable' | 'research_grammar' | 'punctuation'
type Severity = 'low' | 'moderate' | 'high'

const DISPLAY_ISSUE_TYPES: IssueType[] = ['grammar', 'spelling', 'style', 'clarity', 'word_form', 'tense', 'tense_consistency', 'repetition', 'preposition', 'academic_tone', 'academic_objectivity', 'academic_hedging', 'academic_citation', 'academic_logic', 'structure', 'academic_style', 'methodology', 'evidence', 'research_quality', 'agreement', 'article', 'uncountable', 'research_grammar', 'punctuation']
function toDisplayIssueType(type: string): IssueType {
  if (DISPLAY_ISSUE_TYPES.includes(type as IssueType)) return type as IssueType
  if (type.includes('grammar') || type === 'structure') return 'grammar'
  if (type.includes('clarity') || type === 'methodology' || type === 'evidence') return 'clarity'
  return 'style'
}

type IssueAction = 'replace' | 'delete' | 'insert'

type RuleType = 'grammar' | 'spelling' | 'repetition' | 'wordForm' | 'agreement' | 'modal' | 'tense' | 'style' | 'clarity' | 'preposition' | 'article' | 'uncountable' | 'research_grammar' | 'punctuation'

interface Issue {
  type: IssueType
  severity: Severity
  message: string
  original_text: string
  suggestion_text: string
  startIndex: number
  endIndex: number
  ruleType?: RuleType
}

/**
 * POST /api/proofreading/analyze
 * Professional proofreading analyzer with General, Academic Standard, and Academic Research/PhD modes.
 * 
 * Request body:
 * - documentId: string (required)
 * - content: string (required)
 * - mode: 'general' | 'academic' | 'academic_research' (default: 'general')
 * - options: { spelling, grammar, style, clarity }
 * - section: string (optional) - for academic_research mode: 'abstract' | 'introduction' | 'methodology' | 'results' | 'discussion' | 'conclusion'
 */
export async function POST(req: NextRequest) {
  try {
    // Get authenticated user
    const cookieStore = cookies()
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore in route handler
          }
        },
      },
    })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.error('[Proofreading Analyze] Auth error:', authError)
      return NextResponse.json(
        { 
          ok: false, 
          message: 'Authentication required',
          code: 'AUTH_REQUIRED',
          details: authError?.message || 'User not authenticated'
        },
        { status: 401 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await req.json()
    } catch (parseError: any) {
      console.error('[Proofreading Analyze] JSON parse error:', parseError)
      return NextResponse.json(
        { 
          ok: false, 
          message: 'Invalid JSON in request body',
          code: 'INVALID_JSON',
          details: parseError?.message || 'Failed to parse request body'
        },
        { status: 400 }
      )
    }

    let { documentId, content, mode = 'general', options = {}, section } = body

    // General mode: always run at least spelling + grammar; clarity/style remain optional
    if (mode === 'general') {
      options = { ...options, spelling: true, grammar: true }
    }

    // Validate required fields
    if (!documentId || typeof documentId !== 'string') {
      return NextResponse.json(
        { 
          ok: false, 
          message: 'documentId is required and must be a string',
          code: 'MISSING_DOCUMENT_ID',
          details: 'documentId parameter is missing or invalid'
        },
        { status: 400 }
      )
    }

    if (!content || typeof content !== 'string') {
      return NextResponse.json(
        { 
          ok: false, 
          message: 'Content is required and must be a string',
          code: 'MISSING_CONTENT',
          details: 'content parameter is missing or invalid'
        },
        { status: 400 }
      )
    }

    // Defensive validation: content must have at least 5 characters
    if (!content.trim() || content.trim().length < 5) {
      return NextResponse.json(
        { 
          ok: false, 
          message: 'Content must be at least 5 characters long',
          code: 'CONTENT_TOO_SHORT',
          details: 'Content is too short for analysis'
        },
        { status: 400 }
      )
    }

    // Validate document exists and belongs to user
    const { data: document, error: docError } = await supabase
      .from('proofreading_documents')
      .select('id, project_id, user_id')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single()

    if (docError || !document) {
      console.error('[Proofreading Analyze] Document validation error:', {
        code: docError?.code,
        message: docError?.message,
        details: docError?.details,
        hint: docError?.hint,
        fullError: docError,
      })
      return NextResponse.json(
        { 
          ok: false, 
          message: 'Document not found or access denied',
          code: docError?.code || 'DOCUMENT_NOT_FOUND',
          details: docError?.message || 'Document does not exist or you do not have access to it'
        },
        { status: 404 }
      )
    }

    // Validate mode
    if (mode !== 'general' && mode !== 'academic' && mode !== 'academic_research') {
      return NextResponse.json(
        { 
          ok: false, 
          message: 'Mode must be "general", "academic", or "academic_research"',
          code: 'INVALID_MODE',
          details: `Received mode: ${mode}`
        },
        { status: 400 }
      )
    }

    const writingMode: WritingMode = mode
    const isAcademicStandard = mode === 'academic'
    const isAcademicResearch = mode === 'academic_research'
    const isAcademic = isAcademicStandard || isAcademicResearch
    const issues: Issue[] = []
    const text = content

    // Logging: Track mode and options
    console.log('[analyze] Mode:', mode, '| Options:', options, '| Content length:', text.length)

    // Dev-only: verify full text is analyzed (no segmentation)
    const approxSentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
    if (process.env.NODE_ENV === 'development') {
      console.log('[analyze][dev] Full text analyzed. Length:', text.length, '| Approx sentences:', approxSentences)
    }

    // Track issue counts by detector type
    const detectorCounts: Record<string, number> = {
      spelling: 0,
      grammar: 0,
      style: 0,
      clarity: 0,
      word_form: 0,
      tense: 0,
      repetition: 0,
      preposition: 0,
      academic_tone: 0,
      academic_objectivity: 0,
      academic_hedging: 0,
      academic_citation: 0,
      academic_logic: 0,
      structure: 0,
      academic_style: 0,
      methodology: 0,
      evidence: 0,
      research_quality: 0,
      agreement: 0,
      article: 0,
      uncountable: 0,
      research_grammar: 0,
      punctuation: 0,
    }

    // VERIFICATION TEST: Add test string that MUST produce specific issue types
    // This is a temporary verification - remove in production if needed
    if (process.env.NODE_ENV === 'development' && text.includes('VERIFICATION_TEST')) {
      const testText = "I think this clearly proves that all students always fail. This study is really good and tries to do its best. We used a simple method."
      if (text.includes(testText)) {
        console.log('[analyze] VERIFICATION TEST DETECTED - Expected issues: academic_tone, evidence, methodology, structure')
      }
    }

    // Helper function to safely extract text from content at given indices
    const extractText = (start: number, end: number): string => {
      if (start < 0 || end < 0 || start >= text.length || end > text.length || start >= end) {
        return ''
      }
      return text.substring(start, end)
    }

    // Tokenizer: split by whitespace and punctuation, track start/end for each token (Phase 2 — word-boundary safety)
    const tokenize = (str: string): { token: string; start: number; end: number }[] => {
      const tokens: { token: string; start: number; end: number }[] = []
      const re = /\b\w+\b|[^\w\s]|\s+/g
      let match: RegExpExecArray | null
      while ((match = re.exec(str)) !== null) {
        tokens.push({ token: match[0], start: match.index, end: match.index + match[0].length })
      }
      return tokens
    }

    // ========================================================================
    // SPELLING CHECKS (same for both modes, but severity may differ)
    // ========================================================================
    if (options.spelling !== false) {
      // "alot" -> "a lot"
      const alotRegex = /\balot\b/gi
      let alotMatch: RegExpExecArray | null
      while ((alotMatch = alotRegex.exec(text)) !== null) {
        detectorCounts.spelling++
        issues.push({
          type: 'spelling',
          severity: isAcademic ? 'moderate' : 'low',
          message: isAcademicStandard 
            ? 'Spelling: "alot" should be written as two words: "a lot"'
            : '"alot" should be written as two words: "a lot"',
          original_text: alotMatch[0],
          suggestion_text: 'a lot',
          startIndex: alotMatch.index,
          endIndex: alotMatch.index + alotMatch[0].length,
        })
      }

      // "it's" vs "its"
      const itsRegex = /\bits\s+(?:is|was|will|has|had)\b/gi
      let itsMatch: RegExpExecArray | null
      while ((itsMatch = itsRegex.exec(text)) !== null) {
        issues.push({
          type: 'spelling',
          severity: isAcademic ? 'moderate' : 'low',
          message: isAcademicStandard
            ? 'Spelling: "its" (possessive) vs "it\'s" (contraction). Use "it\'s" here.'
            : '"its" (possessive) vs "it\'s" (contraction). Use "it\'s" here.',
          original_text: 'its',
          suggestion_text: "it's",
          startIndex: itsMatch.index,
          endIndex: itsMatch.index + 3,
        })
      }

      // "they're are" → "There are" (wrong: "they're" = they are, so "they're are" is redundant/wrong; use "There are")
      const theyreAreRegex = /\bthey're\s+are\b/gi
      let theyreAreMatch: RegExpExecArray | null
      while ((theyreAreMatch = theyreAreRegex.exec(text)) !== null) {
        detectorCounts.spelling++
        issues.push({
          type: 'spelling',
          severity: isAcademic ? 'moderate' : 'low',
          message: 'Use "There are" (referring to things/reasons), not "they\'re are".',
          original_text: "they're",
          suggestion_text: 'There',
          startIndex: theyreAreMatch.index,
          endIndex: theyreAreMatch.index + "they're".length,
        })
      }

      // "there" vs "their" vs "they're" — wrong use of "there"/"their" where "they're" (they are) is meant
      // IMPORTANT: Never suggest "they're" for correct existential "There are" / "There is" (e.g. "There are many reasons", "There is a reason")
      const thereTheirRegex = /\b(?:there|their)\s+(?:is|was|are|were)\b/gi
      const thereIsPluralNext = /\s+(?:many|several|numerous|various|some|few|these|those)\b/i
      const thereAreExistential = /\s+(?:many|several|numerous|various|some|few|these|those|reasons|things|ways|people|others|a\s+few)\b/i
      const thereIsExistential = /\s+(?:a|an|one|something|someone|no)\b/i
      let thereMatch: RegExpExecArray | null
      while ((thereMatch = thereTheirRegex.exec(text)) !== null) {
        const word = thereMatch[0].split(/\s+/)[0]
        if (word.toLowerCase() !== 'there' && word.toLowerCase() !== 'their') continue
        const afterMatch = text.slice(thereMatch.index + thereMatch[0].length)
        const verb = thereMatch[0].split(/\s+/)[1]
        if (verb && /^(is|was)$/i.test(verb) && thereIsPluralNext.test(afterMatch)) continue // grammar handles "there is many"
        if (word.toLowerCase() === 'there' && verb) {
          if (/^are$/i.test(verb) && thereAreExistential.test(afterMatch)) continue // "There are many reasons" — correct, do not change
          if (/^is$/i.test(verb) && thereIsExistential.test(afterMatch)) continue // "There is a reason" — correct, do not change
        }
        detectorCounts.spelling++
        issues.push({
          type: 'spelling',
          severity: isAcademic ? 'moderate' : 'low',
          message: isAcademicStandard
            ? `Spelling: "${word}" should be "they're" (contraction of "they are")`
            : `"${word}" should be "they're" (contraction of "they are")`,
          original_text: word,
          suggestion_text: "they're",
          startIndex: thereMatch.index,
          endIndex: thereMatch.index + word.length,
        })
      }
      // "there"/"their" used as subject (e.g. "There going to", "Their not here") → "they're"
      const thereTheyreWrongRegex = /\b(there|their)\s+(going|not|will|would|can|could|have|had|been|already|still|really|also)\b/gi
      let thereTheyreMatch: RegExpExecArray | null
      while ((thereTheyreMatch = thereTheyreWrongRegex.exec(text)) !== null) {
        const word = thereTheyreMatch[1]
        detectorCounts.spelling++
        issues.push({
          type: 'spelling',
          severity: isAcademic ? 'moderate' : 'low',
          message: `"${word}" should be "they're" (they are) here.`,
          original_text: word,
          suggestion_text: "they're",
          startIndex: thereTheyreMatch.index,
          endIndex: thereTheyreMatch.index + word.length,
        })
      }

      // "loose" vs "lose"
      const looseRegex = /\bloose\s+(?:the|a|an|your|their|its)\b/gi
      let looseMatch: RegExpExecArray | null
      while ((looseMatch = looseRegex.exec(text)) !== null) {
        issues.push({
          type: 'spelling',
          severity: isAcademic ? 'moderate' : 'low',
          message: isAcademicStandard
            ? 'Spelling: "loose" (adjective) vs "lose" (verb). Use "lose" here.'
            : '"loose" (adjective) vs "lose" (verb). Use "lose" here.',
          original_text: 'loose',
          suggestion_text: 'lose',
          startIndex: looseMatch.index,
          endIndex: looseMatch.index + 5,
        })
      }

      // "everyday" (adjective) vs "every day" (adverb phrase)
      const everydayRegex = /\beveryday\b/gi
      let everydayMatch: RegExpExecArray | null
      while ((everydayMatch = everydayRegex.exec(text)) !== null) {
        // Check if it's used as an adverb (before a verb) - should be "every day"
        const context = text.substring(Math.max(0, everydayMatch.index - 20), Math.min(text.length, everydayMatch.index + 30))
        if (/\beveryday\s+\w+\s+\w+/.test(context) || /\w+\s+everyday/.test(context)) {
          issues.push({
            type: 'spelling',
            severity: isAcademic ? 'moderate' : 'low',
            message: isAcademicStandard
              ? 'Spelling: "everyday" (adjective) vs "every day" (adverb phrase). Use "every day" when describing frequency.'
              : '"everyday" (adjective) vs "every day" (adverb phrase). Use "every day" when describing frequency.',
            original_text: 'everyday',
            suggestion_text: 'every day',
            startIndex: everydayMatch.index,
            endIndex: everydayMatch.index + 8,
          })
        }
      }

      // Common misspellings (include even if browser spellcheck would catch them)
      const commonMisspellings: { wrong: RegExp; right: string }[] = [
        { wrong: /\binteressted\b/gi, right: 'interested' },
        { wrong: /\bexperiance\b/gi, right: 'experience' },
        { wrong: /\bfoward\b/gi, right: 'forward' },
        { wrong: /\boccured\b/gi, right: 'occurred' },
        { wrong: /\brecieve\b/gi, right: 'receive' },
        { wrong: /\brecieved\b/gi, right: 'received' },
        { wrong: /\bseperate\b/gi, right: 'separate' },
        { wrong: /\bdefinately\b/gi, right: 'definitely' },
        { wrong: /\baccomodate\b/gi, right: 'accommodate' },
        { wrong: /\boccassion\b/gi, right: 'occasion' },
        { wrong: /\bneccessary\b/gi, right: 'necessary' },
        { wrong: /\bacheive\b/gi, right: 'achieve' },
        { wrong: /\bbenefitted\b/gi, right: 'benefited' },
        { wrong: /\brefered\b/gi, right: 'referred' },
        { wrong: /\bcommited\b/gi, right: 'committed' },
        { wrong: /\bembarass\b/gi, right: 'embarrass' },
        { wrong: /\bgoverment\b/gi, right: 'government' },
        { wrong: /\benviroment\b/gi, right: 'environment' },
        { wrong: /\barguement\b/gi, right: 'argument' },
        { wrong: /\boccuring\b/gi, right: 'occurring' },
      ]
      for (const { wrong, right } of commonMisspellings) {
        let spMatch: RegExpExecArray | null
        while ((spMatch = wrong.exec(text)) !== null) {
          detectorCounts.spelling++
          issues.push({
            type: 'spelling',
            severity: isAcademic ? 'moderate' : 'low',
            message: `Spelling: Use "${right}".`,
            original_text: spMatch[0],
            suggestion_text: right,
            startIndex: spMatch.index,
            endIndex: spMatch.index + spMatch[0].length,
          })
        }
      }

      // Typo: "has e a" → "has a"
      const hasEARegex = /\bhas\s+e\s+a\b/gi
      let hasEAMatch: RegExpExecArray | null
      while ((hasEAMatch = hasEARegex.exec(text)) !== null) {
        detectorCounts.spelling++
        issues.push({
          type: 'spelling',
          severity: 'low',
          message: 'Remove the extra "e". Use "has a".',
          original_text: hasEAMatch[0],
          suggestion_text: 'has a',
          startIndex: hasEAMatch.index,
          endIndex: hasEAMatch.index + hasEAMatch[0].length,
        })
      }
    }

    // ========================================================================
    // GRAMMAR CHECKS
    // ========================================================================
    if (options.grammar !== false) {
      // Subject-verb agreement: "This research aim to" -> "aims to"
      const aimToRegex = /This\s+(?:research|study|paper|analysis)\s+aim\s+to/gi
      let aimMatch: RegExpExecArray | null
      while ((aimMatch = aimToRegex.exec(text)) !== null) {
        const aimIndex = text.indexOf('aim', aimMatch.index)
        detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
        issues.push({
          type: 'grammar',
          severity: isAcademic ? 'high' : 'moderate',
          message: isAcademicStandard
            ? 'Grammar: Subject-verb agreement error. "This research" requires "aims" (third person singular).'
            : 'Subject-verb agreement: "This research" requires "aims" (third person singular)',
          original_text: 'aim',
          suggestion_text: 'aims',
          startIndex: aimIndex,
          endIndex: aimIndex + 3,
        })
      }

      // Double spaces
      const doubleSpaceRegex = /  +/g
      let doubleSpaceMatch: RegExpExecArray | null
      while ((doubleSpaceMatch = doubleSpaceRegex.exec(text)) !== null) {
        detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
        issues.push({
          type: 'grammar',
          severity: 'low',
          message: 'Multiple spaces detected. Use a single space.',
          original_text: doubleSpaceMatch[0],
          suggestion_text: ' ',
          startIndex: doubleSpaceMatch.index,
          endIndex: doubleSpaceMatch.index + doubleSpaceMatch[0].length,
        })
      }

      // Missing period: sentence runs into next (lowercase then space(s) then capital letter)
      const missingPeriodRegex = /[a-z]\s+([A-Z])/g
      let periodMatch: RegExpExecArray | null
      while ((periodMatch = missingPeriodRegex.exec(text)) !== null) {
        const spaceStart = periodMatch.index + 1
        const capIndex = periodMatch.index + periodMatch[0].length - 1
        detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
        const spacesOnly = text.substring(spaceStart, capIndex)
        issues.push({
          type: 'grammar',
          severity: 'low',
          message: 'Missing period or punctuation before this sentence.',
          original_text: spacesOnly || ' ',
          suggestion_text: '. ',
          startIndex: spaceStart,
          endIndex: capIndex,
        })
      }

      // Trailing multiple periods: consecutive (".....") or with spaces (". . . . .") or trailing line of only dots/spaces
      const trailingConsecutiveDotsRegex = /[\s.]*\.{2,}\s*$/
      const trailingSpacedDotsRegex = /(?:\.\s*){2,}\s*$/
      const trailingLineOnlyDotsRegex = /[\r\n][\s.]*$/
      const matchConsecutive = trailingConsecutiveDotsRegex.exec(text)
      const matchSpaced = trailingSpacedDotsRegex.exec(text)
      const lineOnlyMatch = trailingLineOnlyDotsRegex.exec(text)
      if (matchConsecutive) {
        detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
        issues.push({
          type: 'grammar',
          severity: 'low',
          message: 'Remove extra dots at the end of the text. Use a single period.',
          original_text: matchConsecutive[0],
          suggestion_text: '.',
          startIndex: matchConsecutive.index,
          endIndex: text.length,
        })
      } else if (matchSpaced) {
        detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
        issues.push({
          type: 'grammar',
          severity: 'low',
          message: 'Remove extra dots at the end of the text. Use a single period.',
          original_text: matchSpaced[0],
          suggestion_text: '.',
          startIndex: matchSpaced.index,
          endIndex: text.length,
        })
      } else if (lineOnlyMatch) {
        detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
        issues.push({
          type: 'grammar',
          severity: 'low',
          message: 'Remove trailing line that contains only dots or spaces.',
          original_text: lineOnlyMatch[0],
          suggestion_text: '',
          startIndex: lineOnlyMatch.index,
          endIndex: text.length,
        })
      }

      // Subject-verb agreement: "students is" -> "students are"
      const studentsIsRegex = /\bstudents\s+is\b/gi
      let studentsIsMatch: RegExpExecArray | null
      while ((studentsIsMatch = studentsIsRegex.exec(text)) !== null) {
        const isIndex = text.indexOf('is', studentsIsMatch.index)
        detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
        issues.push({
          type: 'grammar',
          severity: isAcademic ? 'high' : 'moderate',
          message: isAcademicStandard
            ? 'Grammar: Subject-verb agreement error. "Students" (plural) requires "are" (not "is").'
            : 'Subject-verb agreement: "Students" (plural) requires "are" (not "is")',
          original_text: 'is',
          suggestion_text: 'are',
          startIndex: isIndex,
          endIndex: isIndex + 2,
        })
      }

      // Subject-verb agreement: "it show" -> "it shows"
      const itShowRegex = /\bit\s+show\b/gi
      let itShowMatch: RegExpExecArray | null
      while ((itShowMatch = itShowRegex.exec(text)) !== null) {
        const showIndex = text.indexOf('show', itShowMatch.index)
        issues.push({
          type: 'grammar',
          severity: isAcademic ? 'high' : 'moderate',
          message: isAcademicStandard
            ? 'Grammar: Subject-verb agreement error. "It" (singular) requires "shows" (third person singular).'
            : 'Subject-verb agreement: "It" (singular) requires "shows" (third person singular)',
          original_text: 'show',
          suggestion_text: 'shows',
          startIndex: showIndex,
          endIndex: showIndex + 4,
        })
      }

      // Subject-verb agreement: "this clearly prove" -> "this clearly proves"
      const thisProveRegex = /\bthis\s+clearly\s+prove\b/gi
      let thisProveMatch: RegExpExecArray | null
      while ((thisProveMatch = thisProveRegex.exec(text)) !== null) {
        const proveIndex = text.indexOf('prove', thisProveMatch.index)
        issues.push({
          type: 'grammar',
          severity: isAcademic ? 'high' : 'moderate',
          message: isAcademicStandard
            ? 'Grammar: Subject-verb agreement error. "This" (singular) requires "proves" (third person singular).'
            : 'Subject-verb agreement: "This" (singular) requires "proves" (third person singular)',
          original_text: 'prove',
          suggestion_text: 'proves',
          startIndex: proveIndex,
          endIndex: proveIndex + 5,
        })
      }

      // Subject-verb agreement: "it cause" -> "it causes"
      const itCauseRegex = /\bit\s+cause\b/gi
      let itCauseMatch: RegExpExecArray | null
      while ((itCauseMatch = itCauseRegex.exec(text)) !== null) {
        const causeIndex = text.indexOf('cause', itCauseMatch.index)
        issues.push({
          type: 'grammar',
          severity: isAcademic ? 'high' : 'moderate',
          message: isAcademicStandard
            ? 'Grammar: Subject-verb agreement error. "It" (singular) requires "causes" (third person singular).'
            : 'Subject-verb agreement: "It" (singular) requires "causes" (third person singular)',
          original_text: 'cause',
          suggestion_text: 'causes',
          startIndex: causeIndex,
          endIndex: causeIndex + 5,
        })
      }

      // Subject-verb agreement: "it distract" -> "it distracts"
      const itDistractRegex = /\bit\s+distract\b/gi
      let itDistractMatch: RegExpExecArray | null
      while ((itDistractMatch = itDistractRegex.exec(text)) !== null) {
        const distractIndex = text.indexOf('distract', itDistractMatch.index)
        detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
        issues.push({
          type: 'grammar',
          severity: isAcademic ? 'high' : 'moderate',
          message: isAcademicStandard
            ? 'Grammar: Subject-verb agreement error. "It" (singular) requires "distracts" (third person singular).'
            : 'Subject-verb agreement: "It" (singular) requires "distracts" (third person singular)',
          original_text: 'distract',
          suggestion_text: 'distracts',
          startIndex: distractIndex,
          endIndex: distractIndex + 8,
        })
      }

      // Subject-verb agreement (clear errors for General): "he/she + go/do/want", "the data show"
      const heSheGoRegex = /\b(he|she)\s+go\b/gi
      let heSheGoMatch: RegExpExecArray | null
      while ((heSheGoMatch = heSheGoRegex.exec(text)) !== null) {
        const idx = text.indexOf('go', heSheGoMatch.index)
        if (idx >= 0) {
          detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
          issues.push({
            type: 'grammar',
            severity: isAcademic ? 'high' : 'moderate',
            message: 'Subject-verb agreement: "He/She" (singular) requires "goes".',
            original_text: 'go',
            suggestion_text: 'goes',
            startIndex: idx,
            endIndex: idx + 2,
          })
        }
      }
      const heSheDoRegex = /\b(he|she)\s+do\b/gi
      let heSheDoMatch: RegExpExecArray | null
      while ((heSheDoMatch = heSheDoRegex.exec(text)) !== null) {
        const idx = text.indexOf('do', heSheDoMatch.index)
        if (idx >= 0) {
          detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
          issues.push({
            type: 'grammar',
            severity: isAcademic ? 'high' : 'moderate',
            message: 'Subject-verb agreement: "He/She" (singular) requires "does".',
            original_text: 'do',
            suggestion_text: 'does',
            startIndex: idx,
            endIndex: idx + 2,
          })
        }
      }
      const dataShowRegex = /\b(the\s+data|the\s+result|the\s+study)\s+show\b/gi
      let dataShowMatch: RegExpExecArray | null
      while ((dataShowMatch = dataShowRegex.exec(text)) !== null) {
        const idx = text.indexOf('show', dataShowMatch.index)
        if (idx >= 0) {
          detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
          issues.push({
            type: 'grammar',
            severity: isAcademic ? 'high' : 'moderate',
            message: 'Subject-verb agreement: singular subject ("the data/result/study") requires "shows".',
            original_text: 'show',
            suggestion_text: 'shows',
            startIndex: idx,
            endIndex: idx + 4,
          })
        }
      }

      // Possessive: "students performance" -> "students' performance" or "student performance"
      const studentsPerformanceRegex = /\bstudents\s+performance\b/gi
      let studentsPerfMatch: RegExpExecArray | null
      while ((studentsPerfMatch = studentsPerformanceRegex.exec(text)) !== null) {
        issues.push({
          type: 'grammar',
          severity: isAcademic ? 'moderate' : 'low',
          message: isAcademicStandard
            ? 'Grammar: Use possessive form "students\' performance" or singular "student performance".'
            : 'Use possessive form "students\' performance" or singular "student performance"',
          original_text: 'students performance',
          suggestion_text: "students' performance",
          startIndex: studentsPerfMatch.index,
          endIndex: studentsPerfMatch.index + studentsPerfMatch[0].length,
        })
      }
    }

    // ========================================================================
    // STYLE CHECKS (mode-dependent)
    // ========================================================================
    if (options.style !== false) {
      // Repeated "very" - more strict in academic
      const veryRegex = /\bvery\s+very\b/gi
      let veryMatch: RegExpExecArray | null
      while ((veryMatch = veryRegex.exec(text)) !== null) {
        detectorCounts.style = (detectorCounts.style || 0) + 1
        issues.push({
          type: 'style',
          severity: isAcademic ? 'moderate' : 'low',
          message: isAcademicStandard
            ? 'Style: Avoid repeated intensifiers in academic writing. Use a more precise adjective instead.'
            : isAcademicResearch
            ? 'Style: Repeated intensifiers weaken academic argumentation. Use precise, evidence-based language.'
            : 'Repeated "very" weakens the writing. Use a stronger adjective instead.',
          original_text: veryMatch[0],
          suggestion_text: isAcademic ? 'significantly' : 'extremely',
          startIndex: veryMatch.index,
          endIndex: veryMatch.index + veryMatch[0].length,
        })
      }

      // Vague phrases - stricter in academic
      const vaguePhrases = [
        { pattern: /\bvery\s+important\b/gi, academic: 'significant', general: 'crucial' },
        { pattern: /\breally\s+good\b/gi, academic: 'effective', general: 'excellent' },
        { pattern: /\bvery\s+bad\b/gi, academic: 'problematic', general: 'detrimental' },
        { pattern: /\bpretty\s+(?:good|bad|sure)\b/gi, academic: 'moderately', general: 'quite' },
      ]

      vaguePhrases.forEach(({ pattern, academic, general }) => {
        let vagueMatch: RegExpExecArray | null
        while ((vagueMatch = pattern.exec(text)) !== null) {
          const severity: Severity = isAcademic ? 'moderate' : 'low'
          const suggestion = isAcademic ? academic : general
          const words = vagueMatch[0].split(/\s+/)
          const firstWord = words[0]
          
          detectorCounts.style = (detectorCounts.style || 0) + 1
          issues.push({
            type: 'style',
            severity,
            message: isAcademicStandard
              ? `Style: Avoid vague qualifiers like "${firstWord}" in academic writing. Use more precise language.`
              : isAcademicResearch
              ? `Style: Vague qualifiers weaken research credibility. Replace "${firstWord}" with precise terminology.`
              : `Consider using a more specific word than "${firstWord}".`,
            original_text: firstWord,
            suggestion_text: suggestion,
            startIndex: vagueMatch.index,
            endIndex: vagueMatch.index + firstWord.length,
          })
        }
      })
    }

    // ========================================================================
    // GENERAL + ACADEMIC STANDARD: Additional grammar (there is/are, a/an, agreement, etc.)
    // Academic Standard extends General rules, so both modes run this block.
    // ========================================================================
    if (options.grammar !== false && (mode === 'general' || mode === 'academic')) {
      // — Grammar: articles (a/an)
      const aBeforeVowel = /\ba\s+([aeiouAEIOU][a-z]+)\b/g
      let artMatch: RegExpExecArray | null
      while ((artMatch = aBeforeVowel.exec(text)) !== null) {
        const word = artMatch[1]
        if (/^[aeiou]/i.test(word) && word.length > 1 && !/^eu/i.test(word)) {
          detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
          issues.push({
            type: 'grammar',
            severity: 'low',
            message: 'Grammar: Use "an" before a word that starts with a vowel sound (e.g. "an apple").',
            original_text: 'a ' + word,
            suggestion_text: 'an ' + word,
            startIndex: artMatch.index,
            endIndex: artMatch.index + artMatch[0].length,
          })
        }
      }
      const anBeforeConsonant = /\ban\s+([bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ][a-z]+)\b/g
      while ((artMatch = anBeforeConsonant.exec(text)) !== null) {
        const word = artMatch[1]
        if (/^[bcdfghjklmnpqrstvwxyz]/i.test(word) && !/^[eu]/i.test(word)) {
          detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
          issues.push({
            type: 'grammar',
            severity: 'low',
            message: 'Grammar: Use "a" before a word that starts with a consonant sound (e.g. "a book").',
            original_text: 'an ' + word,
            suggestion_text: 'a ' + word,
            startIndex: artMatch.index,
            endIndex: artMatch.index + artMatch[0].length,
          })
        }
      }

      // — Grammar: there is/are (plural/singular)
      const thereIsPlural = /\bthere\s+is\s+(?:many|several|numerous|various|some|few|these|those)\b/gi
      let tipMatch: RegExpExecArray | null
      while ((tipMatch = thereIsPlural.exec(text)) !== null) {
        detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
        issues.push({
          type: 'grammar',
          severity: 'low',
          message: 'Grammar: Use "there are" with plural ideas (e.g. "there are many").',
          original_text: 'there is',
          suggestion_text: 'there are',
          startIndex: tipMatch.index,
          endIndex: tipMatch.index + 9,
        })
      }
      const thereAreSingular = /\bthere\s+are\s+(?:a|an)\s+\w+\s+(?:that|which|who)\b/gi
      while ((tipMatch = thereAreSingular.exec(text)) !== null) {
        const match = /there\s+are\s+/.exec(tipMatch[0])
        if (match) {
          detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
          issues.push({
            type: 'grammar',
            severity: 'low',
            message: 'Grammar: Use "there is" with a singular noun (e.g. "there is a reason").',
            original_text: 'there are',
            suggestion_text: 'there is',
            startIndex: tipMatch.index,
            endIndex: tipMatch.index + 10,
          })
        }
      }
      // There are + a/an + singular noun (e.g. "there are a reason") → There is
      const thereAreASingular = /\bthere\s+are\s+(?:a|an)\s+(?:reason|way|thing|point|issue|factor|problem|solution)\b/gi
      let taasMatch: RegExpExecArray | null
      while ((taasMatch = thereAreASingular.exec(text)) !== null) {
        detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
        issues.push({
          type: 'grammar',
          severity: 'low',
          message: 'Grammar: Use "there is" with a singular noun (e.g. "there is a reason").',
          original_text: 'there are',
          suggestion_text: 'there is',
          startIndex: taasMatch.index,
          endIndex: taasMatch.index + 10,
        })
      }

      // — Grammar: singular subject + "have" → "has" (e.g. "company have", "the team have")
      const singularHaveRegex = /\b(company|organization|team|government|committee|board|group|business|firm)\s+have\b/gi
      let shMatch: RegExpExecArray | null
      while ((shMatch = singularHaveRegex.exec(text)) !== null) {
        const haveIndex = shMatch.index + (shMatch[0].length - 5) // start of "have"
        detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
        issues.push({
          type: 'grammar',
          severity: 'low',
          message: 'Grammar: Singular subject requires "has" (third person), not "have".',
          original_text: 'have',
          suggestion_text: 'has',
          startIndex: haveIndex,
          endIndex: haveIndex + 4,
          ruleType: 'agreement',
        })
      }

      // ========== General + Academic Standard: agreement, modal, plural, past tense ==========
      if (mode === 'general' || mode === 'academic') {
        // I has -> I have (subject-verb agreement)
        const iHasRegex = /\bI\s+has\b/gi
        let iHasMatch: RegExpExecArray | null
        while ((iHasMatch = iHasRegex.exec(text)) !== null) {
          const hasIdx = iHasMatch.index + (iHasMatch[0].length - 3)
          detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
          issues.push({
            type: 'grammar',
            severity: 'moderate',
            message: 'Subject-verb agreement: "I" requires "have", not "has".',
            original_text: 'has',
            suggestion_text: 'have',
            startIndex: hasIdx,
            endIndex: hasIdx + 3,
            ruleType: 'agreement',
          })
        }

        // He/She/It have -> has
        const thirdPersonHaveRegex = /\b(he|she|it)\s+have\b/gi
        let tphMatch: RegExpExecArray | null
        while ((tphMatch = thirdPersonHaveRegex.exec(text)) !== null) {
          const haveIdx = tphMatch.index + (tphMatch[0].length - 5)
          detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
          issues.push({
            type: 'grammar',
            severity: 'moderate',
            message: 'Subject-verb agreement: "He/She/It" requires "has", not "have".',
            original_text: 'have',
            suggestion_text: 'has',
            startIndex: haveIdx,
            endIndex: haveIdx + 4,
            ruleType: 'agreement',
          })
        }

        // Third person singular: manager say -> says (exclude "say that" — handled by past tense rule)
        const thirdPersonSayRegex = /\b(manager|employee|employer|company|team|he|she|it)\s+say(?!\s+that)\b/gi
        let tpsMatch: RegExpExecArray | null
        while ((tpsMatch = thirdPersonSayRegex.exec(text)) !== null) {
          const sayIdx = tpsMatch.index + (tpsMatch[0].length - 3)
          detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
          issues.push({
            type: 'grammar',
            severity: 'moderate',
            message: 'Subject-verb agreement: third person singular requires "says".',
            original_text: 'say',
            suggestion_text: 'says',
            startIndex: sayIdx,
            endIndex: sayIdx + 3,
            ruleType: 'agreement',
          })
        }

        // Past tense: manager say that -> said that
        const sayThatRegex = /\b(manager|employee|employer|previous\s+manager|my\s+manager)\s+say\s+that\b/gi
        let stMatch: RegExpExecArray | null
        while ((stMatch = sayThatRegex.exec(text)) !== null) {
          const sayIdx = stMatch.index + (stMatch[0].length - 8) // " say that" -> start of "say"
          const sayEnd = sayIdx + 3
          detectorCounts.tense = (detectorCounts.tense || 0) + 1
          issues.push({
            type: 'tense',
            severity: 'moderate',
            message: 'Use past tense "said" when reporting what someone said in the past.',
            original_text: 'say',
            suggestion_text: 'said',
            startIndex: sayIdx,
            endIndex: sayEnd,
            ruleType: 'tense',
          })
        }

        // Modal + base form: can works -> can work, can handles -> can handle, should goes -> should go
        const modalBaseRegex = /\b(can|should|would|could|must|may|might)\s+(works|goes|says|makes|takes|comes|does|has|handles|manages|provides|requires|allows|enables)\b/gi
        const modalBaseForm: Record<string, string> = {
          works: 'work', goes: 'go', says: 'say', makes: 'make', takes: 'take', comes: 'come', does: 'do', has: 'have',
          handles: 'handle', manages: 'manage', provides: 'provide', requires: 'require', allows: 'allow', enables: 'enable',
        }
        let mbMatch: RegExpExecArray | null
        while ((mbMatch = modalBaseRegex.exec(text)) !== null) {
          const verb = mbMatch[2]!.toLowerCase()
          const base = modalBaseForm[verb]
          if (base) {
            const verbIdx = mbMatch.index + (mbMatch[0].length - verb.length)
            detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
            issues.push({
              type: 'grammar',
              severity: 'moderate',
              message: 'After modal verbs (can, should, etc.) use the base form of the verb (e.g. "can work").',
              original_text: mbMatch[2]!,
              suggestion_text: base,
              startIndex: verbIdx,
              endIndex: verbIdx + verb.length,
              ruleType: 'modal',
            })
          }
        }

        // many + singular noun -> plural: many company -> many companies, many reason -> many reasons
        const manySingular: { singular: RegExp; plural: string }[] = [
          { singular: /\bmany\s+company\b/gi, plural: 'companies' },
          { singular: /\bmany\s+reason\b/gi, plural: 'reasons' },
          { singular: /\bmany\s+skill\b/gi, plural: 'skills' },
          { singular: /\bmany\s+employee\b/gi, plural: 'employees' },
          { singular: /\bmany\s+opportunity\b/gi, plural: 'opportunities' },
          { singular: /\bmany\s+way\b/gi, plural: 'ways' },
          { singular: /\bmany\s+thing\b/gi, plural: 'things' },
          { singular: /\bmany\s+situation\b/gi, plural: 'situations' },
          { singular: /\bstrong\s+communication\s+skill\b/gi, plural: 'skills' },
          { singular: /\bone\s+of\s+the\s+best\s+employee\b/gi, plural: 'employees' },
          { singular: /\b(?:several|few)\s+situation\b/gi, plural: 'situations' },
          { singular: /\ba\s+number\s+of\s+situation\b/gi, plural: 'situations' },
          { singular: /\b(?:several|few)\s+reason\b/gi, plural: 'reasons' },
          { singular: /\ba\s+number\s+of\s+reason\b/gi, plural: 'reasons' },
          { singular: /\b(?:handle|handling|managed|managing)\s+(?:a\s+)?difficult\s+situation\b/gi, plural: 'situations' },
        ]
        // many + uncountable noun → use "much" or "a lot of" (many experience → much experience / a lot of experience)
        const manyUncountable: { pattern: RegExp; suggestion: string }[] = [
          { pattern: /\bmany\s+experience\b/gi, suggestion: 'much experience' },
          { pattern: /\bmany\s+information\b/gi, suggestion: 'much information' },
          { pattern: /\bmany\s+advice\b/gi, suggestion: 'much advice' },
          { pattern: /\bmany\s+knowledge\b/gi, suggestion: 'much knowledge' },
          { pattern: /\bmany\s+research\b/gi, suggestion: 'much research' },
        ]
        for (const { pattern, suggestion } of manyUncountable) {
          let muMatch: RegExpExecArray | null
          pattern.lastIndex = 0
          while ((muMatch = pattern.exec(text)) !== null) {
            detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
            issues.push({
              type: 'grammar',
              severity: 'moderate',
              message: `Use "much" with uncountable nouns (e.g. "${suggestion}").`,
              original_text: muMatch[0],
              suggestion_text: suggestion,
              startIndex: muMatch.index,
              endIndex: muMatch.index + muMatch[0].length,
            })
          }
        }
        for (const { singular, plural } of manySingular) {
          let msMatch: RegExpExecArray | null
          singular.lastIndex = 0
          while ((msMatch = singular.exec(text)) !== null) {
            const matchText = msMatch[0]
            const lastWord = matchText.split(/\s+/).pop()!
            const lastWordStart = msMatch.index + (matchText.length - lastWord.length)
            detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
            issues.push({
              type: 'grammar',
              severity: 'moderate',
              message: `Use plural noun after "many" or in plural context: "${lastWord}" → "${plural}".`,
              original_text: lastWord,
              suggestion_text: plural,
              startIndex: lastWordStart,
              endIndex: lastWordStart + lastWord.length,
              ruleType: 'grammar',
            })
          }
        }

        // I has worked -> I have worked (present perfect)
        const iHasWorkedRegex = /\bI\s+has\s+(?:worked|been|had|done|seen|written|made)\b/gi
        let ihwMatch: RegExpExecArray | null
        while ((ihwMatch = iHasWorkedRegex.exec(text)) !== null) {
          const hasIdx = ihwMatch.index + 2 // after "I "
          detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
          issues.push({
            type: 'grammar',
            severity: 'moderate',
            message: 'Present perfect with "I" requires "have", not "has" (e.g. "I have worked").',
            original_text: 'has',
            suggestion_text: 'have',
            startIndex: hasIdx,
            endIndex: hasIdx + 3,
            ruleType: 'agreement',
          })
        }
      }

      // — Grammar: repeated word (e.g. "the the")
      const repeatedWord = /\b(\w+)\s+\1\b/gi
      let rwMatch: RegExpExecArray | null
      while ((rwMatch = repeatedWord.exec(text)) !== null) {
        detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
        issues.push({
          type: 'grammar',
          severity: 'low',
          message: 'Grammar: Repeated word. Remove the duplicate.',
          original_text: rwMatch[0],
          suggestion_text: rwMatch[1],
          startIndex: rwMatch.index,
          endIndex: rwMatch.index + rwMatch[0].length,
        })
      }

      // — Tense (General): past time + base verb → use past tense
      const pastTimeBaseVerb = /\b(yesterday|last\s+(?:week|month|year|night)|ago)\s+(?:he|she|it|we|they)\s+(go|do|come|run|give|take|make|see|write|say)\b/gi
      let tenseMatch: RegExpExecArray | null
      while ((tenseMatch = pastTimeBaseVerb.exec(text)) !== null) {
        const verb = tenseMatch[2]?.toLowerCase()
        const past: Record<string, string> = { go: 'went', do: 'did', come: 'came', run: 'ran', give: 'gave', take: 'took', make: 'made', see: 'saw', write: 'wrote', say: 'said' }
        const suggestion = past[verb]
        if (suggestion) {
          detectorCounts.tense = (detectorCounts.tense || 0) + 1
          const verbStart = tenseMatch.index + (tenseMatch[0].indexOf(tenseMatch[2]!) ?? 0)
          issues.push({
            type: 'tense',
            severity: 'moderate',
            message: 'Tense: Use past tense after past time (e.g. "yesterday he went").',
            original_text: tenseMatch[2]!,
            suggestion_text: suggestion,
            startIndex: verbStart,
            endIndex: verbStart + (tenseMatch[2]?.length ?? 0),
          })
        }
      }

      // — Word form (General): -ed vs -ing after "I am" — interest→interested, exciting→excited, boring→bored, etc.
      const wordFormPatterns: { pattern: RegExp; original: string; suggestion: string; message: string }[] = [
        { pattern: /\bI\s+am\s+interest\b/gi, original: 'interest', suggestion: 'interested', message: 'Word form: Use "interested" (adjective) after "I am", not "interest" (noun).' },
        { pattern: /\bI\s+am\s+(?:very\s+)?exciting\b/gi, original: 'exciting', suggestion: 'excited', message: 'Word form: Use "excited" (how you feel) after "I am", not "exciting" (describes something else).' },
        { pattern: /\bI\s+am\s+(?:very\s+)?boring\b/gi, original: 'boring', suggestion: 'bored', message: 'Word form: Use "bored" (how you feel) after "I am", not "boring".' },
        { pattern: /\bI\s+am\s+(?:very\s+)?frustrating\b/gi, original: 'frustrating', suggestion: 'frustrated', message: 'Word form: Use "frustrated" (how you feel) after "I am", not "frustrating".' },
        { pattern: /\bI\s+am\s+(?:very\s+)?interesting\b/gi, original: 'interesting', suggestion: 'interested', message: 'Word form: Use "interested" (I am interested in...) after "I am", not "interesting".' },
      ]
      for (const { pattern, original, suggestion, message } of wordFormPatterns) {
        let wfMatch: RegExpExecArray | null
        while ((wfMatch = pattern.exec(text)) !== null) {
          const matchText = wfMatch[0]
          const offset = matchText.toLowerCase().indexOf(original.toLowerCase())
          const idx = wfMatch.index + (offset >= 0 ? offset : 0)
          detectorCounts.word_form = (detectorCounts.word_form || 0) + 1
          issues.push({
            type: 'word_form',
            severity: 'moderate',
            message,
            original_text: original,
            suggestion_text: suggestion,
            startIndex: idx,
            endIndex: idx + original.length,
          })
        }
      }

      // — Spelling/Grammar (General): incorrect plurals — companys, familys, etc.
      const incorrectPlurals: { wrong: RegExp; right: string }[] = [
        { wrong: /\bcompanys\b/gi, right: 'companies' },
        { wrong: /\bfamilys\b/gi, right: 'families' },
        { wrong: /\bcountrys\b/gi, right: 'countries' },
        { wrong: /\bstorys\b/gi, right: 'stories' },
        { wrong: /\bpartys\b/gi, right: 'parties' },
        { wrong: /\bcurrencys\b/gi, right: 'currencies' },
      ]
      for (const { wrong, right } of incorrectPlurals) {
        let plMatch: RegExpExecArray | null
        while ((plMatch = wrong.exec(text)) !== null) {
          detectorCounts.spelling = (detectorCounts.spelling || 0) + 1
          issues.push({
            type: 'spelling',
            severity: 'moderate',
            message: `Spelling: Incorrect plural. Use "${right}".`,
            original_text: plMatch[0],
            suggestion_text: right,
            startIndex: plMatch.index,
            endIndex: plMatch.index + plMatch[0].length,
          })
        }
      }

      // — Grammar (General): subject-verb agreement — they was, it match, they has, etc.
      const theyWasRegex = /\bthey\s+was\b/gi
      let twMatch: RegExpExecArray | null
      while ((twMatch = theyWasRegex.exec(text)) !== null) {
        const idx = text.indexOf('was', twMatch.index)
        if (idx >= 0) {
          detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
          issues.push({
            type: 'grammar',
            severity: 'high',
            message: 'Subject-verb agreement: "They" (plural) requires "were", not "was".',
            original_text: 'was',
            suggestion_text: 'were',
            startIndex: idx,
            endIndex: idx + 3,
          })
        }
      }
      const itMatchRegex = /\bit\s+match\b/gi
      let imMatch: RegExpExecArray | null
      while ((imMatch = itMatchRegex.exec(text)) !== null) {
        const idx = text.indexOf('match', imMatch.index)
        if (idx >= 0) {
          detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
          issues.push({
            type: 'grammar',
            severity: 'high',
            message: 'Subject-verb agreement: "It" (singular) requires "matches" (third person).',
            original_text: 'match',
            suggestion_text: 'matches',
            startIndex: idx,
            endIndex: idx + 5,
          })
        }
      }
      const theyHasRegex = /\bthey\s+has\b/gi
      let thMatch: RegExpExecArray | null
      while ((thMatch = theyHasRegex.exec(text)) !== null) {
        const idx = text.indexOf('has', thMatch.index)
        if (idx >= 0) {
          detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
          issues.push({
            type: 'grammar',
            severity: 'high',
            message: 'Subject-verb agreement: "They" (plural) requires "have", not "has".',
            original_text: 'has',
            suggestion_text: 'have',
            startIndex: idx,
            endIndex: idx + 3,
          })
        }
      }

      // — Grammar (General): adjective after verb → adverb (work efficient → work efficiently, act calm → act calmly)
      if (mode === 'general') {
        const verbAdjPairs: { pattern: RegExp; adverb: string }[] = [
          { pattern: /\b(?:work|works|worked|working)\s+efficient\b/gi, adverb: 'efficiently' },
          { pattern: /\b(?:act|acts|acted|acting)\s+calm\b/gi, adverb: 'calmly' },
          { pattern: /\b(?:respond|responds|responded|responding)\s+calm\b/gi, adverb: 'calmly' },
          { pattern: /\b(?:communicate|communicates|communicated|communicating)\s+efficient\b/gi, adverb: 'efficiently' },
        ]
        for (const { pattern, adverb } of verbAdjPairs) {
          let vaMatch: RegExpExecArray | null
          pattern.lastIndex = 0
          while ((vaMatch = pattern.exec(text)) !== null) {
            const adjStart = vaMatch.index + (vaMatch[0].length - (vaMatch[0].match(/\w+$/)![0].length))
            const adjWord = (vaMatch[0].match(/\w+$/)!)[0]
            detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
            issues.push({
              type: 'grammar',
              severity: 'moderate',
              message: `Use the adverb "${adverb}" after a verb (e.g. "work ${adverb}").`,
              original_text: adjWord,
              suggestion_text: adverb,
              startIndex: adjStart,
              endIndex: adjStart + adjWord.length,
            })
          }
        }
      }

      // — Grammar (General): "very good" used as adverb → "very well" (verb + adjective → suggest adverb)
      const veryGoodAdverbRegex = /\b(?:situation|situations|difficult\s+situation|pressure|it|things|job|work|them)\s+very\s+good\b/gi
      let vgMatch: RegExpExecArray | null
      while ((vgMatch = veryGoodAdverbRegex.exec(text)) !== null) {
        const veryGoodStart = vgMatch.index + vgMatch[0].indexOf('very good')
        detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
        issues.push({
          type: 'grammar',
          severity: 'moderate',
          message: 'Use "very well" (adverb) here, not "very good" (adjective).',
          original_text: 'very good',
          suggestion_text: 'very well',
          startIndex: veryGoodStart,
          endIndex: veryGoodStart + 9,
        })
      }

      // — Grammar (General): "and develop" in past context (e.g. "have worked...and develop strong") → "and developed"
      const andDevelopRegex = /\band\s+develop\s+(?:strong|communication|key|many)\b/gi
      let adMatch: RegExpExecArray | null
      while ((adMatch = andDevelopRegex.exec(text)) !== null) {
        const developIdx = adMatch.index + adMatch[0].indexOf('develop')
        detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
        issues.push({
          type: 'grammar',
          severity: 'moderate',
          message: 'Use past tense "developed" to match "have worked" (e.g. "I have worked...and developed").',
          original_text: 'develop',
          suggestion_text: 'developed',
          startIndex: developIdx,
          endIndex: developIdx + 7,
        })
      }

      // — Grammar (General): "responsible to" + verb → "responsible for" + gerund (e.g. responsible to manage → responsible for managing)
      if (mode === 'general') {
        const responsibleToRegex = /\bresponsible\s+to\s+(\w+)\b/gi
        let respMatch: RegExpExecArray | null
        while ((respMatch = responsibleToRegex.exec(text)) !== null) {
          const verb = respMatch[1]!
          const gerund = verb.endsWith('e') ? verb.slice(0, -1) + 'ing' : verb + 'ing'
          detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
          issues.push({
            type: 'grammar',
            severity: 'moderate',
            message: 'Grammar: Use "responsible for" + gerund (e.g. "responsible for managing").',
            original_text: 'to ' + verb,
            suggestion_text: 'for ' + gerund,
            startIndex: respMatch.index + (respMatch[0].indexOf('to')),
            endIndex: respMatch.index + respMatch[0].length,
          })
        }
      }

      // — Grammar (General): infinitive vs gerund — look forward to hear → to hearing, enjoy to do → enjoy doing
      const lookForwardToHear = /\blook(?:ing)?\s+forward\s+to\s+hear\b/gi
      let lfMatch: RegExpExecArray | null
      while ((lfMatch = lookForwardToHear.exec(text)) !== null) {
        const idx = text.indexOf('hear', lfMatch.index)
        if (idx >= 0) {
          detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
          issues.push({
            type: 'grammar',
            severity: 'moderate',
            message: 'Grammar: After "look forward to" use the gerund (-ing): "hearing", not "hear".',
            original_text: 'hear',
            suggestion_text: 'hearing',
            startIndex: idx,
            endIndex: idx + 4,
          })
        }
      }
      const enjoyToDo = /\benjoy\s+to\s+(\w+)\b/gi
      let edMatch: RegExpExecArray | null
      while ((edMatch = enjoyToDo.exec(text)) !== null) {
        const verb = edMatch[1]!
        const simpleGerund = verb.endsWith('e') ? verb.slice(0, -1) + 'ing' : verb + 'ing'
        detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
        issues.push({
          type: 'grammar',
          severity: 'moderate',
          message: 'Grammar: After "enjoy" use the gerund (-ing): "enjoy doing", not "enjoy to do".',
          original_text: 'to ' + verb,
          suggestion_text: simpleGerund,
          startIndex: edMatch.index + (edMatch[0].indexOf('to')),
          endIndex: edMatch.index + edMatch[0].length,
        })
      }

      // — General only: paragraph-start capitalization — replace entire first word, not single character (avoids "T here" spacing bug)
      if (mode === 'general') {
        const paragraphStartRegex = /(^|[\r\n]{2,})(\s*)([a-z][a-z]*)/g
        let capMatch: RegExpExecArray | null
        while ((capMatch = paragraphStartRegex.exec(text)) !== null) {
          const wordStart = capMatch.index + capMatch[1].length + capMatch[2].length
          const word = capMatch[3]!
          if (!word) continue
          const capitalized = word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
          if (capitalized === word) continue
          detectorCounts.grammar = (detectorCounts.grammar || 0) + 1
          issues.push({
            type: 'grammar',
            severity: 'low',
            message: 'Capitalize the first letter at the start of a paragraph.',
            original_text: word,
            suggestion_text: capitalized,
            startIndex: wordStart,
            endIndex: wordStart + word.length,
          })
        }
        // — Style (General, low): "in the team" → "on the team" (common CV phrasing)
        const inTheTeamRegex = /\bin\s+the\s+team\b/gi
        let teamMatch: RegExpExecArray | null
        while ((teamMatch = inTheTeamRegex.exec(text)) !== null) {
          detectorCounts.style = (detectorCounts.style || 0) + 1
          issues.push({
            type: 'style',
            severity: 'low',
            message: 'Style: "on the team" is more common in professional writing (e.g. "one of the best employees on the team").',
            original_text: 'in the team',
            suggestion_text: 'on the team',
            startIndex: teamMatch.index,
            endIndex: teamMatch.index + teamMatch[0].length,
          })
        }
      }

      // — Repetition (General): repeated sentences — normalize and only flag if similarity > 90%
      function normalizeForRepetition(s: string): string {
        return s
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .replace(/[^\w\s]/g, '')
          .trim()
      }
      function editDistance(a: string, b: string): number {
        const m = a.length
        const n = b.length
        const dp: number[][] = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0))
        for (let i = 0; i <= m; i++) dp[i][0] = i
        for (let j = 0; j <= n; j++) dp[0][j] = j
        for (let i = 1; i <= m; i++) {
          for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1
            dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost)
          }
        }
        return dp[m][n]
      }
      function similarity(a: string, b: string): number {
        if (a.length === 0 && b.length === 0) return 1
        const maxLen = Math.max(a.length, b.length)
        if (maxLen === 0) return 1
        const dist = editDistance(a, b)
        return 1 - dist / maxLen
      }
      const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10)
      const normalizedSentences = sentences.map(s => normalizeForRepetition(s))
      const seenSentences: { norm: string; pos: number; raw: string }[] = []
      let cursor = 0
      for (let i = 0; i < sentences.length; i++) {
        const raw = sentences[i]
        const norm = normalizedSentences[i]
        if (!norm || norm.length < 15) continue
        const pos = text.indexOf(raw, cursor)
        if (pos < 0) continue
        const SIMILARITY_THRESHOLD = 0.9
        const duplicate = seenSentences.find(
          (s) => s.norm.length > 0 && (s.norm === norm || similarity(s.norm, norm) >= SIMILARITY_THRESHOLD)
        )
        if (duplicate !== undefined) {
          detectorCounts.repetition = (detectorCounts.repetition || 0) + 1
          issues.push({
            type: 'repetition',
            severity: 'moderate',
            message: 'Repetition: This sentence is very similar to one earlier in the text. Consider removing or rephrasing.',
            original_text: raw,
            suggestion_text: '',
            startIndex: pos,
            endIndex: pos + raw.length,
            ruleType: 'repetition',
          })
        } else {
          seenSentences.push({ norm, pos, raw })
        }
        cursor = pos + raw.length
      }
    }

    if (!isAcademic && options.clarity !== false) {
      // — Clarity: "the reason is because" (redundant)
      const reasonBecause = /\bthe\s+reason\s+is\s+because\b/gi
      let rbMatch: RegExpExecArray | null
      while ((rbMatch = reasonBecause.exec(text)) !== null) {
        detectorCounts.clarity = (detectorCounts.clarity || 0) + 1
        issues.push({
          type: 'clarity',
          severity: 'low',
          message: 'Clarity: "The reason is because" is redundant. Use "The reason is that" or "Because".',
          original_text: rbMatch[0],
          suggestion_text: 'the reason is that',
          startIndex: rbMatch.index,
          endIndex: rbMatch.index + rbMatch[0].length,
        })
      }

      // — Clarity: wordy "due to the fact that"
      const dueToFact = /\bdue\s+to\s+the\s+fact\s+that\b/gi
      let dtMatch: RegExpExecArray | null
      while ((dtMatch = dueToFact.exec(text)) !== null) {
        detectorCounts.clarity = (detectorCounts.clarity || 0) + 1
        issues.push({
          type: 'clarity',
          severity: 'low',
          message: 'Clarity: Prefer "because" instead of "due to the fact that" for clearer writing.',
          original_text: dtMatch[0],
          suggestion_text: 'because',
          startIndex: dtMatch.index,
          endIndex: dtMatch.index + dtMatch[0].length,
        })
      }

      // — Style (General): "in order to" → "to" (wordy)
      const inOrderTo = /\bin\s+order\s+to\b/gi
      let iotMatch: RegExpExecArray | null
      while ((iotMatch = inOrderTo.exec(text)) !== null) {
        detectorCounts.style = (detectorCounts.style || 0) + 1
        issues.push({
          type: 'style',
          severity: 'low',
          message: 'Style: "In order to" can often be shortened to "to" for more concise writing.',
          original_text: 'in order to',
          suggestion_text: 'to',
          startIndex: iotMatch.index,
          endIndex: iotMatch.index + iotMatch[0].length,
        })
      }

      // — Prepositions (General)
      const prepositionFixes: { pattern: RegExp; original: string; suggestion: string; message: string }[] = [
        { pattern: /\bdifferent\s+than\b/gi, original: 'different than', suggestion: 'different from', message: 'Preposition: Use "different from" (not "different than") in formal writing.' },
        { pattern: /\binterested\s+on\b/gi, original: 'interested on', suggestion: 'interested in', message: 'Preposition: Use "interested in", not "interested on".' },
        { pattern: /\bdepend\s+of\b/gi, original: 'depend of', suggestion: 'depend on', message: 'Preposition: Use "depend on", not "depend of".' },
        { pattern: /\bcompared\s+than\b/gi, original: 'compared than', suggestion: 'compared with', message: 'Preposition: Use "compared with" or "compared to", not "compared than".' },
        { pattern: /\bresponsible\s+from\b/gi, original: 'responsible from', suggestion: 'responsible for', message: 'Preposition: Use "responsible for", not "responsible from".' },
        { pattern: /\bagree\s+to\s+something\b/gi, original: 'agree to something', suggestion: 'agree with something', message: 'Preposition: Use "agree with" (a person or idea), "agree to" (a plan or proposal).' },
      ]
      for (const { pattern, original, suggestion, message } of prepositionFixes) {
        let prepMatch: RegExpExecArray | null
        while ((prepMatch = pattern.exec(text)) !== null) {
          detectorCounts.preposition = (detectorCounts.preposition || 0) + 1
          issues.push({
            type: 'preposition',
            severity: 'moderate',
            message,
            original_text: prepMatch[0],
            suggestion_text: suggestion,
            startIndex: prepMatch.index,
            endIndex: prepMatch.index + prepMatch[0].length,
          })
        }
      }
    }

    // ========================================================================
    // ACADEMIC-SPECIFIC CHECKS (for both academic modes)
    // ========================================================================
    if (isAcademic) {
      // First-person opinion phrases
      const firstPersonOpinions = [
        { pattern: /\bI\s+think\b/gi, suggestion: 'This suggests' },
        { pattern: /\bI\s+believe\b/gi, suggestion: 'The evidence indicates' },
        { pattern: /\bIn\s+my\s+opinion\b/gi, suggestion: 'From the analysis' },
        { pattern: /\bFrom\s+my\s+opinion\b/gi, suggestion: 'From the analysis' },
        { pattern: /\bI\s+feel\s+that\b/gi, suggestion: 'The data shows that' },
        { pattern: /\bI\s+would\s+say\b/gi, suggestion: 'It can be argued' },
      ]

      firstPersonOpinions.forEach(({ pattern, suggestion }) => {
        let firstPersonMatch: RegExpExecArray | null
        while ((firstPersonMatch = pattern.exec(text)) !== null) {
          const issueType = isAcademicResearch ? 'academic_objectivity' : 'academic_tone'
          detectorCounts[issueType] = (detectorCounts[issueType] || 0) + 1
          issues.push({
            type: issueType,
            severity: 'high',
            message: isAcademicStandard
              ? 'Academic tone: Avoid personal opinion. Use objective, evidence-based language.'
              : 'Academic objectivity: Personal opinion undermines research credibility. Use objective, evidence-based language.',
            original_text: firstPersonMatch[0],
            suggestion_text: suggestion,
            startIndex: firstPersonMatch.index,
            endIndex: firstPersonMatch.index + firstPersonMatch[0].length,
          })
        }
      })

      // Informal language
      const informalPhrases = [
        { pattern: /\bcan't\b/gi, suggestion: 'cannot' },
        { pattern: /\bdon't\b/gi, suggestion: 'do not' },
        { pattern: /\bwon't\b/gi, suggestion: 'will not' },
        { pattern: /\bit's\b/gi, suggestion: 'it is' }, // In academic, prefer full form
        { pattern: /\bthat's\b/gi, suggestion: 'that is' },
        { pattern: /\bthere's\b/gi, suggestion: 'there is' },
      ]

      informalPhrases.forEach(({ pattern, suggestion }) => {
        let informalMatch: RegExpExecArray | null
        while ((informalMatch = pattern.exec(text)) !== null) {
          detectorCounts.academic_tone = (detectorCounts.academic_tone || 0) + 1
          issues.push({
            type: 'academic_tone',
            severity: isAcademicResearch ? 'high' : 'moderate',
            message: isAcademicStandard
              ? 'Academic tone: Avoid contractions in formal academic writing. Use the full form.'
              : 'Academic tone: Contractions are inappropriate in research writing. Use the full form.',
            original_text: informalMatch[0],
            suggestion_text: suggestion,
            startIndex: informalMatch.index,
            endIndex: informalMatch.index + informalMatch[0].length,
          })
        }
      })

      // Self-evaluation phrases (avoid in academic writing)
      const selfEvaluationPatterns = [
        { pattern: /\bthis\s+(?:research|study|paper|analysis)\s+is\s+really\s+good\b/gi },
        { pattern: /\bthis\s+(?:research|study|paper|analysis)\s+is\s+very\s+good\b/gi },
        { pattern: /\bthis\s+(?:research|study|paper|analysis)\s+tries\s+to\b/gi },
      ]

      selfEvaluationPatterns.forEach(({ pattern }) => {
        let selfEvalMatch: RegExpExecArray | null
        while ((selfEvalMatch = pattern.exec(text)) !== null) {
          issues.push({
            type: isAcademicResearch ? 'academic_objectivity' : 'academic_tone',
            severity: 'high',
            message: isAcademicStandard
              ? 'Academic tone: Avoid self-evaluation in academic writing. Let readers assess the quality of your work.'
              : 'Academic objectivity: Self-evaluation undermines research credibility. Remove subjective assessments and let evidence speak.',
            original_text: selfEvalMatch[0],
            suggestion_text: '', // No auto-suggestion, just a warning
            startIndex: selfEvalMatch.index,
            endIndex: selfEvalMatch.index + selfEvalMatch[0].length,
          })
        }
      })

      // Weak/Absolute Claims - detect overly strong statements
      const absoluteClaimPatterns = [
        { pattern: /\bthis\s+clearly\s+prove\s+that\b/gi, message: 'This claim may require softer wording or supporting evidence.' },
        { pattern: /\bthis\s+clearly\s+proves\s+that\b/gi, message: 'This claim may require softer wording or supporting evidence.' },
        { pattern: /\bthis\s+clearly\s+show\s+that\b/gi, message: 'This claim may require softer wording or supporting evidence.' },
        { pattern: /\bthis\s+clearly\s+shows\s+that\b/gi, message: 'This claim may require softer wording or supporting evidence.' },
        { pattern: /\bis\s+very\s+bad\b/gi, message: 'Consider using more nuanced language instead of absolute statements.' },
      ]

      absoluteClaimPatterns.forEach(({ pattern, message }) => {
        let absoluteMatch: RegExpExecArray | null
        while ((absoluteMatch = pattern.exec(text)) !== null) {
          issues.push({
            type: 'clarity',
            severity: isAcademic ? 'moderate' : 'low',
            message: isAcademicStandard
              ? `Clarity: ${message}`
              : message,
            original_text: absoluteMatch[0],
            suggestion_text: '', // No auto-suggestion, just a warning
            startIndex: absoluteMatch.index,
            endIndex: absoluteMatch.index + absoluteMatch[0].length,
          })
        }
      })

      // Subject-verb agreement (strict in academic)
      const svAgreementPatterns = [
        { pattern: /The\s+(?:data|research|study)\s+(?:show|indicate|suggest)\b/gi, fix: 'shows/indicates/suggests' },
      ]

      svAgreementPatterns.forEach(({ pattern, fix }) => {
        let svMatch: RegExpExecArray | null
        while ((svMatch = pattern.exec(text)) !== null) {
          const verbMatch = svMatch[0].match(/\b(show|indicate|suggest)\b/i)
          if (verbMatch) {
            const verb = verbMatch[1]
            const corrected = verb + (verb.endsWith('s') ? '' : 's')
            issues.push({
              type: 'grammar',
              severity: 'high',
              message: isAcademicStandard
                ? 'Grammar: Subject-verb agreement error. Singular subject requires singular verb.'
                : 'Grammar: Subject-verb agreement error. Singular subject requires singular verb.',
              original_text: verb,
              suggestion_text: corrected,
              startIndex: svMatch.index + svMatch[0].indexOf(verb),
              endIndex: svMatch.index + svMatch[0].indexOf(verb) + verb.length,
            })
          }
        }
      })
    }

    // ========================================================================
    // ACADEMIC RESEARCH / PhD SPECIFIC CHECKS (strictest rule-based layer)
    // ========================================================================
    if (isAcademicResearch) {
      // ========== STRICT RESEARCH RULES (PhD-ONLY) ==========
      // 1. Advanced Subject–Verb Agreement
      const phdAgreementPatterns: { pattern: RegExp; suggestion: string; message: string }[] = [
        { pattern: /\bstudies\s+has\b/gi, suggestion: 'have', message: 'Agreement: Use "have" with plural subject "studies".' },
        { pattern: /\bsystems\s+increases\b/gi, suggestion: 'increase', message: 'Agreement: Use plural verb with plural subject "systems".' },
        { pattern: /\bmodels\s+that\s+explains\b/gi, suggestion: 'explain', message: 'Agreement: Relative clause verb must agree with plural "models".' },
        { pattern: /\bfindings\s+indicates\b/gi, suggestion: 'indicate', message: 'Agreement: Use plural verb with plural subject "findings".' },
        { pattern: /\bimpact\s+remain\b/gi, suggestion: 'remains', message: 'Agreement: Use singular verb with singular subject "impact".' },
        { pattern: /\bimplementation\s+pose\b/gi, suggestion: 'poses', message: 'Agreement: Use singular verb with singular subject "implementation".' },
        { pattern: /\bcan\s+provides\b/gi, suggestion: 'provide', message: 'Research grammar: After modal "can", use base form "provide".' },
        { pattern: /\bmay\s+leads\b/gi, suggestion: 'lead', message: 'Research grammar: After modal "may", use base form "lead".' },
      ]
      phdAgreementPatterns.forEach(({ pattern, suggestion, message }) => {
        let m: RegExpExecArray | null
        while ((m = pattern.exec(text)) !== null) {
          const orig = m[0]
          const sug = orig.replace(/\b(has|have|increases?|explains?|indicates?|remain|remains?|pose|poses?|provides?|leads?)\b/gi, (verb) => {
            const v = verb.toLowerCase()
            if (v === 'has') return 'have'
            if (v === 'increases') return 'increase'
            if (v === 'explains') return 'explain'
            if (v === 'indicates') return 'indicate'
            if (v === 'remain') return 'remains'
            if (v === 'pose') return 'poses'
            if (v === 'provides') return 'provide'
            if (v === 'leads') return 'lead'
            return verb
          })
          if (sug !== orig) {
            detectorCounts.agreement = (detectorCounts.agreement || 0) + 1
            issues.push({ type: 'agreement', severity: 'moderate', message, original_text: orig, suggestion_text: sug, startIndex: m.index, endIndex: m.index + orig.length })
          }
        }
      })

      // 2. Relative clause precision (that/which + wrong verb number)
      const relativeClausePatterns: { pattern: RegExp; suggestion: string; message: string }[] = [
        { pattern: /\b(?:models|systems|methods|findings|results|data)\s+that\s+explains\b/gi, suggestion: 'explain', message: 'Research grammar: Use plural verb in relative clause (antecedent is plural).' },
        { pattern: /\b(?:systems|models|factors)\s+that\s+alters\b/gi, suggestion: 'alter', message: 'Research grammar: Use plural verb in relative clause.' },
        { pattern: /\bwhich\s+undermine\s+(?:the\s+)?(?:validity|reliability|finding)\b/gi, suggestion: 'undermines', message: 'Research grammar: Use singular verb when "which" refers to singular antecedent (e.g. "finding which undermines").' },
      ]
      relativeClausePatterns.forEach(({ pattern, suggestion, message }) => {
        let r: RegExpExecArray | null
        while ((r = pattern.exec(text)) !== null) {
          const orig = r[0]
          const sug = orig.replace(/\b(explains|alters|undermine)\b/gi, suggestion)
          if (sug !== orig) {
            detectorCounts.research_grammar = (detectorCounts.research_grammar || 0) + 1
            issues.push({ type: 'research_grammar', severity: 'moderate', message, original_text: orig, suggestion_text: sug, startIndex: r.index, endIndex: r.index + orig.length })
          }
        }
      })

      // 3. Research methodology strictness: data was → were (plural), research were → was (uncountable)
      const dataWasRe = /\bdata\s+was\s+(analysed|analyzed|collected|gathered|obtained)\b/gi
      let dm: RegExpExecArray | null
      while ((dm = dataWasRe.exec(text)) !== null) {
        detectorCounts.research_grammar = (detectorCounts.research_grammar || 0) + 1
        issues.push({
          type: 'research_grammar',
          severity: 'moderate',
          message: 'Research grammar: In formal research writing, "data" is often treated as plural. Use "data were analysed" (or "data was analysed" only if consistently treating data as singular).',
          original_text: dm[0],
          suggestion_text: dm[0].replace(/\bwas\b/, 'were'),
          startIndex: dm.index,
          endIndex: dm.index + dm[0].length,
        })
      }
      const researchWereRe = /\bresearch\s+were\b/gi
      let rw: RegExpExecArray | null
      while ((rw = researchWereRe.exec(text)) !== null) {
        detectorCounts.agreement = (detectorCounts.agreement || 0) + 1
        issues.push({
          type: 'agreement',
          severity: 'moderate',
          message: 'Agreement: "Research" is uncountable; use singular verb "was".',
          original_text: rw[0],
          suggestion_text: 'research was',
          startIndex: rw.index,
          endIndex: rw.index + rw[0].length,
        })
      }
      // staff → uncountable warning (tip-only when used with plural verb)
      const staffWereRe = /\bstaff\s+were\s+(asked|interviewed|recruited|included)\b/gi
      let sp: RegExpExecArray | null
      while ((sp = staffWereRe.exec(text)) !== null) {
        detectorCounts.uncountable = (detectorCounts.uncountable || 0) + 1
        issues.push({
          type: 'uncountable',
          severity: 'low',
          message: 'Usage: "Staff" can be used with plural verb when meaning the group (e.g. "staff were asked"). If you mean uncountable, use "staff was". Ensure consistency.',
          original_text: sp[0],
          suggestion_text: '',
          startIndex: sp.index,
          endIndex: sp.index + sp[0].length,
        })
      }

      // 4. Hedging & overclaim (high sensitivity): absolute claims → cautious alternatives
      const strictHedgingPatterns: { pattern: RegExp; suggestion: string; message: string }[] = [
        { pattern: /\bIt\s+is\s+strongly\s+argued\b/gi, suggestion: 'It has been argued', message: 'Hedging: Softer academic tone. Use "It has been argued" or "Scholars suggest" rather than "strongly argued".' },
        { pattern: /\bmust\s+immediately\b/gi, suggestion: 'may need to', message: 'Hedging: Avoid overclaim. Use "may need to" or "could" to reflect uncertainty.' },
        { pattern: /\bproves\s+that\b/gi, suggestion: 'suggests that', message: 'Hedging: Use "suggests that" or "indicates that" instead of "proves that" for academic caution.' },
        { pattern: /\bprove\s+that\b/gi, suggestion: 'suggest that', message: 'Hedging: Use "suggest that" or "indicate that" instead of "prove that".' },
        { pattern: /\bunquestionably\b/gi, suggestion: 'is likely', message: 'Hedging: Replace absolute "unquestionably" with cautious phrasing (e.g. "is likely", "appears to").' },
        { pattern: /\binevitably\s+(?:leads?|results?|means?)\b/gi, suggestion: 'may lead', message: 'Hedging: Replace "inevitably" with "may" or "tends to" to reflect uncertainty.' },
        { pattern: /\bwill\s+permanently\s+(?:change|alter|affect)\b/gi, suggestion: 'may have lasting effects on', message: 'Hedging: Avoid overclaim. Use "may have lasting effects" or "could alter".' },
        { pattern: /\bclearly\s+demonstrates?\b/gi, suggestion: 'suggests', message: 'Hedging: Use "suggests", "indicates", or "appears to demonstrate" instead of "clearly demonstrates".' },
        { pattern: /\bclearly\s+shows?\b/gi, suggestion: 'suggests', message: 'Hedging: Use "suggests" or "indicates" instead of "clearly shows".' },
        { pattern: /\bdefinitely\s+(?:proves?|shows?|demonstrates?)\b/gi, suggestion: 'suggests', message: 'Hedging: Use "suggests" or "indicates" to reflect academic caution.' },
      ]
      strictHedgingPatterns.forEach(({ pattern, suggestion, message }) => {
        let h: RegExpExecArray | null
        while ((h = pattern.exec(text)) !== null) {
          detectorCounts.academic_hedging = (detectorCounts.academic_hedging || 0) + 1
          issues.push({
            type: 'academic_hedging',
            severity: 'high',
            message,
            original_text: h[0],
            suggestion_text: suggestion,
            startIndex: h.index,
            endIndex: h.index + h[0].length,
          })
        }
      })

      // 5. Citation sensitivity: claims requiring academic support → "Citation may be required."
      const citationPhrasePatterns: RegExp[] = [
        /\bPrevious\s+research\b/gi,
        /\bRecent\s+studies\b/gi,
        /\bIt\s+has\s+been\s+demonstrated\b/gi,
        /\b(?:studies|research|evidence|data|findings)\s+(?:show|prove|demonstrate|indicate|suggest|reveal)\b/gi,
        /\b(?:according\s+to|as\s+(?:shown|demonstrated|indicated)\s+by)\s+(?:studies|research|evidence)\b/gi,
        /\b(?:previous|prior|earlier)\s+(?:studies|research|work|findings)\b/gi,
      ]
      citationPhrasePatterns.forEach((pattern) => {
        let c: RegExpExecArray | null
        while ((c = pattern.exec(text)) !== null) {
          detectorCounts.academic_citation = (detectorCounts.academic_citation || 0) + 1
          issues.push({
            type: 'academic_citation',
            severity: 'moderate',
            message: 'Citation may be required.',
            original_text: c[0],
            suggestion_text: '',
            startIndex: c.index,
            endIndex: c.index + c[0].length,
          })
        }
      })

      // 6. Formal punctuation: comma before "however" in mid-sentence, comma splice
      const commaBeforeHowever = /\b(\w+)\s+however\b/gi
      let cb: RegExpExecArray | null
      while ((cb = commaBeforeHowever.exec(text)) !== null) {
        const full = cb[0]
        const beforeWord = cb[1]
        if (beforeWord.toLowerCase() === 'however') continue
        const fix = beforeWord + ', however'
        detectorCounts.punctuation = (detectorCounts.punctuation || 0) + 1
        issues.push({
          type: 'punctuation',
          severity: 'moderate',
          message: 'Punctuation: Use a comma before "however" when it appears in the middle of a sentence.',
          original_text: full,
          suggestion_text: fix,
          startIndex: cb.index,
          endIndex: cb.index + full.length,
        })
      }
      const commaSplice = /\b([a-z]+)\s+,\s+([A-Z][a-z]+)\s+(?:was|were|is|are|has|have|had|will|would|can|could)\b/gi
      let cs: RegExpExecArray | null
      while ((cs = commaSplice.exec(text)) !== null) {
        const full = cs[0]
        const semicolonFix = full.replace(/\s+,\s+/, '; ')
        detectorCounts.punctuation = (detectorCounts.punctuation || 0) + 1
        issues.push({
          type: 'punctuation',
          severity: 'moderate',
          message: 'Punctuation: Comma splice detected. Use a semicolon or split into two sentences.',
          original_text: full,
          suggestion_text: semicolonFix,
          startIndex: cs.index,
          endIndex: cs.index + full.length,
        })
      }

      // 7. Abstract noun enforcement (PhD: evidences, informations, researches, knowledges)
      const phdUncountable: [RegExp, string][] = [
        [/\bevidences\b/gi, 'evidence'],
        [/\binformations\b/gi, 'information'],
        [/\bresearches\b/gi, 'research'],
        [/\bknowledges\b/gi, 'knowledge'],
      ]
      phdUncountable.forEach(([pattern, replacement]) => {
        let u: RegExpExecArray | null
        while ((u = pattern.exec(text)) !== null) {
          detectorCounts.uncountable = (detectorCounts.uncountable || 0) + 1
          issues.push({
            type: 'uncountable',
            severity: 'moderate',
            message: 'Uncountable noun: Use singular form in academic English.',
            original_text: u[0],
            suggestion_text: replacement,
            startIndex: u.index,
            endIndex: u.index + u[0].length,
          })
        }
      })

      // 8. Research tense consistency: methodology past, established present, flag tense switching
      const tenseMixPattern = /\b(?:was|were|conducted|collected|analysed|analyzed)\s+.*?(?:show|shows|indicate|indicates|suggest|suggests)\s+(?:that|)\s*[a-z]/gi
      let tm: RegExpExecArray | null
      while ((tm = tenseMixPattern.exec(text)) !== null) {
        if (tm[0].length > 20 && tm[0].length < 120) {
          detectorCounts.research_grammar = (detectorCounts.research_grammar || 0) + 1
          issues.push({
            type: 'tense_consistency',
            severity: 'moderate',
            message: 'Tense consistency: Use past for methodology ("was conducted"); keep findings consistent (e.g. "showed" or "shows" throughout). Avoid mixing within the same section.',
            original_text: tm[0].substring(0, 60) + (tm[0].length > 60 ? '...' : ''),
            suggestion_text: '',
            startIndex: tm.index,
            endIndex: Math.min(tm.index + tm[0].length, tm.index + 80),
          })
        }
      }
      // Methodology must be past: "we collect" → "we collected"
      const methodologyPresentPattern = /\b(?:we|the\s+researchers?)\s+(?:collect|analyse|analyze|conduct|perform|measure|interview|survey)\b/gi
      let mp: RegExpExecArray | null
      while ((mp = methodologyPresentPattern.exec(text)) !== null) {
        const orig = mp[0]
        const past = orig.replace(/\b(collect|analyse|analyze|conduct|perform|measure|interview|survey)\b/gi, (m) => {
          const v = m.toLowerCase()
          if (v === 'collect') return 'collected'
          if (v === 'analyse' || v === 'analyze') return 'analysed'
          if (v === 'conduct') return 'conducted'
          if (v === 'perform') return 'performed'
          if (v === 'measure') return 'measured'
          if (v === 'interview') return 'interviewed'
          if (v === 'survey') return 'surveyed'
          return m
        })
        issues.push({
          type: 'tense_consistency',
          severity: 'moderate',
          message: 'Research tense: Methodology should be in past tense (e.g. "we collected", "was conducted").',
          original_text: orig,
          suggestion_text: past,
          startIndex: mp.index,
          endIndex: mp.index + orig.length,
        })
      }

      // ========== END STRICT RESEARCH RULES ==========

      // 1. Hedging & Caution Detection - Overconfident claims
      const overconfidentPatterns = [
        { 
          pattern: /\b(?:proves?|proven|definitely|always|never|all|every)\s+that\b/gi, 
          suggestion: 'suggests / indicates',
          message: 'Overconfident claim detected. Use hedging language (e.g., "suggests", "indicates", "may") to reflect uncertainty in research findings.'
        },
        { 
          pattern: /\bis\s+(?:bad|good|wrong|right|correct|incorrect)\b/gi,
          suggestion: 'may negatively affect / may positively influence',
          message: 'Absolute judgment detected. Use nuanced, evidence-based language instead of binary judgments.'
        },
        {
          pattern: /\b(?:clearly|obviously|undoubtedly|certainly)\s+(?:shows?|proves?|demonstrates?)\b/gi,
          suggestion: 'suggests / indicates',
          message: 'Overconfident language weakens academic credibility. Use hedging to acknowledge limitations.'
        },
      ]

      overconfidentPatterns.forEach(({ pattern, suggestion, message }) => {
        let hedgeMatch: RegExpExecArray | null
        while ((hedgeMatch = pattern.exec(text)) !== null) {
          const matchedText = hedgeMatch[0]
          detectorCounts.academic_hedging = (detectorCounts.academic_hedging || 0) + 1
          issues.push({
            type: 'academic_hedging',
            severity: 'high',
            message: message,
            original_text: matchedText,
            suggestion_text: suggestion,
            startIndex: hedgeMatch.index,
            endIndex: hedgeMatch.index + matchedText.length,
          })
        }
      })

      // 2. Academic Objectivity - Additional first-person patterns for research
      const researchFirstPersonPatterns = [
        { pattern: /\bwe\s+(?:think|believe|feel|consider)\b/gi, suggestion: 'The analysis indicates' },
        { pattern: /\bour\s+(?:opinion|view|belief)\b/gi, suggestion: 'The findings suggest' },
        { pattern: /\bwe\s+conclude\s+that\b/gi, suggestion: 'The evidence leads to the conclusion that' },
      ]

      researchFirstPersonPatterns.forEach(({ pattern, suggestion }) => {
        let researchFirstPersonMatch: RegExpExecArray | null
        while ((researchFirstPersonMatch = pattern.exec(text)) !== null) {
          issues.push({
            type: 'academic_objectivity',
            severity: 'high',
            message: 'Research objectivity: Avoid collective first-person opinion. Use objective, evidence-based language.',
            original_text: researchFirstPersonMatch[0],
            suggestion_text: suggestion,
            startIndex: researchFirstPersonMatch.index,
            endIndex: researchFirstPersonMatch.index + researchFirstPersonMatch[0].length,
          })
        }
      })

      // 3. Argument Completeness Warnings - Claims without citations
      const claimPatterns = [
        /\b(?:studies|research|evidence|data|findings)\s+(?:show|prove|demonstrate|indicate|suggest|reveal)\b/gi,
        /\b(?:according\s+to|as\s+(?:shown|demonstrated|indicated)\s+by)\s+(?:studies|research|evidence)\b/gi,
        /\b(?:previous|prior|earlier)\s+(?:studies|research|work|findings)\b/gi,
      ]

      // Check for citation markers near claims
      const hasCitationNearby = (index: number, contextWindow: number = 100): boolean => {
        const start = Math.max(0, index - contextWindow)
        const end = Math.min(text.length, index + contextWindow)
        const context = text.substring(start, end)
        // Look for citation patterns: [1], (Author, Year), [Author, Year], etc.
        return /\[[\d\s,]+\]|\([A-Z][a-z]+(?:\s+et\s+al\.)?,?\s+\d{4}\)|\[[A-Z][a-z]+(?:\s+et\s+al\.)?,?\s+\d{4}\]/i.test(context)
      }

      claimPatterns.forEach((pattern) => {
        let claimMatch: RegExpExecArray | null
        while ((claimMatch = pattern.exec(text)) !== null) {
          if (!hasCitationNearby(claimMatch.index)) {
            detectorCounts.academic_citation = (detectorCounts.academic_citation || 0) + 1
            issues.push({
              type: 'academic_citation',
              severity: 'moderate',
              message: 'Citation may be required.',
              original_text: claimMatch[0],
              suggestion_text: '', // No auto-suggestion, just a warning
              startIndex: claimMatch.index,
              endIndex: claimMatch.index + claimMatch[0].length,
            })
          }
        }
      })

      // 4. Section-Aware Hints (if section is provided)
      if (section && typeof section === 'string') {
        const sectionLower = section.toLowerCase()
        
        // Check for personal opinion in Abstract or Results
        if (sectionLower === 'abstract' || sectionLower === 'results') {
          const personalInAbstract = /\b(?:I|we|my|our)\s+(?:think|believe|feel|opinion|view)\b/gi
          let personalMatch: RegExpExecArray | null
          while ((personalMatch = personalInAbstract.exec(text)) !== null) {
            issues.push({
              type: 'academic_objectivity',
              severity: 'high',
              message: `Section context (${section}): Personal opinion is inappropriate here. Use objective, evidence-based language.`,
              original_text: personalMatch[0],
              suggestion_text: 'The findings indicate',
              startIndex: personalMatch.index,
              endIndex: personalMatch.index + personalMatch[0].length,
            })
          }
        }

        // Check for Results language in Introduction
        if (sectionLower === 'introduction') {
          const resultsLanguage = /\b(?:the\s+results\s+(?:show|demonstrate|indicate)|as\s+shown\s+in\s+figure|table\s+\d+)\b/gi
          let resultsMatch: RegExpExecArray | null
          while ((resultsMatch = resultsLanguage.exec(text)) !== null) {
            issues.push({
              type: 'academic_tone',
              severity: 'moderate',
              message: 'Section context (Introduction): Results-specific language should appear in the Results section, not Introduction.',
              original_text: resultsMatch[0],
              suggestion_text: '', // Just a warning
              startIndex: resultsMatch.index,
              endIndex: resultsMatch.index + resultsMatch[0].length,
            })
          }
        }
      }

      // ========================================================================
      // PART C: RESEARCH LOGIC & METHODOLOGY (PhD-LEVEL CHECKS)
      // ========================================================================
      
      // 1. Correlation vs Causation Errors
      const causationPatterns = [
        { 
          pattern: /\b(?:causes?|caused|leading\s+to|results?\s+in)\s+(?:directly|immediately|always)\s+(?:means?|leads?\s+to|results?\s+in)\b/gi,
          message: 'Methodology: Correlation vs causation error. Correlation does not imply causation. Use language that acknowledges this distinction (e.g., "is associated with", "may be related to").'
        },
        {
          pattern: /\b(?:this|these|the)\s+(?:results?|findings?|data)\s+(?:proves?|demonstrates?|shows?)\s+that\s+\w+\s+(?:causes?|directly\s+affects?|leads?\s+to)\b/gi,
          message: 'Methodology: Correlation vs causation error. Research findings show associations, not necessarily causal relationships. Use appropriate language (e.g., "is associated with", "may contribute to").'
        },
        {
          pattern: /\b(?:because|since|as)\s+(?:of|the)\s+\w+\s+(?:therefore|thus|so)\s+(?:it|this|that)\s+(?:must|will|always)\s+(?:mean|be|cause)\b/gi,
          message: 'Methodology: Logical leap from correlation to causation. Ensure causal claims are supported by appropriate research design and analysis.'
        },
      ]

      causationPatterns.forEach(({ pattern, message }) => {
        let causationMatch: RegExpExecArray | null
        while ((causationMatch = pattern.exec(text)) !== null) {
          detectorCounts.methodology = (detectorCounts.methodology || 0) + 1
          issues.push({
            type: 'methodology',
            severity: 'high',
            message: message,
            original_text: causationMatch[0],
            suggestion_text: '',
            startIndex: causationMatch.index,
            endIndex: causationMatch.index + causationMatch[0].length,
          })
        }
      })

      // 2. Unsupported Generalizations
      const generalizationPatterns = [
        {
          pattern: /\b(?:all|every|always|never|none|no\s+one)\s+(?:students?|people|researchers?|studies?|research)\s+(?:are|is|do|does|have|has)\b/gi,
          message: 'Methodology: Unsupported absolute generalization. Research rarely supports absolute claims. Use qualified language (e.g., "many", "most", "tends to", "often").'
        },
        {
          pattern: /\b(?:every|all)\s+(?:study|research|paper|analysis)\s+(?:shows?|proves?|demonstrates?|indicates?)\b/gi,
          message: 'Methodology: Overgeneralization from limited evidence. Acknowledge the scope and limitations of the evidence base.'
        },
        {
          pattern: /\b(?:it\s+is\s+(?:clear|obvious|evident|certain))\s+that\s+(?:all|every|always|never)\b/gi,
          message: 'Methodology: Absolute claim without sufficient evidence. Research requires nuanced, evidence-based language rather than absolute statements.'
        },
      ]

      generalizationPatterns.forEach(({ pattern, message }) => {
        let generalizationMatch: RegExpExecArray | null
        while ((generalizationMatch = pattern.exec(text)) !== null) {
          detectorCounts.methodology = (detectorCounts.methodology || 0) + 1
          issues.push({
            type: 'methodology',
            severity: 'high',
            message: message,
            original_text: generalizationMatch[0],
            suggestion_text: '',
            startIndex: generalizationMatch.index,
            endIndex: generalizationMatch.index + generalizationMatch[0].length,
          })
        }
      })

      // 3. Weak Methodology Descriptions
      const weakMethodologyPatterns = [
        {
          pattern: /\b(?:simple|basic|easy|straightforward)\s+(?:method|approach|analysis|technique|procedure)\b/gi,
          message: 'Methodology: Vague methodology description. PhD-level research requires precise, detailed methodology descriptions. Specify the exact methods, procedures, and analytical techniques used.'
        },
        {
          pattern: /\b(?:we\s+used\s+a|the\s+method\s+was|analysis\s+was\s+done\s+using)\s+(?:standard|common|typical|usual)\s+(?:method|approach|technique)\b/gi,
          message: 'Methodology: Insufficient methodological detail. Specify the exact methodology, including procedures, parameters, and justification for method selection.'
        },
        {
          pattern: /\b(?:data\s+was|were)\s+(?:collected|gathered|obtained)\s+(?:using|through|from)\s+(?:a|an|the)\s+(?:survey|interview|questionnaire|method)\b/gi,
          message: 'Methodology: Methodology description lacks precision. Provide detailed information about data collection procedures, instruments, sampling, and protocols.'
        },
      ]

      weakMethodologyPatterns.forEach(({ pattern, message }) => {
        let weakMethodMatch: RegExpExecArray | null
        while ((weakMethodMatch = pattern.exec(text)) !== null) {
          detectorCounts.methodology = (detectorCounts.methodology || 0) + 1
          issues.push({
            type: 'methodology',
            severity: 'moderate',
            message: message,
            original_text: weakMethodMatch[0],
            suggestion_text: '',
            startIndex: weakMethodMatch.index,
            endIndex: weakMethodMatch.index + weakMethodMatch[0].length,
          })
        }
      })

      // 4. Missing Sample Justification
      const samplePatterns = [
        {
          pattern: /\b(?:sample|participants?|subjects?|respondents?)\s+(?:of|size|number|consisted\s+of)\s+(?:\d+)\s+(?:was|were)\s+(?:selected|chosen|recruited)\b/gi,
          message: 'Methodology: Sample size justification missing. PhD-level research requires explicit justification for sample size, including power analysis, representativeness, and limitations.'
        },
        {
          pattern: /\b(?:a\s+total\s+of|total|number\s+of)\s+(?:\d+)\s+(?:participants?|subjects?|respondents?|samples?)\s+(?:were|was)\s+(?:included|recruited|selected)\b/gi,
          message: 'Methodology: Sample selection and justification required. Explain why this sample size is appropriate, how participants were selected, and address potential biases or limitations.'
        },
      ]

      // Check if sample justification language exists nearby
      const hasSampleJustification = (index: number): boolean => {
        const context = text.substring(Math.max(0, index - 200), Math.min(text.length, index + 200))
        return /(?:justification|rationale|power\s+analysis|representative|sampling\s+strategy|sample\s+size\s+calculation)/i.test(context)
      }

      samplePatterns.forEach(({ pattern, message }) => {
        let sampleMatch: RegExpExecArray | null
        while ((sampleMatch = pattern.exec(text)) !== null) {
          if (!hasSampleJustification(sampleMatch.index)) {
            detectorCounts.methodology = (detectorCounts.methodology || 0) + 1
            issues.push({
              type: 'methodology',
              severity: 'moderate',
              message: message,
              original_text: sampleMatch[0],
              suggestion_text: '',
              startIndex: sampleMatch.index,
              endIndex: sampleMatch.index + sampleMatch[0].length,
            })
          }
        }
      })

      // 5. Missing Limitations Discussion
      const limitationsPatterns = [
        {
          pattern: /\b(?:conclusion|discussion|results?|findings?)\s+(?:section|chapter|part)\b/gi,
          message: 'Methodology: Limitations discussion missing. PhD-level research requires explicit discussion of study limitations, including methodological constraints, sample limitations, and potential biases.'
        },
      ]

      // Check if limitations are discussed
      const hasLimitationsDiscussion = (): boolean => {
        return /(?:limitations?|constraints?|limitations?\s+of\s+this\s+study|study\s+limitations?|methodological\s+limitations?|potential\s+biases?|acknowledge\s+limitations?)/i.test(text)
      }

      // Only flag if text is substantial (likely a full paper) and no limitations mentioned
      if (text.length > 2000 && !hasLimitationsDiscussion()) {
        limitationsPatterns.forEach(({ pattern, message }) => {
          let limitMatch: RegExpExecArray | null
          while ((limitMatch = pattern.exec(text)) !== null) {
            detectorCounts.methodology = (detectorCounts.methodology || 0) + 1
            issues.push({
              type: 'methodology',
              severity: 'moderate',
              message: 'Methodology: This research should include a limitations section. PhD-level work requires explicit acknowledgment of study limitations, methodological constraints, and potential biases.',
              original_text: limitMatch[0],
              suggestion_text: '',
              startIndex: limitMatch.index,
              endIndex: limitMatch.index + limitMatch[0].length,
            })
            break // Only flag once
          }
        })
      }

      // ========================================================================
      // PART D: EVIDENCE & CLAIMS (ENHANCED FOR PhD)
      // ========================================================================
      
      // 1. Absolute Claims Without Data Support
      const absoluteClaimPatterns = [
        {
          pattern: /\b(?:proves?|proven|definitely|certainly|undoubtedly|without\s+doubt|no\s+question)\s+(?:that|this|it)\b/gi,
          message: 'Evidence: Absolute claim requires strong empirical support. Ensure such claims are backed by robust evidence and consider using hedging language (e.g., "suggests", "indicates", "appears to").'
        },
        {
          pattern: /\b(?:directly\s+causes?|always\s+leads?\s+to|never\s+fails?\s+to)\b/gi,
          message: 'Evidence: Absolute causal claim requires rigorous evidence. Research rarely supports absolute causal relationships. Use qualified language that acknowledges complexity and potential exceptions.'
        },
        {
          pattern: /\b(?:the\s+only|sole|exclusive)\s+(?:cause|reason|factor|explanation)\b/gi,
          message: 'Evidence: Absolute claim of exclusivity requires comprehensive evidence. Research typically involves multiple factors. Acknowledge complexity and potential alternative explanations.'
        },
      ]

      absoluteClaimPatterns.forEach(({ pattern, message }) => {
        let absoluteMatch: RegExpExecArray | null
        while ((absoluteMatch = pattern.exec(text)) !== null) {
          detectorCounts.evidence = (detectorCounts.evidence || 0) + 1
          issues.push({
            type: 'evidence',
            severity: 'high',
            message: message,
            original_text: absoluteMatch[0],
            suggestion_text: '',
            startIndex: absoluteMatch.index,
            endIndex: absoluteMatch.index + absoluteMatch[0].length,
          })
        }
      })

      // 2. Vague Quantifiers (Enhanced Detection)
      const vagueQuantifierPatterns = [
        {
          pattern: /\b(?:many|most|several|some|few|various|numerous)\s+(?:students?|people|researchers?|studies?|cases?|examples?)\b/gi,
          message: 'Evidence: Vague quantifier lacks precision. PhD-level research requires specific, measurable quantities or ranges (e.g., "52%", "approximately 200 participants", "between 15-20 studies").'
        },
        {
          pattern: /\b(?:a\s+lot\s+of|lots\s+of|plenty\s+of|tons\s+of)\s+(?:evidence|data|research|studies?)\b/gi,
          message: 'Evidence: Informal quantifier inappropriate for research. Use precise quantitative language or specific ranges.'
        },
        {
          pattern: /\b(?:significant|substantial|considerable|large|small)\s+(?:number|amount|proportion|percentage)\s+(?:of|without\s+specifying)\b/gi,
          message: 'Evidence: Vague magnitude descriptor. Specify exact numbers, percentages, or provide clear quantitative ranges.'
        },
      ]

      vagueQuantifierPatterns.forEach(({ pattern, message }) => {
        let vagueMatch: RegExpExecArray | null
        while ((vagueMatch = pattern.exec(text)) !== null) {
          detectorCounts.evidence = (detectorCounts.evidence || 0) + 1
          issues.push({
            type: 'evidence',
            severity: 'moderate',
            message: message,
            original_text: vagueMatch[0],
            suggestion_text: '',
            startIndex: vagueMatch.index,
            endIndex: vagueMatch.index + vagueMatch[0].length,
          })
        }
      })

      // ========================================================================
      // PART E: STRUCTURAL ACADEMIC QUALITY (PhD-LEVEL)
      // ========================================================================
      
      // 1. Abstract-like Clarity Expectation
      // Check for unclear or vague opening statements
      const unclearOpeningPatterns = [
        {
          pattern: /^(?:this|the|a|an)\s+(?:study|research|paper|analysis|work)\s+(?:is|was|aims?|seeks?)\s+(?:about|regarding|concerning)\s+(?:something|things?|stuff)\b/gi,
          message: 'Structure: Opening statement lacks clarity and precision. Research openings should clearly state the research question, aim, or objective with specific, measurable terms.'
        },
        {
          pattern: /^(?:in\s+this\s+(?:study|research|paper),?\s+)?(?:we|I)\s+(?:will|shall|are\s+going\s+to)\s+(?:look\s+at|examine|study|investigate)\s+(?:things?|stuff|something)\b/gi,
          message: 'Structure: Vague research statement. Clearly articulate the specific research question, objectives, or hypotheses with precise academic language.'
        },
      ]

      // Only check first 500 characters for opening clarity
      const openingText = text.substring(0, 500)
      unclearOpeningPatterns.forEach(({ pattern, message }) => {
        let unclearMatch: RegExpExecArray | null
        while ((unclearMatch = pattern.exec(openingText)) !== null) {
          detectorCounts.research_quality = (detectorCounts.research_quality || 0) + 1
          issues.push({
            type: 'research_quality',
            severity: 'moderate',
            message: message,
            original_text: unclearMatch[0],
            suggestion_text: '',
            startIndex: unclearMatch.index,
            endIndex: unclearMatch.index + unclearMatch[0].length,
          })
        }
      })

      // 2. Research Aim vs Findings Distinction
      const aimFindingsConfusionPatterns = [
        {
          pattern: /\b(?:the\s+aim|objective|purpose|goal)\s+(?:of\s+this\s+study|was|is)\s+(?:to\s+find|discover|show|prove|demonstrate)\s+that\s+(?:the\s+results?|findings?|data)\s+(?:show|indicate|suggest)\b/gi,
          message: 'Structure: Confusion between research aim and findings. Research aims state what the study intends to do; findings report what was discovered. Keep these distinct.'
        },
        {
          pattern: /\b(?:this\s+study\s+aims?\s+to|the\s+objective\s+is\s+to)\s+(?:prove|show|demonstrate)\s+(?:that|the\s+fact\s+that)\s+(?:results?|findings?|data)\s+(?:are|is|was|were)\b/gi,
          message: 'Structure: Research aim should not state expected findings. Aims describe what the study will do (e.g., "investigate", "examine", "explore"), not what it will find.'
        },
      ]

      aimFindingsConfusionPatterns.forEach(({ pattern, message }) => {
        let confusionMatch: RegExpExecArray | null
        while ((confusionMatch = pattern.exec(text)) !== null) {
          detectorCounts.research_quality = (detectorCounts.research_quality || 0) + 1
          issues.push({
            type: 'research_quality',
            severity: 'high',
            message: message,
            original_text: confusionMatch[0],
            suggestion_text: '',
            startIndex: confusionMatch.index,
            endIndex: confusionMatch.index + confusionMatch[0].length,
          })
        }
      })

      // 3. Conclusion Overreach Detection
      const conclusionOverreachPatterns = [
        {
          pattern: /\b(?:in\s+conclusion|to\s+conclude|finally|in\s+summary)\s+.*?(?:this\s+study|this\s+research|these\s+findings?)\s+(?:proves?|definitely\s+shows?|clearly\s+demonstrates?|undoubtedly\s+establishes?)\s+that\s+(?:all|every|always|never)\b/gi,
          message: 'Structure: Conclusion overreach. Conclusions should summarize findings within the scope of the study, not make absolute claims beyond the evidence presented.'
        },
        {
          pattern: /\b(?:conclusion|concluding|final\s+thoughts?)\s+.*?(?:this\s+research|this\s+study|these\s+findings?)\s+(?:solves?|resolves?|answers?)\s+(?:all|every|the\s+entire|completely)\s+(?:problem|question|issue)\b/gi,
          message: 'Structure: Conclusion overreach. Research conclusions should acknowledge scope and limitations, not claim to solve all problems or answer all questions.'
        },
        {
          pattern: /\b(?:therefore|thus|hence|consequently)\s+.*?(?:it\s+is\s+(?:clear|obvious|certain|proven))\s+that\s+(?:all|every|always|never|no\s+one|everyone)\b/gi,
          message: 'Structure: Overconfident conclusion. Conclusions should be measured and acknowledge the limitations of the evidence, not make absolute claims.'
        },
      ]

      conclusionOverreachPatterns.forEach(({ pattern, message }) => {
        let overreachMatch: RegExpExecArray | null
        while ((overreachMatch = pattern.exec(text)) !== null) {
          detectorCounts.research_quality = (detectorCounts.research_quality || 0) + 1
          issues.push({
            type: 'research_quality',
            severity: 'high',
            message: message,
            original_text: overreachMatch[0],
            suggestion_text: '',
            startIndex: overreachMatch.index,
            endIndex: overreachMatch.index + overreachMatch[0].length,
          })
        }
      })

      // 4. Recommendation Validity Check
      const recommendationPatterns = [
        {
          pattern: /\b(?:recommendations?|suggestions?|implications?)\s+(?:are|is|include|should\s+be)\s+(?:that|to)\s+(?:all|every|always|never)\s+(?:should|must|need\s+to|ought\s+to)\b/gi,
          message: 'Structure: Overly broad recommendations. Recommendations should be specific, actionable, and justified by the research findings, not absolute or universal claims.'
        },
        {
          pattern: /\b(?:based\s+on\s+this\s+study|these\s+findings?|this\s+research)\s+.*?(?:all|every|always|never)\s+(?:should|must|need\s+to|ought\s+to|have\s+to)\s+(?:do|be|implement|adopt)\b/gi,
          message: 'Structure: Recommendations exceed study scope. Recommendations should be specific to the context and findings of the research, not universal mandates.'
        },
        {
          pattern: /\b(?:the\s+results?\s+(?:show|indicate|suggest))\s+that\s+(?:all|every|always|never)\s+(?:institutions?|organizations?|researchers?|practitioners?)\s+(?:should|must|need\s+to)\b/gi,
          message: 'Structure: Overgeneralized recommendations. Base recommendations on the specific findings and acknowledge limitations in generalizability.'
        },
      ]

      recommendationPatterns.forEach(({ pattern, message }) => {
        let recMatch: RegExpExecArray | null
        while ((recMatch = pattern.exec(text)) !== null) {
          detectorCounts.research_quality = (detectorCounts.research_quality || 0) + 1
          issues.push({
            type: 'research_quality',
            severity: 'moderate',
            message: message,
            original_text: recMatch[0],
            suggestion_text: '',
            startIndex: recMatch.index,
            endIndex: recMatch.index + recMatch[0].length,
          })
        }
      })

      // ========================================================================
      // PART A: ADVANCED LANGUAGE & GRAMMAR (PhD-LEVEL ENHANCEMENTS)
      // ========================================================================
      
      // 1. Tense Consistency Across Paragraphs (Advanced)
      // This is a heuristic: check for tense shifts within close proximity
      const tenseShiftPatterns = [
        {
          pattern: /\b(?:this\s+study|the\s+research|the\s+analysis)\s+(?:was|were)\s+(?:conducted|performed|carried\s+out)\s+.*?(?:the\s+results?\s+(?:show|shows|indicate|indicates|suggest|suggests))\b/gi,
          message: 'Grammar: Tense inconsistency. Past tense for methodology ("was conducted") should be followed by past tense for results ("showed", "indicated") or present tense for general statements ("shows", "indicates"). Maintain consistent tense within sections.'
        },
        {
          pattern: /\b(?:previous|prior|earlier)\s+(?:studies?|research|work)\s+(?:shows?|showed|indicates?|indicated|suggests?|suggested)\s+.*?(?:this\s+study|the\s+current\s+research)\s+(?:show|shows|indicate|indicates)\b/gi,
          message: 'Grammar: Tense consistency required. When referring to previous research, use past tense ("showed", "indicated"); when stating general facts or current findings, use present tense ("shows", "indicates").'
        },
      ]

      tenseShiftPatterns.forEach(({ pattern, message }) => {
        let tenseMatch: RegExpExecArray | null
        while ((tenseMatch = pattern.exec(text)) !== null) {
          issues.push({
            type: 'grammar',
            severity: 'moderate',
            message: message,
            original_text: tenseMatch[0],
            suggestion_text: '',
            startIndex: tenseMatch.index,
            endIndex: tenseMatch.index + tenseMatch[0].length,
          })
        }
      })

      // 2. Nominalization Over Verb-Heavy Phrasing
      const verbHeavyPatterns = [
        {
          pattern: /\b(?:we|I|they|the\s+researchers?)\s+(?:decided|chose|selected|picked|used|utilized|applied|employed)\s+(?:to|a|an|the)\s+(?:method|approach|technique|procedure)\b/gi,
          message: 'Grammar: Verb-heavy phrasing. Academic writing often benefits from nominalization (noun forms). Consider: "The selection of the method" instead of "We selected the method".'
        },
        {
          pattern: /\b(?:we|I|they)\s+(?:analyzed|examined|investigated|studied|explored)\s+(?:the|a|an)\s+(?:data|results?|findings?)\b/gi,
          message: 'Grammar: Consider nominalization for more formal academic tone. Instead of "We analyzed the data", consider "The analysis of the data" or "Data analysis revealed".'
        },
      ]

      verbHeavyPatterns.forEach(({ pattern, message }) => {
        let verbMatch: RegExpExecArray | null
        while ((verbMatch = pattern.exec(text)) !== null) {
          issues.push({
            type: 'grammar',
            severity: 'low',
            message: message,
            original_text: verbMatch[0],
            suggestion_text: '',
            startIndex: verbMatch.index,
            endIndex: verbMatch.index + verbMatch[0].length,
          })
        }
      })

      // 3. Passive Voice Overuse Detection (Flag, not ban)
      // Count passive voice patterns and flag if excessive
      const passivePatterns = [
        /\b(?:was|were|is|are)\s+(?:conducted|performed|carried\s+out|done|completed|analyzed|examined|investigated|studied|explored|measured|collected|gathered|obtained|selected|chosen|recruited|included|excluded)\b/gi,
        /\b(?:by\s+the|by\s+a|by\s+an)\s+(?:researchers?|authors?|team|study|research)\b/gi,
      ]

      let passiveCount = 0
      passivePatterns.forEach(pattern => {
        let passiveMatch: RegExpExecArray | null
        while ((passiveMatch = pattern.exec(text)) !== null) {
          passiveCount++
        }
      })

      // Flag if more than 10 passive constructions in substantial text
      if (text.length > 1000 && passiveCount > 10) {
        issues.push({
          type: 'style',
          severity: 'low',
          message: 'Style: Excessive passive voice detected. While passive voice is appropriate in methodology sections, consider using active voice where it improves clarity and readability, especially in results and discussion sections.',
          original_text: '',
          suggestion_text: '',
          startIndex: 0,
          endIndex: 0,
        })
      }
    }

    // ========================================================================
    // ACADEMIC STANDARD SPECIFIC CHECKS (undergraduate + PhD: both run these)
    // ========================================================================
    if (isAcademicStandard || isAcademicResearch) {
      // ---------- Academic Standard extended rules (A–E): formal grammar, uncountable, phrasing, articles, consistency ----------
      if (options.grammar !== false) {
        // A) Formal grammar: plural subject + has → have; singular subject + have → has; modal + -s → base form
        const agreementPatterns: { pattern: RegExp; suggestion: string; message: string }[] = [
          { pattern: /\b(researchers?|studies|platforms|participants?|students?|findings|results|data)\s+has\b/gi, suggestion: 'have', message: 'Agreement: Use "have" with plural subjects.' },
          { pattern: /\b(researchers?|studies|platforms|participants?|students?|findings|results)\s+influences?\b/gi, suggestion: 'influence', message: 'Agreement: Use plural verb form with plural subjects.' },
          { pattern: /\b(organisation|organization|study|research|evidence|use|analysis)\s+have\b/gi, suggestion: 'has', message: 'Agreement: Use "has" with singular subjects.' },
          { pattern: /\b(study|research|paper|analysis)\s+highlight\b/gi, suggestion: 'highlights', message: 'Agreement: Use third-person singular verb with singular subject.' },
          { pattern: /\bcan\s+provides?\b/gi, suggestion: 'provide', message: 'Grammar: After modal "can", use base form of the verb.' },
          { pattern: /\bmay\s+leads?\b/gi, suggestion: 'lead', message: 'Grammar: After modal "may", use base form of the verb.' },
        ]
        agreementPatterns.forEach(({ pattern, suggestion, message }) => {
          let m: RegExpExecArray | null
          while ((m = pattern.exec(text)) !== null) {
            const orig = m[0]
            const sug = orig.replace(/\b(has|have|influences?|highlight|provides?|leads?)\b/i, suggestion)
            if (sug !== orig) {
              detectorCounts.agreement = (detectorCounts.agreement || 0) + 1
              issues.push({ type: 'agreement', severity: 'moderate', message, original_text: orig, suggestion_text: sug, startIndex: m.index, endIndex: m.index + orig.length })
            }
          }
        })
        // Modal + -s form: could/would/should/might/must + verb with -s/-es (base form needed)
        const modalVerbMap: { pattern: RegExp; suggestion: string; message: string }[] = [
          { pattern: /\b(could|would|should|might|must)\s+leads\b/gi, suggestion: 'lead', message: 'Grammar: After modal, use base form "lead".' },
          { pattern: /\b(could|would|should|might|must)\s+provides\b/gi, suggestion: 'provide', message: 'Grammar: After modal, use base form "provide".' },
          { pattern: /\b(could|would|should|might|must)\s+shows\b/gi, suggestion: 'show', message: 'Grammar: After modal, use base form "show".' },
          { pattern: /\b(could|would|should|might|must)\s+suggests\b/gi, suggestion: 'suggest', message: 'Grammar: After modal, use base form "suggest".' },
          { pattern: /\b(could|would|should|might|must)\s+indicates\b/gi, suggestion: 'indicate', message: 'Grammar: After modal, use base form "indicate".' },
        ]
        modalVerbMap.forEach(({ pattern, suggestion, message }) => {
          let mv: RegExpExecArray | null
          while ((mv = pattern.exec(text)) !== null) {
            const orig = mv[0]
            const sug = orig.replace(/\b(leads|provides|shows|suggests|indicates)\b/gi, suggestion)
            if (sug !== orig) {
              detectorCounts.agreement = (detectorCounts.agreement || 0) + 1
              issues.push({ type: 'agreement', severity: 'moderate', message, original_text: orig, suggestion_text: sug, startIndex: mv.index, endIndex: mv.index + orig.length })
            }
          }
        })

        // A) Quantifier + singular noun → plural (e.g. "5 student" → "5 students", "many participant" → "many participants")
        const quantifierPluralRegex = /\b(one|two|three|four|five|six|seven|eight|nine|\d+|many|several|few|multiple)\s+(student|participant|respondent|subject)\b/gi
        let qm: RegExpExecArray | null
        while ((qm = quantifierPluralRegex.exec(text)) !== null) {
          const noun = qm[2]
          const plural = noun + 's'
          if (noun.toLowerCase() !== plural.toLowerCase()) {
            detectorCounts.agreement = (detectorCounts.agreement || 0) + 1
            issues.push({ type: 'agreement', severity: 'moderate', message: 'Agreement: Use plural noun after numbers or quantifiers.', original_text: qm[0], suggestion_text: qm[1] + ' ' + plural, startIndex: qm.index, endIndex: qm.index + qm[0].length })
          }
        }

        // B) Uncountable nouns: plural form → singular
        const uncountableMap: [RegExp, string][] = [
          [/\binformations\b/gi, 'information'],
          [/\bevidences\b/gi, 'evidence'],
          [/\bresearches\b/gi, 'research'],
          [/\badvices\b/gi, 'advice'],
          [/\bequipments\b/gi, 'equipment'],
        ]
        uncountableMap.forEach(([pattern, replacement]) => {
          let um: RegExpExecArray | null
          while ((um = pattern.exec(text)) !== null) {
            detectorCounts.uncountable = (detectorCounts.uncountable || 0) + 1
            issues.push({ type: 'uncountable', severity: 'moderate', message: 'Uncountable noun: Use singular form in academic English.', original_text: um[0], suggestion_text: replacement, startIndex: um.index, endIndex: um.index + um[0].length })
          }
        })

        // C) Academic phrasing
        const phrasingPatterns: { pattern: RegExp; suggestion: string; message: string }[] = [
          { pattern: /\bthe\s+way\s+how\b/gi, suggestion: 'the way', message: 'Academic style: Prefer "the way" instead of "the way how".' },
          { pattern: /\bresponsible\s+to\s+manage\b/gi, suggestion: 'responsible for managing', message: 'Academic style: Use "responsible for" + -ing form.' },
        ]
        phrasingPatterns.forEach(({ pattern, suggestion, message }) => {
          let pm: RegExpExecArray | null
          while ((pm = pattern.exec(text)) !== null) {
            detectorCounts.academic_style = (detectorCounts.academic_style || 0) + 1
            issues.push({ type: 'academic_style', severity: 'moderate', message, original_text: pm[0], suggestion_text: suggestion, startIndex: pm.index, endIndex: pm.index + pm[0].length })
          }
        })
        // Adjective after verb → adverb (common cases)
        const adjToAdv: [RegExp, string][] = [
          [/\b(work|operate|function|perform)\s+efficient\b/gi, 'efficiently'],
          [/\b(respond|react|behave)\s+calm\b/gi, 'calmly'],
          [/\b(communicate|write|speak)\s+clear\b/gi, 'clearly'],
          [/\b(study|analyze|examine)\s+careful\b/gi, 'carefully'],
          [/\b(conduct|perform)\s+proper\b/gi, 'properly'],
        ]
        adjToAdv.forEach(([pattern, adverb]) => {
          let am: RegExpExecArray | null
          while ((am = pattern.exec(text)) !== null) {
            detectorCounts.academic_style = (detectorCounts.academic_style || 0) + 1
            issues.push({ type: 'academic_style', severity: 'moderate', message: 'Academic style: Use adverb after verb (e.g. "efficiently" not "efficient").', original_text: am[0], suggestion_text: am[0].replace(/\b(efficient|calm|clear|careful|proper)\b/i, adverb), startIndex: am.index, endIndex: am.index + am[0].length })
          }
        })

        // D) Article & formal
        const articlePatterns: { pattern: RegExp; suggestion: string; message: string }[] = [
          { pattern: /\bmotivated\s+person\b/gi, suggestion: 'a motivated person', message: 'Article: Use indefinite article before singular countable noun.' },
          { pattern: /\bone\s+of\s+the\s+best\s+company\b/gi, suggestion: 'one of the best companies', message: 'Agreement: Use plural noun after "one of the best".' },
          { pattern: /\bin\s+retail\s+sector\b/gi, suggestion: 'in the retail sector', message: 'Article: Use definite article in formal reference to sector.' },
          { pattern: /\bof\s+retail\s+sector\b/gi, suggestion: 'of the retail sector', message: 'Article: Use definite article in formal reference to sector.' },
        ]
        articlePatterns.forEach(({ pattern, suggestion, message }) => {
          let apm: RegExpExecArray | null
          while ((apm = pattern.exec(text)) !== null) {
            detectorCounts.article = (detectorCounts.article || 0) + 1
            issues.push({ type: 'article', severity: 'low', message, original_text: apm[0], suggestion_text: suggestion, startIndex: apm.index, endIndex: apm.index + apm[0].length })
          }
        })

        // E) Subject-verb agreement with abstract singular nouns (research/evidence/use + plural verb → singular)
        const abstractSVA: { pattern: RegExp; suggestion: string }[] = [
          { pattern: /\bresearch\s+show\b/gi, suggestion: 'research shows' },
          { pattern: /\bevidence\s+suggest\b/gi, suggestion: 'evidence suggests' },
          { pattern: /\buse\s+indicate\b/gi, suggestion: 'use indicates' },
          { pattern: /\bdata\s+show\b/gi, suggestion: 'data shows' },
        ]
        abstractSVA.forEach(({ pattern, suggestion }) => {
          let sm: RegExpExecArray | null
          while ((sm = pattern.exec(text)) !== null) {
            detectorCounts.agreement = (detectorCounts.agreement || 0) + 1
            issues.push({ type: 'agreement', severity: 'moderate', message: 'Agreement: Use singular verb with singular abstract subject.', original_text: sm[0], suggestion_text: suggestion, startIndex: sm.index, endIndex: sm.index + sm[0].length })
          }
        })
      }

      // 1️⃣ Claim Strength & Hedging
      // Detect overly strong or absolute claims
      const strongClaimPatterns = [
        { pattern: /\bclearly\s+proves?\b/gi, phrase: 'clearly proves' },
        { pattern: /\bdefinitely\s+shows?\b/gi, phrase: 'definitely shows' },
        { pattern: /\balways\s+(?:means|leads|results|causes)\b/gi, phrase: 'always' },
        { pattern: /\bnever\s+(?:means|leads|results|causes)\b/gi, phrase: 'never' },
        { pattern: /\bproves?\s+that\b/gi, phrase: 'proves that' },
      ]

      strongClaimPatterns.forEach(({ pattern, phrase }) => {
        let claimMatch: RegExpExecArray | null
        while ((claimMatch = pattern.exec(text)) !== null) {
          detectorCounts.academic_logic = (detectorCounts.academic_logic || 0) + 1
          issues.push({
            type: 'academic_logic',
            severity: 'moderate',
            message: 'Academic logic: Overly strong claim detected. Consider softening using academic hedging (e.g., "suggests", "appears to", "may indicate").',
            original_text: claimMatch[0],
            suggestion_text: '', // No auto-suggestion, educational feedback only
            startIndex: claimMatch.index,
            endIndex: claimMatch.index + claimMatch[0].length,
          })
        }
      })

      // 2️⃣ Clarity & Precision
      // Detect vague or imprecise academic statements
      const vaguePatterns = [
        { pattern: /\bthis\s+is\s+very\s+important\b/gi, phrase: 'This is very important' },
        { pattern: /\bsomething\s+should\s+be\s+improved\b/gi, phrase: 'Something should be improved' },
        { pattern: /\bmany\s+(?:students|people|researchers|studies)\b/gi, phrase: 'Many' },
      ]

      vaguePatterns.forEach(({ pattern, phrase }) => {
        let vagueMatch: RegExpExecArray | null
        while ((vagueMatch = pattern.exec(text)) !== null) {
          detectorCounts.clarity = (detectorCounts.clarity || 0) + 1
          issues.push({
            type: 'clarity',
            severity: 'low',
            message: 'Clarity: Vague or imprecise statement detected. Consider clarifying what exactly is meant to improve academic precision.',
            original_text: vagueMatch[0],
            suggestion_text: '', // No auto-suggestion, educational feedback only
            startIndex: vagueMatch.index,
            endIndex: vagueMatch.index + vagueMatch[0].length,
          })
        }
      })

      // 3️⃣ Paragraph Focus (Unity)
      // Detect paragraphs that mix personal opinion, findings, conclusions, recommendations
      // This is a heuristic check: look for opinion markers followed by findings/recommendations in the same sentence
      const mixedFocusPatterns = [
        { 
          pattern: /\b(?:I\s+think|I\s+believe|In\s+my\s+opinion|I\s+feel)\s+.*?(?:the\s+results|the\s+findings|the\s+data|it\s+shows|it\s+indicates)\b/gi,
          message: 'Structure: This paragraph mixes personal opinion with findings. Academic writing is clearer when opinions, findings, and recommendations are separated into distinct paragraphs.'
        },
        {
          pattern: /\b(?:the\s+results|the\s+findings|the\s+data)\s+.*?(?:should|must|need\s+to|recommend)\b/gi,
          message: 'Structure: This paragraph mixes findings with recommendations. Consider separating findings and recommendations into distinct paragraphs for better clarity.'
        },
      ]

      mixedFocusPatterns.forEach(({ pattern, message }) => {
        let mixedMatch: RegExpExecArray | null
        while ((mixedMatch = pattern.exec(text)) !== null) {
          // Only flag if the match spans a reasonable sentence length (not too short)
          if (mixedMatch[0].length > 30) {
            detectorCounts.structure = (detectorCounts.structure || 0) + 1
            issues.push({
              type: 'structure',
              severity: 'low',
              message: message,
              original_text: mixedMatch[0].substring(0, 60) + (mixedMatch[0].length > 60 ? '...' : ''),
              suggestion_text: '', // No auto-suggestion, educational feedback only
              startIndex: mixedMatch.index,
              endIndex: Math.min(mixedMatch.index + 100, mixedMatch.index + mixedMatch[0].length),
            })
          }
        }
      })

      // 4️⃣ Academic Register Consistency
      // Detect informal or conversational language
      const informalAcademicPatterns = [
        { pattern: /\breally\s+good\b/gi, phrase: 'really good' },
        { pattern: /\bvery\s+bad\b/gi, phrase: 'very bad' },
        { pattern: /\ba\s+lot\s+of\b/gi, phrase: 'a lot of' }, // When overused in academic context
      ]

      informalAcademicPatterns.forEach(({ pattern, phrase }) => {
        let informalMatch: RegExpExecArray | null
        while ((informalMatch = pattern.exec(text)) !== null) {
          detectorCounts.academic_style = (detectorCounts.academic_style || 0) + 1
          issues.push({
            type: 'academic_style',
            severity: 'low',
            message: 'Academic style: Informal or conversational language detected. Consider replacing informal expressions with more formal academic language.',
            original_text: informalMatch[0],
            suggestion_text: '', // No auto-suggestion, educational feedback only
            startIndex: informalMatch.index,
            endIndex: informalMatch.index + informalMatch[0].length,
          })
        }
      })

      // 5️⃣ Conclusion Quality (Standard Level)
      // Detect conclusions that evaluate research quality or repeat without summarizing
      const weakConclusionPatterns = [
        { 
          pattern: /\bthis\s+(?:study|research|paper|analysis)\s+is\s+(?:really|very)\s+(?:good|bad|important|useful)\b/gi,
          message: 'Academic logic: Conclusion evaluates research quality. Academic conclusions should summarize findings and implications rather than evaluate the quality of the research.'
        },
        {
          pattern: /\b(?:in\s+conclusion|to\s+conclude|finally)\s+.*?(?:this\s+study|this\s+research|this\s+paper)\s+(?:is|was|has|does)\s+(?:the\s+same|similar|repeated|again)\b/gi,
          message: 'Academic logic: Conclusion appears to repeat content without summarizing key findings. Academic conclusions should synthesize and summarize main findings and their implications.'
        },
      ]

      weakConclusionPatterns.forEach(({ pattern, message }) => {
        let conclusionMatch: RegExpExecArray | null
        while ((conclusionMatch = pattern.exec(text)) !== null) {
          detectorCounts.academic_logic = (detectorCounts.academic_logic || 0) + 1
          issues.push({
            type: 'academic_logic',
            severity: 'low',
            message: message,
            original_text: conclusionMatch[0],
            suggestion_text: '', // No auto-suggestion, educational feedback only
            startIndex: conclusionMatch.index,
            endIndex: conclusionMatch.index + conclusionMatch[0].length,
          })
        }
      })
    }

    // ========================================================================
    // CLARITY CHECKS (both modes, but different feedback)
    // ========================================================================
    if (options.clarity !== false) {
      // Long sentences (over 40 words) - more strict in academic
      const sentences = text.split(/[.!?]+/)
      let currentIndex = 0
      sentences.forEach((sentence) => {
        const words = sentence.trim().split(/\s+/).filter(w => w.length > 0)
        const maxWords = isAcademicResearch ? 30 : (isAcademicStandard ? 35 : 40)
        if (words.length > maxWords) {
          const sentenceStart = text.indexOf(sentence.trim(), currentIndex)
          if (sentenceStart >= 0) {
            detectorCounts.clarity = (detectorCounts.clarity || 0) + 1
            issues.push({
              type: 'clarity',
              severity: isAcademic ? 'moderate' : 'low',
              message: isAcademicStandard
                ? 'Clarity: This sentence is too long for academic writing. Consider breaking it into shorter, clearer sentences.'
                : isAcademicResearch
                ? 'Clarity: Long sentences reduce readability in research writing. Break into shorter, focused sentences.'
                : 'This sentence is quite long. Consider breaking it into shorter sentences for better clarity.',
              original_text: sentence.trim().substring(0, 50) + '...',
              suggestion_text: '', // No auto-suggestion for clarity
              startIndex: sentenceStart,
              endIndex: sentenceStart + sentence.trim().length,
            })
          }
        }
        currentIndex += sentence.length + 1
      })
    }

    // Deduplicate: same type + original + suggestion = one issue (stable key)
    const issueKey = (i: Issue) =>
      `${i.type}-${(i.original_text || '').trim().toLowerCase()}-${(i.suggestion_text || '').trim().toLowerCase()}`
    const seenKeys = new Set<string>()
    const dedupedIssues: Issue[] = []
    issues.sort((a, b) => a.startIndex - b.startIndex)
    for (const issue of issues) {
      const key = issueKey(issue)
      if (seenKeys.has(key)) continue
      seenKeys.add(key)
      dedupedIssues.push(issue)
    }

    // Remove overlapping issues (keep first, skip later)
    const nonOverlapping: Issue[] = []
    for (const issue of dedupedIssues) {
      const overlaps = nonOverlapping.some(existing => {
        return (
          (issue.startIndex >= existing.startIndex && issue.startIndex < existing.endIndex) ||
          (issue.endIndex > existing.startIndex && issue.endIndex <= existing.endIndex) ||
          (issue.startIndex <= existing.startIndex && issue.endIndex >= existing.endIndex)
        )
      })
      if (!overlaps) {
        nonOverlapping.push(issue)
      }
    }

    // Ensure all issues have required fields. General & academic_research: no cap (full-document sweep); academic_standard: cap 50.
    const maxIssues = mode === 'academic_research' ? undefined : (mode === 'general' ? undefined : 50)
    const capped = maxIssues != null ? nonOverlapping.slice(0, maxIssues) : nonOverlapping
    const validatedIssues = capped.map(issue => {
      // Clamp indices to valid range (0-based character offsets)
      const start = Math.max(0, Math.min(issue.startIndex, text.length))
      const end = Math.max(start, Math.min(issue.endIndex, text.length))
      
      // Extract original_text from content - NEVER allow null
      let originalText = issue.original_text || ''
      if (!originalText || originalText.trim() === '') {
        originalText = extractText(start, end)
      } else {
        // Verify the extracted text matches (sanity check)
        const extracted = extractText(start, end)
        if (extracted && extracted.toLowerCase() !== originalText.toLowerCase()) {
          // Use extracted text if it's different (more accurate)
          originalText = extracted
        }
      }
      
      // Final validation: if original_text is still empty/null, skip this issue
      if (!originalText || originalText.trim() === '') {
        if (process.env.NODE_ENV === 'development') {
          console.log('[analyze][dev] Filtered out issue: reason=empty original_text, type=', issue.type, 'message=', issue.message?.slice(0, 50))
        }
        return null
      }
      
      // Repetition: action = delete, suggestion_text = ''
      const isRepetition = issue.type === 'repetition'
      const suggestionText = isRepetition ? '' : (issue.suggestion_text || '')
      const action: IssueAction = isRepetition ? 'delete' : 'replace'
      
      const ruleTypeMap: Record<string, RuleType> = {
        grammar: 'grammar',
        spelling: 'spelling',
        repetition: 'repetition',
        word_form: 'wordForm',
        tense: 'tense',
        tense_consistency: 'tense',
        style: 'style',
        clarity: 'clarity',
        preposition: 'preposition',
        agreement: 'agreement',
        article: 'article',
        uncountable: 'uncountable',
        research_grammar: 'research_grammar',
        punctuation: 'punctuation',
      }
      const ruleType: RuleType = (issue as Issue).ruleType ?? ruleTypeMap[issue.type] ?? 'grammar'

      return {
        id: crypto.randomUUID(),
        type: toDisplayIssueType(issue.type),
        severity: issue.severity,
        message: issue.message || '',
        original_text: originalText,
        suggestion_text: suggestionText,
        start,
        end,
        startIndex: start,
        endIndex: end,
        action,
        ruleType,
      }
    }).filter((issue): issue is NonNullable<typeof issue> => issue !== null) // Remove nulls

    // Count issues by type for logging
    const issueTypeCounts: Record<string, number> = {}
    validatedIssues.forEach(issue => {
      issueTypeCounts[issue.type] = (issueTypeCounts[issue.type] || 0) + 1
    })
    
    // Logging: Mode, detector counts, and returned issue types
    console.log('[analyze] Mode:', mode, '| Detector counts:', detectorCounts)
    console.log('[analyze] Returned issue types:', [...new Set(validatedIssues.map(i => i.type))])
    console.log('[analyze] Issue type counts:', issueTypeCounts)
    console.log('[analyze] Total issues:', validatedIssues.length)

    if (process.env.NODE_ENV === 'development') {
      console.log('[analyze][dev] Issues by category:', issueTypeCounts)
      console.log('[analyze][dev] Issues with no suggestion (Tip-only):', validatedIssues.filter(i => !(i.suggestion_text && i.suggestion_text.trim())).length)
    }

    return NextResponse.json({
      ok: true,
      issues: validatedIssues,
      metadata: {
        writing_mode: mode,
        academic_level: isAcademicResearch ? 'phd' : (isAcademicStandard ? 'standard' : 'general'),
        total_issues: validatedIssues.length,
        section: section || null,
      },
    })
  } catch (error: any) {
    console.error("ANALYZE ERROR:", error)
    return NextResponse.json(
      { 
        ok: false, 
        stage: "analyze", 
        message: error?.message ?? String(error) 
      },
      { status: 500 }
    )
  }
}
