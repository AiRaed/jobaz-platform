'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import { cn } from '@/lib/utils'

type Props = {
  src: string
  alt?: string
  className?: string
  /** Cover (detail hero) vs contain (card logos) */
  fit?: 'contain' | 'cover'
  /** Priority load for above-the-fold cards */
  priority?: boolean
  sizes?: string
}

function isOptimizableHost(src: string): boolean {
  try {
    const host = new URL(src, typeof window !== 'undefined' ? window.location.origin : 'https://jobaz.local')
      .hostname
    return (
      host.endsWith('.supabase.co') ||
      host.endsWith('.supabase.in') ||
      host === 'localhost' ||
      host === '127.0.0.1'
    )
  } catch {
    return false
  }
}

/**
 * Course/provider images with fixed layout (no CLS).
 * Uses next/image when the host is allowlisted; otherwise a lazy img fallback.
 */
export default function CourseMediaImage({
  src,
  alt = '',
  className,
  fit = 'contain',
  priority = false,
  sizes = '(max-width: 768px) 100vw, 400px',
}: Props) {
  const [failed, setFailed] = useState(false)
  const canOptimize = useMemo(() => isOptimizableHost(src), [src])
  const objectClass = fit === 'cover' ? 'object-cover' : 'object-contain object-center'

  if (!src || failed) return null

  if (canOptimize) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        loading={priority ? undefined : 'lazy'}
        className={cn(objectClass, className)}
        onError={() => setFailed(true)}
      />
    )
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- arbitrary provider CDN hosts
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
      className={cn('absolute inset-0 h-full w-full', objectClass, className)}
      onError={() => setFailed(true)}
    />
  )
}
