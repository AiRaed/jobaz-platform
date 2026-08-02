import { NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { createServerSupabaseClient } from '@/lib/supabase'
import {
  buildCourseImageStoragePath,
  COURSE_IMAGE_BUCKET,
  validateCourseImageFile,
} from '@/lib/admin/courses/courseImageUpload'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  let formData: FormData
  try {
    formData = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const file = formData.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'Image file is required' }, { status: 400 })
  }

  const validationError = validateCourseImageFile(file)
  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 })
  }

  const courseId = String(formData.get('courseId') ?? '').trim() || undefined
  const storagePath = buildCourseImageStoragePath(courseId, file.name)

  try {
    const supabase = createServerSupabaseClient()
    const buffer = Buffer.from(await file.arrayBuffer())

    const { error: uploadError } = await supabase.storage.from(COURSE_IMAGE_BUCKET).upload(storagePath, buffer, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false,
    })

    if (uploadError) {
      console.error('[admin/courses/upload-image]', uploadError)
      return NextResponse.json({ error: uploadError.message || 'Upload failed' }, { status: 500 })
    }

    const { data } = supabase.storage.from(COURSE_IMAGE_BUCKET).getPublicUrl(storagePath)

    return NextResponse.json({
      publicUrl: data.publicUrl,
      path: storagePath,
    })
  } catch (err) {
    console.error('[admin/courses/upload-image]', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Supabase storage is not configured' },
      { status: 503 }
    )
  }
}
