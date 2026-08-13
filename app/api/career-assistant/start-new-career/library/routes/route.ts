import { NextResponse } from 'next/server'
import {
  getSncWorkType,
  listSncRoutesForWorkType,
} from '@/lib/career-engine/start-new-career/library'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const workTypeId = url.searchParams.get('work_type_id')?.trim() || ''
  if (!workTypeId || !getSncWorkType(workTypeId)) {
    return NextResponse.json(
      { error: 'Please select a work type.', code: 'missing_work_type' },
      { status: 400 }
    )
  }
  return NextResponse.json({
    work_type_id: workTypeId,
    routes: listSncRoutesForWorkType(workTypeId).map((r) => ({
      id: r.id,
      label: r.label,
      short_description: r.short_description,
      field_slug: r.field_slug,
      specialism_slug: r.specialism_slug,
    })),
  })
}
