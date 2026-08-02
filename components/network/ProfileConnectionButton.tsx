'use client'

import { Loader2, UserCheck, UserPlus, Building2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ConnectionStatus } from '@/lib/network/types'

type Props = {
  profileType: 'personal' | 'business'
  connectionStatus?: ConnectionStatus
  following?: boolean
  loading?: boolean
  disabled?: boolean
  compact?: boolean
  onClick: () => void
}

const base =
  'rounded-full font-medium border transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5'

export default function ProfileConnectionButton({
  profileType,
  connectionStatus = 'none',
  following = false,
  loading,
  disabled,
  compact,
  onClick,
}: Props) {
  const isBusiness = profileType === 'business'

  let label = 'Connect'
  if (isBusiness) label = following ? 'Following' : 'Follow Business'
  else if (connectionStatus === 'connected') label = 'Connected'
  else if (connectionStatus === 'pending_out') label = 'Pending'
  else if (connectionStatus === 'pending_in') label = 'Connect'

  const active = isBusiness ? following : connectionStatus === 'connected'

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        base,
        compact ? 'px-2 py-1 text-[10px]' : 'px-3 py-2 text-xs',
        active
          ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10 shadow-[0_0_12px_rgba(16,185,129,0.15)]'
          : 'border-violet-500/40 text-violet-200 hover:bg-violet-500/10 hover:shadow-[0_0_14px_rgba(139,92,246,0.2)]'
      )}
    >
      {loading ? (
        <Loader2 className={cn('animate-spin', compact ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
      ) : isBusiness ? (
        <Building2 className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      ) : active ? (
        <UserCheck className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      ) : (
        <UserPlus className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
      )}
      {label}
    </button>
  )
}
