/**
 * Alias architecture for Work in My Education normalisation.
 * Seed data today; designed so Admin can later persist aliases without code changes.
 */

export type AliasKind =
  | 'qualification'
  | 'subject'
  | 'specialisation'
  | 'field'
  | 'specialism'
  | 'terminology'

export type CareerKnowledgeAlias = {
  kind: AliasKind
  canonical: string
  aliases: string[]
  /** Optional target slug when alias maps to a field/specialism */
  target_slug?: string
  notes?: string
}

/** Normalise for alias lookup (lowercase, strip punctuation, collapse space). */
export function aliasKey(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9+]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/**
 * Seed aliases — expandable / later Admin-managed.
 * Do not treat this list as exhaustive; matching also uses token overlap.
 */
export const SEED_ALIASES: CareerKnowledgeAlias[] = [
  // Qualifications
  {
    kind: 'qualification',
    canonical: 'master of science',
    aliases: ['msc', 'm.sc', 'm.sc.', 'ms', 'm.s', 'master of science', 'masters of science', "master's of science"],
  },
  {
    kind: 'qualification',
    canonical: 'bachelor of science',
    aliases: ['bsc', 'b.sc', 'b.sc.', 'bs', 'b.s', 'bachelor of science', 'bachelors of science'],
  },
  {
    kind: 'qualification',
    canonical: 'bachelor of engineering',
    aliases: ['beng', 'b.eng', 'b.eng.', 'bachelor of engineering', 'bachelors of engineering'],
  },
  {
    kind: 'qualification',
    canonical: 'master of engineering',
    aliases: ['meng', 'm.eng', 'm.eng.', 'master of engineering'],
  },
  {
    kind: 'qualification',
    canonical: 'bachelor of arts',
    aliases: ['ba', 'b.a', 'b.a.', 'bachelor of arts'],
  },
  {
    kind: 'qualification',
    canonical: 'master of arts',
    aliases: ['ma', 'm.a', 'm.a.', 'master of arts'],
  },
  {
    kind: 'qualification',
    canonical: 'bachelor of laws',
    aliases: ['llb', 'll.b', 'll.b.', 'bachelor of laws', 'law degree'],
  },
  {
    kind: 'qualification',
    canonical: 'master of laws',
    aliases: ['llm', 'll.m', 'll.m.', 'master of laws'],
  },
  {
    kind: 'qualification',
    canonical: 'bachelor of medicine',
    aliases: ['mbbs', 'mbchb', 'mb chb', 'mb bch', 'bachelor of medicine', 'bachelor of medicine and surgery'],
  },
  {
    kind: 'qualification',
    canonical: 'doctor of philosophy',
    aliases: ['phd', 'ph.d', 'ph.d.', 'dphil', 'doctor of philosophy', 'doctorate'],
  },
  {
    kind: 'qualification',
    canonical: 'master of business administration',
    aliases: ['mba', 'm.b.a', 'master of business administration'],
  },
  {
    kind: 'qualification',
    canonical: 'bachelor of business administration',
    aliases: ['bba', 'bachelor of business administration'],
  },

  // Subjects / specialisations
  {
    kind: 'subject',
    canonical: 'computer science',
    aliases: ['computing', 'comp sci', 'cs', 'computer sciences', 'computing science'],
    target_slug: 'software-development',
  },
  {
    kind: 'subject',
    canonical: 'civil engineering',
    aliases: ['civil eng', 'civil engineer', 'structural and civil engineering'],
    target_slug: 'civil-engineering',
  },
  {
    kind: 'subject',
    canonical: 'mechanical engineering',
    aliases: ['mech eng', 'mechanical eng'],
    target_slug: 'mechanical-engineering',
  },
  {
    kind: 'subject',
    canonical: 'electrical engineering',
    aliases: ['elec eng', 'electrical eng', 'electrical and electronic engineering'],
    target_slug: 'electrical-engineering',
  },
  {
    kind: 'subject',
    canonical: 'business management',
    aliases: [
      'business administration',
      'business studies',
      'management studies',
      'general management',
      'business and management',
    ],
    target_slug: 'general-management',
  },
  {
    kind: 'subject',
    canonical: 'animation',
    aliases: ['3d animation', 'computer animation', 'digital animation', 'cgi animation'],
    target_slug: 'animation',
  },
  {
    kind: 'subject',
    canonical: 'law',
    aliases: ['legal studies', 'jurisprudence', 'laws'],
    target_slug: 'solicitor-practice',
  },
  {
    kind: 'subject',
    canonical: 'medicine',
    aliases: ['medical science', 'human medicine', 'clinical medicine'],
    target_slug: 'medicine',
  },
  {
    kind: 'subject',
    canonical: 'nursing',
    aliases: ['adult nursing', 'registered nursing', 'nursing studies'],
    target_slug: 'nursing',
  },
  {
    kind: 'subject',
    canonical: 'biology',
    aliases: ['biological sciences', 'biological science', 'life sciences', 'bioscience'],
    target_slug: 'biology',
  },
  {
    kind: 'subject',
    canonical: 'tourism management',
    aliases: ['tourism', 'travel and tourism', 'tourism and hospitality', 'tourism studies'],
    target_slug: 'tourism-management',
  },
  {
    kind: 'subject',
    canonical: 'hospitality management',
    aliases: ['hospitality', 'hotel management', 'hospitality studies'],
  },
  {
    kind: 'terminology',
    canonical: 'programme',
    aliases: ['program'],
  },
  {
    kind: 'terminology',
    canonical: 'organisation',
    aliases: ['organization'],
  },
  {
    kind: 'terminology',
    canonical: 'specialisation',
    aliases: ['specialization'],
  },
]

export type AliasIndex = {
  byKey: Map<string, CareerKnowledgeAlias>
  all: CareerKnowledgeAlias[]
}

export function buildAliasIndex(aliases: CareerKnowledgeAlias[] = SEED_ALIASES): AliasIndex {
  const byKey = new Map<string, CareerKnowledgeAlias>()
  for (const entry of aliases) {
    byKey.set(aliasKey(entry.canonical), entry)
    for (const a of entry.aliases) {
      byKey.set(aliasKey(a), entry)
    }
  }
  return { byKey, all: aliases }
}

export function resolveAlias(
  raw: string,
  index: AliasIndex,
  kinds?: AliasKind[]
): { canonical: string; hit: CareerKnowledgeAlias | null; target_slug?: string } {
  const key = aliasKey(raw)
  if (!key) return { canonical: '', hit: null }
  const hit = index.byKey.get(key) ?? null
  if (hit && kinds && !kinds.includes(hit.kind)) {
    return { canonical: key, hit: null }
  }
  if (hit) {
    return {
      canonical: hit.canonical,
      hit,
      target_slug: hit.target_slug,
    }
  }
  return { canonical: key, hit: null }
}
