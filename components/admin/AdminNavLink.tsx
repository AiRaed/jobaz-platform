'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Shield } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { isAdminUser } from '@/lib/auth/adminEmails'
import { cn } from '@/lib/utils'

type Props = {
  className?: string
  variant?: 'header' | 'menu'
}

export default function AdminNavLink({ className, variant = 'header' }: Props) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const refresh = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      setVisible(isAdminUser(user?.email))
    }

    void refresh()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setVisible(isAdminUser(session?.user?.email))
    })

    return () => subscription.unsubscribe()
  }, [])

  if (!visible) return null

  const styles =
    variant === 'menu'
      ? 'flex items-center gap-3 px-4 py-2 text-sm text-violet-200 hover:bg-violet-500/10 transition-colors'
      : cn(
          'jobaz-shell-chip',
          className
        )

  return (
    <Link href="/admin" prefetch className={styles}>
      <Shield className={variant === 'menu' ? 'w-4 h-4 text-violet-400' : 'h-3.5 w-3.5'} />
      Admin
    </Link>
  )
}
