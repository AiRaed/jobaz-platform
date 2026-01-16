import { useState } from 'react'
import { Plus, Trash2, Sparkles, Loader2, CheckCircle2, AlertCircle, AlertTriangle, Zap, Copy, Undo2, X } from 'lucide-react'
import { CvData } from '@/app/cv-builder-v2/page'

interface MoreTabProps {
  projects: CvData['projects']
  languages: CvData['languages']
  certifications: CvData['certifications']
  publications?: CvData['publications']
  onUpdate: (updates: Partial<Pick<CvData, 'projects' | 'languages' | 'certifications' | 'publications'>>) => void
}

type Publication = NonNullable<CvData['publications']>[0]
type QualityStatus = 'Strong' | 'Good' | 'Needs Improvement' | null

interface PublicationSuggestion {
  title: string
  notes: string
  qualityRating: QualityStatus
  issues: string[]
}

export default function MoreTab({ projects, languages, certifications, publications, onUpdate }: MoreTabProps) {
  const [newProject, setNewProject] = useState({ name: '', description: '', url: '' })
  const [newLanguage, setNewLanguage] = useState('')
  const [newCertification, setNewCertification] = useState('')
  
  // Publications state
  const [newPublication, setNewPublication] = useState<Partial<Publication>>({
    title: '',
    authors: '',
    venueOrJournal: '',
    year: '',
    doiOrUrl: '',
    notes: '',
  })
  const [publicationSuggestions, setPublicationSuggestions] = useState<Record<number, PublicationSuggestion>>({})
  const [publicationPrevious, setPublicationPrevious] = useState<Record<number, { title: string; notes: string }>>({})
  const [publicationLoading, setPublicationLoading] = useState<Record<number, string | null>>({})
  const [academicStyle, setAcademicStyle] = useState(true)

  const addProject = () => {
    if (newProject.name.trim()) {
      onUpdate({ projects: [...(projects || []), { ...newProject }] })
      setNewProject({ name: '', description: '', url: '' })
    }
  }

  const removeProject = (index: number) => {
    onUpdate({ projects: (projects || []).filter((_, i) => i !== index) })
  }

  const addLanguage = () => {
    if (newLanguage.trim() && !languages?.includes(newLanguage.trim())) {
      onUpdate({ languages: [...(languages || []), newLanguage.trim()] })
      setNewLanguage('')
    }
  }

  const removeLanguage = (index: number) => {
    onUpdate({ languages: (languages || []).filter((_, i) => i !== index) })
  }

  const addCertification = () => {
    if (newCertification.trim() && !certifications?.includes(newCertification.trim())) {
      onUpdate({ certifications: [...(certifications || []), newCertification.trim()] })
      setNewCertification('')
    }
  }

  const removeCertification = (index: number) => {
    onUpdate({ certifications: (certifications || []).filter((_, i) => i !== index) })
  }

  // Publications handlers
  const addPublication = () => {
    if (newPublication.title?.trim()) {
      const pub: Publication = {
        title: newPublication.title.trim(),
        authors: newPublication.authors?.trim() || undefined,
        venueOrJournal: newPublication.venueOrJournal?.trim() || undefined,
        year: newPublication.year?.trim() || undefined,
        doiOrUrl: newPublication.doiOrUrl?.trim() || undefined,
        notes: newPublication.notes?.trim() || undefined,
      }
      onUpdate({ publications: [...(publications || []), pub] })
      setNewPublication({
        title: '',
        authors: '',
        venueOrJournal: '',
        year: '',
        doiOrUrl: '',
        notes: '',
      })
    }
  }

  const removePublication = (index: number) => {
    onUpdate({ publications: (publications || []).filter((_, i) => i !== index) })
    // Clean up state
    const newSuggestions = { ...publicationSuggestions }
    delete newSuggestions[index]
    setPublicationSuggestions(newSuggestions)
    const newPrevious = { ...publicationPrevious }
    delete newPrevious[index]
    setPublicationPrevious(newPrevious)
    const newLoading = { ...publicationLoading }
    delete newLoading[index]
    setPublicationLoading(newLoading)
  }

  const updatePublication = (index: number, updates: Partial<Publication>) => {
    const updated = (publications || []).map((pub, i) => 
      i === index ? { ...pub, ...updates } : pub
    )
    onUpdate({ publications: updated })
  }

  const handlePublicationAI = async (index: number, action: 'check' | 'improve' | 'grammar') => {
    const pub = (publications || [])[index]
    if (!pub) return

    setPublicationLoading({ ...publicationLoading, [index]: action })

    try {
      const response = await fetch('/api/cv/improve-publication', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: pub.title,
          authors: pub.authors || '',
          venueOrJournal: pub.venueOrJournal || '',
          year: pub.year || '',
          doiOrUrl: pub.doiOrUrl || '',
          notes: pub.notes || '',
          mode: academicStyle ? 'academic' : 'cv',
          action,
        }),
      })

      const data = await response.json()
      if (data.ok) {
        if (action === 'check') {
          setPublicationSuggestions({
            ...publicationSuggestions,
            [index]: {
              title: pub.title,
              notes: pub.notes || '',
              qualityRating: data.qualityRating || null,
              issues: data.issues || [],
            },
          })
        } else {
          // Store previous state before showing suggestion
          setPublicationPrevious({
            ...publicationPrevious,
            [index]: { title: pub.title, notes: pub.notes || '' },
          })
          setPublicationSuggestions({
            ...publicationSuggestions,
            [index]: {
              title: data.improved.title,
              notes: data.improved.notes,
              qualityRating: data.qualityRating || null,
              issues: data.issues || [],
            },
          })
        }
      } else {
        throw new Error(data.error || 'Failed to process publication')
      }
    } catch (error: any) {
      console.error('Publication AI error:', error)
      alert(error.message || 'Failed to process publication. Please try again.')
    } finally {
      setPublicationLoading({ ...publicationLoading, [index]: null })
    }
  }

  const applyPublicationSuggestion = (index: number) => {
    const suggestion = publicationSuggestions[index]
    if (!suggestion) return

    updatePublication(index, {
      title: suggestion.title,
      notes: suggestion.notes,
    })
    // Keep suggestion visible but mark as applied
  }

  const cancelPublicationSuggestion = (index: number) => {
    const newSuggestions = { ...publicationSuggestions }
    delete newSuggestions[index]
    setPublicationSuggestions(newSuggestions)
  }

  const undoPublication = (index: number) => {
    const previous = publicationPrevious[index]
    if (!previous) return

    updatePublication(index, {
      title: previous.title,
      notes: previous.notes,
    })
    const newSuggestions = { ...publicationSuggestions }
    delete newSuggestions[index]
    setPublicationSuggestions(newSuggestions)
  }

  const copyPublicationText = (index: number) => {
    const suggestion = publicationSuggestions[index]
    if (!suggestion) return

    const text = `${suggestion.title}\n\n${suggestion.notes || ''}`
    navigator.clipboard.writeText(text)
    alert('Copied to clipboard!')
  }

  return (
    <div className="space-y-6">
      {/* Projects */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Projects</h3>
        <div className="space-y-3 mb-4">
          {(projects || []).map((project, index) => (
            <div key={index} className="p-3 bg-slate-900/30 rounded-lg border border-slate-700/50">
              <div className="flex justify-between items-start mb-2">
                <span className="font-medium text-slate-200">{project.name}</span>
                <button
                  onClick={() => removeProject(index)}
                  className="p-1 text-red-400 hover:text-red-300"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-1">{project.description}</p>
              {project.url && <p className="text-xs text-violet-400">{project.url}</p>}
            </div>
          ))}
        </div>
        <div className="space-y-2 p-3 bg-slate-900/20 rounded-lg border border-slate-700/30">
          <input
            type="text"
            value={newProject.name}
            onChange={(e) => setNewProject({ ...newProject, name: e.target.value })}
            placeholder="Project name"
            className="w-full px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
          <input
            type="text"
            value={newProject.description}
            onChange={(e) => setNewProject({ ...newProject, description: e.target.value })}
            placeholder="Description"
            className="w-full px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
          <input
            type="url"
            value={newProject.url}
            onChange={(e) => setNewProject({ ...newProject, url: e.target.value })}
            placeholder="URL (optional)"
            className="w-full px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
          <button
            onClick={addProject}
            className="w-full py-1.5 px-3 bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded hover:bg-violet-600/30 text-sm font-medium flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Project
          </button>
        </div>
      </div>

      {/* Languages */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Languages</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addLanguage()}
            placeholder="e.g., English (Native), Spanish (Fluent)"
            className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
          <button
            onClick={addLanguage}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition text-sm"
          >
            Add
          </button>
        </div>
        {(languages || []).length > 0 && (
          <div className="flex flex-wrap gap-2">
            {(languages || []).map((lang, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800/50 text-slate-300 border border-slate-700 rounded-lg text-sm"
              >
                {lang}
                <button onClick={() => removeLanguage(index)} className="hover:text-red-300">
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Certifications */}
      <div>
        <h3 className="text-sm font-semibold text-slate-300 mb-3">Certifications</h3>
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={newCertification}
            onChange={(e) => setNewCertification(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addCertification()}
            placeholder="e.g., AWS Certified Solutions Architect"
            className="flex-1 px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
          <button
            onClick={addCertification}
            className="px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-500 transition text-sm"
          >
            Add
          </button>
        </div>
        {(certifications || []).length > 0 && (
          <div className="space-y-2">
            {(certifications || []).map((cert, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 bg-slate-900/30 rounded border border-slate-700/50"
              >
                <span className="text-sm text-slate-300">{cert}</span>
                <button onClick={() => removeCertification(index)} className="p-1 text-red-400 hover:text-red-300">
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Publications */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300">Publications</h3>
          <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={academicStyle}
              onChange={(e) => setAcademicStyle(e.target.checked)}
              className="w-3 h-3 rounded border-slate-600 bg-slate-800 text-violet-600 focus:ring-violet-500"
            />
            <span>Academic style</span>
          </label>
        </div>

        {/* Existing Publications */}
        {(publications || []).length > 0 && (
          <div className="space-y-4 mb-4">
            {(publications || []).map((pub, index) => {
              const suggestion = publicationSuggestions[index]
              const loading = publicationLoading[index]
              const hasGrammarIssues = suggestion?.issues?.some(i => i.toLowerCase().includes('grammar') || i.toLowerCase().includes('spelling'))

              return (
                <div key={index} className="space-y-3">
                  <div className="p-4 bg-slate-900/30 rounded-lg border border-slate-700/50">
                    {/* Editable Fields */}
                    <div className="space-y-2 mb-3">
                      <input
                        type="text"
                        value={pub.title}
                        onChange={(e) => updatePublication(index, { title: e.target.value })}
                        placeholder="Title (required)"
                        className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm font-medium"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={pub.authors || ''}
                          onChange={(e) => updatePublication(index, { authors: e.target.value })}
                          placeholder="Authors (optional)"
                          className="px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                        />
                        <input
                          type="text"
                          value={pub.year || ''}
                          onChange={(e) => updatePublication(index, { year: e.target.value })}
                          placeholder="Year (optional)"
                          className="px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                        />
                      </div>
                      <input
                        type="text"
                        value={pub.venueOrJournal || ''}
                        onChange={(e) => updatePublication(index, { venueOrJournal: e.target.value })}
                        placeholder="Journal/Conference (optional)"
                        className="w-full px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                      />
                      <input
                        type="text"
                        value={pub.doiOrUrl || ''}
                        onChange={(e) => updatePublication(index, { doiOrUrl: e.target.value })}
                        placeholder="DOI/URL (optional)"
                        className="w-full px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
                      />
                      <textarea
                        value={pub.notes || ''}
                        onChange={(e) => updatePublication(index, { notes: e.target.value })}
                        placeholder="Notes/Description (optional)"
                        rows={2}
                        className="w-full px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-y"
                      />
                    </div>

                    {/* AI Tools Row */}
                    <div className="flex flex-wrap gap-2 mb-2">
                      <button
                        onClick={() => handlePublicationAI(index, 'check')}
                        disabled={!!loading}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 hover:bg-blue-600/30 hover:border-blue-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {loading === 'check' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-3 h-3" />
                        )}
                        Check Quality
                      </button>
                      <button
                        onClick={() => handlePublicationAI(index, 'improve')}
                        disabled={!!loading}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                      >
                        {loading === 'improve' ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Sparkles className="w-3 h-3" />
                        )}
                        Improve Publication
                      </button>
                      {hasGrammarIssues && (
                        <button
                          onClick={() => handlePublicationAI(index, 'grammar')}
                          disabled={!!loading}
                          className="px-2.5 py-1 text-xs font-medium rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 hover:bg-amber-600/30 hover:border-amber-500/50 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
                        >
                          {loading === 'grammar' ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Zap className="w-3 h-3" />
                          )}
                          Fix Grammar
                        </button>
                      )}
                      <button
                        onClick={() => removePublication(index)}
                        className="px-2.5 py-1 text-xs font-medium rounded-lg bg-red-600/20 text-red-300 border border-red-500/30 hover:bg-red-600/30 hover:border-red-500/50 transition flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3 h-3" />
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Suggested Publication Preview Card */}
                  {suggestion && (
                    <div className="p-4 bg-violet-950/20 border border-violet-500/30 rounded-lg">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-violet-300">Suggested Publication</h4>
                        <button
                          onClick={() => cancelPublicationSuggestion(index)}
                          className="text-slate-400 hover:text-slate-200 transition"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Quality Rating */}
                      {suggestion.qualityRating && (
                        <div className="mb-3 flex items-center gap-2">
                          {suggestion.qualityRating === 'Strong' && (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              <span className="text-xs font-medium text-green-400">🟢 Strong</span>
                            </>
                          )}
                          {suggestion.qualityRating === 'Good' && (
                            <>
                              <AlertCircle className="w-4 h-4 text-yellow-400" />
                              <span className="text-xs font-medium text-yellow-400">🟡 Good</span>
                            </>
                          )}
                          {suggestion.qualityRating === 'Needs Improvement' && (
                            <>
                              <AlertTriangle className="w-4 h-4 text-red-400" />
                              <span className="text-xs font-medium text-red-400">🔴 Needs Improvement</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Issues List */}
                      {suggestion.issues.length > 0 && (
                        <div className="mb-3 space-y-1">
                          {suggestion.issues.map((issue, idx) => (
                            <div key={idx} className="flex items-start gap-2 text-xs">
                              <span className="text-yellow-400 mt-0.5">⚠</span>
                              <span className="text-slate-300">{issue}</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Improved Fields */}
                      <div className="space-y-2 mb-3">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Title</label>
                          <p className="text-sm text-slate-200 font-medium">{suggestion.title}</p>
                        </div>
                        {suggestion.notes && (
                          <div>
                            <label className="text-xs text-slate-400 mb-1 block">Notes</label>
                            <p className="text-sm text-slate-300">{suggestion.notes}</p>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => applyPublicationSuggestion(index)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-violet-600/20 text-violet-300 border border-violet-500/30 hover:bg-violet-600/30 hover:border-violet-500/50 transition flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Apply
                        </button>
                        <button
                          onClick={() => copyPublicationText(index)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700/70 transition flex items-center gap-1.5"
                        >
                          <Copy className="w-3 h-3" />
                          Copy
                        </button>
                        {publicationPrevious[index] && (
                          <button
                            onClick={() => undoPublication(index)}
                            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700/70 transition flex items-center gap-1.5"
                          >
                            <Undo2 className="w-3 h-3" />
                            Undo
                          </button>
                        )}
                        <button
                          onClick={() => cancelPublicationSuggestion(index)}
                          className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700/70 transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add Publication Form */}
        <div className="space-y-2 p-3 bg-slate-900/20 rounded-lg border border-slate-700/30">
          <input
            type="text"
            value={newPublication.title || ''}
            onChange={(e) => setNewPublication({ ...newPublication, title: e.target.value })}
            placeholder="Title (required)"
            className="w-full px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              value={newPublication.authors || ''}
              onChange={(e) => setNewPublication({ ...newPublication, authors: e.target.value })}
              placeholder="Authors (optional)"
              className="px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
            <input
              type="text"
              value={newPublication.year || ''}
              onChange={(e) => setNewPublication({ ...newPublication, year: e.target.value })}
              placeholder="Year (optional)"
              className="px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
            />
          </div>
          <input
            type="text"
            value={newPublication.venueOrJournal || ''}
            onChange={(e) => setNewPublication({ ...newPublication, venueOrJournal: e.target.value })}
            placeholder="Journal/Conference (optional)"
            className="w-full px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
          <input
            type="text"
            value={newPublication.doiOrUrl || ''}
            onChange={(e) => setNewPublication({ ...newPublication, doiOrUrl: e.target.value })}
            placeholder="DOI/URL (optional)"
            className="w-full px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
          />
          <textarea
            value={newPublication.notes || ''}
            onChange={(e) => setNewPublication({ ...newPublication, notes: e.target.value })}
            placeholder="Notes/Description (optional)"
            rows={2}
            className="w-full px-3 py-1.5 bg-slate-900/50 border border-slate-700 rounded text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm resize-y"
          />
          <button
            onClick={addPublication}
            className="w-full py-1.5 px-3 bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded hover:bg-violet-600/30 text-sm font-medium flex items-center justify-center gap-1"
          >
            <Plus className="w-3 h-3" />
            Add Publication
          </button>
        </div>
      </div>
    </div>
  )
}

