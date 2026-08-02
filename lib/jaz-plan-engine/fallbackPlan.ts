/**
 * Safe fallback templates for JAZ Plan Engine — works without Ollama.
 */

import type {
  JazPlanAction,
  JazPlanGenerateInput,
  JazPlanActionCategory,
} from './types'

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40)
}

function action(
  partial: Omit<JazPlanAction, 'status'> & { status?: JazPlanAction['status'] }
): JazPlanAction {
  return { status: 'not_started', ...partial }
}

function detectRouteBucket(input: JazPlanGenerateInput): string {
  const blob = [
    input.route_title,
    input.goal_path,
    input.current_focus,
    input.next_upgrade,
    ...(input.recommended_course_types || []).map((c) => c.title),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (/security|sia|steward|door\s*supervisor|cctv/.test(blob)) return 'security'
  if (/care|support\s*worker|nhs|dbs/.test(blob)) return 'care'
  if (/warehouse|forklift|parcel|picker|fulfilimodal/.test(blob)) return 'warehouse'
  if (/teach|tutor|tefl|invigilat|language/.test(blob)) return 'teaching'
  if (/hospitality|kitchen|barista|hotel|restaurant|food\s*hygiene/.test(blob))
    return 'hospitality'
  if (/account|aat|bookkeep|finance|xero|quickbooks|excel/.test(blob)) return 'accounting'
  if (/business|start.?business|self.?employ|freelance/.test(blob)) return 'business'
  if (/admin|office|customer\s*service|retail/.test(blob)) return 'admin'
  return 'general'
}

function cvHref(role: string): string {
  return `/cv-builder-v2?role=${encodeURIComponent(role || 'UK role')}`
}

function jobsHref(title: string): string {
  return `/jobs?q=${encodeURIComponent(title || 'jobs UK')}`
}

function coursesHref(q: string): string {
  return `/courses?q=${encodeURIComponent(q || 'courses UK')}`
}

function primaryCourse(input: JazPlanGenerateInput): {
  title: string
  applyUrl: string | null
  courseId: string | null
} {
  const matched = input.matched_jobaz_courses?.find(
    (c) => c.referral_url && c.primary_button === 'Apply Now'
  )
  if (matched) {
    return {
      title: matched.title,
      applyUrl: matched.referral_url || null,
      courseId: matched.course_id || null,
    }
  }
  const type = input.recommended_course_types?.[0]?.title
  const missing = input.missing_affiliate_opportunities?.[0]?.course_type
  return {
    title: type || missing || input.next_upgrade || 'Recommended training',
    applyUrl: null,
    courseId: null,
  }
}

/** Build up to 5 practical first-week actions from route + signals. */
export function buildFallbackPlanActions(input: JazPlanGenerateInput): JazPlanAction[] {
  const bucket = detectRouteBucket(input)
  const role =
    input.cv_target_role ||
    input.current_focus ||
    input.work_now_roles?.[0]?.title ||
    'your target role'
  const jobTitle = input.work_now_roles?.[0]?.title || role
  const course = primaryCourse(input)
  const routeSlug = slug(input.route_title || bucket)

  const templates: Record<string, JazPlanAction[]> = {
    security: [
      action({
        id: `jaz-${routeSlug}-cv`,
        title: 'Improve UK CV for steward / security roles',
        description: `Tailor your CV for ${role} with reliability and right-to-work clarity.`,
        category: 'cv',
        priority: 'required',
        cta_label: 'Open CV Builder',
        cta_target: cvHref(role),
        why_it_matters: 'Event and security employers scan CVs quickly for UK-ready basics.',
        estimated_time: '20 min',
      }),
      action({
        id: `jaz-${routeSlug}-jobs`,
        title: 'Apply to matchday / event steward roles',
        description: 'Search and apply to entry steward or event security jobs you can start soon.',
        category: 'jobs',
        priority: 'required',
        cta_label: 'View Jobs',
        cta_target: jobsHref(jobTitle),
        why_it_matters: 'Work-now roles build income while you plan any licence upgrade.',
        estimated_time: '1 hour',
      }),
      action({
        id: `jaz-${routeSlug}-course`,
        title: course.applyUrl
          ? `Check ${course.title}`
          : `Search ${course.title || 'SIA Door Supervisor'} course`,
        description: course.applyUrl
          ? 'Open the listed JobAZ partner course when you are ready.'
          : 'Find a suitable SIA / door supervisor course — save interest if no partner yet.',
        category: 'course',
        priority: 'recommended',
        cta_label: course.applyUrl ? 'Apply Now' : 'Save Interest',
        cta_target: course.applyUrl || coursesHref(course.title),
        why_it_matters: 'SIA unlocks higher-pay door/security roles after you start work.',
        estimated_time: '20 min',
      }),
      action({
        id: `jaz-${routeSlug}-save`,
        title: 'Save 3 local security jobs',
        description: 'Bookmark suitable steward/security listings to apply this week.',
        category: 'jobs',
        priority: 'recommended',
        cta_label: 'View Jobs',
        cta_target: jobsHref('event steward security'),
        why_it_matters: 'A shortlist keeps applications focused.',
        estimated_time: '15 min',
      }),
      action({
        id: `jaz-${routeSlug}-followup`,
        title: 'Follow up after 7 days',
        description: 'Check applications and refresh your shortlist next week.',
        category: 'follow_up',
        priority: 'optional',
        cta_label: 'Mark Done',
        cta_target: '#this-weeks-plan',
        why_it_matters: 'Consistent follow-up improves reply rates.',
        estimated_time: '10 min',
      }),
    ],
    care: [
      action({
        id: `jaz-${routeSlug}-cv`,
        title: 'Build CV for Care Assistant / Support Worker',
        description: `Highlight reliability, empathy, and any care-related experience for ${role}.`,
        category: 'cv',
        priority: 'required',
        cta_label: 'Open CV Builder',
        cta_target: cvHref(role),
        why_it_matters: 'Care employers look for clear, practical UK CVs.',
        estimated_time: '20 min',
      }),
      action({
        id: `jaz-${routeSlug}-jobs`,
        title: 'Apply to entry-level care roles',
        description: 'Search Care Assistant and Support Worker vacancies near you.',
        category: 'jobs',
        priority: 'required',
        cta_label: 'View Jobs',
        cta_target: jobsHref(jobTitle),
        why_it_matters: 'Many care providers hire for attitude and reliability first.',
        estimated_time: '1 hour',
      }),
      action({
        id: `jaz-${routeSlug}-course`,
        title: course.applyUrl
          ? `Check ${course.title}`
          : 'Check Care Certificate / Safeguarding training',
        description: 'Review care training that unlocks more roles — Apply Now only with a real partner link.',
        category: 'course',
        priority: 'recommended',
        cta_label: course.applyUrl ? 'Apply Now' : 'Save Interest',
        cta_target: course.applyUrl || coursesHref(course.title || 'Care Certificate'),
        why_it_matters: 'Recognised care training strengthens applications.',
        estimated_time: '20 min',
      }),
      action({
        id: `jaz-${routeSlug}-research`,
        title: 'Prepare DBS / right-to-work notes',
        description: 'Gather documents employers usually ask for (do not upload private IDs here).',
        category: 'research',
        priority: 'recommended',
        cta_label: 'Mark Done',
        cta_target: '#this-weeks-plan',
        why_it_matters: 'Being document-ready speeds up offers.',
        estimated_time: '20 min',
      }),
      action({
        id: `jaz-${routeSlug}-followup`,
        title: 'Follow up after 7 days',
        description: 'Revisit applications and saved roles next week.',
        category: 'follow_up',
        priority: 'optional',
        cta_label: 'Mark Done',
        cta_target: '#this-weeks-plan',
        why_it_matters: 'Keeps momentum without over-applying randomly.',
        estimated_time: '10 min',
      }),
    ],
    warehouse: [
      action({
        id: `jaz-${routeSlug}-cv`,
        title: 'CV for Warehouse Operative',
        description: `Make a clear UK CV for ${role} with shift flexibility and reliability.`,
        category: 'cv',
        priority: 'required',
        cta_label: 'Open CV Builder',
        cta_target: cvHref(role),
        why_it_matters: 'Warehouse hiring is fast when your CV is simple and UK-ready.',
        estimated_time: '20 min',
      }),
      action({
        id: `jaz-${routeSlug}-jobs`,
        title: 'Apply to warehouse / parcel sorter jobs',
        description: 'Target roles you can start soon near you.',
        category: 'jobs',
        priority: 'required',
        cta_label: 'View Jobs',
        cta_target: jobsHref(jobTitle),
        why_it_matters: 'Work-now roles fund any later forklift upgrade.',
        estimated_time: '1 hour',
      }),
      action({
        id: `jaz-${routeSlug}-course`,
        title: course.applyUrl ? `Check ${course.title}` : 'Check Forklift Licence options',
        description: 'Explore forklift training when you are ready — no fake Apply Now.',
        category: 'course',
        priority: 'recommended',
        cta_label: course.applyUrl ? 'Apply Now' : 'Save Interest',
        cta_target: course.applyUrl || coursesHref(course.title || 'Forklift'),
        why_it_matters: 'Forklift can unlock better shifts and pay.',
        estimated_time: '20 min',
      }),
      action({
        id: `jaz-${routeSlug}-save`,
        title: 'Save local warehouse jobs',
        description: 'Bookmark 3 suitable listings to apply this week.',
        category: 'jobs',
        priority: 'recommended',
        cta_label: 'View Jobs',
        cta_target: jobsHref('warehouse operative'),
        why_it_matters: 'A shortlist beats random applications.',
        estimated_time: '15 min',
      }),
      action({
        id: `jaz-${routeSlug}-followup`,
        title: 'Follow up after 7 days',
        description: 'Check replies and refresh your job shortlist.',
        category: 'follow_up',
        priority: 'optional',
        cta_label: 'Mark Done',
        cta_target: '#this-weeks-plan',
        why_it_matters: 'Consistency matters in high-volume hiring.',
        estimated_time: '10 min',
      }),
    ],
    teaching: [
      action({
        id: `jaz-${routeSlug}-cv`,
        title: 'CV for Online Tutor / Study Support',
        description: `Shape a tutoring-focused CV for ${role}.`,
        category: 'cv',
        priority: 'required',
        cta_label: 'Open CV Builder',
        cta_target: cvHref(role),
        why_it_matters: 'Clients and schools want clear subject/language signals.',
        estimated_time: '20 min',
      }),
      action({
        id: `jaz-${routeSlug}-profile`,
        title: 'Create tutoring profile or search tutor roles',
        description: 'Set up a simple profile or apply to study support / invigilator roles.',
        category: 'profile',
        priority: 'required',
        cta_label: 'View Jobs',
        cta_target: jobsHref(jobTitle || 'online tutor'),
        why_it_matters: 'Visibility gets first clients or school shifts.',
        estimated_time: '30 min',
      }),
      action({
        id: `jaz-${routeSlug}-course`,
        title: course.applyUrl ? `Check ${course.title}` : 'Check TEFL / Teaching English Online',
        description: 'Review TEFL or related course types — Apply Now only with a real partner link.',
        category: 'course',
        priority: 'recommended',
        cta_label: course.applyUrl ? 'Apply Now' : 'Save Interest',
        cta_target: course.applyUrl || coursesHref(course.title || 'TEFL'),
        why_it_matters: 'TEFL strengthens online English tutoring offers.',
        estimated_time: '20 min',
      }),
      action({
        id: `jaz-${routeSlug}-jobs`,
        title: 'Apply to exam invigilator / study support roles',
        description: 'Useful UK entry work while building tutoring income.',
        category: 'jobs',
        priority: 'recommended',
        cta_label: 'View Jobs',
        cta_target: jobsHref('exam invigilator teaching assistant'),
        why_it_matters: 'Stable entry roles complement flexible tutoring.',
        estimated_time: '45 min',
      }),
      action({
        id: `jaz-${routeSlug}-followup`,
        title: 'Prepare short subject / language profile',
        description: 'Write 3–5 lines on what you teach and who you help.',
        category: 'research',
        priority: 'optional',
        cta_label: 'Mark Done',
        cta_target: '#this-weeks-plan',
        why_it_matters: 'Helps parents/students choose you faster.',
        estimated_time: '15 min',
      }),
    ],
    hospitality: [
      action({
        id: `jaz-${routeSlug}-cv`,
        title: 'CV for Front of House / Kitchen Assistant',
        description: `Build a hospitality-ready CV for ${role}.`,
        category: 'cv',
        priority: 'required',
        cta_label: 'Open CV Builder',
        cta_target: cvHref(role),
        why_it_matters: 'Hospitality managers hire from clear, practical CVs.',
        estimated_time: '20 min',
      }),
      action({
        id: `jaz-${routeSlug}-jobs`,
        title: 'Apply to restaurants / hotels / cafes',
        description: 'Target roles you can start soon.',
        category: 'jobs',
        priority: 'required',
        cta_label: 'View Jobs',
        cta_target: jobsHref(jobTitle),
        why_it_matters: 'High turnover means frequent openings.',
        estimated_time: '1 hour',
      }),
      action({
        id: `jaz-${routeSlug}-course`,
        title: course.applyUrl ? `Check ${course.title}` : 'Check Food Hygiene certificate',
        description: 'Food Hygiene often helps kitchen and FOH applications.',
        category: 'course',
        priority: 'recommended',
        cta_label: course.applyUrl ? 'Apply Now' : 'Save Interest',
        cta_target: course.applyUrl || coursesHref(course.title || 'Food Hygiene'),
        why_it_matters: 'Common baseline for kitchen/FOH roles.',
        estimated_time: '20 min',
      }),
      action({
        id: `jaz-${routeSlug}-save`,
        title: 'Save local hospitality jobs',
        description: 'Bookmark 3 suitable listings.',
        category: 'jobs',
        priority: 'recommended',
        cta_label: 'View Jobs',
        cta_target: jobsHref('kitchen assistant front of house'),
        why_it_matters: 'Keeps your applications organised.',
        estimated_time: '15 min',
      }),
      action({
        id: `jaz-${routeSlug}-followup`,
        title: 'Follow up after 7 days',
        description: 'Chase applications and refresh shortlist.',
        category: 'follow_up',
        priority: 'optional',
        cta_label: 'Mark Done',
        cta_target: '#this-weeks-plan',
        why_it_matters: 'Managers often respond after a polite chase.',
        estimated_time: '10 min',
      }),
    ],
    accounting: [
      action({
        id: `jaz-${routeSlug}-cv`,
        title: 'CV for Accounts Assistant / Finance Admin',
        description: `Show education and transferable skills for ${role}.`,
        category: 'cv',
        priority: 'required',
        cta_label: 'Open CV Builder',
        cta_target: cvHref(role),
        why_it_matters: 'Finance admin roles need a tidy, accurate CV.',
        estimated_time: '20 min',
      }),
      action({
        id: `jaz-${routeSlug}-jobs`,
        title: 'Apply to entry finance admin roles',
        description: 'Search Accounts Assistant and Finance Admin vacancies.',
        category: 'jobs',
        priority: 'required',
        cta_label: 'View Jobs',
        cta_target: jobsHref(jobTitle || 'accounts assistant'),
        why_it_matters: 'Entry roles build UK finance experience.',
        estimated_time: '1 hour',
      }),
      action({
        id: `jaz-${routeSlug}-course`,
        title: course.applyUrl
          ? `Check ${course.title}`
          : 'Check AAT / Excel / Xero / QuickBooks',
        description: 'Pick one practical finance skill path — Apply Now only with a real partner.',
        category: 'course',
        priority: 'recommended',
        cta_label: course.applyUrl ? 'Apply Now' : 'Save Interest',
        cta_target: course.applyUrl || coursesHref(course.title || 'AAT Excel'),
        why_it_matters: 'Software + AAT signals make applications stronger.',
        estimated_time: '20 min',
      }),
      action({
        id: `jaz-${routeSlug}-save`,
        title: 'Save 3 suitable finance roles',
        description: 'Shortlist roles that match your current level.',
        category: 'jobs',
        priority: 'recommended',
        cta_label: 'View Jobs',
        cta_target: jobsHref('finance admin'),
        why_it_matters: 'Focused applications beat mass applying.',
        estimated_time: '15 min',
      }),
      action({
        id: `jaz-${routeSlug}-cv2`,
        title: 'Improve CV with education + transferable skills',
        description: 'Add modules, tools, and admin strengths clearly.',
        category: 'cv',
        priority: 'optional',
        cta_label: 'Open CV Builder',
        cta_target: cvHref(role),
        why_it_matters: 'Education routes need proof of readiness, not fluff.',
        estimated_time: '20 min',
      }),
    ],
    business: [
      action({
        id: `jaz-${routeSlug}-research`,
        title: 'Write a basic business plan (1 page)',
        description: 'Who you serve, what you sell, and first 30-day actions.',
        category: 'research',
        priority: 'required',
        cta_label: 'Mark Done',
        cta_target: '#this-weeks-plan',
        why_it_matters: 'Clarity beats buying random courses.',
        estimated_time: '1 hour',
      }),
      action({
        id: `jaz-${routeSlug}-profile`,
        title: 'Check simple website / marketing basics',
        description: 'Set a minimal online presence or LinkedIn service offer.',
        category: 'profile',
        priority: 'recommended',
        cta_label: 'Mark Done',
        cta_target: '#this-weeks-plan',
        why_it_matters: 'Customers need a way to find you.',
        estimated_time: '1 hour',
      }),
      action({
        id: `jaz-${routeSlug}-course`,
        title: 'Bookkeeping basics (optional)',
        description: 'Learn simple record-keeping — no affiliate push required.',
        category: 'course',
        priority: 'optional',
        cta_label: 'Search Courses',
        cta_target: coursesHref('bookkeeping basics'),
        why_it_matters: 'Keeps cash flow under control from day one.',
        estimated_time: 'this week',
      }),
      action({
        id: `jaz-${routeSlug}-research2`,
        title: 'Validate first service / customer',
        description: 'Talk to 3 potential customers or offer a trial.',
        category: 'research',
        priority: 'required',
        cta_label: 'Mark Done',
        cta_target: '#this-weeks-plan',
        why_it_matters: 'Real demand matters more than a perfect logo.',
        estimated_time: 'this week',
      }),
      action({
        id: `jaz-${routeSlug}-followup`,
        title: 'Follow up after 7 days',
        description: 'Review what worked and adjust your offer.',
        category: 'follow_up',
        priority: 'optional',
        cta_label: 'Mark Done',
        cta_target: '#this-weeks-plan',
        why_it_matters: 'Iteration is the real business skill.',
        estimated_time: '20 min',
      }),
    ],
    admin: [
      action({
        id: `jaz-${routeSlug}-cv`,
        title: 'Improve UK CV for admin / customer service',
        description: `Tailor for ${role}.`,
        category: 'cv',
        priority: 'required',
        cta_label: 'Open CV Builder',
        cta_target: cvHref(role),
        why_it_matters: 'Admin roles need clear communication and reliability.',
        estimated_time: '20 min',
      }),
      action({
        id: `jaz-${routeSlug}-jobs`,
        title: 'Apply to 5 suitable jobs',
        description: 'Target entry admin, retail, or customer service roles.',
        category: 'jobs',
        priority: 'required',
        cta_label: 'View Jobs',
        cta_target: jobsHref(jobTitle),
        why_it_matters: 'Applications create interviews.',
        estimated_time: '1 hour',
      }),
      action({
        id: `jaz-${routeSlug}-course`,
        title: course.applyUrl ? `Check ${course.title}` : 'Review recommended office skills course',
        description: 'MS Office / digital skills when relevant — no fake Apply Now.',
        category: 'course',
        priority: 'recommended',
        cta_label: course.applyUrl ? 'Apply Now' : 'Save Interest',
        cta_target: course.applyUrl || coursesHref(course.title || 'MS Office'),
        why_it_matters: 'Basic digital skills unlock more admin roles.',
        estimated_time: '20 min',
      }),
      action({
        id: `jaz-${routeSlug}-save`,
        title: 'Save 3 suitable jobs',
        description: 'Build a shortlist for this week.',
        category: 'jobs',
        priority: 'recommended',
        cta_label: 'View Jobs',
        cta_target: jobsHref(jobTitle),
        why_it_matters: 'Focused shortlists convert better.',
        estimated_time: '15 min',
      }),
      action({
        id: `jaz-${routeSlug}-followup`,
        title: 'Follow up after 7 days',
        description: 'Chase applications politely.',
        category: 'follow_up',
        priority: 'optional',
        cta_label: 'Mark Done',
        cta_target: '#this-weeks-plan',
        why_it_matters: 'Follow-up is a practical job skill.',
        estimated_time: '10 min',
      }),
    ],
    general: [
      action({
        id: `jaz-${routeSlug}-cv`,
        title: `Improve UK CV for ${role}`,
        description: input.cv_focus || 'Make a clear UK-ready CV for your target role.',
        category: 'cv',
        priority: 'required',
        cta_label: 'Open CV Builder',
        cta_target: cvHref(role),
        why_it_matters: 'A practical CV is the fastest unlock for applications.',
        estimated_time: '20 min',
      }),
      action({
        id: `jaz-${routeSlug}-jobs`,
        title: 'Apply to 5 jobs',
        description: `Search roles related to ${jobTitle}.`,
        category: 'jobs',
        priority: 'required',
        cta_label: 'View Jobs',
        cta_target: jobsHref(jobTitle),
        why_it_matters: 'Applications move you toward interviews.',
        estimated_time: '1 hour',
      }),
      action({
        id: `jaz-${routeSlug}-course`,
        title: course.applyUrl
          ? `Check ${course.title}`
          : `Search ${course.title || 'recommended'} course`,
        description: 'Review training that unlocks your next upgrade — no invented providers.',
        category: 'course',
        priority: 'recommended',
        cta_label: course.applyUrl ? 'Apply Now' : 'Save Interest',
        cta_target: course.applyUrl || coursesHref(course.title),
        why_it_matters: 'The right short course unlocks better roles.',
        estimated_time: '20 min',
      }),
      action({
        id: `jaz-${routeSlug}-save`,
        title: 'Save 3 suitable jobs',
        description: 'Build a shortlist of realistic roles.',
        category: 'jobs',
        priority: 'recommended',
        cta_label: 'View Jobs',
        cta_target: jobsHref(jobTitle),
        why_it_matters: 'Keeps your week focused.',
        estimated_time: '15 min',
      }),
      action({
        id: `jaz-${routeSlug}-followup`,
        title: 'Follow up after 7 days',
        description: 'Review progress and refresh applications.',
        category: 'follow_up',
        priority: 'optional',
        cta_label: 'Mark Done',
        cta_target: '#this-weeks-plan',
        why_it_matters: 'Steady follow-up beats one-off bursts.',
        estimated_time: '10 min',
      }),
    ],
  }

  // Prefer this_week_plan / first_action_plan labels when present (still max 5)
  const fromCareer = (input.this_week_plan || [])
    .slice(0, 5)
    .map((label, i) => {
      const cat: JazPlanActionCategory =
        /cv/i.test(label) ? 'cv' : /job|apply/i.test(label) ? 'jobs' : /course|train|licence|sia|tefl|aat|food/i.test(label) ? 'course' : /follow/i.test(label) ? 'follow_up' : 'research'
      const tpl = templates[bucket][i] || templates.general[i]
      return action({
        ...(tpl || templates.general[0]),
        id: `jaz-${routeSlug}-week-${i + 1}`,
        title: label,
        category: cat,
      })
    })

  if (fromCareer.length >= 3) return fromCareer.slice(0, 5)
  return (templates[bucket] || templates.general).slice(0, 5)
}

export { detectRouteBucket }
