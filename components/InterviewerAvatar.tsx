'use client'

import { useState, useEffect } from 'react'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'

interface InterviewerAvatarProps {
  className?: string
  size?: number
  showLoader?: boolean
}

export default function InterviewerAvatar({ 
  className = '', 
  size = 300,
  showLoader = true 
}: InterviewerAvatarProps) {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load avatar from public folder
    const loadAvatar = () => {
      try {
        // The image should be at /interviewer-avatar.png
        const staticPath = '/interviewer-avatar.png'
        
        // Check if image exists by trying to load it
        const img = new window.Image()
        img.onload = () => {
          setAvatarUrl(staticPath)
          setIsLoading(false)
        }
        img.onerror = () => {
          // Static image doesn't exist
          console.log('[Avatar] Static image not found at /interviewer-avatar.png')
          setIsLoading(false)
          setAvatarUrl(null)
        }
        img.src = staticPath
      } catch (err) {
        console.error('[Avatar] Error loading avatar', err)
        setIsLoading(false)
        setError('Failed to load avatar')
      }
    }

    loadAvatar()
  }, [])

  if (isLoading && showLoader) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ minHeight: size, minWidth: size }}
      >
        <Loader2 className="w-8 h-8 animate-spin text-[#9b5cff]" />
      </div>
    )
  }

  if (error) {
    return (
      <div 
        className={`flex items-center justify-center ${className}`}
        style={{ minHeight: size, minWidth: size }}
      >
        <p className="text-xs text-gray-400 text-center">{error}</p>
      </div>
    )
  }

  if (!avatarUrl) {
    return (
      <div 
        className={`flex items-center justify-center bg-[#1a1a1a] rounded-xl border border-gray-800 ${className}`}
        style={{ minHeight: size, minWidth: size }}
      >
        <div className="text-center px-4 space-y-2">
          <p className="text-xs text-gray-400">
            Interviewer Avatar
          </p>
          <p className="text-xs text-gray-500">
            Avatar coming soon
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <Image
        src={avatarUrl}
        alt="Interviewer Avatar"
        fill
        className="object-contain rounded-xl"
        sizes={`${size}px`}
        priority
      />
    </div>
  )
}

