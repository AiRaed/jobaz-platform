interface Section {
  title: string
  content: string[]
}

// Helper function to download file using browser API
function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Helper function to parse text with bullets into structured paragraphs
function parseBulletContent(text: string, Paragraph: any): any[] {
  const paragraphs: any[] = []
  const lines = text.split('\n').filter(line => line.trim().length > 0)
  
  let currentBullets: string[] = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    // Check if line starts with a bullet marker (-, •, *, etc.)
    const bulletMatch = trimmed.match(/^[-•*]\s+(.+)$/)
    
    if (bulletMatch) {
      // It's a bullet point - add to current bullet list
      currentBullets.push(bulletMatch[1])
    } else {
      // It's regular text - flush any accumulated bullets first
      if (currentBullets.length > 0) {
        for (const bulletText of currentBullets) {
          paragraphs.push(
            new Paragraph({
              text: bulletText,
              bullet: { level: 0 },
              spacing: { after: 80 },
            })
          )
        }
        currentBullets = []
      }
      // Add the regular paragraph
      if (trimmed) {
        paragraphs.push(
          new Paragraph({
            text: trimmed,
            spacing: { after: 120 },
          })
        )
      }
    }
  }
  
  // Flush any remaining bullets
  if (currentBullets.length > 0) {
    for (const bulletText of currentBullets) {
      paragraphs.push(
        new Paragraph({
          text: bulletText,
          bullet: { level: 0 },
          spacing: { after: 80 },
        })
      )
    }
  }
  
  return paragraphs.length > 0 ? paragraphs : [
    new Paragraph({
      text: text,
      spacing: { after: 120 },
    })
  ]
}

export async function exportToDocx(
  name: string,
  sections: Section[],
  filename: string
) {
  if (typeof window === 'undefined') return
  
  const { Document, Packer, Paragraph, HeadingLevel, AlignmentType } = await import('docx')
  
  const paragraphs: any[] = []

  // Add title
  paragraphs.push(
    new Paragraph({
      text: name,
      heading: HeadingLevel.TITLE,
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    })
  )

  // Add sections
  for (const section of sections) {
    paragraphs.push(
      new Paragraph({
        text: section.title,
        heading: HeadingLevel.HEADING_1,
        spacing: { before: 240, after: 120 },
      })
    )

    for (const item of section.content) {
      if (item.trim()) {
        // Parse item for bullets and create appropriate paragraphs
        const parsedParagraphs = parseBulletContent(item, Paragraph)
        paragraphs.push(...parsedParagraphs)
      }
    }
  }

  const doc = new Document({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  })

  try {
    const blob = await Packer.toBlob(doc)
    downloadFile(blob, `${filename}.docx`)
  } catch (error) {
    console.error('DOCX export failed:', error)
    throw error
  }
}

// Helper function to sanitize filename
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .substring(0, 50) // Limit length
}

// Helper function to parse content into paragraphs
function parseContentToParagraphs(content: string, Paragraph: any): any[] {
  const paragraphs: any[] = []
  
  // Trim excessive blank lines at start/end
  const trimmedContent = content.trim()
  
  if (!trimmedContent) {
    return []
  }
  
  // Split by double newlines for paragraphs, single newlines for line breaks
  const parts = trimmedContent.split(/\n\n+/)
  
  for (const part of parts) {
    const lines = part.split('\n')
    const paragraphText = lines.join(' ').trim()
    
    if (paragraphText) {
      paragraphs.push(
        new Paragraph({
          text: paragraphText,
          spacing: {
            after: 120, // 6pt after (120 twips = 6pt)
          },
        })
      )
    }
  }
  
  return paragraphs
}

export async function exportProofreadingToDocx(
  pages: Array<{ id: string; content: string }>,
  projectTitle: string
): Promise<void> {
  if (typeof window === 'undefined') return
  
  const { 
    Document, 
    Packer, 
    Paragraph, 
    PageBreak
  } = await import('docx')
  
  // Filter out empty pages
  const nonEmptyPages = pages.filter(page => page.content.trim().length > 0)
  
  if (nonEmptyPages.length === 0) {
    throw new Error('No content to export')
  }
  
  // Build all paragraphs with page breaks between pages
  const allParagraphs: any[] = []
  
  for (let i = 0; i < nonEmptyPages.length; i++) {
    const page = nonEmptyPages[i]
    
    // Parse content into paragraphs
    const paragraphs = parseContentToParagraphs(page.content, Paragraph)
    
    // Add content paragraphs
    allParagraphs.push(...paragraphs)
    
    // Add page break after all pages except the last
    if (i < nonEmptyPages.length - 1) {
      allParagraphs.push(new Paragraph({ children: [new PageBreak()] }))
    }
  }
  
  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              orientation: 'portrait',
              width: 11906, // A4 width in twips (21cm = 11906 twips)
              height: 16838, // A4 height in twips (29.7cm = 16838 twips)
            },
            margin: {
              top: 1440, // 2.54cm = 1440 twips (1 inch = 1440 twips)
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        children: allParagraphs,
      },
    ],
    styles: {
      default: {
        document: {
          run: {
            font: 'Calibri',
            size: 22, // 11pt (22 half-points)
          },
          paragraph: {
            spacing: {
              line: 276, // 1.15 line spacing (240 * 1.15 = 276 twips)
              lineRule: 'auto',
            },
          },
        },
      },
    },
  })
  
  try {
    const blob = await Packer.toBlob(doc)
    
    // Generate filename: jobaz-proofreading-<projectTitle>-<YYYY-MM-DD>.docx
    const sanitizedTitle = sanitizeFilename(projectTitle || 'untitled')
    const date = new Date().toISOString().split('T')[0] // YYYY-MM-DD
    const filename = `jobaz-proofreading-${sanitizedTitle}-${date}.docx`
    
    downloadFile(blob, filename)
  } catch (error) {
    console.error('Proofreading DOCX export failed:', error)
    throw error
  }
}
