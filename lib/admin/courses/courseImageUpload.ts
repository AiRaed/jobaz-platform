export const COURSE_IMAGE_BUCKET = 'course-images'

export const COURSE_IMAGE_MAX_BYTES = 5 * 1024 * 1024

export const COURSE_IMAGE_ALLOWED_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
])

export const COURSE_IMAGE_VALIDATION_ERROR =
  'Please upload a JPG, PNG or WEBP image under 5MB.'

export function safeCourseImageFileName(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? 'image'
  return base.replace(/[^a-zA-Z0-9._-]/g, '-').toLowerCase() || 'image'
}

export function validateCourseImageFile(file: File): string | null {
  if (!COURSE_IMAGE_ALLOWED_TYPES.has(file.type)) {
    return COURSE_IMAGE_VALIDATION_ERROR
  }
  if (file.size > COURSE_IMAGE_MAX_BYTES) {
    return COURSE_IMAGE_VALIDATION_ERROR
  }
  return null
}

export function buildCourseImageStoragePath(courseId: string | undefined, fileName: string): string {
  const folder = courseId?.trim() ? `courses/${courseId.trim()}` : 'courses/temp'
  return `${folder}/${Date.now()}-${safeCourseImageFileName(fileName)}`
}

export async function uploadCourseImageViaApi(
  file: File,
  courseId?: string
): Promise<string> {
  const validationError = validateCourseImageFile(file)
  if (validationError) throw new Error(validationError)

  const formData = new FormData()
  formData.append('file', file)
  if (courseId?.trim()) formData.append('courseId', courseId.trim())

  const res = await fetch('/api/admin/courses/upload-image', {
    method: 'POST',
    body: formData,
  })

  const body = (await res.json()) as { publicUrl?: string; error?: string }
  if (!res.ok) {
    throw new Error(body.error || 'Image upload failed')
  }
  if (!body.publicUrl) {
    throw new Error('Upload succeeded but no image URL was returned')
  }
  return body.publicUrl
}
