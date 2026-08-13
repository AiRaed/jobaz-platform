'use client'

/**
 * Start New Career — training-first public result (WIE-aligned chrome).
 */

import { useMemo } from 'react'
import type { PublicSncResult, PublicSncRoleCard } from '@/lib/career-engine/start-new-career/library'
import { SncCourseSection } from './SncCourseSection'
import {
  CaCallout,
  CaMatchBadge,
  CaNextWithJobaz,
  CaResultFooter,
  CaResultHeader,
  CaResultSection,
  CaRouteCard,
} from '@/components/career-engine/shared'
import { AddToMyPlanButton } from '@/components/career-engine/add-to-my-plan/AddToMyPlanButton'
import { buildCatalogFromSnc } from '@/lib/career-assistant/add-to-my-plan/buildPickCatalog'

type Props = {
  result: PublicSncResult
  onStartAgain?: () => void
  careerAssistantHref?: string
}

function RoleCard({ role }: { role: PublicSncRoleCard }) {
  const isFuture = role.timing_label === 'future_progression'
  return (
    <CaRouteCard
      title={role.role_title}
      badge={
        <CaMatchBadge
          label={isFuture ? 'Progression route' : 'After first step'}
          tone={isFuture ? 'violet' : 'emerald'}
        />
      }
      meta={
        role.licence_or_check
          ? [{ label: 'Licence / check', value: role.licence_or_check }]
          : []
      }
      description={role.description || null}
      whyTitle="Why this matches"
      keywords={role.uk_role_keywords}
      actionHref="/jobs"
      actionLabel="View jobs"
    />
  )
}

function RoleGrid({
  roles,
  emptyLabel,
}: {
  roles: PublicSncRoleCard[]
  emptyLabel: string
}) {
  if (!roles.length) {
    return (
      <p className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-slate-500">
        {emptyLabel}
      </p>
    )
  }
  return (
    <div className="grid gap-3">
      {roles.map((role) => (
        <RoleCard key={role.id} role={role} />
      ))}
    </div>
  )
}

export function PublicStartNewCareerResultExperience({
  result,
  onStartAgain,
  careerAssistantHref = '/uk-career-assistant',
}: Props) {
  const meta = {
    workType: result.work_type_label,
    route: result.route_label,
  }
  const planCatalog = useMemo(() => buildCatalogFromSnc(result), [result])

  return (
    <div className="space-y-6">
      <CaResultHeader
        pathLabel="Start a New Career"
        title={result.route_label}
        framing={result.result_framing}
        badge={
          <span className="inline-flex rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-100">
            {result.beginner_label}
          </span>
        }
        facts={[
          { label: 'Work type', value: result.work_type_label },
          { label: 'Route level', value: result.beginner_label },
          { label: 'Profession field', value: result.mapped_profession_field },
          { label: 'Specialism', value: result.mapped_specialism },
        ]}
        note={result.start_status_note}
      >
        {result.headline && result.headline !== result.route_label ? (
          <p className="mt-3 text-xs text-cyan-200/80">{result.headline}</p>
        ) : null}
        <div className="mt-4">
          <AddToMyPlanButton catalog={planCatalog} />
        </div>
      </CaResultHeader>

      {result.safety_note ? <CaCallout>{result.safety_note}</CaCallout> : null}

      <SncCourseSection
        title={result.entry_courses_section_title}
        description={result.entry_courses_section_description}
        cards={result.entry_courses}
        {...meta}
      />

      {result.first_jobs.length > 0 || result.route_kind === 'starter' ? (
        <CaResultSection
          title={result.first_jobs_section_title}
          description={result.first_jobs_section_description}
          count={result.first_jobs.length}
        >
          <RoleGrid
            roles={result.first_jobs}
            emptyLabel="No immediate starter roles for this route — see progression / future roles below."
          />
        </CaResultSection>
      ) : null}

      <SncCourseSection
        title="Next upgrade courses"
        description="Improve your chances or progress after the first entry step."
        cards={result.upgrade_courses}
        {...meta}
      />

      <CaResultSection
        title={result.later_jobs_section_title}
        description={result.later_jobs_section_description}
        count={result.better_roles_later.length}
      >
        <RoleGrid
          roles={result.better_roles_later}
          emptyLabel="Progression roles will show as you build experience in this field."
        />
      </CaResultSection>

      <CaNextWithJobaz
        showCourses={result.show_courses_button}
        leadingAction={<AddToMyPlanButton catalog={planCatalog} primary={false} />}
      />

      <CaResultFooter onStartAgain={onStartAgain} careerAssistantHref={careerAssistantHref} />
    </div>
  )
}
