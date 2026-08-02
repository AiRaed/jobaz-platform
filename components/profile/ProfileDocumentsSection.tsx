'use client'

import Link from 'next/link'
import { FileText, ChevronRight, Sparkles } from 'lucide-react'
import type { ProfileDocumentSummary } from '@/lib/profile/types'
import ProfileCard from './ProfileCard'

type Props = { documents: ProfileDocumentSummary[] }

export default function ProfileDocumentsSection({ documents }: Props) {
  return (
    <ProfileCard title="Documents Hub" subtitle="Your career assets — one tap away." glow="cyan">
      <div className="grid gap-2">
        {documents.map((doc) => (
          <Link
            key={doc.id}
            href={doc.href}
            className="group flex items-center gap-3 rounded-xl border border-slate-700/50 bg-slate-900/30 px-3 py-3 hover:border-violet-500/35 hover:bg-violet-500/5 hover:shadow-[0_4px_20px_rgba(139,92,246,0.1)] hover:-translate-y-0.5 transition-all duration-200"
          >
            <div className="h-9 w-9 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 group-hover:bg-violet-500/20 transition">
              {doc.id === 'assessment' ? (
                <Sparkles className="w-4 h-4 text-violet-400" />
              ) : (
                <FileText className="w-4 h-4 text-violet-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-200 group-hover:text-violet-200">{doc.label}</p>
              <p className="text-xs text-slate-500 truncate">{doc.description}</p>
            </div>
            {doc.count !== undefined && doc.count > 0 && (
              <span className="text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded bg-violet-500/20 text-violet-300">
                {doc.count}
              </span>
            )}
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-violet-400 shrink-0 transition" />
          </Link>
        ))}
      </div>
    </ProfileCard>
  )
}
