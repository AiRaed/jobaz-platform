'use client'

import type { WorkInEducationAssessmentAnswers } from '@/lib/career-engine/work-in-education'
import { registrationContext } from '@/lib/career-engine/work-in-education/wizard'
import { OptionCard } from './OptionCard'
import { QuestionCard } from './QuestionCard'

type Props = {
  answers: WorkInEducationAssessmentAnswers
  onChange: (next: WorkInEducationAssessmentAnswers) => void
}

const YES_NO_UNSURE = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'unsure', label: 'Unsure' },
]

const REG_STATUS = [
  { value: 'registered', label: 'Registered / active' },
  { value: 'pending', label: 'Pending / in progress' },
  { value: 'expired', label: 'Expired' },
  { value: 'none', label: 'None' },
]

const NURSING_SCOPE = [
  { value: 'adult_nursing', label: 'Adult nursing' },
  { value: 'mental_health_nursing', label: 'Mental health nursing' },
  { value: 'childrens_nursing', label: 'Children’s nursing' },
  { value: 'learning_disability_nursing', label: 'Learning disability nursing' },
  { value: 'midwifery', label: 'Midwifery' },
  { value: 'nursing_associate', label: 'Nursing associate' },
  { value: 'unknown', label: 'Not sure' },
]

const ENG_REG = [
  { value: 'ceng', label: 'CEng' },
  { value: 'ieng', label: 'IEng' },
  { value: 'engtech', label: 'EngTech' },
  { value: 'none', label: 'None' },
  { value: 'unknown', label: 'Unknown' },
]

const QTS = [
  { value: 'yes', label: 'Yes — I hold QTS' },
  { value: 'no', label: 'No' },
  { value: 'working_towards', label: 'Working towards QTS' },
  { value: 'unknown', label: 'Unsure' },
]

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: string }) {
  return (
    <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-300">
      {children}
    </label>
  )
}

export function RegistrationStep({ answers, onChange }: Props) {
  const ctx = registrationContext(answers)
  const reg = answers.registration ?? {}

  const setReg = (patch: Partial<NonNullable<WorkInEducationAssessmentAnswers['registration']>>) => {
    onChange({
      ...answers,
      registration: { ...reg, ...patch },
    })
  }

  const title = ctx.nursing
    ? 'Nursing registration'
    : ctx.medicine
      ? 'Medical registration'
      : ctx.teaching
        ? 'Teaching registration'
        : ctx.engineering
          ? 'Engineering registration'
          : 'Professional registration'

  const description = ctx.nursing
    ? 'Tell us about your NMC registration and branch.'
    : ctx.medicine
      ? 'Tell us about GMC registration if you have it.'
      : ctx.teaching
        ? 'Tell us about QTS if it applies.'
        : ctx.engineering
          ? 'Optional professional registration (CEng, IEng, EngTech).'
          : 'Share any professional registration that applies to your pathway.'

  return (
    <QuestionCard title={title} description={description}>
      {(ctx.nursing || ctx.medicine) && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-300">
            {ctx.medicine
              ? 'Do you hold GMC (or equivalent) registration?'
              : 'Do you hold NMC registration?'}
          </legend>
          {YES_NO_UNSURE.map((o) => (
            <OptionCard
              key={o.value}
              name="has_registration"
              value={o.value}
              label={o.label}
              selected={String(reg.has_registration ?? '') === o.value}
              onSelect={(v) => {
                const body =
                  v === 'yes'
                    ? reg.body || (ctx.medicine ? 'GMC' : 'NMC')
                    : reg.body
                setReg({ has_registration: v, body: body ?? null })
              }}
            />
          ))}
        </fieldset>
      )}

      {reg.has_registration === 'yes' && (ctx.nursing || ctx.medicine) && (
        <>
          <div className="space-y-1.5">
            <FieldLabel htmlFor="reg-body">Registration body</FieldLabel>
            <input
              id="reg-body"
              className="wizard-input"
              value={reg.body ?? ''}
              onChange={(e) => setReg({ body: e.target.value })}
              placeholder={ctx.medicine ? 'GMC' : 'NMC'}
              autoComplete="off"
            />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-slate-300">Registration status</legend>
            {REG_STATUS.map((o) => (
              <OptionCard
                key={o.value}
                name="reg_status"
                value={o.value}
                label={o.label}
                selected={String(reg.status ?? '') === o.value}
                onSelect={(v) => setReg({ status: v })}
              />
            ))}
          </fieldset>
        </>
      )}

      {ctx.nursing && reg.has_registration === 'yes' && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-300">
            Which nursing branch / part?
          </legend>
          {NURSING_SCOPE.map((o) => (
            <OptionCard
              key={o.value}
              name="nursing_scope"
              value={o.value}
              label={o.label}
              selected={String(reg.scope ?? '') === o.value}
              onSelect={(v) => setReg({ scope: v })}
            />
          ))}
        </fieldset>
      )}

      {ctx.engineering && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-300">
            Engineering professional registration (optional)
          </legend>
          {ENG_REG.map((o) => (
            <OptionCard
              key={o.value}
              name="eng_reg"
              value={o.value}
              label={o.label}
              selected={String(answers.engineering_registration ?? '') === o.value}
              onSelect={(v) => onChange({ ...answers, engineering_registration: v })}
            />
          ))}
        </fieldset>
      )}

      {ctx.teaching && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-300">
            Do you hold QTS (Qualified Teacher Status)?
          </legend>
          {QTS.map((o) => (
            <OptionCard
              key={o.value}
              name="qts"
              value={o.value}
              label={o.label}
              selected={String(answers.qts_status ?? '') === o.value}
              onSelect={(v) => onChange({ ...answers, qts_status: v })}
            />
          ))}
        </fieldset>
      )}

      {ctx.overseas && (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-slate-300">
            Has UK recognition of this overseas qualification been confirmed?
          </legend>
          {YES_NO_UNSURE.map((o) => (
            <OptionCard
              key={o.value}
              name="uk_recognition"
              value={o.value}
              label={o.label}
              selected={String(answers.uk_recognition_confirmed ?? '') === o.value}
              onSelect={(v) => onChange({ ...answers, uk_recognition_confirmed: v })}
            />
          ))}
        </fieldset>
      )}
    </QuestionCard>
  )
}
