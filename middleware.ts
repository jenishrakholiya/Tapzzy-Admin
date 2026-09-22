import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME, verifySessionToken } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only apply to /admin and /admin/*
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
  let isAuthenticated = false;

  if (token) {
    const { valid } = await verifySessionToken(token);
    isAuthenticated = valid;
  }



  const isLoginPage = pathname === '/admin/login';

  // If trying to access login page while already authenticated -> redirect to /admin
  if (isLoginPage && isAuthenticated) {
    const adminUrl = new URL('/admin', request.url);
    return NextResponse.redirect(adminUrl);
  }

  // If trying to access protected admin route without authentication -> redirect to /admin/login
  if (!isLoginPage && !isAuthenticated) {
    const loginUrl = new URL('/admin/login', request.url);
    // Include returnUrl so user can be redirected back after login
    if (pathname !== '/admin') {
      loginUrl.searchParams.set('returnUrl', pathname);
    }
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
};
