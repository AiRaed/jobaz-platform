import { Plus, Trash2 } from 'lucide-react'
import { CvData } from '@/app/cv-builder-v2/page'

interface EducationTabProps {
  education: CvData['education']
  onUpdate: (education: CvData['education']) => void
}

export default function EducationTab({ education, onUpdate }: EducationTabProps) {
  const addEducation = () => {
    onUpdate([
      ...education,
      {
        degree: '',
        school: '',
      },
    ])
  }

  const updateEducation = (index: number, updates: Partial<CvData['education'][0]>) => {
    const updated = education.map((edu, i) => (i === index ? { ...edu, ...updates } : edu))
    onUpdate(updated)
  }

  const removeEducation = (index: number) => {
    onUpdate(education.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-4">
      {education.map((edu, index) => (
        <div key={index} className="p-4 bg-slate-900/30 rounded-lg border border-slate-700/50">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-sm font-semibold text-slate-300">Education #{index + 1}</h3>
            <button
              onClick={() => removeEducation(index)}
              className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition"
              title="Remove this education"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Degree *</label>
              <input
                type="text"
                value={edu.degree}
                onChange={(e) => updateEducation(index, { degree: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                placeholder="Bachelor of Science in Computer Science"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">School / University *</label>
              <input
                type="text"
                value={edu.school}
                onChange={(e) => updateEducation(index, { school: e.target.value })}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                placeholder="University Name"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Year</label>
                <input
                  type="text"
                  value={edu.year || ''}
                  onChange={(e) => updateEducation(index, { year: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm"
                  placeholder="2020"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Additional Details</label>
              <textarea
                value={edu.details || ''}
                onChange={(e) => updateEducation(index, { details: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent text-sm resize-y"
                placeholder="Honors, GPA, relevant coursework, etc."
              />
            </div>
          </div>
        </div>
      ))}

      <button
        onClick={addEducation}
        className="w-full py-2.5 px-4 bg-violet-600/20 text-violet-300 border border-violet-500/30 rounded-lg hover:bg-violet-600/30 hover:border-violet-500/50 transition flex items-center justify-center gap-2 text-sm font-medium"
      >
        <Plus className="w-4 h-4" />
        Add Education
      </button>
    </div>
  )
}

