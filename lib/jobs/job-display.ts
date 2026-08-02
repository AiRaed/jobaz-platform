/** Strip HTML and collapse whitespace for job card previews. */
export function sanitizeJobDescription(html: string, maxLength = 160): string {
  if (!html?.trim()) return ''

  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim()

  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength).trim()}…`
}

export function formatPostedLabel(postedAt?: string): string | undefined {
  if (!postedAt) return undefined
  const date = new Date(postedAt)
  if (Number.isNaN(date.getTime())) return undefined

  const diffMs = Date.now() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) return 'Posted today'
  if (diffDays === 1) return 'Posted yesterday'
  if (diffDays < 7) return `Posted ${diffDays} days ago`
  if (diffDays < 30) return `Posted ${Math.floor(diffDays / 7)} weeks ago`
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export function formatSalaryLabel(
  salary?: string,
  salaryMin?: number,
  salaryMax?: number
): string | undefined {
  if (salary?.trim()) return salary.trim()

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)

  if (salaryMin && salaryMax) return `${formatAmount(salaryMin)} – ${formatAmount(salaryMax)}`
  if (salaryMin) return `From ${formatAmount(salaryMin)}`
  if (salaryMax) return `Up to ${formatAmount(salaryMax)}`
  return undefined
}

export function displayCompany(company?: string): string {
  const value = company?.trim()
  if (!value || value.toLowerCase() === 'unknown company') return 'Company not listed'
  return value
}

export function displayLocation(location?: string): string {
  const value = location?.trim()
  if (!value || value.toLowerCase() === 'location not specified') return 'UK'
  return value
}
