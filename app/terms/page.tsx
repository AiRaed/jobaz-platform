'use client'

import { motion } from 'framer-motion'
import { Scale } from 'lucide-react'
import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden bg-gradient-to-br from-[#050617] via-[#0b0820] to-[#050814] text-white">
      {/* Glowing orbs for ambient effect */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-64 w-64 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center border border-violet-500/30">
              <Scale className="w-6 h-6 text-violet-400" />
            </div>
            <h1 className="text-4xl md:text-5xl font-heading font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Terms & Conditions
            </h1>
          </div>
          <p className="text-sm text-slate-400">
            Last updated: October 2025
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-8 md:p-12 border border-slate-800/60 shadow-2xl space-y-8"
        >
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                1. Service Overview
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ is an AI-powered career platform designed to help users create and improve CVs, generate cover letters, search for jobs, and prepare for interviews.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                All tools are provided for personal and professional assistance only. JobAZ does not act as an employer, recruiter, or hiring authority.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                2. AI-Generated Content & Career Guidance
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ uses artificial intelligence to generate CV content, summaries, career suggestions, and guidance tools such as Build Your Path.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                All AI-generated content is provided for informational and assistance purposes only and does not constitute professional, legal, or employment advice.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                Users are fully responsible for reviewing, editing, and validating any generated content before using it in real job applications.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                3. Free Use & Donations
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ is currently provided free of charge.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                Users may choose to support the platform through voluntary donations (such as Buy Me a Coffee).
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                Donations are optional and do not unlock mandatory features or guarantee any outcomes.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                4. Job Listings & Third-Party Platforms
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ aggregates job listings from third-party sources, including but not limited to Adzuna and other external job boards or employer websites.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                When viewing or applying for a job, users may be redirected to an external website.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                JobAZ does not control, own, or operate these third-party websites and is not responsible for their content, availability, or application processes.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                5. No Guarantee of Employment
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ provides tools and guidance to support job searching and career preparation.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                We do not guarantee interviews, job offers, or hiring outcomes. All employment decisions are made solely by employers.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                6. Intellectual Property
              </h2>
              <p className="text-slate-300 leading-relaxed">
                All JobAZ branding, design elements, and platform features remain the intellectual property of JobAZ.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                Users retain ownership of their personal CV content and may use generated documents freely for personal job applications.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                7. Limitation of Liability
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ is not liable for:
              </p>
              <ul className="list-disc list-inside text-slate-300 leading-relaxed mt-4 space-y-2 ml-4">
                <li>Employment outcomes</li>
                <li>Rejected applications</li>
                <li>Losses resulting from the use of third-party job platforms</li>
                <li>Decisions made by employers or recruiters</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                8. Acceptable Use
              </h2>
              <p className="text-slate-300 leading-relaxed">
                Users must not misuse the platform, generate misleading content, impersonate others, or use JobAZ for unlawful purposes.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                9. Account Suspension or Termination
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ reserves the right to suspend or terminate accounts that violate the Terms or misuse the platform.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                10. Updates to Terms
              </h2>
              <p className="text-slate-300 leading-relaxed">
                These Terms & Conditions may be updated periodically to reflect platform improvements or legal requirements. Continued use of JobAZ implies acceptance of the latest version.
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
            ← Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
