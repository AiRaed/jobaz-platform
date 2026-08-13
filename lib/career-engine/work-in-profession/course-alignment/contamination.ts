/**
 * Contamination / route-ownership for Work in My Profession courses.
 * Prevents SIA/Forklift/Care Certificate etc. leaking into unrelated fields.
 */

export type WipContaminationKind =
  | 'sia_security'
  | 'forklift'
  | 'taxi_phv'
  | 'hgv_lgv'
  | 'bus_pcv'
  | 'train_rail'
  | 'food_hygiene'
  | 'care_certificate'
  | 'cscs_construction'
  | 'electrical_licence'

export type WipContaminationRule = {
  kind: WipContaminationKind
  re: RegExp
  allowedFieldRe: RegExp
  label: string
}

export const WIP_CONTAMINATION_RULES: WipContaminationRule[] = [
  {
    kind: 'sia_security',
    re: /\b(sia|door\s*supervisor|security\s*guard|cctv\s*operator|close\s*protection)\b/i,
    allowedFieldRe: /\b(security|facilities)\b/i,
    label: 'SIA / security licence',
  },
  {
    kind: 'forklift',
    re: /\b(forklift|counterbalance|reach\s*truck|flt\b|lift\s*truck)\b/i,
    allowedFieldRe: /\b(warehouse|logistics|manufacturing|engineering)\b/i,
    label: 'Forklift / plant',
  },
  {
    kind: 'taxi_phv',
    re: /\b(taxi|phv|private\s*hire)\b/i,
    allowedFieldRe: /\b(driving|transport)\b/i,
    label: 'Taxi / PHV licence',
  },
  {
    kind: 'hgv_lgv',
    re: /\b(hgv|lgv|class\s*[12]\s*driver|goods\s*vehicle|driver\s*cpc\s*\(goods|adr\b|hiab)\b/i,
    allowedFieldRe: /\b(driving|transport)\b/i,
    label: 'HGV / LGV licence',
  },
  {
    kind: 'bus_pcv',
    re: /\b(pcv|bus\s*driver|coach\s*driver|passenger\s*transport|driver\s*cpc\s*\(passenger)\b/i,
    allowedFieldRe: /\b(driving|transport)\b/i,
    label: 'PCV / bus licence',
  },
  {
    kind: 'train_rail',
    re: /\b(train\s*driver|rail\s*industry|assessment\s*test\s*preparation|safety-critical\s*awareness)\b/i,
    allowedFieldRe: /\b(driving|transport)\b/i,
    label: 'Rail / train driver preparation',
  },
  {
    kind: 'food_hygiene',
    re: /\b(food\s*(hygiene|safety)|allergy\s*awareness)\b/i,
    allowedFieldRe: /\b(hospitality|food|kitchen|chef|retail|cafe|care.?home)\b/i,
    label: 'Food hygiene',
  },
  {
    kind: 'care_certificate',
    re: /\b(care\s*certificate|safeguarding\s*adults|medication\s*handling|moving\s*(&|and)\s*handling)\b/i,
    allowedFieldRe: /\b(care|support|social\s*care|childcare|education\s*support)\b/i,
    label: 'Care training',
  },
  {
    kind: 'cscs_construction',
    re: /\b(cscs|asbestos\s*awareness|working\s*at\s*height)\b/i,
    allowedFieldRe: /\b(construction|electrical|plumbing|heating|trades|skilled)\b/i,
    label: 'Construction site card / H&S',
  },
  {
    kind: 'electrical_licence',
    re: /\b(18th\s*edition|pat\s*testing|ecs\b|electrical\s*safety|fire\s*alarm)\b/i,
    allowedFieldRe: /\b(electrical|technical\s*trades|maintenance)\b/i,
    label: 'Electrical professional training',
  },
]

export function matchWipContamination(
  title: string,
  fieldContext: string
): { rule: WipContaminationRule; allowedForField: boolean } | null {
  for (const rule of WIP_CONTAMINATION_RULES) {
    if (!rule.re.test(title)) continue
    return { rule, allowedForField: rule.allowedFieldRe.test(fieldContext) }
  }
  return null
}

export function isTitleSafeForWorkInProfession(
  title: string,
  fieldName: string,
  specialismName = ''
): boolean {
  const ctx = `${fieldName} ${specialismName}`
  const hit = matchWipContamination(title, ctx)
  if (hit && !hit.allowedForField) return false
  // Creative must never get SIA/forklift/care
  if (/creative|design|graphic|video|animation|beauty|barber|nail/i.test(ctx)) {
    if (/\b(sia|forklift|care\s*certificate|flt\b)\b/i.test(title)) return false
  }
  return true
}
