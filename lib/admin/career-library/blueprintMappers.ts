import type {
  BlueprintQuestion,
  BlueprintQuestionCondition,
  BlueprintQuestionOption,
  BlueprintReportRule,
  ConditionGroup,
  ConditionOperator,
} from '@/lib/career-library/assessment/evaluateBlueprint'

type QuestionRow = {
  id: string
  route_key: string
  question_key: string
  label: string
  help_text: string | null
  answer_type: string
  required: boolean
  sort_order: number
  status: string
  active: boolean
  is_system?: boolean
  configuration: Record<string, unknown> | null
}

type OptionRow = {
  id: string
  question_id: string
  option_key: string
  label: string
  value: string
  sort_order: number
  active: boolean
  metadata: Record<string, unknown> | null
}

type ConditionRow = {
  id: string
  question_id: string
  depends_on_question_key: string
  operator: string
  expected_value: unknown
  active: boolean
}

type ReportRuleRow = {
  id: string
  name: string
  rule_key: string
  route_key: string
  specialism_id: string | null
  stage_id: string | null
  condition_group: ConditionGroup | null
  outcome_type: string
  outcome_key: string
  outcome_payload: Record<string, unknown> | null
  priority: number
  stop_processing: boolean
  status: string
  active: boolean
  is_system?: boolean
  title?: string | null
}

function asStatus(value: string): 'draft' | 'approved' | 'disabled' {
  if (value === 'approved' || value === 'disabled') return value
  return 'draft'
}

export function mapQuestionOptionRow(row: OptionRow): BlueprintQuestionOption {
  return {
    id: row.id,
    optionKey: row.option_key,
    label: row.label,
    value: row.value,
    sortOrder: row.sort_order ?? 0,
    active: Boolean(row.active),
    metadata: row.metadata ?? {},
  }
}

export function mapQuestionConditionRow(row: ConditionRow): BlueprintQuestionCondition {
  return {
    id: row.id,
    dependsOnQuestionKey: row.depends_on_question_key,
    operator: row.operator as ConditionOperator,
    expectedValue: row.expected_value,
    active: Boolean(row.active),
  }
}

export function mapQuestionRow(
  row: QuestionRow,
  options: OptionRow[] = [],
  conditions: ConditionRow[] = []
): BlueprintQuestion {
  return {
    id: row.id,
    routeKey: row.route_key,
    questionKey: row.question_key,
    label: row.label,
    helpText: row.help_text ?? '',
    answerType: (row.answer_type as BlueprintQuestion['answerType']) || 'single_select',
    required: Boolean(row.required),
    sortOrder: row.sort_order ?? 0,
    status: asStatus(row.status),
    active: Boolean(row.active),
    isSystem: Boolean(row.is_system),
    configuration: (row.configuration ?? {}) as BlueprintQuestion['configuration'],
    options: options
      .filter((o) => o.question_id === row.id)
      .map(mapQuestionOptionRow)
      .sort((a, b) => a.sortOrder - b.sortOrder),
    conditions: conditions
      .filter((c) => c.question_id === row.id)
      .map(mapQuestionConditionRow),
  }
}

export function mapReportRuleRow(row: ReportRuleRow): BlueprintReportRule {
  return {
    id: row.id,
    name: row.name || row.title || row.rule_key,
    ruleKey: row.rule_key,
    routeKey: row.route_key,
    specialismId: row.specialism_id,
    stageId: row.stage_id,
    conditionGroup: (row.condition_group ?? { logic: 'and', conditions: [] }) as ConditionGroup,
    outcomeType: row.outcome_type,
    outcomeKey: row.outcome_key,
    outcomePayload: row.outcome_payload ?? {},
    priority: row.priority ?? 100,
    stopProcessing: Boolean(row.stop_processing),
    status: asStatus(row.status),
    active: Boolean(row.active),
    isSystem: Boolean(row.is_system),
  }
}
