'use client'

import type { PathwayDetailProvenance } from '@/lib/career-engine/pathway-knowledge'

type Props = {
  provenance: PathwayDetailProvenance
}

export function PathwayDataNotice({ provenance }: Props) {
  return (
    <aside className="rounded-xl border border-white/5 bg-black/20 px-4 py-3 text-[11px] leading-relaxed text-slate-500">
      <p className="font-semibold uppercase tracking-wider text-slate-400">About this guidance</p>
      <ul className="mt-2 list-disc space-y-1 pl-4">
        <li>Based on the JobAZ Career Knowledge Library (source: {provenance.data_source}).</li>
        <li>
          Regulated roles may require confirmation from the relevant professional body — this is
          career guidance, not a guarantee of employment or professional eligibility.
        </li>
        <li>
          Missing knowledge is shown as unavailable rather than generated
          {provenance.missing_sections.length > 0
            ? ` (sections pending: ${provenance.missing_sections.slice(0, 5).join(', ')})`
            : ''}
          .
        </li>
      </ul>
    </aside>
  )
}
