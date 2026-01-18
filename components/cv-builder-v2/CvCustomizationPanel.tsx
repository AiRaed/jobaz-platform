'use client'

import { ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'

export type CvCustomizationOptions = {
  fontFamily: 'inter' | 'serif' | 'mono'
  fontSize: 'small' | 'medium' | 'large'
  lineSpacing: 'compact' | 'normal' | 'relaxed'
  headingFontWeight: 'normal' | 'bold'
  headingUnderline: boolean
  sectionSpacing: 'tight' | 'normal' | 'wide'
}

interface CvCustomizationPanelProps {
  options: CvCustomizationOptions
  onChange: (options: CvCustomizationOptions) => void
  isOpen?: boolean
  onToggle?: () => void
}

export default function CvCustomizationPanel({ 
  options, 
  onChange, 
  isOpen = true, 
  onToggle 
}: CvCustomizationPanelProps) {
  const updateOption = <K extends keyof CvCustomizationOptions>(
    key: K,
    value: CvCustomizationOptions[K]
  ) => {
    onChange({ ...options, [key]: value })
  }

  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-950/70 shadow-[0_8px_24px_rgba(15,23,42,0.6)] backdrop-blur overflow-hidden">
      {/* Header with collapse toggle */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-2 py-1 hover:bg-slate-900/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold text-slate-300">Customize Style</h3>
        </div>
        {onToggle && (
          <div className="text-slate-400 hover:text-slate-200 transition-colors">
            {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        )}
      </button>

      {/* Collapsible content */}
      {isOpen && (
        <div className="px-1 py-1">
          {/* Compact grid layout: 3 columns on desktop, 2 on mobile */}
          <div className="grid grid-cols-3 md:grid-cols-3 gap-1">
            {/* Font Family */}
            <div>
              <label className="text-[9px] text-slate-400 font-medium block mb-0.5">Font Family</label>
              <div className="flex gap-1">
                {(['inter', 'serif', 'mono'] as const).map((font) => (
                  <button
                    key={font}
                    onClick={() => updateOption('fontFamily', font)}
                    className={cn(
                      'flex-1 h-6 px-2 py-0.5 text-[9px] font-medium rounded border transition',
                      options.fontFamily === font
                        ? 'border-violet-500 text-violet-200 bg-violet-500/15'
                        : 'border-slate-700/60 text-slate-400 bg-slate-900/40 hover:border-slate-600/80 hover:text-slate-300'
                    )}
                  >
                    {font === 'inter' ? 'Inter' : font === 'serif' ? 'Serif' : 'Mono'}
                  </button>
                ))}
              </div>
            </div>

            {/* Base Font Size */}
            <div>
              <label className="text-[9px] text-slate-400 font-medium block mb-0.5">Font Size</label>
              <div className="flex gap-1">
                {(['small', 'medium', 'large'] as const).map((size) => (
                  <button
                    key={size}
                    onClick={() => updateOption('fontSize', size)}
                    className={cn(
                      'flex-1 h-6 px-2 py-0.5 text-[9px] font-medium rounded border transition capitalize',
                      options.fontSize === size
                        ? 'border-violet-500 text-violet-200 bg-violet-500/15'
                        : 'border-slate-700/60 text-slate-400 bg-slate-900/40 hover:border-slate-600/80 hover:text-slate-300'
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Line Spacing */}
            <div>
              <label className="text-[9px] text-slate-400 font-medium block mb-0.5">Line Spacing</label>
              <div className="flex gap-1">
                {(['compact', 'normal', 'relaxed'] as const).map((spacing) => (
                  <button
                    key={spacing}
                    onClick={() => updateOption('lineSpacing', spacing)}
                    className={cn(
                      'flex-1 h-6 px-2 py-0.5 text-[9px] font-medium rounded border transition capitalize',
                      options.lineSpacing === spacing
                        ? 'border-violet-500 text-violet-200 bg-violet-500/15'
                        : 'border-slate-700/60 text-slate-400 bg-slate-900/40 hover:border-slate-600/80 hover:text-slate-300'
                    )}
                  >
                    {spacing}
                  </button>
                ))}
              </div>
            </div>

            {/* Heading Font Weight */}
            <div>
              <label className="text-[9px] text-slate-400 font-medium block mb-0.5">Heading Weight</label>
              <div className="flex gap-1">
                {(['normal', 'bold'] as const).map((weight) => (
                  <button
                    key={weight}
                    onClick={() => updateOption('headingFontWeight', weight)}
                    className={cn(
                      'flex-1 h-6 px-2 py-0.5 text-[9px] font-medium rounded border transition capitalize',
                      options.headingFontWeight === weight
                        ? 'border-violet-500 text-violet-200 bg-violet-500/15'
                        : 'border-slate-700/60 text-slate-400 bg-slate-900/40 hover:border-slate-600/80 hover:text-slate-300'
                    )}
                  >
                    {weight}
                  </button>
                ))}
              </div>
            </div>

            {/* Heading Underline Toggle */}
            <div>
              <label className="text-[9px] text-slate-400 font-medium block mb-0.5">Heading Underline</label>
              <div className="flex gap-1">
                <button
                  onClick={() => updateOption('headingUnderline', true)}
                  className={cn(
                    'flex-1 h-6 px-2 py-0.5 text-[9px] font-medium rounded border transition',
                    options.headingUnderline
                      ? 'border-violet-500 text-violet-200 bg-violet-500/15'
                      : 'border-slate-700/60 text-slate-400 bg-slate-900/40 hover:border-slate-600/80 hover:text-slate-300'
                  )}
                >
                  On
                </button>
                <button
                  onClick={() => updateOption('headingUnderline', false)}
                  className={cn(
                    'flex-1 h-6 px-2 py-0.5 text-[9px] font-medium rounded border transition',
                    !options.headingUnderline
                      ? 'border-violet-500 text-violet-200 bg-violet-500/15'
                      : 'border-slate-700/60 text-slate-400 bg-slate-900/40 hover:border-slate-600/80 hover:text-slate-300'
                  )}
                >
                  Off
                </button>
              </div>
            </div>

            {/* Section Spacing */}
            <div>
              <label className="text-[9px] text-slate-400 font-medium block mb-0.5">Section Spacing</label>
              <div className="flex gap-1">
                {(['tight', 'normal', 'wide'] as const).map((spacing) => (
                  <button
                    key={spacing}
                    onClick={() => updateOption('sectionSpacing', spacing)}
                    className={cn(
                      'flex-1 h-6 px-2 py-0.5 text-[9px] font-medium rounded border transition capitalize',
                      options.sectionSpacing === spacing
                        ? 'border-violet-500 text-violet-200 bg-violet-500/15'
                        : 'border-slate-700/60 text-slate-400 bg-slate-900/40 hover:border-slate-600/80 hover:text-slate-300'
                    )}
                  >
                    {spacing}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

