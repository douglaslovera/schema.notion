import { type NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

const publicRoutes = ['/', '/sign-in', '/api/auth', '/share', '/embed']

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  )

  const sessionToken = getSessionCookie(request)

  // Redirect to sign-in if accessing protected route without session
  if (!isPublicRoute && !sessionToken) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  // Do not redirect /sign-in based on cookie presence alone.
  // A stale/invalid Better Auth cookie can exist without a valid server session,
  // which causes an infinite /sign-in <-> protected-route redirect loop.

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
