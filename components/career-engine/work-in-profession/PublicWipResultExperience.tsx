'use client'

/**
 * Work in My Profession result UI — aligned with Work in My Education visual language.
 */

import type { PublicWipMatchResult, PublicWipRoleCard } from '@/lib/career-engine/work-in-profession'
import { WipTrainingSection } from './WipTrainingSection'
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
import { buildCatalogFromWip } from '@/lib/career-assistant/add-to-my-plan/buildPickCatalog'
import { useMemo } from 'react'

type Props = {
  result: PublicWipMatchResult
  onStartAgain?: () => void
  careerAssistantHref?: string
  showDebug?: boolean
}

function matchTone(label: PublicWipRoleCard['match_label']) {
  if (label === 'Best immediate route') return 'emerald' as const
  if (label === 'Progression route') return 'violet' as const
  return 'sky' as const
}

function RoleCard({ role }: { role: PublicWipRoleCard }) {
  const meta = [
    { label: 'Start now?', value: role.start_now ? 'Yes' : 'No' },
    ...(role.licence_or_check
      ? [{ label: 'Licence / check', value: role.licence_or_check }]
      : []),
  ]

  return (
    <CaRouteCard
      title={role.role_title}
      badge={<CaMatchBadge label={role.match_label} tone={matchTone(role.match_label)} />}
      meta={meta}
      description={role.description}
      whyTitle="Why this matches"
      cvFocus={role.cv_focus_points}
      keywords={role.uk_role_keywords}
      actionHref="/jobs"
      actionLabel="View jobs"
    />
  )
}

export function PublicWipResultExperience({
  result,
  onStartAgain,
  careerAssistantHref = '/uk-career-assistant',
  showDebug = false,
}: Props) {
  const planCatalog = useMemo(() => buildCatalogFromWip(result), [result])

  return (
    <div className="space-y-6">
      <CaResultHeader
        pathLabel="Work in My Profession"
        title={result.specialism}
        framing={
          result.result_framing ||
          'Based on your profession, these are realistic UK roles to target.'
        }
        facts={[
          { label: 'Profession field', value: result.profession_field },
          { label: 'Specialism', value: result.specialism },
          {
            label: result.experience_result_label || 'Experience',
            value: result.experience_display_label || result.professional_level,
          },
        ]}
      >
        <div className="mt-4">
          <AddToMyPlanButton catalog={planCatalog} />
        </div>
      </CaResultHeader>

      {result.fallback_message ? <CaCallout>{result.fallback_message}</CaCallout> : null}

      {result.training_recommendations ? (
        <WipTrainingSection
          training={result.training_recommendations}
          field={result.profession_field}
          specialism={result.specialism}
        />
      ) : (
        <section
          className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-4"
          aria-label="Training note"
        >
          <h2 className="text-sm font-semibold text-slate-200">Training & licences</h2>
          <p className="mt-1.5 text-sm text-slate-400">{result.courses_note}</p>
        </section>
      )}

      <CaResultSection
        title="UK roles you can target"
        description="Realistic UK job titles matched from your profession and experience level."
        count={result.matched_role_count}
        emptyMessage="No UK target roles found for this selection yet."
      >
        {result.roles.length > 0 ? (
          <div className="grid gap-3">
            {result.roles.map((role) => (
              <RoleCard key={role.id} role={role} />
            ))}
          </div>
        ) : null}
      </CaResultSection>

      {result.requirements.length > 0 ? (
        <section
          className="rounded-2xl border border-slate-800/90 bg-slate-900/50 p-4 sm:p-5"
          aria-label="Requirements and checks"
        >
          <h2 className="text-sm font-semibold text-slate-100">Requirements / checks</h2>
          <p className="mt-1 text-xs text-slate-400">
            Common licence or check themes from your matched roles.
          </p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {result.requirements.map((req) => (
              <li
                key={req}
                className="rounded-full border border-slate-600/60 bg-slate-900/60 px-3 py-1 text-xs text-slate-200"
              >
                {req}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <CaNextWithJobaz leadingAction={<AddToMyPlanButton catalog={planCatalog} primary={false} />} />

      <CaResultFooter onStartAgain={onStartAgain} careerAssistantHref={careerAssistantHref} />

      {showDebug ? (
        <details className="rounded-xl border border-dashed border-amber-500/30 bg-amber-950/20 px-3 py-2">
          <summary className="cursor-pointer select-none text-xs font-medium text-amber-100/90">
            Dev debug (admin only)
          </summary>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-black/40 px-2 py-1 text-[10px] text-slate-500">
            {JSON.stringify(
              {
                matched_role_count: result.matched_role_count,
                fallback_used: result.fallback_used,
                result_source: result.result_source,
                experience_mode: result.experience_mode,
                experience_option_id: result.experience_option_id,
                mapped_professional_level: result.professional_level_key,
                roles: result.roles.map((r) => r.role_title),
              },
              null,
              2
            )}
          </pre>
        </details>
      ) : null}
    </div>
  )
}
