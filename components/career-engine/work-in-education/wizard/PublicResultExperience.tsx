'use client'

/**
 * Public Career Assistant result experience.
 * Groups: Best immediate / Developing / Future / Needs review.
 * Public-safe: no raw debug JSON between role cards.
 */

import { useMemo } from 'react'
import Link from 'next/link'
import type {
  PublicRoleCard,
  PublicWieAssessmentResult,
} from '@/lib/career-engine/work-in-education/public-contract'
import { matchTypeBucketCopy } from '@/lib/career-engine/work-in-education/match-safety'
import { matchSummaryFromPublicCard } from '@/lib/career-engine/pathway-knowledge'
import { CareerPathwayCard } from '@/components/career-engine/pathway'
import { WarningCard } from './WarningCard'
import { WieTrainingSection } from './WieTrainingSection'
import { AddToMyPlanButton } from '@/components/career-engine/add-to-my-plan/AddToMyPlanButton'
import { buildCatalogFromWie } from '@/lib/career-assistant/add-to-my-plan/buildPickCatalog'
import { cn } from '@/lib/utils'

type Props = {
  result: PublicWieAssessmentResult
  onStartAgain?: () => void
  careerAssistantHref?: string
  resultPageHref?: string
  /** Admin/dev only — collapsed Dev debug panel (never inline between cards) */
  showDebug?: boolean
}

const SOFT_RECOGNITION_NOTE =
  'Some UK employers may ask for qualification recognition, portfolio evidence, or manual review depending on the role.'

const RECOGNITION_OR_REVIEW_RE =
  /uk recognition|manual review|qualification may need|recognition of your qualification|portfolio evidence.*review|cannot automatically satisfy|qualification level is ambiguous/i

const ADMIN_OR_DEBUG_WARNING_RE =
  /draft library|integration testing|not for public|admin\s*\/\s*local|test mode|plan_source|ai_provider|route_id|knowledge engine.*active/i

const LOOKS_LIKE_DEBUG_JSON_RE =
  /^\s*[\{\[]|\"match_type\"|\"blockers\"|\"route_id\"|plan_source\s*:|ai_provider\s*:/i

function normalizeRecommendations(result: PublicWieAssessmentResult): {
  available_now: PublicRoleCard[]
  realistic_next: PublicRoleCard[]
  future_options: PublicRoleCard[]
  requirements_needed: PublicRoleCard[]
} {
  const r = (result.recommendations ?? {}) as Record<string, unknown>
  const pick = (publicKey: string, ...aliases: string[]): PublicRoleCard[] => {
    for (const key of [publicKey, ...aliases]) {
      const v = r[key]
      if (Array.isArray(v)) return v as PublicRoleCard[]
    }
    return []
  }
  const future = [
    ...pick('future_options', 'future_progression', 'futureProgressionRoles'),
    ...pick('academic_research', 'academic_or_research', 'academicRoles'),
  ]
  const seen = new Set<string>()
  const futureDeduped = future.filter((role) => {
    const id = role.pathway_id || role.title
    if (seen.has(id)) return false
    seen.add(id)
    return true
  })
  return {
    available_now: pick('available_now', 'immediate', 'immediateRoles'),
    realistic_next: pick('realistic_next', 'realisticNextRoles'),
    future_options: futureDeduped,
    requirements_needed: pick(
      'requirements_needed',
      'blocked_or_needs_review',
      'blockedRoles'
    ),
  }
}

function isPublicSafeLine(text: string): boolean {
  const t = text.trim()
  if (!t) return false
  if (LOOKS_LIKE_DEBUG_JSON_RE.test(t)) return false
  if (ADMIN_OR_DEBUG_WARNING_RE.test(t)) return false
  return true
}

/** Strip repeated recognition/review lines and any debug-looking payloads from role copy. */
function sanitizeRoleForPublic(role: PublicRoleCard): {
  role: PublicRoleCard
  hadRecognitionNote: boolean
} {
  const whyRaw = Array.isArray(role.why) ? role.why : []
  const reqRaw = Array.isArray(role.requirements) ? role.requirements : []

  let hadRecognitionNote = false
  const why: string[] = []
  const seenWhy = new Set<string>()
  for (const line of whyRaw) {
    const text = typeof line === 'string' ? line : String((line as { text?: unknown })?.text ?? '')
    if (!isPublicSafeLine(text)) continue
    if (RECOGNITION_OR_REVIEW_RE.test(text)) {
      hadRecognitionNote = true
      continue
    }
    const key = text.trim().toLowerCase()
    if (seenWhy.has(key)) continue
    seenWhy.add(key)
    why.push(text.trim())
  }

  const requirements: string[] = []
  const seenReq = new Set<string>()
  for (const line of reqRaw) {
    const text = typeof line === 'string' ? line : String(line ?? '')
    if (!isPublicSafeLine(text)) continue
    if (RECOGNITION_OR_REVIEW_RE.test(text)) {
      hadRecognitionNote = true
      continue
    }
    const key = text.trim().toLowerCase()
    if (seenWhy.has(key) || seenReq.has(key)) continue
    seenReq.add(key)
    requirements.push(text.trim())
  }

  return {
    hadRecognitionNote,
    role: {
      ...role,
      why,
      requirements,
      lead_in:
        role.lead_in && RECOGNITION_OR_REVIEW_RE.test(role.lead_in)
          ? 'Matched because'
          : role.lead_in,
      // Never surface internal blocker codes on public cards
      blockers: undefined,
    },
  }
}

function RoleBucket({
  title,
  description,
  roles,
  emptyMessage,
}: {
  title: string
  description: string
  roles: PublicRoleCard[]
  emptyMessage: string
}) {
  return (
    <section className="space-y-3" aria-label={title}>
      <div>
        <h2 className="text-sm font-semibold text-slate-100">
          {title}
          <span className="ml-2 font-normal text-slate-500">({roles.length})</span>
        </h2>
        <p className="mt-1 text-xs text-slate-400">{description}</p>
      </div>
      {roles.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        <div className="grid gap-3">
          {roles.map((role) => (
            <CareerPathwayCard
              key={role.pathway_id || `${role.title}-${role.specialism_name}`}
              match={matchSummaryFromPublicCard({
                ...role,
                pathway_id: role.pathway_id || '',
                match_score: typeof role.match_score === 'number' ? role.match_score : 0,
                why: Array.isArray(role.why) ? role.why : [],
                requirements: Array.isArray(role.requirements) ? role.requirements : [],
                lead_in: role.lead_in || 'Matched because',
              })}
              matchType={role.match_type}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function StageAwareActions({
  primaryType,
}: {
  primaryType: PublicRoleCard['match_type'] | undefined
}) {
  const btn =
    'inline-flex min-h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-xs font-medium text-slate-100 hover:bg-white/10'

  if (primaryType === 'needs_review_regulated') {
    return (
      <div className="flex flex-wrap gap-2">
        <Link href="/career-assistant/work-in-my-education/result" className={btn}>
          View requirements
        </Link>
        <Link href="/courses" className={btn}>
          View courses
        </Link>
      </div>
    )
  }
  if (primaryType === 'future_career_option') {
    return (
      <div className="flex flex-wrap gap-2">
        <Link href="/career-engine/work-in-education" className={btn}>
          View pathway
        </Link>
        <Link href="/courses" className={btn}>
          View required steps
        </Link>
      </div>
    )
  }
  if (primaryType === 'developing_match') {
    return (
      <div className="flex flex-wrap gap-2">
        <Link href="/cv-builder-v2" className={btn}>
          Prepare my CV
        </Link>
        <Link href="/courses" className={btn}>
          View Courses
        </Link>
      </div>
    )
  }
  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/cv-builder-v2" className={btn}>
        Prepare my CV
      </Link>
      <Link href="/jobs" className={btn}>
        View jobs
      </Link>
    </div>
  )
}

function DevDebugPanel({
  result,
  roles,
}: {
  result: PublicWieAssessmentResult
  roles: PublicRoleCard[]
}) {
  return (
    <details className="rounded-xl border border-dashed border-amber-500/30 bg-amber-950/20 px-3 py-2">
      <summary className="cursor-pointer select-none text-xs font-medium text-amber-100/90">
        Dev debug (admin only)
      </summary>
      <div className="mt-2 space-y-2">
        <pre className="overflow-x-auto rounded-lg bg-black/40 px-2 py-1 text-[10px] text-slate-500">
          {JSON.stringify(
            {
              result_token_present: Boolean(result.result_token),
              role_counts: result.role_counts,
              matched_direction: result.matched_direction,
              training_counts: result.training_recommendations
                ? {
                    already_completed:
                      result.training_recommendations.already_completed.length,
                    recommended_next:
                      result.training_recommendations.recommended_next.length,
                    provider_not_listed:
                      result.training_recommendations.provider_not_listed.length,
                  }
                : null,
            },
            null,
            2
          )}
        </pre>
        {roles.map((role) => (
          <pre
            key={role.pathway_id || role.title}
            className="overflow-x-auto rounded-lg bg-black/40 px-2 py-1 text-[10px] text-slate-500"
          >
            {JSON.stringify(
              {
                title: role.title,
                pathway_id: role.pathway_id,
                match_type: role.match_type,
                blockers: role.blockers,
                stage: role.stage_label,
                score: role.match_score,
                eligibility_status: role.eligibility_status,
                result_group: role.result_group,
              },
              null,
              2
            )}
          </pre>
        ))}
      </div>
    </details>
  )
}

export function PublicResultExperience({
  result,
  onStartAgain,
  careerAssistantHref = '/uk-career-assistant',
  resultPageHref,
  showDebug = false,
}: Props) {
  const matched =
    result.matched_direction?.specialism ||
    result.matched_direction?.field ||
    'Your pathway'

  const confLabel = result.matched_direction?.confidence_label
  const conf =
    confLabel === 'high' ? 'High' : confLabel === 'medium' ? 'Medium' : 'Needs clarification'

  const { publicRecs, showRecognitionNote, allRolesRaw } = useMemo(() => {
    const normalized = normalizeRecommendations(result)
    const buckets = {
      available_now: [] as PublicRoleCard[],
      realistic_next: [] as PublicRoleCard[],
      future_options: [] as PublicRoleCard[],
      requirements_needed: [] as PublicRoleCard[],
    }
    let recognition = false
    const raw: PublicRoleCard[] = []

    ;(['available_now', 'realistic_next', 'future_options', 'requirements_needed'] as const).forEach(
      (key) => {
        for (const role of normalized[key]) {
          raw.push(role)
          const cleaned = sanitizeRoleForPublic(role)
          if (cleaned.hadRecognitionNote) recognition = true
          buckets[key].push(cleaned.role)
        }
      }
    )

    return {
      publicRecs: buckets,
      showRecognitionNote: recognition,
      allRolesRaw: raw,
    }
  }, [result])

  const stageCtx = result.stage_context
  const summaryLines = (Array.isArray(result.summary_lines) ? result.summary_lines : []).filter(
    (line) => {
      if (!isPublicSafeLine(line) || ADMIN_OR_DEBUG_WARNING_RE.test(line)) return false
      // Prefer structured stage_context rows — drop ambiguous legacy "Stage:" lines
      if (/^stage:\s*/i.test(line.trim())) return false
      if (stageCtx) {
        if (/^(target stage|current stage|current readiness|relevant experience):/i.test(line.trim())) {
          return false
        }
      }
      return true
    }
  )

  const otherWarnings = (Array.isArray(result.warnings) ? result.warnings : [])
    .filter((w) => isPublicSafeLine(w) && !ADMIN_OR_DEBUG_WARNING_RE.test(w))
    .filter((w) => !RECOGNITION_OR_REVIEW_RE.test(w))
    .filter((w, i, arr) => arr.indexOf(w) === i)

  const warningsHadRecognition = (Array.isArray(result.warnings) ? result.warnings : []).some(
    (w) => RECOGNITION_OR_REVIEW_RE.test(w)
  )
  const shouldShowSoftNote = showRecognitionNote || warningsHadRecognition

  const immediateCopy = matchTypeBucketCopy('best_immediate_route')
  const developingCopy = matchTypeBucketCopy('developing_match')
  const futureCopy = matchTypeBucketCopy('future_career_option')
  const reviewCopy = matchTypeBucketCopy('needs_review_regulated')

  const primaryType =
    publicRecs.available_now[0]?.match_type ||
    publicRecs.realistic_next[0]?.match_type ||
    publicRecs.future_options[0]?.match_type ||
    publicRecs.requirements_needed[0]?.match_type

  const planCatalog = useMemo(() => buildCatalogFromWie(result), [result])

  const headerFacts: string[] = []
  if (result.matched_direction?.field) {
    headerFacts.push(`Field: ${result.matched_direction.field}`)
  }
  if (stageCtx?.stage_meaning === 'target' && stageCtx.target_stage_label) {
    headerFacts.push(`Target stage: ${stageCtx.target_stage_label}`)
    headerFacts.push(`Current readiness: ${stageCtx.estimated_current_readiness}`)
  } else if (stageCtx?.stage_meaning === 'current' && stageCtx.current_stage_label) {
    headerFacts.push(`Current stage: ${stageCtx.current_stage_label}`)
  } else if (stageCtx?.selected_stage_label) {
    headerFacts.push(`Current stage: ${stageCtx.selected_stage_label}`)
  }
  if (stageCtx && typeof stageCtx.years_relevant_experience === 'number') {
    headerFacts.push(`Relevant experience: ${stageCtx.years_relevant_experience} years`)
  }
  for (const line of summaryLines) {
    if (!headerFacts.some((f) => f.toLowerCase() === line.trim().toLowerCase())) {
      headerFacts.push(line)
    }
  }

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/10 to-transparent p-5 sm:p-7">
        <p className="text-xs font-medium uppercase tracking-wider text-cyan-300/90">
          Work in My Education
        </p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
          {matched}
        </h1>
        <p className="mt-2 text-sm text-slate-300">{result.headline?.text}</p>
        <span
          className={cn(
            'mt-4 inline-flex rounded-full px-3 py-1 text-xs font-semibold',
            conf === 'High' && 'bg-emerald-500/20 text-emerald-100',
            conf === 'Medium' && 'bg-sky-500/20 text-sky-100',
            conf === 'Needs clarification' && 'bg-amber-500/20 text-amber-100'
          )}
        >
          Confidence: {conf}
        </span>
        {headerFacts.length > 0 ? (
          <ul className="mt-4 space-y-1.5">
            {headerFacts.map((line) => (
              <li key={line} className="text-sm text-slate-300">
                {line}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-4">
          <AddToMyPlanButton catalog={planCatalog} />
        </div>
      </header>

      {shouldShowSoftNote ? (
        <p className="rounded-xl border border-sky-500/20 bg-sky-950/25 px-4 py-3 text-sm text-sky-100/90">
          {SOFT_RECOGNITION_NOTE}
        </p>
      ) : null}

      {otherWarnings.map((w) => (
        <WarningCard key={w} message={w} />
      ))}

      <section className="space-y-2" aria-label="Suggested next steps">
        <h2 className="text-sm font-semibold text-slate-100">Suggested next steps</h2>
        <AddToMyPlanButton catalog={planCatalog} />
        <StageAwareActions primaryType={primaryType} />
      </section>

      {result.training_recommendations ? (
        <WieTrainingSection
          training={result.training_recommendations}
          field={result.matched_direction?.field}
          specialism={result.matched_direction?.specialism}
        />
      ) : null}

      <RoleBucket
        title={immediateCopy.title}
        description={immediateCopy.description}
        roles={publicRecs.available_now}
        emptyMessage="No strong immediate routes for this stage yet — check developing matches below."
      />
      <RoleBucket
        title={developingCopy.title}
        description={developingCopy.description}
        roles={publicRecs.realistic_next}
        emptyMessage="No developing matches identified yet."
      />
      <RoleBucket
        title={futureCopy.title}
        description={futureCopy.description}
        roles={publicRecs.future_options}
        emptyMessage="No progression routes listed for this selection."
      />
      <RoleBucket
        title={reviewCopy.title}
        description={reviewCopy.description}
        roles={publicRecs.requirements_needed}
        emptyMessage="No regulated or review-only roles in this result."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-between">
        {onStartAgain ? (
          <button
            type="button"
            onClick={onStartAgain}
            className="min-h-11 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5"
          >
            Start again
          </button>
        ) : (
          <Link
            href="/career-engine/work-in-education"
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5"
          >
            Start again
          </Link>
        )}
        <div className="flex flex-col gap-2 sm:flex-row">
          {resultPageHref ? (
            <Link
              href={resultPageHref}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-white/20 px-4 py-2.5 text-sm font-medium text-white hover:bg-white/5"
            >
              Open results page
            </Link>
          ) : null}
          <Link
            href={careerAssistantHref}
            className="inline-flex min-h-11 items-center justify-center rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-500"
          >
            Return to Career Assistant
          </Link>
        </div>
      </div>

      {showDebug ? <DevDebugPanel result={result} roles={allRolesRaw} /> : null}
    </div>
  )
}
