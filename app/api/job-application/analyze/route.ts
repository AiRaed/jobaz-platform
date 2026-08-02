import { NextResponse } from 'next/server'
import { analyzeApplication } from '@/lib/job-application/analyzeApplication'
import type { ApplicationPrepStatus } from '@/lib/job-application/types'

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      job: { title: string; company?: string; description?: string }
      cvSummary?: string
      coverLetterText?: string
      cvSkills?: string[]
      statuses?: ApplicationPrepStatus
      aiFitScore?: number
      aiStrengths?: string[]
      aiWeaknesses?: string[]
      aiMissingSkills?: string[]
    }

    if (!body.job?.title) {
      return NextResponse.json({ error: 'Job title required' }, { status: 400 })
    }

    const analysis = analyzeApplication({
      job: body.job,
      cvSummary: body.cvSummary ?? '',
      coverLetterText: body.coverLetterText ?? '',
      cvSkills: body.cvSkills ?? [],
      statuses: body.statuses ?? {
        cvStatus: 'not-tailored',
        coverStatus: 'not-created',
        applicationStatus: 'not-submitted',
        trainingStatus: 'not-available',
      },
      aiFitScore: body.aiFitScore,
      aiStrengths: body.aiStrengths,
      aiWeaknesses: body.aiWeaknesses,
      aiMissingSkills: body.aiMissingSkills,
    })

    return NextResponse.json(analysis)
  } catch (err) {
    console.error('[job-application/analyze]', err)
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}
