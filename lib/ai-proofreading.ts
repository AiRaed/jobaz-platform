export interface ProofreadingIssue {
  id: string
  type: 'spelling' | 'grammar' | 'style' | 'clarity' | 'consistency'
  severity: 'low' | 'medium' | 'high'
  startIndex: number
  endIndex: number
  message: string
  suggestion: string
  status?: 'open' | 'applied' | 'rejected'
}

export interface ProofreadingAnalysis {
  overall: {
    score: number
    notes: string
  }
  issues: ProofreadingIssue[]
}

interface AnalyzeTextOptions {
  includeSpelling?: boolean
  includeGrammar?: boolean
  includeStyle?: boolean
  includeClarity?: boolean
  projectType?: string
}

/**
 * Analyzes text for proofreading issues using deterministic placeholder analyzer.
 * Returns structured issues with positions and explanations.
 */
export async function analyzeProofreading(
  text: string,
  options: AnalyzeTextOptions = {}
): Promise<ProofreadingAnalysis> {
  const {
    includeSpelling = true,
    includeGrammar = true,
    includeStyle = true,
    includeClarity = true,
    projectType = 'general',
  } = options

  if (!text.trim()) {
    return {
      overall: { score: 100, notes: 'No text to analyze' },
      issues: [],
    }
  }

  // DETERMINISTIC PLACEHOLDER ANALYZER (no external APIs)
  // This provides consistent, predictable results for testing
  console.log('[Proofreading] Using deterministic placeholder analyzer')
  
  const issues: ProofreadingIssue[] = []
  
  // Simple spelling checks (common typos)
  if (includeSpelling) {
    const commonTypos: [RegExp, string][] = [
      [/teh\b/gi, 'the'],
      [/adn\b/gi, 'and'],
      [/recieve/gi, 'receive'],
      [/seperate/gi, 'separate'],
      [/definately/gi, 'definitely'],
      [/occured/gi, 'occurred'],
      [/thier\b/gi, 'their'],
    ]
    
    commonTypos.forEach(([pattern, correct]) => {
      const matches = [...text.matchAll(pattern)]
      matches.forEach(match => {
        if (match.index !== undefined) {
          issues.push({
            id: `spell-${match.index}-${Date.now()}`,
            type: 'spelling',
            severity: 'medium',
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            message: `Common spelling error: "${match[0]}" should be "${correct}"`,
            suggestion: correct,
            status: 'open',
          })
        }
      })
    })
  }
  
  // Simple grammar checks
  if (includeGrammar) {
    // Check for double spaces
    const doubleSpaceMatches = [...text.matchAll(/\s{2,}/g)]
    doubleSpaceMatches.forEach(match => {
      if (match.index !== undefined) {
        issues.push({
          id: `grammar-dblspace-${match.index}-${Date.now()}`,
          type: 'grammar',
          severity: 'low',
          startIndex: match.index,
          endIndex: match.index + match[0].length,
          message: 'Double space detected. Use single space.',
          suggestion: ' ',
          status: 'open',
        })
      }
    })
    
    // Check for missing space after period (common error)
    const missingSpaceAfterPeriod = [...text.matchAll(/\.([A-Z])/g)]
    missingSpaceAfterPeriod.forEach(match => {
      if (match.index !== undefined) {
        issues.push({
          id: `grammar-space-${match.index}-${Date.now()}`,
          type: 'grammar',
          severity: 'medium',
          startIndex: match.index + 1,
          endIndex: match.index + 2,
          message: 'Missing space after period. Add space before capital letter.',
          suggestion: ` ${match[1]}`,
          status: 'open',
        })
      }
    })
  }
  
  // Simple clarity checks
  if (includeClarity) {
    // Check for very long sentences (more than 40 words)
    const sentences = text.split(/[.!?]+\s+/)
    let charIndex = 0
    sentences.forEach(sentence => {
      const wordCount = sentence.trim().split(/\s+/).length
      if (wordCount > 40) {
        const startIndex = text.indexOf(sentence, charIndex)
        if (startIndex !== -1) {
          issues.push({
            id: `clarity-long-${startIndex}-${Date.now()}`,
            type: 'clarity',
            severity: 'medium',
            startIndex: startIndex,
            endIndex: startIndex + sentence.length,
            message: `Long sentence (${wordCount} words). Consider breaking into shorter sentences for clarity.`,
            suggestion: sentence, // No change, just a note
            status: 'open',
          })
          charIndex = startIndex + sentence.length
        }
      }
    })
  }
  
  // Simple style checks
  if (includeStyle) {
    // Check for passive voice indicators (simplified)
    const passivePatterns = [
      /\bis\s+(?:being|been|done|made|given|taken|used|shown|seen|found|said|told|asked|thought|believed|known|expected|required|needed|wanted)\b/gi,
      /\bwas\s+(?:being|done|made|given|taken|used|shown|seen|found|said|told|asked|thought|believed|known|expected|required|needed|wanted)\b/gi,
    ]
    
    passivePatterns.forEach((pattern) => {
      const matches = [...text.matchAll(pattern)]
      matches.slice(0, 3).forEach(match => { // Limit to first 3
        if (match.index !== undefined) {
          issues.push({
            id: `style-passive-${match.index}-${Date.now()}`,
            type: 'style',
            severity: 'low',
            startIndex: match.index,
            endIndex: match.index + match[0].length,
            message: 'Potential passive voice. Consider using active voice for stronger writing.',
            suggestion: match[0], // Placeholder - actual suggestion would require context
            status: 'open',
          })
        }
      })
    })
  }
  
  // Calculate overall score
  const totalIssues = issues.length
  const highSeverityCount = issues.filter(i => i.severity === 'high').length
  const mediumSeverityCount = issues.filter(i => i.severity === 'medium').length
  
  let score = 100
  score -= highSeverityCount * 10
  score -= mediumSeverityCount * 5
  score -= (totalIssues - highSeverityCount - mediumSeverityCount) * 2
  score = Math.max(0, Math.min(100, score))
  
  const notes = totalIssues === 0 
    ? 'Text looks good! No issues found.'
    : `Found ${totalIssues} issue${totalIssues === 1 ? '' : 's'} (${highSeverityCount} high, ${mediumSeverityCount} medium, ${totalIssues - highSeverityCount - mediumSeverityCount} low).`
  
  return {
    overall: { score, notes },
    issues,
  }
}
