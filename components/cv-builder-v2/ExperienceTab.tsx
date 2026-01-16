import { useState } from 'react'
import { Plus, Trash2, Sparkles, CheckCircle2, Zap, Loader2, X, AlertTriangle, AlertCircle, ThumbsUp } from 'lucide-react'
import { CvData } from '@/app/cv-builder-v2/page'
import ExperienceAIModal from './ExperienceAIModal'

interface ExperienceTabProps {
  experience: CvData['experience']
  onUpdate: (experience: CvData['experience']) => void
}

type BulletQualityStatus = 'excellent' | 'good' | 'needs-improvement' | null
type BulletFeedbackItem = { type: 'success' | 'warning' | 'error'; text: string }

interface BulletQualityState {
  status: BulletQualityStatus
  feedback: BulletFeedbackItem[]
}

interface BulletSuggestion {
  original: string
  improved: string
  wordCountChange?: number
}

export default function ExperienceTab({ experience, onUpdate }: ExperienceTabProps) {
  const [openModalIndex, setOpenModalIndex] = useState<number | null>(null)
  
  // Quality check states per bullet: [expIndex][bulletIndex]
  const [bulletQuality, setBulletQuality] = useState<Record<string, BulletQualityState>>({})
  const [checkingBullet, setCheckingBullet] = useState<string | null>(null)
  
  // Grammar fix states per bullet
  const [bulletSuggestions, setBulletSuggestions] = useState<Record<string, BulletSuggestion>>({})
  const [fixingBullet, setFixingBullet] = useState<string | null>(null)
  
  // Improvement suggestion states per bullet
  const [improvementSuggestions, setImprovementSuggestions] = useState<Record<string, BulletSuggestion>>({})
  const [improvingBullet, setImprovingBullet] = useState<string | null>(null)
  
  // Previous bullet states for undo
  const [previousBullets, setPreviousBullets] = useState<Record<string, string>>({})
  
  const getBulletKey = (expIndex: number, bulletIndex: number) => `${expIndex}-${bulletIndex}`
  const addExperience = () => {
    onUpdate([
      ...experience,
      {
        id: Date.now().toString(),
        jobTitle: '',
        company: '',
        bullets: [''],
      },
    ])
  }

  const updateExperience = (index: number, updates: Partial<CvData['experience'][0]>) => {
    const updated = experience.map((exp, i) => (i === index ? { ...exp, ...updates } : exp))
    onUpdate(updated)
  }

  const removeExperience = (index: number) => {
    onUpdate(experience.filter((_, i) => i !== index))
  }

  const updateBullet = (expIndex: number, bulletIndex: number, value: string) => {
    const exp = experience[expIndex]
    const bullets = [...exp.bullets]
    bullets[bulletIndex] = value
    updateExperience(expIndex, { bullets })
  }

  const addBullet = (expIndex: number) => {
    const exp = experience[expIndex]
    updateExperience(expIndex, { bullets: [...exp.bullets, ''] })
  }

  const removeBullet = (expIndex: number, bulletIndex: number) => {
    const exp = experience[expIndex]
    const bullets = exp.bullets.filter((_, i) => i !== bulletIndex)
    updateExperience(expIndex, { bullets: bullets.length > 0 ? bullets : [''] })
    
    // Clean up states for removed bullet
    const key = getBulletKey(expIndex, bulletIndex)
    const newQuality = { ...bulletQuality }
    delete newQuality[key]
    setBulletQuality(newQuality)
    
    const newSuggestions = { ...bulletSuggestions }
    delete newSuggestions[key]
    setBulletSuggestions(newSuggestions)
  }

  const handleCheckBulletQuality = async (expIndex: number, bulletIndex: number) => {
    const bullet = experience[expIndex].bullets[bulletIndex]
    if (!bullet.trim()) {
      alert('Please enter a bullet point first')
      return
    }

    const key = getBulletKey(expIndex, bulletIndex)
    setCheckingBullet(key)

    try {
      const response = await fetch('/api/cv/check-bullet-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullet,
          jobTitle: experience[expIndex].jobTitle,
        }),
      })

      const data = await response.json()
      if (data.ok) {
        setBulletQuality({
          ...bulletQuality,
          [key]: {
            status: data.status || 'good',
            feedback: data.feedback || [],
          },
        })
      } else {
        throw new Error(data.error || 'Failed to check quality')
      }
    } catch (error: any) {
      console.error('Bullet quality check error:', error)
      alert(error.message || 'Failed to check quality. Please try again.')
    } finally {
      setCheckingBullet(null)
    }
  }

  const handleFixBulletGrammar = async (expIndex: number, bulletIndex: number) => {
    const bullet = experience[expIndex].bullets[bulletIndex]
    if (!bullet.trim()) {
      alert('Please enter a bullet point first')
      return
    }

    const key = getBulletKey(expIndex, bulletIndex)
    setFixingBullet(key)

    try {
      const response = await fetch('/api/cv/fix-bullet-grammar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullet,
          jobTitle: experience[expIndex].jobTitle,
        }),
      })

      const data = await response.json()
      if (data.ok && data.improved) {
        const originalWordCount = bullet.trim().split(/\s+/).length
        const improvedWordCount = data.improved.trim().split(/\s+/).length
        
        setBulletSuggestions({
          ...bulletSuggestions,
          [key]: {
            original: bullet,
            improved: data.improved,
            wordCountChange: improvedWordCount - originalWordCount,
          },
        })
      } else {
        throw new Error(data.error || 'Failed to fix grammar')
      }
    } catch (error: any) {
      console.error('Bullet grammar fix error:', error)
      alert(error.message || 'Failed to fix grammar. Please try again.')
    } finally {
      setFixingBullet(null)
    }
  }

  const handleSuggestImprovement = async (expIndex: number, bulletIndex: number) => {
    const bullet = experience[expIndex].bullets[bulletIndex]
    if (!bullet.trim()) {
      alert('Please enter a bullet point first')
      return
    }

    const key = getBulletKey(expIndex, bulletIndex)
    setImprovingBullet(key)

    try {
      const response = await fetch('/api/cv/improve-bullet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bullet,
          jobTitle: experience[expIndex].jobTitle,
          isCurrent: experience[expIndex].isCurrent || false,
        }),
      })

      const data = await response.json()
      if (data.ok && data.improved) {
        const originalWordCount = bullet.trim().split(/\s+/).length
        const improvedWordCount = data.improved.trim().split(/\s+/).length
        
        setImprovementSuggestions({
          ...improvementSuggestions,
          [key]: {
            original: bullet,
            improved: data.improved,
            wordCountChange: improvedWordCount - originalWordCount,
          },
        })
      } else {
        throw new Error(data.error || 'Failed to generate improvement')
      }
    } catch (error: any) {
      console.error('Bullet improvement error:', error)
      alert(error.message || 'Failed to suggest improvement. Please try again.')
    } finally {
      setImprovingBullet(null)
    }
  }

  const handleApplySuggestion = (expIndex: number, bulletIndex: number, type: 'grammar' | 'improvement' = 'grammar') => {
    const key = getBulletKey(expIndex, bulletIndex)
    const suggestion = type === 'grammar' ? bulletSuggestions[key] : improvementSuggestions[key]
    if (!suggestion) return

    // Save original for undo
    setPreviousBullets({
      ...previousBullets,
      [key]: suggestion.original,
    })

    // Apply improved bullet
    updateBullet(expIndex, bulletIndex, suggestion.improved)
    
    // Clear suggestion
    if (type === 'grammar') {
      const newSuggestions = { ...bulletSuggestions }
      delete newSuggestions[key]
      setBulletSuggestions(newSuggestions)
    } else {
      const newSuggestions = { ...improvementSuggestions }
      delete newSuggestions[key]
      setImprovementSuggestions(newSuggestions)
    }
    
    // Clear quality check (user can re-check after)
    const newQuality = { ...bulletQuality }
    delete newQuality[key]
    setBulletQuality(newQuality)
  }

  const handleCancelSuggestion = (expIndex: number, bulletIndex: number, type: 'grammar' | 'improvement' = 'grammar') => {
    const key = getBulletKey(expIndex, bulletIndex)
    
    if (type === 'grammar') {
      const newSuggestions = { ...bulletSuggestions }
      delete newSuggestions[key]
      setBulletSuggestions(newSuggestions)
    } else {
      const newSuggestions = { ...improvementSuggestions }
      delete newSuggestions[key]
      setImprovementSuggestions(newSuggestions)
    }
  }

  const handleUndoBullet = (expIndex: number, bulletIndex: number) => {
    const key = getBulletKey(expIndex, bulletIndex)
    const previous = previousBullets[key]
    if (previous) {
      updateBullet(expIndex, bulletIndex, previous)
      
      // Clear undo state
      const newPrevious = { ...previousBullets }
      delete newPrevious[key]
      setPreviousBullets(newPrevious)
    }
  }

  const handleAIGenerate = (expIndex: number, result: { responsibilities?: string[]; achievements?: string[] }) => {
    const exp = experience[expIndex]
    const existingBullets = exp.bullets.filter((b) => b.trim().length > 0)
    const newBullets: string[] = []

    // If both sections are present, add them with labels
    if (result.responsibilities && result.responsibilities.length > 0 && result.achievements && result.achievements.length > 0) {
      // Add responsibilities
      newBullets.push(...result.responsibilities)
      // Add achievements
      newBullets.push(...result.achievements)
    } else if (result.responsibilities && result.responsibilities.length > 0) {
      newBullets.push(...result.responsibilities)
    } else if (result.achievements && result.achievements.length > 0) {
      newBullets.push(...result.achievements)
    }

    // Merge with existing bullets
    if (existingBullets.length === 0) {
      // If field is empty, replace with new bullets
      updateExperience(expIndex, { bullets: newBullets.length > 0 ? newBullets : [''] })
    } else {
      // If field has content, append new bullets
      updateExperience(expIndex, { bullets: [...existingBullets, ...newBullets] })
    }
  }

  return (
    <div className="space-y-6">
      {experience.map((exp, expIndex) => (
        <div key={exp.id} className="p-4 bg-slate-900/30 rounded-lg border border-slate-700/50">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-sm font-semibold text-slate-300">Experience #{expIndex + 1}</h3>
            <button
              onClick={() => removeExperience(expIndex)}
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition"
              title="Remove this experience"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Job Title *</label>
              <input
                type="text"
                value={exp.jobTitle}
                onChange={(e) => updateExperience(expIndex, { jobTitle: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                placeholder="Senior Software Engineer"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Company *</label>
                <input
                  type="text"
                  value={exp.company}
                  onChange={(e) => updateExperience(expIndex, { company: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                  placeholder="Company Name"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Location</label>
                <input
                  type="text"
                  value={exp.location || ''}
                  onChange={(e) => updateExperience(expIndex, { location: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">Start Date</label>
                <input
                  type="text"
                  value={exp.startDate || ''}
                  onChange={(e) => updateExperience(expIndex, { startDate: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                  placeholder="Jan 2020"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">End Date</label>
                <input
                  type="text"
                  value={exp.endDate || ''}
                  onChange={(e) => updateExperience(expIndex, { endDate: e.target.value })}
                  disabled={exp.isCurrent}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm disabled:opacity-50"
                  placeholder="Present"
                />
              </div>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <input
                type="checkbox"
                checked={exp.isCurrent || false}
                onChange={(e) => updateExperience(expIndex, { isCurrent: e.target.checked, endDate: e.target.checked ? undefined : exp.endDate })}
                className="h-4 w-4 rounded border-slate-600 bg-slate-800 text-violet-600 focus:ring-violet-500"
              />
              <span className="text-xs md:text-sm text-slate-200">
                Currently working here
              </span>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-2">Responsibilities & Achievements</label>
              <div className="space-y-3">
                {exp.bullets.map((bullet, bulletIndex) => {
                  const key = getBulletKey(expIndex, bulletIndex)
                  const quality = bulletQuality[key]
                  const grammarSuggestion = bulletSuggestions[key]
                  const improvementSuggestion = improvementSuggestions[key]
                  const hasPrevious = !!previousBullets[key]
                  const isChecking = checkingBullet === key
                  const isFixing = fixingBullet === key

                  return (
                    <div key={bulletIndex} className="space-y-2">
                      {/* Bullet Input and Delete Button */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={bullet}
                          onChange={(e) => updateBullet(expIndex, bulletIndex, e.target.value)}
                          className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                          placeholder="Achieved X by doing Y, resulting in Z..."
                        />
                        {exp.bullets.length > 1 && (
                          <button
                            onClick={() => removeBullet(expIndex, bulletIndex)}
                            className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition flex-shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>

                      {/* Inline Action Buttons */}
                      {bullet.trim() && (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => handleCheckBulletQuality(expIndex, bulletIndex)}
                            disabled={isChecking || isFixing || improvingBullet === key}
                            className="px-2 py-1 text-xs font-medium rounded-md bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 hover:border-blue-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {isChecking ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Checking...
                              </>
                            ) : (
                              <>
                                <CheckCircle2 className="w-3 h-3" />
                                Check
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleSuggestImprovement(expIndex, bulletIndex)}
                            disabled={improvingBullet === key || isChecking || isFixing}
                            className="px-2 py-1 text-xs font-medium rounded-md bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {improvingBullet === key ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Improving...
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-3 h-3" />
                                Suggest Improvement
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => handleFixBulletGrammar(expIndex, bulletIndex)}
                            disabled={isFixing || isChecking || improvingBullet === key}
                            className="px-2 py-1 text-xs font-medium rounded-md bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 hover:border-amber-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                          >
                            {isFixing ? (
                              <>
                                <Loader2 className="w-3 h-3 animate-spin" />
                                Fixing...
                              </>
                            ) : (
                              <>
                                <Zap className="w-3 h-3" />
                                Fix grammar
                              </>
                            )}
                          </button>

                          {hasPrevious && (
                            <button
                              onClick={() => handleUndoBullet(expIndex, bulletIndex)}
                              className="px-2 py-1 text-xs font-medium rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700/70 transition flex items-center gap-1"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                              </svg>
                              Undo
                            </button>
                          )}
                        </div>
                      )}

                      {/* Quality Feedback Display */}
                      {quality && bullet.trim() && (
                        <div className="p-2.5 bg-slate-800/30 border border-slate-700/50 rounded-lg">
                          <div className="flex items-center gap-2 mb-1.5">
                            {quality.status === 'excellent' && (
                              <>
                                <ThumbsUp className="w-3.5 h-3.5 text-green-400" />
                                <span className="text-xs font-medium text-green-400">Excellent</span>
                              </>
                            )}
                            {quality.status === 'good' && (
                              <>
                                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                                <span className="text-xs font-medium text-blue-400">Good</span>
                              </>
                            )}
                            {quality.status === 'needs-improvement' && (
                              <>
                                <AlertCircle className="w-3.5 h-3.5 text-yellow-400" />
                                <span className="text-xs font-medium text-yellow-400">Needs Improvement</span>
                              </>
                            )}
                          </div>
                          {quality.feedback.length > 0 ? (
                            <div className="space-y-0.5">
                              {quality.feedback.map((item, idx) => (
                                <div key={idx} className="flex items-start gap-1.5 text-xs">
                                  {item.type === 'success' && <span className="text-green-400 mt-0.5">•</span>}
                                  {item.type === 'warning' && <span className="text-yellow-400 mt-0.5">•</span>}
                                  {item.type === 'error' && <span className="text-red-400 mt-0.5">•</span>}
                                  <span className="text-slate-400">{item.text}</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-400">This bullet is clear and well-written.</p>
                          )}
                        </div>
                      )}

                      {/* Improvement Suggestion Card */}
                      {improvementSuggestion && (
                        <div className="p-3 bg-violet-950/20 border border-violet-500/30 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-violet-300">✨ Suggested Improvement</span>
                            <button
                              onClick={() => handleCancelSuggestion(expIndex, bulletIndex, 'improvement')}
                              className="text-slate-400 hover:text-slate-200"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          {/* Original (collapsed) */}
                          <div className="text-xs text-slate-500 italic line-through">
                            {improvementSuggestion.original}
                          </div>
                          
                          {/* Improved */}
                          <div className="text-sm text-slate-200 bg-slate-900/50 p-2 rounded border border-violet-500/20">
                            {improvementSuggestion.improved}
                          </div>
                          
                          {improvementSuggestion.wordCountChange !== undefined && improvementSuggestion.wordCountChange !== 0 && (
                            <div className="text-xs text-slate-400">
                              Word count: {improvementSuggestion.wordCountChange > 0 ? '+' : ''}{improvementSuggestion.wordCountChange}
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApplySuggestion(expIndex, bulletIndex, 'improvement')}
                              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition flex items-center justify-center gap-1"
                            >
                              ✅ Apply
                            </button>
                            <button
                              onClick={() => handleCancelSuggestion(expIndex, bulletIndex, 'improvement')}
                              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700/70 transition flex items-center justify-center gap-1"
                            >
                              ❌ Cancel
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Grammar Fix Suggestion Card */}
                      {grammarSuggestion && (
                        <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-lg space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-amber-300">⚡ Grammar Fix</span>
                            <button
                              onClick={() => handleCancelSuggestion(expIndex, bulletIndex, 'grammar')}
                              className="text-slate-400 hover:text-slate-200"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          
                          {/* Original (collapsed) */}
                          <div className="text-xs text-slate-500 italic line-through">
                            {grammarSuggestion.original}
                          </div>
                          
                          {/* Improved */}
                          <div className="text-sm text-slate-200 bg-slate-900/50 p-2 rounded border border-amber-500/20">
                            {grammarSuggestion.improved}
                          </div>
                          
                          {grammarSuggestion.wordCountChange !== undefined && grammarSuggestion.wordCountChange !== 0 && (
                            <div className="text-xs text-slate-400">
                              Word count: {grammarSuggestion.wordCountChange > 0 ? '+' : ''}{grammarSuggestion.wordCountChange}
                            </div>
                          )}
                          
                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleApplySuggestion(expIndex, bulletIndex, 'grammar')}
                              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 hover:border-amber-500/50 transition flex items-center justify-center gap-1"
                            >
                              ✅ Apply
                            </button>
                            <button
                              onClick={() => handleCancelSuggestion(expIndex, bulletIndex, 'grammar')}
                              className="flex-1 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700/70 transition flex items-center justify-center gap-1"
                            >
                              ❌ Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
                <button
                  onClick={() => addBullet(expIndex)}
                  className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" />
                  Add bullet point
                </button>
              </div>
              {/* AI Generate Button */}
              <div className="mt-2">
                <button
                  onClick={() => setOpenModalIndex(expIndex)}
                  disabled={!exp.jobTitle.trim()}
                  className={`
                    rounded-lg px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5
                    ${exp.jobTitle.trim()
                      ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50'
                      : 'bg-slate-800/50 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50'
                    }
                  `}
                  title={!exp.jobTitle.trim() ? "Add a Job Title first so I can suggest relevant bullet points." : undefined}
                >
                  <Sparkles className="w-3 h-3" />
                  AI Generate Bullet Points
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* AI Modal */}
      {openModalIndex !== null && experience[openModalIndex] && (
        <ExperienceAIModal
          isOpen={true}
          onClose={() => setOpenModalIndex(null)}
          onApply={(result) => {
            handleAIGenerate(openModalIndex, result)
            setOpenModalIndex(null)
          }}
          jobTitle={experience[openModalIndex].jobTitle}
          company={experience[openModalIndex].company}
        />
      )}

      <button
        onClick={addExperience}
        data-jaz-action="cv_add_experience"
        data-cv-section="experience"
        className="w-full py-2.5 px-4 bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded-lg hover:bg-violet-600/30 hover:border-violet-500/50 transition flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Add Experience
      </button>
    </div>
  )
}

