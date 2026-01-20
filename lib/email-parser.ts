/**
 * Email parsing utilities
 * Parses pasted email text into structured parts
 */

export interface ParsedEmail {
  subject: string
  greeting: string
  body: string
  closing: string
  signature: string
}

/**
 * Parses a full email text into structured parts
 */
export function parseEmail(fullText: string): ParsedEmail {
  const lines = fullText.split('\n').map(line => line.trim())
  
  let subject = ''
  let greeting = ''
  let body = ''
  let closing = ''
  let signature = ''

  // Try to extract subject (usually first line or after "Subject:")
  const subjectMatch = fullText.match(/^Subject:\s*(.+)$/im)
  if (subjectMatch) {
    subject = subjectMatch[1].trim()
  } else if (lines[0] && lines[0].length < 100 && !lines[0].includes('@')) {
    // First line might be subject if it's short and doesn't look like an email
    subject = lines[0]
  }

  // Find greeting patterns
  const greetingPatterns = [
    /^(Dear|Hello|Hi|Greetings|Good morning|Good afternoon|Good evening)\s+/i,
    /^(Dear|Hello|Hi),?\s+/i,
  ]

  let greetingIndex = -1
  for (let i = 0; i < lines.length; i++) {
    for (const pattern of greetingPatterns) {
      if (pattern.test(lines[i])) {
        greeting = lines[i]
        greetingIndex = i
        break
      }
    }
    if (greetingIndex >= 0) break
  }

  // Find closing patterns
  const closingPatterns = [
    /^(Sincerely|Best regards|Regards|Yours sincerely|Best|Thanks|Thank you|Thank you for your time)/i,
  ]

  let closingIndex = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    for (const pattern of closingPatterns) {
      if (pattern.test(lines[i])) {
        closing = lines[i]
        closingIndex = i
        break
      }
    }
    if (closingIndex >= 0) break
  }

  // Extract body (everything between greeting and closing)
  const bodyStart = greetingIndex >= 0 ? greetingIndex + 1 : 0
  const bodyEnd = closingIndex >= 0 ? closingIndex : lines.length

  if (bodyStart < bodyEnd) {
    body = lines.slice(bodyStart, bodyEnd).join('\n').trim()
  } else {
    // If no greeting/closing found, treat everything as body
    body = lines.slice(subject ? 1 : 0).join('\n').trim()
  }

  // Extract signature (everything after closing)
  if (closingIndex >= 0 && closingIndex < lines.length - 1) {
    signature = lines.slice(closingIndex + 1).join('\n').trim()
  } else {
    // Try to detect signature (lines that look like name/contact info)
    const potentialSignature = lines.slice(Math.max(0, lines.length - 3)).join('\n')
    if (potentialSignature && potentialSignature.length < 150) {
      signature = potentialSignature
    }
  }

  // If no structure found, treat everything as body
  if (!greeting && !closing && !subject) {
    body = fullText.trim()
  }

  return {
    subject: subject || '',
    greeting: greeting || '',
    body: body || fullText.trim(),
    closing: closing || '',
    signature: signature || '',
  }
}

