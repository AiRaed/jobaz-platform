import { CvTemplateId } from '@/app/cv-builder-v2/page'
import { cn } from '@/lib/utils'

interface TemplatePickerProps {
  selectedTemplate: CvTemplateId
  onSelect: (template: CvTemplateId) => void
}

const templates: Array<{
  id: CvTemplateId
  name: string
}> = [
  {
    id: 'atsClassic',
    name: 'ATS Classic',
  },
  {
    id: 'twoColumnPro',
    name: 'Two Column Pro',
  },
]

export default function TemplatePicker({ selectedTemplate, onSelect }: TemplatePickerProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm backdrop-blur p-4 md:p-5 dark:border-slate-700/60 dark:bg-slate-950/70 dark:shadow-[0_18px_40px_rgba(15,23,42,0.9)]">
      <h3 className="text-sm font-semibold text-slate-800 mb-3 dark:text-slate-300">Templates</h3>
      <div className="flex gap-2">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className={cn(
              'px-3 py-1.5 text-xs font-medium rounded border transition',
              selectedTemplate === template.id
                ? 'border-blue-400 text-blue-800 bg-blue-50 shadow-sm dark:border-violet-500 dark:text-violet-300 dark:bg-violet-500/10 dark:shadow-[0_0_8px_rgba(139,92,246,0.5)]'
                : 'border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300 bg-white dark:border-slate-700/60 dark:text-slate-400 dark:hover:text-slate-300 dark:hover:border-slate-600/80 dark:bg-transparent'
            )}
          >
            {template.name}
          </button>
        ))}
      </div>
    </div>
  )
}

