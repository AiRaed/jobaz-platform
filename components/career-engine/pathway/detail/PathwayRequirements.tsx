'use client'

import type { CareerPathwayKnowledge, PathwayDetailRole } from '@/lib/career-engine/pathway-knowledge'

type Props = {
  role: PathwayDetailRole
  knowledge: CareerPathwayKnowledge
  extraRequirements?: string[]
}

function SubSection({
  title,
  items,
  emptyLabel = 'Not yet available',
}: {
  title: string
  items: string[]
  emptyLabel?: string
}) {
  if (items.length === 0) {
    return (
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
        <p className="mt-1.5 text-sm italic text-slate-500">{emptyLabel}</p>
      </div>
    )
  }
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
      <ul className="mt-1.5 list-disc space-y-1 pl-5">
        {items.map((item) => (
          <li key={item} className="text-sm text-slate-300">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PathwayRequirements({ role, knowledge, extraRequirements = [] }: Props) {
  const education = knowledge.required_qualifications.is_placeholder
    ? []
    : knowledge.required_qualifications.items
  const experience: string[] = []
  if (role.experience_label) experience.push(role.experience_label)
  else if (role.minimum_experience_years != null && role.minimum_experience_years > 0) {
    experience.push(`Typically ${role.minimum_experience_years}+ years of relevant experience`)
  }
  const registration = knowledge.professional_registrations.is_placeholder
    ? []
    : knowledge.professional_registrations.items
  const licences = knowledge.useful_licences.is_placeholder
    ? []
    : knowledge.useful_licences.items

  const recognition = extraRequirements.filter((r) =>
    /recogn|overseas|uk confirmation|naric|ecctis/i.test(r)
  )
  const additional = [
    ...extraRequirements.filter((r) => !recognition.includes(r)),
    ...(knowledge.library_note ? [knowledge.library_note] : []),
  ]

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-slate-100">Entry requirements</h2>
      <SubSection title="Education / qualification" items={education} />
      <SubSection title="Relevant experience" items={experience} />
      <SubSection title="Professional registration" items={registration} />
      <SubSection title="Licence or legal requirements" items={licences} />
      {recognition.length > 0 ? (
        <SubSection title="Overseas qualification recognition" items={recognition} />
      ) : null}
      {additional.length > 0 ? (
        <SubSection title="Additional requirements still to consider" items={additional} />
      ) : null}
    </section>
  )
}
