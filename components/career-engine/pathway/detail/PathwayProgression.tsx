'use client'

import Link from 'next/link'
import type { CareerPathwayKnowledge, PathwayDetailRole } from '@/lib/career-engine/pathway-knowledge'

type Props = {
  role: PathwayDetailRole
  knowledge: CareerPathwayKnowledge
}

export function PathwayProgression({ role, knowledge }: Props) {
  const narrative = knowledge.career_progression.is_placeholder
    ? []
    : knowledge.career_progression.items
  const linked = knowledge.next_progression_roles.is_placeholder
    ? []
    : knowledge.next_progression_roles.items

  if (narrative.length === 0 && linked.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-semibold text-slate-100">Career progression</h2>
        <p className="mt-2 text-sm italic text-slate-500">
          Linked progression roles have not yet been added for this pathway.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-slate-100">Career progression</h2>
      <p className="text-xs text-slate-500">
        Progression is based on Career Knowledge Library relationships for this specialism — not an
        assumed linear ladder.
      </p>

      <div className="relative space-y-3 pl-4 before:absolute before:left-1 before:top-2 before:bottom-2 before:w-px before:bg-cyan-700/40">
        <div className="relative">
          <span className="absolute -left-4 top-1.5 h-2.5 w-2.5 rounded-full bg-cyan-400" aria-hidden />
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-300/80">
            Current / target role
          </p>
          <p className="mt-1 text-sm font-medium text-white">{role.title}</p>
          {role.professional_stage || role.seniority ? (
            <p className="text-xs text-slate-400">
              {[role.professional_stage, role.seniority].filter(Boolean).join(' · ')}
            </p>
          ) : null}
        </div>

        {linked.map((item) => (
          <div key={`${item.role_id ?? ''}-${item.title}`} className="relative">
            <span
              className="absolute -left-4 top-1.5 h-2.5 w-2.5 rounded-full bg-slate-500"
              aria-hidden
            />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Related progression role
            </p>
            {item.role_id ? (
              <Link
                href={`/career-assistant/work-in-my-education/pathway/${encodeURIComponent(item.role_id)}`}
                className="mt-1 inline-block text-sm font-medium text-cyan-200 hover:underline"
              >
                {item.title}
              </Link>
            ) : (
              <p className="mt-1 text-sm font-medium text-slate-200">{item.title}</p>
            )}
            {item.stage_label || item.seniority ? (
              <p className="text-xs text-slate-400">
                {[item.stage_label, item.seniority].filter(Boolean).join(' · ')}
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {narrative.length > 0 ? (
        <ul className="space-y-1 border-t border-white/10 pt-3">
          {narrative.map((line) => (
            <li key={line} className="text-sm text-slate-400">
              {line}
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  )
}
