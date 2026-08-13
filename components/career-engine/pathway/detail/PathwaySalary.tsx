'use client'

import type { CareerPathwayKnowledge } from '@/lib/career-engine/pathway-knowledge'

type Props = {
  knowledge: CareerPathwayKnowledge
}

function looksLikeSalary(line: string): boolean {
  return /£|\bsalary\b|\bpay\b|\bwage\b|\bper year\b|\bpa\b/i.test(line)
}

function isZeroOrFake(line: string): boolean {
  return /£\s*0\b|^0\s*[-–]/.test(line.trim())
}

export function PathwaySalary({ knowledge }: Props) {
  const raw = knowledge.salary.is_placeholder ? [] : knowledge.salary.items
  const items = raw.filter((line) => !isZeroOrFake(line))

  if (items.length === 0) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-sm font-semibold text-slate-100">Salary and work information</h2>
        <p className="mt-2 text-sm italic text-slate-500">
          Salary information has not yet been added.
        </p>
      </section>
    )
  }

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3">
      <h2 className="text-sm font-semibold text-slate-100">Salary and work information</h2>
      <ul className="space-y-2">
        {items.map((line, i) => (
          <li key={line} className="text-sm text-slate-300">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {i === 0 && looksLikeSalary(line)
                ? 'Typical salary'
                : i === 1
                  ? 'Additional note'
                  : 'Salary note'}
            </span>
            <p className="mt-0.5">{line}</p>
          </li>
        ))}
      </ul>
      <p className="text-[11px] text-slate-500">
        Figures come from the Career Knowledge Library when available — not national averages
        invented by JobAZ.
      </p>
    </section>
  )
}
