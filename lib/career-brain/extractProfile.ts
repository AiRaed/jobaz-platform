/**
 * AI + rule hybrid career profile extraction.
 */

import { aiProvider } from '@/lib/jobaz-ai/providers'
import { parseJsonFromText } from '@/lib/jobaz-ai/providers/base'
import { CAREER_BRAIN_EXTRACT_FEATURE } from './config'
import { enrichCareerProfile } from './enrichProfile'
import { buildNarrativeFromState } from './fieldSignals'
import type { CareerBrainState, CareerProfile, EducationLevel, UrgencyLevel } from './types'

const EXTRACT_SYSTEM = `You are JobAZ Career Brain — extract a structured UK career profile from user text.

Return ONLY valid JSON (no markdown):
{
  "educationLevel": "none" | "school" | "college" | "degree" | "postgrad" | null,
  "studyField": string | null,
  "workExperienceField": string | null,
  "targetField": string | null,
  "yearsOfExperience": number | null,
  "experienceCountry": string | null,
  "toolsAndSkills": string[],
  "hasPortfolio": boolean | null,
  "certificates": string[],
  "licences": string[],
  "englishLevel": string | null,
  "ukLocation": string | null,
  "urgencyLevel": "low" | "medium" | "high",
  "wantsSameField": boolean | null,
  "wantsCareerChange": boolean | null,
  "detectedRoles": string[],
  "transferableSkills": string[],
  "constraints": string[],
  "confidence": number
}

Rules:
- Animator / Maya / After Effects → workExperienceField or studyField must reflect animation; tools must list software used.
- Never suggest warehouse/construction as detectedRoles for creative specialists.
- wantsCareerChange only if explicit.
- urgencyLevel "high" if any job urgently / ASAP.
- confidence 0-1.`

function normEducation(raw: unknown): EducationLevel {
  const v = String(raw ?? '').toLowerCase()
  if (['none', 'school', 'college', 'degree', 'postgrad'].includes(v)) return v as EducationLevel
  return null
}

function normUrgency(raw: unknown): UrgencyLevel | undefined {
  const v = String(raw ?? '').toLowerCase()
  if (v === 'low' || v === 'medium' || v === 'high') return v
  return undefined
}

function parseAiPartial(raw: string): Partial<CareerProfile> | null {
  try {
    const p = parseJsonFromText<Record<string, unknown>>(raw)
    if (typeof p.confidence !== 'number') return null
    return {
      educationLevel: normEducation(p.educationLevel),
      studyField: p.studyField ? String(p.studyField) : null,
      workExperienceField: p.workExperienceField ? String(p.workExperienceField) : null,
      targetField: p.targetField ? String(p.targetField) : null,
      yearsOfExperience:
        typeof p.yearsOfExperience === 'number' ? p.yearsOfExperience : null,
      experienceCountry: p.experienceCountry ? String(p.experienceCountry) : null,
      toolsAndSkills: Array.isArray(p.toolsAndSkills) ? p.toolsAndSkills.map(String) : [],
      hasPortfolio: typeof p.hasPortfolio === 'boolean' ? p.hasPortfolio : null,
      certificates: Array.isArray(p.certificates) ? p.certificates.map(String) : [],
      licences: Array.isArray(p.licences) ? p.licences.map(String) : [],
      englishLevel: p.englishLevel ? String(p.englishLevel) : null,
      ukLocation: p.ukLocation ? String(p.ukLocation) : null,
      urgencyLevel: normUrgency(p.urgencyLevel),
      wantsSameField: typeof p.wantsSameField === 'boolean' ? p.wantsSameField : null,
      wantsCareerChange:
        typeof p.wantsCareerChange === 'boolean' ? p.wantsCareerChange : null,
      detectedRoles: Array.isArray(p.detectedRoles) ? p.detectedRoles.map(String) : [],
      transferableSkills: Array.isArray(p.transferableSkills)
        ? p.transferableSkills.map(String)
        : [],
      constraints: Array.isArray(p.constraints) ? p.constraints.map(String) : [],
      confidence: Math.min(1, Math.max(0, p.confidence)),
    }
  } catch {
    return null
  }
}

export type ExtractProfileResult = {
  profile: CareerProfile
  source: 'ai' | 'rules' | 'hybrid'
}

export async function extractCareerProfile(state: CareerBrainState): Promise<ExtractProfileResult> {
  const narrative = buildNarrativeFromState(state)
  const rulesProfile = enrichCareerProfile(state)

  if (!aiProvider.isConfigured() || narrative.length < 8) {
    return { profile: rulesProfile, source: 'rules' }
  }

  try {
    const completion = await aiProvider.generateText({
      feature: CAREER_BRAIN_EXTRACT_FEATURE,
      messages: [
        { role: 'system', content: EXTRACT_SYSTEM },
        {
          role: 'user',
          content: `Extract career profile:\n\n${narrative}`,
        },
      ],
      temperature: 0.15,
      maxTokens: 800,
      responseFormat: 'json_object',
      timeoutMs: Number(process.env.OLLAMA_TIMEOUT_MS ?? 45_000),
    })

    const partial = parseAiPartial(completion.text)
    if (!partial) {
      return { profile: rulesProfile, source: 'rules' }
    }

    const merged = enrichCareerProfile(state, {
      ...partial,
      detectedRoles: [...new Set([...(partial.detectedRoles ?? []), ...rulesProfile.detectedRoles])],
      toolsAndSkills: [...new Set([...(partial.toolsAndSkills ?? []), ...rulesProfile.toolsAndSkills])],
      confidence: Math.max(partial.confidence ?? 0, rulesProfile.confidence),
      urgencyLevel: partial.urgencyLevel ?? rulesProfile.urgencyLevel,
    })

    return { profile: merged, source: 'hybrid' }
  } catch {
    return { profile: rulesProfile, source: 'rules' }
  }
}
