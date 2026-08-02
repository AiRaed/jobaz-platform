'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Activity, ChevronDown, LayoutDashboard, LogOut, MessageSquare, User } from 'lucide-react'
import { clearCurrentUserStorage, initUserStorageCache } from '@/lib/user-storage'
import { clearCachesOnLogout } from '@/lib/career-engine/clearSharedCareerCache'
import { resetAssessmentLoaderUserCache } from '@/lib/dashboard/careerOs/assessmentLoader'
import AdminNavLink from '@/components/admin/AdminNavLink'

export default function UserMenu() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [loading, setLoading] = useState(true)
  const menuRef = useRef<HTMLDivElement>(null)

  // Fetch user info and initialize user storage cache
  useEffect(() => {
    // Initialize user storage cache for user-scoped localStorage
    initUserStorageCache()
    
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const email = user.email || ''
          const fullName = user.user_metadata?.full_name || ''
          const displayName = fullName || (email ? email.split('@')[0] : '')
          
          setUserEmail(email)
          setUserName(displayName)
        }
      } catch (error) {
        console.error('Error fetching user:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const email = session.user.email || ''
        const fullName = session.user.user_metadata?.full_name || ''
        const displayName = fullName || (email ? email.split('@')[0] : '')
        setUserEmail(email)
        setUserName(displayName)
      } else {
        setUserEmail('')
        setUserName('')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const handleLogout = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id || null

      await supabase.auth.signOut()

      if (typeof window !== 'undefined') {
        clearCachesOnLogout()
        resetAssessmentLoaderUserCache()
        if (userId) {
          await clearCurrentUserStorage()
        }
      }

      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Error signing out:', error)
      router.push('/')
    }
  }

  if (loading) {
    return (
      <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse" />
    )
  }

  if (!userEmail && !userName) {
    return null
  }

  const displayText = userName || userEmail

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-violet-500/50 hover:bg-slate-800/70 transition-colors"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        <div className="w-8 h-8 rounded-full bg-violet-600/20 border border-violet-500/30 flex items-center justify-center">
          <User className="w-4 h-4 text-violet-400" />
        </div>
        <span className="hidden sm:block text-sm text-slate-200 max-w-[120px] truncate">
          {displayText}
        </span>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-lg bg-slate-900/95 border border-slate-700/50 shadow-xl backdrop-blur-sm z-50">
          <div className="py-1">
            {/* User info */}
            <div className="px-4 py-2 border-b border-slate-700/50">
              <p className="text-xs text-slate-400 mb-1">Signed in as</p>
              <p className="text-sm text-slate-200 font-medium truncate">{displayText}</p>
              {userEmail && userName && (
                <p className="text-xs text-slate-500 truncate mt-1">{userEmail}</p>
              )}
            </div>

            <Link
              href="/dashboard"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
              My Workspace
            </Link>

            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              <User className="w-4 h-4 text-slate-400" />
              Career Identity
            </Link>

            <Link
              href="/messages"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              <MessageSquare className="w-4 h-4 text-slate-400" />
              Relay
            </Link>

            <Link
              href="/feed"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-slate-200 hover:bg-slate-800/50 transition-colors"
            >
              <Activity className="w-4 h-4 text-slate-400" />
              Pulse Activity
            </Link>

            <div onClick={() => setIsOpen(false)}>
              <AdminNavLink variant="menu" />
            </div>

            {/* Log out */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

