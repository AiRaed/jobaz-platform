'use client'

import LandingCareerJourneys from './landing/LandingCareerJourneys'
import LandingFinalCta from './landing/LandingFinalCta'
import LandingHowItWorks from './landing/LandingHowItWorks'
import LandingJazPanel from './landing/LandingJazPanel'
import LandingPillars from './landing/LandingPillars'
import LandingStats from './landing/LandingStats'
import LandingWhyJobaz from './landing/LandingWhyJobaz'
import { PublicJobFinderPanel } from './PublicJobFinder'

export default function LandingHero() {
  return (
    <>
      <section className="relative pt-4 pb-6 md:pb-10">
        <div className="text-center mb-8 md:mb-10 max-w-3xl mx-auto">
          <p className="text-xs md:text-sm text-violet-300/90 mb-2 tracking-wide">
            Your AI career companion for the UK
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            <span className="bg-gradient-to-r from-[#D9C8FF] via-[#BCA8FF] to-[#9B7FFF] bg-clip-text text-transparent">
              Find work. Build your future.
            </span>
          </h1>
          <p className="text-sm md:text-lg text-slate-300/90 leading-relaxed">
            Search UK jobs, discover professional courses, and let JAZ build your personalised UK
            career roadmap.
          </p>
        </div>

        <div className="mb-10 md:mb-12">
          <LandingJazPanel />
        </div>

        <LandingPillars />
      </section>

      <LandingWhyJobaz />
      <LandingHowItWorks />
      <LandingCareerJourneys />
      <LandingStats />

      <section id="job-search" className="py-8 md:py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-50 mb-2">Explore UK job openings</h2>
          <p className="text-slate-400 text-sm md:text-base">
            Search live roles — create an account only when you&apos;re ready to apply.
          </p>
        </div>
        <PublicJobFinderPanel variant="section" maxCards={6} />
      </section>

      <LandingFinalCta />
    </>
  )
}
