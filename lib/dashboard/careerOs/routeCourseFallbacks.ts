/**
 * Default UK course-type recommendations by route keyword.
 * Used when engines return no structured courses — never invents providers.
 */

export type RouteCourseFallback = {
  title: string
  why: string
}

const FALLBACKS: Array<{ match: RegExp; courses: RouteCourseFallback[] }> = [
  {
    match: /security|sia|steward|door\s*supervisor|event\s*security/i,
    courses: [
      {
        title: 'SIA Door Supervisor Course',
        why: 'Unlocks Door Supervisor and better-paid licensed security roles.',
      },
      {
        title: 'CCTV Operator Course',
        why: 'Opens control-room and monitoring roles alongside door work.',
      },
      {
        title: 'Emergency First Aid at Work',
        why: 'Common employer requirement for events and venue security.',
      },
    ],
  },
  {
    match: /care|support\s*worker|social\s*care|healthcare\s*assistant|carer/i,
    courses: [
      {
        title: 'Care Certificate',
        why: 'Standard entry foundation for care and support roles in the UK.',
      },
      {
        title: 'Level 2 Adult Social Care',
        why: 'Builds care skills and supports progression into higher-paid roles.',
      },
      {
        title: 'Safeguarding Awareness',
        why: 'Expected by most care employers alongside the Care Certificate.',
      },
    ],
  },
  {
    match: /hospitality|kitchen|chef|catering|waiter|barista|hotel/i,
    courses: [
      {
        title: 'Food Safety Level 2',
        why: 'Required or strongly preferred for most food-handling roles.',
      },
      {
        title: 'Customer Service Skills',
        why: 'Helps you move into front-of-house and supervisor roles.',
      },
      {
        title: 'Emergency First Aid at Work',
        why: 'Useful for venues, hotels and busy hospitality teams.',
      },
    ],
  },
  {
    match: /admin|office|receptionist|secretary|business\s*admin/i,
    courses: [
      {
        title: 'Microsoft Office Skills',
        why: 'Core requirement for most UK admin and office roles.',
      },
      {
        title: 'Business Administration Level 2',
        why: 'Supports progression into coordinator and office supervisor roles.',
      },
      {
        title: 'Customer Service Skills',
        why: 'Strengthens reception and client-facing admin applications.',
      },
    ],
  },
  {
    match: /construction|labourer|site\s*operative|builder|cscs/i,
    courses: [
      {
        title: 'CSCS Green Card',
        why: 'Common site entry requirement for construction labour roles.',
      },
      {
        title: 'Health & Safety in Construction',
        why: 'Supports CSCS pathway and safer site work.',
      },
      {
        title: 'Emergency First Aid at Work',
        why: 'Often requested on construction and facilities sites.',
      },
    ],
  },
  {
    match: /warehouse|forklift|logistics|picker|packer|operative/i,
    courses: [
      {
        title: 'Forklift Licence (Counterbalance)',
        why: 'Opens higher-paid warehouse and logistics operative roles.',
      },
      {
        title: 'Manual Handling Awareness',
        why: 'Common baseline for warehouse and goods-handling jobs.',
      },
      {
        title: 'Health & Safety Awareness',
        why: 'Helps applications for warehouse and site-based roles.',
      },
    ],
  },
  {
    match: /retail|sales\s*assistant|shop\s*floor|supermarket|stock\s*assistant/i,
    courses: [
      {
        title: 'Customer Service Skills',
        why: 'Helps you move into better retail, sales and customer-facing roles.',
      },
      {
        title: 'Food Safety Level 2',
        why: 'Useful for supermarket, food retail and hospitality overlap roles.',
      },
      {
        title: 'Emergency First Aid at Work',
        why: 'A practical short course valued by many retail employers.',
      },
    ],
  },
  {
    match: /it\b|tech\s*support|computer|software|digital|helpdesk|comptia|online\s*tutor/i,
    courses: [
      {
        title: 'Microsoft Office Certification',
        why: 'Core foundation for digital assistant, admin and junior IT side work.',
      },
      {
        title: 'Digital Skills Course',
        why: 'Practical digital skills for tutoring, admin and junior tech roles.',
      },
      {
        title: 'CompTIA A+',
        why: 'Recognised foundation for IT support and helpdesk roles.',
      },
    ],
  },
  {
    match: /teaching\s*assistant|ta\b|classroom|sen\b|education\s*support/i,
    courses: [
      {
        title: 'Teaching Assistant Level 2',
        why: 'Supports entry into school support and classroom assistant roles.',
      },
      {
        title: 'Safeguarding Children',
        why: 'Expected by most UK schools and education employers.',
      },
      {
        title: 'SEN Awareness',
        why: 'Helps applications for inclusive classroom support roles.',
      },
    ],
  },
  {
    match: /business|self[- ]?employ|freelance|entrepreneur|own\s*business|bookkeep/i,
    courses: [
      {
        title: 'Bookkeeping Basics',
        why: 'Helps you manage invoices, costs and simple business records.',
      },
      {
        title: 'Business Planning Basics',
        why: 'Useful when validating and structuring a small business idea.',
      },
      {
        title: 'Digital Marketing Basics',
        why: 'Helps you find customers online without large ad spend.',
      },
    ],
  },
]

const GENERIC: RouteCourseFallback[] = [
  {
    title: 'Customer Service Skills',
    why: 'Useful across many UK starter roles and customer-facing jobs.',
  },
  {
    title: 'Emergency First Aid at Work',
    why: 'A practical short course valued by many employers.',
  },
  {
    title: 'Microsoft Office Skills',
    why: 'Supports admin, office and many entry-level applications.',
  },
]

/** Resolve 1–3 course-type fallbacks from route/field/role text. */
export function resolveRouteCourseFallbacks(
  ...hints: Array<string | null | undefined>
): RouteCourseFallback[] {
  const blob = hints.filter(Boolean).join(' · ')
  if (!blob.trim()) return GENERIC.slice(0, 2)

  for (const entry of FALLBACKS) {
    if (entry.match.test(blob)) return entry.courses.slice(0, 3)
  }
  return GENERIC.slice(0, 2)
}
