/**
 * Path consistency — block recommendations that do not connect to the user's
 * stated priority, experience field, or education field.
 */

type PathwayRole = {
  title: string
  track: 'work_now' | 'build_next' | 'long_term'
  why: string
  origin?: 'education' | 'experience' | 'blended'
}

type ConsistencyProfile = {
  studyFieldSlug: string | null
  studyFieldText: string | null
  experienceFieldText: string | null
  careerDirectionPriority:
    | 'education_field'
    | 'experience_field'
    | 'both'
    | 'not_sure'
    | 'fast_employment'
    | null
}

const CREATIVE_LONG_TERM =
  /\b(animator|motion designer|3d artist|creative director|senior designer|content producer)\b/i
const CREATIVE_BUILD =
  /\b(motion graphics|video editing short course|portfolio development|showreel)\b/i
const LEGAL = /\b(legal|paralegal|casework|solicitor)\b/i
const MARKETING = /\b(marketing|digital marketing|social media|content creator|communications)\b/i
const EDUCATION = /\b(teaching|learning support|education|school|pupil|sen|safeguarding|learning mentor)\b/i
const IT = /\b(software engineer|developer|programmer|cybersecurity|systems analyst)\b/i
const HEALTHCARE = /\b(nursing|clinical|registered nurse|paramedic)\b/i

function fieldTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2)
  )
}

function slugFamily(slug: string | null, studyText: string | null): Set<string> {
  const s = `${slug ?? ''} ${studyText ?? ''}`.toLowerCase()
  const families = new Set<string>()
  if (s.includes('education') || /\bteaching\b/.test(s)) families.add('education')
  if (s.includes('law')) families.add('legal')
  if (s.includes('arts_design') || /\banimation\b/.test(s)) families.add('creative')
  if (s.includes('media_communications') || /\bmedia\b/.test(s)) families.add('media')
  if (s.includes('marketing')) families.add('marketing')
  if (s.includes('it_computing') || /\bcomputing\b/.test(s)) families.add('it')
  if (s.includes('healthcare')) families.add('healthcare')
  if (s.includes('business')) families.add('business')
  if (s.includes('science')) families.add('science')
  if (s.includes('engineering')) families.add('engineering')
  return families
}

function experienceFamily(expText: string | null): Set<string> {
  const e = (expText ?? '').toLowerCase()
  const families = new Set<string>()
  if (/retail|shop|store/.test(e)) families.add('retail')
  if (/warehouse|logistics|picker|packer/.test(e)) families.add('warehouse')
  if (/marketing|social media|communications/.test(e)) families.add('marketing')
  if (/customer service|call centre/.test(e)) families.add('customer')
  if (/admin|office|reception|data entry/.test(e)) families.add('admin')
  if (/hospitality|kitchen|bar|hotel/.test(e)) families.add('hospitality')
  if (/healthcare|care assistant|nursing/.test(e)) families.add('healthcare')
  if (/driving|driver|delivery|courier/.test(e)) families.add('driving')
  if (/it\b|software|helpdesk|digital/.test(e)) families.add('it')
  if (/education|teaching|school/.test(e)) families.add('education')
  if (/animation|design|creative|video|motion/.test(e)) families.add('creative')
  if (/trades|construction|electric/.test(e)) families.add('trades')
  return families
}

function roleMatchesFamilies(title: string, allowed: Set<string>): boolean {
  const t = title.toLowerCase()
  const bridge = /\b(assistant|administrator|admin|coordinator|advisor|support|receptionist|operative|supervisor|team leader|training|certificate|certification|short course|volunteering|references|workshop)\b/i

  if (bridge.test(t)) return true

  const checks: Array<[string, RegExp]> = [
    ['creative', CREATIVE_LONG_TERM],
    ['creative', CREATIVE_BUILD],
    ['creative', /\b(content creator|junior designer|design assistant|video editing|content producer|production assistant)\b/i],
    ['media', MARKETING],
    ['marketing', MARKETING],
    ['education', EDUCATION],
    ['legal', LEGAL],
    ['it', IT],
    ['healthcare', HEALTHCARE],
    ['retail', /\b(retail|store|shop|supermarket)\b/i],
    ['warehouse', /\b(warehouse|logistics|picker|packer|forklift)\b/i],
    ['customer', /\b(customer service|call centre|sales assistant)\b/i],
    ['admin', /\b(admin|office|reception|data entry)\b/i],
    ['hospitality', /\b(hospitality|kitchen|barista|hotel|housekeeping)\b/i],
    ['driving', /\b(driver|courier|delivery|hgv|taxi)\b/i],
    ['trades', /\b(trades|electrician|plumber|construction operative)\b/i],
    ['engineering', /\b(engineer|engineering|cad|manufacturing)\b/i],
    ['business', /\b(business|operations|hr assistant)\b/i],
    ['science', /\b(laboratory|lab|research|science)\b/i],
  ]

  for (const [family, pattern] of checks) {
    if (pattern.test(t)) {
      return allowed.has(family)
    }
  }

  return true
}

export function activeFieldFamilies(profile: ConsistencyProfile): Set<string> {
  const allowed = new Set<string>(['admin', 'customer'])
  const studyFamilies = slugFamily(profile.studyFieldSlug, profile.studyFieldText)
  const expFamilies = experienceFamily(profile.experienceFieldText)
  const priority = profile.careerDirectionPriority

  if (priority === 'fast_employment') {
    allowed.add('customer')
    allowed.add('admin')
    allowed.add('retail')
    allowed.add('warehouse')
    allowed.add('hospitality')
    for (const f of expFamilies) allowed.add(f)
    return allowed
  }

  if (priority === 'education_field') {
    for (const f of studyFamilies) allowed.add(f)
    allowed.add('admin')
    allowed.add('customer')
    return allowed
  }

  if (priority === 'experience_field') {
    for (const f of expFamilies) allowed.add(f)
    allowed.add('admin')
    allowed.add('customer')
    return allowed
  }

  if (priority === 'both' || priority === 'not_sure') {
    for (const f of studyFamilies) allowed.add(f)
    for (const f of expFamilies) allowed.add(f)
    allowed.add('admin')
    allowed.add('customer')
    return allowed
  }

  for (const f of studyFamilies) allowed.add(f)
  for (const f of expFamilies) allowed.add(f)
  return allowed
}

function hasPathOrigin(
  role: PathwayRole,
  origin: NonNullable<PathwayRole['origin']>
): boolean {
  if (role.origin === origin) return true
  const label = origin === 'education' ? 'education' : origin === 'experience' ? 'experience' : 'blended'
  return new RegExp(`\\(${label}\\)`, 'i').test(role.why)
}

export function ensureDualPathTrackBalance(
  filtered: PathwayRole[],
  source: PathwayRole[],
  profile: ConsistencyProfile,
  track: PathwayRole['track'],
  max: number
): PathwayRole[] {
  const priority = profile.careerDirectionPriority
  if (priority !== 'both' && priority !== 'not_sure') return filtered.slice(0, max)

  const trackFiltered = filtered.filter((r) => r.track === track)
  const trackSource = source.filter((r) => r.track === track)
  let out = [...trackFiltered]

  const addFromSource = (origin: NonNullable<PathwayRole['origin']>) => {
    if (out.some((r) => hasPathOrigin(r, origin))) return
    const pick = trackSource.find(
      (r) =>
        hasPathOrigin(r, origin) &&
        !out.some((x) => x.title.toLowerCase() === r.title.toLowerCase())
    )
    if (pick) out.push(pick)
  }

  addFromSource('experience')
  addFromSource('education')

  if (out.length < Math.min(2, max)) {
    for (const r of trackSource) {
      if (out.length >= max) break
      if (out.some((x) => x.title.toLowerCase() === r.title.toLowerCase())) continue
      out.push(r)
    }
  }

  return out.slice(0, max)
}

export function filterRolesForPathConsistency(
  roles: PathwayRole[],
  profile: ConsistencyProfile
): PathwayRole[] {
  const allowed = activeFieldFamilies(profile)
  const studyCreative =
    profile.studyFieldSlug === 'arts_design' ||
    /\banimation|motion|creative design\b/i.test(profile.studyFieldText ?? '')

  return roles.filter((r) => {
    const t = r.title
    if (
      studyCreative &&
      /\bcontent creator\b/i.test(t) &&
      allowed.has('creative')
    ) {
      return true
    }
    if (!studyCreative && !allowed.has('creative') && (CREATIVE_LONG_TERM.test(t) || CREATIVE_BUILD.test(t))) {
      return false
    }
    if (!allowed.has('legal') && LEGAL.test(t) && profile.careerDirectionPriority === 'experience_field') {
      return false
    }
    if (!allowed.has('marketing') && MARKETING.test(t) && profile.careerDirectionPriority === 'education_field') {
      const eduIsMarketing = profile.studyFieldSlug === 'media_communications'
      if (!eduIsMarketing) return false
    }
    if (!allowed.has('it') && IT.test(t) && !allowed.has('it')) {
      return false
    }
    return roleMatchesFamilies(t, allowed)
  })
}

export function blendEducationExperiencePack(
  profile: ConsistencyProfile
): { workNow: PathwayRole[]; buildNext: PathwayRole[]; longTerm: PathwayRole[] } | null {
  const study = (profile.studyFieldSlug ?? '').toLowerCase()
  const exp = (profile.experienceFieldText ?? '').toLowerCase()

  if (study === 'education' && /marketing/.test(exp)) {
    return {
      workNow: [
        role('Marketing Admin Assistant', 'work_now', 'Blends your marketing experience with education-sector admin', 'experience'),
        role('Teaching Assistant', 'work_now', 'Education entry using your degree', 'education'),
        role('Learning Support Assistant', 'work_now', 'School support role aligned with your education studies', 'education'),
      ],
      buildNext: [
        role('Education Administrator', 'build_next', 'Build Next — school admin progression', 'education'),
        role('Marketing Coordinator', 'build_next', 'Build Next — marketing step from your experience', 'experience'),
        role('Digital Marketing Certificate', 'build_next', 'Recommended training — supports marketing progression', 'experience'),
      ],
      longTerm: [
        role('Education Coordinator', 'long_term', 'Long-term — education administration progression', 'education'),
        role('Marketing Coordinator', 'long_term', 'Long-term — marketing career using your experience', 'experience'),
        role('Learning & Development Specialist', 'long_term', 'Long-term — connects training, education, and communications', 'blended'),
      ],
    }
  }

  if (study === 'law' && /hospitality|bar|hotel|kitchen|restaurant|housekeeping/.test(exp)) {
    return {
      workNow: [
        role('Hotel Receptionist', 'work_now', 'Hospitality entry using your work experience (experience)', 'experience'),
        role('Hospitality Assistant', 'work_now', 'Front-of-house role from your hospitality background (experience)', 'experience'),
        role('Legal Receptionist', 'work_now', 'Legal sector entry using your law qualification (education)', 'education'),
        role('Admin Assistant', 'work_now', 'Office bridge connecting hospitality experience and legal studies (mixed)', 'blended'),
      ],
      buildNext: [
        role('Junior Legal Assistant', 'build_next', 'Build Next — legal progression step (education)', 'education'),
        role('Shift Supervisor', 'build_next', 'Build Next — hospitality supervisor route (experience)', 'experience'),
      ],
      longTerm: [
        role('Legal Administrator', 'long_term', 'Long-term — legal operations if you pivot to your degree (education)', 'education'),
        role('Hospitality Supervisor', 'long_term', 'Long-term — hospitality leadership from experience (experience)', 'experience'),
      ],
    }
  }

  if (study === 'law' && /marketing|retail|customer|admin|office/.test(exp)) {
    return {
      workNow: [
        role('Admin Assistant', 'work_now', 'Practical bridge using transferable office and marketing skills'),
        role('Marketing Assistant', 'work_now', 'Uses your marketing work history (experience)'),
        role('Legal Receptionist', 'work_now', 'Legal sector entry using your law qualification (education)'),
      ],
      buildNext: [
        role('Legal Administration Training', 'build_next', 'Build Next — legal office skills (education)'),
        role('Marketing Coordinator training', 'build_next', 'Build Next — progression in marketing (experience)'),
      ],
      longTerm: [
        role('Legal Administrator', 'long_term', 'Long-term — legal operations if you pivot to your degree (education)'),
        role('Marketing Executive', 'long_term', 'Long-term — marketing progression from experience (experience)'),
      ],
    }
  }

  if ((study === 'media_communications' || study === 'business_management') && /marketing/.test(exp)) {
    return {
      workNow: [
        role('Marketing Assistant', 'work_now', 'Direct use of your marketing experience (experience)'),
        role('Marketing Coordinator', 'work_now', 'Coordinator step when you have solid marketing background'),
        role('Content Assistant', 'work_now', 'Content support aligned with media/comms studies (education)'),
      ],
      buildNext: [
        role('Digital Marketing Certificate', 'build_next', 'Build Next — strengthens marketing applications'),
        role('Google Analytics / social media short course', 'build_next', 'Build Next — practical marketing credentials'),
      ],
      longTerm: [
        role('Marketing Manager', 'long_term', 'Long-term — marketing leadership progression'),
        role('Communications Officer', 'long_term', 'Long-term — comms career from your studies (education)'),
      ],
    }
  }

  return null
}

function role(
  title: string,
  track: PathwayRole['track'],
  why: string,
  origin?: PathwayRole['origin']
): PathwayRole {
  return { title, track, why, origin }
}