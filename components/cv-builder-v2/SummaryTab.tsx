import { useState, useEffect, useCallback } from 'react'
import { Sparkles, Loader2, Undo2, X, CheckCircle2, AlertCircle, AlertTriangle, Zap, Check, Copy } from 'lucide-react'
import { CvData } from '@/app/cv-builder-v2/page'

interface SummaryTabProps {
  summary: string
  personalInfo: CvData['personalInfo']
  skills: string[]
  experience?: CvData['experience']
  onUpdate: (summary: string) => void
  onLoadingChange: (loading: boolean) => void
}

type QualityStatus = 'strong' | 'good' | 'needs-improvement' | null
type FeedbackItem = { type: 'success' | 'warning' | 'error'; text: string }

export default function SummaryTab({ summary, personalInfo, skills, experience, onUpdate, onLoadingChange }: SummaryTabProps) {
  const [previousSummary, setPreviousSummary] = useState<string>('')
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [showKeywordModal, setShowKeywordModal] = useState(false)
  const [keywords, setKeywords] = useState('')
  
  // Quality Indicator State
  const [qualityStatus, setQualityStatus] = useState<QualityStatus>(null)
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [grammarIssues, setGrammarIssues] = useState<boolean>(false)
  const [qualityCheckLoading, setQualityCheckLoading] = useState(false)
  const [grammarFixLoading, setGrammarFixLoading] = useState(false)
  const [grammarSuccessMessage, setGrammarSuccessMessage] = useState<string>('')
  
  // Suggestion Card State
  const [suggestedSummary, setSuggestedSummary] = useState<string>('')
  const [suggestionMode, setSuggestionMode] = useState<string>('')
  const [isSuggesting, setIsSuggesting] = useState(false)
  const [showSuggestionCard, setShowSuggestionCard] = useState(false)
  const [similarityWarning, setSimilarityWarning] = useState(false)

  // Extract latest role from experience for domain context
  const getLatestRole = (): string | undefined => {
    if (experience && experience.length > 0) {
      const latest = experience[0] // Assuming experience is sorted with most recent first
      return latest.jobTitle
    }
    return undefined
  }

  // Get experience preview (latest role's bullets) for context
  const getExperiencePreview = (): string | undefined => {
    if (experience && experience.length > 0) {
      const latest = experience[0]
      if (latest.bullets && latest.bullets.length > 0) {
        return latest.bullets.slice(0, 3).join(' ')
      }
    }
    return undefined
  }

  // Auto-evaluate summary quality (debounced)
  const evaluateSummaryQuality = useCallback((text: string) => {
    if (!text.trim()) {
      setQualityStatus(null)
      setFeedback([])
      setGrammarIssues(false)
      return
    }

    const wordCount = text.trim().split(/\s+/).length
    const feedbackItems: FeedbackItem[] = []
    let status: QualityStatus = 'strong'

    // Check length
    if (wordCount >= 60 && wordCount <= 100) {
      feedbackItems.push({ type: 'success', text: 'Good length (60-100 words)' })
    } else if (wordCount >= 40 && wordCount < 60) {
      feedbackItems.push({ type: 'warning', text: 'A bit short - consider adding more detail' })
      status = 'good'
    } else if (wordCount > 100 && wordCount <= 150) {
      feedbackItems.push({ type: 'warning', text: 'Slightly long - consider being more concise' })
      status = 'good'
    } else if (wordCount < 40) {
      feedbackItems.push({ type: 'error', text: 'Too short - add more detail' })
      status = 'needs-improvement'
    } else {
      feedbackItems.push({ type: 'error', text: 'Too long - be more concise' })
      status = 'needs-improvement'
    }

    // Check for action-oriented language
    const actionWords = ['led', 'managed', 'developed', 'achieved', 'improved', 'created', 'delivered', 
      'designed', 'implemented', 'increased', 'reduced', 'optimized', 'built', 'established', 'drove']
    const hasActionWords = actionWords.some(word => text.toLowerCase().includes(word))
    
    if (hasActionWords) {
      feedbackItems.push({ type: 'success', text: 'Good use of action words' })
    } else {
      feedbackItems.push({ type: 'warning', text: 'Add more action-oriented language' })
      if (status === 'strong') status = 'good'
    }

    // Basic grammar checks
    const hasCommonIssues = /\s{2,}|\.{2,}|\,{2,}/.test(text) // Multiple spaces, periods, commas
    const hasCapitalization = /^[A-Z]/.test(text.trim()) // Starts with capital
    const hasProperEnding = /[.!?]$/.test(text.trim()) // Ends with punctuation
    
    if (hasCommonIssues || !hasCapitalization || !hasProperEnding) {
      setGrammarIssues(true)
      if (status === 'strong') status = 'good'
    } else {
      setGrammarIssues(false)
    }

    // Limit feedback to 3 items
    setFeedback(feedbackItems.slice(0, 3))
    setQualityStatus(status)
  }, [])

  // Debounced auto-evaluation
  useEffect(() => {
    const timer = setTimeout(() => {
      evaluateSummaryQuality(summary)
    }, 1000) // 1 second debounce

    return () => clearTimeout(timer)
  }, [summary, evaluateSummaryQuality])

  // Check if two texts are too similar (basic similarity check)
  const areSimilar = (text1: string, text2: string): boolean => {
    const normalize = (str: string) => str.toLowerCase().trim().replace(/\s+/g, ' ')
    const norm1 = normalize(text1)
    const norm2 = normalize(text2)
    
    if (norm1 === norm2) return true
    
    // Check word-level similarity
    const words1 = norm1.split(' ')
    const words2 = norm2.split(' ')
    const commonWords = words1.filter(word => words2.includes(word))
    const similarity = (commonWords.length * 2) / (words1.length + words2.length)
    
    return similarity > 0.85 // More than 85% similar
  }

  // Unified function for all AI summary suggestions
  const runSummarySuggestion = async (mode: 'improve' | 'shorter' | 'longer' | 'impact' | 'keywords', keywordsText?: string) => {
    // Validate input
    if (mode === 'keywords') {
      if (!keywordsText?.trim()) {
        alert('Please enter keywords')
        return
      }
    } else {
      if (!summary.trim()) {
        alert('Please enter a summary first')
        return
      }
    }

    // Set loading state
    setIsSuggesting(true)
    setAiLoading(mode)
    onLoadingChange(true)
    setSimilarityWarning(false)

    try {
      // Build prompt based on mode
      let prompt = ''
      let modeLabel = ''
      
      switch (mode) {
        case 'improve':
          prompt = `Improve and enhance the following CV summary. Make it more professional, impactful, and compelling while maintaining the core message. Keep it concise (60-100 words).`
          modeLabel = 'Improved'
          break
        case 'shorter':
          prompt = `Make the following CV summary shorter and more concise while keeping the most important points. Target 40-60 words.`
          modeLabel = 'Shorter'
          break
        case 'longer':
          prompt = `Expand the following CV summary to be more detailed and comprehensive. Add more depth while maintaining professionalism. Target 100-150 words.`
          modeLabel = 'Longer'
          break
        case 'impact':
          prompt = `Rewrite the following CV summary to be more impactful and results-oriented. Use stronger action verbs and emphasize achievements and value. Keep it 60-100 words.`
          modeLabel = 'More Impact'
          break
        case 'keywords':
          prompt = `Generate a professional CV summary using the following keywords: ${keywordsText?.trim()}. Make it concise, strong, and ATS-friendly. Write it in a confident tone with 2–3 sentences maximum.`
          modeLabel = 'From Keywords'
          break
      }

      const response = await fetch('/api/cv/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: mode === 'keywords' ? '' : summary,
          personalInfo,
          skills,
          instruction: prompt,
          latestRole: getLatestRole(),
          experiencePreview: getExperiencePreview(),
        }),
      })

      const data = await response.json()
      if (data.ok && data.summary) {
        // Check if suggestion is too similar (only for non-keywords mode)
        if (mode !== 'keywords' && areSimilar(summary, data.summary)) {
          setSimilarityWarning(true)
        } else {
          setSimilarityWarning(false)
        }
        
        setSuggestedSummary(data.summary)
        setSuggestionMode(modeLabel)
        setShowSuggestionCard(true)
        
        // Close keyword modal if it was open
        if (mode === 'keywords') {
          setShowKeywordModal(false)
        }
      } else {
        throw new Error(data.error || 'Failed to generate summary')
      }
    } catch (error: any) {
      console.error('AI summary error:', error)
      alert(error.message || 'Failed to generate summary. Please try again.')
    } finally {
      setIsSuggesting(false)
      setAiLoading(null)
      onLoadingChange(false)
    }
  }

  const handleUndo = () => {
    if (previousSummary) {
      onUpdate(previousSummary)
      setPreviousSummary('')
    }
  }

  const handleApplySuggestion = () => {
    if (suggestedSummary) {
      setPreviousSummary(summary) // Save current for undo
      onUpdate(suggestedSummary)
      
      // If this was a grammar fix, clear grammar issues
      if (suggestionMode === 'Grammar Fix') {
        setGrammarIssues(false)
      }
      
      setSuggestedSummary('')
      setSuggestionMode('')
      setShowSuggestionCard(false)
      setSimilarityWarning(false)
    }
  }

  const handleCancelSuggestion = () => {
    setSuggestedSummary('')
    setSuggestionMode('')
    setShowSuggestionCard(false)
    setSimilarityWarning(false)
  }

  const handleCopySuggestion = async () => {
    if (suggestedSummary) {
      try {
        await navigator.clipboard.writeText(suggestedSummary)
        alert('Suggestion copied to clipboard!')
      } catch (error) {
        console.error('Failed to copy:', error)
      }
    }
  }

  const handleFixGrammar = async () => {
    if (!summary.trim()) {
      alert('Please enter a summary first')
      return
    }

    setGrammarFixLoading(true)
    setIsSuggesting(true)
    onLoadingChange(true)
    setGrammarSuccessMessage('') // Clear any previous success message

    try {
      const prompt = `Fix ONLY grammar and spelling errors in the following CV summary. Do NOT rewrite, rephrase, or change the meaning. Preserve the original tone, style, and content. Only correct grammatical mistakes, spelling errors, and punctuation issues.

Important: If there are NO grammar or spelling issues, return the EXACT same text unchanged.`

      const response = await fetch('/api/cv/ai-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary,
          personalInfo,
          skills,
          instruction: prompt,
          latestRole: getLatestRole(),
          experiencePreview: getExperiencePreview(),
        }),
      })

      const data = await response.json()
      if (data.ok && data.summary) {
        // Check if the text is identical (no grammar issues found)
        const isSame = summary.trim() === data.summary.trim()
        
        if (isSame) {
          // No grammar issues - show success message
          setGrammarSuccessMessage('No grammar or spelling issues detected.')
          setGrammarIssues(false)
          // Auto-hide success message after 5 seconds
          setTimeout(() => setGrammarSuccessMessage(''), 5000)
        } else {
          // Grammar fixes found - show suggestion card
          setSuggestedSummary(data.summary)
          setSuggestionMode('Grammar Fix')
          setShowSuggestionCard(true)
          setSimilarityWarning(false)
        }
      } else {
        throw new Error(data.error || 'Failed to check grammar')
      }
    } catch (error: any) {
      console.error('Grammar check error:', error)
      alert(error.message || 'Failed to check grammar. Please try again.')
    } finally {
      setGrammarFixLoading(false)
      setIsSuggesting(false)
      onLoadingChange(false)
    }
  }

  const handleManualQualityCheck = async () => {
    if (!summary.trim()) {
      alert('Please enter a summary first')
      return
    }

    setQualityCheckLoading(true)

    try {
      const response = await fetch('/api/cv/check-summary-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary,
          latestRole: getLatestRole(),
        }),
      })

      const data = await response.json()
      if (data.ok && data.feedback) {
        setFeedback(data.feedback)
        setQualityStatus(data.status || 'good')
        setGrammarIssues(data.hasGrammarIssues || false)
      } else {
        throw new Error(data.error || 'Failed to check quality')
      }
    } catch (error: any) {
      console.error('Quality check error:', error)
      alert(error.message || 'Failed to check quality. Please try again.')
    } finally {
      setQualityCheckLoading(false)
    }
  }

  const handleGenerateFromKeywords = async () => {
    await runSummarySuggestion('keywords', keywords)
    setKeywords('') // Clear keywords after generating
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-1.5">Professional Summary</label>
        <textarea
          value={summary}
          onChange={(e) => onUpdate(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-y"
          placeholder="Write a compelling summary of your professional experience, skills, and career goals..."
        />
        <p className="mt-1.5 text-xs text-slate-500">Recommended: 60-100 words</p>

        {/* Summary Quality Indicator */}
        {qualityStatus && summary.trim() && (
          <div className="mt-3 p-3 bg-slate-800/30 border border-slate-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {qualityStatus === 'strong' && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">🟢 Strong</span>
                  </>
                )}
                {qualityStatus === 'good' && (
                  <>
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-medium text-yellow-400">🟡 Good</span>
                  </>
                )}
                {qualityStatus === 'needs-improvement' && (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-sm font-medium text-red-400">🔴 Needs Improvement</span>
                  </>
                )}
              </div>
              <span className="text-xs text-slate-500">
                {summary.trim().split(/\s+/).length} words
              </span>
            </div>
            
            {/* Feedback bullets */}
            {feedback.length > 0 && (
              <div className="space-y-1">
                {feedback.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs">
                    {item.type === 'success' && <span className="text-green-400 mt-0.5">✔</span>}
                    {item.type === 'warning' && <span className="text-yellow-400 mt-0.5">⚠</span>}
                    {item.type === 'error' && <span className="text-red-400 mt-0.5">✖</span>}
                    <span className={
                      item.type === 'success' ? 'text-slate-300' :
                      item.type === 'warning' ? 'text-slate-400' :
                      'text-slate-400'
                    }>{item.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Grammar & Spelling Alert */}
        {grammarIssues && summary.trim() && (
          <div className="mt-2 p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span className="text-xs text-amber-300">Minor grammar or spelling issues detected</span>
            </div>
            <button
              onClick={handleFixGrammar}
              disabled={grammarFixLoading || isSuggesting || qualityCheckLoading}
              className="ml-2 px-2.5 py-1 text-xs font-medium rounded-md bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 hover:border-amber-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 flex-shrink-0"
            >
              {grammarFixLoading ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <Zap className="w-3 h-3" />
                  Fix Grammar
                </>
              )}
            </button>
          </div>
        )}

        {/* Grammar Success Message */}
        {grammarSuccessMessage && (
          <div className="mt-2 p-2.5 bg-green-950/20 border border-green-500/30 rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-xs text-green-300">{grammarSuccessMessage}</span>
          </div>
        )}

        {/* Suggestion Card */}
        {showSuggestionCard && suggestedSummary && (
          <div className={`mt-3 p-4 rounded-lg space-y-3 ${
            suggestionMode === 'Grammar Fix' 
              ? 'bg-emerald-950/20 border border-emerald-500/30' 
              : 'bg-violet-950/20 border border-violet-500/30'
          }`}>
            <div className="flex items-center justify-between">
              <div>
                <h4 className={`text-sm font-semibold flex items-center gap-2 ${
                  suggestionMode === 'Grammar Fix' ? 'text-emerald-300' : 'text-violet-300'
                }`}>
                  {suggestionMode === 'Grammar Fix' ? (
                    <Zap className="w-4 h-4" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  {suggestionMode === 'Grammar Fix' ? 'Suggested Grammar Fix' : `Suggested Summary ${suggestionMode ? `(${suggestionMode})` : ''}`}
                </h4>
                {suggestionMode === 'Grammar Fix' && (
                  <p className="text-xs text-emerald-400/70 mt-1">Grammar & spelling improvements only</p>
                )}
              </div>
              <button
                onClick={handleCancelSuggestion}
                className="text-slate-400 hover:text-slate-200 transition"
                aria-label="Close suggestion"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Similarity Warning (only for non-grammar suggestions) */}
            {similarityWarning && suggestionMode !== 'Grammar Fix' && (
              <div className="p-2.5 bg-amber-950/20 border border-amber-500/30 rounded-lg flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-300">
                  No meaningful change found — try "More Impact" or add more detail to your current summary.
                </p>
              </div>
            )}
            
            {/* Preview box */}
            <div className="p-3 bg-slate-900/50 border border-slate-700/50 rounded-lg">
              <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                {suggestedSummary}
              </p>
              <div className="mt-2 text-xs text-slate-500">
                {suggestedSummary.trim().split(/\s+/).length} words
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <button
                onClick={handleApplySuggestion}
                disabled={similarityWarning}
                className={`flex-1 px-3 py-2 text-sm font-medium rounded-lg text-white transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                  suggestionMode === 'Grammar Fix' 
                    ? 'bg-emerald-600 hover:bg-emerald-500' 
                    : 'bg-violet-600 hover:bg-violet-500'
                }`}
              >
                <Check className="w-4 h-4" />
                Apply
              </button>
              <button
                onClick={handleCopySuggestion}
                className="px-3 py-2 text-sm font-medium rounded-lg bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600/50 transition"
                aria-label="Copy suggestion"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelSuggestion}
                className="px-3 py-2 text-sm font-medium rounded-lg bg-slate-800/50 text-slate-300 border border-slate-700/50 hover:bg-slate-700/50 hover:border-slate-600/50 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      {/* AI Summary Assistant */}
      <div className="pt-4 border-t border-slate-700/60">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <h3 className="text-sm font-semibold text-slate-300">AI Summary Assistant</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {/* Primary Action - Check Summary Quality (First) */}
          <button
            onClick={handleManualQualityCheck}
            disabled={qualityCheckLoading || isSuggesting || grammarFixLoading}
            data-jaz-action="cv_check_summary_quality"
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600/30 text-blue-200 border border-blue-500/50 hover:bg-blue-600/40 hover:border-blue-500/60 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shadow-sm"
          >
            {qualityCheckLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Checking...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Check Summary Quality
              </>
            )}
          </button>

          {/* Secondary Actions - AI Improvements */}
          <button
            onClick={() => runSummarySuggestion('improve')}
            disabled={isSuggesting || qualityCheckLoading || grammarFixLoading}
            data-jaz-action="cv_improve_summary"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {aiLoading === 'improve' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Improve Summary
          </button>
          <button
            onClick={() => runSummarySuggestion('shorter')}
            disabled={isSuggesting || qualityCheckLoading || grammarFixLoading}
            data-jaz-action="cv_make_shorter"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {aiLoading === 'shorter' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Make Shorter
          </button>
          <button
            onClick={() => runSummarySuggestion('longer')}
            disabled={isSuggesting || qualityCheckLoading || grammarFixLoading}
            data-jaz-action="cv_make_longer"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {aiLoading === 'longer' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            Make Longer
          </button>
          <button
            onClick={() => runSummarySuggestion('impact')}
            disabled={isSuggesting || qualityCheckLoading || grammarFixLoading}
            data-jaz-action="cv_more_impact"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            {aiLoading === 'impact' ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Sparkles className="w-3 h-3" />
            )}
            More Impact
          </button>
          <button
            onClick={() => setShowKeywordModal(true)}
            disabled={isSuggesting || qualityCheckLoading || grammarFixLoading}
            data-jaz-action="cv_generate_from_keywords"
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          >
            <Sparkles className="w-3 h-3" />
            Generate from Keywords
          </button>

          {/* Undo Action (Last) */}
          {previousSummary && (
            <button
              onClick={handleUndo}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700/70 transition flex items-center gap-1.5"
            >
              <Undo2 className="w-3 h-3" />
              Undo
            </button>
          )}
        </div>

        {/* Keyword Generation Modal */}
        {showKeywordModal && (
          <div className="mt-4 p-4 bg-slate-800/50 border border-slate-700/60 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold text-slate-300">Generate Summary from Keywords</h4>
              <button
                onClick={() => {
                  setShowKeywordModal(false)
                  setKeywords('')
                }}
                className="text-slate-400 hover:text-slate-200 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  placeholder="animation, leadership, adobe after effects, problem solving"
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey && keywords.trim()) {
                      e.preventDefault()
                      handleGenerateFromKeywords()
                    }
                  }}
                />
                {!keywords.trim() && (
                  <p className="mt-1.5 text-xs text-slate-500">
                    Enter keywords separated by commas
                  </p>
                )}
              </div>
              <button
                onClick={handleGenerateFromKeywords}
                disabled={aiLoading === 'keywords' || !keywords.trim()}
                data-jaz-action="cv_generate_from_keywords_modal"
                className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {aiLoading === 'keywords' ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Summary
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

