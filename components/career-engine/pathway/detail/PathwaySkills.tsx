'use client'

import type { CareerPathwayKnowledge } from '@/lib/career-engine/pathway-knowledge'

type Props = {
  knowledge: CareerPathwayKnowledge
}

export function PathwaySkills({ knowledge }: Props) {
  const required = knowledge.required_skills.is_placeholder ? [] : knowledge.required_skills.items
  const transferable = knowledge.transferable_skills.is_placeholder
    ? []
    : knowledge.transferable_skills.items

  const core = required.filter((s) => /^core:/i.test(s)).map((s) => s.replace(/^core:\s*/i, ''))
  const technical = required
    .filter((s) => /^technical:/i.test(s))
    .map((s) => s.replace(/^technical:\s*/i, ''))
  const other = required.filter((s) => !/^core:/i.test(s) && !/^technical:/i.test(s))

  if (required.length === 0 && transferable.length === 0) {
    return null
  }

  const Group = ({ title, items }: { title: string; items: string[] }) =>
    items.length === 0 ? null : (
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</h3>
        <ul className="mt-1.5 flex flex-wrap gap-2">
          {items.map((item) => (
            <li
              key={item}
              className="rounded-lg border border-white/10 bg-black/20 px-2.5 py-1 text-xs text-slate-200"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    )

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-4">
      <h2 className="text-sm font-semibold text-slate-100">Skills for this role</h2>
      <Group title="Core professional skills" items={core.length ? core : other} />
      <Group title="Technical skills" items={technical} />
      {core.length > 0 && other.length > 0 ? (
        <Group title="Additional skills" items={other} />
      ) : null}
      <Group title="Transferable skills" items={transferable} />
    </section>
  )
}
