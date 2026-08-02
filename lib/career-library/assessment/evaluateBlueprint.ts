/**
 * Deterministic Career Knowledge Library assessment / report-rule evaluator.
 * No AI. No career knowledge. No prose generation.
 */

export type BlueprintAnswerValue = string | string[] | boolean | number | null

export type BlueprintAnswers = Record<string, BlueprintAnswerValue>

export type ConditionOperator = 'equals' | 'not_equals' | 'in' | 'not_in' | 'contains'

export type BlueprintCondition = {
  question_key: string
  operator: ConditionOperator
  expected_value: unknown
}

export type ConditionGroup = {
  logic?: 'and' | 'or'
  conditions?: BlueprintCondition[]
}

export type OptionSourceType =
  | 'career_fields'
  | 'specialisms_by_field'
  | 'stages_by_specialism'
  | 'static'
  | 'learning_options_by_specialism'

export type QuestionOptionSource = {
  type: OptionSourceType
  filter_answer_key?: string
}

export type BlueprintQuestionOption = {
  id: string
  optionKey: string
  label: string
  value: string
  sortOrder: number
  active: boolean
  metadata?: Record<string, unknown>
}

export type BlueprintQuestionCondition = {
  id: string
  dependsOnQuestionKey: string
  operator: ConditionOperator
  expectedValue: unknown
  active: boolean
}

export type BlueprintQuestion = {
  id: string
  routeKey: string
  questionKey: string
  label: string
  helpText: string
  answerType: 'single_select' | 'multi_select' | 'boolean' | 'text' | 'number'
  required: boolean
  sortOrder: number
  status: 'draft' | 'approved' | 'disabled'
  active: boolean
  isSystem: boolean
  configuration: {
    option_source?: QuestionOptionSource
    [key: string]: unknown
  }
  options: BlueprintQuestionOption[]
  conditions: BlueprintQuestionCondition[]
}

export type ReportRuleOutcomeType =
  | 'load_stage_roles'
  | 'add_recognition_section'
  | 'add_english_section'
  | 'no_english_section'
  | 'enable_english_question'
  | 'exclude_learning_option'
  | 'recommend_learning_category'
  | 'add_report_note'
  | 'reorder_roles'
  | 'skip_english_question'

export type BlueprintReportRule = {
  id: string
  name: string
  ruleKey: string
  routeKey: string
  specialismId: string | null
  stageId: string | null
  conditionGroup: ConditionGroup
  outcomeType: ReportRuleOutcomeType | string
  outcomeKey: string
  outcomePayload: Record<string, unknown>
  priority: number
  stopProcessing: boolean
  status: 'draft' | 'approved' | 'disabled'
  active: boolean
  isSystem: boolean
}

export type BlueprintEvaluationInput = {
  route_key: string
  answers: BlueprintAnswers
}

export type BlueprintOutcome = {
  type: string
  key: string
  payload?: Record<string, unknown>
  ruleKey?: string
  priority?: number
}

export type BlueprintEvaluationResult = {
  route_key: string
  visible_question_keys: string[]
  skipped_question_keys: string[]
  visible_questions: Array<{
    question_key: string
    label: string
    reason: string
  }>
  skipped_questions: Array<{
    question_key: string
    label: string
    reason: string
  }>
  outcomes: BlueprintOutcome[]
  errors: string[]
}

function asArray(value: unknown): unknown[] {
  if (Array.isArray(value)) return value
  if (value == null) return []
  return [value]
}

function normalizeComparable(value: unknown): string {
  if (typeof value === 'boolean') return value ? 'true' : 'false'
  if (typeof value === 'number') return String(value)
  if (value == null) return ''
  return String(value)
}

export function evaluateCondition(
  answer: BlueprintAnswerValue | undefined,
  operator: ConditionOperator,
  expected: unknown
): boolean {
  const answerValues = asArray(answer).map(normalizeComparable)
  const expectedValues = asArray(expected).map(normalizeComparable)

  switch (operator) {
    case 'equals':
      return answerValues.length > 0 && answerValues.some((v) => v === expectedValues[0])
    case 'not_equals':
      return answerValues.every((v) => v !== expectedValues[0])
    case 'in':
      return answerValues.some((v) => expectedValues.includes(v))
    case 'not_in':
      return answerValues.every((v) => !expectedValues.includes(v))
    case 'contains': {
      const needle = expectedValues[0] ?? ''
      if (Array.isArray(answer)) {
        return answer.map(normalizeComparable).includes(needle)
      }
      return normalizeComparable(answer).includes(needle)
    }
    default:
      return false
  }
}

export function evaluateConditionGroup(
  group: ConditionGroup | null | undefined,
  answers: BlueprintAnswers
): boolean {
  const conditions = group?.conditions ?? []
  if (conditions.length === 0) return true
  const logic = group?.logic === 'or' ? 'or' : 'and'
  const results = conditions.map((c) =>
    evaluateCondition(answers[c.question_key], c.operator, c.expected_value)
  )
  return logic === 'or' ? results.some(Boolean) : results.every(Boolean)
}

function questionIsEligible(
  question: BlueprintQuestion,
  opts: { includeDrafts: boolean }
): boolean {
  if (!question.active) return false
  if (question.status === 'disabled') return false
  if (question.status === 'draft' && !opts.includeDrafts) return false
  return question.status === 'approved' || (opts.includeDrafts && question.status === 'draft')
}

function ruleIsEligible(
  rule: BlueprintReportRule,
  opts: { includeDrafts: boolean }
): boolean {
  if (!rule.active) return false
  if (rule.status === 'disabled') return false
  if (rule.status === 'draft' && !opts.includeDrafts) return false
  return rule.status === 'approved' || (opts.includeDrafts && rule.status === 'draft')
}

/**
 * Evaluate which questions are visible and which structured report outcomes apply.
 */
export function evaluateAssessmentBlueprint(args: {
  input: BlueprintEvaluationInput
  questions: BlueprintQuestion[]
  rules: BlueprintReportRule[]
  /** Admin preview may include drafts; production should keep false. */
  includeDrafts?: boolean
}): BlueprintEvaluationResult {
  const includeDrafts = Boolean(args.includeDrafts)
  const errors: string[] = []
  const routeKey = args.input?.route_key?.trim()
  const answers = args.input?.answers ?? {}

  if (!routeKey) {
    return {
      route_key: '',
      visible_question_keys: [],
      skipped_question_keys: [],
      visible_questions: [],
      skipped_questions: [],
      outcomes: [],
      errors: ['route_key is required'],
    }
  }

  const questions = [...args.questions]
    .filter((q) => q.routeKey === routeKey)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.questionKey.localeCompare(b.questionKey))

  const visible_questions: BlueprintEvaluationResult['visible_questions'] = []
  const skipped_questions: BlueprintEvaluationResult['skipped_questions'] = []

  for (const question of questions) {
    if (!questionIsEligible(question, { includeDrafts })) {
      skipped_questions.push({
        question_key: question.questionKey,
        label: question.label,
        reason: `Inactive or ${question.status}`,
      })
      continue
    }

    const activeConditions = question.conditions.filter((c) => c.active)
    if (activeConditions.length === 0) {
      visible_questions.push({
        question_key: question.questionKey,
        label: question.label,
        reason: 'Always shown',
      })
      continue
    }

    const passed = activeConditions.every((c) =>
      evaluateCondition(answers[c.dependsOnQuestionKey], c.operator, c.expectedValue)
    )

    if (passed) {
      visible_questions.push({
        question_key: question.questionKey,
        label: question.label,
        reason: activeConditions
          .map(
            (c) =>
              `Show when ${c.dependsOnQuestionKey} ${c.operator} ${JSON.stringify(c.expectedValue)}`
          )
          .join('; '),
      })
    } else {
      skipped_questions.push({
        question_key: question.questionKey,
        label: question.label,
        reason: activeConditions
          .map(
            (c) =>
              `Skipped because ${c.dependsOnQuestionKey} ${c.operator} ${JSON.stringify(c.expectedValue)} was not met`
          )
          .join('; '),
      })
    }
  }

  const rules = [...args.rules]
    .filter((r) => r.routeKey === routeKey)
    .filter((r) => ruleIsEligible(r, { includeDrafts }))
    .sort((a, b) => a.priority - b.priority || a.ruleKey.localeCompare(b.ruleKey))

  const outcomes: BlueprintOutcome[] = []
  for (const rule of rules) {
    // Optional specialism / stage scoping (match answer value/id directly)
    if (rule.specialismId) {
      const selected = normalizeComparable(answers.specialism)
      if (!selected || selected !== normalizeComparable(rule.specialismId)) continue
    }
    if (rule.stageId) {
      const selectedStage = normalizeComparable(answers.qualification_stage)
      if (!selectedStage || selectedStage !== normalizeComparable(rule.stageId)) continue
    }

    let matches = false
    try {
      matches = evaluateConditionGroup(rule.conditionGroup, answers)
    } catch (err) {
      errors.push(
        `Rule ${rule.ruleKey} failed: ${err instanceof Error ? err.message : 'invalid condition'}`
      )
      continue
    }

    if (!matches) continue

    outcomes.push({
      type: rule.outcomeType,
      key: rule.outcomeKey,
      payload: rule.outcomePayload ?? {},
      ruleKey: rule.ruleKey,
      priority: rule.priority,
    })

    if (rule.stopProcessing) break
  }

  return {
    route_key: routeKey,
    visible_question_keys: visible_questions.map((q) => q.question_key),
    skipped_question_keys: skipped_questions.map((q) => q.question_key),
    visible_questions,
    skipped_questions,
    outcomes,
    errors,
  }
}
