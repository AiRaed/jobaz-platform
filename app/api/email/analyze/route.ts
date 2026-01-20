import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/email/analyze
 * Analyzes email text using proofreading logic.
 * Reuses existing proofreading analysis but adapted for email context.
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
      console.error('[Email Analyze] JSON parse error:', parseError)
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

    const { messageId, fullText, context, options = {} } = body

    if (!fullText || typeof fullText !== 'string') {
      return NextResponse.json(
        { 
          ok: false, 
          message: 'fullText is required and must be a string',
          code: 'MISSING_FULL_TEXT',
          details: 'fullText parameter is missing or invalid'
        },
        { status: 400 }
      )
    }

    // Defensive validation: content must have at least 5 characters
    if (!fullText.trim() || fullText.trim().length < 5) {
      return NextResponse.json(
        { 
          ok: false, 
          message: 'Email text must be at least 5 characters long',
          code: 'CONTENT_TOO_SHORT',
          details: 'Email text is too short for analysis'
        },
        { status: 400 }
      )
    }

    // Get context from request or use defaults
    const recipientType = context?.recipient_type || 'Manager'
    const purpose = context?.purpose || 'general'
    const requiredTone = context?.tone || 'Professional'

    // Parse email parts
    const emailParts = parseEmailParts(fullText)
    const { subject, greeting, body: emailBody, closing, signature } = emailParts

    const issues: Array<{
      type: 'spelling' | 'grammar' | 'style' | 'tone' | 'structure' | 'professionalism' | 'clarity'
      severity: 'low' | 'moderate' | 'high'
      message: string
      explanation?: string
      original_text: string
      suggestion_text: string
      startIndex: number
      endIndex: number
    }> = []
    const text = fullText

    // Helper function to safely extract text from content at given indices
    const extractText = (start: number, end: number): string => {
      if (start < 0 || end < 0 || start >= text.length || end > text.length || start >= end) {
        return ''
      }
      return text.substring(start, end)
    }

    // Helper function to parse email into parts
    function parseEmailParts(fullText: string) {
      const lines = fullText.split('\n').map(line => line.trim())
      let subject = ''
      let greeting = ''
      let body = ''
      let closing = ''
      let signature = ''

      // Extract subject
      const subjectMatch = fullText.match(/^Subject:\s*(.+)$/im)
      if (subjectMatch) {
        subject = subjectMatch[1].trim()
      }

      // Extract greeting
      const greetingPattern = /^(Dear|Hello|Hi|Greetings|Good morning|Good afternoon|Good evening).*/i
      for (const line of lines) {
        if (greetingPattern.test(line)) {
          greeting = line
          break
        }
      }

      // Extract closing
      const closingPattern = /^(Sincerely|Best regards|Regards|Yours sincerely|Best|Thanks|Thank you)/i
      for (let i = lines.length - 1; i >= 0; i--) {
        if (closingPattern.test(lines[i])) {
          closing = lines[i]
          break
        }
      }

      // Body is everything between greeting and closing
      const greetingIndex = greeting ? lines.indexOf(greeting) : -1
      const closingIndex = closing ? lines.indexOf(closing) : -1
      const bodyStart = greetingIndex >= 0 ? greetingIndex + 1 : 0
      const bodyEnd = closingIndex >= 0 ? closingIndex : lines.length
      body = lines.slice(bodyStart, bodyEnd).join('\n').trim()

      // Signature is after closing
      if (closingIndex >= 0 && closingIndex < lines.length - 1) {
        signature = lines.slice(closingIndex + 1).join('\n').trim()
      }

      return { subject, greeting, body, closing, signature }
    }

    // ========================================================================
    // 1. SPELLING CHECKS
    // ========================================================================
    if (options.spelling !== false) {
      const spellingChecks = [
        { 
          regex: /\balot\b/gi, 
          original: 'alot', 
          suggestion: 'a lot',
          explanation: '"alot" is not a word. Use "a lot" (two words) in professional communication.'
        },
        { 
          regex: /\bits\s+(?:is|was|will|has|had)\b/gi, 
          original: 'its', 
          suggestion: "it's",
          explanation: 'Use "it\'s" (contraction of "it is") here, not "its" (possessive).'
        },
        { 
          regex: /\byour\s+welcom\b/gi, 
          original: 'welcom', 
          suggestion: 'welcome',
          explanation: 'Correct spelling is "welcome".'
        },
        { 
          regex: /\breciev\w+/gi, 
          original: 'reciev', 
          suggestion: 'receive',
          explanation: 'Correct spelling: "receive" (i before e, except after c).'
        },
      ]

      for (const check of spellingChecks) {
        let match: RegExpExecArray | null
        while ((match = check.regex.exec(text)) !== null) {
          issues.push({
            type: 'spelling',
            severity: 'moderate',
            message: `Spelling error: "${check.original}" should be "${check.suggestion}"`,
            explanation: check.explanation,
            original_text: check.original,
            suggestion_text: check.suggestion,
            startIndex: match.index,
            endIndex: match.index + check.original.length,
          })
        }
      }
    }

    // ========================================================================
    // 2. GRAMMAR CHECKS
    // ========================================================================
    if (options.grammar !== false) {
      // Double spaces
      const doubleSpaceRegex = /  +/g
      let match: RegExpExecArray | null
      while ((match = doubleSpaceRegex.exec(text)) !== null) {
        issues.push({
          type: 'grammar',
          severity: 'low',
          message: 'Multiple spaces detected',
          explanation: 'Use single space between words. Multiple spaces look unprofessional.',
          original_text: match[0],
          suggestion_text: ' ',
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        })
      }

      // Subject-verb agreement in email body
      const svAgreement = [
        { regex: /\bI\s+(?:am|is|was)\s+(?:need|needs|want|wants)\b/gi, fix: 'I need' },
        { regex: /\bWe\s+(?:is|was)\s+(?:request|requests)\b/gi, fix: 'We request' },
      ]

      for (const check of svAgreement) {
        let match: RegExpExecArray | null
        while ((match = check.regex.exec(emailBody)) !== null) {
          const bodyOffset = text.indexOf(emailBody)
          if (bodyOffset >= 0) {
            issues.push({
              type: 'grammar',
              severity: 'high',
              message: 'Subject-verb agreement error',
              explanation: 'Ensure the verb matches the subject (first person singular uses "I need", not "I needs").',
              original_text: match[0],
              suggestion_text: check.fix,
              startIndex: bodyOffset + match.index,
              endIndex: bodyOffset + match.index + match[0].length,
            })
          }
        }
      }
    }

    // ========================================================================
    // 3. PROFESSIONAL TONE CHECKS
    // ========================================================================
    if (options.tone !== false) {
      // Informal expressions in professional context
      const informalExpressions = [
        {
          regex: /\b(?:hey|yo|sup|what's up)\b/gi,
          suggestion: 'Hello',
          explanation: 'Use formal greetings ("Hello" or "Dear [Name]") in workplace emails.',
          severity: 'high' as const,
        },
        {
          regex: /\b(?:gonna|wanna|gotta)\b/gi,
          suggestion: 'going to / want to / got to',
          explanation: 'Avoid contractions and informal language in professional emails. Use full forms.',
          severity: 'high' as const,
        },
        {
          regex: /\b(?:thx|thanks a lot|ty)\b/gi,
          suggestion: 'Thank you',
          explanation: 'Use complete, professional expressions. "Thank you" is more appropriate than "thx" or "ty".',
          severity: 'moderate' as const,
        },
        {
          regex: /\b(?:lol|omg|btw|fyi)\b/gi,
          suggestion: '(remove)',
          explanation: 'Avoid internet slang and abbreviations in professional emails.',
          severity: 'moderate' as const,
        },
        {
          regex: /\b(?:sorry|oops|my bad)\b/gi,
          suggestion: 'I apologize',
          explanation: 'Use formal apologies ("I apologize" or "I sincerely apologize") instead of casual expressions.',
          severity: 'moderate' as const,
        },
      ]

      for (const check of informalExpressions) {
        let match: RegExpExecArray | null
        while ((match = check.regex.exec(text)) !== null) {
          issues.push({
            type: 'tone',
            severity: check.severity,
            message: `Informal expression detected: "${match[0]}"`,
            explanation: check.explanation,
            original_text: match[0],
            suggestion_text: check.suggestion,
            startIndex: match.index,
            endIndex: match.index + match[0].length,
          })
        }
      }

      // Emotional or unprofessional language
      const emotionalLanguage = [
        {
          regex: /\b(?:very|extremely|really)\s+(?:upset|angry|frustrated|disappointed)\b/gi,
          suggestion: 'concerned',
          explanation: 'Avoid emotional language. Use neutral, professional terms like "concerned" or "would like to address".',
          severity: 'high' as const,
        },
        {
          regex: /\b(?:must|have to|need to)\s+(?:urgently|immediately|right away|asap)\b/gi,
          suggestion: 'would appreciate if',
          explanation: 'Avoid pressure language. Use polite requests like "I would appreciate if..." instead of demanding urgency.',
          severity: 'high' as const,
        },
      ]

      for (const check of emotionalLanguage) {
        let match: RegExpExecArray | null
        while ((match = check.regex.exec(text)) !== null) {
          issues.push({
            type: 'tone',
            severity: check.severity,
            message: `Emotional or pressuring language detected`,
            explanation: check.explanation,
            original_text: match[0],
            suggestion_text: check.suggestion,
            startIndex: match.index,
            endIndex: match.index + match[0].length,
          })
        }
      }
    }

    // ========================================================================
    // 4. EMAIL STRUCTURE CHECKS
    // ========================================================================
    if (options.structure !== false) {
      // Check subject line
      if (!subject || subject.trim().length === 0) {
        const subjectMatch = text.match(/^Subject:\s*/im)
        const subjectIndex = subjectMatch ? subjectMatch.index! + subjectMatch[0].length : 0
        issues.push({
          type: 'structure',
          severity: 'high',
          message: 'Missing or empty subject line',
          explanation: 'Professional emails must have a clear, descriptive subject line that explains the email purpose.',
          original_text: '',
          suggestion_text: `Subject: ${purpose === 'vacation_request' ? 'Vacation Request' : purpose === 'meeting_request' ? 'Meeting Request' : 'Email Subject'}`,
          startIndex: subjectIndex,
          endIndex: subjectIndex,
        })
      } else if (subject.length > 60) {
        const subjectMatch = text.match(/^Subject:\s*(.+)$/im)
        if (subjectMatch) {
          issues.push({
            type: 'structure',
            severity: 'moderate',
            message: 'Subject line is too long',
            explanation: 'Subject lines should be concise (under 60 characters) for better readability and mobile display.',
            original_text: subject,
            suggestion_text: subject.substring(0, 57) + '...',
            startIndex: subjectMatch.index! + 9,
            endIndex: subjectMatch.index! + subjectMatch[0].length,
          })
        }
      }

      // Check greeting professionalism
      if (!greeting || greeting.trim().length === 0) {
        const bodyStart = text.indexOf(emailBody)
        if (bodyStart >= 0) {
          issues.push({
            type: 'structure',
            severity: 'moderate',
            message: 'Missing greeting',
            explanation: `Professional emails should start with an appropriate greeting. For ${recipientType}, use "Dear [Name]" or "Hello,".`,
            original_text: '',
            suggestion_text: recipientType === 'Manager' || recipientType === 'HR' ? 'Dear [Name],' : 'Hello,',
            startIndex: bodyStart,
            endIndex: bodyStart,
          })
        }
      } else {
        // Check if greeting is too informal
        const informalGreeting = /\b(?:hey|hi there|yo)\b/gi
        if (informalGreeting.test(greeting)) {
          const greetingMatch = text.match(new RegExp(greeting.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i'))
          if (greetingMatch) {
            issues.push({
              type: 'structure',
              severity: 'high',
              message: 'Informal greeting detected',
              explanation: `Use professional greetings for ${recipientType}. "Dear [Name]," or "Hello," is more appropriate.`,
              original_text: greeting,
              suggestion_text: recipientType === 'Manager' || recipientType === 'HR' ? 'Dear [Name],' : 'Hello,',
              startIndex: greetingMatch.index!,
              endIndex: greetingMatch.index! + greetingMatch[0].length,
            })
          }
        }
      }

      // Check if request/statement is clear (for leave requests, meeting requests, etc.)
      if ((purpose === 'vacation_request' || purpose === 'sick_leave' || purpose === 'meeting_request') && emailBody.length > 0) {
        const hasRequestWord = /\b(?:request|requesting|would like|asking|seeking)\b/gi.test(emailBody)
        if (!hasRequestWord) {
          const bodyStart = text.indexOf(emailBody)
          if (bodyStart >= 0) {
            issues.push({
              type: 'structure',
              severity: 'moderate',
              message: 'Request statement not clearly stated',
              explanation: `For ${purpose === 'vacation_request' ? 'vacation requests' : purpose === 'meeting_request' ? 'meeting requests' : 'requests'}, clearly state what you are requesting using phrases like "I would like to request..." or "I am requesting...".`,
              original_text: emailBody.substring(0, 50) + '...',
              suggestion_text: 'I would like to request...',
              startIndex: bodyStart,
              endIndex: bodyStart + Math.min(50, emailBody.length),
            })
          }
        }
      }

      // Check closing
      if (!closing || closing.trim().length === 0) {
        const closingMatch = text.match(/\n\n([^\n]*)$/im)
        const closingIndex = closingMatch ? closingMatch.index! + closingMatch[0].indexOf(closingMatch[1]) : text.length - 1
        issues.push({
          type: 'structure',
          severity: 'moderate',
          message: 'Missing professional closing',
          explanation: 'Professional emails should end with an appropriate closing such as "Best regards," "Sincerely," or "Thank you,".',
          original_text: '',
          suggestion_text: requiredTone === 'Formal' ? 'Sincerely,' : 'Best regards,',
          startIndex: closingIndex,
          endIndex: closingIndex,
        })
      }
    }

    // ========================================================================
    // 5. PROFESSIONALISM CHECKS
    // ========================================================================
    if (options.professionalism !== false) {
      // Urgent language / pressure
      const urgentLanguage = [
        {
          regex: /\b(?:asap|as soon as possible|urgently|immediately)\b/gi,
          suggestion: 'at your earliest convenience',
          explanation: 'Avoid urgent language that pressures the recipient. Use polite alternatives like "at your earliest convenience" or "when you have a chance".',
          severity: 'high' as const,
        },
        {
          regex: /\b(?:must|have to|need to)\s+respond\b/gi,
          suggestion: 'I would appreciate a response',
          explanation: 'Avoid demanding responses. Use polite requests instead.',
          severity: 'high' as const,
        },
      ]

      for (const check of urgentLanguage) {
        let match: RegExpExecArray | null
        while ((match = check.regex.exec(text)) !== null) {
          issues.push({
            type: 'professionalism',
            severity: check.severity,
            message: 'Pressuring or urgent language detected',
            explanation: check.explanation,
            original_text: match[0],
            suggestion_text: check.suggestion,
            startIndex: match.index,
            endIndex: match.index + match[0].length,
          })
        }
      }

      // Unnecessary personal details
      if (purpose === 'vacation_request' || purpose === 'sick_leave') {
        const personalDetails = [
          /\b(?:my family|my personal|my private|TMI|too much information)\b/gi,
        ]

        for (const pattern of personalDetails) {
          let match: RegExpExecArray | null
          while ((match = pattern.exec(emailBody)) !== null) {
            const bodyOffset = text.indexOf(emailBody)
            if (bodyOffset >= 0) {
              issues.push({
                type: 'professionalism',
                severity: 'moderate',
                message: 'Unnecessary personal details',
                explanation: 'Keep workplace emails focused on business. Avoid oversharing personal information that is not relevant to the request.',
                original_text: match[0],
                suggestion_text: '(remove)',
                startIndex: bodyOffset + match.index,
                endIndex: bodyOffset + match.index + match[0].length,
              })
            }
          }
        }
      }

      // Exclamation marks (unprofessional in workplace emails)
      const exclamationRegex = /!{2,}/g
      let match: RegExpExecArray | null
      while ((match = exclamationRegex.exec(text)) !== null) {
        issues.push({
          type: 'professionalism',
          severity: 'moderate',
          message: 'Multiple exclamation marks detected',
          explanation: 'Avoid excessive exclamation marks in professional emails. Use periods for a more professional tone.',
          original_text: match[0],
          suggestion_text: '.',
          startIndex: match.index,
          endIndex: match.index + match[0].length,
        })
      }
    }

    // ========================================================================
    // 6. CLARITY CHECKS
    // ========================================================================
    if (options.clarity !== false) {
      // Long sentences
      const sentences = emailBody.split(/[.!?]+/)
      let currentIndex = text.indexOf(emailBody)
      sentences.forEach((sentence) => {
        const words = sentence.trim().split(/\s+/).filter(w => w.length > 0)
        if (words.length > 30) {
          const sentenceStart = emailBody.indexOf(sentence.trim())
          if (sentenceStart >= 0 && currentIndex >= 0) {
            issues.push({
              type: 'clarity',
              severity: 'moderate',
              message: 'Sentence is too long',
              explanation: 'Long sentences reduce clarity. Break into shorter, clearer sentences (aim for 15-20 words per sentence).',
              original_text: sentence.trim().substring(0, 50) + '...',
              suggestion_text: '',
              startIndex: currentIndex + sentenceStart,
              endIndex: currentIndex + sentenceStart + Math.min(sentence.trim().length, 50),
            })
          }
        }
      })

      // Vague language
      const vagueTerms = [
        {
          regex: /\b(?:thing|stuff|something|things)\b/gi,
          suggestion: '(be specific)',
          explanation: 'Use specific terms instead of vague words like "thing" or "stuff" to improve clarity and professionalism.',
          severity: 'low' as const,
        },
      ]

      for (const check of vagueTerms) {
        let match: RegExpExecArray | null
        while ((match = check.regex.exec(emailBody)) !== null) {
          const bodyOffset = text.indexOf(emailBody)
          if (bodyOffset >= 0) {
            issues.push({
              type: 'clarity',
              severity: check.severity,
              message: 'Vague language detected',
              explanation: check.explanation,
              original_text: match[0],
              suggestion_text: check.suggestion,
              startIndex: bodyOffset + match.index,
              endIndex: bodyOffset + match.index + match[0].length,
            })
          }
        }
      }
    }

    // ========================================================================
    // 7. PURPOSE ALIGNMENT CHECKS
    // ========================================================================
    if (options.purpose !== false && purpose !== 'general') {
      // Check if content aligns with stated purpose
      if (purpose === 'vacation_request' || purpose === 'sick_leave') {
        const hasDateRange = /\b(?:from|starting|beginning).*\b(?:to|until|through|ending)\b/gi.test(emailBody)
        if (!hasDateRange && emailBody.length > 50) {
          const bodyStart = text.indexOf(emailBody)
          if (bodyStart >= 0) {
            issues.push({
              type: 'structure',
              severity: 'moderate',
              message: 'Date range not clearly specified',
              explanation: `${purpose === 'vacation_request' ? 'Vacation' : 'Leave'} requests should clearly state the date range (e.g., "from [date] to [date]" or "starting [date] until [date]").`,
              original_text: emailBody.substring(0, 50) + '...',
              suggestion_text: 'from [start date] to [end date]',
              startIndex: bodyStart,
              endIndex: bodyStart + Math.min(50, emailBody.length),
            })
          }
        }
      }

      if (purpose === 'meeting_request') {
        const hasTimeSlot = /\b(?:at|on|by|before|after)\s+\d+/gi.test(emailBody) || /\b(?:morning|afternoon|evening)\b/gi.test(emailBody)
        if (!hasTimeSlot && emailBody.length > 50) {
          const bodyStart = text.indexOf(emailBody)
          if (bodyStart >= 0) {
            issues.push({
              type: 'structure',
              severity: 'moderate',
              message: 'Meeting time not specified',
              explanation: 'Meeting requests should include preferred time slots or availability windows to help the recipient respond efficiently.',
              original_text: emailBody.substring(0, 50) + '...',
              suggestion_text: 'I am available [time slots]',
              startIndex: bodyStart,
              endIndex: bodyStart + Math.min(50, emailBody.length),
            })
          }
        }
      }
    }

    // Sort issues by startIndex
    issues.sort((a, b) => a.startIndex - b.startIndex)

    // Remove overlapping issues (keep first, skip later)
    const nonOverlapping: typeof issues = []
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

    // Ensure all issues have required fields and add default status
    const validatedIssues = nonOverlapping.slice(0, 50).map(issue => {
      const start = Math.max(0, Math.min(issue.startIndex, text.length))
      const end = Math.max(start, Math.min(issue.endIndex, text.length))
      
      let originalText = issue.original_text || ''
      if (!originalText || originalText.trim() === '') {
        originalText = extractText(start, end)
      } else {
        const extracted = extractText(start, end)
        if (extracted && extracted.toLowerCase() !== originalText.toLowerCase()) {
          originalText = extracted
        }
      }
      
      return {
        type: issue.type,
        severity: issue.severity,
        message: issue.message || '',
        explanation: issue.explanation || '',
        original_text: originalText || '',
        suggestion_text: issue.suggestion_text || '',
        startIndex: start,
        endIndex: end,
        status: 'open' as const,
      }
    })

    return NextResponse.json({
      ok: true,
      issues: validatedIssues,
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

