import { NextResponse } from 'next/server'
import { listProfessionFields } from '@/lib/career-engine/work-in-profession'

export const dynamic = 'force-dynamic'

/** GET Work in My Profession fields (in-memory library). */
export async function GET() {
  const fields = listProfessionFields().map((f) => ({
    id: f.id,
    slug: f.slug,
    name: f.name,
    description: f.description,
  }))
  return NextResponse.json({
    fields,
    empty: fields.length === 0,
    message: fields.length === 0 ? 'No profession fields available yet.' : undefined,
  })
}
