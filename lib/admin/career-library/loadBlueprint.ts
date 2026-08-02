import type { SupabaseClient } from '@supabase/supabase-js'
import {
  mapQuestionRow,
  mapReportRuleRow,
} from '@/lib/admin/career-library/blueprintMappers'
import type {
  BlueprintQuestion,
  BlueprintReportRule,
} from '@/lib/career-library/assessment/evaluateBlueprint'

export async function loadBlueprintBundle(
  supabase: SupabaseClient,
  routeKey: string
): Promise<{ questions: BlueprintQuestion[]; rules: BlueprintReportRule[]; error?: string }> {
  const [questionsRes, optionsRes, conditionsRes, rulesRes] = await Promise.all([
    supabase
      .from('career_library_questions')
      .select('*')
      .eq('route_key', routeKey)
      .order('sort_order', { ascending: true }),
    supabase.from('career_library_question_options').select('*').order('sort_order', { ascending: true }),
    supabase.from('career_library_question_conditions').select('*'),
    supabase
      .from('career_library_report_rules')
      .select('*')
      .eq('route_key', routeKey)
      .order('priority', { ascending: true }),
  ])

  if (questionsRes.error || optionsRes.error || conditionsRes.error || rulesRes.error) {
    return {
      questions: [],
      rules: [],
      error: 'Could not load assessment blueprint.',
    }
  }

  const questionIds = new Set((questionsRes.data ?? []).map((q) => q.id))
  const options = (optionsRes.data ?? []).filter((o) => questionIds.has(o.question_id))
  const conditions = (conditionsRes.data ?? []).filter((c) => questionIds.has(c.question_id))

  return {
    questions: (questionsRes.data ?? []).map((q) => mapQuestionRow(q, options, conditions)),
    rules: (rulesRes.data ?? []).map(mapReportRuleRow),
  }
}
