'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Archive, Loader2, Pencil, Plus, Search, Star, Trash2 } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { ConfirmModal } from '@/components/ConfirmModal'
import JobFormModal from '@/components/admin/jobs/JobFormModal'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { routeTagLabel } from '@/lib/admin/jobs/routeTags'
import { isJobListingExpired } from '@/lib/jobs/listingVisibility'
import {
  archiveAdminJobRecord,
  createAdminJobRecord,
  deleteAdminJobRecord,
  fetchAdminJobs,
  updateAdminJobRecord,
} from '@/lib/admin/jobs/repository'
import type { AdminJob, AdminJobInput } from '@/lib/admin/jobs/types'

type Filter = 'all' | 'active' | 'archived' | 'featured' | 'partner'

export default function AdminJobsManager() {
  const { addToast } = useToast()
  const [jobs, setJobs] = useState<AdminJob[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<Filter>('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminJob | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminJob | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const result = await fetchAdminJobs()
    setLoading(false)
    if (!result.ok) {
      addToast({ title: 'Could not load jobs', description: result.error, variant: 'error' })
      return
    }
    setJobs(result.data.jobs)
  }, [addToast])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filtered = useMemo(() => {
    let list = jobs
    if (filter === 'active') list = list.filter((j) => j.active && !j.archived)
    if (filter === 'archived') list = list.filter((j) => j.archived)
    if (filter === 'featured') list = list.filter((j) => j.featured)
    if (filter === 'partner') list = list.filter((j) => j.partnerCompany)
    const q = search.trim().toLowerCase()
    if (q) {
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.companyName.toLowerCase().includes(q) ||
          j.location.toLowerCase().includes(q)
      )
    }
    return list
  }, [jobs, filter, search])

  const handleSave = async (input: AdminJobInput, id?: string) => {
    setSaving(true)
    const result = id
      ? await updateAdminJobRecord(id, input)
      : await createAdminJobRecord(input)
    setSaving(false)
    if (!result.ok) {
      addToast({ title: 'Save failed', description: result.error, variant: 'error' })
      return
    }
    addToast({ title: id ? 'Job updated' : 'Job created', variant: 'success' })
    setFormOpen(false)
    setEditing(null)
    await refresh()
  }

  const handleArchive = async (job: AdminJob) => {
    setSaving(true)
    const result = await archiveAdminJobRecord(job)
    setSaving(false)
    if (!result.ok) {
      addToast({ title: 'Archive failed', description: result.error, variant: 'error' })
      return
    }
    addToast({ title: 'Job archived', variant: 'success' })
    await refresh()
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    const result = await deleteAdminJobRecord(deleteTarget.id)
    setSaving(false)
    if (!result.ok) {
      addToast({ title: 'Delete failed', description: result.error, variant: 'error' })
      return
    }
    setDeleteTarget(null)
    addToast({ title: 'Job deleted', variant: 'success' })
    await refresh()
  }

  return (
    <AppShell>
      <header className="mb-6 pb-4 border-b border-slate-800/60">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Admin
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-50">Jobs Management</h1>
            <p className="text-sm text-slate-400 mt-1">
              Add and manage JobAZ listings shown alongside Adzuna and Reed results.
            </p>
          </div>
          <button type="button" onClick={() => { setEditing(null); setFormOpen(true) }} className={btnPrimary}>
            <Plus className="w-4 h-4" />
            Add Job
          </button>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 mb-4">
        {(['all', 'active', 'featured', 'partner', 'archived'] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={cn(
              'text-xs px-3 py-1.5 rounded-full border capitalize',
              filter === f
                ? 'border-violet-500/50 bg-violet-950/40 text-violet-200'
                : 'border-slate-700 text-slate-500'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="relative mb-4 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search jobs…"
          className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-700/60 bg-slate-900/50 text-sm text-slate-100"
        />
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          Loading jobs…
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-sm text-slate-500 py-12 text-center">No jobs found.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-800/60">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Job</th>
                <th className="px-4 py-3">Location</th>
                <th className="px-4 py-3">Routes</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtered.map((job) => (
                <tr key={job.id} className="bg-slate-950/40 hover:bg-slate-900/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-100">{job.title}</p>
                    <p className="text-xs text-slate-500">{job.companyName}</p>
                    <div className="flex gap-1 mt-1">
                      {job.featured && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-0.5">
                          <Star className="w-3 h-3" /> Featured
                        </span>
                      )}
                      {job.partnerCompany && (
                        <span className="text-[10px] text-violet-400">Partner</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{job.location || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {job.routeTags.slice(0, 3).map((t) => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {routeTagLabel(t)}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {job.archived ? (
                      <span className="text-amber-400 text-xs">Archived</span>
                    ) : isJobListingExpired(job.expiryDate) ? (
                      <span className="text-red-400 text-xs">Expired</span>
                    ) : job.active ? (
                      <span className="text-emerald-400 text-xs">Active</span>
                    ) : (
                      <span className="text-slate-500 text-xs">Inactive</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <button
                        type="button"
                        onClick={() => { setEditing(job); setFormOpen(true) }}
                        className="p-1.5 rounded hover:bg-slate-800 text-slate-400"
                        title="Edit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {!job.archived && (
                        <button
                          type="button"
                          onClick={() => void handleArchive(job)}
                          className="p-1.5 rounded hover:bg-slate-800 text-slate-400"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setDeleteTarget(job)}
                        className="p-1.5 rounded hover:bg-red-950/40 text-red-400"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <JobFormModal
        open={formOpen}
        initial={editing}
        saving={saving}
        onClose={() => { setFormOpen(false); setEditing(null) }}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Job"
        message={`Permanently delete "${deleteTarget?.title}"?`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </AppShell>
  )
}

const btnPrimary =
  'inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-violet-600 text-white hover:bg-violet-500'
