'use client'

/**
 * Looking for Extra Income — public result (WIE-aligned chrome).
 */

import { useMemo } from 'react'
import type { PublicExtraIncomeResult } from '@/lib/career-engine/extra-income/library'
import { ExtraIncomeCourseSection } from './ExtraIncomeCourseSection'
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
import { buildCatalogFromExtraIncome } from '@/lib/career-assistant/add-to-my-plan/buildPickCatalog'

type Props = {
  result: PublicExtraIncomeResult
  onStartAgain?: () => void
  careerAssistantHref?: string
}

function JobCards({ titles }: { titles: string[] }) {
  if (!titles.length) return null
  return (
    <div className="grid gap-3">
      {titles.map((title) => (
        <CaRouteCard
          key={title}
          title={title}
          badge={<CaMatchBadge label="Extra income option" tone="sky" />}
          actionHref="/jobs"
          actionLabel="View jobs"
        />
      ))}
    </div>
  )
}

function SearchKeywords({ keywords }: { keywords: string[] }) {
  if (!keywords.length) return null
  return (
    <CaResultSection title="What to search for">
      <p className="text-sm text-slate-300">{keywords.join(' · ')}</p>
    </CaResultSection>
  )
}

function FirstSteps({ steps }: { steps: string[] }) {
  if (!steps.length) return null
  return (
    <CaResultSection title="First steps">
      <ol className="list-decimal space-y-1.5 pl-5 text-sm text-slate-300">
        {steps.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ol>
    </CaResultSection>
  )
}

export function PublicExtraIncomeResultExperience({
  result,
  onStartAgain,
  careerAssistantHref = '/uk-career-assistant',
}: Props) {
  const courseProps = {
    category: result.category_label,
    option: result.option_title,
  }
  const planCatalog = useMemo(() => buildCatalogFromExtraIncome(result), [result])

  const header = (
    <CaResultHeader
      pathLabel="Looking for Extra Income"
      title={result.option_display_title || `${result.option_type_label}: ${result.option_title}`}
      framing={result.result_framing}
      badge={
        result.option_type_label ? (
          <span className="inline-flex rounded-full bg-sky-500/20 px-3 py-1 text-xs font-semibold text-sky-100">
            {result.option_type_label}
          </span>
        ) : null
      }
      facts={[
        { label: 'Category', value: result.category_label },
        { label: 'Time fit', value: result.time_fit },
      ]}
      note={result.short_description}
    >
      {result.headline && result.headline !== result.option_title ? (
        <p className="mt-3 text-xs text-cyan-200/80">{result.headline}</p>
      ) : null}
      <div className="mt-4">
        <AddToMyPlanButton catalog={planCatalog} />
      </div>
    </CaResultHeader>
  )

  const note = result.important_note ? <CaCallout>{result.important_note}</CaCallout> : null
  const footer = (
    <>
      <CaNextWithJobaz
        showCourses={result.show_courses_button}
        leadingAction={<AddToMyPlanButton catalog={planCatalog} primary={false} />}
      />
      <CaResultFooter onStartAgain={onStartAgain} careerAssistantHref={careerAssistantHref} />
    </>
  )

  return (
    <div className="space-y-6">
      {header}
      {note}

      {result.layout === 'jobs_first' ? (
        <>
          <CaResultSection
            title="Jobs/options you can try first"
            count={result.jobs.length}
            emptyMessage="No starter options listed yet."
          >
            {result.jobs.length > 0 ? <JobCards titles={result.jobs} /> : null}
          </CaResultSection>
          <SearchKeywords keywords={result.job_search_keywords} />
          <FirstSteps steps={result.first_steps} />
          <ExtraIncomeCourseSection
            title="Optional boosters"
            description="Only if useful — not required to start."
            cards={result.courses_boosters}
            {...courseProps}
          />
          {footer}
        </>
      ) : null}

      {result.layout === 'training_first' ? (
        <>
          <ExtraIncomeCourseSection
            title="Recommended short training"
            description="Complete this first to strengthen applications."
            cards={result.courses_primary}
            {...courseProps}
          />
          <CaResultSection
            title="Jobs this can support"
            count={result.jobs.length}
            emptyMessage="No supported jobs listed yet."
          >
            {result.jobs.length > 0 ? <JobCards titles={result.jobs} /> : null}
          </CaResultSection>
          <SearchKeywords keywords={result.job_search_keywords} />
          <FirstSteps steps={result.first_steps} />
          {footer}
        </>
      ) : null}

      {result.layout === 'licence_first' ? (
        <>
          <ExtraIncomeCourseSection
            title="Required licence / training"
            description="Complete this before applying to licensed roles."
            cards={result.courses_primary}
            {...courseProps}
          />
          <CaResultSection
            title="Jobs after licence / training"
            count={result.jobs.length}
            emptyMessage="No post-licence jobs listed yet."
          >
            {result.jobs.length > 0 ? <JobCards titles={result.jobs} /> : null}
          </CaResultSection>
          <SearchKeywords keywords={result.job_search_keywords} />
          <FirstSteps steps={result.first_steps} />
          {footer}
        </>
      ) : null}

      {result.layout === 'online_first' ? (
        <>
          <CaResultSection
            title="Online options you can try"
            count={result.jobs.length}
            emptyMessage="No online options listed yet."
          >
            {result.jobs.length > 0 ? <JobCards titles={result.jobs} /> : null}
          </CaResultSection>
          {result.skills_or_portfolio.length > 0 ? (
            <CaResultSection title="Skills or portfolio to prepare">
              <ul className="list-disc space-y-1 pl-5 text-sm text-slate-300">
                {result.skills_or_portfolio.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </CaResultSection>
          ) : null}
          <SearchKeywords keywords={result.job_search_keywords} />
          <FirstSteps steps={result.first_steps} />
          <ExtraIncomeCourseSection
            title="Useful boosters"
            description="Training only if it helps — not required to start exploring."
            cards={result.courses_boosters}
            {...courseProps}
          />
          {footer}
        </>
      ) : null}
    </div>
  )
}
