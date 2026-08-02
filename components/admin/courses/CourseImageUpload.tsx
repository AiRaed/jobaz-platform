'use client'

import { useRef, useState } from 'react'
import { ImagePlus, Loader2, Trash2, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { uploadCourseImageViaApi } from '@/lib/admin/courses/courseImageUpload'

type Props = {
  imageUrl: string
  courseId?: string
  onChange: (url: string) => void
  inputClass: string
}

export default function CourseImageUpload({ imageUrl, courseId, onChange, inputClass }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewUrl = imageUrl.trim()

  const handleFileSelect = async (file: File | null) => {
    if (!file) return
    setError(null)
    setUploading(true)
    try {
      const publicUrl = await uploadCourseImageViaApi(file, courseId)
      onChange(publicUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Image upload failed')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemove = () => {
    setError(null)
    onChange('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-3 md:col-span-2">
      <div>
        <p className="text-xs font-medium text-slate-400">Course image / provider logo</p>
        <p className="text-[11px] text-slate-500 mt-1">
          Upload a course image or provider logo used on the Courses &amp; Licences card.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800/80 bg-slate-900/30 p-4 space-y-4">
        {previewUrl ? (
          <div
            className="relative aspect-[16/9] max-w-md rounded-xl overflow-hidden border border-slate-700/50"
            style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.9), rgba(30,64,175,0.35))' }}
          >
            <div className="flex h-full w-full items-center justify-center p-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrl} alt="Course preview" className="max-h-full max-w-full object-contain object-center" />
            </div>
          </div>
        ) : (
          <div className="aspect-[16/9] max-w-md rounded-xl border border-dashed border-slate-700/60 bg-slate-950/40 flex flex-col items-center justify-center gap-2 text-slate-500">
            <ImagePlus className="w-8 h-8 text-slate-600" />
            <span className="text-xs">No image uploaded yet</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-violet-500/35 bg-violet-500/10 text-violet-100 hover:bg-violet-500/15 transition disabled:opacity-50"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {uploading ? 'Uploading…' : 'Upload image'}
          </button>

          {previewUrl && (
            <button
              type="button"
              disabled={uploading}
              onClick={handleRemove}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-slate-700/60 text-slate-300 hover:border-red-500/30 hover:text-red-300 transition disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" />
              Remove image
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => void handleFileSelect(e.target.files?.[0] ?? null)}
        />

        <label className="block space-y-1.5">
          <span className="text-[11px] text-slate-500">Or paste image URL manually</span>
          <input
            type="url"
            value={imageUrl}
            onChange={(e) => {
              setError(null)
              onChange(e.target.value)
            }}
            className={inputClass}
            placeholder="https://…"
          />
        </label>

        {error && <p className="text-xs text-red-400/90">{error}</p>}
        {!courseId && (
          <p className="text-[11px] text-slate-500">
            New courses upload to a temporary folder first. Save the course, then you can re-upload under the
            course ID folder if needed.
          </p>
        )}
      </div>
    </div>
  )
}
