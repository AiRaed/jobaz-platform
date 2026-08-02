'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { ConfirmModal } from '@/components/ConfirmModal'
import { cn } from '@/lib/utils'
import type { CareerLibrarySpecialism } from '@/lib/admin/career-library/types'
import type {
  BlueprintReportRule,
  ConditionGroup,
  ConditionOperator,
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

const OUTCOME_TYPES = [
  'add_recognition_section',
  'add_english_section',
  'no_english_section',
  'enable_english_question',
  'skip_english_question',
  'recommend_learning_category',
  'exclude_learning_option',
  'load_stage_roles',
  'add_report_note',
  'reorder_roles',
]

export default function ReportRulesPanel({
  specialisms,
  addToast,
}: {
  specialisms: CareerLibrarySpecialism[]
  addToast: ToastFn
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [rules, setRules] = useState<BlueprintReportRule[]>([])
  const [editing, setEditing] = useState<BlueprintReportRule | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<BlueprintReportRule | null>(null)
  const [form, setForm] = useState({
    name: '',
    ruleKey: '',
    outcomeType: 'add_report_note',
    outcomeKey: '',
    priority: 100,
    status: 'draft' as 'draft' | 'approved' | 'disabled',
    specialismId: '',
    conditionQuestionKey: 'qualification_country',
    conditionOperator: 'equals',
    conditionExpected: 'outside_uk',
    stopProcessing: false,
  })

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(
        `/api/admin/career-library/report-rules?route_key=${ROUTE_KEY}`,
        { cache: 'no-store' }
      )
      if (!res.ok) {
        addToast({ title: 'Could not load rules', description: await readError(res), variant: 'error' })
        return
      }
      const data = await res.json()
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
      name: '',
      ruleKey: '',
      outcomeType: 'add_report_note',
      outcomeKey: '',
      priority: 100,
      status: 'draft',
      specialismId: '',
      conditionQuestionKey: 'qualification_country',
      conditionOperator: 'equals',
      conditionExpected: 'outside_uk',
      stopProcessing: false,
    })
  }

  const startEdit = (rule: BlueprintReportRule) => {
    setEditing(rule)
    const first = rule.conditionGroup?.conditions?.[0]
    setForm({
      name: rule.name,
      ruleKey: rule.ruleKey,
      outcomeType: String(rule.outcomeType),
      outcomeKey: rule.outcomeKey,
      priority: rule.priority,
      status: rule.status,
      specialismId: rule.specialismId ?? '',
      conditionQuestionKey: first?.question_key ?? 'qualification_country',
      conditionOperator: first?.operator ?? 'equals',
      conditionExpected:
        typeof first?.expected_value === 'string'
          ? first.expected_value
          : JSON.stringify(first?.expected_value ?? ''),
      stopProcessing: rule.stopProcessing,
    })
  }

  const buildConditionGroup = (): ConditionGroup => {
    let expected: unknown = form.conditionExpected
    if (form.conditionOperator === 'in' || form.conditionOperator === 'not_in') {
      expected = form.conditionExpected.split(',').map((s) => s.trim()).filter(Boolean)
    } else {
      try {
        expected = JSON.parse(form.conditionExpected)
      } catch {
        expected = form.conditionExpected
      }
    }
    return {
      logic: 'and',
      conditions: form.conditionQuestionKey.trim()
        ? [
            {
              question_key: form.conditionQuestionKey.trim(),
              operator: form.conditionOperator as ConditionOperator,
              expected_value: expected,
            },
          ]
        : [],
    }
  }

  const save = async () => {
    if (!form.name.trim() || saving) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        ruleKey: form.ruleKey.trim() || undefined,
        routeKey: ROUTE_KEY,
        outcomeType: form.outcomeType,
        outcomeKey: form.outcomeKey.trim() || undefined,
        priority: form.priority,
        status: form.status,
        active: form.status !== 'disabled',
        specialismId: form.specialismId || null,
        stopProcessing: form.stopProcessing,
        conditionGroup: buildConditionGroup(),
        outcomePayload: {},
      }
      const res = await fetch(
        editing
          ? `/api/admin/career-library/report-rules/${editing.id}`
          : '/api/admin/career-library/report-rules',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) {
        addToast({
          title: editing ? 'Update failed' : 'Could not add rule',
          description: await readError(res),
          variant: 'error',
        })
        return
      }
      addToast({ title: editing ? 'Rule updated' : 'Rule added', variant: 'success' })
      resetForm()
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  const patchQuick = async (rule: BlueprintReportRule, body: Record<string, unknown>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/career-library/report-rules/${rule.id}`, {
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

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/career-library/report-rules/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        addToast({ title: 'Cannot delete rule', description: await readError(res), variant: 'error' })
        return
      }
      addToast({ title: 'Rule deleted', variant: 'success' })
      setDeleteTarget(null)
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading report rules…
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4">
        <p className="text-sm text-slate-300">
          Structured report instructions for{' '}
          <span className="font-mono text-cyan-300">{ROUTE_KEY}</span>. No prose, no courses, no AI.
        </p>
      </div>

      <section className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">
            {editing ? 'Edit rule' : 'Add rule'}
          </h2>
          {editing && (
            <button type="button" className="text-xs text-slate-400" onClick={resetForm}>
              Cancel
            </button>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Rule name"
            className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
          />
          <input
            value={form.ruleKey}
            onChange={(e) => setForm((f) => ({ ...f, ruleKey: e.target.value }))}
            placeholder="rule_key (optional)"
            className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 font-mono"
          />
          <select
            value={form.outcomeType}
            onChange={(e) => setForm((f) => ({ ...f, outcomeType: e.target.value }))}
            className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
          >
            {OUTCOME_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            value={form.outcomeKey}
            onChange={(e) => setForm((f) => ({ ...f, outcomeKey: e.target.value }))}
            placeholder="outcome_key"
            className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 font-mono"
          />
          <input
            type="number"
            value={form.priority}
            onChange={(e) => setForm((f) => ({ ...f, priority: Number(e.target.value) || 0 }))}
            className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
          />
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
            value={form.specialismId}
            onChange={(e) => setForm((f) => ({ ...f, specialismId: e.target.value }))}
            className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
          >
            <option value="">All specialisms (route-wide)</option>
            {specialisms.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="rounded-xl border border-slate-800 p-3 space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">Simple condition</p>
          <div className="grid gap-2 md:grid-cols-3">
            <input
              value={form.conditionQuestionKey}
              onChange={(e) =>
                setForm((f) => ({ ...f, conditionQuestionKey: e.target.value }))
              }
              placeholder="question_key"
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100 font-mono"
            />
            <select
              value={form.conditionOperator}
              onChange={(e) => setForm((f) => ({ ...f, conditionOperator: e.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100"
            >
              <option value="equals">equals</option>
              <option value="not_equals">not_equals</option>
              <option value="in">in</option>
              <option value="not_in">not_in</option>
              <option value="contains">contains</option>
            </select>
            <input
              value={form.conditionExpected}
              onChange={(e) => setForm((f) => ({ ...f, conditionExpected: e.target.value }))}
              placeholder="expected value"
              className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-xs text-slate-100"
            />
          </div>
        </div>
        <label className="inline-flex items-center gap-2 text-xs text-slate-300">
          <input
            type="checkbox"
            checked={form.stopProcessing}
            onChange={(e) => setForm((f) => ({ ...f, stopProcessing: e.target.checked }))}
          />
          Stop processing after this rule matches
        </label>
        <button
          type="button"
          disabled={saving || !form.name.trim()}
          onClick={() => void save()}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium bg-cyan-600 text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {editing ? 'Save rule' : 'Add rule'}
        </button>
      </section>

      <section className="rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/60 flex justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Rules by priority</h2>
          <span className="text-xs text-slate-500">{rules.length} total</span>
        </div>
        {rules.length === 0 ? (
          <p className="px-4 py-10 text-sm text-slate-500 text-center">
            No report rules yet. Apply the assessment blueprint migration, then refresh.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800/70">
            {rules.map((rule) => (
              <li key={rule.id} className="px-4 py-3 flex flex-wrap items-start justify-between gap-3 bg-slate-950/30">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-slate-100">{rule.name}</p>
                    <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border border-slate-700 text-slate-400">
                      {rule.status}
                    </span>
                    {rule.isSystem && (
                      <span className="text-[10px] uppercase tracking-wider text-cyan-400/80">
                        system
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    {rule.ruleKey} · priority {rule.priority} · {rule.outcomeType} →{' '}
                    {rule.outcomeKey}
                  </p>
                  {(rule.conditionGroup?.conditions?.length ?? 0) > 0 && (
                    <p className="text-xs text-slate-400 mt-1">
                      When{' '}
                      {rule.conditionGroup.conditions
                        ?.map(
                          (c) =>
                            `${c.question_key} ${c.operator} ${JSON.stringify(c.expected_value)}`
                        )
                        .join(' AND ')}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void patchQuick(rule, { priority: Math.max(0, rule.priority - 10) })
                    }
                    className="text-xs px-2 py-1 rounded-lg border border-slate-700 text-slate-300"
                  >
                    Priority -
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void patchQuick(rule, { priority: rule.priority + 10 })}
                    className="text-xs px-2 py-1 rounded-lg border border-slate-700 text-slate-300"
                  >
                    Priority +
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void patchQuick(rule, { active: !rule.active })}
                    className={cn(
                      'text-xs px-2.5 py-1.5 rounded-lg border',
                      rule.active
                        ? 'border-emerald-500/30 text-emerald-300'
                        : 'border-slate-700 text-slate-500'
                    )}
                  >
                    {rule.active ? 'Active' : 'Disabled'}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(rule)}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  {!rule.isSystem && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(rule)}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-300"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete report rule?"
        message={`Delete "${deleteTarget?.name ?? ''}"? System rules cannot be deleted.`}
        variant="danger"
        confirmText="Delete rule"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}
