/**
 * JobAZ application email templates.
 * Clear, practical, supportive, UK-focused.
 * No job/income guarantees. No fake provider claims.
 */

export type EmailTemplateKey =
  | 'welcome'
  | 'continue_plan'
  | 'continue_cv'
  | 'recommended_course'
  | 'admin_custom'

export type EmailType = 'service' | 'marketing'

export type TemplateContext = {
  userName?: string | null
  route?: string | null
  targetRole?: string | null
  nextUpgrade?: string | null
  /** Only pass a real course title from catalogue data */
  courseTitle?: string | null
  /** Only pass a real provider name from catalogue data */
  providerName?: string | null
  customSubject?: string | null
  customMessage?: string | null
  planUrl?: string | null
  cvUrl?: string | null
  coursesUrl?: string | null
  homeUrl?: string | null
  unsubscribeUrl?: string | null
}

export type BuiltEmail = {
  templateKey: EmailTemplateKey
  emailType: EmailType
  subject: string
  html: string
  text: string
}

const DEFAULTS = {
  homeUrl: 'https://jobaz.co.uk',
  planUrl: 'https://jobaz.co.uk/dashboard',
  cvUrl: 'https://jobaz.co.uk/cv-builder-v2',
  coursesUrl: 'https://jobaz.co.uk/career-hub',
}

export const EMAIL_TEMPLATE_OPTIONS: Array<{
  key: EmailTemplateKey
  label: string
  emailType: EmailType
  description: string
}> = [
  {
    key: 'welcome',
    label: 'Welcome',
    emailType: 'service',
    description: 'Welcome new users and point them to Career Assistant → My Plan.',
  },
  {
    key: 'continue_plan',
    label: 'Continue your plan',
    emailType: 'service',
    description: 'Remind the user to open My Plan and take the next step.',
  },
  {
    key: 'continue_cv',
    label: 'Continue your CV',
    emailType: 'service',
    description: 'Encourage improving the CV for the active plan.',
  },
  {
    key: 'recommended_course',
    label: 'Recommended course reminder',
    emailType: 'marketing',
    description: 'Course/training reminder — requires marketing preference opt-in.',
  },
  {
    key: 'admin_custom',
    label: 'Custom message',
    emailType: 'service',
    description: 'Admin-written service message (no fake offers).',
  },
]

function nameOrFriend(name?: string | null): string {
  const n = String(name || '').trim()
  return n || 'there'
}

function safeLine(label: string, value?: string | null): string {
  const v = String(value || '').trim()
  if (!v) return ''
  return `<p style="margin:0 0 8px;"><strong>${label}:</strong> ${escapeHtml(v)}</p>`
}

function safeTextLine(label: string, value?: string | null): string {
  const v = String(value || '').trim()
  if (!v) return ''
  return `${label}: ${v}\n`
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function wrapHtml(body: string, opts: { unsubscribeUrl?: string | null; marketing?: boolean }): string {
  const unsub =
    opts.marketing && opts.unsubscribeUrl
      ? `<p style="margin-top:24px;font-size:12px;color:#64748b;">
You received this because you opted in to JobAZ training updates.
<a href="${escapeHtml(opts.unsubscribeUrl)}" style="color:#64748b;">Unsubscribe</a>
</p>`
      : `<p style="margin-top:24px;font-size:12px;color:#64748b;">
JobAZ — practical UK career routes. This message does not guarantee jobs or income.
</p>`

  return `<!DOCTYPE html>
<html>
<body style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#0f172a;background:#f8fafc;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;">
    <p style="margin:0 0 16px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#7c3aed;">JobAZ</p>
    ${body}
    ${unsub}
  </div>
</body>
</html>`
}

function cta(href: string, label: string): string {
  return `<p style="margin:20px 0;">
  <a href="${escapeHtml(href)}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;">${escapeHtml(label)}</a>
</p>`
}

export function getTemplateMeta(key: EmailTemplateKey) {
  return EMAIL_TEMPLATE_OPTIONS.find((t) => t.key === key) || EMAIL_TEMPLATE_OPTIONS[0]
}

export function buildEmailTemplate(
  key: EmailTemplateKey,
  ctx: TemplateContext = {}
): BuiltEmail {
  const homeUrl = ctx.homeUrl || DEFAULTS.homeUrl
  const planUrl = ctx.planUrl || DEFAULTS.planUrl
  const cvUrl = ctx.cvUrl || DEFAULTS.cvUrl
  const coursesUrl = ctx.coursesUrl || DEFAULTS.coursesUrl
  const who = nameOrFriend(ctx.userName)
  const meta = getTemplateMeta(key)

  switch (key) {
    case 'welcome': {
      const subject = 'Welcome to JobAZ — start your UK career route'
      const htmlBody = `
        <h1 style="font-size:20px;margin:0 0 12px;">Welcome, ${escapeHtml(who)}</h1>
        <p>JobAZ helps you find a practical UK career route — not just a jobs board or a course list.</p>
        <p>A clear next step:</p>
        <ol>
          <li>Use Career Assistant to clarify your goal</li>
          <li>Save your plan in My Plan</li>
          <li>Improve your CV for that route</li>
          <li>Explore relevant training when it genuinely helps</li>
        </ol>
        ${cta(planUrl, 'Open My Plan')}
        <p style="font-size:13px;color:#475569;">We never guarantee jobs, income or visas. Recommendations are practical guidance only.</p>
      `
      const text = `Welcome, ${who}

JobAZ helps you find a practical UK career route.

Next steps:
1) Use Career Assistant
2) Save your plan in My Plan
3) Improve your CV for that route
4) Explore relevant training when it helps

Open My Plan: ${planUrl}

We never guarantee jobs, income or visas.`
      return {
        templateKey: key,
        emailType: meta.emailType,
        subject,
        html: wrapHtml(htmlBody, {}),
        text,
      }
    }

    case 'continue_plan': {
      const subject = 'Continue your JobAZ career plan'
      const htmlBody = `
        <h1 style="font-size:20px;margin:0 0 12px;">Hi ${escapeHtml(who)}, continue your plan</h1>
        <p>You have a career plan on JobAZ. Opening My Plan keeps your next steps clear.</p>
        ${safeLine('Route', ctx.route)}
        ${safeLine('Target role', ctx.targetRole)}
        ${safeLine('Next upgrade', ctx.nextUpgrade)}
        ${cta(planUrl, 'Continue your plan')}
        <p style="font-size:13px;color:#475569;">Practical guidance only — no job or income guarantees.</p>
      `
      const text = `Hi ${who}, continue your JobAZ plan.

${safeTextLine('Route', ctx.route)}${safeTextLine('Target role', ctx.targetRole)}${safeTextLine('Next upgrade', ctx.nextUpgrade)}
Continue: ${planUrl}

Practical guidance only — no job or income guarantees.`
      return {
        templateKey: key,
        emailType: meta.emailType,
        subject,
        html: wrapHtml(htmlBody, {}),
        text,
      }
    }

    case 'continue_cv': {
      const subject = 'Improve your CV for your JobAZ plan'
      const htmlBody = `
        <h1 style="font-size:20px;margin:0 0 12px;">Hi ${escapeHtml(who)}, continue your CV</h1>
        <p>Your CV works best when it matches your active career plan — JobAZ is not a second career planner inside CV Builder.</p>
        ${safeLine('Route', ctx.route)}
        ${safeLine('Target role', ctx.targetRole)}
        ${cta(cvUrl, 'Continue your CV')}
        <p style="font-size:13px;color:#475569;">Focus on reliability, relevant skills and clear next steps. No guarantees of interviews or offers.</p>
      `
      const text = `Hi ${who}, continue your CV for your JobAZ plan.

${safeTextLine('Route', ctx.route)}${safeTextLine('Target role', ctx.targetRole)}
Continue CV: ${cvUrl}

No guarantees of interviews or offers.`
      return {
        templateKey: key,
        emailType: meta.emailType,
        subject,
        html: wrapHtml(htmlBody, {}),
        text,
      }
    }

    case 'recommended_course': {
      const hasRealCourse = Boolean(String(ctx.courseTitle || '').trim())
      const subject = hasRealCourse
        ? `Training reminder: ${String(ctx.courseTitle).trim()}`
        : 'A training reminder from JobAZ'
      const courseBlock = hasRealCourse
        ? `${safeLine('Training', ctx.courseTitle)}${safeLine('Provider', ctx.providerName)}`
        : `<p>When you are ready, review the recommended training type for your route in Courses / Licences. We only name a live provider when it is published on JobAZ.</p>`
      const courseText = hasRealCourse
        ? `${safeTextLine('Training', ctx.courseTitle)}${safeTextLine('Provider', ctx.providerName)}`
        : 'Review the recommended training type for your route in Courses / Licences.\n'

      const htmlBody = `
        <h1 style="font-size:20px;margin:0 0 12px;">Hi ${escapeHtml(who)}</h1>
        <p>A quick reminder about training that may support your JobAZ route.</p>
        ${safeLine('Route', ctx.route)}
        ${safeLine('Next upgrade', ctx.nextUpgrade)}
        ${courseBlock}
        ${cta(coursesUrl, 'View courses')}
        <p style="font-size:13px;color:#475569;">This is not a job or income guarantee. Only published JobAZ offers should be treated as live Apply Now options.</p>
      `
      const text = `Hi ${who}

A training reminder for your JobAZ route.
${safeTextLine('Route', ctx.route)}${safeTextLine('Next upgrade', ctx.nextUpgrade)}${courseText}
View courses: ${coursesUrl}

Not a job or income guarantee.
${ctx.unsubscribeUrl ? `Unsubscribe: ${ctx.unsubscribeUrl}` : ''}`
      return {
        templateKey: key,
        emailType: meta.emailType,
        subject,
        html: wrapHtml(htmlBody, {
          marketing: true,
          unsubscribeUrl: ctx.unsubscribeUrl,
        }),
        text,
      }
    }

    case 'admin_custom':
    default: {
      const subject =
        String(ctx.customSubject || '').trim() || 'A message from JobAZ'
      const message =
        String(ctx.customMessage || '').trim() ||
        'Please sign in to JobAZ to continue your career plan.'
      const htmlBody = `
        <h1 style="font-size:20px;margin:0 0 12px;">Hi ${escapeHtml(who)}</h1>
        <div style="white-space:pre-wrap;">${escapeHtml(message)}</div>
        ${cta(homeUrl, 'Open JobAZ')}
        <p style="font-size:13px;color:#475569;">Practical guidance only — no job or income guarantees.</p>
      `
      const text = `Hi ${who}

${message}

Open JobAZ: ${homeUrl}

Practical guidance only — no job or income guarantees.`
      return {
        templateKey: 'admin_custom',
        emailType: meta.emailType,
        subject,
        html: wrapHtml(htmlBody, {}),
        text,
      }
    }
  }
}
