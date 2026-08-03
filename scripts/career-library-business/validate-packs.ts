import { GENERAL_LEADERSHIP_PACKS } from './packs-general-leadership'
import { PROJECTS_CONSULTING_PACKS } from './packs-projects-consulting'
import { COMMERCIAL_OPS_PACKS } from './packs-commercial-ops'
import { GOVERNANCE_SPECIALIST_PACKS } from './packs-governance-specialist'
import { normalizeSlug } from '../../lib/admin/career-library/guards'

const packs = [
  ...GENERAL_LEADERSHIP_PACKS,
  ...PROJECTS_CONSULTING_PACKS,
  ...COMMERCIAL_OPS_PACKS,
  ...GOVERNANCE_SPECIALIST_PACKS,
]

const seen = new Map<string, string>()
const dupes: string[] = []
for (const p of packs) {
  for (const role of p.roles) {
    const k = role.name.trim().toLowerCase()
    if (seen.has(k)) dupes.push(`${role.name} @ ${p.slug} also ${seen.get(k)}`)
    else seen.set(k, p.slug)
  }
}

console.log('Packs', packs.length)
console.log('Roles', packs.reduce((a, p) => a + p.roles.length, 0))
console.log('Unique', seen.size)
console.log('Dupes', dupes.length)
if (dupes.length) for (const d of dupes.slice(0, 40)) console.log(' ', d)

const expected = [
  'Business Management','Business Administration','Business Operations','Business Development','Entrepreneurship and Start-ups','Small Business Management','Family Business','International Business','General Management','Operational Management','Strategic Management','Change Management','Organisational Development','Leadership and People Management','Executive Management','Project Management','Programme Management','Portfolio Management','PMO','Agile Delivery','Business Transformation','Implementation Management','Business Analysis','Management Consulting','Strategy Consulting','Process Improvement','Continuous Improvement','Service Improvement','Business Process Management','Commercial Management','Procurement','Purchasing','Contract Management','Supplier Management','Category Management','Bid and Proposal Management','Tender Management','Service Management','Facilities and Workplace Management','Quality Management','Customer Operations','Shared Services','Business Support','Office Management','Executive Support','Corporate Governance','Enterprise Risk Management','Business Continuity','Internal Controls','Corporate Responsibility','ESG and Sustainability Management','Product Management','Innovation Management','Franchise Management','Export and Trade Management','Business Systems and ERP','Data-informed Business Management','Business and Management Research','Organisational Behaviour','Entrepreneurship Research','Strategy Research','Operations Management Research',
]
const packSlugs = new Set(packs.map((p) => p.slug))
const missing: string[] = []
for (const n of expected) {
  const slug = normalizeSlug(undefined, n)
  if (!slug || !packSlugs.has(slug)) missing.push(`${n} => ${slug}`)
}
console.log('Missing packs:', missing.length ? missing.join('; ') : 'none')
