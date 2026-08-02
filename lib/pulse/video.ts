/** Validate and parse external video URLs for Pulse (Phase 1 — links only). */

export type VideoProvider = 'youtube' | 'tiktok' | 'instagram' | 'linkedin' | 'unknown'

export type ParsedVideoUrl = {
  ok: boolean
  provider: VideoProvider
  url: string
  embedUrl: string | null
  /** Safe to store as video_url when ok && provider !== unknown */
  allowed: boolean
  reason?: string
}

const ALLOWED_HOSTS: Record<VideoProvider, string[]> = {
  youtube: ['youtube.com', 'www.youtube.com', 'm.youtube.com', 'youtu.be', 'www.youtu.be'],
  tiktok: ['tiktok.com', 'www.tiktok.com', 'vm.tiktok.com'],
  instagram: ['instagram.com', 'www.instagram.com'],
  linkedin: ['linkedin.com', 'www.linkedin.com'],
  unknown: [],
}

function hostMatches(hostname: string, allowed: string[]): boolean {
  const h = hostname.toLowerCase()
  return allowed.some((a) => h === a || h.endsWith('.' + a))
}

function youtubeEmbed(url: URL): string | null {
  let id: string | null = null
  if (url.hostname.includes('youtu.be')) {
    id = url.pathname.replace(/^\//, '').split('/')[0] || null
  } else if (url.pathname.startsWith('/shorts/')) {
    id = url.pathname.split('/')[2] || null
  } else {
    id = url.searchParams.get('v')
  }
  if (!id || !/^[a-zA-Z0-9_-]{6,20}$/.test(id)) return null
  return `https://www.youtube.com/embed/${id}?rel=0`
}

export function parsePulseVideoUrl(raw: string | null | undefined): ParsedVideoUrl {
  const trimmed = String(raw || '').trim()
  if (!trimmed) {
    return { ok: true, provider: 'unknown', url: '', embedUrl: null, allowed: true }
  }

  let url: URL
  try {
    url = new URL(trimmed)
  } catch {
    return {
      ok: false,
      provider: 'unknown',
      url: trimmed,
      embedUrl: null,
      allowed: false,
      reason: 'Invalid URL',
    }
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return {
      ok: false,
      provider: 'unknown',
      url: trimmed,
      embedUrl: null,
      allowed: false,
      reason: 'Only http(s) video links are allowed',
    }
  }

  const host = url.hostname.toLowerCase()

  if (hostMatches(host, ALLOWED_HOSTS.youtube)) {
    return {
      ok: true,
      provider: 'youtube',
      url: trimmed,
      embedUrl: youtubeEmbed(url),
      allowed: true,
    }
  }
  if (hostMatches(host, ALLOWED_HOSTS.tiktok)) {
    return {
      ok: true,
      provider: 'tiktok',
      url: trimmed,
      embedUrl: null,
      allowed: true,
    }
  }
  if (hostMatches(host, ALLOWED_HOSTS.instagram)) {
    return {
      ok: true,
      provider: 'instagram',
      url: trimmed,
      embedUrl: null,
      allowed: true,
    }
  }
  if (hostMatches(host, ALLOWED_HOSTS.linkedin)) {
    return {
      ok: true,
      provider: 'linkedin',
      url: trimmed,
      embedUrl: null,
      allowed: true,
    }
  }

  return {
    ok: false,
    provider: 'unknown',
    url: trimmed,
    embedUrl: null,
    allowed: false,
    reason: 'Unknown video domain — store as source link only, not video_url',
  }
}

export function isAllowedPulseVideoUrl(raw: string | null | undefined): boolean {
  const parsed = parsePulseVideoUrl(raw)
  return parsed.allowed && (parsed.url === '' || parsed.provider !== 'unknown')
}
