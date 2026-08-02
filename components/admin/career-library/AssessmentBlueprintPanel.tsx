'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { ConfirmModal } from '@/components/ConfirmModal'
import { cn } from '@/lib/utils'
import type { CareerLibraryField, CareerLibrarySpecialism } from '@/lib/admin/career-library/types'
import type {
  BlueprintEvaluationResult,
  BlueprintQuestion,
  BlueprintReportRule,
} from '@/lib/career-library/assessment/evaluateBlueprint'

type ToastFn = (args: {
  title: string
  description?: string
  variant?: 'default' | 'success' | 'error'
}) => void

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string }
    return data.error || 'Something went wrong. Please try again.'
  } catch {
    return 'Something went wrong. Please try again.'
  }
}

const ROUTE_KEY = 'work_in_my_education'

const OPTION_SOURCES = [
  { value: 'career_fields', label: 'Approved Career Fields' },
  { value: 'specialisms_by_field', label: 'Specialisms filtered by study_field' },
  { value: 'stages_by_specialism', label: 'Stages from selected specialism model' },
  { value: 'static', label: 'Static options' },
  { value: 'learning_options_by_specialism', label: 'Learning options (later)' },
]

export default function AssessmentBlueprintPanel({
  fields,
  specialisms,
  addToast,
}: {
  fields: CareerLibraryField[]
  specialisms: CareerLibrarySpecialism[]
  addToast: ToastFn
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [questions, setQuestions] = useState<BlueprintQuestion[]>([])
  const [rules, setRules] = useState<BlueprintReportRule[]>([])
  const [editing, setEditing] = useState<BlueprintQuestion | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BlueprintQuestion | null>(null)
  const [form, setForm] = useState({
    label: '',
    helpText: '',
    questionKey: '',
    answerType: 'single_select',
    required: true,
    status: 'draft' as 'draft' | 'approved' | 'disabled',
    sortOrder: 100,
    optionSource: 'static',
    filterAnswerKey: '',
  })
  const [staticOption, setStaticOption] = useState({ label: '', value: '' })
  const [conditionForm, setConditionForm] = useState({
    dependsOnQuestionKey: 'qualification_country',
    operator: 'equals',
    expectedValue: 'outside_uk',
  })

  const [previewAnswers, setPreviewAnswers] = useState({
    study_field: '',
    specialism: '',
    qualification_stage: 'degree',
    qualification_country: 'uk',
    english_level: 'intermediate',
  })
  const [preview, setPreview] = useState<BlueprintEvaluationResult | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/career-library/questions?route_key=${ROUTE_KEY}`,
        { cache: 'no-store' }
      )
      if (!res.ok) {
        addToast({ title: 'Could not load blueprint', description: await readError(res), variant: 'error' })
        return
      }
      const data = await res.json()
      setQuestions(data.questions ?? [])
      setRules(data.rules ?? [])
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const resetForm = () => {
    setEditing(null)
    setForm({
      label: '',
      helpText: '',
      questionKey: '',
      answerType: 'single_select',
      required: true,
      status: 'draft',
      sortOrder: 100,
      optionSource: 'static',
      filterAnswerKey: '',
    })
  }

  const startEdit = (q: BlueprintQuestion) => {
    setEditing(q)
    const source = q.configuration?.option_source
    setForm({
      label: q.label,
      helpText: q.helpText,
      questionKey: q.questionKey,
      answerType: q.answerType,
      required: q.required,
      status: q.status,
      sortOrder: q.sortOrder,
      optionSource: source?.type ?? 'static',
      filterAnswerKey: source?.filter_answer_key ?? '',
    })
  }

  const saveQuestion = async () => {
    if (!form.label.trim() || saving) return
    setSaving(true)
    try {
      const configuration = {
        option_source: {
          type: form.optionSource,
          ...(form.filterAnswerKey
            ? { filter_answer_key: form.filterAnswerKey }
            : form.optionSource === 'specialisms_by_field'
              ? { filter_answer_key: 'study_field' }
              : form.optionSource === 'stages_by_specialism' ||
                  form.optionSource === 'learning_options_by_specialism'
                ? { filter_answer_key: 'specialism' }
                : {}),
        },
      }
      const payload = {
        routeKey: ROUTE_KEY,
        label: form.label.trim(),
        helpText: form.helpText.trim(),
        questionKey: form.questionKey.trim() || undefined,
        answerType: form.answerType,
        required: form.required,
        status: form.status,
        sortOrder: form.sortOrder,
        active: form.status !== 'disabled',
        configuration,
      }
      const res = await fetch(
        editing
          ? `/api/admin/career-library/questions/${editing.id}`
          : '/api/admin/career-library/questions',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) {
        addToast({
          title: editing ? 'Update failed' : 'Could not add question',
          description: await readError(res),
          variant: 'error',
        })
        return
      }
      addToast({ title: editing ? 'Question updated' : 'Question added', variant: 'success' })
      resetForm()
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  const patchQuick = async (q: BlueprintQuestion, body: Record<string, unknown>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/career-library/questions/${q.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        addToast({ title: 'Update failed', description: await readError(res), variant: 'error' })
        return
      }
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  const addStaticOption = async (questionId: string) => {
    if (!staticOption.label.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/career-library/question-options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          label: staticOption.label.trim(),
          value: staticOption.value.trim() || undefined,
        }),
      })
      if (!res.ok) {
        addToast({ title: 'Could not add option', description: await readError(res), variant: 'error' })
        return
      }
      setStaticOption({ label: '', value: '' })
      addToast({ title: 'Option added', variant: 'success' })
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  const addCondition = async (questionId: string) => {
    if (!conditionForm.dependsOnQuestionKey.trim() || saving) return
    setSaving(true)
    try {
      let expected: unknown = conditionForm.expectedValue
      if (conditionForm.operator === 'in' || conditionForm.operator === 'not_in') {
        expected = conditionForm.expectedValue.split(',').map((s) => s.trim()).filter(Boolean)
      }
      const res = await fetch('/api/admin/career-library/question-conditions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId,
          dependsOnQuestionKey: conditionForm.dependsOnQuestionKey.trim(),
          operator: conditionForm.operator,
          expectedValue: expected,
        }),
      })
      if (!res.ok) {
        addToast({
          title: 'Could not add condition',
          description: await readError(res),
          variant: 'error',
        })
        return
      }
      addToast({ title: 'Condition added', variant: 'success' })
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/career-library/questions/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        addToast({ title: 'Cannot delete question', description: await readError(res), variant: 'error' })
        return
      }
      addToast({ title: 'Question deleted', variant: 'success' })
      setDeleteTarget(null)
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  const runPreview = async () => {
    setPreviewLoading(true)
    try {
      const res = await fetch('/api/admin/career-library/blueprint/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route_key: ROUTE_KEY,
          answers: {
            study_field: previewAnswers.study_field || undefined,
            specialism: previewAnswers.specialism || undefined,
            qualification_stage: previewAnswers.qualification_stage || undefined,
            qualification_country: previewAnswers.qualification_country,
            english_level:
              previewAnswers.qualification_country === 'outside_uk'
                ? previewAnswers.english_level
                : undefined,
          },
          includeDrafts: true,
        }),
      })
      if (!res.ok) {
        addToast({ title: 'Preview failed', description: await readError(res), variant: 'error' })
        return
      }
      const data = await res.json()
      setPreview(data.preview)
    } finally {
      setPreviewLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading assessment blueprint…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
        <p className="text-sm text-slate-300">
          Route: <span className="font-mono text-cyan-300">{ROUTE_KEY}</span>
        </p>
        <p className="text-xs text-slate-500 mt-1">
          Blueprint only — not connected to the public Career Assistant. Dynamic options resolve from
          Career Fields / Specialisms / Stages at runtime (not duplicated here).
        </p>
      </div>

      <section className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">
            {editing ? 'Edit question' : 'Add question'}
          </h2>
          {editing && (
            <button type="button" className="text-xs text-slate-400" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={form.label}
            onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            placeholder="Question label"
            className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
          />
          <input
            value={form.questionKey}
            onChange={(e) => setForm((f) => ({ ...f, questionKey: e.target.value }))}
            placeholder="question_key (optional)"
            className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 font-mono"
          />
          <input
            value={form.helpText}
            onChange={(e) => setForm((f) => ({ ...f, helpText: e.target.value }))}
            placeholder="Help text"
            className="md:col-span-2 rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
          />
          <select
            value={form.answerType}
            onChange={(e) => setForm((f) => ({ ...f, answerType: e.target.value }))}
            className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
          >
            <option value="single_select">single_select</option>
            <option value="multi_select">multi_select</option>
            <option value="boolean">boolean</option>
            <option value="text">text</option>
            <option value="number">number</option>
          </select>
          <select
            value={form.status}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                status: e.target.value as 'draft' | 'approved' | 'disabled',
              }))
            }
            className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
          >
            <option value="draft">Draft</option>
            <option value="approved">Approved</option>
            <option value="disabled">Disabled</option>
          </select>
          <select
            value={form.optionSource}
            onChange={(e) => setForm((f) => ({ ...f, optionSource: e.target.value }))}
            className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
          >
            {OPTION_SOURCES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <input
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
            className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={form.required}
            onChange={(e) => setForm((f) => ({ ...f, required: e.target.checked }))}
          />
          Required
        </label>
        <button
          type="button"
          disabled={saving || !form.label.trim()}
          onClick={() => void saveQuestion()}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium bg-cyan-600 text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {editing ? 'Save question' : 'Add question'}
        </button>
      </section>

      <section className="rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/60 flex justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Questions in order</h2>
          <span className="text-xs text-slate-500">{questions.length} total</span>
        </div>
        {questions.length === 0 ? (
          <p className="px-4 py-10 text-sm text-slate-500 text-center">
            No questions yet. Apply the assessment blueprint migration, then refresh.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800/70">
            {questions.map((q) => (
              <li key={q.id} className="px-4 py-4 space-y-3 bg-slate-950/30">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-slate-100">{q.label}</p>
                      <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-slate-700 text-slate-400">
                        {q.status}
                      </span>
                      {q.isSystem && (
                        <span className="text-[10px] uppercase tracking-wider text-cyan-400/80">
                          system
                        </span>
                      )}
                      {!q.active && <span className="text-[10px] text-slate-500">inactive</span>}
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      <span className="font-mono text-slate-400">{q.questionKey}</span>
                      {' · '}
                      {q.answerType}
                      {' · '}
                      source: {q.configuration?.option_source?.type ?? 'static'}
                      {q.required ? ' · required' : ' · optional'}
                    </p>
                    {q.helpText ? <p className="text-xs text-slate-500 mt-1">{q.helpText}</p> : null}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void patchQuick(q, { sortOrder: q.sortOrder - 10 })}
                      className="p-1 rounded border border-slate-700 text-slate-400"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono text-slate-500 w-8 text-center">
                      {q.sortOrder}
                    </span>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void patchQuick(q, { sortOrder: q.sortOrder + 10 })}
                      className="p-1 rounded border border-slate-700 text-slate-400"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void patchQuick(q, { active: !q.active })}
                      className={cn(
                        'text-xs px-2.5 py-1.5 rounded-lg border',
                        q.active
                          ? 'border-emerald-500/30 text-emerald-300'
                          : 'border-slate-700 text-slate-500'
                      )}
                    >
                      {q.active ? 'Active' : 'Disabled'}
                    </button>
                    <button
                      type="button"
                      onClick={() => startEdit(q)}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    {!q.isSystem && (
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(q)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {q.conditions.length > 0 && (
                  <div className="rounded-xl border border-amber-500/20 bg-amber-950/10 px-3 py-2">
                    <p className="text-[11px] uppercase tracking-wider text-amber-200/80 mb-1">
                      Display conditions
                    </p>
                    {q.conditions.map((c) => (
                      <p key={c.id} className="text-xs text-amber-100/90 font-mono">
                        Show only when: {c.dependsOnQuestionKey} {c.operator}{' '}
                        {JSON.stringify(c.expectedValue)}
                        {!c.active ? ' (inactive)' : ''}
                      </p>
                    ))}
                  </div>
                )}

                {q.configuration?.option_source?.type === 'static' && (
                  <div className="rounded-xl border border-slate-800 px-3 py-2 space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">
                      Static options
                    </p>
                    <ul className="text-xs text-slate-300 space-y-1">
                      {q.options.map((o) => (
                        <li key={o.id}>
                          {o.label}{' '}
                          <span className="font-mono text-slate-500">({o.value})</span>
                        </li>
                      ))}
                      {q.options.length === 0 && (
                        <li className="text-slate-500">No static options yet.</li>
                      )}
                    </ul>
                    {editing?.id === q.id && (
                      <div className="flex flex-wrap gap-2">
                        <input
                          value={staticOption.label}
                          onChange={(e) =>
                            setStaticOption((s) => ({ ...s, label: e.target.value }))
                          }
                          placeholder="Option label"
                          className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100"
                        />
                        <input
                          value={staticOption.value}
                          onChange={(e) =>
                            setStaticOption((s) => ({ ...s, value: e.target.value }))
                          }
                          placeholder="value"
                          className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 font-mono"
                        />
                        <button
                          type="button"
                          disabled={saving}
                          onClick={() => void addStaticOption(q.id)}
                          className="text-xs px-2 py-1 rounded-lg bg-cyan-600 text-white"
                        >
                          Add option
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {editing?.id === q.id && (
                  <div className="rounded-xl border border-slate-800 px-3 py-2 space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-slate-500">
                      Add display condition
                    </p>
                    <div className="grid gap-2 md:grid-cols-4">
                      <input
                        value={conditionForm.dependsOnQuestionKey}
                        onChange={(e) =>
                          setConditionForm((c) => ({
                            ...c,
                            dependsOnQuestionKey: e.target.value,
                          }))
                        }
                        placeholder="depends_on_question_key"
                        className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 font-mono"
                      />
                      <select
                        value={conditionForm.operator}
                        onChange={(e) =>
                          setConditionForm((c) => ({ ...c, operator: e.target.value }))
                        }
                        className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100"
                      >
                        <option value="equals">equals</option>
                        <option value="not_equals">not_equals</option>
                        <option value="in">in</option>
                        <option value="not_in">not_in</option>
                        <option value="contains">contains</option>
                      </select>
                      <input
                        value={conditionForm.expectedValue}
                        onChange={(e) =>
                          setConditionForm((c) => ({ ...c, expectedValue: e.target.value }))
                        }
                        placeholder="expected value"
                        className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100"
                      />
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => void addCondition(q.id)}
                        className="text-xs px-2 py-1.5 rounded-lg bg-cyan-600 text-white"
                      >
                        Add condition
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-2xl border border-cyan-500/20 bg-cyan-950/10 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Blueprint preview</h2>
          <p className="text-xs text-slate-500 mt-1">
            Simulate answers. No AI and no career report — structured visibility + outcomes only.
            Loaded rules: {rules.length}.
          </p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs text-slate-400 space-y-1">
            <span>study_field (optional id/slug)</span>
            <select
              value={previewAnswers.study_field}
              onChange={(e) =>
                setPreviewAnswers((a) => ({ ...a, study_field: e.target.value, specialism: '' }))
              }
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
            >
              <option value="">—</option>
              {fields.map((f) => (
                <option key={f.id} value={f.slug || f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            <span>specialism</span>
            <select
              value={previewAnswers.specialism}
              onChange={(e) =>
                setPreviewAnswers((a) => ({ ...a, specialism: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
            >
              <option value="">—</option>
              {specialisms.map((s) => (
                <option key={s.id} value={s.slug || s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            <span>qualification_stage</span>
            <input
              value={previewAnswers.qualification_stage}
              onChange={(e) =>
                setPreviewAnswers((a) => ({ ...a, qualification_stage: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 font-mono"
            />
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            <span>qualification_country</span>
            <select
              value={previewAnswers.qualification_country}
              onChange={(e) =>
                setPreviewAnswers((a) => ({ ...a, qualification_country: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
            >
              <option value="uk">uk</option>
              <option value="outside_uk">outside_uk</option>
            </select>
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            <span>english_level (if outside_uk)</span>
            <select
              value={previewAnswers.english_level}
              disabled={previewAnswers.qualification_country !== 'outside_uk'}
              onChange={(e) =>
                setPreviewAnswers((a) => ({ ...a, english_level: e.target.value }))
              }
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 disabled:opacity-40"
            >
              <option value="beginner">beginner</option>
              <option value="elementary">elementary</option>
              <option value="intermediate">intermediate</option>
              <option value="upper_intermediate">upper_intermediate</option>
              <option value="advanced">advanced</option>
            </select>
          </label>
        </div>
        <button
          type="button"
          disabled={previewLoading}
          onClick={() => void runPreview()}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium bg-cyan-600 text-white disabled:opacity-50"
        >
          {previewLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          Run preview
        </button>

        {preview && (
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-slate-800 p-3">
              <p className="text-xs font-semibold text-emerald-300 mb-2">Visible questions</p>
              <ul className="space-y-1 text-xs text-slate-300">
                {preview.visible_questions.map((q) => (
                  <li key={q.question_key}>
                    <span className="font-mono text-slate-100">{q.question_key}</span>
                    <span className="text-slate-500"> — {q.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl border border-slate-800 p-3">
              <p className="text-xs font-semibold text-amber-300 mb-2">Skipped questions</p>
              <ul className="space-y-1 text-xs text-slate-300">
                {preview.skipped_questions.map((q) => (
                  <li key={q.question_key}>
                    <span className="font-mono text-slate-100">{q.question_key}</span>
                    <span className="text-slate-500"> — {q.reason}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2 rounded-xl border border-slate-800 p-3">
              <p className="text-xs font-semibold text-cyan-300 mb-2">Structured outcomes</p>
              {preview.outcomes.length === 0 ? (
                <p className="text-xs text-slate-500">No outcomes matched.</p>
              ) : (
                <ul className="space-y-1 text-xs text-slate-300">
                  {preview.outcomes.map((o, idx) => (
                    <li key={`${o.type}-${o.key}-${idx}`} className="font-mono">
                      {o.type} → {o.key}
                      {o.ruleKey ? ` (${o.ruleKey})` : ''}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </section>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete question?"
        message={`Delete "${deleteTarget?.label ?? ''}"? System questions cannot be deleted.`}
        variant="danger"
        confirmText="Delete question"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
