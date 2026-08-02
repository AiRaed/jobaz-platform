import { createServerSupabaseClient } from '@/lib/supabase'

const STARTER_GROUPS = [
  {
    name: 'JobAZ Success Stories',
    slug: 'jobaz-success-stories',
    description: 'Share wins, first interviews, and career milestones from the community.',
    category: 'Motivation',
    icon: '🌟',
  },
  {
    name: 'Newcastle Job Seekers',
    slug: 'newcastle-job-seekers',
    description: 'Local jobs, agencies, and support for job seekers in Newcastle.',
    category: 'Local',
    icon: '🏙️',
  },
  {
    name: 'UK Drivers Network',
    slug: 'uk-drivers-network',
    description: 'Delivery, taxi, and logistics drivers sharing routes and hiring tips.',
    category: 'Transport',
    icon: '🚗',
  },
  {
    name: 'Warehouse & Logistics UK',
    slug: 'warehouse-logistics-uk',
    description: 'Entry roles, shift patterns, and agency advice for warehouse work.',
    category: 'Logistics',
    icon: '📦',
  },
  {
    name: 'Beginner English Support',
    slug: 'beginner-english-support',
    description: 'Workplace English and interview confidence for new speakers.',
    category: 'Language',
    icon: '💬',
  },
  {
    name: 'Small Business UK',
    slug: 'small-business-uk',
    description: 'Share projects, services, opportunities, and growth tips for local businesses.',
    category: 'Business',
    icon: '🏪',
  },
  {
    name: 'Freelance & Projects',
    slug: 'freelance-projects',
    description: 'Freelance gigs, collaborations, and project-based work in the UK.',
    category: 'Freelance',
    icon: '💼',
  },
  {
    name: 'Training & Courses',
    slug: 'training-courses',
    description: 'Courses, certifications, and upskilling paths for UK careers.',
    category: 'Training',
    icon: '📚',
  },
] as const

const STARTER_POSTS = [
  {
    author_display_name: 'Ahmed',
    content: 'Got my first warehouse interview after updating my CV on JobAZ. Thank you everyone.',
    post_type: 'success_story',
    career_path: 'Warehouse Path',
    group_slug: 'jobaz-success-stories',
  },
  {
    author_display_name: 'Sara',
    content: 'Does anyone know beginner-friendly jobs in Newcastle with flexible shifts?',
    post_type: 'question',
    career_path: 'Customer Service',
    group_slug: 'newcastle-job-seekers',
  },
  {
    author_display_name: 'Omar',
    content:
      'Uber demand was strong this weekend in Manchester — driving gigs can bridge income while job hunting.',
    post_type: 'job_tip',
    career_path: 'Driving & Logistics',
    group_slug: 'uk-drivers-network',
  },
] as const

const OFFICIAL_PULSE_POSTS = [
  {
    author_display_name: 'JobAZ',
    content:
      'Welcome to Pulse — share your career progress, opportunities, projects, and questions with the JobAZ community.',
    post_type: 'announcement',
    career_path: 'Official JobAZ Updates',
  },
  {
    author_display_name: 'JobAZ',
    content: 'Tip: Add your profile photo and headline so people trust your posts and opportunities.',
    post_type: 'announcement',
    career_path: 'Official JobAZ Updates',
  },
  {
    author_display_name: 'JobAZ',
    content:
      'New: You can now share local opportunities for jobs, projects, tutoring, freelance work, and small business support.',
    post_type: 'announcement',
    career_path: 'Official JobAZ Updates',
  },
] as const

function isMissingTableError(message: string) {
  return message.toLowerCase().includes('could not find the table') || message.toLowerCase().includes('does not exist')
}

async function insertPost(
  admin: ReturnType<typeof createServerSupabaseClient>,
  p: {
    author_display_name: string
    content: string
    post_type: string
    career_path: string
    group_slug?: string
    is_official?: boolean
  },
  slugToId: Map<string, string>
) {
  const row: Record<string, unknown> = {
    author_display_name: p.author_display_name,
    content: p.content,
    post_type: p.post_type,
    visibility: 'public',
    career_path: p.career_path,
    is_jobaz_post: true,
    is_official_post: p.is_official ?? false,
  }

  const { data: post, error: postError } = await admin.from('feed_posts').insert(row).select('id').single()

  if (postError || !post) return

  if (p.group_slug) {
    const groupId = slugToId.get(p.group_slug)
    if (groupId) {
      await admin.from('feed_post_groups').upsert({ post_id: post.id, group_id: groupId })
    }
  }
}

/** Server-side bootstrap — requires migration + SUPABASE_SERVICE_ROLE_KEY */
export async function bootstrapFeedData() {
  let admin
  try {
    admin = createServerSupabaseClient()
  } catch {
    return { ok: false as const, error: 'Server Supabase not configured (SUPABASE_SERVICE_ROLE_KEY).' }
  }

  const { count: groupCount, error: groupCountError } = await admin
    .from('feed_groups')
    .select('id', { count: 'exact', head: true })

  if (groupCountError) {
    if (isMissingTableError(groupCountError.message)) {
      return { ok: false as const, error: 'Pulse tables not found. Run the SQL migrations first.' }
    }
    return { ok: false as const, error: groupCountError.message }
  }

  if ((groupCount ?? 0) === 0) {
    const { error } = await admin.from('feed_groups').upsert(
      STARTER_GROUPS.map((g) => ({ ...g, is_official: true })),
      { onConflict: 'slug' }
    )
    if (error) return { ok: false as const, error: error.message }
  }

  const { data: groups } = await admin.from('feed_groups').select('id, slug')
  const slugToId = new Map((groups ?? []).map((g) => [g.slug, g.id]))

  const { count: postCount, error: postCountError } = await admin
    .from('feed_posts')
    .select('id', { count: 'exact', head: true })

  if (postCountError) return { ok: false as const, error: postCountError.message }

  if ((postCount ?? 0) === 0) {
    for (const p of STARTER_POSTS) {
      await insertPost(admin, p, slugToId)
    }
  }

  const { count: officialCount } = await admin
    .from('feed_posts')
    .select('id', { count: 'exact', head: true })
    .eq('is_jobaz_post', true)

  if ((officialCount ?? 0) < OFFICIAL_PULSE_POSTS.length) {
    for (const p of OFFICIAL_PULSE_POSTS) {
      await insertPost(admin, { ...p, is_official: true }, slugToId)
    }
  }

  return { ok: true as const, seeded: (postCount ?? 0) === 0 }
}
