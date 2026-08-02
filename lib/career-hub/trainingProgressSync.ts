/**
 * Optional Supabase sync for roadmap training progress (authenticated users).
 */

import { resolveAuthenticatedUserId } from '@/lib/auth/resolveUserId'
import { supabase } from '@/lib/supabase'
import type { RouteRequirement } from '@/lib/dashboard/careerOs/types'
import type { CareerPlanItem } from './types'

type TrainingProgressStatus = 'not_started' | 'in_progress' | 'completed'

function mapStatus(status: CareerPlanItem['status']): TrainingProgressStatus {
  if (status === 'completed') return 'completed'
  if (status === 'in_progress' || status === 'saved' || status === 'interested') return 'in_progress'
  return 'not_started'
}

export async function syncTrainingProgressToSupabase(
  req: RouteRequirement,
  item: CareerPlanItem
): Promise<void> {
  const userId = await resolveAuthenticatedUserId()
  if (!userId) return

  const status = mapStatus(item.status)
  const payload = {
    user_id: userId,
    course_id: item.courseId ?? req.id,
    course_slug: item.courseSlug,
    course_title: item.courseName,
    path_id: item.pathId ?? '',
    status,
    source: item.source,
    started_at: item.startedAt ?? (status !== 'not_started' ? item.updatedAt : null),
    completed_at: item.completedAt ?? null,
    updated_at: new Date().toISOString(),
  }

  await supabase.from('career_training_progress').upsert(payload, {
    onConflict: 'user_id,course_slug,path_id',
  })
}
