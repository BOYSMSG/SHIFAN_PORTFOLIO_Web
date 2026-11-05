import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware for Admin Route Protection
 * Intercepts all /admin routes (except /admin/login) and guarantees
 * unauthenticated visitors are redirected to the security gateway.
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect all /admin routes except /admin/login (and any auth endpoints/callbacks)
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const sessionCookie = req.cookies.get('shifan_admin_session')?.value;

    // Fail closed: if no session cookie exists, redirect immediately to login
    if (!sessionCookie) {
      const loginUrl = new URL('/admin/login', req.url);
      loginUrl.searchParams.set('from', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
