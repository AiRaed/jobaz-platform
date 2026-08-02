import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApiUser } from '@/lib/auth/adminApi'
import { createServerSupabaseClient } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const MAX_BYTES = 5 * 1024 * 1024
const ALLOWED = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg'])

/** POST multipart — admin upload to pulse-media bucket */
export async function POST(req: NextRequest) {
  const auth = await requireAdminApiUser()
  if (!auth.ok) return auth.response

  let supabase
  try {
    supabase = createServerSupabaseClient()
  } catch {
    return NextResponse.json(
      {
        error: 'Image upload is not configured yet. You can still use Image URL.',
        configured: false,
      },
      { status: 503 }
    )
  }

  let form: FormData
  try {
    form = await req.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid upload payload' }, { status: 400 })
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'file required' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be under 5MB.' }, { status: 400 })
  }

  const type = (file.type || '').toLowerCase()
  if (!ALLOWED.has(type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) {
    return NextResponse.json({ error: 'Use JPG, PNG, or WebP.' }, { status: 400 })
  }

  const ext =
    file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ||
    (type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpg')
  const path = `admin/${auth.user.id}/${Date.now()}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  const { error } = await supabase.storage.from('pulse-media').upload(path, buffer, {
    contentType: type || `image/${ext}`,
    upsert: true,
    cacheControl: '3600',
  })

  if (error) {
    const msg = error.message || 'Upload failed'
    const notConfigured =
      /bucket|not found|row-level security|policy|storage/i.test(msg) ||
      msg.toLowerCase().includes('pulse-media')
    return NextResponse.json(
      {
        error: notConfigured
          ? 'Image upload is not configured yet. You can still use Image URL.'
          : msg,
        configured: !notConfigured,
      },
      { status: 503 }
    )
  }

  const { data } = supabase.storage.from('pulse-media').getPublicUrl(path)
  return NextResponse.json({ ok: true, url: data.publicUrl, configured: true })
}
