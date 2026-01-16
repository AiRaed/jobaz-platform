'use client'

/**
 * Supabase Dashboard Checklist:
 * 
 * Site URL must be: http://localhost:3000
 * Redirect URLs must include: http://localhost:3000/auth/callback
 * 
 * If not present, the flow will never work.
 */

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [debugInfo, setDebugInfo] = useState<{
    fullUrl: string
    code: string | null
    access_token: string | null
    refresh_token: string | null
    error_code: string | null
    error_description: string | null
  } | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get all URL parameters
        const code = searchParams?.get('code')
        const access_token = searchParams?.get('access_token')
        const refresh_token = searchParams?.get('refresh_token')
        const error_code = searchParams?.get('error_code')
        const error_description = searchParams?.get('error_description')

        // Also check hash fragment (some Supabase flows use hash)
        const hash = typeof window !== 'undefined' ? window.location.hash : ''
        const hashParams = new URLSearchParams(hash.substring(1))
        const hashAccessToken = hashParams.get('access_token')
        const hashRefreshToken = hashParams.get('refresh_token')
        const hashError = hashParams.get('error')
        const hashErrorDescription = hashParams.get('error_description')

        // Collect debug info
        const fullUrl = typeof window !== 'undefined' ? window.location.href : ''
        setDebugInfo({
          fullUrl,
          code: code || null,
          access_token: access_token || hashAccessToken || null,
          refresh_token: refresh_token || hashRefreshToken || null,
          error_code: error_code || hashError || null,
          error_description: error_description || hashErrorDescription || null,
        })

        // Handle error case
        if (error_code || hashError) {
          setError(error_description || hashErrorDescription || 'Authentication failed')
          setLoading(false)
          return
        }

        // Handle code exchange (PKCE flow)
        if (code) {
          // Check if this is a recovery flow (password reset)
          const type = searchParams?.get('type')
          const isRecoveryFlow = type === 'recovery' || 
                                 (typeof window !== 'undefined' && window.location.href.includes('type=recovery'))
          
          // Try to exchange code for session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          
          if (exchangeError) {
            // If PKCE error (code verifier missing), this usually happens with email links
            // Try to get session directly - Supabase might have set it automatically
            if (exchangeError.message.includes('code verifier') || exchangeError.message.includes('non-empty')) {
              const { data: sessionData, error: sessionError } = await supabase.auth.getSession()
              
              if (sessionData.session) {
                // Check email confirmation
                if (sessionData.session.user && !sessionData.session.user.email_confirmed_at) {
                  setError('Please confirm your email address before accessing the dashboard.')
                  setLoading(false)
                  return
                }
                // Session exists - redirect based on flow type
                if (isRecoveryFlow) {
                  router.push('/auth/reset-password')
                } else {
                  router.push('/dashboard')
                }
                return
              }
              
              // If still no session, show helpful error
              setError('Authentication link expired or invalid. Please request a new one.')
              setLoading(false)
              return
            }
            
            setError(exchangeError.message || 'Failed to exchange code for session')
            setLoading(false)
            return
          }

          if (data.session) {
            // Check if this is a recovery flow - redirect to reset page
            if (isRecoveryFlow) {
              router.push('/auth/reset-password')
              return
            }
            // Check email confirmation before redirecting
            if (data.session.user && !data.session.user.email_confirmed_at) {
              setError('Please confirm your email address before accessing the dashboard.')
              setLoading(false)
              return
            }
            // Success - redirect to dashboard for normal auth flows
            router.push('/dashboard')
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
              setError(sessionError.message || 'Failed to set session')
              setLoading(false)
              return
            }

            if (data.session) {
              // Check email confirmation before redirecting
              if (data.session.user && !data.session.user.email_confirmed_at) {
                setError('Please confirm your email address before accessing the dashboard.')
                setLoading(false)
                return
              }
              // Success - redirect to dashboard
              router.push('/dashboard')
              return
            }
          }
        }

        // If we get here, no valid auth params were found
        setError('No valid authentication parameters found in the callback URL')
        setLoading(false)
      } catch (err: any) {
        setError(err.message || 'An unexpected error occurred')
        setLoading(false)
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#050617] to-[#02010f] text-slate-50 relative overflow-hidden flex items-center justify-center px-4 py-12">
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-40 -left-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-fuchsia-500/25 blur-3xl" />
      
      <div className="w-full max-w-md relative z-10">
        <div className="rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] backdrop-blur p-8">
          <h1 className="text-2xl font-heading font-bold text-white mb-4 text-center">
            Processing Authentication...
          </h1>

          {loading && (
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-violet-400 mb-4"></div>
              <p className="text-gray-400">Please wait...</p>
            </div>
          )}

          {error && (
            <div className="space-y-4">
              <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm font-medium mb-2">Authentication Error</p>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
              <button
                onClick={() => router.push('/auth')}
                className="w-full py-3 bg-gradient-to-r from-violet-accent to-violet-600 hover:from-violet-700 hover:to-violet-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
              >
                Back to Auth
              </button>
            </div>
          )}

          {/* Debug box - only show in development */}
          {process.env.NODE_ENV === 'development' && debugInfo && (
            <div className="mt-6 p-4 bg-gray-900/50 border border-gray-700 rounded-lg">
              <p className="text-xs font-mono text-gray-400 mb-2">Debug Info (Dev Only):</p>
              <div className="space-y-2 text-xs font-mono">
                <div>
                  <span className="text-gray-500">URL:</span>
                  <div className="text-gray-300 break-all mt-1">{debugInfo.fullUrl}</div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-gray-500">code:</span>
                    <div className="text-gray-300 truncate">{debugInfo.code || 'null'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">access_token:</span>
                    <div className="text-gray-300 truncate">
                      {debugInfo.access_token ? `${debugInfo.access_token.substring(0, 20)}...` : 'null'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">refresh_token:</span>
                    <div className="text-gray-300 truncate">
                      {debugInfo.refresh_token ? `${debugInfo.refresh_token.substring(0, 20)}...` : 'null'}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">error_code:</span>
                    <div className="text-gray-300 truncate">{debugInfo.error_code || 'null'}</div>
                  </div>
                </div>
                {debugInfo.error_description && (
                  <div>
                    <span className="text-gray-500">error_description:</span>
                    <div className="text-gray-300 break-all mt-1">{debugInfo.error_description}</div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
