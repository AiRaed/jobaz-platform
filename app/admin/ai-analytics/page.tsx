import {
  ActivityFeed,
  AnalyticsSection,
  AnalyticsStatCard,
  AnalyticsTable,
  FunnelCard,
} from '@/components/jobaz-ai/analytics'
import {
  getAiAnalyticsDashboardData,
  type CareerPathStatRow,
  type DropoffStepStat,
  type ToolStatRow,
} from '@/lib/jobaz-ai/analytics'
import Link from 'next/link'
import { ArrowLeft, BarChart3 } from 'lucide-react'

export const metadata = {
  title: 'AI Analytics | JobAZ Admin',
  description: 'Internal AI Career Path analytics dashboard',
}

export default async function AiAnalyticsPage() {
  const data = await getAiAnalyticsDashboardData()
  const {
    overview,
    profiles,
    careerPaths,
    tools,
    toolClicks,
    audienceSplit,
    readinessByPath,
    funnel,
    dropoff,
    recentEvents,
  } = data

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6 md:p-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="mb-3 inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-200 transition"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Link>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-950/40 px-3 py-1 text-xs font-medium text-purple-300">
              <BarChart3 className="h-3.5 w-3.5" />
              Internal · JobAZ AI
            </div>
            <h1 className="text-3xl font-bold text-white">AI Analytics Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              Career Path Finder memory, funnel, and recommendation metrics. Server-side
              Supabase queries — not exposed to the public app.
            </p>
          </div>
          <p className="text-xs text-gray-600">
            Future: personalization · heatmaps · private AI context
          </p>
        </header>

        <AnalyticsSection
          title="AI Profiles"
          description="Long-term intelligence from ai_user_profiles (readiness, engagement, goals)."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <AnalyticsStatCard
              label="Total profiles"
              value={profiles.totalProfiles}
              hint="Rows in ai_user_profiles"
            />
            <AnalyticsStatCard
              label="Returning profiles"
              value={profiles.returningProfiles}
              hint="assessment_count ≥ 2"
            />
            <AnalyticsStatCard
              label="Avg readiness"
              value={profiles.averageReadinessScore}
              hint="0–100"
            />
            <AnalyticsStatCard
              label="Avg engagement"
              value={profiles.averageEngagementScore}
              hint="0–100"
            />
            <AnalyticsStatCard
              label="Top dominant goal"
              value={profiles.mostCommonDominantGoal}
            />
            <AnalyticsStatCard
              label="Top last path"
              value={profiles.mostCommonLastRecommendedPath}
            />
          </div>
        </AnalyticsSection>

        <AnalyticsSection
          title="Overview"
          description="Assessments saved, funnel completions, and engagement totals."
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <AnalyticsStatCard
              label="Total assessments"
              value={overview.totalAssessments}
              hint="Rows in ai_career_assessments"
            />
            <AnalyticsStatCard
              label="Completed paths"
              value={overview.totalCompletedAssessments}
              hint="ai_path_completed events"
            />
            <AnalyticsStatCard
              label="Signup clicks"
              value={overview.totalSignupClicks}
            />
            <AnalyticsStatCard
              label="Tool clicks"
              value={overview.totalToolClicks}
            />
            <AnalyticsStatCard
              label="Completion rate"
              value={`${overview.completionRatePercent}%`}
              hint="Completed ÷ started"
            />
          </div>
        </AnalyticsSection>

        <AnalyticsSection
          title="Audience & readiness"
          description="Anonymous vs signed-in profiles and average readiness by recommended path."
        >
          <div className="grid gap-4 sm:grid-cols-3 mb-6">
            <AnalyticsStatCard
              label="Anonymous profiles"
              value={audienceSplit.anonymousProfiles}
            />
            <AnalyticsStatCard
              label="Authenticated profiles"
              value={audienceSplit.authenticatedProfiles}
            />
            <AnalyticsStatCard
              label="Anonymous share"
              value={`${audienceSplit.anonymousSharePercent}%`}
            />
          </div>
          <AnalyticsTable
            columns={[
              {
                key: 'path',
                header: 'Recommended path',
                render: (row) => (
                  <span className="font-medium text-white">{row.recommendedPath}</span>
                ),
              },
              {
                key: 'avg',
                header: 'Avg readiness',
                align: 'right',
                render: (row) => `${row.averageReadiness}/100`,
              },
              {
                key: 'profiles',
                header: 'Profiles',
                align: 'right',
                render: (row) => row.profileCount,
              },
            ]}
            rows={readinessByPath}
            getRowKey={(row) => row.recommendedPath}
            emptyMessage="No profile readiness data by path yet."
          />
        </AnalyticsSection>

        <div className="grid gap-6 lg:grid-cols-2">
          <AnalyticsSection
            title="Most clicked tools (funnel)"
            description="Clicks from ai_path_tool_clicked on the results screen."
          >
            <AnalyticsTable
              columns={[
                {
                  key: 'rank',
                  header: '#',
                  align: 'right',
                  render: (row) => row.rank,
                },
                {
                  key: 'name',
                  header: 'Tool',
                  render: (row) => (
                    <span className="font-medium text-white">{row.toolName}</span>
                  ),
                },
                {
                  key: 'count',
                  header: 'Clicks',
                  align: 'right',
                  render: (row) => row.count,
                },
              ]}
              rows={toolClicks}
              getRowKey={(row) => `${row.rank}-${row.toolName}`}
              emptyMessage="No tool clicks recorded yet."
            />
          </AnalyticsSection>

          <AnalyticsSection
            title="Most recommended career paths"
            description="From saved assessment results (recommended_path)."
          >
            <AnalyticsTable<CareerPathStatRow>
              columns={[
                {
                  key: 'path',
                  header: 'Path',
                  render: (row) => (
                    <span className="font-medium text-white">{row.recommendedPath}</span>
                  ),
                },
                {
                  key: 'count',
                  header: 'Count',
                  align: 'right',
                  render: (row) => row.count,
                },
                {
                  key: 'pct',
                  header: '%',
                  align: 'right',
                  render: (row) => `${row.percentage}%`,
                },
              ]}
              rows={careerPaths}
              getRowKey={(row) => row.recommendedPath}
              emptyMessage="No career path recommendations recorded yet."
            />
          </AnalyticsSection>

          <AnalyticsSection
            title="Top recommended tools"
            description="How often each tool appears in assessment recommendations."
          >
            <AnalyticsTable<ToolStatRow>
              columns={[
                {
                  key: 'name',
                  header: 'Tool',
                  render: (row) => (
                    <span className="font-medium text-white">{row.toolName}</span>
                  ),
                },
                {
                  key: 'count',
                  header: 'Count',
                  align: 'right',
                  render: (row) => row.count,
                },
              ]}
              rows={tools}
              getRowKey={(row) => row.toolId}
              emptyMessage="No tool recommendations in assessments yet."
            />
          </AnalyticsSection>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <AnalyticsSection
            title="Funnel analytics"
            description="Key AI Career Path funnel events."
          >
            <FunnelCard steps={funnel} />
          </AnalyticsSection>

          <AnalyticsSection
            title="Step drop-off"
            description="Unique visitors (session or anonymous id) per question step."
          >
            <DropoffBars steps={dropoff} />
          </AnalyticsSection>
        </div>

        <AnalyticsSection
          title="Recent activity"
          description="Latest events from ai_career_events."
        >
          <ActivityFeed events={recentEvents} />
        </AnalyticsSection>
      </div>
    </div>
  )
}

function DropoffBars({ steps }: { steps: DropoffStepStat[] }) {
  const max = Math.max(...steps.map((s) => s.count), 1)
  const hasData = steps.some((s) => s.count > 0)

  if (!hasData) {
    return (
      <p className="rounded-lg border border-dashed border-gray-700 bg-[#141414] px-4 py-8 text-center text-sm text-gray-500">
        No question-answer events yet. Drop-off appears after users answer steps.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {steps.map((step) => {
        const widthPercent = Math.max((step.count / max) * 100, 4)
        return (
          <div key={step.step}>
            <div className="mb-1 flex justify-between text-sm">
              <span className="text-gray-300">{step.label}</span>
              <span className="font-semibold tabular-nums text-white">{step.count}</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-[#141414]">
              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-500/80 to-purple-400/80"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}
