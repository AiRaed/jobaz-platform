'use client'

import type { BusinessDiscoveryGrowthOutput, BusinessVerdict } from '@/lib/career-brain/businessDiscovery/businessDiscoveryTypes'

type Props = {
  growth: BusinessDiscoveryGrowthOutput
}

function verdictStyles(verdict: BusinessVerdict): string {
  if (verdict === 'Strong Potential') return 'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
  if (verdict === 'Weak Potential') return 'border-rose-500/30 bg-rose-950/20 text-rose-200'
  return 'border-amber-500/30 bg-amber-950/20 text-amber-200'
}

function riskColor(level: string): string {
  if (level === 'Low') return 'text-emerald-300'
  if (level === 'High') return 'text-rose-300'
  return 'text-amber-300'
}

function scoreColor(points: number): string {
  if (points > 0) return 'text-emerald-300'
  if (points < 0) return 'text-rose-300'
  return 'text-slate-400'
}

export default function BusinessDiscoveryResultsPanel({ growth }: Props) {
  const report = growth.finalReport
  const primary = report.mostRealisticModel

  const risks = [
    { label: 'Cash flow risk', item: report.riskAnalysis.cashFlowRisk },
    { label: 'Customer acquisition risk', item: report.riskAnalysis.customerAcquisitionRisk },
    { label: 'Competition risk', item: report.riskAnalysis.competitionRisk },
    { label: 'Regulatory risk', item: report.riskAnalysis.regulatoryRisk },
  ] as const

  return (
    <div className="p-4 rounded-xl border border-amber-500/25 bg-amber-950/10 space-y-5">
      <div>
        <p className="text-[10px] uppercase tracking-wider font-medium text-amber-300">JAZ Business Advisor</p>
        <p className="text-sm text-slate-300 mt-1 leading-relaxed">{growth.summary}</p>
      </div>

      {/* 1. Business Verdict */}
      <div className={`p-4 rounded-lg border ${verdictStyles(report.businessVerdict)}`}>
        <p className="text-[10px] uppercase tracking-wider mb-1 opacity-80">Business verdict</p>
        <p className="text-2xl font-semibold">{report.businessVerdict}</p>
        <p className="text-sm mt-2 leading-relaxed opacity-90">{report.verdictExplanation}</p>
      </div>

      {/* Business idea */}
      <div className="p-3 rounded-lg border border-slate-700/50 bg-slate-900/40">
        <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-1">Your business idea</p>
        <p className="text-lg font-semibold text-slate-100">{report.businessIdeaLabel}</p>
      </div>

      {/* 2–3. Score + breakdown */}
      <div className="p-4 rounded-lg border border-cyan-500/20 bg-cyan-950/10">
        <p className="text-[10px] uppercase tracking-wider text-cyan-300 mb-1">Business potential score</p>
        <p className="text-3xl font-semibold text-slate-100">
          {report.businessPotentialScore}
          <span className="text-lg text-slate-500 font-normal"> / 100</span>
        </p>
        <ul className="mt-3 space-y-1">
          {report.scoreBreakdown.map((item) => (
            <li key={item.label} className="flex justify-between text-sm">
              <span className="text-slate-400">{item.label}</span>
              <span className={`font-medium tabular-nums ${scoreColor(item.points)}`}>
                {item.points >= 0 ? '+' : ''}
                {item.points}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* 4. Why this verdict */}
      <div className="p-4 rounded-lg border border-slate-700/50 bg-slate-900/40">
        <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-2">Why this verdict</p>
        <p className="text-sm text-slate-300 leading-relaxed">{report.whyThisVerdict}</p>
        <p className="text-xs text-slate-500 mt-2">
          Startup difficulty: <span className="text-slate-300">{report.startupDifficulty}</span> —{' '}
          {report.startupDifficultyExplanation}
        </p>
      </div>

      {/* 5–6. Starting model + avoid */}
      <div className="p-4 rounded-lg border border-amber-500/20 bg-amber-950/10">
        <p className="text-[10px] uppercase tracking-wider font-medium text-amber-300/90 mb-2">
          Best starting model
        </p>
        <p className="text-lg font-semibold text-slate-100">{primary.title}</p>
        <p className="text-sm text-slate-400 mt-2 leading-relaxed">{primary.why}</p>
        {report.avoidInitially && (
          <p className="text-sm text-rose-300/90 mt-3">
            <span className="font-medium text-rose-400/90">What to avoid: </span>
            {report.avoidInitially}
          </p>
        )}
      </div>

      {/* Validation path */}
      <div className="p-3 rounded-lg border border-violet-500/20 bg-violet-950/10">
        <p className="text-[10px] uppercase tracking-wider text-violet-300 mb-1">Fastest validation path</p>
        <p className="text-sm text-slate-300 leading-relaxed">{report.fastestValidationPath}</p>
      </div>

      {/* Roadmap */}
      <div className="p-4 rounded-lg border border-violet-500/20 bg-violet-950/10">
        <p className="text-[10px] uppercase tracking-wider font-medium text-violet-300 mb-3">Your progression</p>
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-700/40 bg-slate-900/50 p-3">
            <p className="text-[10px] uppercase text-emerald-400 mb-1">Work now</p>
            <p className="text-sm font-medium text-slate-100">{report.roadmap.workNow}</p>
          </div>
          <div className="rounded-lg border border-slate-700/40 bg-slate-900/50 p-3">
            <p className="text-[10px] uppercase text-amber-400 mb-1">Build next</p>
            <p className="text-sm font-medium text-slate-100">{report.roadmap.buildNext}</p>
          </div>
          <div className="rounded-lg border border-slate-700/40 bg-slate-900/50 p-3">
            <p className="text-[10px] uppercase text-violet-300 mb-1">Long-term goal</p>
            <p className="text-sm font-medium text-slate-100">{report.roadmap.longTermGoal}</p>
          </div>
        </div>
      </div>

      {/* 7. Main risks */}
      <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-950/10">
        <p className="text-[10px] uppercase tracking-wider text-rose-300 mb-2">Main risks</p>
        <ul className="text-sm text-slate-300 space-y-1">
          {report.majorRisks.map((r) => (
            <li key={r} className="flex gap-2">
              <span className="text-rose-400">•</span>
              <span>{r}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* 8–9. UK requirements + costs */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-2">UK requirements</p>
          <ul className="text-sm text-slate-300 space-y-1 list-disc list-inside">
            {report.ukRequirements.map((req) => (
              <li key={req}>{req}</li>
            ))}
          </ul>
        </div>
        <div className="p-3 rounded-lg border border-slate-700/40 bg-slate-900/30">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Estimated startup costs</p>
          <p className="text-sm font-medium text-slate-100">{report.estimatedStartupCost}</p>
          <p className="text-xs text-slate-500 mt-1">First revenue: {report.estimatedTimeToFirstRevenue}</p>
        </div>
      </div>

      {/* Financial + operational */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="p-3 rounded-lg border border-slate-700/40 bg-slate-900/30">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Financial requirements</p>
          <ul className="text-xs text-slate-400 space-y-1">
            {report.financialRequirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <div className="p-3 rounded-lg border border-slate-700/40 bg-slate-900/30">
          <p className="text-[10px] uppercase tracking-wider text-slate-400 mb-2">Operational requirements</p>
          <ul className="text-xs text-slate-400 space-y-1">
            {report.operationalRequirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* 10. Revenue */}
      <div className="p-3 rounded-lg border border-cyan-500/20 bg-cyan-950/10">
        <p className="text-[10px] uppercase tracking-wider text-cyan-300 mb-2">Revenue expectations</p>
        <div className="grid gap-2 text-sm sm:grid-cols-3">
          <div>
            <p className="text-[10px] text-slate-500">First 3 months</p>
            <p className="text-slate-200">{report.revenuePotential.first3Months}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">6–12 months</p>
            <p className="text-slate-200">{report.revenuePotential.months6to12}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-500">Long term</p>
            <p className="text-slate-200">{report.revenuePotential.longerTerm}</p>
          </div>
        </div>
      </div>

      {/* 11. First 30 days */}
      <div>
        <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-2">First 30-day plan</p>
        <ol className="space-y-3">
          {report.first30DaysWeeks.map((week) => (
            <li key={week.week} className="border-l-2 border-amber-500/40 pl-3">
              <p className="text-sm font-medium text-amber-200/90">{week.week}</p>
              <ul className="text-xs text-slate-400 mt-1 space-y-0.5">
                {week.actions.map((action) => (
                  <li key={action}>{action}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>

      {/* 12. First 90 days */}
      <div>
        <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400 mb-2">First 90-day plan</p>
        <ul className="text-sm text-slate-300 space-y-2">
          {report.first90DaysPlan.map((phase) => (
            <li key={phase} className="border-l-2 border-violet-500/30 pl-3 leading-relaxed">
              {phase}
            </li>
          ))}
        </ul>
      </div>

      {/* Risk detail */}
      <div className="p-3 rounded-lg border border-slate-700/40 bg-slate-900/30 space-y-3">
        <p className="text-[10px] uppercase tracking-wider font-medium text-slate-400">Risk analysis</p>
        {risks.map(({ label, item }) => (
          <div key={label} className="border-t border-slate-700/30 pt-2 first:border-0 first:pt-0">
            <div className="flex justify-between gap-2 text-sm mb-1">
              <span className="text-slate-300 font-medium">{label}</span>
              <span className={`font-semibold shrink-0 ${riskColor(item.level)}`}>{item.level}</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">{item.reason}</p>
          </div>
        ))}
      </div>

      {/* 13. Next best action */}
      <div className="p-4 rounded-lg border border-emerald-500/30 bg-emerald-950/20">
        <p className="text-[10px] uppercase tracking-wider font-medium text-emerald-300 mb-2">
          Next best action
        </p>
        <p className="text-sm font-medium text-slate-100 leading-relaxed">{report.bestNextAction}</p>
      </div>
    </div>
  )
}
