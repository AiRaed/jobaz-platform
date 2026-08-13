'use client'

/**
 * Placeholder admin surface for Looking for Extra Income.
 * Public Career Assistant Extra Income flow is active; editing tools are not connected yet.
 */

import { useMemo, useState } from 'react'
import { Wallet } from 'lucide-react'
import {
  listExtraIncomeCategories,
  listExtraIncomeOptions,
} from '@/lib/career-engine/extra-income/library'
import {
  UkCaAdminShell,
  UkCaNote,
  UkCaPanel,
  UkCaStatusBadge,
} from './UkCaAdminShell'

type TabId = 'overview' | 'active_flow' | 'missing_tools' | 'launch_notes'

const TABS: { id: TabId; label: string; ready: boolean }[] = [
  { id: 'overview', label: 'Overview', ready: true },
  { id: 'active_flow', label: 'Active Flow', ready: true },
  { id: 'missing_tools', label: 'Missing Admin Tools', ready: true },
  { id: 'launch_notes', label: 'Launch Notes', ready: true },
]

export default function AdminExtraIncomeLibraryPage() {
  const [tab, setTab] = useState<TabId>('overview')
  const categories = useMemo(() => listExtraIncomeCategories(), [])
  const options = useMemo(() => listExtraIncomeOptions(), [])

  const stats = [
    { label: 'Route types', value: categories.length },
    { label: 'Extra income options', value: options.length },
    { label: 'Active flow', value: 'Yes', hint: 'Public Career Assistant path is live' },
    { label: 'Admin editor', value: 'Coming after launch' },
    { label: 'Routes available', value: 'MVP active', hint: `${options.length} seeded options` },
  ]

  return (
    <UkCaAdminShell
      icon={<Wallet className="h-5 w-5 text-emerald-300" aria-hidden />}
      breadcrumb="Extra Income library"
      title="Extra Income Library"
      description="Side-income and flexible work routes: quick shifts, licence-based work, online/from-home options, short training, supported jobs, and missing provider opportunities."
      notes={
        <UkCaNote>
          Controls the Looking for Extra Income Career Assistant path. Full admin editing tools are
          not connected yet.
        </UkCaNote>
      }
      actions={[
        {
          href: '/career-engine/extra-income',
          label: 'Open Extra Income path',
          primary: true,
        },
      ]}
      stats={stats}
      tabs={TABS}
      activeTab={tab}
      onTabChange={(id) => setTab(id as TabId)}
      headerAside={<UkCaStatusBadge tone="amber">Placeholder</UkCaStatusBadge>}
    >
      {tab === 'overview' ? (
        <UkCaPanel
          title="Library overview"
          description="Seeded route types and options currently used by the Extra Income assistant."
        >
          <div className="grid gap-4 lg:grid-cols-2">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Route types
              </h3>
              <ul className="mt-2 space-y-2">
                {categories.map((c) => (
                  <li
                    key={c.id}
                    className="rounded-xl border border-slate-800/80 bg-slate-950/50 px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-slate-100">{c.label}</p>
                    {c.short_description ? (
                      <p className="mt-1 text-xs text-slate-400">{c.short_description}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Options (sample)
              </h3>
              <ul className="mt-2 space-y-2">
                {options.slice(0, 12).map((o) => (
                  <li
                    key={o.id}
                    className="rounded-xl border border-slate-800/80 bg-slate-950/50 px-3 py-2.5"
                  >
                    <p className="text-sm font-medium text-slate-100">{o.option_title}</p>
                    <p className="mt-0.5 font-mono text-[10px] text-slate-500">{o.category}</p>
                  </li>
                ))}
              </ul>
              {options.length > 12 ? (
                <p className="mt-2 text-[11px] text-slate-500">
                  Showing 12 of {options.length} options.
                </p>
              ) : null}
            </div>
          </div>
        </UkCaPanel>
      ) : null}

      {tab === 'active_flow' ? (
        <UkCaPanel title="Active flow" description="What users see in Career Assistant today.">
          <UkCaNote tone="emerald">
            The Extra Income assistant flow is active: Category → Option → Result. Result layouts vary
            by route type (jobs first, training first, licence first, or online first).
          </UkCaNote>
          <p className="mt-4 text-sm text-slate-400">
            Use <span className="text-slate-200">Open Extra Income test mode</span> above to walk the
            live public path in an admin/dev context.
          </p>
        </UkCaPanel>
      ) : null}

      {tab === 'missing_tools' ? (
        <UkCaPanel
          title="Missing admin tools"
          description="Planned editors after launch — not available yet."
        >
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-slate-300">
            <li>Route Types editor</li>
            <li>Extra Income Options editor</li>
            <li>Short Training mapping UI</li>
            <li>Jobs Supported editor</li>
            <li>Provider Matching / missing affiliate tools</li>
            <li>Preview sandbox with publish controls</li>
          </ul>
        </UkCaPanel>
      ) : null}

      {tab === 'launch_notes' ? (
        <UkCaPanel title="Launch notes">
          <UkCaNote tone="amber">
            The Extra Income assistant flow is active. Full admin editing tools for routes, short
            training, jobs supported, and provider matching will be added after launch.
          </UkCaNote>
        </UkCaPanel>
      ) : null}
    </UkCaAdminShell>
  )
}
