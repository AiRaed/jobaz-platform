import { evaluateAssessmentBlueprint } from './evaluateBlueprint'
import type { BlueprintQuestion, BlueprintReportRule } from './evaluateBlueprint'

/** Lightweight sanity checks for the Work in my Education blueprint rules. */
export function verifyWorkInEducationBlueprintBehaviour(): string[] {
  const errors: string[] = []

  const questions: BlueprintQuestion[] = [
    {
      id: '1',
      routeKey: 'work_in_my_education',
      questionKey: 'qualification_country',
      label: 'Country',
      helpText: '',
      answerType: 'single_select',
      required: true,
      sortOrder: 40,
      status: 'approved',
      active: true,
      isSystem: true,
      configuration: { option_source: { type: 'static' } },
      options: [],
      conditions: [],
    },
    {
      id: '2',
      routeKey: 'work_in_my_education',
      questionKey: 'english_level',
      label: 'English',
      helpText: '',
      answerType: 'single_select',
      required: true,
      sortOrder: 50,
      status: 'approved',
      active: true,
      isSystem: true,
      configuration: { option_source: { type: 'static' } },
      options: [],
      conditions: [
        {
          id: 'c1',
          dependsOnQuestionKey: 'qualification_country',
          operator: 'equals',
          expectedValue: 'outside_uk',
          active: true,
        },
      ],
    },
  ]

  const rules: BlueprintReportRule[] = [
    {
      id: 'r1',
      name: 'recognition',
      ruleKey: 'outside_uk_add_recognition',
      routeKey: 'work_in_my_education',
      specialismId: null,
      stageId: null,
      conditionGroup: {
        logic: 'and',
        conditions: [
          {
            question_key: 'qualification_country',
            operator: 'equals',
            expected_value: 'outside_uk',
          },
        ],
      },
      outcomeType: 'add_recognition_section',
      outcomeKey: 'qualification_recognition',
      outcomePayload: {},
      priority: 10,
      stopProcessing: false,
      status: 'approved',
      active: true,
      isSystem: true,
    },
    {
      id: 'r2',
      name: 'no english',
      ruleKey: 'uk_no_english_section',
      routeKey: 'work_in_my_education',
      specialismId: null,
      stageId: null,
      conditionGroup: {
        logic: 'and',
        conditions: [
          {
            question_key: 'qualification_country',
            operator: 'equals',
            expected_value: 'uk',
          },
        ],
      },
      outcomeType: 'no_english_section',
      outcomeKey: 'no_english_section',
      outcomePayload: {},
      priority: 20,
      stopProcessing: false,
      status: 'approved',
      active: true,
      isSystem: true,
    },
    {
      id: 'r3',
      name: 'english intermediate',
      ruleKey: 'english_intermediate_section',
      routeKey: 'work_in_my_education',
      specialismId: null,
      stageId: null,
      conditionGroup: {
        logic: 'and',
        conditions: [
          {
            question_key: 'qualification_country',
            operator: 'equals',
            expected_value: 'outside_uk',
          },
          {
            question_key: 'english_level',
            operator: 'equals',
            expected_value: 'intermediate',
          },
        ],
      },
      outcomeType: 'add_english_section',
      outcomeKey: 'professional_workplace_english',
      outcomePayload: {},
      priority: 50,
      stopProcessing: false,
      status: 'approved',
      active: true,
      isSystem: true,
    },
  ]

  const uk = evaluateAssessmentBlueprint({
    input: { route_key: 'work_in_my_education', answers: { qualification_country: 'uk' } },
    questions,
    rules,
  })
  if (uk.visible_question_keys.includes('english_level')) {
    errors.push('UK should skip english_level')
  }
  if (uk.outcomes.some((o) => o.type === 'add_recognition_section')) {
    errors.push('UK should not add recognition section')
  }
  if (!uk.outcomes.some((o) => o.type === 'no_english_section')) {
    errors.push('UK should emit no_english_section')
  }

  const outside = evaluateAssessmentBlueprint({
    input: {
      route_key: 'work_in_my_education',
      answers: {
        qualification_country: 'outside_uk',
        english_level: 'intermediate',
      },
    },
    questions,
    rules,
  })
  if (!outside.visible_question_keys.includes('english_level')) {
    errors.push('outside_uk should show english_level')
  }
  if (!outside.outcomes.some((o) => o.type === 'add_recognition_section')) {
    errors.push('outside_uk should add recognition section')
  }
  if (
    !outside.outcomes.some(
      (o) => o.type === 'add_english_section' && o.key === 'professional_workplace_english'
    )
  ) {
    errors.push('intermediate outside_uk should add professional_workplace_english')
  }

  return errors
}
