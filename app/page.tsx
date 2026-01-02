'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { 
  Briefcase, 
  ChevronDown,
  ChevronUp,
  Compass
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Logo from '@/components/Logo'

export default function LandingPage() {
  const router = useRouter()
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginError, setLoginError] = useState<string | null>(null)
  const [cvQualityPercent, setCvQualityPercent] = useState(85)

  // CV Quality animation: animate from 85% to 100%, hold, then reset
  useEffect(() => {
    let animationFrame: number
    let startTime: number | null = null
    const duration = 3000 // 3s to go from 85% to 100%
    const holdDuration = 1000 // 1s hold at 100%
    const resetDuration = 800 // 0.8s to reset back to 85%
    const totalDuration = duration + holdDuration + resetDuration

    const easeInOut = (t: number): number => {
      return t < 0.5 
        ? 2 * t * t 
        : 1 - Math.pow(-2 * t + 2, 2) / 2
    }

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const cycle = elapsed % totalDuration

      if (cycle < duration) {
        // Animate from 85% to 100%
        const progress = easeInOut(cycle / duration)
        setCvQualityPercent(85 + (15 * progress))
      } else if (cycle < duration + holdDuration) {
        // Hold at 100%
        setCvQualityPercent(100)
      } else {
        // Reset to 85%
        const resetProgress = (cycle - duration - holdDuration) / resetDuration
        setCvQualityPercent(100 - (15 * resetProgress))
      }

      animationFrame = requestAnimationFrame(animate)
    }

    animationFrame = requestAnimationFrame(animate)
    return () => {
      if (animationFrame) cancelAnimationFrame(animationFrame)
    }
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginLoading(true)
    setLoginError(null)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: loginEmail,
        password: loginPassword,
      })
      if (error) throw error
      router.push('/dashboard')
    } catch (error: any) {
      setLoginError(error.message || 'Sign in failed')
      setLoginLoading(false)
    }
  }

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index)
  }

  return (
    <div className="relative overflow-x-hidden bg-gradient-to-br from-[#050617] via-[#0b0820] to-[#050814] text-white">
      {/* Glowing orbs for ambient effect */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-64 w-64 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />
      
      <div className="relative max-w-7xl mx-auto px-4 md:px-8">
        {/* Header */}
      <header className="pt-4 md:pt-4">
        <div className="max-w-6xl mx-auto px-4 md:px-8 flex items-center justify-between gap-4">
          {/* LEFT: JobAZ logo */}
          <Link href="/" className="flex flex-col items-center gap-1">
            <Logo />
            <span className="text-[9px] md:text-[11px] font-normal text-slate-400/75 whitespace-nowrap max-w-[120px] md:max-w-[150px] lg:max-w-[180px] text-center">
              Present your skills with confidence.
            </span>
          </Link>
          
          {/* RIGHT: email input, password input, Sign in button, Get Started button */}
          <div className="flex items-end gap-2 md:gap-3">
            <div className="flex flex-col items-end gap-2">
              {loginError && (
                <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs max-w-xs">
                  {loginError}
                </div>
              )}
              <form onSubmit={handleSignIn} className="flex items-end gap-2 md:gap-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(e) => {
                    setLoginEmail(e.target.value)
                    setLoginError(null)
                  }}
                  className="rounded-full bg-slate-900/80 border border-slate-700 text-slate-100 placeholder:text-slate-400 px-4 py-2 text-xs md:text-sm h-[38px]"
                  required
                />
                <div className="flex flex-col gap-1">
                  <Link
                    href="/auth?mode=forgot"
                    className="text-xs text-violet-400 hover:text-violet-300 transition-colors text-right px-2 mb-1"
                  >
                    Forgot password?
                  </Link>
                  <input
                    type="password"
                    placeholder="Password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value)
                      setLoginError(null)
                    }}
                    className="rounded-full bg-slate-900/80 border border-slate-700 text-slate-100 placeholder:text-slate-400 px-4 py-2 text-xs md:text-sm h-[38px]"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="rounded-full bg-slate-900/80 border border-violet-400/70 text-slate-100 px-4 py-2 text-xs md:text-sm hover:bg-violet-600/20 transition h-[38px] whitespace-nowrap"
                >
                  {loginLoading ? 'Signing in...' : 'Log in'}
                </button>
              </form>
            </div>
            <Link 
              href="/auth"
              className="rounded-full bg-violet-600 px-4 py-2 text-xs md:text-sm font-medium text-white border border-violet-400 shadow-[0_0_20px_rgba(139,92,246,0.7)] hover:bg-violet-500 transition h-[38px] flex items-center whitespace-nowrap"
            >
              Get started for free
            </Link>
          </div>
        </div>
        <div className="mt-3 h-px w-full bg-gradient-to-r from-transparent via-violet-500/40 to-transparent" />
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 pt-4 pb-12 md:pt-6 md:pb-20 relative">
        {/* Subtle JAZ watermark/glow background */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.12]"
          style={{
            backgroundImage: `url('/jaz/jaz-eye.png')`,
            backgroundSize: '600px 600px',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            filter: 'blur(40px)',
          }}
        />
        <div className="relative text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-5xl font-heading font-bold mb-6 leading-tight relative">
            {/* Subtle radial gradient behind headline */}
            <span 
              className="absolute inset-0 -z-10 opacity-[0.1]"
              style={{
                background: 'radial-gradient(circle at center, rgba(139, 92, 246, 0.3) 0%, rgba(5, 6, 23, 0.8) 70%, transparent 100%)',
                filter: 'blur(60px)',
                transform: 'scale(1.2)',
              }}
            />
            <span className="bg-gradient-to-r from-[#D9C8FF] to-[#BCA8FF] bg-clip-text text-transparent relative z-10">
              CVs, jobs, cover letters, and interviews — all in one place.
            </span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300/80 mb-8 leading-relaxed max-w-3xl mx-auto">
            Build your CV with AI, find matching jobs, tailor each application, and prepare for interviews — guided by JAZ. Not ready to apply yet? Use Build Your Path to explore career routes and become job-ready. Simple, accessible, and multilingual.
          </p>
          
          {/* AI Dashboard Strip */}
          <div className="mb-8 max-w-4xl mx-auto">
            <div className="relative backdrop-blur-xl bg-slate-900/30 border border-slate-700/40 rounded-2xl p-6 shadow-[0_8px_32px_rgba(0,0,0,0.3)]">
              <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-12">
                {/* CV Quality Module */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="rgba(139, 92, 246, 0.2)"
                        strokeWidth="4"
                        fill="none"
                      />
                      <circle
                        cx="32"
                        cy="32"
                        r="28"
                        stroke="rgba(139, 92, 246, 0.6)"
                        strokeWidth="4"
                        fill="none"
                        strokeDasharray={2 * Math.PI * 28}
                        strokeDashoffset={2 * Math.PI * 28 * (1 - cvQualityPercent / 100)}
                        style={{
                          strokeLinecap: 'round',
                        }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-semibold text-violet-300/90">{Math.round(cvQualityPercent)}%</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">CV Quality</span>
                </div>

                {/* Job Match Module */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="flex items-end justify-center gap-0.5 h-12">
                      {[0.4, 0.65, 0.55, 0.75, 0.85, 0.7, 0.9, 0.95].map((baseHeight, i) => (
                        <div
                          key={i}
                          className="w-1.5 bg-gradient-to-t from-violet-600/80 to-violet-400/60 rounded-t"
                          style={{
                            height: `${baseHeight * 100}%`,
                            minHeight: '4px',
                            transformOrigin: 'bottom',
                            animation: `pulse-sparkline 3s ease-in-out infinite`,
                            animationDelay: `${i * 0.15}s`,
                            filter: 'drop-shadow(0 0 2px rgba(139, 92, 246, 0.4))',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Job Match</span>
                </div>

                {/* Interview Ready Module */}
                <div className="flex flex-col items-center gap-2">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="flex items-center gap-1.5">
                      {[1, 2, 3].map((dot, i) => (
                        <div
                          key={i}
                          className="w-2 h-2 rounded-full bg-violet-600/60"
                          style={{
                            animation: `dot-fill 6s ease-in-out infinite`,
                            animationDelay: `${i * 1.5}s`,
                            boxShadow: i === 2 ? '0 0 6px rgba(139, 92, 246, 0.6)' : 'none',
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-xs text-slate-400 font-medium">Interview Ready</span>
                </div>

                {/* Build Your Path Module */}
                <Link 
                  href="/build-your-path"
                  className="flex flex-col items-center gap-2 cursor-pointer group"
                >
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <Compass 
                      className="w-16 h-16 text-violet-400/70 group-hover:text-violet-300 transition-colors"
                      strokeWidth={2.5}
                      style={{
                        animation: 'compass-pulse-rotate 4s ease-in-out infinite',
                        filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.4))',
                      }}
                    />
                  </div>
                  <span className="text-xs text-slate-400 font-medium group-hover:text-violet-300/80 transition-colors">Build Your Path</span>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Section transition - soft visual separation */}
          <div className="mt-12 mb-8 max-w-2xl mx-auto">
            <div className="h-px bg-gradient-to-r from-transparent via-violet-500/20 to-transparent" />
          </div>
          
          {/* Support JobAZ Section */}
          <div className="mb-6 max-w-2xl mx-auto">
            <h3 className="text-lg md:text-xl font-medium text-gray-400/80 mb-2">
              Why JobAZ is free
            </h3>
            <p className="text-sm md:text-base text-gray-300/70 mb-3">
              JobAZ is free to make job hunting accessible to everyone — especially people who can't afford expensive tools.
              <br /><br />
              If JobAZ helped you, consider a small donation — only if you can afford it — to help keep it free for others.
            </p>
            <a
              href="https://buymeacoffee.com/jobaz.support"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-slate-900/60 border border-violet-500/40 text-violet-200 hover:border-violet-400/60 hover:bg-slate-900/80 hover:text-violet-100 transition-all duration-300 text-sm md:text-base font-medium"
            >
              <svg 
                width="14" 
                height="14" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                className="text-violet-200"
                style={{ width: '14px', height: '14px' }}
              >
                <path d="M18 8h1a4 4 0 0 1 0 8h-1" />
                <path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z" />
                <line x1="6" y1="1" x2="6" y2="4" />
                <line x1="10" y1="1" x2="10" y2="4" />
                <line x1="14" y1="1" x2="14" y2="4" />
              </svg>
              Support JobAZ — Keep it free for everyone
            </a>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/auth"
              className="cta-premium-glow bg-gradient-to-br from-[#9b5cff] to-[#8a4ae8] hover:from-[#8a4ae8] hover:to-[#7a3ad8] text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 relative"
            >
              Get started for free
            </Link>
            <Link
              href="/auth"
              className="border-2 border-violet-400/60 hover:border-violet-400 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300"
            >
              Log in
            </Link>
          </div>
        </div>
      </section>


      {/* AI Assistant Section (JAZ) */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-center mb-6 text-white">
          Meet JAZ — your AI job search assistant
        </h2>
        <p className="text-center text-xl text-gray-300/80 max-w-3xl mx-auto">
          JAZ is your AI assistant, helping you improve your CV, prepare for interviews, and use the platform in your preferred language.
        </p>
      </section>

      {/* Who is JobAZ for Section */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-2xl md:text-3xl font-heading font-bold text-center mb-12 text-white">
          Who is JobAZ for?
        </h2>
        
        <div className="max-w-3xl mx-auto">
          <ul className="space-y-4 text-lg">
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#CBB6FF] flex-shrink-0 mt-2"></div>
              <span className="text-gray-300/80">People looking for their first job in the UK</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#CBB6FF] flex-shrink-0 mt-2"></div>
              <span className="text-gray-300/80">Career changers who don't know how to present their experience</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#CBB6FF] flex-shrink-0 mt-2"></div>
              <span className="text-gray-300/80">Busy people who don't want to waste hours on CV and cover letters</span>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[#CBB6FF] flex-shrink-0 mt-2"></div>
              <span className="text-gray-300/80">Anyone who wants AI guidance from CV to interview</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Final CTA Section */}
      <section id="pricing" className="max-w-5xl mx-auto px-4 py-20">
        <div className="max-w-2xl mx-auto rounded-2xl border border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)] p-12 text-center">
          <Link 
            href="/auth"
            className="cta-premium-glow inline-block bg-gradient-to-br from-[#9b5cff] to-[#8a4ae8] hover:from-[#8a4ae8] hover:to-[#7a3ad8] text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 mb-3 relative"
          >
            Get started for free
          </Link>
          <p className="text-sm text-gray-400">
            No credit card required.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <h2 className="text-4xl md:text-5xl font-heading font-bold text-center mb-12 text-white">
          Frequently asked questions
        </h2>
        
        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              q: "Is JobAZ just a CV builder?",
              a: "No, JobAZ is a complete job search platform. We help you build your CV, find matching jobs, create tailored cover letters, and train for interviews — all in one place."
            },
            {
              q: "Can I use my existing CV?",
              a: "Yes! You can upload your existing CV and we'll help you optimize it, or use it to find matching jobs and generate tailored applications."
            },
            {
              q: "Will JobAZ apply to jobs for me?",
              a: "No, JobAZ doesn't automatically apply to jobs. We help you create tailored CVs and cover letters for each position, but you control when and how you submit your applications."
            },
            {
              q: "Do I need perfect English to use the platform?",
              a: "Not at all! JobAZ supports multiple languages and can help you create professional CVs and cover letters even if English isn't your first language."
            },
            {
              q: "How does the AI interview training work?",
              a: "Our AI interview coach asks you realistic questions based on the job you're applying for. You can practice your answers, get instant feedback, and improve your confidence before the real interview."
            }
          ].map((faq, index) => (
            <div 
              key={index}
              className={`rounded-2xl border backdrop-blur-sm overflow-hidden transition-all duration-300 ${
                openFaq === index
                  ? 'border-violet-400/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)]'
                  : 'border-slate-700/60 bg-slate-950/70 shadow-[0_18px_40px_rgba(15,23,42,0.9)]'
              }`}
            >
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-slate-900/50 transition-colors"
              >
                <span className={`font-semibold text-lg ${openFaq === index ? 'text-violet-200' : 'text-white'}`}>
                  {faq.q}
                </span>
                {openFaq === index ? (
                  <ChevronUp className="w-5 h-5 text-violet-400" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400" />
                )}
              </button>
              {openFaq === index && (
                <div className="px-6 pb-4 text-violet-200/90">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="border-t border-slate-700/60 bg-slate-950/50 backdrop-blur-sm" data-no-translate>
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Briefcase className="w-5 h-5 text-violet-400" />
                <span className="text-lg font-heading font-bold text-white">JobAZ</span>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-white">Company</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="#" className="hover:text-violet-300 transition-colors">About</Link>
                </li>
                <li>
                  <a href="mailto:jobaz.app@outlook.com" className="hover:text-violet-300 transition-colors">jobaz.app@outlook.com</a>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-white">Legal</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/privacy" className="hover:text-violet-300 transition-colors">Privacy Policy</Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-violet-300 transition-colors">Terms & Conditions</Link>
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-3 text-white">Quick Links</h4>
              <ul className="space-y-2 text-gray-400">
                <li>
                  <Link href="/dashboard" className="hover:text-violet-300 transition-colors">Dashboard</Link>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-slate-700/60 text-center text-gray-400">
            <p>Built to help you get the job you deserve.</p>
            <p className="mt-2 text-sm">© 2025 JobAZ. All rights reserved.</p>
          </div>
        </div>
      </footer>
      </div>
    </div>
  )
}
