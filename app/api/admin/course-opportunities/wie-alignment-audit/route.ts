import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { getAdminCoursesSupabase } from '@/lib/admin/courses/supabaseServer'
import {
  buildCombinedWieCourseAudits,
  formatCombinedWieAuditMarkdown,
} from '@/lib/career-engine/work-in-education/course-alignment/coverage-server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  const supabase = getAdminCoursesSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Supabase service role is not configured' }, { status: 503 })
  }

  try {
    const { alignment, coverage } = await buildCombinedWieCourseAudits(supabase)
    const url = new URL(request.url)
    if (url.searchParams.get('format') === 'markdown') {
      return new NextResponse(formatCombinedWieAuditMarkdown({ alignment, coverage }), {
        headers: { 'Content-Type': 'text/markdown; charset=utf-8' },
      })
    }
    return NextResponse.json({
      ok: true,
      summary: alignment,
      coverage: {
        total_fields: coverage.total_fields,
        total_specialisms: coverage.total_specialisms,
        fields_covered: coverage.fields_covered,
        fields_partially_covered: coverage.fields_partially_covered,
        fields_missing_course_coverage: coverage.fields_missing_course_coverage,
        fields_contaminated_only: coverage.fields_contaminated_only,
        specialisms_missing_courses: coverage.specialisms_missing_courses,
        high_priority_missing_course_types: coverage.high_priority_missing_course_types,
        contamination_risks: coverage.contamination_risks,
        generated_at: coverage.generated_at,
        fields: coverage.fields,
        specialisms_missing: coverage.specialisms.filter(
          (s) => s.status === 'missing_course_coverage' || s.status === 'contaminated_only'
        ),
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Audit failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
