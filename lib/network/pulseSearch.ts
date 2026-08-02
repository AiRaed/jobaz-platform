import { supabase } from '@/lib/supabase'
import { personalProfilePath, businessProfilePath } from './publicProfileUrls'
import type { PulseSearchResult } from './types'

export async function searchPulse(query: string, limit = 12): Promise<PulseSearchResult[]> {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const results: PulseSearchResult[] = []

  const { data: people } = await supabase
    .from('profiles')
    .select('user_id, username, headline, avatar_url, profile_type, business_profiles(business_name, business_slug)')
    .or(`username.ilike.%${q}%,headline.ilike.%${q}%,location.ilike.%${q}%`)
    .limit(6)

  for (const p of people ?? []) {
    const biz = p.business_profiles as
      | { business_name: string | null; business_slug: string | null }
      | { business_name: string | null; business_slug: string | null }[]
      | null
    const business = Array.isArray(biz) ? biz[0] : biz
    const isBusiness = p.profile_type === 'business'
    results.push({
      id: p.user_id as string,
      type: isBusiness ? 'business' : 'person',
      title: isBusiness
        ? business?.business_name ?? (p.username as string) ?? 'Business'
        : `@${p.username ?? 'member'}`,
      subtitle: (p.headline as string) ?? (isBusiness ? 'Business identity' : 'Professional'),
      href: isBusiness
        ? businessProfilePath(business, p.username as string | null, p.user_id as string)
        : personalProfilePath(p.username as string | null, p.user_id as string),
      avatarUrl: p.avatar_url as string | null,
    })
  }

  const { data: posts } = await supabase
    .from('feed_posts')
    .select('id, content, post_type, author_id')
    .eq('post_type', 'opportunity')
    .ilike('content', `%${q}%`)
    .limit(4)

  for (const post of posts ?? []) {
    results.push({
      id: post.id as string,
      type: 'opportunity',
      title: 'Opportunity',
      subtitle: ((post.content as string) ?? '').slice(0, 80),
      href: `/feed?post=${post.id}`,
    })
  }

  const { data: groups } = await supabase
    .from('feed_groups')
    .select('id, name, description')
    .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
    .limit(4)

  for (const g of groups ?? []) {
    results.push({
      id: g.id as string,
      type: 'group',
      title: g.name as string,
      subtitle: ((g.description as string) ?? 'Circle').slice(0, 60),
      href: '/feed',
    })
  }

  return results.slice(0, limit)
}
