import { createClient } from '@supabase/supabase-js'
import { EDUCATION_FIELD_KNOWLEDGE, getSeedKnowledge } from './seed'
import type { EducationFieldId, EducationFieldKnowledge } from '../types'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

/** Parse JSONB row from `career_education_fields` into typed knowledge. */
function rowToKnowledge(row: Record<string, unknown>): EducationFieldKnowledge {
  return {
    id: String(row.id) as EducationFieldId,
    label: String(row.label),
    goalRole: String(row.goal_role),
    careerHubPathId: String(row.career_hub_path_id),
    typicalJobs: (row.typical_jobs as EducationFieldKnowledge['typicalJobs']) ?? [],
    graduateJobs: (row.graduate_jobs as EducationFieldKnowledge['graduateJobs']) ?? [],
    professionalRegistration: (row.professional_registration as EducationFieldKnowledge['professionalRegistration']) ?? [],
    qualificationRecognition: (row.qualification_recognition as EducationFieldKnowledge['qualificationRecognition']) ?? {
      requiredForOutsideUk: true,
      summary: '',
      bodies: [],
    },
    careerProgression: (row.career_progression as string[]) ?? [],
    recommendedCourses: (row.recommended_courses as EducationFieldKnowledge['recommendedCourses']) ?? [],
    professionalCertifications: (row.professional_certifications as EducationFieldKnowledge['professionalCertifications']) ?? [],
    essentialSkills: (row.essential_skills as string[]) ?? [],
    commonEmployers: (row.common_employers as string[]) ?? [],
    transferableRoles: (row.transferable_roles as EducationFieldKnowledge['transferableRoles']) ?? [],
    temporaryEntryRoles: (row.temporary_entry_roles as EducationFieldKnowledge['temporaryEntryRoles']) ?? [],
  }
}

/** Load field knowledge — DB first, seed fallback. */
export async function fetchEducationFieldKnowledge(
  fieldId: EducationFieldId
): Promise<EducationFieldKnowledge> {
  const client = getServiceClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('career_education_fields')
        .select('*')
        .eq('id', fieldId)
        .maybeSingle()

      if (!error && data) return rowToKnowledge(data as Record<string, unknown>)
    } catch {
      // fall through to seed
    }
  }
  return getSeedKnowledge(fieldId)
}

export async function listEducationFields(): Promise<Array<{ id: string; label: string }>> {
  const client = getServiceClient()
  if (client) {
    try {
      const { data, error } = await client
        .from('career_education_fields')
        .select('id, label')
        .order('label')

      if (!error && data?.length) return data as Array<{ id: string; label: string }>
    } catch {
      // seed fallback
    }
  }
  return Object.values(EDUCATION_FIELD_KNOWLEDGE).map((f) => ({ id: f.id, label: f.label }))
}
