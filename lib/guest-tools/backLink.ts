export function getToolBackLink(isLoggedIn: boolean): { href: string; label: string } {
  if (isLoggedIn) {
    return { href: '/career-hub', label: 'Back to Career Hub' }
  }
  return { href: '/', label: 'Back to Home' }
}
