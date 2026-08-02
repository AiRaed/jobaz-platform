import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import type { AdminAiPriority } from './types'

export type AdminTaskStatus = 'open' | 'in_progress' | 'done' | 'ignored' | 'cancelled'

export type CreateAdminTaskInput = {
  source?: string
  title: string
  description?: string
  priority?: AdminAiPriority
  relatedRoute?: string | null
  relatedProvider?: string | null
  relatedCourse?: string | null
  relatedReportId?: string | null
}

export type AdminTaskRow = {
  id: string
  source: string
  title: string
  description: string
  priority: AdminAiPriority
  status: AdminTaskStatus
  related_report_id?: string | null
  related_route?: string | null
  related_provider?: string | null
  related_course?: string | null
  created_at?: string
  updated_at?: string
  completed_at?: string | null
  ignored_at?: string | null
}

export type AdminTasksSummary = {
  open: number
  highPriority: number
  inProgress: number
  doneThisWeek: number
  ignored: number
}

const SELECT_COLS =
  'id, source, title, description, priority, status, related_report_id, related_route, related_provider, related_course, created_at, updated_at, completed_at, ignored_at'

const SELECT_COLS_MIN =
  'id, source, title, description, priority, status, related_route, related_provider, related_course, created_at, updated_at'

function normalizeTitle(title: string): string {
  return title.toLowerCase().replace(/\s+/g, ' ').trim()
}

function mapRow(t: Record<string, unknown>): AdminTaskRow {
  const statusRaw = String(t.status || 'open')
  const status = (
    ['open', 'in_progress', 'done', 'ignored', 'cancelled'].includes(statusRaw)
      ? statusRaw
      : 'open'
  ) as AdminTaskStatus

  return {
    id: String(t.id),
    source: String(t.source || ''),
    title: String(t.title || ''),
    description: String(t.description || ''),
    priority: (t.priority as AdminAiPriority) || 'Medium',
    status,
    related_report_id: (t.related_report_id as string | null) ?? null,
    related_route: (t.related_route as string | null) ?? null,
    related_provider: (t.related_provider as string | null) ?? null,
    related_course: (t.related_course as string | null) ?? null,
    created_at: t.created_at ? String(t.created_at) : undefined,
    updated_at: t.updated_at ? String(t.updated_at) : undefined,
    completed_at: t.completed_at ? String(t.completed_at) : null,
    ignored_at: t.ignored_at ? String(t.ignored_at) : null,
  }
}

async function hasColumn(column: string): Promise<boolean> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) return false
  const { error } = await supabase.from('admin_tasks').select(column).limit(1)
  if (!error) return true
  return !/does not exist|Could not find|column/i.test(error.message || '')
}

async function selectColumns(): Promise<string> {
  const hasReport = await hasColumn('related_report_id')
  return hasReport ? SELECT_COLS : SELECT_COLS_MIN
}

const PRIORITY_RANK: Record<string, number> = { High: 0, Medium: 1, Low: 2 }

/**
 * Default board order:
 * open High → open Medium → open Low → in_progress → done → ignored
 * newest first inside each group.
 */
export function sortAdminTasks(tasks: AdminTaskRow[]): AdminTaskRow[] {
  const groupRank = (t: AdminTaskRow): number => {
    if (t.status === 'open' && t.priority === 'High') return 0
    if (t.status === 'open' && t.priority === 'Medium') return 1
    if (t.status === 'open' && t.priority === 'Low') return 2
    if (t.status === 'open') return 3
    if (t.status === 'in_progress') return 4
    if (t.status === 'done') return 5
    if (t.status === 'ignored' || t.status === 'cancelled') return 6
    return 9
  }

  return [...tasks].sort((a, b) => {
    const ga = groupRank(a)
    const gb = groupRank(b)
    if (ga !== gb) return ga - gb
    if (a.status === 'in_progress') {
      const pa = PRIORITY_RANK[a.priority] ?? 9
      const pb = PRIORITY_RANK[b.priority] ?? 9
      if (pa !== pb) return pa - pb
    }
    const ta = a.created_at ? new Date(a.created_at).getTime() : 0
    const tb = b.created_at ? new Date(b.created_at).getTime() : 0
    return tb - ta
  })
}

export function summarizeAdminTasks(tasks: AdminTaskRow[]): AdminTasksSummary {
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000
  let open = 0
  let highPriority = 0
  let inProgress = 0
  let doneThisWeek = 0
  let ignored = 0

  for (const t of tasks) {
    if (t.status === 'open') open += 1
    if (t.status === 'in_progress') inProgress += 1
    if (t.status === 'ignored' || t.status === 'cancelled') ignored += 1
    if (
      (t.status === 'open' || t.status === 'in_progress') &&
      t.priority === 'High'
    ) {
      highPriority += 1
    }
    if (t.status === 'done') {
      const doneAt = t.completed_at || t.updated_at || t.created_at
      if (doneAt && new Date(doneAt).getTime() >= weekAgo) doneThisWeek += 1
    }
  }

  return { open, highPriority, inProgress, doneThisWeek, ignored }
}

export async function createAdminTask(
  input: CreateAdminTaskInput
): Promise<
  | { ok: true; id: string; task: AdminTaskRow; alreadyExists?: boolean }
  | { ok: false; error: string }
> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return { ok: false, error: 'Supabase service role not configured' }
  }

  const title = input.title.trim()
  if (!title) {
    return { ok: false, error: 'Task title is required' }
  }

  const priority = input.priority || 'Medium'
  const source = input.source || 'admin_ai'
  const description = input.description || ''
  const relatedReportId = input.relatedReportId || null
  const cols = await selectColumns()
  const withReportCol = cols.includes('related_report_id')

  if (relatedReportId) {
    let dupQuery = supabase
      .from('admin_tasks')
      .select(cols)
      .eq('source', source)
      .eq('title', title)
      .limit(20)

    if (withReportCol) {
      dupQuery = dupQuery.eq('related_report_id', relatedReportId)
    }

    const { data: existing } = await dupQuery
    const rows = (existing || []) as unknown as Record<string, unknown>[]
    const match = rows.find(
      (row) => normalizeTitle(String(row.title || '')) === normalizeTitle(title)
    )
    if (match) {
      return {
        ok: true,
        id: String(match.id),
        alreadyExists: true,
        task: mapRow(match),
      }
    }
  }

  const row: Record<string, unknown> = {
    source,
    title,
    description,
    priority,
    status: 'open',
    related_route: input.relatedRoute || null,
    related_provider: input.relatedProvider || null,
    related_course: input.relatedCourse || null,
    updated_at: new Date().toISOString(),
  }
  if (withReportCol && relatedReportId) {
    row.related_report_id = relatedReportId
  }

  const { data, error } = await supabase.from('admin_tasks').insert(row).select(cols).single()

  if (error) {
    return {
      ok: false,
      error: error.message.includes('does not exist')
        ? 'Table admin_tasks missing — run migration 20250717120000_admin_ai_tables.sql'
        : error.message,
    }
  }

  const created = data as unknown as Record<string, unknown>
  return {
    ok: true,
    id: String(created.id),
    task: mapRow(created),
  }
}

export async function listAdminTasks(options?: {
  status?: string
  priority?: string
  source?: string
  search?: string
  limit?: number
}): Promise<{ ok: true; tasks: AdminTaskRow[]; summary: AdminTasksSummary } | { ok: false; error: string }> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return { ok: false, error: 'Supabase service role not configured' }
  }

  const cols = await selectColumns()
  let q = supabase.from('admin_tasks').select(cols).order('created_at', { ascending: false })

  if (options?.status && options.status !== 'all') {
    q = q.eq('status', options.status)
  }
  if (options?.priority && options.priority !== 'all') {
    q = q.eq('priority', options.priority)
  }
  if (options?.source && options.source !== 'all') {
    q = q.eq('source', options.source)
  }

  const { data, error } = await q.limit(options?.limit ?? 200)
  if (error) {
    return { ok: false, error: error.message }
  }

  let tasks = ((data || []) as unknown as Record<string, unknown>[]).map((t) => mapRow(t))

  const search = (options?.search || '').trim().toLowerCase()
  if (search) {
    tasks = tasks.filter(
      (t) =>
        t.title.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.source.toLowerCase().includes(search) ||
        (t.related_route || '').toLowerCase().includes(search) ||
        (t.related_provider || '').toLowerCase().includes(search) ||
        (t.related_course || '').toLowerCase().includes(search)
    )
  }

  tasks = sortAdminTasks(tasks)
  // Summary should reflect all tasks when filters applied to list — compute from filtered list for UI cards clarity
  // For summary cards we want unfiltered totals; load a second pass if filters active
  let summaryTasks = tasks
  if (options?.status || options?.priority || options?.source || search) {
    const all = await supabase.from('admin_tasks').select(cols).limit(500)
    if (!all.error && all.data) {
      summaryTasks = ((all.data || []) as unknown as Record<string, unknown>[]).map((t) => mapRow(t))
    }
  }

  return {
    ok: true,
    tasks,
    summary: summarizeAdminTasks(summaryTasks),
  }
}

export async function updateAdminTaskStatus(
  id: string,
  status: AdminTaskStatus
): Promise<{ ok: true; task: AdminTaskRow } | { ok: false; error: string }> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return { ok: false, error: 'Supabase service role not configured' }
  }

  const now = new Date().toISOString()
  const patch: Record<string, unknown> = {
    status,
    updated_at: now,
  }

  const hasCompleted = await hasColumn('completed_at')
  const hasIgnored = await hasColumn('ignored_at')

  if (status === 'done' && hasCompleted) {
    patch.completed_at = now
    if (hasIgnored) patch.ignored_at = null
  } else if (status === 'ignored' && hasIgnored) {
    patch.ignored_at = now
    if (hasCompleted) patch.completed_at = null
  } else if (status === 'open' || status === 'in_progress') {
    if (hasCompleted) patch.completed_at = null
    if (hasIgnored) patch.ignored_at = null
  }

  const cols = await selectColumns()
  const { data, error } = await supabase
    .from('admin_tasks')
    .update(patch)
    .eq('id', id)
    .select(cols)
    .single()

  if (error) {
    // Fallback if ignored not in constraint yet
    if (status === 'ignored' && /check|constraint/i.test(error.message)) {
      const retry = await supabase
        .from('admin_tasks')
        .update({ status: 'cancelled', updated_at: now, ...(hasIgnored ? { ignored_at: now } : {}) })
        .eq('id', id)
        .select(cols)
        .single()
      if (retry.error) return { ok: false, error: retry.error.message }
      return { ok: true, task: mapRow(retry.data as unknown as Record<string, unknown>) }
    }
    return { ok: false, error: error.message }
  }

  return { ok: true, task: mapRow(data as unknown as Record<string, unknown>) }
}

export async function listTasksForReport(
  reportId: string
): Promise<{ ok: true; tasks: AdminTaskRow[] } | { ok: false; error: string }> {
  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return { ok: false, error: 'Supabase service role not configured' }
  }
  if (!reportId) return { ok: true, tasks: [] }

  const cols = await selectColumns()
  const withReportCol = cols.includes('related_report_id')

  if (!withReportCol) {
    const { data, error } = await supabase
      .from('admin_tasks')
      .select(cols)
      .eq('source', 'ai_manager_report')
      .ilike('description', `%${reportId}%`)
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) return { ok: false, error: error.message }
    return {
      ok: true,
      tasks: ((data || []) as unknown as Record<string, unknown>[]).map((t) => mapRow(t)),
    }
  }

  const { data, error } = await supabase
    .from('admin_tasks')
    .select(cols)
    .eq('related_report_id', reportId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) return { ok: false, error: error.message }

  return {
    ok: true,
    tasks: ((data || []) as unknown as Record<string, unknown>[]).map((t) => mapRow(t)),
  }
}

export { extractRecommendedActions, extractRecommendedActionItems } from './reportUtils'
