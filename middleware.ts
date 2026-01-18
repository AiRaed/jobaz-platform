import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client for middleware
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Get the current user (more reliable than getSession for middleware)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Get session for email confirmation checks
  const {
    data: { session },
  } = await supabase.auth.getSession()

  const { pathname } = request.nextUrl

  // Handle /sitemap.xml - always allow, never redirect (must return XML)
  if (pathname === '/sitemap.xml') {
    return response
  }

  // Public routes that don't require authentication
  const publicRoutes = ['/', '/auth', '/privacy', '/terms']
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
    '/build-your-path'
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
    // If user is not logged in, redirect to landing page
    if (!user) {
      return NextResponse.redirect(new URL('/', request.url))
    }
    
    // Check if email is confirmed (session should exist if user exists)
    if (session?.user && !session.user.email_confirmed_at) {
      // For dashboard, redirect to auth page with email confirmation message
      if (pathname.startsWith('/dashboard')) {
        const url = new URL('/auth', request.url)
        url.searchParams.set('error', 'email_not_confirmed')
        url.searchParams.set('message', 'Please confirm your email address before accessing the dashboard.')
        return NextResponse.redirect(url)
      }
      // For other protected routes, redirect to auth page
      const url = new URL('/auth', request.url)
      url.searchParams.set('error', 'email_not_confirmed')
      url.searchParams.set('message', 'Please confirm your email address to continue.')
      return NextResponse.redirect(url)
    }
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

