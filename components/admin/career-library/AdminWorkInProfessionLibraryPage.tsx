'use client'

/**
 * Admin browse for the shared Profession & Start New Career library.
 * One library; different Career Assistant result priority per path.
 */

import { useMemo, useState } from 'react'
import { Briefcase } from 'lucide-react'
import {
  getProfessionLibraryCounts,
  listProfessionFields,
  listProfessionalLevels,
  listRoles,
  listSpecialismsForField,
  loadProfessionKnowledge,
  type ProfessionalLevelKey,
} from '@/lib/career-engine/work-in-profession'
import {
  UkCaAdminShell,
  UkCaFilterRow,
  UkCaNote,
  UkCaPanel,
  UkCaSelect,
  UkCaStatusBadge,
  UkCaTable,
  UkCaTableHead,
} from './UkCaAdminShell'

type TabId =
  | 'profession_fields'
  | 'specialisms'
  | 'practical_levels'
  | 'uk_target_roles'
  | 'licences_checks'
  | 'training_links'
  | 'preview'

const TABS: { id: TabId; label: string; ready: boolean }[] = [
  { id: 'profession_fields', label: 'Profession Fields', ready: true },
  { id: 'specialisms', label: 'Specialisms', ready: true },
  { id: 'practical_levels', label: 'Practical Levels', ready: true },
  { id: 'uk_target_roles', label: 'UK Target Roles', ready: true },
  { id: 'licences_checks', label: 'Licences & Checks', ready: true },
  { id: 'training_links', label: 'Training Links', ready: false },
  { id: 'preview', label: 'Preview', ready: false },
]

export default function AdminWorkInProfessionLibraryPage() {
  const counts = useMemo(() => getProfessionLibraryCounts(), [])
  const fields = useMemo(() => listProfessionFields(), [])
  const levels = useMemo(() => listProfessionalLevels(), [])
  const allSpecialisms = useMemo(() => loadProfessionKnowledge().specialisms, [])

  const [tab, setTab] = useState<TabId>('uk_target_roles')
  const [fieldSlug, setFieldSlug] = useState('all')
  const [specialismSlug, setSpecialismSlug] = useState('all')
  const [levelKey, setLevelKey] = useState<'all' | ProfessionalLevelKey>('all')

  const specialisms = useMemo(() => {
    if (fieldSlug === 'all') return []
    return listSpecialismsForField(fieldSlug)
  }, [fieldSlug])

  const roles = useMemo(() => {
    return listRoles({
      field_slug: fieldSlug === 'all' ? undefined : fieldSlug,
      specialism_slug: specialismSlug === 'all' ? undefined : specialismSlug,
      professional_level: levelKey === 'all' ? undefined : levelKey,
    })
  }, [fieldSlug, specialismSlug, levelKey])

  const licenceRoles = useMemo(
    () => roles.filter((r) => Boolean(r.licence_or_check_required?.trim())),
    [roles]
  )

  const stats = [
    { label: 'Profession fields', value: counts.fields },
    { label: 'Specialisms', value: counts.specialisms },
    { label: 'Practical levels', value: counts.levels },
    { label: 'UK target roles', value: counts.role_targets },
    {
      label: 'Library status',
      value: counts.status,
      hint:
        counts.duplicates_removed > 0
          ? `${counts.duplicates_removed} duplicates merged from ${counts.raw_roles} raw rows`
          : 'No duplicate rows found',
    },
  ]

  const roleFilters = (
    <UkCaFilterRow>
      <UkCaSelect
        value={fieldSlug}
        onChange={(e) => {
          setFieldSlug(e.target.value)
          setSpecialismSlug('all')
        }}
        aria-label="Filter by profession field"
      >
        <option value="all">All profession fields</option>
        {fields.map((f) => (
          <option key={f.id} value={f.slug}>
            {f.name}
          </option>
        ))}
      </UkCaSelect>
      <UkCaSelect
        value={specialismSlug}
        onChange={(e) => setSpecialismSlug(e.target.value)}
        aria-label="Filter by specialism"
        disabled={fieldSlug === 'all'}
      >
        <option value="all">
          {fieldSlug === 'all' ? 'Select a field first' : 'All specialisms'}
        </option>
        {specialisms.map((s) => (
          <option key={s.id} value={s.slug}>
            {s.name}
          </option>
        ))}
      </UkCaSelect>
      <UkCaSelect
        value={levelKey}
        onChange={(e) => setLevelKey(e.target.value as typeof levelKey)}
        aria-label="Filter by professional level"
      >
        <option value="all">All practical levels</option>
        {levels.map((l) => (
          <option key={l.key} value={l.key}>
            {l.label}
          </option>
        ))}
      </UkCaSelect>
    </UkCaFilterRow>
  )

  return (
    <UkCaAdminShell
      icon={<Briefcase className="h-5 w-5 text-cyan-300" aria-hidden />}
      breadcrumb="Profession library"
      title="Profession & Start New Career Library"
      description="Shared practical profession library used by both Work in My Profession and Start a New Career. Work in My Profession prioritises realistic UK roles/jobs from the user’s current or previous work. Start a New Career uses the same library but prioritises courses, licences, checks, and first steps before jobs."
      notes={
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            <UkCaNote tone="sky">
              Work in My Profession output priority: roles/jobs first, then training.
            </UkCaNote>
            <UkCaNote tone="violet">
              Start a New Career output priority: training/licences/first steps first, then jobs.
            </UkCaNote>
            <UkCaNote tone="emerald">One shared library. Different result priority.</UkCaNote>
          </div>
        </>
      }
      actions={[
        {
          href: '/career-engine/work-in-profession',
          label: 'Open Work in My Profession test mode',
          primary: true,
        },
        {
          href: '/career-engine/start-new-career',
          label: 'Open Start a New Career test mode',
        },
      ]}
      stats={stats}
      tabs={TABS}
      activeTab={tab}
      onTabChange={(id) => setTab(id as TabId)}
      headerAside={<UkCaStatusBadge tone="amber">Draft / internal</UkCaStatusBadge>}
    >
      {tab === 'profession_fields' ? (
        <UkCaPanel
          title="Profession fields"
          description="Practical industry fields used by Work in My Profession and Start a New Career."
        >
          <ul className="grid gap-2 sm:grid-cols-2">
            {fields.map((f) => (
              <li
                key={f.id}
                className="rounded-xl border border-slate-800/80 bg-slate-950/50 px-3 py-2.5"
              >
                <p className="text-sm font-medium text-slate-100">{f.name}</p>
                <p className="mt-0.5 font-mono text-[10px] text-slate-500">{f.slug}</p>
                {f.description ? (
                  <p className="mt-1 text-xs text-slate-400">{f.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </UkCaPanel>
      ) : null}

      {tab === 'specialisms' ? (
        <UkCaPanel
          title="Specialisms"
          description="Trade or profession specialisms nested under each field."
        >
          {roleFilters}
          <ul className="grid gap-2 sm:grid-cols-2">
            {(fieldSlug === 'all' ? allSpecialisms : specialisms).map((s) => (
              <li
                key={s.id}
                className="rounded-xl border border-slate-800/80 bg-slate-950/50 px-3 py-2.5"
              >
                <p className="text-sm font-medium text-slate-100">{s.name}</p>
                <p className="mt-0.5 font-mono text-[10px] text-slate-500">{s.slug}</p>
              </li>
            ))}
          </ul>
        </UkCaPanel>
      ) : null}

      {tab === 'practical_levels' ? (
        <UkCaPanel
          title="Practical levels"
          description="Experience / readiness levels used when matching UK target roles."
        >
          <ul className="grid gap-2 sm:grid-cols-2">
            {levels.map((l) => (
              <li
                key={l.key}
                className="rounded-xl border border-slate-800/80 bg-slate-950/50 px-3 py-2.5"
              >
                <p className="text-sm font-medium text-slate-100">{l.label}</p>
                <p className="mt-0.5 font-mono text-[10px] text-slate-500">{l.key}</p>
              </li>
            ))}
          </ul>
        </UkCaPanel>
      ) : null}

      {tab === 'uk_target_roles' ? (
        <UkCaPanel
          title="UK target roles"
          description={`Showing ${roles.length} roles · status ${counts.status}${
            fieldSlug !== 'all' || specialismSlug !== 'all' || levelKey !== 'all'
              ? ' · filters active'
              : ''
          }`}
        >
          {roleFilters}
          <UkCaTable>
            <UkCaTableHead>
              <tr>
                <th className="px-3 py-2 font-medium">Profession Field</th>
                <th className="px-3 py-2 font-medium">Specialism</th>
                <th className="px-3 py-2 font-medium">Practical Level</th>
                <th className="px-3 py-2 font-medium text-cyan-300/90">UK Target Role</th>
                <th className="px-3 py-2 font-medium">Start Now?</th>
                <th className="px-3 py-2 font-medium">Licence / Check</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </UkCaTableHead>
            <tbody>
              {roles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-slate-500">
                    No UK target roles for this filter.
                  </td>
                </tr>
              ) : (
                roles.slice(0, 250).map((role) => {
                  const field = fields.find((f) => f.id === role.profession_field_id)
                  const spec = allSpecialisms.find((s) => s.id === role.specialism_id)
                  const level = levels.find((l) => l.key === role.professional_level)
                  return (
                    <tr key={role.id} className="border-b border-slate-800/70 text-slate-300">
                      <td className="px-3 py-2">{field?.name ?? '—'}</td>
                      <td className="px-3 py-2">{spec?.name ?? '—'}</td>
                      <td className="px-3 py-2">{level?.label ?? role.professional_level}</td>
                      <td className="px-3 py-2 font-semibold text-slate-50">
                        {role.role_title?.trim() || '—'}
                      </td>
                      <td className="px-3 py-2">{role.realistic_start_now ? 'Yes' : 'No'}</td>
                      <td className="px-3 py-2 text-slate-400">
                        {role.licence_or_check_required || '—'}
                      </td>
                      <td className="px-3 py-2">
                        <UkCaStatusBadge>{role.status}</UkCaStatusBadge>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </UkCaTable>
          {roles.length > 250 ? (
            <p className="mt-3 text-[11px] text-slate-500">
              Showing first 250 of {roles.length} UK target roles — narrow filters to browse further.
            </p>
          ) : null}
        </UkCaPanel>
      ) : null}

      {tab === 'licences_checks' ? (
        <UkCaPanel
          title="Licences & checks"
          description={`${licenceRoles.length} roles in the current filter mention a licence or check.`}
        >
          {roleFilters}
          <ul className="space-y-2">
            {licenceRoles.slice(0, 100).map((role) => (
              <li
                key={role.id}
                className="rounded-xl border border-slate-800/80 bg-slate-950/50 px-3 py-2.5"
              >
                <p className="text-sm font-medium text-slate-100">{role.role_title}</p>
                <p className="mt-1 text-xs text-amber-100/90">{role.licence_or_check_required}</p>
              </li>
            ))}
            {licenceRoles.length === 0 ? (
              <p className="text-sm text-slate-500">No licence/check notes for this filter.</p>
            ) : null}
          </ul>
        </UkCaPanel>
      ) : null}

      {tab === 'training_links' ? (
        <UkCaPanel title="Training links" description="Dedicated training editor coming later.">
          <UkCaNote tone="amber">
            Training recommendations for Profession and Start a New Career are resolved at result time
            from Course Opportunities / gap catalogues. A dedicated admin training-link editor will be
            added after launch — this tab does not edit public matching.
          </UkCaNote>
        </UkCaPanel>
      ) : null}

      {tab === 'preview' ? (
        <UkCaPanel title="Preview" description="Public path previews">
          <p className="text-sm text-slate-400">
            Use the test mode buttons above to open Work in My Profession or Start a New Career in
            Career Assistant. Result priority differs by path; the library data is shared.
          </p>
        </UkCaPanel>
      ) : null}
    </UkCaAdminShell>
  )
}
