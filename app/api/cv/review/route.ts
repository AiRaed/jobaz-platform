import { NextRequest, NextResponse } from 'next/server'
import { computeCvScore } from '@/lib/cv-score'
import type { CvData } from '@/app/cv-builder-v2/page'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { cvData } = body

    if (!cvData) {
      return NextResponse.json({ ok: false, error: 'CV data is required' }, { status: 400 })
    }

    const data = cvData as CvData

    // Use shared scoring utility
    const scoreResult = computeCvScore(data)

    return NextResponse.json({
      ok: true,
      score: scoreResult.score,
      completionScore: scoreResult.completionScore,
      qualityScore: scoreResult.qualityScore,
      level: scoreResult.level,
      topFixes: scoreResult.fixes,
      isGated: scoreResult.isGated,
      gateMessage: scoreResult.gateMessage,
      notes: scoreResult.fixes.length > 5 ? scoreResult.fixes.slice(5) : undefined,
    })
  } catch (error: any) {
    console.error('CV Review error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'Failed to review CV' },
      { status: 500 }
    )
  }
}

