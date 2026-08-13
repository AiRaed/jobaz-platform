'use client'

import { motion } from 'framer-motion'
import { Shield } from 'lucide-react'
import Link from 'next/link'
import CookieSettingsButton from '@/components/CookieSettingsButton'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen jobaz-page-bg bg-gradient-to-br from-[#050816] via-[#050617] to-[#02010f] text-slate-50 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-fuchsia-500/25 blur-3xl" />

      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-start sm:items-center gap-3 sm:gap-4 mb-6 min-w-0">
            <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 bg-violet-600/20 rounded-xl flex items-center justify-center border border-violet-600/30">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-violet-400" />
            </div>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-semibold text-slate-50 break-words min-w-0">
              Privacy Policy
            </h1>
          </div>
          <p className="text-sm text-slate-400">Last updated: August 2026</p>
          <p className="text-sm text-slate-400 mt-2 leading-relaxed max-w-2xl">
            JobAZ is an MVP platform. This policy may change as features and services grow.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-slate-900/80 rounded-2xl p-4 sm:p-8 md:p-12 border border-slate-800/60 space-y-8"
        >
          <div className="prose prose-lg max-w-none">
            <section>
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">1. Introduction</h2>
              <p className="text-slate-300 leading-relaxed">
                This Privacy Policy explains how JobAZ collects, uses, stores, and protects personal
                information when you use the platform — including Career Assistant / JAZ Career
                Coach, My Plan, CV Builder, Jobs For You, course recommendations, Career Identity /
                Profile, and related tools.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                2. Information We Collect
              </h2>
              <p className="text-slate-300 leading-relaxed">We may collect:</p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-slate-300">
                <li>
                  <strong className="text-slate-100">Account information:</strong> name, email
                  address, user ID, and login/authentication details.
                </li>
                <li>
                  <strong className="text-slate-100">Career Identity / profile:</strong> goals,
                  current focus, target roles, preferred routes, location, job preferences, skills,
                  experience, education, qualifications, licences, languages, availability, remote
                  preferences, and driving / car / willing-to-train answers.
                </li>
                <li>
                  <strong className="text-slate-100">CV and application content:</strong> CV
                  sections, summaries, skills, work experience, education, cover letters, and job
                  descriptions entered for tailoring.
                </li>
                <li>
                  <strong className="text-slate-100">Career Assistant information:</strong> answers,
                  selected career path, chosen route, selected courses, action plan, saved plan, and
                  plan progress (My Plan).
                </li>
                <li>
                  <strong className="text-slate-100">Jobs and opportunities:</strong> saved jobs,
                  applied jobs, job search keywords, clicked jobs, and saved opportunities (including
                  Jobs For You activity).
                </li>
                <li>
                  <strong className="text-slate-100">Course and affiliate interactions:</strong>{' '}
                  viewed courses, clicked course or licence links, saved course interests, and
                  provider-not-listed interest.
                </li>
                <li>
                  <strong className="text-slate-100">Optional contact data:</strong> mobile phone
                  number and country code/region if you add them.
                </li>
                <li>
                  <strong className="text-slate-100">Communication preferences:</strong> email and
                  message reminder consent, plus opt-in / opt-out timestamps.
                </li>
                <li>
                  <strong className="text-slate-100">Usage data:</strong> pages visited, buttons
                  clicked, device/browser information, analytics events, and approximate location if
                  provided by browser, IP, or analytics tools.
                </li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">3. How We Use Your Data</h2>
              <p className="text-slate-300 leading-relaxed">We use data to:</p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-slate-300">
                <li>create and manage your account</li>
                <li>save CVs, cover letters, plans, jobs, and preferences</li>
                <li>personalise Career Assistant results</li>
                <li>personalise CV Builder and Jobs For You</li>
                <li>recommend jobs, courses, licences, and opportunities</li>
                <li>track saved/applied jobs and plan progress</li>
                <li>improve the platform and fix bugs</li>
                <li>understand which features are useful</li>
                <li>detect misuse and protect the platform</li>
                <li>send reminders or updates only where you have opted in</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">4. AI and Personalisation</h2>
              <p className="text-slate-300 leading-relaxed">
                Your inputs may be processed by JobAZ AI and rule-based systems to generate career
                suggestions, plans, CV content, skills, job keywords, course recommendations, and
                next steps.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                We do not sell your raw CV or personal career data. AI outputs can be wrong or
                incomplete — always check them before you use them.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                5. Mobile Number and Message Consent
              </h2>
              <p className="text-slate-300 leading-relaxed">
                A mobile number is optional. Message reminders and updates are optional and off by
                default.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                If you opt in, JobAZ may use your number in the future for career reminders, course
                updates, opportunity alerts, or application nudges. You can opt out at any time.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                We store opt-in / opt-out status and timestamps for consent records. We do not send
                messages unless consent exists where required.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                6. Affiliate Links and External Providers
              </h2>
              <p className="text-slate-300 leading-relaxed">
                When you click affiliate or external course/provider links, you may leave JobAZ and
                visit a third-party website. Those websites have their own privacy policies.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                JobAZ may record clicks or interest for analytics and affiliate tracking. External
                providers may receive information according to their own systems if you interact with
                them directly.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">7. Third-Party Services</h2>
              <p className="text-slate-300 leading-relaxed">
                We use trusted third-party service providers to operate JobAZ. These providers
                process data only as needed to provide their services. Examples include:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-slate-300">
                <li>Supabase — authentication and database storage</li>
                <li>Google Analytics — usage analytics</li>
                <li>Job APIs / job board providers — job listing data where used</li>
                <li>Hosting providers (for example Vercel) — to run the website</li>
                <li>
                  Email or message providers — if integrated in future for reminders you opt into
                </li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                8. Legal Basis / Why We Process Data
              </h2>
              <p className="text-slate-300 leading-relaxed">We process data because:</p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-slate-300">
                <li>it is needed to provide the service you request</li>
                <li>you give consent for optional communications</li>
                <li>we have a legitimate interest in improving and securing the platform</li>
                <li>we may need to meet legal obligations</li>
              </ul>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">9. Data Sharing</h2>
              <p className="text-slate-300 leading-relaxed">
                We do not sell personal data.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                We do not share CVs or personal career data with employers, recruiters, or training
                providers unless you choose to apply externally or provide information directly to
                them.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                We may share limited technical data with service providers needed to run the
                platform.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                10. Data Storage and Security
              </h2>
              <p className="text-slate-300 leading-relaxed">
                Data is stored using Supabase and our platform hosting infrastructure. We use
                reasonable security measures, including authentication, access controls, and
                encrypted connections.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                No system can be guaranteed 100% secure.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">11. Data Retention</h2>
              <p className="text-slate-300 leading-relaxed">
                We keep account, CV, plan, saved jobs, course interests, and profile data while your
                account is active or as needed to provide the service.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                You can delete or reset certain data from the dashboard where available. Some
                technical logs or consent records may be kept for security, analytics, or legal
                reasons.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">12. User Rights</h2>
              <p className="text-slate-300 leading-relaxed">
                You may request access, correction, deletion, or restriction of your personal data.
                You can update profile, CV, and plan information in the platform, and opt out of
                optional communications.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                For requests, contact us through the support options inside JobAZ or email{' '}
                <a
                  href="mailto:support@jobaz.io"
                  className="text-violet-400 hover:text-violet-300 underline"
                >
                  support@jobaz.io
                </a>
                .
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                13. Cookies and Analytics
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ uses essential cookies and similar storage for login, security, preferences,
                and platform functionality. These are needed for JobAZ to work and do not require
                analytics consent.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                Analytics cookies (including Google Analytics) are optional. They are used only if
                you click “Accept analytics” on the cookie banner. If you choose “Reject
                non-essential”, analytics cookies are not loaded and we will not send Google
                Analytics events.
              </p>
              <p className="text-slate-300 leading-relaxed mt-4">
                You can change your cookie preferences later using “Cookie settings” in the footer
                or support area. You can also manage cookies through your browser settings.
              </p>
              <p className="mt-3">
                <CookieSettingsButton className="text-sm font-medium text-violet-400 hover:text-violet-300 underline underline-offset-2" />
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">14. Children</h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ is intended for users aged 16+ or working-age users seeking career support. If
                a younger person uses the platform, a parent or guardian should supervise. We do not
                knowingly collect data from children under 13.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">
                15. Changes to Privacy Policy
              </h2>
              <p className="text-slate-300 leading-relaxed">
                JobAZ may update this policy as features change. Continued use after updates means
                you have read the latest version.
              </p>
            </section>

            <section className="mt-8">
              <h2 className="text-2xl font-semibold mb-4 text-slate-50">16. Contact</h2>
              <p className="text-slate-300 leading-relaxed">
                Questions about privacy? Contact us through the support options inside JobAZ, or
                email{' '}
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
            ← Back to JobAZ
          </Link>
          <CookieSettingsButton className="text-sm text-slate-400 hover:text-violet-300 transition-colors" />
        </motion.div>
      </div>
    </div>
  )
}
