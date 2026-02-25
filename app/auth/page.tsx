'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { SITE_URL } from '@/lib/site-url'
import { trackEvent } from '@/lib/analytics/trackEvent'

type AuthMode = 'signup' | 'login' | 'forgot'

export default function AuthPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const modeParam = searchParams?.get('mode')
  
  // Determine initial mode from URL params
  const initialMode: AuthMode = modeParam === 'forgot' ? 'forgot' : 'signup'
  
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false)

  // Sign up form state
  const [signupName, setSignupName] = useState('')
  const [signupEmail, setSignupEmail] = useState('')
  const [signupPassword, setSignupPassword] = useState('')

  // Log in form state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')

  // Forgot password form state
  const [forgotEmail, setForgotEmail] = useState('')


  // Clear any stale session on mount
  useEffect(() => {
    const clearStaleSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          // Sign out to clear any stale state
          await supabase.auth.signOut()
        }
      } catch (error) {
        // Ignore errors
      }
    }
    clearStaleSession()
  }, [])

  // Clear state when switching tabs
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setError(null)
    setSuccessMessage(null)
    setEmailNotConfirmed(false)
    // Clear form fields
    setSignupName('')
    setSignupEmail('')
    setSignupPassword('')
    setLoginEmail('')
    setLoginPassword('')
    setForgotEmail('')
  }

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    setEmailNotConfirmed(false)

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: signupEmail,
        password: signupPassword,
        options: {
          emailRedirectTo: `${SITE_URL}/auth/callback`,
          data: { full_name: signupName },
        },
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (data.user) {
        // If email confirmation is required, user won't have a session
        // Always show the "Check your email" message if no session
        if (!data.session) {
          // Email confirmation required - don't log them in
          setSuccessMessage('Check your email to confirm your account. We sent a confirmation link to ' + signupEmail)
          setSignupName('')
          setSignupPassword('')
          // Keep email for resend button
        } else {
          // No email confirmation required, user is logged in
          router.replace('/dashboard')
        }
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up')
    } finally {
      setLoading(false)
    }
  }

  const handleLogIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    setEmailNotConfirmed(false)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })

      if (signInError) {
        // Check if error is due to email not confirmed
        if (signInError.message.includes('email') && (signInError.message.includes('confirm') || signInError.message.includes('verified'))) {
          setEmailNotConfirmed(true)
          setError('Please confirm your email address before signing in.')
        } else if (signInError.message.includes('Invalid login credentials') || signInError.message.includes('email_not_confirmed')) {
          // Check for specific email_not_confirmed error code
          if (signInError.message.includes('email_not_confirmed')) {
            setEmailNotConfirmed(true)
            setError('Please confirm your email address before signing in.')
          } else {
            setError('Invalid email or password. Please try again.')
          }
        } else {
          // Friendly error message for invalid credentials
          setError('Invalid email or password. Please try again.')
        }
        setLoading(false)
        return
      }

      if (data.user && data.session) {
        // Check if email is confirmed
        if (!data.user.email_confirmed_at) {
          setEmailNotConfirmed(true)
          setError('Please confirm your email address before signing in.')
          setLoading(false)
          return
        }
        // Email confirmed - redirect to dashboard
        trackEvent('auth_login', { method: 'email_password' }).catch(() => {})
        router.replace('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred during log in')
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    if (!forgotEmail) {
      setError('Please enter your email address')
      setLoading(false)
      return
    }

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })

      if (resetError) {
        setError(resetError.message)
        setLoading(false)
        return
      }

      setSuccessMessage('Password reset email sent! Check your inbox for instructions.')
      setForgotEmail('')
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    const emailToResend = loginEmail || signupEmail
    if (!emailToResend) {
      setError('Please enter your email address first')
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: emailToResend,
        options: {
          emailRedirectTo: `${SITE_URL}/auth/callback`,
        },
      })

      if (resendError) {
        setError(resendError.message)
        setLoading(false)
        return
      }

      setSuccessMessage('Confirmation email sent! Check your inbox.')
      setEmailNotConfirmed(false)
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0D0D0D] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-[#141414] rounded-2xl border border-gray-800 shadow-lg p-8">
          {/* Title */}
          <h1 className="text-3xl font-heading font-bold text-white mb-2 text-center">
            Welcome to JobAZ
          </h1>
          <p className="text-gray-400 text-center mb-8">
            {mode === 'forgot' 
              ? 'Reset your password'
              : 'Create an account or sign in to continue.'}
          </p>

          {/* Tabs - only show for signup/login */}
          {mode !== 'forgot' && (
            <div className="flex gap-2 mb-6 bg-[#1a1a1a] p-1 rounded-lg">
              <button
                onClick={() => switchMode('signup')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  mode === 'signup'
                    ? 'bg-violet-accent text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Sign up
              </button>
              <button
                onClick={() => switchMode('login')}
                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                  mode === 'login'
                    ? 'bg-violet-accent text-white shadow-md'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                Log in
              </button>
            </div>
          )}

          {/* Back button for forgot */}
          {mode === 'forgot' && (
            <button
              onClick={() => switchMode('login')}
              className="mb-4 text-sm text-violet-400 hover:text-violet-300 transition-colors"
            >
              ← Back to Log in
            </button>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <p className="text-green-400 text-sm">{successMessage}</p>
            </div>
          )}

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Sign Up Form */}
          {mode === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label htmlFor="signup-name" className="block text-sm font-medium text-gray-300 mb-2">
                  Full name
                </label>
                <input
                  id="signup-name"
                  type="text"
                  value={signupName}
                  onChange={(e) => setSignupName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-accent focus:border-transparent transition-all"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  value={signupEmail}
                  onChange={(e) => setSignupEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-accent focus:border-transparent transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-300 mb-2">
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  value={signupPassword}
                  onChange={(e) => setSignupPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-accent focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>

              {/* Resend confirmation button for signup */}
              {successMessage && signupEmail && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm mb-2">{successMessage}</p>
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={loading}
                    className="w-full py-2 px-4 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Resend confirmation email'}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-violet-accent to-violet-600 hover:from-violet-700 hover:to-violet-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>
          )}

          {/* Log In Form */}
          {mode === 'login' && (
            <form onSubmit={handleLogIn} className="space-y-4">
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-accent focus:border-transparent transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="login-password" className="block text-sm font-medium text-gray-300">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode('forgot')}
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
                  >
                    Forgot password?
                  </button>
                </div>
                <input
                  id="login-password"
                  type="password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-accent focus:border-transparent transition-all"
                  placeholder="••••••••"
                />
              </div>

              {/* Resend confirmation button */}
              {emailNotConfirmed && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-400 text-sm mb-2">Your email address hasn't been confirmed yet.</p>
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={loading}
                    className="w-full py-2 px-4 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Sending...' : 'Resend confirmation email'}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-violet-accent to-violet-600 hover:from-violet-700 hover:to-violet-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Logging in...' : 'Log in'}
              </button>
            </form>
          )}

          {/* Forgot Password Form */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#1a1a1a] border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-violet-accent focus:border-transparent transition-all"
                  placeholder="john@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-violet-accent to-violet-600 hover:from-violet-700 hover:to-violet-800 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  )
}
