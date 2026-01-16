import { useState } from 'react'
import { X, Sparkles, CheckCircle2, AlertCircle, AlertTriangle, Loader2 } from 'lucide-react'
import SkillsAIModal from './SkillsAIModal'

interface SkillsTabProps {
  skills: string[]
  onUpdate: (skills: string[]) => void
  targetRole?: string
  summaryText?: string
  experiencePreview?: string
  onToast?: (type: 'success' | 'error', message: string) => void
  jobDescription?: string
}

type SkillsQualityRating = 'excellent' | 'good' | 'needs-improvement' | null

interface SkillsQualityFeedback {
  rating: SkillsQualityRating
  issues?: string[]
  missingSkills?: string[]
  strengths?: string[]
}

export default function SkillsTab({ 
  skills, 
  onUpdate, 
  targetRole,
  summaryText,
  experiencePreview,
  onToast,
  jobDescription,
}: SkillsTabProps) {
  const [inputValue, setInputValue] = useState('')
  const [showAIModal, setShowAIModal] = useState(false)
  const [qualityFeedback, setQualityFeedback] = useState<SkillsQualityFeedback | null>(null)
  const [checkingQuality, setCheckingQuality] = useState(false)

  const addSkill = () => {
    const trimmed = inputValue.trim()
    if (trimmed && !skills.includes(trimmed)) {
      onUpdate([...skills, trimmed])
      setInputValue('')
    }
  }

  const removeSkill = (index: number) => {
    onUpdate(skills.filter((_, i) => i !== index))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addSkill()
    }
  }

  // Check if we have any context for AI suggestions
  const hasContext = !!(targetRole?.trim() || summaryText?.trim() || experiencePreview?.trim())

  const handleApplyAISkills = (aiSkills: string[]) => {
    const existingLower = new Set(skills.map(s => s.toLowerCase().trim()))
    const merged = [...skills]
    let addedCount = 0

    for (const skill of aiSkills) {
      const cleaned = skill.trim()
      if (!cleaned) continue
      if (!existingLower.has(cleaned.toLowerCase())) {
        merged.push(cleaned)
        existingLower.add(cleaned.toLowerCase())
        addedCount++
      }
    }

    onUpdate(merged)
    
    if (onToast && addedCount > 0) {
      onToast('success', `Added ${addedCount} AI-suggested skill${addedCount > 1 ? 's' : ''}.`)
    }
  }

  const handleCheckQuality = async () => {
    if (skills.length === 0) {
      if (onToast) {
        onToast('error', 'Please add some skills first')
      }
      return
    }

    setCheckingQuality(true)
    setQualityFeedback(null)

    try {
      const response = await fetch('/api/cv/check-skills-quality', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          skills,
          targetRole,
          jobDescription,
          summaryText,
          experiencePreview,
        }),
      })

      const data = await response.json()
      
      if (data.ok && data.feedback) {
        setQualityFeedback(data.feedback)
      } else {
        throw new Error(data.error || 'Failed to check skills quality')
      }
    } catch (error: any) {
      console.error('Skills quality check error:', error)
      if (onToast) {
        onToast('error', error.message || 'Failed to check skills quality')
      }
    } finally {
      setCheckingQuality(false)
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-sm font-medium text-slate-300">Add Skills</label>
          <div className="flex gap-2">
            <button
              onClick={handleCheckQuality}
              disabled={checkingQuality || skills.length === 0}
              data-jaz-action="cv_check_skills_quality"
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5 bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 hover:border-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {checkingQuality ? (
                <>
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Checking...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3 h-3" />
                  🧠 Check Skills Quality
                </>
              )}
            </button>
            <div className="relative group">
              <button
                onClick={() => setShowAIModal(true)}
                disabled={!hasContext}
                data-jaz-action="cv_suggest_skills"
                className={`
                  rounded-lg px-3 py-1.5 text-xs font-medium transition flex items-center gap-1.5
                  ${hasContext
                    ? 'bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50'
                    : 'bg-slate-800/50 text-slate-500 border border-slate-700/50 cursor-not-allowed opacity-50'
                  }
                `}
                title={!hasContext ? "Add at least a target job title or a short summary first." : undefined}
              >
                <Sparkles className="w-3 h-3" />
                ⚡ AI Suggest Skills
              </button>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            placeholder="Type a skill and press Enter"
          />
          <button
            onClick={addSkill}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition text-sm font-medium"
          >
            Add
          </button>
        </div>
        <p className="mt-1.5 text-xs text-slate-500">Press Enter or click Add to add a skill</p>
      </div>

      {skills.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Your Skills ({skills.length})</label>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded-lg text-sm"
              >
                {skill}
                <button
                  onClick={() => removeSkill(index)}
                  className="hover:text-red-300 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Skills Quality Feedback */}
      {qualityFeedback && (
        <div className="mt-4 p-4 bg-slate-800/30 border border-slate-700/50 rounded-lg space-y-3">
          {/* Overall Rating */}
          <div className="flex items-center gap-2">
            {qualityFeedback.rating === 'excellent' && (
              <>
                <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-green-400">✅ Skills are relevant and ATS-friendly</span>
                  <p className="text-xs text-slate-400 mt-0.5">Your skills list is strong and well-aligned</p>
                </div>
              </>
            )}
            {qualityFeedback.rating === 'good' && (
              <>
                <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-blue-400">Good skill coverage</span>
                  <p className="text-xs text-slate-400 mt-0.5">Your skills are solid with room for minor improvements</p>
                </div>
              </>
            )}
            {qualityFeedback.rating === 'needs-improvement' && (
              <>
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0" />
                <div>
                  <span className="text-sm font-semibold text-amber-400">⚠️ Some skills could be improved for better job matching</span>
                  <p className="text-xs text-slate-400 mt-0.5">Review the feedback below to strengthen your skills</p>
                </div>
              </>
            )}
          </div>

          {/* Issues Detected */}
          {qualityFeedback.issues && qualityFeedback.issues.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-2">⚠️ Issues Detected</h4>
              <ul className="space-y-1">
                {qualityFeedback.issues.map((issue, idx) => (
                  <li key={idx} className="text-xs text-slate-400 pl-3 flex items-start gap-2">
                    <span className="text-amber-400 mt-0.5">•</span>
                    <span>{issue}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Missing Skills */}
          {qualityFeedback.missingSkills && qualityFeedback.missingSkills.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-2">💡 Missing or Recommended Skills</h4>
              <ul className="space-y-1">
                {qualityFeedback.missingSkills.map((skill, idx) => (
                  <li key={idx} className="text-xs text-slate-400 pl-3 flex items-start gap-2">
                    <span className="text-violet-400 mt-0.5">+</span>
                    <span>{skill}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Strengths */}
          {qualityFeedback.strengths && qualityFeedback.strengths.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-300 mb-2">✨ What's Already Strong</h4>
              <ul className="space-y-1">
                {qualityFeedback.strengths.map((strength, idx) => (
                  <li key={idx} className="text-xs text-slate-400 pl-3 flex items-start gap-2">
                    <span className="text-green-400 mt-0.5">✓</span>
                    <span>{strength}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Helper text */}
          <p className="text-xs text-slate-500 pt-2 border-t border-slate-700/50">
            Use "AI Suggest Skills" above to automatically add recommended skills based on your role.
          </p>
        </div>
      )}

      {/* AI Modal */}
      {showAIModal && (
        <SkillsAIModal
          isOpen={showAIModal}
          onClose={() => setShowAIModal(false)}
          onApply={handleApplyAISkills}
          targetRole={targetRole}
          summaryText={summaryText}
          experiencePreview={experiencePreview}
        />
      )}
    </div>
  )
}

