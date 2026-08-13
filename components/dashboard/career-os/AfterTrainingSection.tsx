'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { PathPlanLadder } from '@/lib/dashboard/careerOs/pathPlanLadder'
import type { SuggestedRole } from '@/lib/dashboard/careerOs/types'
import PlanSectionHeader from '@/components/plan-ui/PlanSectionHeader'
import { PLAN_SECTION_STYLES } from '@/lib/plan-ui/planVisualSystem'

type Props = {
  ladder: PathPlanLadder | null | undefined
  suggestedRoles?: SuggestedRole[]
}

/** Compact unlocked-role pills. Display only. */
export default function AfterTrainingSection({ ladder, suggestedRoles = [] }: Props) {
  const roles =
    ladder?.upgradeAfter.slice(0, 3).map((r) => ({
      title: r.title,
      href: r.href ?? `/job-finder?query=${encodeURIComponent(r.title)}`,
    })) ??
    suggestedRoles.slice(0, 3).map((r) => ({
      title: r.title,
      href: `/job-finder?query=${encodeURIComponent(r.title)}`,
    }))

  if (roles.length === 0) return null

  const training = PLAN_SECTION_STYLES.training

  return (
    <section id="after-training" className="space-y-2.5">
      <PlanSectionHeader
        accent="training"
        title="Future routes"
        subtitle="Progression roles to work toward later — after more experience or training."
      />
      <ul className="flex flex-wrap gap-2">
        {roles.map((role) => (
          <li key={role.title}>
            <Link
              href={role.href}
              className={cn(
                'inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-medium transition',
                training.chip,
                'hover:brightness-110'
              )}
            >
              {role.title}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
