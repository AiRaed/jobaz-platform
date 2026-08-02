'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, EyeOff, Loader2, Pencil, Plus, Search, Trash2 } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { ConfirmModal } from '@/components/ConfirmModal'
import CourseFormModal from '@/components/admin/courses/CourseFormModal'
import CourseOpportunityTracker from '@/components/admin/courses/CourseOpportunityTracker'
import ProvidersPartnersManager from '@/components/admin/courses/ProvidersPartnersManager'
import { useToast } from '@/components/ui/toast'
import { cn } from '@/lib/utils'
import { getCategoryLabel } from '@/lib/admin/courses/store'
import { CAREER_HUB_CATEGORIES } from '@/lib/career-hub/routeCategories'
import { filterAdminCourses, type AdminCourseQuickFilter } from '@/lib/admin/courses/catalogQuery'
import {
  createAdminCourseRecord,
  deleteAdminCourseRecord,
  fetchAdminCourses,
  hideAdminCourseRecord,
  isSupabaseCoursesConfigured,
  updateAdminCourseRecord,
  type CourseDataSource,
} from '@/lib/admin/courses/repository'
import type { AdminCourse, AdminCourseInput, CourseStatus } from '@/lib/admin/courses/types'
import { statusLabel } from '@/lib/admin/courses/types'

type CoursesManagerTab = 'published' | 'tracker' | 'providers'

const MANAGER_TABS: { id: CoursesManagerTab; label: string; disabled?: boolean }[] = [
  { id: 'published', label: 'Published Courses' },
  { id: 'tracker', label: 'Course Opportunity Tracker' },
  { id: 'providers', label: 'Providers / Partners' },
]

const QUICK_FILTERS: { id: AdminCourseQuickFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Draft' },
  { id: 'partner', label: 'Partner' },
  { id: 'featured', label: 'Featured' },
]

function StatusBadge({ status }: { status: CourseStatus }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border',
        status === 'published' && 'border-emerald-500/40 bg-emerald-950/40 text-emerald-300',
        status === 'draft' && 'border-slate-600/50 bg-slate-900/60 text-slate-400',
        status === 'hidden' && 'border-amber-500/35 bg-amber-950/30 text-amber-300'
      )}
    >
      {statusLabel(status)}
    </span>
  )
}

function BoolBadge({ active, label, activeClass }: { active: boolean; label: string; activeClass: string }) {
  if (!active) return <span className="text-slate-600">—</span>
  return (
    <span className={cn('text-[10px] rounded-full border px-2 py-0.5', activeClass)}>{label}</span>
  )
}

export default function AdminCoursesManager() {
  const { addToast } = useToast()
  const [courses, setCourses] = useState<AdminCourse[]>([])
  const [dataSource, setDataSource] = useState<CourseDataSource>(
    isSupabaseCoursesConfigured() ? 'supabase' : 'mock'
  )
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState<CourseStatus | 'all'>('all')
  const [quickFilter, setQuickFilter] = useState<AdminCourseQuickFilter>('all')
  const [activeTab, setActiveTab] = useState<CoursesManagerTab>('published')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<AdminCourse | null>(null)
  const [prefilledInput, setPrefilledInput] = useState<Partial<AdminCourseInput> | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AdminCourse | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    const result = await fetchAdminCourses()
    setLoading(false)

    if (!result.ok) {
      addToast({
        title: 'Could not load courses',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      return
    }

    setCourses(result.data.courses)
    setDataSource(result.data.source)
  }, [addToast])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const filtered = useMemo(
    () =>
      filterAdminCourses(courses, {
        search,
        category: categoryFilter,
        status: statusFilter,
        quickFilter,
      }),
    [courses, search, categoryFilter, statusFilter, quickFilter]
  )

  const openAdd = () => {
    setEditing(null)
    setPrefilledInput(null)
    setFormOpen(true)
  }

  const openEdit = (course: AdminCourse) => {
    setEditing(course)
    setPrefilledInput(null)
    setFormOpen(true)
  }

  const handleEditCourseFromProviders = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId)
    if (!course) {
      addToast({ title: 'Course not found', description: 'Refresh and try again.', variant: 'error' })
      return
    }
    setActiveTab('published')
    openEdit(course)
  }

  const handleCreatePublicCourseFromTracker = (input: AdminCourseInput) => {
    setActiveTab('published')
    setEditing(null)
    setPrefilledInput(input)
    setFormOpen(true)
    addToast({
      title: 'Draft course pre-filled',
      description: 'Review the Add Course form — status is Draft until you publish.',
      variant: 'success',
    })
  }

  const handleSave = async (input: AdminCourseInput, id?: string) => {
    setSaving(true)
    const result = id
      ? await updateAdminCourseRecord(id, input)
      : await createAdminCourseRecord(input)
    setSaving(false)

    if (!result.ok) {
      addToast({
        title: id ? 'Could not save changes' : 'Could not add course',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      return
    }

    addToast({
      title: id ? 'Course updated' : 'Course added',
      variant: 'success',
    })
    setFormOpen(false)
    setEditing(null)
    setPrefilledInput(null)
    await refresh()
  }

  const handleHide = async (course: AdminCourse) => {
    setSaving(true)
    const result = await hideAdminCourseRecord(course)
    setSaving(false)

    if (!result.ok) {
      addToast({
        title: 'Could not hide course',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      return
    }

    addToast({ title: 'Course hidden', variant: 'success' })
    await refresh()
  }

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return
    setSaving(true)
    const result = await deleteAdminCourseRecord(deleteTarget.id)
    setSaving(false)

    if (!result.ok) {
      addToast({
        title: 'Could not delete course',
        description: result.error,
        variant: 'error',
        duration: 5000,
      })
      return
    }

    addToast({ title: 'Course deleted', variant: 'success' })
    setDeleteTarget(null)
    await refresh()
  }

  const emptyMessage =
    courses.length === 0
      ? 'No courses yet. Add your first course to build the catalogue.'
      : 'No courses match your filters. Add a course or adjust filters.'

  const storageLabel =
    dataSource === 'supabase'
      ? 'Stored in Supabase'
      : 'Local mock storage (Supabase env not configured)'

  return (
    <AppShell className="max-w-[1400px]">
      <header className="mb-6 pb-6 border-b border-slate-800/60">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Admin
        </Link>
        <p className="text-[10px] uppercase tracking-widest text-violet-300 mb-1">JobAZ Admin</p>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-50">Courses Manager</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-3xl">
          Manage public course listings and internal course opportunity planning before publishing.
        </p>
      </header>

      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-800/80 pb-4">
        {MANAGER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            disabled={tab.disabled}
            onClick={() => !tab.disabled && setActiveTab(tab.id)}
            className={cn(
              'rounded-xl px-4 py-2 text-sm font-medium border transition',
              tab.disabled && 'opacity-40 cursor-not-allowed',
              activeTab === tab.id
                ? 'border-violet-500/50 bg-violet-950/40 text-violet-100'
                : 'border-slate-700/60 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-600'
            )}
          >
            {tab.label}
            {tab.disabled && (
              <span className="ml-1.5 text-[10px] uppercase tracking-wide text-slate-600">Soon</span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'tracker' ? (
        <CourseOpportunityTracker
          onCreatePublicCourse={handleCreatePublicCourseFromTracker}
          onEditPublishedCourse={handleEditCourseFromProviders}
        />
      ) : activeTab === 'providers' ? (
        <ProvidersPartnersManager onEditCourse={handleEditCourseFromProviders} />
      ) : (
        <>
      <div className="flex flex-col gap-3 mb-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-3">
          <button
            type="button"
            onClick={openAdd}
            disabled={loading || saving}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white hover:from-violet-500 hover:to-fuchsia-500 transition shrink-0 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Course
          </button>

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses…"
              disabled={loading}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-700/60 bg-slate-950/50 text-sm text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-violet-500/50 disabled:opacity-50"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 disabled:opacity-50"
          >
            <option value="all">All categories</option>
            {CAREER_HUB_CATEGORIES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.id === 'maintenance' ? 'Maintenance & Facilities' : c.label}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CourseStatus | 'all')}
            disabled={loading}
            className="rounded-xl border border-slate-700/60 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-200 focus:outline-none focus:border-violet-500/50 disabled:opacity-50"
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="hidden">Hidden</option>
          </select>
        </div>

        <div className="flex flex-wrap gap-2">
          {QUICK_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setQuickFilter(f.id)}
              disabled={loading}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-medium border transition disabled:opacity-50',
                quickFilter === f.id
                  ? 'border-violet-500/50 bg-violet-950/40 text-violet-200'
                  : 'border-slate-700/60 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:border-slate-600'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-700/60 bg-slate-950/40 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-900/50 text-[10px] uppercase tracking-widest text-slate-500">
                <th className="px-4 py-3 font-medium">Course title</th>
                <th className="px-4 py-3 font-medium hidden lg:table-cell">Provider</th>
                <th className="px-4 py-3 font-medium">Routes</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Featured</th>
                <th className="px-4 py-3 font-medium">Published</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Show in Hub</th>
                <th className="px-4 py-3 font-medium hidden sm:table-cell">Priority</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Clicks</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Saves</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={10} className="px-4 py-16 text-center text-slate-400">
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading courses…
                    </span>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-slate-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filtered.map((course) => (
                  <tr key={course.id} className="hover:bg-slate-900/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-100">{course.title}</p>
                      <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">{course.shortDescription}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5 hidden xl:block">
                        {getCategoryLabel(course.category)}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden lg:table-cell">{course.provider || '—'}</td>
                    <td className="px-4 py-3 text-slate-300 tabular-nums">{course.routeIds.length}</td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <BoolBadge
                        active={course.featuredCourse}
                        label="Featured"
                        activeClass="border-violet-500/30 bg-violet-950/30 text-violet-300"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={course.status} />
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {course.showInCareerHub ? (
                        <BoolBadge
                          active
                          label="Yes"
                          activeClass="border-emerald-500/30 bg-emerald-950/30 text-emerald-300"
                        />
                      ) : (
                        <span className="text-[10px] rounded-full border border-slate-700/60 px-2 py-0.5 text-slate-500">
                          No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden sm:table-cell tabular-nums">
                      {course.priorityOrder}
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell tabular-nums">{course.clicks}</td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell tabular-nums">{course.saves}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        {course.partnerCourse && (
                          <span className="hidden xl:inline text-[10px] rounded-full border border-cyan-500/30 bg-cyan-950/30 px-2 py-0.5 text-cyan-300 mr-1">
                            Partner
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => openEdit(course)}
                          disabled={saving}
                          className="p-2 rounded-lg text-slate-400 hover:text-violet-300 hover:bg-violet-500/10 transition disabled:opacity-50"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {course.status !== 'hidden' && (
                          <button
                            type="button"
                            onClick={() => handleHide(course)}
                            disabled={saving}
                            className="p-2 rounded-lg text-slate-400 hover:text-amber-300 hover:bg-amber-500/10 transition disabled:opacity-50"
                            title="Hide"
                          >
                            <EyeOff className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(course)}
                          disabled={saving}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs text-slate-500 mt-4">
        {loading ? 'Loading…' : `${filtered.length} of ${courses.length} courses · ${storageLabel}`}
      </p>
        </>
      )}

      <CourseFormModal
        open={formOpen}
        course={editing}
        initialInput={prefilledInput}
        saving={saving}
        onClose={() => {
          if (saving) return
          setFormOpen(false)
          setEditing(null)
          setPrefilledInput(null)
        }}
        onSave={handleSave}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        title="Delete course?"
        message={`Remove "${deleteTarget?.title ?? 'this course'}" permanently? This cannot be undone.`}
        variant="danger"
        confirmText={saving ? 'Deleting…' : 'Delete'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          if (!saving) setDeleteTarget(null)
        }}
      />
    </AppShell>
  )
}
