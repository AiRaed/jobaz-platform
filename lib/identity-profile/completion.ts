import { IDENTITY_PHASE1_PRIVATE_ONLY } from './phase1'
import type { IdentityProfileBundle, ProfileCompletion, ProfileCompletionItem } from './types'

export function computeProfileCompletion(bundle: IdentityProfileBundle, hasCv: boolean): ProfileCompletion {
  const p = bundle.profile
  const items: ProfileCompletionItem[] = [
    {
      id: 'avatar',
      label: 'Add profile photo',
      done: Boolean(p.avatar_url),
      weight: 12,
      href: '#profile-hero',
    },
    {
      id: 'bio',
      label: 'Write your bio',
      done: Boolean(p.bio?.trim()),
      weight: 10,
    },
    {
      id: 'headline',
      label: 'Add career headline',
      done: Boolean(p.headline?.trim()),
      weight: 8,
    },
    {
      id: 'location',
      label: 'Add location',
      done: Boolean(p.location?.trim()),
      weight: 6,
    },
    {
      id: 'username',
      label: IDENTITY_PHASE1_PRIVATE_ONLY ? 'Set your display name' : 'Set public username',
      done: Boolean(p.username?.trim()),
      weight: 8,
    },
  ]

  if (p.profile_type === 'personal') {
    items.push(
      {
        id: 'experience',
        label: 'Add work experience',
        done: bundle.experience.length > 0,
        weight: 15,
      },
      {
        id: 'skills',
        label: 'Add skills',
        done: bundle.profileSkills.length >= 3 || (p.skills?.length ?? 0) >= 3,
        weight: 12,
      },
      {
        id: 'cv',
        label: 'Upload or build CV',
        done: hasCv,
        weight: 18,
        href: '/cv-builder-v2',
      },
      {
        id: 'education',
        label: 'Add education',
        done: bundle.education.length > 0,
        weight: 10,
      }
    )
    if (!IDENTITY_PHASE1_PRIVATE_ONLY) {
      items.push({
        id: 'pulse',
        label: 'Create first Pulse post',
        done: bundle.stats.pulsePostsCount > 0,
        weight: 8,
        href: '/feed',
      })
    }
  } else {
    items.push(
      {
        id: 'business_name',
        label: 'Add business name',
        done: Boolean(bundle.business?.business_name?.trim()),
        weight: 12,
      },
      {
        id: 'category',
        label: 'Choose business category',
        done: Boolean(bundle.business?.category?.trim()),
        weight: 8,
      },
      {
        id: 'services',
        label: 'List your services',
        done: (bundle.business?.services?.length ?? 0) > 0,
        weight: 12,
      },
      {
        id: 'description',
        label: 'Business description',
        done: Boolean(bundle.business?.business_description?.trim()),
        weight: 10,
      },
      {
        id: 'media',
        label: 'Add business photos',
        done: bundle.media.length > 0,
        weight: 10,
      }
    )
    if (!IDENTITY_PHASE1_PRIVATE_ONLY) {
      items.push({
        id: 'pulse',
        label: 'Post an opportunity',
        done: bundle.stats.pulsePostsCount > 0,
        weight: 8,
        href: '/feed',
      })
    }
  }

  const totalWeight = items.reduce((s, i) => s + i.weight, 0)
  const doneWeight = items.filter((i) => i.done).reduce((s, i) => s + i.weight, 0)
  const percentage = totalWeight > 0 ? Math.round((doneWeight / totalWeight) * 100) : 0
  const next = items.find((i) => !i.done)

  return {
    percentage,
    items,
    nextStep: next
      ? `Next: ${next.label}`
      : IDENTITY_PHASE1_PRIVATE_ONLY
        ? 'Career identity looks strong — keep building your plan and CV.'
        : 'Identity looks strong — keep engaging on Pulse!',
  }
}
