import type { RecentAiEventRow } from '@/lib/jobaz-ai/analytics'

type ActivityFeedProps = {
  events: RecentAiEventRow[]
}

/** UTC-stable formatting — identical on server and client (avoids locale/timezone hydration drift). */
function formatTimestamp(iso: string): string {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    return d.toISOString().slice(0, 16).replace('T', ' ')
  } catch {
    return iso
  }
}

function shortenId(id: string | null): string {
  if (!id) return '—'
  if (id.length <= 12) return id
  return `${id.slice(0, 8)}…${id.slice(-4)}`
}

export default function ActivityFeed({ events }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-gray-700 bg-[#141414] px-4 py-8 text-center text-sm text-gray-500">
        No recent events. Activity will show here as users interact with the AI Career Path.
      </p>
    )
  }

  return (
    <ul className="divide-y divide-gray-800 rounded-lg border border-gray-800">
      {events.map((event) => (
        <li
          key={event.id}
          className="flex flex-col gap-1 px-4 py-3 transition hover:bg-[#1a1a1a]/60 sm:flex-row sm:items-start sm:justify-between"
        >
          <div className="min-w-0 flex-1">
            <p className="font-mono text-sm text-purple-300">{event.eventName}</p>
            <p className="mt-0.5 truncate text-xs text-gray-500">{event.metadataSummary}</p>
          </div>
          <div className="shrink-0 text-right text-xs text-gray-500">
            <p>{formatTimestamp(event.createdAt)}</p>
            <p className="mt-0.5 font-mono text-gray-600">
              anon: {shortenId(event.anonymousId)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
