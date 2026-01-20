import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import mammoth from 'mammoth'

// Force Node.js runtime for PDF parsing (NOT Edge)
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

/**
 * POST /api/proofreading/import
 * 
 * Imports text from DOCX or PDF files.
 * - DOCX: Uses mammoth to extract text and split into pages
 * - PDF: Uses pdf-parse (CommonJS require, Node.js runtime only)
 * 
 * Returns JSON:
 * - Success (DOCX): { ok: true, pages: [{ title?: string, content: string }] }
 * - Success (PDF): { ok: true, text: string }
 * - Failure: { ok: false, error: string }
 */

interface Page {
  title?: string
  content: string
}

/**
 * Splits DOCX content into pages based on explicit breaks, headings, or length.
 */
function splitIntoPages(text: string, html?: string): Page[] {
  const pages: Page[] = []
  
  // Strategy 1: Check for explicit page breaks (form feed \f)
  if (text.includes('\f')) {
    const parts = text.split('\f')
    for (let i = 0; i < parts.length; i++) {
      const content = parts[i].trim()
      if (content.length > 0) {
        pages.push({ content })
      }
    }
    if (pages.length > 0) {
      return pages
    }
  }
  
  // Strategy 2: Check for page break markers in HTML if available
  if (html) {
    // Look for page break indicators in HTML
    const pageBreakRegex = /<p[^>]*class="[^"]*page-break[^"]*"[^>]*>|<div[^>]*class="[^"]*page-break[^"]*"[^>]*>|<hr[^>]*class="[^"]*page-break[^"]*"[^>]*>/gi
    if (pageBreakRegex.test(html)) {
      const parts = html.split(pageBreakRegex)
      for (let i = 0; i < parts.length; i++) {
        const htmlPart = parts[i].trim()
        if (htmlPart.length > 0) {
          // Extract text from HTML (simple strip tags)
          const textContent = htmlPart.replace(/<[^>]+>/g, '').trim()
          if (textContent.length > 0) {
            pages.push({ content: textContent })
          }
        }
      }
      if (pages.length > 0) {
        return pages
      }
    }
  }
  
  // Strategy 3: Split by Heading 1 or Heading 2
  // First, try to detect headings from HTML if available (more reliable)
  const headingPositions = new Set<number>()
  const headingTitles: string[] = []
  
  if (html) {
    // Extract h1 and h2 tags from HTML
    const h1Pattern = /<h1[^>]*>([^<]+)<\/h1>/gi
    const h2Pattern = /<h2[^>]*>([^<]+)<\/h2>/gi
    
    // Find all h1 and h2 headings in HTML and map them to text positions
    const htmlHeadings: Array<{ title: string; htmlIndex: number }> = []
    
    let match: RegExpExecArray | null
    while ((match = h1Pattern.exec(html)) !== null) {
      htmlHeadings.push({ title: match[1].trim(), htmlIndex: match.index })
    }
    while ((match = h2Pattern.exec(html)) !== null) {
      htmlHeadings.push({ title: match[1].trim(), htmlIndex: match.index })
    }
    
    // Sort by HTML position
    htmlHeadings.sort((a, b) => a.htmlIndex - b.htmlIndex)
    
    // Map HTML headings to text positions (approximate)
    // This is a heuristic: find the heading text in the raw text
    for (const heading of htmlHeadings) {
      const titleLower = heading.title.toLowerCase()
      const textIndex = text.toLowerCase().indexOf(titleLower)
      if (textIndex !== -1) {
        headingPositions.add(textIndex)
        headingTitles.push(heading.title)
      }
    }
  }
  
  // Also check for numbered headings in text like "1. ", "2. ", "Chapter 1", etc.
  const numberedHeadingPattern = /^(?:\d+\.\s+|Chapter\s+\d+|PART\s+\d+|SECTION\s+\d+)[^\n]{0,100}$/gmi
  const numberedMatches = [...text.matchAll(numberedHeadingPattern)]
  
  numberedMatches.forEach(match => {
    if (match.index !== undefined) {
      // Only add if not already close to an existing heading (within 50 chars)
      let isClose = false
      for (const existingPos of headingPositions) {
        if (Math.abs(existingPos - match.index) < 50) {
          isClose = true
          break
        }
      }
      if (!isClose) {
        headingPositions.add(match.index)
        const title = match[0].trim()
        if (title.length > 0 && title.length < 100) {
          headingTitles.push(title)
        }
      }
    }
  })
  
  // If we found headings, split at those positions
  if (headingPositions.size > 0) {
    const sortedPositions = Array.from(headingPositions).sort((a, b) => a - b)
    let lastIndex = 0
    let titleIndex = 0
    
    for (let i = 0; i < sortedPositions.length; i++) {
      const pos = sortedPositions[i]
      if (pos > lastIndex) {
        const content = text.substring(lastIndex, pos).trim()
        if (content.length > 0) {
          const page: Page = { content }
          // Try to assign title if available
          if (titleIndex < headingTitles.length) {
            page.title = headingTitles[titleIndex]
            titleIndex++
          }
          pages.push(page)
        }
        lastIndex = pos
      }
    }
    
    // Add remaining content
    if (lastIndex < text.length) {
      const content = text.substring(lastIndex).trim()
      if (content.length > 0) {
        pages.push({ content })
      }
    }
    
    if (pages.length > 1) {
      return pages
    }
  }
  
  // Strategy 4: Fallback - split by length (1800-2200 chars per page)
  // Try to split at sentence boundaries
  const targetLength = 2000
  const minLength = 1800
  const maxLength = 2200
  
  if (text.length <= maxLength) {
    // Content fits in one page
    return [{ content: text.trim() }]
  }
  
  let currentIndex = 0
  while (currentIndex < text.length) {
    const remaining = text.length - currentIndex
    
    if (remaining <= maxLength) {
      // Last chunk - take everything
      const content = text.substring(currentIndex).trim()
      if (content.length > 0) {
        pages.push({ content })
      }
      break
    }
    
    // Find the best split point near targetLength
    let splitIndex = currentIndex + targetLength
    
    // Try to find a sentence boundary (., !, ? followed by space and capital letter)
    const sentenceEndRegex = /[.!?]\s+[A-Z]/g
    let bestSplit = splitIndex
    
    // Search backwards from splitIndex for a sentence boundary
    const searchStart = Math.max(currentIndex + minLength, splitIndex - 200)
    const searchEnd = Math.min(splitIndex + 200, currentIndex + remaining)
    const searchText = text.substring(searchStart, searchEnd)
    
    let match: RegExpMatchArray | null
    sentenceEndRegex.lastIndex = 0
    while ((match = sentenceEndRegex.exec(searchText)) !== null) {
      const mIndex = match.index ?? 0
      const absolutePos = searchStart + mIndex + match[0].length - 1
      if (absolutePos <= splitIndex + 100) {
        bestSplit = searchStart + mIndex + match[0].length - 1
      } else {
        break
      }
    }
    
    // If no sentence boundary found, try paragraph break (double newline)
    if (bestSplit === splitIndex) {
      const paraBreak = text.lastIndexOf('\n\n', splitIndex + 100)
      if (paraBreak > currentIndex + minLength) {
        bestSplit = paraBreak + 2
      } else {
        // Fallback to single newline
        const newlineBreak = text.lastIndexOf('\n', splitIndex + 100)
        if (newlineBreak > currentIndex + minLength) {
          bestSplit = newlineBreak + 1
        }
      }
    }
    
    const content = text.substring(currentIndex, bestSplit).trim()
    if (content.length > 0) {
      pages.push({ content })
    }
    
    currentIndex = bestSplit
  }
  
  return pages.length > 0 ? pages : [{ content: text.trim() }]
}
export async function POST(req: NextRequest) {
  try {
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
        { ok: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json(
        { ok: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    const fileName = file.name.toLowerCase()
    const fileExtension = fileName.split('.').pop()?.toLowerCase()

    // Validate file type
    if (fileExtension !== 'docx' && fileExtension !== 'pdf') {
      return NextResponse.json(
        { ok: false, error: 'Unsupported file format. Please upload a .docx or .pdf file.' },
        { status: 400 }
      )
    }

    let extractedText = ''
    let pages: Page[] | null = null

    if (fileExtension === 'docx') {
      // DOCX parsing using mammoth - extract both HTML and raw text for better structure detection
      try {
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        // Extract raw text (includes form feeds for page breaks)
        const textResult = await mammoth.extractRawText({ buffer })
        const rawText = textResult.value

        if (!rawText || rawText.trim().length === 0) {
          return NextResponse.json(
            { ok: false, error: 'The DOCX file appears to be empty or could not be parsed.' },
            { status: 400 }
          )
        }

        // Also try to extract HTML for better structure detection (headings, page breaks)
        let htmlContent: string | undefined
        try {
          const htmlResult = await mammoth.convertToHtml({ buffer })
          htmlContent = htmlResult.value
        } catch (htmlError) {
          // If HTML conversion fails, continue with raw text only
          console.warn('[Proofreading Import] HTML conversion failed, using raw text only:', htmlError)
        }

        // Split content into pages
        pages = splitIntoPages(rawText, htmlContent)
        
        // Ensure we have at least one page
        if (pages.length === 0) {
          pages = [{ content: rawText.trim() }]
        }
      } catch (error: any) {
        console.error('[Proofreading Import] DOCX parsing error:', error)
        return NextResponse.json(
          { ok: false, error: 'Failed to parse DOCX file. Please ensure it is a valid .docx file.' },
          { status: 500 }
        )
      }
    } else if (fileExtension === 'pdf') {
      // PDF parsing using pdf-parse (CommonJS require, Node.js runtime only)
      try {
        // Use dynamic require for pdf-parse (CommonJS)
        const pdfParse = require('pdf-parse')
        
        const arrayBuffer = await file.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        
        const pdfData = await pdfParse(buffer)
        extractedText = pdfData.text || ''

        // Check if PDF is scanned (no selectable text)
        if (!extractedText || extractedText.trim().length === 0) {
          return NextResponse.json(
            { ok: false, error: 'This PDF appears to be scanned. Please upload a text-based PDF or DOCX.' },
            { status: 400 }
          )
        }

        // Additional check: if text is very short, might be scanned
        const trimmedText = extractedText.trim()
        if (trimmedText.length < 10) {
          return NextResponse.json(
            { ok: false, error: 'This PDF appears to be scanned. Please upload a text-based PDF or DOCX.' },
            { status: 400 }
          )
        }
      } catch (error: any) {
        console.error('[Proofreading Import] PDF parsing error:', error)
        
        // Check if error is related to scanned PDF
        if (error.message && error.message.includes('No text')) {
          return NextResponse.json(
            { ok: false, error: 'This PDF appears to be scanned. Please upload a text-based PDF or DOCX.' },
            { status: 400 }
          )
        }
        
        return NextResponse.json(
          { ok: false, error: 'Failed to parse PDF file. Please ensure it is a valid text-based PDF.' },
          { status: 500 }
        )
      }
    }

    // Return pages for DOCX, text for PDF (backward compatibility)
    if (fileExtension === 'docx' && pages) {
      return NextResponse.json(
        { ok: true, pages },
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    } else {
      // PDF or fallback - return text (backward compatibility)
      return NextResponse.json(
        { ok: true, text: extractedText },
        { 
          status: 200,
          headers: {
            'Content-Type': 'application/json',
          }
        }
      )
    }
  } catch (error: any) {
    console.error('[Proofreading Import] Unexpected error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Internal server error' },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

