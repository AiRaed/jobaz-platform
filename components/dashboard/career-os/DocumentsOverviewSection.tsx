'use client'

import Link from 'next/link'
import { ArrowRight, FileText, Mail, Award, FolderOpen } from 'lucide-react'

const DOCS = [
  { href: '/cv-builder-v2', label: 'CV', icon: FileText, desc: 'Build or update your CV' },
  { href: '/cover', label: 'Cover Letters', icon: Mail, desc: 'Tailored cover letters' },
  { href: '/career-hub', label: 'Certificates', icon: Award, desc: 'Training & licences' },
  { href: '/dashboard?tab=documents', label: 'All Documents', icon: FolderOpen, desc: 'View everything' },
]

export default function DocumentsOverviewSection() {
  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-5">
      <h3 className="text-base font-semibold text-slate-100 mb-4">Documents</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {DOCS.map(({ href, label, icon: Icon, desc }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl border border-slate-700/50 bg-slate-900/30 p-3 hover:border-violet-500/35 hover:bg-violet-500/5 transition group"
          >
            <Icon className="w-4 h-4 text-violet-400 mb-2" />
            <p className="text-sm font-medium text-slate-200 group-hover:text-violet-100">{label}</p>
            <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">{desc}</p>
          </Link>
        ))}
      </div>
      <Link
        href="/dashboard?tab=documents"
        className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-violet-300 mt-4 transition"
      >
        Open document manager
        <ArrowRight className="w-3 h-3" />
      </Link>
    </section>
  )
}
