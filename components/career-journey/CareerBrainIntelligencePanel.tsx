'use client'

import type { CareerBrainOutput } from '@/lib/career-brain/types'
import { normalizeCareerBrainOutput } from '@/lib/career-brain/normalizeOutput'
import BusinessDiscoveryResultsPanel from './BusinessDiscoveryResultsPanel'
import UkTransitionResultsPanel from './UkTransitionResultsPanel'

type Props = {
  output: CareerBrainOutput | null | undefined
  employabilityScore?: number | null
}

export default function CareerBrainIntelligencePanel({ output, employabilityScore: scoreOverride }: Props) {
  const normalized = normalizeCareerBrainOutput(output)
  if (!normalized) return null

  const {
    employabilityScore: outputScore,
    pathConfidence,
    englishDevelopmentPlan,
    notRecommended,
    rightToWorkGuidance,
    specialPathway,
    dualCareerPaths,
    careerChangeTransition,
    growCareerGrowth,
    businessDiscoveryGrowth,
    ukTransitionGrowth,
  } = normalized

  const employabilityScore =
    typeof scoreOverride === 'number' && scoreOverride > 0 ? scoreOverride : outputScore

  const topScores = pathConfidence.filter((p) => p.track === 'work_now').slice(0, 5)
  const isCareerChange = !!careerChangeTransition
  const isGrowCareer = !!growCareerGrowth
  const isBusinessDiscovery = !!businessDiscoveryGrowth
  const isUkTransition = !!ukTransitionGrowth
  const isDedicatedPath = isCareerChange || isGrowCareer || isBusinessDiscovery || isUkTransition

  return (
    <section className="space-y-4">
      {careerChangeTransition && (
        <div className="p-4 rounded-xl border border-teal-500/25 bg-teal-950/15 space-y-4">
          <p className="text-[10px] uppercase tracking-wider font-medium text-teal-300">
            Career transition plan
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{careerChangeTransition.summary}</p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-950/20">
              <p className="text-[10px] uppercase tracking-wider text-cyan-300 mb-1">Employability score</p>
              <p className="text-2xl font-semibold text-slate-100">{careerChangeTransition.confidenceScore}</p>
              <p className="text-[10px] text-slate-500 mt-1">UK hiring readiness in your target field today</p>
            </div>
            <div className="p-3 rounded-lg border border-teal-500/20 bg-teal-950/25">
              <p className="text-[10px] uppercase tracking-wider text-teal-300 mb-1">Transition readiness</p>
              <p className="text-2xl font-semibold text-slate-100">
                {careerChangeTransition.transitionReadinessScore}
                <span className="text-sm text-slate-500 font-normal"> / 100</span>
              </p>
              <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                {careerChangeTransition.transitionReadinessSummary}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-2 py-1 rounded-full border border-slate-600/50 text-slate-300">
              Difficulty: {careerChangeTransition.transitionDifficulty}
            </span>
            <span className="px-2 py-1 rounded-full border border-slate-600/50 text-slate-300">
              Timeline: {careerChangeTransition.estimatedTimeline}
            </span>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider font-medium text-teal-300/90 mb-2">
              Transferable skills you already have
            </p>
            <p className="text-xs text-slate-500 mb-2">
              From {careerChangeTransition.currentField} — these still matter in{' '}
              {careerChangeTransition.targetField}.
            </p>
            <ul className="flex flex-wrap gap-2">
              {careerChangeTransition.transferableSkills.map((skill) => (
                <li
                  key={skill}
                  className="text-xs px-2 py-1 rounded-full border border-teal-500/30 text-teal-100/90 bg-teal-950/30"
                >
                  {skill}
                </li>
              ))}
            </ul>
          </div>

          {careerChangeTransition.realityCheck && (
            <div className="p-3 rounded-lg border border-amber-500/25 bg-amber-950/15">
              <p className="text-[10px] uppercase tracking-wider font-medium text-amber-300 mb-1">
                Reality check
              </p>
              <p className="text-xs text-amber-100/90 leading-relaxed">{careerChangeTransition.realityCheck}</p>
            </div>
          )}

          {careerChangeTransition.timelinePhases.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-2">
                Estimated transition timeline
              </p>
              <ol className="space-y-2">
                {careerChangeTransition.timelinePhases.map((phase) => (
                  <li
                    key={phase.period}
                    className="text-xs border-l-2 border-teal-500/40 pl-3 text-slate-300"
                  >
                    <span className="text-teal-200/90 font-medium">{phase.period}</span>
                    <span className="text-slate-500"> — </span>
                    <span className="text-slate-200">{phase.label}</span>
                    <p className="text-slate-500 mt-0.5 leading-relaxed">{phase.description}</p>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {careerChangeTransition.buildNextPath.milestones.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-2">
                {careerChangeTransition.buildNextPath.pathLabel}
              </p>
              <p className="text-xs text-slate-500 mb-2">
                Next role target: {careerChangeTransition.buildNextPath.intermediateRole}
              </p>
              <ul className="text-sm text-slate-300 space-y-2">
                {careerChangeTransition.buildNextPath.milestones.map((m) => (
                  <li key={m.title} className="border-l border-cyan-500/30 pl-3">
                    <span className="text-slate-200">{m.title}</span>
                    <span className="text-[10px] uppercase text-slate-500 ml-2">{m.category}</span>
                    <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-xs text-slate-400 leading-relaxed">{careerChangeTransition.fastestRouteSummary}</p>
        </div>
      )}

      {businessDiscoveryGrowth && (
        <BusinessDiscoveryResultsPanel growth={businessDiscoveryGrowth} />
      )}

      {ukTransitionGrowth && <UkTransitionResultsPanel growth={ukTransitionGrowth} />}

      {growCareerGrowth && (
        <div className="p-4 rounded-xl border border-indigo-500/25 bg-indigo-950/15 space-y-4">
          <p className="text-[10px] uppercase tracking-wider font-medium text-indigo-300">
            Career growth assessment
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-950/20">
              <p className="text-[10px] uppercase tracking-wider text-cyan-300 mb-1">Promotion readiness</p>
              <p className="text-2xl font-semibold text-slate-100">
                {growCareerGrowth.promotionReadinessScore}
                <span className="text-sm text-slate-500 font-normal"> / 100</span>
              </p>
              <p className="text-sm text-indigo-200/90 mt-1">{growCareerGrowth.careerProfile}</p>
              <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">
                {growCareerGrowth.promotionReadinessExplanation}
              </p>
              {growCareerGrowth.readinessStrengths?.length > 0 && (
                <div className="mt-3">
                  <p className="text-[10px] uppercase text-emerald-300/90 mb-1">Evidence strengths</p>
                  <ul className="text-[10px] text-slate-400 space-y-0.5">
                    {growCareerGrowth.readinessStrengths.map((s) => (
                      <li key={s}>• {s}</li>
                    ))}
                  </ul>
                </div>
              )}
              {growCareerGrowth.readinessGaps?.length > 0 && (
                <div className="mt-2">
                  <p className="text-[10px] uppercase text-amber-300/90 mb-1">Evidence gaps</p>
                  <ul className="text-[10px] text-slate-400 space-y-0.5">
                    {growCareerGrowth.readinessGaps.map((g) => (
                      <li key={g}>• {g}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="p-3 rounded-lg border border-indigo-500/20 bg-indigo-950/25">
              <p className="text-[10px] uppercase tracking-wider text-indigo-300 mb-1">Employability score</p>
              <p className="text-2xl font-semibold text-slate-100">
                {growCareerGrowth.employabilityScore}
                <span className="text-sm text-slate-500 font-normal"> / 100</span>
              </p>
              <p className="text-sm text-slate-300 mt-1">{growCareerGrowth.growthScoreLabel}</p>
              {growCareerGrowth.careerConfidenceLabel && (
                <p className="text-[10px] text-slate-400 mt-2">
                  Career confidence:{' '}
                  <span className="text-indigo-200">{growCareerGrowth.careerConfidenceLabel}</span>
                  {typeof growCareerGrowth.careerConfidenceScore === 'number'
                    ? ` (${growCareerGrowth.careerConfidenceScore}/100 — answer quality & evidence)`
                    : ''}
                </p>
              )}
            </div>
          </div>

          {growCareerGrowth.recommendedQualification && (
            <div className="p-3 rounded-lg border border-amber-500/25 bg-amber-950/15">
              <p className="text-[10px] uppercase tracking-wider text-amber-300 mb-1">
                Recommended qualification
              </p>
              <p className="text-sm font-medium text-slate-100">
                {growCareerGrowth.recommendedQualification.qualification}
              </p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                {growCareerGrowth.recommendedQualification.reason}
              </p>
            </div>
          )}

          {growCareerGrowth.progressionRoutes && growCareerGrowth.progressionRoutes.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-medium text-violet-300 mb-2">
                Realistic progression routes
              </p>
              <ul className="space-y-3">
                {growCareerGrowth.progressionRoutes.map((route) => (
                  <li
                    key={route.id}
                    className="p-3 rounded-lg border border-violet-500/20 bg-violet-950/10 text-xs"
                  >
                    <p className="font-medium text-slate-100">{route.label}</p>
                    <p className="text-violet-200/80 mt-1">
                      {route.confidence} confidence (~{route.confidencePercent}%)
                    </p>
                    <p className="text-slate-300 mt-1">{route.steps.join(' → ')}</p>
                    <p className="text-slate-500 mt-1 leading-relaxed">{route.summary}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {growCareerGrowth.longTermRequirements && (
            <div className="p-3 rounded-lg border border-slate-600/30 bg-slate-900/40">
              <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">
                Long-term requirements
              </p>
              <p className="text-xs text-slate-400 whitespace-pre-wrap leading-relaxed">
                {growCareerGrowth.longTermRequirements}
              </p>
            </div>
          )}

          <div>
            <p className="text-[10px] uppercase tracking-wider font-medium text-indigo-300/90 mb-2">
              Current position
            </p>
            <p className="text-sm font-medium text-slate-100">{growCareerGrowth.currentJobTitle}</p>
            <p className="text-xs text-slate-500 mt-0.5">{growCareerGrowth.currentLevel}</p>
            <p className="text-sm text-slate-300 mt-2 leading-relaxed">{growCareerGrowth.currentPositionSummary}</p>
          </div>

          <div className="p-3 rounded-lg border border-teal-500/20 bg-teal-950/15">
            <p className="text-[10px] uppercase tracking-wider font-medium text-teal-300 mb-1">
              Most likely next role
            </p>
            <p className="text-sm font-medium text-slate-100">{growCareerGrowth.nextRealisticStep.role}</p>
            <p className="text-xs text-teal-200/80 mt-1">Timeline: {growCareerGrowth.nextRealisticStep.timeline}</p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">{growCareerGrowth.nextRealisticStep.reason}</p>
          </div>

          <div className="p-3 rounded-lg border border-violet-500/20 bg-violet-950/15">
            <p className="text-[10px] uppercase tracking-wider font-medium text-violet-300 mb-1">
              Alternative growth route
            </p>
            <p className="text-sm font-medium text-slate-100">{growCareerGrowth.alternativeGrowthRoute.role}</p>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              {growCareerGrowth.alternativeGrowthRoute.reason}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider font-medium text-amber-300 mb-2">Growth barriers</p>
            <ul className="text-xs text-amber-100/90 space-y-1">
              {growCareerGrowth.growthBarriers.map((b) => (
                <li key={b} className="border-l border-amber-500/40 pl-2">
                  {b}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-2">
              Skills gap analysis
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-emerald-300/90 mb-2">Strengths</p>
                <ul className="flex flex-wrap gap-2">
                  {growCareerGrowth.skillsGap.strengths.map((s) => (
                    <li
                      key={s}
                      className="text-xs px-2 py-1 rounded-full border border-emerald-500/30 text-emerald-100/90 bg-emerald-950/20"
                    >
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Skills to develop</p>
                <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
                  {growCareerGrowth.skillsToDevelop.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {growCareerGrowth.recommendedCertifications.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-2">
                Recommended certifications
              </p>
              <ul className="flex flex-wrap gap-2">
                {growCareerGrowth.recommendedCertifications.map((cert) => (
                  <li
                    key={cert}
                    className="text-xs px-2 py-1 rounded-full border border-slate-600/50 text-slate-300"
                  >
                    {cert}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-2">
              Promotion roadmap
            </p>
            <p className="text-sm text-slate-200">
              {growCareerGrowth.promotionRoadmap.workNow}
              <span className="text-slate-500 mx-2">→</span>
              {growCareerGrowth.promotionRoadmap.buildNext}
              <span className="text-slate-500 mx-2">→</span>
              {growCareerGrowth.promotionRoadmap.longTerm}
            </p>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-2">
              90-day action plan
            </p>
            <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
              {growCareerGrowth.actionPlan90Days.map((item) => (
                <li key={item} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ol>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-2">
              6–12 month growth plan
            </p>
            <ol className="text-sm text-slate-300 space-y-2 list-decimal list-inside">
              {growCareerGrowth.growthPlan6To12Months.map((item) => (
                <li key={item} className="leading-relaxed">
                  {item}
                </li>
              ))}
            </ol>
          </div>

          <div className="p-3 rounded-lg border border-slate-600/40 bg-slate-900/40">
            <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-1">
              Long-term direction (3–5 years)
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">{growCareerGrowth.longTermCareerDirection}</p>
          </div>

          <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-950/15">
            <p className="text-[10px] uppercase tracking-wider font-medium text-emerald-300 mb-1">
              Salary growth potential
            </p>
            <p className="text-xs text-slate-300 leading-relaxed">{growCareerGrowth.salaryGrowthPotential}</p>
          </div>

          {growCareerGrowth.recommendedJobAZActions.length > 0 && (
            <div>
              <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-2">
                JobAZ recommendations
              </p>
              <ul className="flex flex-wrap gap-2">
                {growCareerGrowth.recommendedJobAZActions.map((action) => (
                  <li key={action.label}>
                    {action.href ? (
                      <a
                        href={action.href}
                        className="text-xs px-2 py-1 rounded-full border border-cyan-500/30 text-cyan-100/90 bg-cyan-950/20 hover:bg-cyan-950/40 transition-colors"
                      >
                        {action.label}
                      </a>
                    ) : (
                      <span className="text-xs px-2 py-1 rounded-full border border-slate-600/50 text-slate-300">
                        {action.label}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {rightToWorkGuidance && !isDedicatedPath && (
        <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-950/15">
          <p className="text-[10px] uppercase tracking-wider font-medium text-amber-300 mb-2">
            Right to work
          </p>
          <p className="text-sm text-slate-300 leading-relaxed">{rightToWorkGuidance}</p>
        </div>
      )}

      {employabilityScore > 0 && !isDedicatedPath && (
        <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/15">
          <p className="text-[10px] uppercase tracking-wider font-medium text-cyan-300 mb-1">
            Employability score
          </p>
          <p className="text-3xl font-semibold text-slate-100">{employabilityScore}</p>
          <p className="text-xs text-slate-500 mt-1">Out of 100 — UK hiring readiness today (not qualifications alone)</p>
        </div>
      )}

      {dualCareerPaths && (
        <div className="p-4 rounded-xl border border-indigo-500/25 bg-indigo-950/15 space-y-4">
          <p className="text-[10px] uppercase tracking-wider font-medium text-indigo-300">
            Two separate career paths
          </p>
          <p className="text-xs text-slate-400">
            Your education and experience point to different directions. Each path has its own Work
            Now, Build Next, and Long-Term progression.
          </p>
          {[dualCareerPaths.educationPath, dualCareerPaths.experiencePath].map((path) => (
            <div key={path.label} className="border-t border-slate-700/40 pt-3 first:border-0 first:pt-0">
              <p className="text-sm font-medium text-slate-200 mb-2">{path.label}</p>
              <div className="grid gap-2 text-xs text-slate-400 sm:grid-cols-3">
                <div>
                  <span className="text-slate-500 block mb-1">Work Now</span>
                  {path.workNow.slice(0, 2).map((r) => (
                    <p key={r.title} className="text-slate-300">
                      {r.title}
                    </p>
                  ))}
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Build Next</span>
                  {path.buildNext.slice(0, 2).map((r) => (
                    <p key={r.title} className="text-slate-300">
                      {r.title}
                    </p>
                  ))}
                </div>
                <div>
                  <span className="text-slate-500 block mb-1">Long-Term</span>
                  {path.longTerm.slice(0, 2).map((r) => (
                    <p key={r.title} className="text-slate-300">
                      {r.title}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {topScores.length > 0 && (
        <div className="p-4 rounded-xl border border-slate-700/50 bg-slate-900/40">
          <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-3">
            Path confidence
          </p>
          <ul className="space-y-2">
            {topScores.map((p) => (
              <li key={`${p.track}-${p.title}`} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-slate-200">{p.title}</span>
                <span className="text-emerald-300 font-medium shrink-0">{p.score}%</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {englishDevelopmentPlan && !isDedicatedPath && (
        <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-950/15">
          <p className="text-[10px] uppercase tracking-wider font-medium text-blue-300 mb-2">
            English development plan
          </p>
          <p className="text-xs text-slate-400 mb-2">{englishDevelopmentPlan.currentLevel}</p>
          <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
            {(englishDevelopmentPlan.suggestedActions ?? []).slice(0, 3).map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {notRecommended.length > 0 && !isBusinessDiscovery && (
        <div className="p-4 rounded-xl border border-rose-500/20 bg-rose-950/10">
          <p className="text-[10px] uppercase tracking-wider font-medium text-rose-300 mb-2">
            Why other paths were not selected
          </p>
          <ul className="space-y-2">
            {notRecommended.map((n) => (
              <li key={n.title} className="text-sm">
                <span className="text-slate-200">{n.title}</span>
                <span className="text-slate-500"> — {n.reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {specialPathway && (
        <div className="p-4 rounded-xl border border-violet-500/20 bg-violet-950/15">
          <p className="text-[10px] uppercase tracking-wider font-medium text-violet-300 mb-2">
            {specialPathway.headline}
          </p>
          {specialPathway.notes?.map((note) => (
            <p key={note} className="text-xs text-slate-400 mb-2">
              {note}
            </p>
          ))}
        </div>
      )}
    </section>
  )
}
