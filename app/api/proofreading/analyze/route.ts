import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

type WritingMode = 'general' | 'academic' | 'academic_research'
type IssueType = 'grammar' | 'spelling' | 'style' | 'clarity' | 'academic_tone' | 'academic_objectivity' | 'academic_hedging' | 'academic_citation' | 'academic_logic' | 'structure' | 'academic_style' | 'methodology' | 'evidence' | 'research_quality'
type Severity = 'low' | 'moderate' | 'high'

interface Issue {
  type: IssueType
  severity: Severity
  message: string
  original_text: string
  suggestion_text: string
  startIndex: number
  endIndex: number
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

    const { documentId, content, mode = 'general', options = {}, section } = body

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
    
    // Track issue counts by detector type
    const detectorCounts: Record<string, number> = {
      spelling: 0,
      grammar: 0,
      style: 0,
      clarity: 0,
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

      // "there" vs "their" vs "they're"
      const thereTheirRegex = /\b(?:there|their)\s+(?:is|was|are|were)\b/gi
      let thereMatch: RegExpExecArray | null
      while ((thereMatch = thereTheirRegex.exec(text)) !== null) {
        const word = thereMatch[0].split(/\s+/)[0]
        if (word.toLowerCase() === 'there' || word.toLowerCase() === 'their') {
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
        issues.push({
          type: 'grammar',
          severity: 'low',
          message: 'Multiple spaces detected',
          original_text: doubleSpaceMatch[0],
          suggestion_text: ' ',
          startIndex: doubleSpaceMatch.index,
          endIndex: doubleSpaceMatch.index + doubleSpaceMatch[0].length,
        })
      }

      // Subject-verb agreement: "students is" -> "students are"
      const studentsIsRegex = /\bstudents\s+is\b/gi
      let studentsIsMatch: RegExpExecArray | null
      while ((studentsIsMatch = studentsIsRegex.exec(text)) !== null) {
        const isIndex = text.indexOf('is', studentsIsMatch.index)
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
    // ACADEMIC RESEARCH / PhD SPECIFIC CHECKS
    // ========================================================================
    if (isAcademicResearch) {
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
              message: 'Citation warning: This claim may require a citation to support the statement. Consider adding a reference.',
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
    // ACADEMIC STANDARD SPECIFIC CHECKS (undergraduate/university level)
    // ========================================================================
    if (isAcademicStandard) {
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

    // Sort issues by startIndex
    issues.sort((a, b) => a.startIndex - b.startIndex)

    // Remove overlapping issues (keep first, skip later)
    const nonOverlapping: Issue[] = []
    for (const issue of issues) {
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

    // Ensure all issues have required fields (original_text must never be null)
    const validatedIssues = nonOverlapping.slice(0, 50).map(issue => {
      // Clamp indices to valid range
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
        console.warn('[analyze] Skipping issue with empty original_text:', issue.type, issue.message)
        return null
      }
      
      return {
        type: issue.type,
        severity: issue.severity,
        message: issue.message || '',
        original_text: originalText, // Guaranteed non-empty
        suggestion_text: issue.suggestion_text || '', // Can be empty for clarity issues
        startIndex: start,
        endIndex: end,
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
