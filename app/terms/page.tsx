'use client'

import { motion } from 'framer-motion'
import { Scale } from 'lucide-react'
import Link from 'next/link'
import CookieSettingsButton from '@/components/CookieSettingsButton'

export default function TermsPage() {
  return (
    <div className="min-h-screen relative overflow-x-hidden jobaz-page-bg text-[var(--text-primary)] bg-gradient-to-br from-[#050617] via-[#0b0820] to-[#050814] text-white">
      <div className="pointer-events-none absolute -top-32 -left-24 h-64 w-64 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-fuchsia-500/20 blur-3xl" />

      <div className="relative max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-6 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-violet-600/20 rounded-xl flex items-center justify-center border border-violet-500/30">
              <Scale className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" />
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-heading font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent break-words min-w-0">
              Terms & Conditions
            </h1>
          </div>
          <p className="text-sm text-slate-400">Last updated: August 2026</p>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-2xl">
            JobAZ is an MVP platform. Features, providers, pricing, and these terms may change as
            we improve the product.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/40 backdrop-blur-sm rounded-2xl p-4 sm:p-8 md:p-12 border border-slate-800/60 shadow-2xl space-y-8"
        >
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <section>
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                1. Service Overview
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ is an AI-powered UK career support platform. It helps users explore career
                routes, build CVs, prepare applications, find jobs, discover courses and licences,
                and manage a personal career plan (including Career Assistant / JAZ Career Coach,
                My Plan, CV Builder, Jobs For You, and related tools).
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                JobAZ provides tools and guidance only. JobAZ is not an employer, recruiter,
                training provider, university, legal adviser, immigration adviser, financial
                adviser, medical adviser, or hiring authority.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                2. AI Career Guidance
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ uses AI and rule-based career logic to generate suggestions, career paths, CV
                content, skills, course ideas, job-search keywords, and action plans.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                AI-generated content may be incomplete, inaccurate, outdated, or not suitable for
                every user. You are responsible for reviewing and editing all content before you
                use it.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                Career suggestions are informational only. They are not professional career, legal,
                immigration, financial, medical, or employment advice.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                3. My Plan / Career Assistant / CV Builder
              </h2>
              <p className="text-slate-300 leading-relaxed">
                You may create career plans based on your answers, profile information, CV
                information, and saved preferences. Plans are designed to support decision-making.
                They do not guarantee outcomes.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                CV Builder and CV tailoring tools help you draft content, but you must check that
                everything is accurate before using it in applications.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                You must not include false qualifications, false work experience, false licences, or
                other misleading claims in applications.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                4. Jobs and Third-Party Job Listings
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ may show job listings from third-party APIs, job boards, employers, or
                external websites (including Jobs For You recommendations and Job Finder results).
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                JobAZ does not own, control, or guarantee those listings. Job details, salaries,
                locations, availability, and application processes may change.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                Always check details on the employer or job board website before applying. JobAZ
                does not guarantee interviews, job offers, employment outcomes, or a response from
                employers.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                5. Courses, Licences, Training Providers and Affiliate Links
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ may recommend courses, licences, training, or providers based on your career
                plan or profile.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                Some links may be affiliate links. JobAZ may receive a commission if you click,
                book, or purchase through those links, at no extra cost to you. Affiliate commission
                does not mean a course is right for you.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                Before buying or applying, check provider details, prices, eligibility, course
                content, accreditation, licence requirements, refund policies, and suitability.
                JobAZ does not provide the courses and is not responsible for third-party provider
                quality, availability, pricing, refunds, certification, or outcomes.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                If a provider is not listed, JobAZ may show messages such as “coming soon”,
                “provider not listed”, or “search courses later”.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                6. No Guarantee of Employment, Qualifications or Outcomes
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ does not guarantee jobs, interviews, course acceptance, licence approval,
                qualification recognition, salary, visa outcome, career progression, or income.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                Final decisions are made by employers, providers, regulators, or you.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                7. User Accounts and Data Accuracy
              </h2>
              <p className="text-slate-300 leading-relaxed">
                You are responsible for keeping your account, Career Identity / profile, CV, phone
                number (if provided), and career information accurate.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                You must not misuse the platform, submit unlawful content, impersonate others, or
                create misleading applications.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                8. Optional Mobile Number and Reminders
              </h2>
              <p className="text-slate-300 leading-relaxed">
                You may optionally provide a mobile number and optionally opt in to future reminders
                or opportunity updates. A mobile number is not required to use JobAZ.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                JobAZ will not send marketing messages unless you have opted in where required. You
                can turn off message reminders or withdraw consent at any time in your profile
                settings.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                9. Free Use, Donations and Future Paid Features
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ may currently provide some features free of charge. We may add paid features,
                donations, subscriptions, premium tools, provider partnerships, or affiliate revenue
                in the future.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                Donations, if available, are voluntary and do not guarantee outcomes.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                10. Acceptable Use
              </h2>
              <p className="text-slate-300 leading-relaxed">Users must not:</p>
              <ul className="list-disc list-inside text-slate-300 leading-relaxed mt-4 space-y-2 ml-4">
                <li>misuse the platform</li>
                <li>attempt to hack, scrape, overload, or disrupt the service</li>
                <li>upload malicious content</li>
                <li>
                  generate misleading, fraudulent, discriminatory, harmful, or unlawful content
                </li>
                <li>impersonate another person</li>
                <li>use JobAZ to submit false job applications</li>
              </ul>
              <p className="text-slate-300 leading-relaxed mt-4">
                JobAZ may suspend or terminate accounts that break these rules.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                11. Limitation of Liability
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ is provided on an “as is” and “as available” basis.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                JobAZ is not responsible for losses caused by reliance on AI suggestions,
                third-party links, course providers, job listings, user mistakes, outages, or data
                entered incorrectly.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                Nothing in these terms limits liability where it cannot legally be limited.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">
                12. Changes to the Platform or Terms
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ may update features, pricing, providers, course links, job integrations, and
                these terms. Continued use means you accept the updated terms.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-heading font-semibold mb-4 text-white">13. Contact</h2>
              <p className="text-slate-300 leading-relaxed">
                Contact us through the support options inside JobAZ, or email{' '}
                <a
                  href="mailto:support@jobaz.io"
                  className="text-violet-400 hover:text-violet-300 underline"
                >
                  support@jobaz.io
                </a>
                .
              </p>
            </section>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-8 text-center flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6"
        >
          <Link
            href="/"
            className="text-violet-400 hover:text-violet-300 hover:underline inline-flex items-center gap-2 transition-colors"
          >
            ← Back to Home
          </Link>
          <CookieSettingsButton className="text-sm text-slate-400 hover:text-violet-300 transition-colors" />
        </motion.div>
      </div>
    </div>
  )
}
