'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { DEFAULT_SITE_BRAIN, type AdminAiPriority, type SiteBrainRules } from '@/lib/admin/ai/types'
import {
  ActionButton,
  EmptyPanel,
  ReportPanel,
  SectionHeader,
  SiteBrainStatusLine,
  StatusBanner,
  type SiteBrainStatusMeta,
} from '../AdminAiShared'

type EditableBrain = {
  mission: string
  userValueProposition: string
  businessModel: string
  coreUserJourney: string
  founderAdminContext: string
  currentLaunchStage: string
  recommendationRules: string
  courseStrategy: string
  affiliateRules: string
  successMetrics: string
  knownRisks: string
  toneOfVoice: string
  mustNotDo: string
  adminPriorities: string
}

type FieldKey = keyof EditableBrain

type FieldDef = {
  key: FieldKey
  label: string
  rows?: number
}

type SectionDef = {
  id: string
  title: string
  fields: FieldDef[]
}

const DEFAULT_SCENARIO =
  'User wants extra income, is interested in security/events, has no UK security experience, can work evenings and weekends.'

const SECTIONS: SectionDef[] = [
  {
    id: 'product',
    title: 'Product',
    fields: [
      { key: 'mission', label: 'Product mission', rows: 4 },
      { key: 'userValueProposition', label: 'User value proposition', rows: 4 },
    ],
  },
  {
    id: 'business',
    title: 'Business',
    fields: [{ key: 'businessModel', label: 'Business model', rows: 4 }],
  },
  {
    id: 'journey',
    title: 'User Journey',
    fields: [{ key: 'coreUserJourney', label: 'Core user journey', rows: 3 }],
  },
  {
    id: 'founder',
    title: 'Founder / Admin Context',
    fields: [
      { key: 'founderAdminContext', label: 'Founder / admin context', rows: 4 },
      { key: 'currentLaunchStage', label: 'Current launch stage', rows: 3 },
    ],
  },
  {
    id: 'ai-rules',
    title: 'AI Rules',
    fields: [
      { key: 'recommendationRules', label: 'Recommendation rules', rows: 6 },
      { key: 'courseStrategy', label: 'Course strategy', rows: 4 },
      { key: 'affiliateRules', label: 'Affiliate strategy', rows: 3 },
      { key: 'toneOfVoice', label: 'Tone of voice', rows: 3 },
      { key: 'mustNotDo', label: 'Must not do', rows: 5 },
    ],
  },
  {
    id: 'launch',
    title: 'Launch Priorities',
    fields: [{ key: 'adminPriorities', label: 'Admin priorities', rows: 6 }],
  },
  {
    id: 'risks',
    title: 'Risks & Success Metrics',
    fields: [
      { key: 'knownRisks', label: 'Known risks', rows: 6 },
      { key: 'successMetrics', label: 'Success metrics', rows: 4 },
    ],
  },
]

function toEditable(brain: SiteBrainRules): EditableBrain {
  return {
    mission: brain.mission,
    userValueProposition: brain.userValueProposition,
    businessModel: brain.businessModel,
    coreUserJourney: brain.coreUserJourney,
    founderAdminContext: brain.founderAdminContext,
    currentLaunchStage: brain.currentLaunchStage,
    recommendationRules: brain.recommendationRules,
    courseStrategy: brain.courseStrategy,
    affiliateRules: brain.affiliateRules,
    successMetrics: brain.successMetrics,
    knownRisks: brain.knownRisks,
    toneOfVoice: brain.toneOfVoice,
    mustNotDo: brain.mustNotDo,
    adminPriorities: brain.adminPriorities,
  }
}

export default function SiteBrainTab() {
  const [draft, setDraft] = useState<EditableBrain>(toEditable({ ...DEFAULT_SITE_BRAIN }))
  const [activeMeta, setActiveMeta] = useState<{ version: number; source: string } | null>(null)
  const [history, setHistory] = useState<SiteBrainRules[]>([])
  const [message, setMessage] = useState<string | undefined>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [showHistory, setShowHistory] = useState(false)

  const [question, setQuestion] = useState('')
  const [scenario, setScenario] = useState(DEFAULT_SCENARIO)
  const [advisorLoading, setAdvisorLoading] = useState(false)
  const [advisorMarkdown, setAdvisorMarkdown] = useState('')
  const [advisorTitle, setAdvisorTitle] = useState('')
  const [advisorPriority, setAdvisorPriority] = useState<AdminAiPriority | null>(null)
  const [advisorReportId, setAdvisorReportId] = useState<string | null>(null)
  const [advisorError, setAdvisorError] = useState<string | null>(null)
  const [advisorSavedBanner, setAdvisorSavedBanner] = useState<string | null>(null)
  const [advisorPersistError, setAdvisorPersistError] = useState<string | null>(null)
  const [advisorSiteBrain, setAdvisorSiteBrain] = useState<SiteBrainStatusMeta | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setToast(null)
    try {
      const res = await fetch('/api/admin/ai/site-brain')
      const data = await res.json()
      if (!data.ok) {
        setToast(data.error || 'Failed to load Site Brain')
        setDraft(toEditable({ ...DEFAULT_SITE_BRAIN }))
        setActiveMeta({ version: 0, source: 'defaults' })
        setHistory([])
        return
      }
      const brain = (data.brain || DEFAULT_SITE_BRAIN) as SiteBrainRules
      setDraft(toEditable(brain))
      setHistory((data.history || []) as SiteBrainRules[])
      setActiveMeta({
        version: Number(brain.version || 0),
        source: data.source === 'database' ? 'database' : 'defaults',
      })
      setMessage(data.message)
    } catch {
      setToast('Failed to load Site Brain')
      setDraft(toEditable({ ...DEFAULT_SITE_BRAIN }))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const save = async () => {
    setSaving(true)
    setToast(null)
    try {
      const res = await fetch('/api/admin/ai/site-brain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(draft),
      })
      const data = await res.json()
      if (!data.ok) {
        setToast(data.error || 'Save failed — check migration and SUPABASE_SERVICE_ROLE_KEY')
        return
      }
      const brain = data.brain as SiteBrainRules
      setDraft(toEditable(brain))
      setActiveMeta({ version: brain.version, source: 'database' })
      setToast(`Saved Site Brain v${brain.version} (active)`)
      setShowHistory(true)
      void load()
    } catch {
      setToast('Save failed')
    } finally {
      setSaving(false)
    }
  }

  const loadVersionIntoEditor = (row: SiteBrainRules) => {
    setDraft(toEditable(row))
    setToast(
      `Loaded v${row.version} into the editor. Click Save Site Brain to create a new active version.`
    )
  }

  const runAdvisor = async (mode: string) => {
    setAdvisorLoading(true)
    setAdvisorError(null)
    setAdvisorSavedBanner(null)
    setAdvisorPersistError(null)
    try {
      const res = await fetch('/api/admin/ai/site-brain-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          question,
          scenario,
        }),
      })
      const data = await res.json()
      if (!data.ok) {
        setAdvisorError(data.error || 'Advisor failed')
        setAdvisorMarkdown('')
        return
      }
      setAdvisorTitle(data.title || 'Site Brain Advisor')
      setAdvisorMarkdown(data.markdown || '')
      setAdvisorPriority(data.priority || 'Medium')
      setAdvisorReportId(data.reportId || null)
      setAdvisorPersistError(data.persistError || null)
      if (data.siteBrain) setAdvisorSiteBrain(data.siteBrain)
      if (data.reportId) {
        setAdvisorSavedBanner('Saved to admin_ai_reports')
      }
    } catch {
      setAdvisorError('Advisor failed')
      setAdvisorMarkdown('')
    } finally {
      setAdvisorLoading(false)
    }
  }

  if (loading) {
    return <p className="text-sm text-slate-500 animate-pulse">Loading Site Brain…</p>
  }

  const sourceLabel = activeMeta
    ? `Source: ${activeMeta.source}${
        activeMeta.version ? ` · active v${activeMeta.version}` : ' · no active row yet'
      }`
    : null

  const wiringNote =
    activeMeta?.source === 'database'
      ? 'Site Brain is saved and active. Admin AI tools load this version for strategic guidance. Career Assistant should only be marked as connected when the code actually loads Site Brain.'
      : 'Using built-in defaults until you save an active Site Brain. Admin AI tools use these fallback defaults until you save.'

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Site Brain"
        purpose="Strategic AI memory for JobAZ. It helps AI tools understand the product, business model, user journey, launch stage, risks and priorities."
        note={sourceLabel}
      />
      <SiteBrainStatusLine
        override={
          advisorSiteBrain ||
          (activeMeta
            ? {
                version: activeMeta.version,
                source: activeMeta.source === 'defaults' ? 'defaults' : 'database',
              }
            : null)
        }
      />

      <div className="rounded-xl border border-violet-500/20 bg-slate-950/40 px-4 py-3 space-y-2">
        <p className="text-sm text-slate-300 leading-relaxed">
          Site Brain is the strategic AI memory of JobAZ. It helps the admin understand, manage and
          improve the platform by remembering the product mission, business model, user journey,
          revenue strategy, current launch stage, risks and development priorities.
        </p>
      </div>

      <p className="text-xs text-amber-200/90 rounded-lg border border-amber-500/25 bg-amber-950/20 px-3 py-2">
        {wiringNote}
      </p>

      {message && message !== wiringNote ? (
        <p className="text-xs text-amber-200/80 rounded-lg border border-amber-500/20 bg-amber-950/15 px-3 py-2">
          {message}
        </p>
      ) : null}

      {/* Site Brain Assistant — near top after warning */}
      <section className="rounded-xl border border-slate-700/60 bg-slate-950/40 px-4 py-4 space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">Site Brain Assistant</h3>
          <p className="text-xs text-slate-400 mt-1">
            Practical product/business/technical advisor for a solo founder. Uses the active Site
            Brain as strategic memory. This is an advisor, not an automatic site controller.
          </p>
          <p className="text-[11px] text-violet-300/80 mt-1">AI suggests; founder decides.</p>
        </div>

        <label className="block text-xs text-slate-400 space-y-1">
          <span>Ask Site Brain</span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            placeholder="Example: What should I improve before launch? Which route should I focus on? What is the biggest business risk now?"
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-600"
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <ActionButton
            disabled={advisorLoading}
            onClick={() => void runAdvisor('ask')}
          >
            {advisorLoading ? 'Thinking…' : 'Ask Site Brain'}
          </ActionButton>
          <ActionButton
            variant="secondary"
            disabled={advisorLoading}
            onClick={() => void runAdvisor('launch_priorities')}
          >
            Suggest Launch Priorities
          </ActionButton>
          <ActionButton
            variant="secondary"
            disabled={advisorLoading}
            onClick={() => void runAdvisor('business_risks')}
          >
            Review Business Risks
          </ActionButton>
          <ActionButton
            variant="secondary"
            disabled={advisorLoading}
            onClick={() => void runAdvisor('dev_tasks')}
          >
            Suggest Next Development Tasks
          </ActionButton>
          <Link
            href="/admin/tasks"
            className="rounded-lg border border-slate-600 px-3 py-2 text-xs font-medium text-slate-200 hover:border-violet-400/50 hover:text-violet-100"
          >
            View Admin Tasks
          </Link>
        </div>

        <div className="rounded-lg border border-slate-800 bg-slate-900/40 px-3 py-3 space-y-2">
          <p className="text-xs font-medium text-slate-300">
            Test User Scenario
          </p>
          <p className="text-[11px] text-slate-500">
            Strategic scenario test using Site Brain rules only. Does not call live Career
            Assistant.
          </p>
          <textarea
            value={scenario}
            onChange={(e) => setScenario(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
          />
          <ActionButton
            variant="secondary"
            disabled={advisorLoading}
            onClick={() => void runAdvisor('user_scenario')}
          >
            Test User Scenario
          </ActionButton>
        </div>

        <StatusBanner message={advisorSavedBanner} tone="emerald" />

        <ReportPanel
          title={advisorTitle}
          markdown={advisorMarkdown}
          priority={advisorPriority}
          reportId={advisorReportId}
          error={advisorError}
          loading={advisorLoading}
          persistError={advisorPersistError}
          enableSaveAsTask
          source="site_brain_advisor"
        />
      </section>

      <div className="space-y-6">
        {SECTIONS.map((section) => (
          <section
            key={section.id}
            className="rounded-xl border border-slate-700/50 bg-slate-950/30 px-4 py-4 space-y-3"
          >
            <h3 className="text-sm font-semibold text-slate-100 border-b border-slate-800 pb-2">
              {section.title}
            </h3>
            {section.fields.map(({ key, label, rows }) => (
              <label key={key} className="block text-xs text-slate-400 space-y-1">
                <span>{label}</span>
                <textarea
                  value={draft[key]}
                  onChange={(e) => setDraft((prev) => ({ ...prev, [key]: e.target.value }))}
                  rows={rows ?? 3}
                  className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100"
                />
              </label>
            ))}
          </section>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <ActionButton onClick={() => void save()} disabled={saving}>
          {saving ? 'Saving…' : 'Save Site Brain'}
        </ActionButton>
        <ActionButton
          variant="secondary"
          onClick={() => {
            setShowHistory((v) => !v)
            if (!showHistory) void load()
          }}
        >
          View Version History
        </ActionButton>
        <ActionButton variant="secondary" onClick={() => void load()} disabled={saving}>
          Reload
        </ActionButton>
      </div>

      <StatusBanner message={toast} tone={toast?.startsWith('Saved') ? 'emerald' : 'amber'} />

      {showHistory && (
        <div className="rounded-xl border border-slate-700/60 overflow-hidden">
          <div className="px-3 py-2 bg-slate-900/80 text-xs font-medium text-slate-400">
            Version history
          </div>
          {history.length === 0 ? (
            <EmptyPanel>
              No saved versions yet. Click Save Site Brain to create version 1.
            </EmptyPanel>
          ) : (
            <ul className="divide-y divide-slate-800">
              {history.map((h) => (
                <li
                  key={h.id || `v${h.version}`}
                  className="px-3 py-2.5 text-xs flex flex-wrap items-center gap-3"
                >
                  <span className="font-semibold text-violet-300">v{h.version}</span>
                  <span className={h.isActive ? 'text-emerald-300' : 'text-slate-500'}>
                    {h.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className="text-slate-500">
                    {h.updatedAt
                      ? new Date(h.updatedAt).toLocaleString()
                      : h.createdAt
                        ? new Date(h.createdAt).toLocaleString()
                        : ''}
                  </span>
                  <button
                    type="button"
                    onClick={() => loadVersionIntoEditor(h)}
                    className="ml-auto text-slate-300 hover:text-violet-200 underline-offset-2 hover:underline"
                  >
                    Load into editor
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
