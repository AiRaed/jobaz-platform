import { NextResponse } from 'next/server'
import { listExtraIncomeCategories } from '@/lib/career-engine/extra-income/library'

export const dynamic = 'force-dynamic'

export async function GET() {
  return NextResponse.json({
    categories: listExtraIncomeCategories(),
  })
}
