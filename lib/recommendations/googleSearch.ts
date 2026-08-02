export function buildGoogleCourseSearchUrl(keywords: string): string {
  const query = keywords.trim() || 'UK course training'
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`
}
