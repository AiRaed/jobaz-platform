'use client'

import Link from 'next/link'
import { ArrowRight, Sparkles } from 'lucide-react'
import AiCareerInsights from '@/components/dashboard/AiCareerInsights'
import type { CareerJourneySnapshot } from '@/lib/career-journey/types'
import type { RecommendedTrainingRoute } from '@/lib/career-hub/trainingPlan'
import { careerHubPathHref } from '@/lib/career-hub/myPlan'

type Props = {
  snapshot: CareerJourneySnapshot | null
  trainingRoutes: RecommendedTrainingRoute[]
}

export default function AiCareerRecommendationsSection({ snapshot, trainingRoutes }: Props) {
  const activeRoute = trainingRoutes[0]
  const fallbackCards = buildFallbackCards(snapshot, activeRoute)

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-6">
      <div className="flex items-center gap-2 mb-5">
        <Sparkles className="w-4 h-4 text-violet-400" />
        <h3 className="text-lg font-semibold text-slate-100">AI Career Recommendations</h3>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 mb-6">
        {fallbackCards.map((card) => (
          <Link
            key={card.id}
            href={card.href}
            className="rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 hover:border-violet-500/40 hover:bg-violet-500/5 transition group"
          >
            <p className="text-sm text-slate-200 leading-relaxed group-hover:text-violet-100 transition">
              {card.text}
            </p>
            <span className="inline-flex items-center gap-1 text-xs text-violet-400 mt-3 font-medium">
              {card.action}
              <ArrowRight className="w-3 h-3" />
            </span>
          </Link>
        ))}
      </div>

      <AiCareerInsights embedded />
    </section>
  )
}

function buildFallbackCards(
  snapshot: CareerJourneySnapshot | null,
  activeRoute?: RecommendedTrainingRoute
) {
  const cards: { id: string; text: string; action: string; href: string }[] = []

  if (activeRoute) {
    cards.push({
      id: 'route-fastest',
      text: `${activeRoute.categoryLabel} remains your fastest route to employment.`,
      action: 'View route',
      href: careerHubPathHref(activeRoute.pathId),
    })
    if (/sia|security/i.test(activeRoute.nextStepLabel)) {
      cards.push({
        id: 'sia-training',
        text: 'Completing SIA training could increase employability significantly.',
        action: 'Find SIA courses',
        href: careerHubPathHref(activeRoute.pathId),
      })
    }
  }

  const altPath = snapshot?.profile?.pathTriad?.buildNext?.[0]
  if (altPath) {
    cards.push({
      id: 'alt-route',
      text: `You may also be suitable for ${altPath.title} roles.`,
      action: 'Explore options',
      href: '/uk-career-assistant',
    })
  }

  if (cards.length === 0) {
    cards.push({
      id: 'start-assessment',
      text: 'Take the UK Career Assistant to unlock personalised route and course recommendations.',
      action: 'Start assessment',
      href: '/uk-career-assistant',
    })
  }

  return cards.slice(0, 3)
}
