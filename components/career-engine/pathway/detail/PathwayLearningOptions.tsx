'use client'

import type { CareerPathwayKnowledge } from '@/lib/career-engine/pathway-knowledge'

type Props = {
  knowledge: CareerPathwayKnowledge
}

export function PathwayLearningOptions({ knowledge }: Props) {
  const courses = knowledge.recommended_courses
  const quals = knowledge.required_qualifications.is_placeholder
    ? []
    : knowledge.required_qualifications.items
  const licences = knowledge.useful_licences.is_placeholder
    ? []
    : knowledge.useful_licences.items

  const hasCourses = !courses.is_placeholder && courses.items.length > 0
  const hasAny = hasCourses || quals.length > 0 || licences.length > 0

  if (!hasAny) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-semibold text-slate-100">Learning and qualification guidance</h2>
        <p className="mt-2 text-sm italic text-slate-500">
          Learning options and course links have not yet been added in the Career Knowledge Library.
        </p>
        <p className="mt-2 text-xs text-slate-500">
          Commercial course recommendations and marketplace matching are not part of this experience.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-slate-100">Learning and qualification guidance</h2>

      {quals.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Recommended qualifications
          </h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            {quals.map((q) => (
              <li key={q} className="text-sm text-slate-300">
                {q}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {licences.length > 0 ? (
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Licences & recognition routes
          </h3>
          <ul className="mt-1.5 list-disc space-y-1 pl-5">
            {licences.map((l) => (
              <li key={l} className="text-sm text-slate-300">
                {l}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Learning options
        </h3>
        {hasCourses ? (
          <ul className="mt-1.5 space-y-2">
            {courses.items.map((c) => (
              <li
                key={c.title}
                className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-300"
              >
                <span>
                  {c.title}
                  {c.provider ? <span className="text-slate-500"> · {c.provider}</span> : null}
                </span>
                {c.url ? (
                  <a
                    href={c.url}
                    className="inline-flex rounded-lg border border-cyan-700/50 bg-cyan-950/40 px-2.5 py-1 text-xs font-medium text-cyan-100 hover:bg-cyan-950/60"
                    target="_blank"
                    rel="noreferrer"
                  >
                    View course
                  </a>
                ) : (
                  <span className="rounded-lg border border-white/10 px-2.5 py-1 text-xs text-slate-500">
                    Provider not listed yet
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1.5 text-sm italic text-slate-500">
            No library-linked learning options for this role yet. Search courses later when you are
            ready — we only show Apply Now when a real provider link exists.
          </p>
        )}
      </div>
    </section>
  )
}
