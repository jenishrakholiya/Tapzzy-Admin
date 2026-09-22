import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    const { valid } = await verifySessionToken(token);
    isAuthenticated = valid;
  }

  // 1. Protect Admin API mutations (POST, PATCH, DELETE)
  if (pathname.startsWith('/api/admin')) {
    const isAuthRoute = pathname.startsWith('/api/admin/auth');
    if (!isAuthRoute && request.method !== 'GET') {
      if (!isAuthenticated) {
        const unauthResponse = NextResponse.json(
          { error: 'Unauthorized: Admin authentication required' },
          { status: 401 }
        );
        return addSecurityHeaders(unauthResponse);
      }
    }
    return addSecurityHeaders(NextResponse.next());
  }

  // 2. Protect Admin Web UI Routes
  if (pathname.startsWith('/admin')) {
    const isLoginPage = pathname === '/admin/login';

    // If trying to access login page while already authenticated -> redirect to /admin
    if (isLoginPage && isAuthenticated) {
      const adminUrl = new URL('/admin', request.url);
      return addSecurityHeaders(NextResponse.redirect(adminUrl));
    }

    // If trying to access protected admin route without authentication -> redirect to /admin/login
    if (!isLoginPage && !isAuthenticated) {
      const loginUrl = new URL('/admin/login', request.url);
      if (pathname !== '/admin') {
        loginUrl.searchParams.set('returnUrl', pathname);
      }
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  return addSecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: ['/admin', '/admin/:path*', '/api/admin/:path*'],
};
