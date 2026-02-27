import Link from 'next/link'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#050816] via-[#050617] to-[#02010f] text-slate-50 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-40 -left-24 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-fuchsia-500/25 blur-3xl" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 md:px-8 py-12 md:py-20">
        <h1 className="text-4xl md:text-5xl font-heading font-bold text-white mb-8">
          About JobAZ
        </h1>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">What JobAZ Is</h2>
          <p className="text-slate-300 text-lg leading-relaxed">
            JobAZ is an AI career assistant that supports you through every stage of your job search. From building your CV and finding roles to tailoring applications, preparing for interviews, and improving your writing, JobAZ helps you present your best self to employers with confidence.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">What You Can Do with JobAZ</h2>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              <span><strong className="text-slate-200">AI CV Builder</strong> — Create and optimize your CV with AI guidance.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              <span><strong className="text-slate-200">Job Matching</strong> — Find relevant job opportunities that fit your profile.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              <span><strong className="text-slate-200">CV Tailoring</strong> — Adapt your CV to each job description automatically.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              <span><strong className="text-slate-200">Cover Letter Generator</strong> — Draft and refine cover letters for each application.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              <span><strong className="text-slate-200">Interview Preparation</strong> — Practice with AI in text and voice so you feel ready on the day.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              <span><strong className="text-slate-200">Writing Review & Proofreading</strong> — Improve any text with AI-powered feedback.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              <span><strong className="text-slate-200">Career Path Exploration (Build Your Path)</strong> — Explore realistic career routes and skill paths.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-violet-400 mt-0.5">•</span>
              <span><strong className="text-slate-200">Multilingual Support</strong> — Use the platform and refine your content in multiple languages.</span>
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">Who It&apos;s For</h2>
          <p className="text-slate-300 leading-relaxed">
            JobAZ is for job seekers at every stage: people looking for their first role, career changers repositioning their experience, migrants building a profile in a new market, and students preparing to enter the workforce. Whatever your background, JobAZ helps you tell your story clearly and compete with confidence.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-white mb-3">Our Mission</h2>
          <p className="text-slate-300 leading-relaxed">
            We believe everyone deserves access to tools that help them find work with confidence. JobAZ is built to be accessible and practical—so you can focus on your next opportunity, not on struggling with applications alone.
          </p>
        </section>

        <p className="text-slate-300 mb-2">
          Contact: <a href="mailto:support@jobaz.io" className="text-violet-400 hover:text-violet-300 transition-colors">support@jobaz.io</a>
        </p>
        <p className="text-slate-400 text-sm">
          Created by Raed Mahfoud — Independent AI product creator.
        </p>
        <div className="mt-10">
          <Link href="/" className="text-violet-400 hover:text-violet-300 transition-colors text-sm font-medium">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
