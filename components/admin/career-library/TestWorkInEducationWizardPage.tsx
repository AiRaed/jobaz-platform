'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AppShell from '@/components/layout/AppShell'
import { LibraryPathWizard } from '@/components/career-engine/work-in-education/wizard/LibraryPathWizard'

export default function TestWorkInEducationWizardPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-3xl px-4 py-8">
        <div className="mb-6">
          <Link
            href="/admin/career-library"
            className="mb-2 inline-flex items-center gap-1 text-xs text-slate-400 hover:text-slate-200"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Career Library
          </Link>
          <p className="text-[11px] uppercase tracking-wider text-cyan-400/80">
            Admin preview · library-driven Work in My Education
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Flow: Field → Specialism → Stage → Results (Work in My Education Library). Diagnostics:{' '}
            <Link
              href="/admin/career-library/test-work-in-education"
              className="text-cyan-400/90 hover:text-cyan-300"
            >
              raw matcher
            </Link>
            {' · '}
            <Link
              href="/admin/career-library/test-work-in-education-assessment"
              className="text-cyan-400/90 hover:text-cyan-300"
            >
              legacy assessment form
            </Link>
          </p>
        </div>

        <LibraryPathWizard adminMode sessionKey="jobaz.wie.library_path.admin.v1" />
      </div>
    </AppShell>
  )
}
