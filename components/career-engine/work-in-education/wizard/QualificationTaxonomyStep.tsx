'use client'

/**
 * Step 1 qualification taxonomy picker — group then contextual sub-type.
 */

import {
  formatUkLevelLabel,
  getQualificationGroup,
  getQualificationType,
  listQualificationGroupOptions,
  listQualificationTypeOptions,
  resolveNormalizedQualification,
} from '@/lib/career-engine/qualification-taxonomy'
import { OptionCard } from './OptionCard'
import { QuestionCard } from './QuestionCard'

export type QualificationTaxonomyAnswers = {
  qualification_group?: string | null
  qualification_type?: string | null
  education_level?: string | null
  equivalence_status?: string | null
  uk_recognition_confirmed?: string | null
  graduation_status?: string | null
  graduation_year?: number | null
}

type Props = {
  answers: QualificationTaxonomyAnswers
  onChange: (patch: Partial<QualificationTaxonomyAnswers>) => void
  gradStatusOptions: { value: string; label: string }[]
}

const EQUIVALENCE_OPTIONS = [
  { value: 'confirmed', label: 'UK equivalence confirmed' },
  { value: 'not_confirmed', label: 'Equivalence not confirmed' },
  { value: 'unsure', label: 'Unsure' },
]

export function QualificationTaxonomyStep({ answers, onChange, gradStatusOptions }: Props) {
  const groupId = answers.qualification_group ?? null
  const typeId = answers.qualification_type ?? null
  const group = getQualificationGroup(groupId)
  const typeOptions = listQualificationTypeOptions(groupId)
  const typeDef = getQualificationType(typeId)

  const preview =
    groupId && typeId
      ? resolveNormalizedQualification({
          qualification_group: groupId,
          qualification_type: typeId,
          education_level: answers.education_level,
          equivalence_status: answers.equivalence_status,
          uk_recognition_confirmed: answers.uk_recognition_confirmed,
        })
      : null

  return (
    <QuestionCard
      title="Your qualification"
      description="What type of qualification do you have? We’ll only show the options that fit."
    >
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-300">
          What type of qualification do you have?
        </legend>
        {listQualificationGroupOptions().map((o) => (
          <OptionCard
            key={o.value}
            name="qualification_group"
            value={o.value}
            label={o.label}
            selected={groupId === o.value}
            onSelect={(v) => {
              const types = listQualificationTypeOptions(v)
              const only = types.length === 1 ? types[0].value : null
              const resolved = resolveNormalizedQualification({
                qualification_group: v,
                qualification_type: only,
              })
              onChange({
                qualification_group: v,
                qualification_type: only,
                education_level: only ? resolved.education_level_legacy : null,
                equivalence_status:
                  v === 'overseas' ? answers.equivalence_status || 'unsure' : null,
                uk_recognition_confirmed:
                  v === 'overseas'
                    ? answers.uk_recognition_confirmed || 'unsure'
                    : answers.uk_recognition_confirmed,
              })
            }}
          />
        ))}
      </fieldset>

      {group && typeOptions.length > 1 ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-300">
            Which best describes it?
          </legend>
          {group.help_text ? (
            <p className="text-xs text-slate-500">{group.help_text}</p>
          ) : null}
          {typeOptions.map((o) => (
            <OptionCard
              key={o.value}
              name="qualification_type"
              value={o.value}
              label={o.label}
              helpText={o.help_text}
              selected={typeId === o.value}
              onSelect={(v) => {
                const resolved = resolveNormalizedQualification({
                  qualification_group: groupId,
                  qualification_type: v,
                  equivalence_status: answers.equivalence_status,
                })
                onChange({
                  qualification_type: v,
                  education_level: resolved.education_level_legacy,
                })
              }}
            />
          ))}
        </fieldset>
      ) : null}

      {group?.asks_overseas_context ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-300">
            Has UK equivalence been confirmed?
          </legend>
          <p className="text-xs text-slate-500">
            Unconfirmed overseas qualifications need review and are not treated as automatically
            UK-equivalent.
          </p>
          {EQUIVALENCE_OPTIONS.map((o) => (
            <OptionCard
              key={o.value}
              name="equivalence_status"
              value={o.value}
              label={o.label}
              selected={answers.equivalence_status === o.value}
              onSelect={(v) =>
                onChange({
                  equivalence_status: v,
                  uk_recognition_confirmed:
                    v === 'confirmed' ? 'yes' : v === 'not_confirmed' ? 'no' : 'unsure',
                })
              }
            />
          ))}
        </fieldset>
      ) : null}

      {preview && typeDef ? (
        <p className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-400">
          Stored as {typeDef.label}
          {preview.uk_level !== 'unknown'
            ? ` · UK ${formatUkLevelLabel(preview.uk_level)}`
            : ' · UK level unknown (not guessed)'}
          {preview.is_integrated_masters ? ' · Integrated Master’s' : ''}
          {preview.not_generic_masters ? ' · Teaching qualification (not a generic Master’s)' : ''}
        </p>
      ) : null}

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium text-slate-300">Graduation status</legend>
        {gradStatusOptions.map((o) => (
          <OptionCard
            key={o.value}
            name="graduation_status"
            value={o.value}
            label={o.label}
            selected={answers.graduation_status === o.value}
            onSelect={(v) => onChange({ graduation_status: v })}
          />
        ))}
      </fieldset>

      {(answers.graduation_status === 'completed' || answers.graduation_status === 'studying') && (
        <div className="space-y-1.5">
          <label htmlFor="grad-year" className="text-sm font-medium text-slate-300">
            {answers.graduation_status === 'studying' ? 'Expected year' : 'Graduation year'}{' '}
            <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id="grad-year"
            type="number"
            min={1950}
            max={2040}
            className="wizard-input"
            value={answers.graduation_year ?? ''}
            onChange={(e) => {
              const raw = e.target.value
              onChange({
                graduation_year: raw === '' ? null : Number(raw),
              })
            }}
          />
        </div>
      )}
    </QuestionCard>
  )
}
