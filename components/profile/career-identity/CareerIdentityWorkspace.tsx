'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Briefcase,
  FileText,
  LayoutDashboard,
  Loader2,
  Pencil,
  Save,
} from 'lucide-react'
import {
  AVAILABILITY_LABELS,
  AVAILABILITY_OPTIONS,
  BARRIER_LABELS,
  BARRIERS,
  CAREER_STATUSES,
  COMMON_LICENCES,
  CURRENT_SITUATIONS,
  EXPERIENCE_LABELS,
  EXPERIENCE_LEVELS,
  GOAL_LABELS,
  INTEREST_CATEGORIES,
  JOB_TYPE_LABELS,
  JOB_TYPES,
  MAIN_GOALS,
  REMOTE_LABELS,
  REMOTE_PREFERENCES,
  SITUATION_LABELS,
  STATUS_LABELS,
  emptyCareerIdentity,
  type UserCareerIdentity,
} from '@/lib/career-identity'
import type { UserEmailPreferences as EmailPrefs } from '@/lib/email-campaigns/types'
import { emptyPrefs } from '@/lib/email-campaigns/preferences'
import IdentityCard, {
  ChipToggle,
  SnapshotTile,
  fieldClass,
  labelClass,
} from './IdentityCard'
import { cn } from '@/lib/utils'

type Props = {
  displayName: string
  email: string | null
  avatarUrl?: string | null
  locationHint?: string | null
  onToast: (t: { variant: 'success' | 'error' | 'default'; title: string; description?: string }) => void
}

function parseTags(raw: string): string[] {
  return raw
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
}

function toggleInList<T extends string>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((x) => x !== item) : [...list, item]
}

export default function CareerIdentityWorkspace({
  displayName,
  email,
  avatarUrl,
  locationHint,
  onToast,
}: Props) {
  const [identity, setIdentity] = useState<UserCareerIdentity | null>(null)
  const [prefs, setPrefs] = useState<EmailPrefs | null>(null)
  const [accountEmail, setAccountEmail] = useState<string | null>(email)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState<string | null>(null)
  const [skillsDraft, setSkillsDraft] = useState('')
  const [industriesDraft, setIndustriesDraft] = useState('')
  const [languagesDraft, setLanguagesDraft] = useState('')
  const [qualificationsDraft, setQualificationsDraft] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [idRes, prefRes] = await Promise.all([
        fetch('/api/career-identity', { cache: 'no-store' }),
        fetch('/api/email-preferences', { cache: 'no-store' }),
      ])
      const idData = await idRes.json()
      const prefData = await prefRes.json()
      if (!idRes.ok) throw new Error(idData.error || 'Could not load identity')
      const next = (idData.identity as UserCareerIdentity) || emptyCareerIdentity('local')
      if (locationHint && !next.preferred_location) next.preferred_location = locationHint
      setIdentity({
        ...emptyCareerIdentity(next.user_id || 'local'),
        ...next,
        mobile_phone: next.mobile_phone ?? null,
        mobile_country_code: next.mobile_country_code ?? null,
        message_reminders_opt_in: next.message_reminders_opt_in === true,
        message_reminders_opted_in_at: next.message_reminders_opted_in_at ?? null,
        message_reminders_opted_out_at: next.message_reminders_opted_out_at ?? null,
        message_consent_source: next.message_consent_source || 'profile',
      })
      setSkillsDraft(next.skills.join(', '))
      setIndustriesDraft(next.industries_experience.join(', '))
      setLanguagesDraft(next.languages.join(', '))
      setQualificationsDraft(next.qualifications.join(', '))
      if (idData.note) setNote(idData.note)
      if (idData.email) setAccountEmail(String(idData.email))
      if (prefRes.ok && prefData.preferences) setPrefs(prefData.preferences as EmailPrefs)
      else if (email || idData.email) setPrefs(emptyPrefs(String(email || idData.email)))
    } catch (err) {
      onToast({
        variant: 'error',
        title: 'Could not load career identity',
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setLoading(false)
    }
  }, [email, locationHint, onToast])

  useEffect(() => {
    void load()
  }, [load])

  const patch = <K extends keyof UserCareerIdentity>(key: K, value: UserCareerIdentity[K]) => {
    setIdentity((prev) => (prev ? { ...prev, [key]: value } : prev))
  }

  const save = async () => {
    if (!identity) return
    setSaving(true)
    const previousOptIn = identity.message_reminders_opt_in === true
    try {
      const payload: UserCareerIdentity = {
        ...identity,
        skills: parseTags(skillsDraft),
        industries_experience: parseTags(industriesDraft),
        languages: parseTags(languagesDraft),
        qualifications: parseTags(qualificationsDraft),
        mobile_phone: identity.mobile_phone?.trim() || null,
        message_reminders_opt_in: identity.message_reminders_opt_in === true,
        message_consent_source: 'profile',
      }
      const res = await fetch('/api/career-identity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Save failed')

      if (prefs) {
        await fetch('/api/email-preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...prefs,
            consent_source: prefs.marketing_consent ? prefs.consent_source || 'career_identity' : null,
          }),
        })
      }

      const saved = data.identity as UserCareerIdentity
      setIdentity(saved)
      setSkillsDraft(saved.skills.join(', '))
      setIndustriesDraft(saved.industries_experience.join(', '))
      setLanguagesDraft(saved.languages.join(', '))
      setQualificationsDraft(saved.qualifications.join(', '))
      setEditing(false)

      const remindersChanged =
        data.message_reminders_changed === 'enabled' ||
        data.message_reminders_changed === 'disabled'
          ? data.message_reminders_changed
          : previousOptIn !== saved.message_reminders_opt_in
            ? saved.message_reminders_opt_in
              ? 'enabled'
              : 'disabled'
            : null

      onToast({
        variant: 'success',
        title: 'Career identity updated',
        description:
          remindersChanged === 'enabled'
            ? 'Reminders enabled for future updates'
            : remindersChanged === 'disabled'
              ? 'Message reminders turned off'
              : undefined,
      })
    } catch (err) {
      onToast({
        variant: 'error',
        title: 'Save failed',
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  const initials = useMemo(() => {
    const base = (displayName || 'JZ').replace('@', '')
    return base
      .split(/[\s_-]+/)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }, [displayName])

  if (loading || !identity) {
    return (
      <div className="flex items-center justify-center py-20 gap-2 text-[var(--jaz-muted)]">
        <Loader2 className="h-5 w-5 animate-spin text-violet-400" />
        Loading career identity…
      </div>
    )
  }

  const statusLabel = identity.career_status
    ? STATUS_LABELS[identity.career_status]
    : 'Exploring'
  const goalLabel = identity.main_goal ? GOAL_LABELS[identity.main_goal] : null
  const situationLabel = identity.current_situation
    ? SITUATION_LABELS[identity.current_situation]
    : null

  return (
    <div className="space-y-4 pb-10 max-w-4xl">
      {/* Hero */}
      <section className="rounded-2xl border border-violet-500/25 bg-[var(--jaz-surface)] dark:bg-slate-950/80 p-4 md:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="shrink-0 h-16 w-16 rounded-full border-2 border-violet-400/50 overflow-hidden bg-slate-900 flex items-center justify-center">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="text-lg font-bold text-violet-200">{initials}</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] uppercase tracking-widest text-violet-600 dark:text-violet-300/80">
              Private to you — used to improve job, course, opportunity and email matching.
            </p>
            <h1 className="text-xl font-bold text-[var(--jaz-text)] dark:text-slate-50 truncate">
              {displayName || 'Career Identity'}
            </h1>
            <p className="text-xs text-[var(--jaz-muted)] dark:text-slate-400 mt-0.5 break-all">
              {accountEmail || email || 'Signed-in account'}
              {(identity.preferred_location || locationHint) &&
                ` · ${identity.preferred_location || locationHint}`}
            </p>
            <span className="inline-flex mt-2 rounded-full border border-cyan-500/35 bg-cyan-500/10 px-2.5 py-0.5 text-[10px] font-semibold text-cyan-800 dark:text-cyan-200">
              {statusLabel}
            </span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => (editing ? void save() : setEditing(true))}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : editing ? (
              <Save className="h-3.5 w-3.5" />
            ) : (
              <Pencil className="h-3.5 w-3.5" />
            )}
            {editing ? 'Save Career Identity' : 'Edit Career Identity'}
          </button>
          {editing && (
            <button
              type="button"
              onClick={() => {
                setEditing(false)
                void load()
              }}
              className="rounded-lg border border-[var(--jaz-border)] px-3 py-2 text-xs font-medium text-[var(--jaz-text)] dark:border-slate-600"
            >
              Cancel
            </button>
          )}
          <Link
            href="/dashboard?tab=plan"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] px-3 py-2 text-xs font-semibold dark:border-slate-700"
          >
            <LayoutDashboard className="h-3.5 w-3.5 text-violet-500" />
            Open My Plan
          </Link>
          <Link
            href="/cv-builder-v2"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] px-3 py-2 text-xs font-semibold dark:border-slate-700"
          >
            <FileText className="h-3.5 w-3.5 text-cyan-500" />
            Open CV Builder
          </Link>
          <Link
            href="/job-finder"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] px-3 py-2 text-xs font-semibold dark:border-slate-700"
          >
            <Briefcase className="h-3.5 w-3.5 text-emerald-500" />
            Find Jobs
          </Link>
          <Link
            href="/career-hub"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] px-3 py-2 text-xs font-semibold dark:border-slate-700"
          >
            <BookOpen className="h-3.5 w-3.5 text-amber-500" />
            Browse Courses
          </Link>
        </div>
      </section>

      {note && (
        <p className="text-xs text-amber-700 dark:text-amber-200/90 px-1">{note}</p>
      )}

      {/* Snapshot */}
      <IdentityCard title="Career Snapshot" subtitle="What JobAZ should optimise for">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <SnapshotTile label="Goal" value={goalLabel} emptyHint="Add your main goal" />
          <SnapshotTile
            label="Current focus"
            value={situationLabel}
            emptyHint="Add your current situation"
          />
          <SnapshotTile
            label="Target role"
            value={identity.target_role}
            emptyHint="Add a target role"
          />
          <SnapshotTile
            label="Preferred route"
            value={identity.preferred_route}
            emptyHint="Add preferred route"
          />
        </div>

        {editing && (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Career status</span>
              <select
                className={fieldClass}
                value={identity.career_status || 'exploring'}
                onChange={(e) => patch('career_status', e.target.value as UserCareerIdentity['career_status'])}
              >
                {CAREER_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass}>Current situation</span>
              <select
                className={fieldClass}
                value={identity.current_situation || ''}
                onChange={(e) =>
                  patch(
                    'current_situation',
                    (e.target.value || null) as UserCareerIdentity['current_situation']
                  )
                }
              >
                <option value="">Select…</option>
                {CURRENT_SITUATIONS.map((s) => (
                  <option key={s} value={s}>
                    {SITUATION_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass}>Main goal</span>
              <select
                className={fieldClass}
                value={identity.main_goal || ''}
                onChange={(e) =>
                  patch('main_goal', (e.target.value || null) as UserCareerIdentity['main_goal'])
                }
              >
                <option value="">Select…</option>
                {MAIN_GOALS.map((g) => (
                  <option key={g} value={g}>
                    {GOAL_LABELS[g]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass}>Target role</span>
              <input
                className={fieldClass}
                value={identity.target_role || ''}
                onChange={(e) => patch('target_role', e.target.value || null)}
                placeholder="e.g. Security Officer"
              />
            </label>
            <label className="sm:col-span-2">
              <span className={labelClass}>Preferred route</span>
              <input
                className={fieldClass}
                value={identity.preferred_route || ''}
                onChange={(e) => patch('preferred_route', e.target.value || null)}
                placeholder="e.g. SIA licence → security roles"
              />
            </label>
          </div>
        )}
      </IdentityCard>

      {/* Work preferences */}
      <IdentityCard
        title="Work Preferences"
        subtitle="Used later for job and opportunity matching"
      >
        {!editing ? (
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <SnapshotTile
              label="Location"
              value={identity.preferred_location}
              emptyHint="Add work preferences"
            />
            <SnapshotTile
              label="Remote"
              value={
                identity.remote_preference
                  ? REMOTE_LABELS[identity.remote_preference]
                  : null
              }
              emptyHint="Add remote preference"
            />
            <SnapshotTile
              label="Job type"
              value={
                identity.job_type.length
                  ? identity.job_type.map((t) => JOB_TYPE_LABELS[t]).join(', ')
                  : null
              }
              emptyHint="Add job types"
            />
            <SnapshotTile
              label="Availability"
              value={
                identity.availability ? AVAILABILITY_LABELS[identity.availability] : null
              }
              emptyHint="Add availability"
            />
            <p className="sm:col-span-2 text-xs text-[var(--jaz-muted)]">
              Licence: {identity.has_driving_licence ? 'Yes' : 'No'} · Car:{' '}
              {identity.has_own_car ? 'Yes' : 'No'} · Willing to train:{' '}
              {identity.willing_to_train ? 'Yes' : 'No'}
              {identity.preferred_salary ? ` · Salary: ${identity.preferred_salary}` : ''}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <label>
              <span className={labelClass}>Preferred location</span>
              <input
                className={fieldClass}
                value={identity.preferred_location || ''}
                onChange={(e) => patch('preferred_location', e.target.value || null)}
                placeholder="e.g. Newcastle"
              />
            </label>
            <label>
              <span className={labelClass}>Remote preference</span>
              <select
                className={fieldClass}
                value={identity.remote_preference || 'any'}
                onChange={(e) =>
                  patch(
                    'remote_preference',
                    e.target.value as UserCareerIdentity['remote_preference']
                  )
                }
              >
                {REMOTE_PREFERENCES.map((r) => (
                  <option key={r} value={r}>
                    {REMOTE_LABELS[r]}
                  </option>
                ))}
              </select>
            </label>
            <div className="sm:col-span-2">
              <p className={labelClass}>Job type</p>
              <div className="flex flex-wrap gap-1.5">
                {JOB_TYPES.map((t) => (
                  <ChipToggle
                    key={t}
                    label={JOB_TYPE_LABELS[t]}
                    active={identity.job_type.includes(t)}
                    onClick={() => patch('job_type', toggleInList(identity.job_type, t))}
                  />
                ))}
              </div>
            </div>
            <label>
              <span className={labelClass}>Availability</span>
              <select
                className={fieldClass}
                value={identity.availability || ''}
                onChange={(e) =>
                  patch(
                    'availability',
                    (e.target.value || null) as UserCareerIdentity['availability']
                  )
                }
              >
                <option value="">Select…</option>
                {AVAILABILITY_OPTIONS.map((a) => (
                  <option key={a} value={a}>
                    {AVAILABILITY_LABELS[a]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass}>Preferred salary (optional)</span>
              <input
                className={fieldClass}
                value={identity.preferred_salary || ''}
                onChange={(e) => patch('preferred_salary', e.target.value || null)}
                placeholder="e.g. £28k+"
              />
            </label>
            <div className="sm:col-span-2 flex flex-wrap gap-3 text-xs">
              {(
                [
                  ['has_driving_licence', 'Driving licence'],
                  ['has_own_car', 'Own car'],
                  ['willing_to_train', 'Willing to train'],
                ] as const
              ).map(([key, label]) => (
                <label key={key} className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(identity[key])}
                    onChange={(e) => patch(key, e.target.checked)}
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}
      </IdentityCard>

      {/* Contact & reminders — private; consent defaults off */}
      <IdentityCard
        title="Contact & reminders"
        subtitle="Optional mobile for future reminders — never shown on your public profile"
      >
        {!editing ? (
          <div className="space-y-2 text-sm">
            <SnapshotTile
              label="Mobile number"
              value={identity.mobile_phone}
              emptyHint="No mobile number saved"
            />
            <p className="text-xs text-[var(--jaz-muted)]">
              Message reminders:{' '}
              <span className="font-medium text-[var(--jaz-text)] dark:text-slate-200">
                {identity.message_reminders_opt_in ? 'On' : 'Off'}
              </span>
            </p>
            <p className="text-[11px] text-[var(--jaz-muted)] leading-relaxed">
              Optional. We may use this later for reminders, course updates, or job opportunity
              alerts. You can turn this off anytime.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <label>
              <span className={labelClass}>Mobile number</span>
              <input
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                className={fieldClass}
                value={identity.mobile_phone || ''}
                onChange={(e) => patch('mobile_phone', e.target.value || null)}
                placeholder="e.g. +44 7700 900123"
              />
            </label>
            <label className="flex items-start gap-3 rounded-lg border border-[var(--jaz-border)] dark:border-slate-800 px-3 py-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={identity.message_reminders_opt_in === true}
                onChange={(e) => patch('message_reminders_opt_in', e.target.checked)}
              />
              <span>
                <span className="block text-[var(--jaz-text)] dark:text-slate-200 font-medium">
                  Send me career reminders and opportunity updates by message
                </span>
                <span className="block text-[11px] text-[var(--jaz-muted)] mt-1 leading-relaxed">
                  Optional. We may use this later for reminders, course updates, or job opportunity
                  alerts. You can turn this off anytime.
                </span>
              </span>
            </label>
          </div>
        )}
      </IdentityCard>

      {/* Skills */}
      <IdentityCard title="Skills, Experience & Qualifications">
        {!editing ? (
          <div className="space-y-3">
            <div>
              <p className={labelClass}>Skills</p>
              {identity.skills.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {identity.skills.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-[var(--jaz-border)] bg-[var(--jaz-surface-soft)] px-2.5 py-1 text-[11px] dark:border-slate-700"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-[var(--jaz-muted)] italic">Add skills</p>
              )}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <SnapshotTile
                label="Experience level"
                value={
                  identity.experience_level
                    ? EXPERIENCE_LABELS[identity.experience_level]
                    : null
                }
                emptyHint="Add experience level"
              />
              <SnapshotTile
                label="Industries"
                value={
                  identity.industries_experience.length
                    ? identity.industries_experience.join(', ')
                    : null
                }
                emptyHint="Add industries"
              />
              <SnapshotTile
                label="Licences"
                value={identity.licences.length ? identity.licences.join(', ') : null}
                emptyHint="Add licences"
              />
              <SnapshotTile
                label="Languages"
                value={identity.languages.length ? identity.languages.join(', ') : null}
                emptyHint="Add languages"
              />
            </div>
            {!identity.education_summary && !identity.qualifications.length && (
              <p className="text-sm text-[var(--jaz-muted)] italic">Add education & qualifications</p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <label>
              <span className={labelClass}>Skills (comma separated)</span>
              <input
                className={fieldClass}
                value={skillsDraft}
                onChange={(e) => setSkillsDraft(e.target.value)}
                placeholder="Customer service, warehouse, Excel…"
              />
            </label>
            <label>
              <span className={labelClass}>Experience level</span>
              <select
                className={fieldClass}
                value={identity.experience_level || ''}
                onChange={(e) =>
                  patch(
                    'experience_level',
                    (e.target.value || null) as UserCareerIdentity['experience_level']
                  )
                }
              >
                <option value="">Select…</option>
                {EXPERIENCE_LEVELS.map((l) => (
                  <option key={l} value={l}>
                    {EXPERIENCE_LABELS[l]}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span className={labelClass}>Industries experience</span>
              <input
                className={fieldClass}
                value={industriesDraft}
                onChange={(e) => setIndustriesDraft(e.target.value)}
                placeholder="Care, Security, Retail…"
              />
            </label>
            <label>
              <span className={labelClass}>Languages</span>
              <input
                className={fieldClass}
                value={languagesDraft}
                onChange={(e) => setLanguagesDraft(e.target.value)}
                placeholder="English, Polish…"
              />
            </label>
            <label>
              <span className={labelClass}>Education summary</span>
              <textarea
                className={cn(fieldClass, 'min-h-[70px]')}
                value={identity.education_summary || ''}
                onChange={(e) => patch('education_summary', e.target.value || null)}
                placeholder="GCSE, NVQ, degree…"
              />
            </label>
            <label>
              <span className={labelClass}>Qualifications</span>
              <input
                className={fieldClass}
                value={qualificationsDraft}
                onChange={(e) => setQualificationsDraft(e.target.value)}
                placeholder="NVQ Level 2, City & Guilds…"
              />
            </label>
            <div>
              <p className={labelClass}>Licences — quick add</p>
              <div className="flex flex-wrap gap-1.5">
                {COMMON_LICENCES.map((lic) => (
                  <ChipToggle
                    key={lic}
                    label={lic}
                    active={identity.licences.includes(lic)}
                    onClick={() => patch('licences', toggleInList(identity.licences, lic))}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </IdentityCard>

      {/* Interests */}
      <IdentityCard
        title="Career Interests / Matching Preferences"
        subtitle="These preferences help JobAZ match you with courses, jobs, opportunities and useful reminders."
      >
        <div className="flex flex-wrap gap-1.5 mb-3">
          {(
            [
              ['interested_in_courses', 'Courses'],
              ['interested_in_jobs', 'Jobs'],
              ['interested_in_local_opportunities', 'Local opportunities'],
              ['interested_in_side_income', 'Side income'],
              ['interested_in_business_ideas', 'Business ideas'],
            ] as const
          ).map(([key, label]) => (
            <ChipToggle
              key={key}
              label={label}
              active={Boolean(identity[key])}
              disabled={!editing}
              onClick={() => editing && patch(key, !identity[key])}
            />
          ))}
        </div>
        <p className={labelClass}>Categories</p>
        <div className="flex flex-wrap gap-1.5">
          {INTEREST_CATEGORIES.map((c) => (
            <ChipToggle
              key={c}
              label={c}
              active={identity.interested_categories.includes(c)}
              disabled={!editing}
              onClick={() =>
                editing &&
                patch(
                  'interested_categories',
                  toggleInList(identity.interested_categories, c)
                )
              }
            />
          ))}
        </div>
        {!editing && identity.interested_categories.length === 0 && (
          <p className="text-sm text-[var(--jaz-muted)] italic mt-2">Add interest categories</p>
        )}
      </IdentityCard>

      {/* Email prefs */}
      <IdentityCard
        title="Email & Notification Preferences"
        subtitle="Opt-in only — marketing stays off unless you turn it on"
        action={
          <Link
            href="/email-preferences"
            className="text-[11px] font-medium text-violet-600 dark:text-violet-300 hover:underline"
          >
            Manage preferences
          </Link>
        }
      >
        {prefs ? (
          <div className="space-y-2">
            {(
              [
                ['plan_reminders', 'Plan reminders'],
                ['job_alerts', 'Job alerts'],
                ['course_alerts', 'Course alerts'],
                ['local_opportunity_alerts', 'Local opportunity alerts'],
                ['career_tips', 'Career tips / Pulse updates'],
                ['marketing_consent', 'Marketing emails'],
              ] as const
            ).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center justify-between gap-3 rounded-lg border border-[var(--jaz-border)] dark:border-slate-800 px-3 py-2 text-sm"
              >
                <span className="text-[var(--jaz-text)] dark:text-slate-200">{label}</span>
                <input
                  type="checkbox"
                  disabled={!editing}
                  checked={Boolean(prefs[key])}
                  onChange={(e) =>
                    setPrefs({
                      ...prefs,
                      [key]: e.target.checked,
                      ...(key === 'marketing_consent' && e.target.checked
                        ? { consent_source: 'career_identity', consented_at: new Date().toISOString() }
                        : {}),
                    })
                  }
                />
              </label>
            ))}
            <p className="text-[11px] text-[var(--jaz-muted)]">
              Marketing is off by default. You can unsubscribe anytime via Manage preferences.
            </p>
          </div>
        ) : (
          <p className="text-sm text-[var(--jaz-muted)]">
            Email preferences unavailable.{' '}
            <Link href="/email-preferences" className="text-violet-600 dark:text-violet-300 underline">
              Open preferences
            </Link>
          </p>
        )}
      </IdentityCard>

      {/* Private notes */}
      <IdentityCard
        title="Private Career Notes"
        subtitle="Private — used only for better recommendations (not shown publicly)"
      >
        {!editing ? (
          <div className="space-y-2 text-sm">
            <SnapshotTile
              label="Short bio"
              value={identity.short_bio}
              emptyHint="Add a short bio"
            />
            <SnapshotTile
              label="What work are you looking for?"
              value={identity.looking_for}
              emptyHint="Describe the work you want"
            />
            <SnapshotTile
              label="Barriers"
              value={
                identity.barriers.length
                  ? identity.barriers.map((b) => BARRIER_LABELS[b]).join(', ')
                  : null
              }
              emptyHint="Add any barriers JobAZ should consider"
            />
          </div>
        ) : (
          <div className="space-y-3">
            <label>
              <span className={labelClass}>Short bio</span>
              <textarea
                className={cn(fieldClass, 'min-h-[70px]')}
                value={identity.short_bio || ''}
                onChange={(e) => patch('short_bio', e.target.value || null)}
              />
            </label>
            <label>
              <span className={labelClass}>What work are you looking for?</span>
              <textarea
                className={cn(fieldClass, 'min-h-[70px]')}
                value={identity.looking_for || ''}
                onChange={(e) => patch('looking_for', e.target.value || null)}
              />
            </label>
            <div>
              <p className={labelClass}>Barriers</p>
              <div className="flex flex-wrap gap-1.5">
                {BARRIERS.map((b) => (
                  <ChipToggle
                    key={b}
                    label={BARRIER_LABELS[b]}
                    active={identity.barriers.includes(b)}
                    onClick={() => patch('barriers', toggleInList(identity.barriers, b))}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </IdentityCard>

      {/* How JobAZ uses this */}
      <IdentityCard title="How JobAZ uses this">
        <ul className="grid gap-1.5 sm:grid-cols-2 text-xs text-[var(--jaz-muted)] dark:text-slate-400">
          <li>• Better job matches</li>
          <li>• Better course recommendations</li>
          <li>• Better CV suggestions</li>
          <li>• Better local opportunity alerts</li>
          <li className="sm:col-span-2">• Better career emails if you opt in</li>
        </ul>
      </IdentityCard>

      {editing && (
        <div className="sticky bottom-3 z-10 flex justify-end">
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-violet-500 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save Career Identity
          </button>
        </div>
      )}
    </div>
  )
}
