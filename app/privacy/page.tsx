'use client'

import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#050617] to-[#02010f] text-slate-50 relative overflow-hidden">
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-40 -left-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-fuchsia-500/25 blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center border border-violet-600/30">
              <Shield className="w-6 h-6 text-violet-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-semibold text-slate-50">
              Privacy Policy
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Last updated: January 2026
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/80 rounded-2xl p-8 md:p-12 border border-slate-800/60 space-y-8"
        >
          <div className="prose prose-lg max-w-none">
            <p className="text-slate-300 leading-relaxed">
              At JobAZ, we respect your privacy. This policy outlines how we collect, use, and protect your information when you use our website and services.
            </p>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                1. Data We Collect
              </h2>
              <p className="text-slate-300 leading-relaxed">
                We collect information you provide when using JobAZ, including:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-slate-300">
                <li>Account information (email address, name) for authentication</li>
                <li>CVs you create and save on the platform</li>
                <li>Cover letters you create and save</li>
                <li>Saved jobs and applied jobs you track</li>
                <li>Career-related information you provide in Build Your Path, including your education, experience, skills, and career goals</li>
                <li>Anonymous usage data through Google Analytics to understand how our platform is used</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                2. How We Store Your Data
              </h2>
              <p className="text-slate-300 leading-relaxed">
                Your data is securely stored using Supabase, our authentication and database provider. Supabase handles all user authentication and securely stores your CVs, cover letters, saved jobs, applied jobs, and Build Your Path information. All data is encrypted and protected with industry-standard security measures.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                3. How We Use Data
              </h2>
              <p className="text-slate-300 leading-relaxed">
                We use your data to provide and improve JobAZ services, including storing your CVs and cover letters, tracking your saved and applied jobs, powering Build Your Path career recommendations, and maintaining your account. We use Google Analytics to understand how our platform is used and improve functionality.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                <strong className="text-slate-50">We do not sell your data.</strong> We may process your data through trusted service providers (like Supabase for authentication and database storage, and Google Analytics for usage analytics) solely to operate and improve JobAZ. These providers are bound by strict privacy and security requirements.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                4. Career Tools & Build Your Path
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ provides AI-powered career tools including a CV builder, cover letter creation, job tracking, and the "Build Your Path" feature. These tools allow users to explore career options, save progress, and receive personalized recommendations.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                Any information entered into these tools (such as CV content, summaries, preferences, or career-related inputs) is stored securely and used only to personalize the user experience, improve functionality, and allow users to access their data across devices and sessions.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                JobAZ does not sell, rent, or share this information with third parties.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                5. Your Rights
              </h2>
              <p className="text-slate-300 leading-relaxed">
                You can access, update, or delete your data at any time through your account settings. You can delete your CVs, cover letters, saved jobs, and Build Your Path data directly in the platform. To delete your account or request data correction, contact us through the support page.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                6. Account Deletion & Data Removal
              </h2>
              <p className="text-slate-300 leading-relaxed">
                Users have the right to delete their account at any time.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                When an account is deleted, all associated personal data — including CVs, cover letters, saved jobs, and related records — is permanently removed from our systems, except where retention is required by law.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                Account deletion can be initiated directly from the user dashboard. This action is irreversible.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                If you experience any issues deleting your account, you may contact us via the support page.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                7. Security
              </h2>
              <p className="text-slate-300 leading-relaxed">
                We use modern encryption and secure protocols (SSL/TLS) to protect all user information. Your data is stored securely through Supabase with industry-standard security measures. We regularly review and update our security practices to keep your information safe.
              </p>
            </section>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center"
        >
          <Link
            href="/"
            className="text-violet-400 hover:text-violet-300 hover:underline inline-flex items-center gap-2 transition-colors"
          >
            ← Back to JobAZ
          </Link>
        </motion.div>
      </div>
    </div>
  )
}



