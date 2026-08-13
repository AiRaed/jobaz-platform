import { NextResponse } from 'next/server'
import { listSncWorkTypes } from '@/lib/career-engine/start-new-career/library'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    work_types: listSncWorkTypes().map((w) => ({
      id: w.id,
      label: w.label,
      short_description: w.short_description,
      mapped_field_slugs: w.mapped_field_slugs,
    })),
  })
}
