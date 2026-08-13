import { NextResponse } from 'next/server'
import {
  getExtraIncomeCategory,
  listExtraIncomeOptions,
} from '@/lib/career-engine/extra-income/library'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const url = new URL(req.url)
  const categoryId = url.searchParams.get('category_id')?.trim() || ''
  if (!categoryId || !getExtraIncomeCategory(categoryId)) {
    return NextResponse.json(
      { error: 'Please select an Extra Income category.', code: 'missing_category' },
      { status: 400 }
    )
  }
  return NextResponse.json({
    category_id: categoryId,
    options: listExtraIncomeOptions(categoryId),
  })
}
