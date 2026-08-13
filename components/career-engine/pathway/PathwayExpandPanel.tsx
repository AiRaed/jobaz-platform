'use client'

import type { CareerPathwayKnowledge } from '@/lib/career-engine/pathway-knowledge'

type Props = {
  knowledge: CareerPathwayKnowledge
  loading?: boolean
}

function Block({
  title,
  items,
  isPlaceholder,
}: {
  title: string
  items: string[]
  isPlaceholder?: boolean
}) {
  const clean = items.filter(
    (item) =>
      !isPlaceholder &&
      !/will be added|structured responsibilities|coming soon|not yet available for this role|not been added/i.test(
        item
      )
  )
  if (isPlaceholder || clean.length === 0) return null
  return (
    <section className="space-y-1.5">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</h4>
      <ul className="space-y-1">
        {clean.map((item) => (
          <li key={item} className="text-sm leading-relaxed text-slate-200">
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

export function PathwayExpandPanel({ knowledge, loading }: Props) {
  if (loading) {
    return (
      <div className="mt-4 rounded-xl border border-white/10 bg-black/20 p-4 text-sm text-slate-400">
        Loading pathway from Career Knowledge Library…
      </div>
    )
  }

  return (
    <div
      className="mt-4 space-y-4 rounded-xl border border-cyan-500/20 bg-slate-950/60 p-4 sm:p-5"
      aria-label={`Pathway details for ${knowledge.role_title}`}
    >
      <p className="text-[10px] uppercase tracking-wider text-cyan-300/70">
        Career Knowledge Library
        {knowledge.source === 'placeholder' ? ' · preview' : knowledge.source === 'partial' ? ' · partial' : ''}
      </p>

      <Block
        title={knowledge.about.label}
        items={knowledge.about.items}
        isPlaceholder={knowledge.about.is_placeholder}
      />
      <Block
        title={knowledge.responsibilities.label}
        items={knowledge.responsibilities.items}
        isPlaceholder={knowledge.responsibilities.is_placeholder}
      />
      <Block
        title={knowledge.salary.label}
        items={knowledge.salary.items}
        isPlaceholder={knowledge.salary.is_placeholder}
      />
      <Block
        title={knowledge.career_progression.label}
        items={knowledge.career_progression.items}
        isPlaceholder={knowledge.career_progression.is_placeholder}
      />
      <Block
        title={knowledge.required_qualifications.label}
        items={knowledge.required_qualifications.items}
        isPlaceholder={knowledge.required_qualifications.is_placeholder}
      />
      <Block
        title={knowledge.professional_registrations.label}
        items={knowledge.professional_registrations.items}
        isPlaceholder={knowledge.professional_registrations.is_placeholder}
      />
      <Block
        title={knowledge.useful_licences.label}
        items={knowledge.useful_licences.items}
        isPlaceholder={knowledge.useful_licences.is_placeholder}
      />

      <section className="space-y-1.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {knowledge.recommended_courses.label}
        </h4>
        {knowledge.recommended_courses.is_placeholder ||
        knowledge.recommended_courses.items.length === 0 ? (
          <p className="text-sm italic text-slate-500">
            Recommended courses will appear when learning options are linked in the library.
          </p>
        ) : (
          <ul className="space-y-1">
            {knowledge.recommended_courses.items.map((c) => (
              <li key={c.title} className="text-sm text-slate-200">
                {c.url ? (
                  <a href={c.url} className="text-cyan-300 hover:underline" target="_blank" rel="noreferrer">
                    {c.title}
                  </a>
                ) : (
                  c.title
                )}
                {c.provider ? <span className="text-slate-500"> · {c.provider}</span> : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Block
        title={knowledge.required_skills.label}
        items={knowledge.required_skills.items}
        isPlaceholder={knowledge.required_skills.is_placeholder}
      />
      <Block
        title={knowledge.transferable_skills.label}
        items={knowledge.transferable_skills.items}
        isPlaceholder={knowledge.transferable_skills.is_placeholder}
      />
      <Block
        title={knowledge.typical_employers.label}
        items={knowledge.typical_employers.items}
        isPlaceholder={knowledge.typical_employers.is_placeholder}
      />

      <section className="space-y-1.5">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          {knowledge.next_progression_roles.label}
        </h4>
        {knowledge.next_progression_roles.is_placeholder ||
        knowledge.next_progression_roles.items.length === 0 ? (
          <p className="text-sm italic text-slate-500">
            Related progression roles will appear when more roles are linked in this specialism.
          </p>
        ) : (
          <ul className="space-y-1">
            {knowledge.next_progression_roles.items.map((r) => (
              <li key={r.title} className="text-sm text-slate-200">
                {r.title}
                {r.stage_label || r.seniority ? (
                  <span className="text-slate-500">
                    {' '}
                    · {[r.stage_label, r.seniority].filter(Boolean).join(' · ')}
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
