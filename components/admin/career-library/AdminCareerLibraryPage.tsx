'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { ConfirmModal } from '@/components/ConfirmModal'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import {
  slugifyCareerLibraryName,
  type CareerLibraryField,
  type CareerLibraryFieldStatus,
  type CareerLibraryOverview,
  type CareerLibraryPublishStatus,
  type CareerLibrarySpecialism,
  type CareerLibraryStage,
  type CareerLibraryStageModel,
} from '@/lib/admin/career-library/types'
import AssessmentBlueprintPanel from '@/components/admin/career-library/AssessmentBlueprintPanel'
import CareerRolesPanel from '@/components/admin/career-library/CareerRolesPanel'
import ReportRulesPanel from '@/components/admin/career-library/ReportRulesPanel'

type TabId =
  | 'fields'
  | 'specialisms'
  | 'stage_models'
  | 'assessment_blueprint'
  | 'roles'
  | 'learning'
  | 'recognition'
  | 'report_rules'
  | 'preview'

const TABS: { id: TabId; label: string; ready: boolean }[] = [
  { id: 'fields', label: 'Career Fields', ready: true },
  { id: 'specialisms', label: 'Specialisms', ready: true },
  { id: 'stage_models', label: 'Stage Models', ready: true },
  { id: 'assessment_blueprint', label: 'Assessment Blueprint', ready: true },
  { id: 'report_rules', label: 'Report Rules', ready: true },
  { id: 'roles', label: 'Career Roles', ready: true },
  { id: 'learning', label: 'Learning Options', ready: false },
  { id: 'recognition', label: 'Qualification Recognition', ready: false },
  { id: 'preview', label: 'Preview', ready: false },
]

type ToastFn = ReturnType<typeof useToast>['addToast']

async function readError(res: Response): Promise<string> {
  try {
    const data = (await res.json()) as { error?: string }
    return data.error || 'Something went wrong. Please try again.'
  } catch {
    return 'Something went wrong. Please try again.'
  }
}

function StatusBadge({
  status,
}: {
  status: CareerLibraryFieldStatus | CareerLibraryPublishStatus
}) {
  const styles =
    status === 'approved'
      ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-200'
      : status === 'disabled'
        ? 'border-slate-600/50 bg-slate-900/60 text-slate-400'
        : 'border-amber-500/30 bg-amber-950/30 text-amber-200'
  return (
    <span className={cn('text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border', styles)}>
      {status}
    </span>
  )
}

function SortControl({
  value,
  disabled,
  onChange,
}: {
  value: number
  disabled?: boolean
  onChange: (next: number) => void
}) {
  return (
    <div className="inline-flex items-center gap-1" title="Sort order (lower appears first)">
      <button
        type="button"
        disabled={disabled}
        aria-label="Move earlier in list"
        onClick={() => onChange(value - 10)}
        className="p-1 rounded border border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-40"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
      <span className="text-[11px] font-mono text-slate-500 w-8 text-center">{value}</span>
      <button
        type="button"
        disabled={disabled}
        aria-label="Move later in list"
        onClick={() => onChange(value + 10)}
        className="p-1 rounded border border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-40"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </div>
  )
}

export default function AdminCareerLibraryPage() {
  const { addToast } = useToast()
  const [tab, setTab] = useState<TabId>('fields')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [fields, setFields] = useState<CareerLibraryField[]>([])
  const [specialisms, setSpecialisms] = useState<CareerLibrarySpecialism[]>([])
  const [stageModels, setStageModels] = useState<CareerLibraryStageModel[]>([])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/career-library', { cache: 'no-store' })
      if (!res.ok) {
        addToast({ title: 'Could not load Career Library', description: await readError(res), variant: 'error' })
        return
      }
      const data = (await res.json()) as CareerLibraryOverview
      setFields(data.fields ?? [])
      setSpecialisms(data.specialisms ?? [])
      setStageModels(data.stageModels ?? [])
    } catch (err) {
      addToast({
        title: 'Could not load Career Library',
        description: err instanceof Error ? err.message : 'Network error',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const activeStageModels = useMemo(
    () => stageModels.filter((m) => m.active),
    [stageModels]
  )

  return (
    <AppShell>
      <header className="mb-6 pb-5 border-b border-slate-800/60">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <div className="flex items-start gap-3">
          <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-cyan-500/30 bg-cyan-950/30 shrink-0">
            <BookOpen className="w-5 h-5 text-cyan-300" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-widest text-cyan-300/90 mb-1">
              Foundation · Knowledge brain
            </p>
            <h1 className="text-2xl font-bold text-slate-50">Career Knowledge Library</h1>
            <p className="text-sm text-slate-400 mt-1.5 max-w-2xl">
              Empty data-management foundation for the next Career Assistant. No public careers are
              connected yet — populate fields, specialisms, and stage models from here.
            </p>
            <p className="mt-2">
              <Link
                href="/admin/career-library/test-work-in-education"
                className="text-sm text-cyan-400/90 hover:text-cyan-300"
              >
                Work in My Education — match test harness →
              </Link>
            </p>
          </div>
        </div>
      </header>

      <nav className="flex flex-wrap gap-2 mb-6" aria-label="Career Library sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-xs font-medium border transition',
              tab === item.id
                ? 'border-cyan-500/40 bg-cyan-950/40 text-cyan-100'
                : 'border-slate-700/60 text-slate-400 hover:text-slate-200 hover:border-slate-600',
              !item.ready && tab !== item.id && 'opacity-70'
            )}
          >
            {item.label}
            {!item.ready && (
              <span className="ml-1.5 text-[9px] uppercase tracking-wider text-slate-500">later</span>
            )}
          </button>
        ))}
      </nav>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading library…
        </div>
      ) : (
        <>
          {tab === 'fields' && (
            <FieldsPanel
              fields={fields}
              saving={saving}
              setSaving={setSaving}
              onChanged={refresh}
              addToast={addToast}
            />
          )}
          {tab === 'specialisms' && (
            <SpecialismsPanel
              fields={fields}
              specialisms={specialisms}
              stageModels={activeStageModels}
              saving={saving}
              setSaving={setSaving}
              onChanged={refresh}
              addToast={addToast}
            />
          )}
          {tab === 'stage_models' && (
            <StageModelsPanel
              stageModels={stageModels}
              saving={saving}
              setSaving={setSaving}
              onChanged={refresh}
              addToast={addToast}
            />
          )}
          {tab === 'assessment_blueprint' && (
            <AssessmentBlueprintPanel
              fields={fields}
              specialisms={specialisms}
              addToast={addToast}
            />
          )}
          {tab === 'report_rules' && (
            <ReportRulesPanel specialisms={specialisms} addToast={addToast} />
          )}
          {tab === 'roles' && (
            <CareerRolesPanel
              fields={fields}
              specialisms={specialisms}
              stageModels={stageModels}
              addToast={addToast}
            />
          )}
          {tab === 'learning' && (
            <PlaceholderPanel
              title="Learning Options"
              body="Courses, licences, and pathways linked to specialisms/roles. Not wired yet."
            />
          )}
          {tab === 'recognition' && (
            <PlaceholderPanel
              title="Qualification Recognition"
              body="Overseas / prior qualification → UK equivalent mappings. Foundation table only."
            />
          )}
          {tab === 'preview' && (
            <PlaceholderPanel
              title="Preview"
              body="Full Career Assistant preview comes later. Use Assessment Blueprint → Blueprint preview for structured question/outcome simulation."
            />
          )}
        </>
      )}
    </AppShell>
  )
}

function PlaceholderPanel({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-slate-700/70 bg-slate-950/40 p-8">
      <h2 className="text-lg font-semibold text-slate-200 mb-2">{title}</h2>
      <p className="text-sm text-slate-400 max-w-2xl leading-relaxed">{body}</p>
      <p className="mt-4 text-xs text-slate-500">Coming later — no content seeded.</p>
    </section>
  )
}

/* ───────────────────────── Fields ───────────────────────── */

function FieldsPanel({
  fields,
  saving,
  setSaving,
  onChanged,
  addToast,
}: {
  fields: CareerLibraryField[]
  saving: boolean
  setSaving: (v: boolean) => void
  onChanged: () => Promise<void>
  addToast: ToastFn
}) {
  const emptyForm = {
    name: '',
    slug: '',
    description: '',
    status: 'draft' as CareerLibraryFieldStatus,
    sortOrder: 0,
    slugTouched: false,
  }
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<CareerLibraryField | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CareerLibraryField | null>(null)

  useEffect(() => {
    if (!editing) return
    setForm({
      name: editing.name,
      slug: editing.slug,
      description: editing.description,
      status: editing.status,
      sortOrder: editing.sortOrder,
      slugTouched: true,
    })
  }, [editing])

  const save = async () => {
    if (!form.name.trim() || saving) return
    setSaving(true)
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim(),
        status: form.status,
        sortOrder: form.sortOrder,
        active: form.status !== 'disabled',
      }
      const res = await fetch(
        editing ? `/api/admin/career-library/fields/${editing.id}` : '/api/admin/career-library/fields',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) {
        addToast({ title: editing ? 'Update failed' : 'Could not add field', description: await readError(res), variant: 'error' })
        return
      }
      addToast({ title: editing ? 'Field updated' : 'Career field added', variant: 'success' })
      setEditing(null)
      setForm(emptyForm)
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  const patchQuick = async (field: CareerLibraryField, body: Record<string, unknown>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/career-library/fields/${field.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        addToast({ title: 'Update failed', description: await readError(res), variant: 'error' })
        return
      }
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/career-library/fields/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        addToast({ title: 'Cannot delete field', description: await readError(res), variant: 'error' })
        return
      }
      addToast({ title: 'Field deleted', variant: 'success' })
      setDeleteTarget(null)
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-200">
            {editing ? 'Edit Career Field' : 'Add Career Field'}
          </h2>
          {editing && (
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-slate-200"
              onClick={() => {
                setEditing(null)
                setForm(emptyForm)
              }}
            >
              Cancel edit
            </button>
          )}
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="text-xs text-slate-400 space-y-1">
            <span>Name</span>
            <input
              value={form.name}
              onChange={(e) => {
                const name = e.target.value
                setForm((f) => ({
                  ...f,
                  name,
                  slug: f.slugTouched ? f.slug : slugifyCareerLibraryName(name),
                }))
              }}
              placeholder="e.g. Health & Care"
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            <span>Slug</span>
            <input
              value={form.slug}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  slug: slugifyCareerLibraryName(e.target.value),
                  slugTouched: true,
                }))
              }
              placeholder="health-care"
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 font-mono"
            />
          </label>
          <label className="text-xs text-slate-400 space-y-1 md:col-span-2">
            <span>Description</span>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              placeholder="Short description (optional)"
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
            />
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            <span>Status</span>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((f) => ({ ...f, status: e.target.value as CareerLibraryFieldStatus }))
              }
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
            >
              <option value="draft">Draft</option>
              <option value="approved">Approved</option>
              <option value="disabled">Disabled</option>
            </select>
          </label>
          <label className="text-xs text-slate-400 space-y-1">
            <span>Sort order</span>
            <input
              type="number"
              value={form.sortOrder}
              onChange={(e) =>
                setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))
              }
              className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={saving || !form.name.trim()}
          onClick={() => void save()}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {editing ? 'Save field' : 'Add field'}
        </button>
      </section>

      <section className="rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Fields</h2>
          <span className="text-xs text-slate-500">{fields.length} total</span>
        </div>
        {fields.length === 0 ? (
          <p className="px-4 py-10 text-sm text-slate-500 text-center">
            No career fields yet. Add the first field above — nothing is pre-loaded.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800/70">
            {fields.map((field) => (
              <li key={field.id} className="px-4 py-3 flex flex-wrap items-center gap-3 justify-between bg-slate-950/30">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-100">{field.name}</p>
                    <StatusBadge status={field.status} />
                    {!field.active && <span className="text-[10px] text-slate-500">inactive</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    <span className="font-mono text-slate-400">{field.slug}</span>
                    {field.description ? ` · ${field.description}` : ''}
                    {typeof field.specialismCount === 'number'
                      ? ` · ${field.specialismCount} specialism${field.specialismCount === 1 ? '' : 's'}`
                      : ''}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SortControl
                    value={field.sortOrder}
                    disabled={saving}
                    onChange={(next) => void patchQuick(field, { sortOrder: next })}
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void patchQuick(field, { active: !field.active })}
                    className={cn(
                      'text-xs px-2.5 py-1.5 rounded-lg border',
                      field.active
                        ? 'border-emerald-500/30 text-emerald-300'
                        : 'border-slate-700 text-slate-500'
                    )}
                  >
                    {field.active ? 'Active' : 'Disabled'}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setEditing(field)}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setDeleteTarget(field)}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete career field?"
        message={
          deleteTarget && (deleteTarget.specialismCount ?? 0) > 0
            ? `"${deleteTarget.name}" has ${deleteTarget.specialismCount} specialism(s). Remove or move them first — deletion will be blocked.`
            : `Delete "${deleteTarget?.name ?? ''}"? This cannot be undone.`
        }
        variant="danger"
        confirmText="Delete field"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}

/* ───────────────────────── Specialisms ───────────────────────── */

function SpecialismsPanel({
  fields,
  specialisms,
  stageModels,
  saving,
  setSaving,
  onChanged,
  addToast,
}: {
  fields: CareerLibraryField[]
  specialisms: CareerLibrarySpecialism[]
  stageModels: CareerLibraryStageModel[]
  saving: boolean
  setSaving: (v: boolean) => void
  onChanged: () => Promise<void>
  addToast: ToastFn
}) {
  const emptyForm = {
    fieldId: fields[0]?.id ?? '',
    stageModelId: stageModels[0]?.id ?? '',
    name: '',
    slug: '',
    description: '',
    professionalBody: '',
    regulated: false,
    status: 'draft' as CareerLibraryPublishStatus,
    sortOrder: 0,
    slugTouched: false,
    disabledStageKeys: [] as string[],
  }
  const [form, setForm] = useState(emptyForm)
  const [editing, setEditing] = useState<CareerLibrarySpecialism | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<CareerLibrarySpecialism | null>(null)

  useEffect(() => {
    if (!form.fieldId && fields[0]?.id) setForm((f) => ({ ...f, fieldId: fields[0].id }))
  }, [fields, form.fieldId])

  useEffect(() => {
    if (!form.stageModelId && stageModels[0]?.id) {
      setForm((f) => ({ ...f, stageModelId: stageModels[0].id }))
    }
  }, [form.stageModelId, stageModels])

  useEffect(() => {
    if (!editing) return
    setForm({
      fieldId: editing.fieldId,
      stageModelId: editing.stageModelId ?? '',
      name: editing.name,
      slug: editing.slug,
      description: editing.description,
      professionalBody: editing.professionalBody ?? '',
      regulated: editing.regulatedProfession,
      status: editing.status,
      sortOrder: editing.sortOrder,
      slugTouched: true,
      disabledStageKeys: editing.disabledStageKeys ?? [],
    })
  }, [editing])

  const selectedModel = stageModels.find((m) => m.id === form.stageModelId)

  const save = async () => {
    if (!form.name.trim() || !form.fieldId || !form.stageModelId || saving) return
    setSaving(true)
    try {
      const payload = {
        fieldId: form.fieldId,
        stageModelId: form.stageModelId,
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
        description: form.description.trim(),
        professionalBody: form.professionalBody.trim() || null,
        regulatedProfession: form.regulated,
        status: form.status,
        sortOrder: form.sortOrder,
        active: true,
        disabledStageKeys: form.disabledStageKeys,
      }
      const res = await fetch(
        editing
          ? `/api/admin/career-library/specialisms/${editing.id}`
          : '/api/admin/career-library/specialisms',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) {
        addToast({
          title: editing ? 'Update failed' : 'Could not add specialism',
          description: await readError(res),
          variant: 'error',
        })
        return
      }
      addToast({ title: editing ? 'Specialism updated' : 'Specialism added', variant: 'success' })
      setEditing(null)
      setForm({
        ...emptyForm,
        fieldId: form.fieldId,
        stageModelId: form.stageModelId,
      })
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  const patchQuick = async (item: CareerLibrarySpecialism, body: Record<string, unknown>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/career-library/specialisms/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        addToast({ title: 'Update failed', description: await readError(res), variant: 'error' })
        return
      }
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/career-library/specialisms/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        addToast({ title: 'Cannot delete specialism', description: await readError(res), variant: 'error' })
        return
      }
      addToast({ title: 'Specialism deleted', variant: 'success' })
      setDeleteTarget(null)
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-5 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-sm font-semibold text-slate-200">
            {editing ? 'Edit Specialism' : 'Add Specialism'}
          </h2>
          {editing && (
            <button
              type="button"
              className="text-xs text-slate-400 hover:text-slate-200"
              onClick={() => {
                setEditing(null)
                setForm(emptyForm)
              }}
            >
              Cancel edit
            </button>
          )}
        </div>
        {fields.length === 0 ? (
          <p className="text-sm text-amber-200/90">Create a Career Field first.</p>
        ) : stageModels.length === 0 ? (
          <p className="text-sm text-amber-200/90">
            Enable at least one Stage Model before creating specialisms.
          </p>
        ) : (
          <>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs text-slate-400 space-y-1">
                <span>Career field</span>
                <select
                  value={form.fieldId}
                  onChange={(e) => setForm((f) => ({ ...f, fieldId: e.target.value }))}
                  className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
                >
                  {fields.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400 space-y-1">
                <span>Stage model</span>
                <select
                  value={form.stageModelId}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      stageModelId: e.target.value,
                      disabledStageKeys: [],
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
                >
                  {stageModels.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-slate-400 space-y-1">
                <span>Name</span>
                <input
                  value={form.name}
                  onChange={(e) => {
                    const name = e.target.value
                    setForm((f) => ({
                      ...f,
                      name,
                      slug: f.slugTouched ? f.slug : slugifyCareerLibraryName(name),
                    }))
                  }}
                  placeholder="e.g. Adult Nursing"
                  className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400 space-y-1">
                <span>Slug</span>
                <input
                  value={form.slug}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      slug: slugifyCareerLibraryName(e.target.value),
                      slugTouched: true,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 font-mono"
                />
              </label>
              <label className="text-xs text-slate-400 space-y-1 md:col-span-2">
                <span>Description</span>
                <input
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400 space-y-1">
                <span>Professional body</span>
                <input
                  value={form.professionalBody}
                  onChange={(e) => setForm((f) => ({ ...f, professionalBody: e.target.value }))}
                  placeholder="Optional"
                  className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
                />
              </label>
              <label className="text-xs text-slate-400 space-y-1">
                <span>Status</span>
                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, status: e.target.value as CareerLibraryPublishStatus }))
                  }
                  className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
                >
                  <option value="draft">Draft</option>
                  <option value="approved">Approved</option>
                </select>
              </label>
              <label className="text-xs text-slate-400 space-y-1">
                <span>Sort order</span>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))
                  }
                  className="w-full rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
                />
              </label>
            </div>
            {selectedModel && selectedModel.stages.length > 0 && (
              <div className="rounded-xl border border-slate-800 bg-slate-900/40 px-3 py-2 space-y-2 md:col-span-2">
                <p className="text-[11px] uppercase tracking-wider text-slate-500">
                  Stages (uncheck to disable for this specialism)
                </p>
                <p className="text-xs text-slate-400">
                  {selectedModel.stages
                    .filter((s) => s.active)
                    .map((s) => s.label)
                    .join(' → ')}
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {selectedModel.stages
                    .filter((s) => s.active)
                    .map((stage) => {
                      const disabled = form.disabledStageKeys.includes(stage.stageKey)
                      return (
                        <label
                          key={stage.id}
                          className="inline-flex items-center gap-1.5 text-xs text-slate-300"
                        >
                          <input
                            type="checkbox"
                            checked={!disabled}
                            onChange={(e) => {
                              const enable = e.target.checked
                              setForm((f) => ({
                                ...f,
                                disabledStageKeys: enable
                                  ? f.disabledStageKeys.filter((k) => k !== stage.stageKey)
                                  : [...new Set([...f.disabledStageKeys, stage.stageKey])],
                              }))
                            }}
                            className="rounded border-slate-600"
                          />
                          {stage.label}
                        </label>
                      )
                    })}
                </div>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-4">
              <label className="inline-flex items-center gap-2 text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={form.regulated}
                  onChange={(e) => setForm((f) => ({ ...f, regulated: e.target.checked }))}
                  className="rounded border-slate-600"
                />
                Regulated profession
              </label>
              <button
                type="button"
                disabled={saving || !form.name.trim() || !form.fieldId || !form.stageModelId}
                onClick={() => void save()}
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {editing ? 'Save specialism' : 'Add specialism'}
              </button>
            </div>
          </>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-800/80 bg-slate-950/60 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-200">Specialisms</h2>
          <span className="text-xs text-slate-500">{specialisms.length} total</span>
        </div>
        {specialisms.length === 0 ? (
          <p className="px-4 py-10 text-sm text-slate-500 text-center">
            No specialisms yet. Nothing is pre-loaded.
          </p>
        ) : (
          <ul className="divide-y divide-slate-800/70">
            {specialisms.map((item) => (
              <li key={item.id} className="px-4 py-3 flex flex-wrap items-start gap-3 justify-between bg-slate-950/30">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-slate-100">{item.name}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.fieldName ?? 'Field'} ·{' '}
                    <span className="font-mono text-slate-400">{item.slug}</span>
                    {item.stageModelName ? ` · ${item.stageModelName}` : ''}
                    {item.regulatedProfession ? ' · Regulated' : ''}
                    {item.disabledStageKeys?.length
                      ? ` · Disabled: ${item.disabledStageKeys.join(', ')}`
                      : ''}
                  </p>
                  {item.description ? (
                    <p className="text-xs text-slate-500 mt-1">{item.description}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <SortControl
                    value={item.sortOrder}
                    disabled={saving}
                    onChange={(next) => void patchQuick(item, { sortOrder: next })}
                  />
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() =>
                      void patchQuick(item, {
                        status: item.status === 'approved' ? 'draft' : 'approved',
                      })
                    }
                    className="text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300"
                  >
                    {item.status === 'approved' ? 'Set draft' : 'Approve'}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => void patchQuick(item, { active: !item.active })}
                    className={cn(
                      'text-xs px-2.5 py-1.5 rounded-lg border',
                      item.active
                        ? 'border-emerald-500/30 text-emerald-300'
                        : 'border-slate-700 text-slate-500'
                    )}
                  >
                    {item.active ? 'Active' : 'Disabled'}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setEditing(item)}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setDeleteTarget(item)}
                    className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-300"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete specialism?"
        message={`Delete "${deleteTarget?.name ?? ''}"? Linked roles, learning options, recognition, or rules will block deletion.`}
        variant="danger"
        confirmText="Delete specialism"
        onCancel={() => setDeleteTarget(null)}
        onConfirm={() => void confirmDelete()}
      />
    </div>
  )
}

/* ───────────────────────── Stage models ───────────────────────── */

function StageModelsPanel({
  stageModels,
  saving,
  setSaving,
  onChanged,
  addToast,
}: {
  stageModels: CareerLibraryStageModel[]
  saving: boolean
  setSaving: (v: boolean) => void
  onChanged: () => Promise<void>
  addToast: ToastFn
}) {
  const [expandedId, setExpandedId] = useState<string | null>(stageModels[0]?.id ?? null)
  const [modelForm, setModelForm] = useState({ name: '', description: '', modelKey: '' })
  const [editModel, setEditModel] = useState<CareerLibraryStageModel | null>(null)
  const [stageForm, setStageForm] = useState({ label: '', description: '', sortOrder: 0 })
  const [editStage, setEditStage] = useState<CareerLibraryStage | null>(null)
  const [deleteModel, setDeleteModel] = useState<CareerLibraryStageModel | null>(null)
  const [deleteStage, setDeleteStage] = useState<CareerLibraryStage | null>(null)

  const createModel = async () => {
    if (!modelForm.name.trim() || saving) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/career-library/stage-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: modelForm.name.trim(),
          description: modelForm.description.trim(),
          modelKey: modelForm.modelKey.trim() || undefined,
        }),
      })
      if (!res.ok) {
        addToast({ title: 'Could not add stage model', description: await readError(res), variant: 'error' })
        return
      }
      addToast({ title: 'Stage model added', variant: 'success' })
      setModelForm({ name: '', description: '', modelKey: '' })
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  const saveModelEdit = async () => {
    if (!editModel || saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/career-library/stage-models/${editModel.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editModel.name.trim(),
          description: editModel.description.trim(),
          sortOrder: editModel.sortOrder,
          active: editModel.active,
        }),
      })
      if (!res.ok) {
        addToast({ title: 'Update failed', description: await readError(res), variant: 'error' })
        return
      }
      addToast({ title: 'Stage model updated', variant: 'success' })
      setEditModel(null)
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  const toggleModelActive = async (model: CareerLibraryStageModel) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/career-library/stage-models/${model.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !model.active }),
      })
      if (!res.ok) {
        addToast({ title: 'Update failed', description: await readError(res), variant: 'error' })
        return
      }
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  const saveStage = async (stageModelId: string) => {
    if (saving) return
    setSaving(true)
    try {
      if (editStage) {
        const res = await fetch(`/api/admin/career-library/stages/${editStage.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            label: editStage.label.trim(),
            description: editStage.description.trim(),
            sortOrder: editStage.sortOrder,
            active: editStage.active,
          }),
        })
        if (!res.ok) {
          addToast({ title: 'Could not update stage', description: await readError(res), variant: 'error' })
          return
        }
        addToast({ title: 'Stage updated', variant: 'success' })
        setEditStage(null)
      } else {
        if (!stageForm.label.trim()) return
        const res = await fetch('/api/admin/career-library/stages', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stageModelId,
            label: stageForm.label.trim(),
            description: stageForm.description.trim(),
            sortOrder: stageForm.sortOrder,
          }),
        })
        if (!res.ok) {
          addToast({ title: 'Could not add stage', description: await readError(res), variant: 'error' })
          return
        }
        addToast({ title: 'Stage added', variant: 'success' })
        setStageForm({ label: '', description: '', sortOrder: 0 })
      }
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  const patchStageQuick = async (stage: CareerLibraryStage, body: Record<string, unknown>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/career-library/stages/${stage.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        addToast({ title: 'Update failed', description: await readError(res), variant: 'error' })
        return
      }
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteModel = async () => {
    if (!deleteModel) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/career-library/stage-models/${deleteModel.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        addToast({ title: 'Cannot delete model', description: await readError(res), variant: 'error' })
        return
      }
      addToast({ title: 'Stage model deleted', variant: 'success' })
      setDeleteModel(null)
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  const confirmDeleteStage = async () => {
    if (!deleteStage) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/career-library/stages/${deleteStage.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        addToast({ title: 'Cannot delete stage', description: await readError(res), variant: 'error' })
        return
      }
      addToast({ title: 'Stage deleted', variant: 'success' })
      setDeleteStage(null)
      await onChanged()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-slate-400 max-w-2xl">
        Stage models are reusable templates. Specialisms choose a model; Degree / Master / PhD is
        never hardcoded onto specialisms.
      </p>

      <section className="rounded-2xl border border-slate-800/80 bg-slate-950/50 p-5 space-y-3">
        <h2 className="text-sm font-semibold text-slate-200">Add custom stage model</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <input
            value={modelForm.name}
            onChange={(e) => setModelForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Model name"
            className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
          />
          <input
            value={modelForm.modelKey}
            onChange={(e) => setModelForm((f) => ({ ...f, modelKey: e.target.value }))}
            placeholder="Key (optional)"
            className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100 font-mono"
          />
          <input
            value={modelForm.description}
            onChange={(e) => setModelForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Description"
            className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
          />
        </div>
        <button
          type="button"
          disabled={saving || !modelForm.name.trim()}
          onClick={() => void createModel()}
          className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-medium bg-cyan-600 hover:bg-cyan-500 text-white disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Add model
        </button>
      </section>

      {editModel && (
        <section className="rounded-2xl border border-cyan-500/30 bg-cyan-950/10 p-5 space-y-3">
          <h2 className="text-sm font-semibold text-slate-200">Edit model · {editModel.modelKey}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={editModel.name}
              onChange={(e) => setEditModel({ ...editModel, name: e.target.value })}
              className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
            />
            <input
              type="number"
              value={editModel.sortOrder}
              onChange={(e) =>
                setEditModel({ ...editModel, sortOrder: Number(e.target.value) || 0 })
              }
              className="rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
            />
            <input
              value={editModel.description}
              onChange={(e) => setEditModel({ ...editModel, description: e.target.value })}
              className="md:col-span-2 rounded-xl border border-slate-700/70 bg-slate-900/70 px-3 py-2 text-sm text-slate-100"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={() => void saveModelEdit()}
              className="rounded-xl px-4 py-2 text-sm bg-cyan-600 text-white disabled:opacity-50"
            >
              Save model
            </button>
            <button
              type="button"
              onClick={() => setEditModel(null)}
              className="rounded-xl px-4 py-2 text-sm border border-slate-700 text-slate-300"
            >
              Cancel
            </button>
          </div>
        </section>
      )}

      <div className="space-y-4">
        {stageModels.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-10">
            No stage models found. Apply the Career Library migrations, then refresh.
          </p>
        ) : (
          stageModels.map((model) => {
            const open = expandedId === model.id
            return (
              <section
                key={model.id}
                className="rounded-2xl border border-slate-800/80 overflow-hidden bg-slate-950/40"
              >
                <div className="px-4 py-3 flex flex-wrap items-start justify-between gap-3 border-b border-slate-800/70">
                  <button
                    type="button"
                    className="text-left min-w-0"
                    onClick={() => setExpandedId(open ? null : model.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-slate-100">{model.name}</p>
                      {model.isSystem && (
                        <span className="text-[10px] uppercase tracking-wider text-cyan-400/80 border border-cyan-500/20 rounded-full px-2 py-0.5">
                          system
                        </span>
                      )}
                      {!model.active && (
                        <span className="text-[10px] text-slate-500">disabled</span>
                      )}
                    </div>
                    <p className="text-xs font-mono text-slate-500 mt-0.5">{model.modelKey}</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-xl">{model.description}</p>
                  </button>
                  <div className="flex flex-wrap items-center gap-2">
                    <SortControl
                      value={model.sortOrder}
                      disabled={saving}
                      onChange={(next) => {
                        void (async () => {
                          setSaving(true)
                          try {
                            const res = await fetch(
                              `/api/admin/career-library/stage-models/${model.id}`,
                              {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ sortOrder: next }),
                              }
                            )
                            if (!res.ok) {
                              addToast({
                                title: 'Update failed',
                                description: await readError(res),
                                variant: 'error',
                              })
                              return
                            }
                            await onChanged()
                          } finally {
                            setSaving(false)
                          }
                        })()
                      }}
                    />
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => void toggleModelActive(model)}
                      className={cn(
                        'text-xs px-2.5 py-1.5 rounded-lg border',
                        model.active
                          ? 'border-emerald-500/30 text-emerald-300'
                          : 'border-slate-700 text-slate-500'
                      )}
                    >
                      {model.active ? 'Enabled' : 'Disabled'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditModel(model)}
                      className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-slate-700 text-slate-300"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    {!model.isSystem && (
                      <button
                        type="button"
                        onClick={() => setDeleteModel(model)}
                        className="inline-flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg border border-red-500/30 text-red-300"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {open && (
                  <div className="p-4 space-y-4">
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                        Stages ({model.stages.length})
                      </h3>
                      {model.stages.length === 0 ? (
                        <p className="text-sm text-slate-500 mb-3">No stages yet for this model.</p>
                      ) : (
                        <ul className="space-y-2 mb-4">
                          {model.stages.map((stage) => (
                            <li
                              key={stage.id}
                              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-800/80 px-3 py-2"
                            >
                              {editStage?.id === stage.id ? (
                                <div className="flex-1 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                                  <input
                                    value={editStage.label}
                                    onChange={(e) =>
                                      setEditStage({ ...editStage, label: e.target.value })
                                    }
                                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
                                  />
                                  <input
                                    value={editStage.description}
                                    onChange={(e) =>
                                      setEditStage({ ...editStage, description: e.target.value })
                                    }
                                    placeholder="Description"
                                    className="rounded-lg border border-slate-700 bg-slate-900 px-2 py-1.5 text-sm text-slate-100"
                                  />
                                  <div className="flex gap-2">
                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() => void saveStage(model.id)}
                                      className="text-xs px-2 py-1 rounded-lg bg-cyan-600 text-white"
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditStage(null)}
                                      className="text-xs px-2 py-1 rounded-lg border border-slate-700 text-slate-300"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div>
                                    <p className="text-sm text-slate-100">{stage.label}</p>
                                    <p className="text-[11px] font-mono text-slate-500">
                                      {stage.stageKey}
                                      {!stage.active ? ' · inactive' : ''}
                                    </p>
                                  </div>
                                  <div className="flex flex-wrap items-center gap-2">
                                    <SortControl
                                      value={stage.sortOrder}
                                      disabled={saving}
                                      onChange={(next) =>
                                        void patchStageQuick(stage, { sortOrder: next })
                                      }
                                    />
                                    <button
                                      type="button"
                                      disabled={saving}
                                      onClick={() =>
                                        void patchStageQuick(stage, { active: !stage.active })
                                      }
                                      className="text-xs px-2 py-1 rounded-lg border border-slate-700 text-slate-300"
                                    >
                                      {stage.active ? 'Active' : 'Disabled'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditStage(stage)}
                                      className="text-xs px-2 py-1 rounded-lg border border-slate-700 text-slate-300"
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeleteStage(stage)}
                                      className="text-xs px-2 py-1 rounded-lg border border-red-500/30 text-red-300"
                                    >
                                      Delete
                                    </button>
                                  </div>
                                </>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>

                    {!editStage && (
                      <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-3 space-y-2">
                        <p className="text-xs font-medium text-slate-300">Add stage</p>
                        <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_auto_auto]">
                          <input
                            value={stageForm.label}
                            onChange={(e) =>
                              setStageForm((f) => ({ ...f, label: e.target.value }))
                            }
                            placeholder="Stage label"
                            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
                          />
                          <input
                            value={stageForm.description}
                            onChange={(e) =>
                              setStageForm((f) => ({ ...f, description: e.target.value }))
                            }
                            placeholder="Description"
                            className="rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
                          />
                          <input
                            type="number"
                            value={stageForm.sortOrder}
                            onChange={(e) =>
                              setStageForm((f) => ({
                                ...f,
                                sortOrder: Number(e.target.value) || 0,
                              }))
                            }
                            className="w-24 rounded-lg border border-slate-700 bg-slate-950 px-2 py-1.5 text-sm text-slate-100"
                          />
                          <button
                            type="button"
                            disabled={saving || !stageForm.label.trim()}
                            onClick={() => void saveStage(model.id)}
                            className="rounded-lg px-3 py-1.5 text-xs bg-cyan-600 text-white disabled:opacity-50"
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </section>
            )
          })
        )}
      </div>

      <ConfirmModal
        isOpen={Boolean(deleteModel)}
        title="Delete stage model?"
        message={
          deleteModel?.isSystem
            ? 'System models cannot be deleted.'
            : `Delete "${deleteModel?.name ?? ''}"? Stages under it will also be removed. Specialisms using it will block deletion.`
        }
        variant="danger"
        confirmText="Delete model"
        onCancel={() => setDeleteModel(null)}
        onConfirm={() => void confirmDeleteModel()}
      />
      <ConfirmModal
        isOpen={Boolean(deleteStage)}
        title="Delete stage?"
        message={`Delete stage "${deleteStage?.label ?? ''}"?`}
        variant="danger"
        confirmText="Delete stage"
        onCancel={() => setDeleteStage(null)}
        onConfirm={() => void confirmDeleteStage()}
      />
    </div>
  )
}
