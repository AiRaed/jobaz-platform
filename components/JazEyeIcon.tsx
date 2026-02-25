'use client'

import { cn } from '@/lib/utils'

interface JazEyeIconProps {
  className?: string
  size?: 'sm' | 'md' | 'lg' | number
  ariaLabel?: string
}

/**
 * Reusable JAZ Eye Icon component
 * 
 * Uses the same visual identity as the floating "Assist JAZ" button:
 * - Same SVG/image source (/jaz/jaz-eye.png)
 * - Violet → cyan gradient glow effect
 * - Subtle pulse animation
 * 
 * @param className - Additional CSS classes
 * @param size - Size preset ('sm', 'md', 'lg') or custom number (pixels)
 * @param ariaLabel - Accessibility label (defaults to "AI Career Intelligence")
 */
export default function JazEyeIcon({ 
  className, 
  size = 'md',
  ariaLabel = 'AI Career Intelligence'
}: JazEyeIconProps) {
  // Convert size preset to pixels
  const sizePx = typeof size === 'number' 
    ? size 
    : size === 'sm' 
      ? 16 
      : size === 'md' 
        ? 20 
        : 24 // lg

  return (
    <div 
      className={cn('jaz-eye-icon-wrapper relative inline-flex items-center justify-center', className)}
      style={{ width: `${sizePx}px`, height: `${sizePx}px` }}
      aria-label={ariaLabel}
      role="img"
    >
      {/* Glow effect - violet to cyan gradient */}
      <div 
        className="jaz-eye-glow absolute inset-0 rounded-full pointer-events-none"
        style={{
          background: `radial-gradient(circle at 50% 50%, 
            rgba(124, 58, 237, 0.3) 0%,
            rgba(139, 92, 246, 0.25) 25%,
            rgba(139, 92, 246, 0.2) 40%,
            rgba(99, 102, 241, 0.15) 55%,
            rgba(99, 102, 241, 0.1) 70%,
            transparent 85%)`,
          transform: 'scale(1.2)',
        }}
      />
      
      {/* JAZ Eye image */}
      <img 
        src="/jaz/jaz-eye.png" 
        alt={ariaLabel}
        className="jaz-eye-image relative z-10 w-full h-full object-contain"
        style={{
          filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.4)) drop-shadow(0 0 2px rgba(99, 102, 241, 0.3))',
        }}
      />
    </div>
  )
}

