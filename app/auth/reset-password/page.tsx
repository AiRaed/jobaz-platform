'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [initializing, setInitializing] = useState(true)

  // Initialize: Read recovery tokens from URL and set session
  useEffect(() => {
    const initializeReset = async () => {
      try {
        // Get tokens from URL parameters (query string)
        const code = searchParams?.get('code')
        const access_token = searchParams?.get('access_token')
        const refresh_token = searchParams?.get('refresh_token')
        const type = searchParams?.get('type')

        // Also check hash fragment (Supabase often sends tokens in hash)
        const hash = typeof window !== 'undefined' ? window.location.hash : ''
        const hashParams = new URLSearchParams(hash.substring(1))
        const hashAccessToken = hashParams.get('access_token')
        const hashRefreshToken = hashParams.get('refresh_token')
        const hashType = hashParams.get('type')

        // Valid recovery: type=recovery (Supabase email link) OR we have tokens/code
        const hasTypeRecovery = type === 'recovery' || hashType === 'recovery' ||
          (typeof window !== 'undefined' && window.location.href.includes('type=recovery'))
        const hasTokens = !!(code || access_token || hashAccessToken)
        const hasValidRecoveryLink = hasTypeRecovery || hasTokens

        if (!hasValidRecoveryLink) {
          setError('Invalid reset link. This page is only for password reset.')
          setInitializing(false)
          return
        }

        // Handle code exchange (PKCE flow)
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            // If PKCE error, try to get session directly
            if (exchangeError.message.includes('code verifier') || exchangeError.message.includes('non-empty')) {
              const { data: sessionData } = await supabase.auth.getSession()
              if (sessionData.session) {
                setInitializing(false)
                return
              }
            }
            setError('Invalid or expired reset link. Please request a new password reset.')
            setInitializing(false)
            return
          }

          if (data.session) {
            setInitializing(false)
            return
          }
        }

        // Handle token-based flow (access_token + refresh_token)
        if (access_token || hashAccessToken) {
          const token = access_token || hashAccessToken
          const refresh = refresh_token || hashRefreshToken

          if (token && refresh) {
            const { data, error: sessionError } = await supabase.auth.setSession({
              access_token: token,
              refresh_token: refresh,
            })

            if (sessionError) {
              setError('Invalid or expired reset link. Please request a new password reset.')
              setInitializing(false)
              return
            }

            if (data.session) {
              setInitializing(false)
              return
            }
          }
        }

        // If we get here, check if session already exists
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setInitializing(false)
          return
        }

        // No valid tokens or session found
        setError('Invalid or expired reset link. Please request a new password reset.')
        setInitializing(false)
      } catch (err: any) {
        setError('Failed to initialize password reset. Please try again.')
        setInitializing(false)
      }
    }

    initializeReset()
  }, [searchParams])

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccess(false)

    // Validate passwords
    if (!password) {
      setError('Please enter a new password')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      setLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    try {
      // Verify session still exists
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Session expired. Please request a new password reset link.')
        setLoading(false)
        return
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      })

      if (updateError) {
        setError(updateError.message || 'Failed to update password')
        setLoading(false)
        return
      }

      // Success - show success message and redirect to login
      setSuccess(true)
      setPassword('')
      setConfirmPassword('')
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/auth?mode=login')
      }, 2000)
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      setLoading(false)
    }
  }

  if (initializing) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-[#141414] rounded-2xl border border-gray-800 shadow-lg p-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-400 mb-4"></div>
              <p className="text-gray-400">Verifying reset link...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-[#141414] rounded-2xl border border-gray-800 shadow-lg p-8">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-heading font-bold text-white">Password Updated!</h1>
              <p className="text-gray-400">Your password has been successfully updated. Redirecting to login...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-[#141414] rounded-2xl border border-gray-800 shadow-lg p-8">
          <h1 className="text-2xl font-heading font-bold text-white mb-2 text-center">
            Reset Your Password
          </h1>
          <p className="text-gray-400 text-center mb-8">
            Enter your new password below
          </p>

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-accent focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-300 mb-2">
                Confirm Password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-accent focus:border-transparent transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-violet-accent to-violet-600 hover:from-violet-700 hover:to-violet-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Updating password...' : 'Update password'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => router.push('/auth?mode=login')}
              className="text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

