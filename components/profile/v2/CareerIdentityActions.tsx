'use client'

import Link from 'next/link'
import {
  BookOpen,
  Briefcase,
  FileText,
  LayoutDashboard,
  Pencil,
} from 'lucide-react'

type Props = {
  onEdit: () => void
  editing: boolean
}

const linkClass =
  'inline-flex items-center gap-2 rounded-xl border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] px-3.5 py-2.5 text-xs font-semibold text-[var(--jaz-text)] hover:border-violet-500/40 dark:border-slate-700 dark:bg-slate-900/50 dark:text-slate-100 dark:hover:border-violet-500/40 transition'

export default function CareerIdentityActions({ onEdit, editing }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={onEdit}
        className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-violet-500"
      >
        <Pencil className="h-3.5 w-3.5" aria-hidden />
        {editing ? 'Cancel edit' : 'Edit profile'}
      </button>
      <Link href="/dashboard?tab=plan" className={linkClass}>
        <LayoutDashboard className="h-3.5 w-3.5 text-violet-500" aria-hidden />
        Open My Plan
      </Link>
      <Link href="/cv-builder-v2" className={linkClass}>
        <FileText className="h-3.5 w-3.5 text-cyan-500" aria-hidden />
        Open CV Builder
      </Link>
      <Link href="/job-finder" className={linkClass}>
        <Briefcase className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
        Find Jobs
      </Link>
      <Link href="/career-hub" className={linkClass}>
        <BookOpen className="h-3.5 w-3.5 text-amber-500" aria-hidden />
        Browse Courses
      </Link>
    </div>
  )
}
