'use client'

import Link from 'next/link'
import { useState } from 'react'
import type { PathwayDetailRole } from '@/lib/career-engine/pathway-knowledge'

const SAVE_KEY = 'jobaz.wie.saved_pathways.v1'

type Props = {
  role: PathwayDetailRole
  resultsHref?: string
}

export function PathwayDetailActions({ role, resultsHref }: Props) {
  const [saved, setSaved] = useState(false)
  const roleQ = encodeURIComponent(role.title)

  const savePathway = () => {
    try {
      const raw = window.sessionStorage.getItem(SAVE_KEY)
      const list: Array<{ pathway_id: string; title: string; saved_at: string }> = raw
        ? JSON.parse(raw)
        : []
      if (!list.some((x) => x.pathway_id === role.id)) {
        list.unshift({
          pathway_id: role.id,
          title: role.title,
          saved_at: new Date().toISOString(),
        })
        window.sessionStorage.setItem(SAVE_KEY, JSON.stringify(list.slice(0, 40)))
      }
      setSaved(true)
    } catch {
      // ignore
    }
  }

  const btn =
    'inline-flex min-h-11 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-medium text-slate-100 hover:bg-white/10'
  const btnDisabled =
    'inline-flex min-h-11 cursor-not-allowed items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2 text-sm font-medium text-slate-500'

  return (
    <section className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-slate-100">Next with JobAZ</h2>
      <div className="flex flex-wrap gap-2">
        <Link href={`/cv-builder-v2?role=${roleQ}`} className={btn}>
          Tailor my CV for this role
        </Link>
        <Link href={`/cover?role=${roleQ}`} className={btn}>
          Create a cover letter
        </Link>
        <Link href={`/interview-coach?role=${roleQ}`} className={btn}>
          Practise interview questions
        </Link>
        <Link href={`/job-finder?q=${roleQ}`} className={btn}>
          Explore related jobs
        </Link>
        <Link href="/courses" className={btn}>
          Review courses and qualifications
        </Link>
        <button type="button" onClick={savePathway} className={btn}>
          {saved ? 'Pathway saved' : 'Save pathway'}
        </button>
        <span className={btnDisabled} title="Coming later">
          Pathway coaching · Coming later
        </span>
      </div>
      {resultsHref ? (
        <Link
          href={resultsHref}
          className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500"
        >
          Return to results
        </Link>
      ) : null}
    </section>
  )
}
