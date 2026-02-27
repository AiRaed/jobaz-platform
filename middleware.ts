import { NextResponse, type NextRequest } from 'next/server'

/**
 * Edge-safe middleware: no Node-only APIs (no @supabase/ssr here).
 * Auth is inferred from Supabase auth cookie presence; session refresh
 * happens in Node (auth callback and API routes using createServerClient).
 */
function getSupabaseAuthCookieName(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) return ''
  try {
    const ref = new URL(url).hostname.split('.')[0]
    return ref ? `sb-${ref}-auth-token` : ''
  } catch {
    return ''
  }
}

function hasAuthCookie(request: NextRequest): boolean {
  const name = getSupabaseAuthCookieName()
  if (!name) return false
  const value = request.cookies.get(name)?.value
  return Boolean(value && value.length > 0)
}

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: { headers: request.headers },
  })

  const user = hasAuthCookie(request)
  const { pathname } = request.nextUrl

  // Handle /sitemap.xml - always allow, never redirect (must return XML)
  if (pathname === '/sitemap.xml') {
    return response
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth', '/privacy', '/terms', '/about']
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))
  
  // Protected routes that require authentication
  const protectedRoutes = [
    '/dashboard',
    '/job-details',
    '/cv-builder-v2',
    '/cover',
    '/interview-coach',
    '/interviewSimulation',
    '/job-finder',
    '/job-setup',
    '/preview',
    '/upgrade',
    '/build-your-path',
    '/proofreading'
  ]
  const isProtectedRoute = protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'))

  // Handle /auth/callback - allow access (needed for email confirmation and password reset)
  if (pathname.startsWith('/auth/callback')) {
    return response
  }

  // Handle /auth/reset-password - allow access (needed for password reset, even with session)
  if (pathname.startsWith('/auth/reset-password')) {
    return response
  }

  // Handle /auth/reset - allow access (needed for password reset, even with session)
  if (pathname.startsWith('/auth/reset')) {
    return response
  }

  // Handle /auth route
  if (pathname.startsWith('/auth')) {
    // If user is logged in and tries to access /auth, redirect to dashboard
    if (user) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // If not logged in, allow access to /auth
    return response
  }

  // Handle protected routes
  if (isProtectedRoute) {
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    // Email confirmation is enforced in auth callback and dashboard (Node); not checked in Edge middleware
  }
  
  // Handle other routes (not explicitly public or protected)
  // If not public and user is not logged in, redirect to landing page
  if (!isPublicRoute && !isProtectedRoute && !user) {
    // Allow access to other routes if not logged in (like /api routes, etc.)
    // Only redirect if it looks like a page route
    if (!pathname.startsWith('/api') && !pathname.startsWith('/_next')) {
      return NextResponse.redirect(new URL('/', request.url))
    }
  }

  // Allow access to public routes or authenticated users
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - api (API routes)
     * - favicon.ico (favicon file)
     * - static files (images, fonts, etc.)
     */
    '/((?!_next/static|_next/image|api|favicon.ico|sitemap.xml|robots.txt|manifest.json|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|map|woff|woff2|ttf|eot)$).*)',
  ],
}

