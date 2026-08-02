'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ChevronDown,
  ChevronUp,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from 'lucide-react'
import { ConfirmModal } from '@/components/ConfirmModal'
import { cn } from '@/lib/utils'
import {
  CAREER_LIBRARY_ACADEMIC_REQUIREMENTS,
  CAREER_LIBRARY_FIT_CLASSIFICATIONS,
  CAREER_LIBRARY_REGISTRATION_REQUIREMENTS,
  CAREER_LIBRARY_ROLE_CATEGORIES,
  CAREER_LIBRARY_SENIORITY_LEVELS,
  type CareerLibraryField,
  type CareerLibraryFitClassification,
  type CareerLibraryRole,
  type CareerLibraryRoleStatus,
  type CareerLibrarySpecialism,
  type CareerLibraryStageModel,
} from '@/lib/admin/career-library/types'

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

function labelize(value: string): string {
  return value.replace(/_/g, ' ')
}

function StatusBadge({ status }: { status: CareerLibraryRoleStatus }) {
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

function FitBadge({ fit }: { fit: CareerLibraryFitClassification }) {
  const styles =
    fit === 'immediate'
      ? 'border-cyan-500/30 bg-cyan-950/40 text-cyan-200'
      : fit === 'realistic_next'
        ? 'border-sky-500/30 bg-sky-950/30 text-sky-200'
        : fit === 'future_progression'
          ? 'border-violet-500/30 bg-violet-950/30 text-violet-200'
          : 'border-teal-500/30 bg-teal-950/30 text-teal-200'
  return (
    <span className={cn('text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full border', styles)}>
      {labelize(fit)}
    </span>
  )
}

type FormState = {
  specialismId: string
  stageId: string
  name: string
  description: string
  roleCategory: string
  seniorityLevel: string
  minimumExperienceYears: number
  experienceRequirementLabel: string
  professionalRegistrationRequirement: string
  professionalMembershipRequirement: string
  academicRequirement: string
  isResearchRole: boolean
  isAcademicRole: boolean
  isRegulatedOrRestricted: boolean
  eligibilityNote: string
  fitClassification: string
  priority: number
  status: CareerLibraryRoleStatus
  active: boolean
}

const emptyForm = (specialismId = ''): FormState => ({
  specialismId,
  stageId: '',
  name: '',
  description: '',
  roleCategory: 'professional_practice',
  seniorityLevel: 'entry',
  minimumExperienceYears: 0,
  experienceRequirementLabel: 'No prior experience required',
  professionalRegistrationRequirement: 'none',
  professionalMembershipRequirement: 'none',
  academicRequirement: 'degree_relevant',
  isResearchRole: false,
  isAcademicRole: false,
  isRegulatedOrRestricted: false,
  eligibilityNote: '',
  fitClassification: 'realistic_next',
  priority: 100,
  status: 'draft',
  active: true,
})

export default function CareerRolesPanel({
  fields,
  specialisms,
  stageModels,
  addToast,
}: {
  fields: CareerLibraryField[]
  specialisms: CareerLibrarySpecialism[]
  stageModels: CareerLibraryStageModel[]
  addToast: ToastFn
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [roles, setRoles] = useState<CareerLibraryRole[]>([])
  const [fieldFilter, setFieldFilter] = useState('')
  const [specialismFilter, setSpecialismFilter] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [editing, setEditing] = useState<CareerLibraryRole | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<CareerLibraryRole | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm())

  const filteredSpecialisms = useMemo(() => {
    if (!fieldFilter) return specialisms
    return specialisms.filter((s) => s.fieldId === fieldFilter)
  }, [fieldFilter, specialisms])

  const stageOptions = useMemo(() => {
    const specialism = specialisms.find((s) => s.id === (form.specialismId || specialismFilter))
    const modelId = specialism?.stageModelId
    if (!modelId) {
      return stageModels.flatMap((m) => m.stages.map((st) => ({ ...st, modelName: m.name })))
    }
    const model = stageModels.find((m) => m.id === modelId)
    return (model?.stages ?? []).map((st) => ({ ...st, modelName: model?.name ?? '' }))
  }, [form.specialismId, specialismFilter, specialisms, stageModels])

  const filterStageOptions = useMemo(() => {
    const specialism = specialisms.find((s) => s.id === specialismFilter)
    if (!specialism?.stageModelId) {
      const keys = new Map<string, string>()
      for (const r of roles) {
        if (r.stageKey) keys.set(r.stageKey, r.stageLabel || r.stageKey)
      }
      return Array.from(keys.entries()).map(([key, label]) => ({ key, label }))
    }
    const model = stageModels.find((m) => m.id === specialism.stageModelId)
    return (model?.stages ?? []).map((st) => ({ key: st.stageKey, label: st.label }))
  }, [roles, specialismFilter, specialisms, stageModels])

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fieldFilter) params.set('field_id', fieldFilter)
      if (specialismFilter) params.set('specialism_id', specialismFilter)
      if (stageFilter) params.set('stage_key', stageFilter)
      const qs = params.toString()
      const res = await fetch(`/api/admin/career-library/roles${qs ? `?${qs}` : ''}`, {
        cache: 'no-store',
      })
      if (!res.ok) {
        addToast({
          title: 'Could not load career roles',
          description: await readError(res),
          variant: 'error',
        })
        return
      }
      const data = (await res.json()) as { roles?: CareerLibraryRole[] }
      setRoles(data.roles ?? [])
    } catch (err) {
      addToast({
        title: 'Could not load career roles',
        description: err instanceof Error ? err.message : 'Network error',
        variant: 'error',
      })
    } finally {
      setLoading(false)
    }
  }, [addToast, fieldFilter, specialismFilter, stageFilter])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const resetForm = () => {
    setEditing(null)
    setShowForm(false)
    setForm(emptyForm(specialismFilter || filteredSpecialisms[0]?.id || ''))
  }

  const startCreate = () => {
    setEditing(null)
    setShowForm(true)
    setForm(emptyForm(specialismFilter || filteredSpecialisms[0]?.id || ''))
  }

  const startEdit = (role: CareerLibraryRole) => {
    setEditing(role)
    setShowForm(true)
    setForm({
      specialismId: role.specialismId,
      stageId: role.stageId ?? '',
      name: role.name,
      description: role.description,
      roleCategory: role.roleCategory,
      seniorityLevel: role.seniorityLevel,
      minimumExperienceYears: role.minimumExperienceYears,
      experienceRequirementLabel: role.experienceRequirementLabel,
      professionalRegistrationRequirement: role.professionalRegistrationRequirement,
      professionalMembershipRequirement: role.professionalMembershipRequirement,
      academicRequirement: role.academicRequirement,
      isResearchRole: role.isResearchRole,
      isAcademicRole: role.isAcademicRole,
      isRegulatedOrRestricted: role.isRegulatedOrRestricted,
      eligibilityNote: role.eligibilityNote,
      fitClassification: role.fitClassification,
      priority: role.priority,
      status: role.status,
      active: role.active,
    })
  }

  const save = async () => {
    if (!form.name.trim() || !form.specialismId || saving) return
    setSaving(true)
    try {
      const payload = {
        specialismId: form.specialismId,
        stageId: form.stageId || null,
        name: form.name.trim(),
        description: form.description.trim(),
        roleCategory: form.roleCategory,
        seniorityLevel: form.seniorityLevel,
        minimumExperienceYears: form.minimumExperienceYears,
        experienceRequirementLabel: form.experienceRequirementLabel.trim(),
        professionalRegistrationRequirement: form.professionalRegistrationRequirement,
        professionalMembershipRequirement: form.professionalMembershipRequirement,
        academicRequirement: form.academicRequirement,
        isResearchRole: form.isResearchRole,
        isAcademicRole: form.isAcademicRole,
        isRegulatedOrRestricted: form.isRegulatedOrRestricted,
        eligibilityNote: form.eligibilityNote.trim(),
        fitClassification: form.fitClassification,
        priority: form.priority,
        status: form.status,
        active: form.active && form.status !== 'disabled',
      }
      const res = await fetch(
        editing
          ? `/api/admin/career-library/roles/${editing.id}`
          : '/api/admin/career-library/roles',
        {
          method: editing ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )
      if (!res.ok) {
        addToast({
          title: editing ? 'Update failed' : 'Could not create role',
          description: await readError(res),
          variant: 'error',
        })
        return
      }
      addToast({
        title: editing ? 'Role updated' : 'Role created',
        variant: 'success',
      })
      resetForm()
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  const patchQuick = async (role: CareerLibraryRole, body: Record<string, unknown>) => {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/career-library/roles/${role.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        addToast({
          title: 'Update failed',
          description: await readError(res),
          variant: 'error',
        })
        return
      }
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  const confirmDelete = async () => {
    if (!deleteTarget || saving) return
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/career-library/roles/${deleteTarget.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        addToast({
          title: 'Could not delete role',
          description: await readError(res),
          variant: 'error',
        })
        return
      }
      addToast({ title: 'Role deleted', variant: 'success' })
      setDeleteTarget(null)
      if (editing?.id === deleteTarget.id) resetForm()
      await refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">Career Roles</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Academic stage means educational relevance. Seniority, experience, and registration
            determine professional eligibility separately.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-cyan-500/40 bg-cyan-950/40 text-cyan-100 hover:bg-cyan-950/60"
        >
          <Plus className="w-3.5 h-3.5" />
          Add role
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <label className="text-xs text-slate-400 space-y-1">
          <span>Field</span>
          <select
            value={fieldFilter}
            onChange={(e) => {
              setFieldFilter(e.target.value)
              setSpecialismFilter('')
              setStageFilter('')
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
          >
            <option value="">All fields</option>
            {fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-400 space-y-1">
          <span>Specialism</span>
          <select
            value={specialismFilter}
            onChange={(e) => {
              setSpecialismFilter(e.target.value)
              setStageFilter('')
            }}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
          >
            <option value="">All specialisms</option>
            {filteredSpecialisms.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs text-slate-400 space-y-1">
          <span>Education / professional stage</span>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
          >
            <option value="">All stages</option>
            {filterStageOptions.map((st) => (
              <option key={st.key} value={st.key}>
                {st.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {showForm && (
        <div className="rounded-xl border border-slate-700/70 bg-slate-950/40 p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-medium text-slate-100">
              {editing ? 'Edit role metadata' : 'New career role'}
            </h3>
            <button
              type="button"
              onClick={resetForm}
              className="text-xs text-slate-400 hover:text-slate-200"
            >
              Cancel
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="text-xs text-slate-400 space-y-1 md:col-span-2">
              <span>Title</span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
              />
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Specialism</span>
              <select
                value={form.specialismId}
                onChange={(e) => setForm((f) => ({ ...f, specialismId: e.target.value, stageId: '' }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
              >
                <option value="">Select…</option>
                {specialisms.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fieldName ? `${s.fieldName} · ` : ''}
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Academic stage (relevance)</span>
              <select
                value={form.stageId}
                onChange={(e) => setForm((f) => ({ ...f, stageId: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
              >
                <option value="">None</option>
                {stageOptions.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Role category</span>
              <select
                value={form.roleCategory}
                onChange={(e) => setForm((f) => ({ ...f, roleCategory: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
              >
                {CAREER_LIBRARY_ROLE_CATEGORIES.map((v) => (
                  <option key={v} value={v}>
                    {labelize(v)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Seniority</span>
              <select
                value={form.seniorityLevel}
                onChange={(e) => setForm((f) => ({ ...f, seniorityLevel: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
              >
                {CAREER_LIBRARY_SENIORITY_LEVELS.map((v) => (
                  <option key={v} value={v}>
                    {labelize(v)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Minimum experience (years)</span>
              <input
                type="number"
                min={0}
                max={50}
                value={form.minimumExperienceYears}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    minimumExperienceYears: Number(e.target.value) || 0,
                  }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
              />
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Fit classification</span>
              <select
                value={form.fitClassification}
                onChange={(e) => setForm((f) => ({ ...f, fitClassification: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
              >
                {CAREER_LIBRARY_FIT_CLASSIFICATIONS.map((v) => (
                  <option key={v} value={v}>
                    {labelize(v)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Registration requirement</span>
              <select
                value={form.professionalRegistrationRequirement}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    professionalRegistrationRequirement: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
              >
                {CAREER_LIBRARY_REGISTRATION_REQUIREMENTS.map((v) => (
                  <option key={v} value={v}>
                    {labelize(v)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Membership requirement</span>
              <select
                value={form.professionalMembershipRequirement}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    professionalMembershipRequirement: e.target.value,
                  }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
              >
                {CAREER_LIBRARY_REGISTRATION_REQUIREMENTS.map((v) => (
                  <option key={v} value={v}>
                    {labelize(v)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Academic requirement</span>
              <select
                value={form.academicRequirement}
                onChange={(e) => setForm((f) => ({ ...f, academicRequirement: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
              >
                {CAREER_LIBRARY_ACADEMIC_REQUIREMENTS.map((v) => (
                  <option key={v} value={v}>
                    {labelize(v)}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Status</span>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    status: e.target.value as CareerLibraryRoleStatus,
                    active: e.target.value !== 'disabled',
                  }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
              >
                <option value="draft">draft</option>
                <option value="approved">approved</option>
                <option value="disabled">disabled</option>
              </select>
            </label>
            <label className="text-xs text-slate-400 space-y-1">
              <span>Priority (lower first)</span>
              <input
                type="number"
                value={form.priority}
                onChange={(e) =>
                  setForm((f) => ({ ...f, priority: Number(e.target.value) || 0 }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
              />
            </label>
            <label className="text-xs text-slate-400 space-y-1 md:col-span-2">
              <span>Experience requirement label</span>
              <input
                value={form.experienceRequirementLabel}
                onChange={(e) =>
                  setForm((f) => ({ ...f, experienceRequirementLabel: e.target.value }))
                }
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
              />
            </label>
            <label className="text-xs text-slate-400 space-y-1 md:col-span-2">
              <span>Eligibility note</span>
              <textarea
                rows={3}
                value={form.eligibilityNote}
                onChange={(e) => setForm((f) => ({ ...f, eligibilityNote: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
              />
            </label>
            <label className="text-xs text-slate-400 space-y-1 md:col-span-2">
              <span>Description</span>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                className="w-full rounded-lg border border-slate-700 bg-slate-950/60 px-2.5 py-2 text-sm text-slate-200"
              />
            </label>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-slate-300">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isResearchRole}
                onChange={(e) => setForm((f) => ({ ...f, isResearchRole: e.target.checked }))}
              />
              Research role
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isAcademicRole}
                onChange={(e) => setForm((f) => ({ ...f, isAcademicRole: e.target.checked }))}
              />
              Academic role
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.isRegulatedOrRestricted}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isRegulatedOrRestricted: e.target.checked }))
                }
              />
              Regulated / restricted
            </label>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
              />
              Active
            </label>
          </div>
          <div className="flex justify-end">
            <button
              type="button"
              disabled={saving || !form.name.trim() || !form.specialismId}
              onClick={() => void save()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border border-cyan-500/40 bg-cyan-950/40 text-cyan-100 disabled:opacity-40"
            >
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {editing ? 'Save changes' : 'Create role'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
          <Loader2 className="w-4 h-4 animate-spin" />
          Loading roles…
        </div>
      ) : roles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-700/70 px-4 py-10 text-center text-sm text-slate-400">
          No career roles match these filters.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/70">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-950/80 text-[11px] uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-3 py-2.5 font-medium">Priority</th>
                <th className="px-3 py-2.5 font-medium">Role</th>
                <th className="px-3 py-2.5 font-medium">Category</th>
                <th className="px-3 py-2.5 font-medium">Seniority</th>
                <th className="px-3 py-2.5 font-medium">Min exp.</th>
                <th className="px-3 py-2.5 font-medium">Registration</th>
                <th className="px-3 py-2.5 font-medium">Fit</th>
                <th className="px-3 py-2.5 font-medium">Stage</th>
                <th className="px-3 py-2.5 font-medium">Status</th>
                <th className="px-3 py-2.5 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {roles.map((role) => (
                <tr key={role.id} className="bg-slate-950/20 hover:bg-slate-900/40">
                  <td className="px-3 py-2.5 align-top">
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        disabled={saving}
                        aria-label="Higher priority"
                        onClick={() => void patchQuick(role, { priority: role.priority - 10 })}
                        className="p-1 rounded border border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-40"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-[11px] font-mono text-slate-500 w-8 text-center">
                        {role.priority}
                      </span>
                      <button
                        type="button"
                        disabled={saving}
                        aria-label="Lower priority"
                        onClick={() => void patchQuick(role, { priority: role.priority + 10 })}
                        className="p-1 rounded border border-slate-700 text-slate-400 hover:text-slate-200 disabled:opacity-40"
                      >
                        <ChevronDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-top min-w-[180px]">
                    <div className="font-medium text-slate-100">{role.name}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {role.specialismName || '—'}
                      {!role.active && (
                        <span className="ml-2 text-slate-600">· inactive</span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-top text-slate-300 capitalize">
                    {labelize(role.roleCategory)}
                  </td>
                  <td className="px-3 py-2.5 align-top text-slate-300 capitalize">
                    {labelize(role.seniorityLevel)}
                  </td>
                  <td className="px-3 py-2.5 align-top text-slate-300">
                    {role.minimumExperienceYears}y
                  </td>
                  <td className="px-3 py-2.5 align-top text-slate-300 capitalize">
                    {labelize(role.professionalRegistrationRequirement)}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <FitBadge fit={role.fitClassification} />
                  </td>
                  <td className="px-3 py-2.5 align-top text-slate-400 text-xs">
                    {role.stageLabel || role.stageKey || '—'}
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <div className="flex flex-col gap-1.5">
                      <StatusBadge status={role.status} />
                      <select
                        disabled={saving}
                        value={role.status}
                        onChange={(e) =>
                          void patchQuick(role, {
                            status: e.target.value as CareerLibraryRoleStatus,
                          })
                        }
                        className="rounded border border-slate-700 bg-slate-950/60 px-1.5 py-1 text-[11px] text-slate-300"
                      >
                        <option value="draft">draft</option>
                        <option value="approved">approved</option>
                        <option value="disabled">disabled</option>
                      </select>
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
                        <input
                          type="checkbox"
                          checked={role.active}
                          disabled={saving}
                          onChange={(e) =>
                            void patchQuick(role, { active: e.target.checked })
                          }
                        />
                        Enabled
                      </label>
                    </div>
                  </td>
                  <td className="px-3 py-2.5 align-top">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => startEdit(role)}
                        className="p-1.5 rounded border border-slate-700 text-slate-300 hover:text-slate-100"
                        aria-label={`Edit ${role.name}`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={saving}
                        onClick={() => setDeleteTarget(role)}
                        className="p-1.5 rounded border border-slate-700 text-rose-300/80 hover:text-rose-200"
                        aria-label={`Delete ${role.name}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete career role?"
        message={`Delete "${deleteTarget?.name ?? ''}"? Linked learning options will be unlinked. This cannot be undone.`}
        variant="danger"
        confirmText="Delete role"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  )
}
