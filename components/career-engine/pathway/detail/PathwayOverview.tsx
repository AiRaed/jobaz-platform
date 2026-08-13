'use client'

import type { CareerPathwayKnowledge } from '@/lib/career-engine/pathway-knowledge'

type Props = {
  knowledge: CareerPathwayKnowledge
}

export function PathwayOverview({ knowledge }: Props) {
  const aboutItems = knowledge.about.is_placeholder
    ? []
    : knowledge.about.items.filter(
        (i) => !/will be added|structured responsibilities|not been added|coming soon/i.test(i)
      )
  const respItems = knowledge.responsibilities.is_placeholder
    ? []
    : knowledge.responsibilities.items.filter(
        (i) => !/will be added|structured responsibilities|see “about|see "about/i.test(i)
      )
  const employerItems = knowledge.typical_employers.is_placeholder
    ? []
    : knowledge.typical_employers.items

  if (aboutItems.length === 0 && respItems.length === 0 && employerItems.length === 0) {
    return null
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-slate-100">About this role</h2>

      {aboutItems.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">Overview</h3>
          <ul className="mt-2 space-y-1.5">
            {aboutItems.map((item) => (
              <li key={item} className="text-sm leading-relaxed text-slate-300">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {respItems.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Main responsibilities
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {respItems.map((item) => (
              <li key={item} className="text-sm text-slate-300">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {employerItems.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Sectors & employer types
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {employerItems.map((item) => (
              <li key={item} className="text-sm text-slate-300">
                {item}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  )
}
