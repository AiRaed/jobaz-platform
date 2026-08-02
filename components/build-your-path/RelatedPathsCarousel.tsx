'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getCareerPathById } from '@/lib/career-paths'
import { careerHubRouteUrl } from '@/lib/career-hub/explorerUrl'
import { getCategoryForPathId } from '@/lib/career-hub/routeCategories'

type Props = {
  pathIds: string[]
  currentPathId: string
  caSessionId?: string | null
}

export default function RelatedPathsCarousel({ pathIds, currentPathId, caSessionId }: Props) {
  const related = pathIds
    .filter((id) => id !== currentPathId)
    .map((id) => getCareerPathById(id))
    .filter(Boolean)
    .slice(0, 4)

  if (related.length === 0) return null

  return (
    <section className="rounded-2xl border border-slate-700/60 bg-slate-950/50 p-5 md:p-6">
      <h2 className="text-lg font-bold text-slate-200 mb-1">You may also like</h2>
      <p className="text-xs text-slate-500 mb-4">Related paths worth exploring</p>
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none -mx-1 px-1">
        {related.map((path) => {
          if (!path) return null
          const href = careerHubRouteUrl(path.id, {
            caSessionId: caSessionId,
            categoryId: getCategoryForPathId(path.id)?.id,
          })
          return (
            <Link
              key={path.id}
              href={href}
              className="group shrink-0 w-[200px] sm:w-[220px] rounded-xl border border-slate-700/50 bg-slate-900/40 p-4 hover:border-violet-500/40 hover:shadow-[0_0_20px_rgba(139,92,246,0.15)] transition"
            >
              <span className="text-2xl">{path.icon}</span>
              <p className="text-sm font-semibold text-slate-200 mt-2 group-hover:text-violet-200 transition">
                {path.title}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-snug">{path.description}</p>
              <span className="inline-flex items-center gap-1 text-[10px] text-violet-400 mt-3 font-medium">
                Explore path <ArrowRight className="w-3 h-3" />
              </span>
            </Link>
          )
        })}
      </div>
    </section>
  )
}

