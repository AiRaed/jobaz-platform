import { NextRequest, NextResponse } from 'next/server'
import {
  createProofreadingServerClient,
  isSupabaseConfigured,
  proofreadingProjectsJsonError,
} from '@/lib/proofreading/supabaseServer'

export const dynamic = 'force-dynamic'

/**
 * DELETE /api/proofreading/projects/[id]
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    if (!isSupabaseConfigured()) {
      return proofreadingProjectsJsonError(
        'Writing Review is not configured yet.',
        503,
        { code: 'NOT_CONFIGURED' }
      )
    }

    const supabase = createProofreadingServerClient()
    if (!supabase) {
      return proofreadingProjectsJsonError(
        'Writing Review is not configured yet.',
        503,
        { code: 'NOT_CONFIGURED' }
      )
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return proofreadingProjectsJsonError('Authentication required', 401, {
        code: 'AUTH_REQUIRED',
      })
    }

    const { id } = params

    const { error } = await supabase
      .from('proofreading_projects')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('[Proofreading Projects] Delete error:', error)
      return proofreadingProjectsJsonError('Failed to delete project', 500, {
        code: error.code ?? 'DB_ERROR',
      })
    }

    return NextResponse.json({ ok: true, projects: [] })
  } catch (error: unknown) {
    console.error('[Proofreading Projects] Unexpected DELETE error:', error)
    return proofreadingProjectsJsonError(
      error instanceof Error ? error.message : 'Failed to delete project',
      500
    )
  }
}
