/**
 * Human-readable labels for issue types and severity.
 */

import type { IssueDisplaySeverity, IssueSeverity } from './types'

const TYPE_LABELS: Record<string, string> = {
  grammar: 'Grammar',
  spelling: 'Spelling',
  style: 'Style',
  clarity: 'Clarity',
  word_form: 'Word Choice',
  tense: 'Tense',
  tense_consistency: 'Tense',
  repetition: 'Repetition',
  preposition: 'Grammar',
  academic_tone: 'Academic Tone',
  academic_objectivity: 'Academic Tone',
  academic_hedging: 'Academic Tone',
  academic_citation: 'Academic Tone',
  academic_logic: 'Clarity',
  structure: 'Sentence Structure',
  academic_style: 'Formality',
  methodology: 'Clarity',
  evidence: 'Clarity',
  research_quality: 'Academic Tone',
  agreement: 'Grammar',
  article: 'Grammar',
  uncountable: 'Grammar',
  research_grammar: 'Grammar',
  punctuation: 'Punctuation',
}

export function getIssueTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function getSeverityLabel(severity: IssueSeverity): IssueDisplaySeverity {
  if (severity === 'high') return 'Critical'
  if (severity === 'moderate') return 'Important'
  return 'Minor'
}

export function severityBadgeClass(severity: IssueSeverity): string {
  if (severity === 'high') return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
  if (severity === 'moderate') return 'bg-amber-500/15 text-amber-300 border-amber-500/30'
  return 'bg-sky-500/15 text-sky-300 border-sky-500/30'
}

export function typeBadgeClass(type: string): string {
  if (type === 'spelling' || type === 'grammar' || type === 'agreement') {
    return 'bg-blue-500/15 text-blue-300 border-blue-500/30'
  }
  if (type.startsWith('academic')) return 'bg-violet-500/15 text-violet-300 border-violet-500/30'
  if (type === 'clarity' || type === 'structure') return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
  if (type === 'repetition') return 'bg-rose-500/15 text-rose-300 border-rose-500/30'
  return 'bg-slate-500/15 text-slate-300 border-slate-500/30'
}
