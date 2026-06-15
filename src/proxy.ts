import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  // Scan all cookies for any key containing 'session-token' or 'session_token'
  const allCookies = request.cookies.getAll();
  const sessionCookie = allCookies.find(c => 
    c.name.includes('session-token') || 
    c.name.includes('session_token')
  );
  const sessionToken = sessionCookie?.value;

  const { pathname } = request.nextUrl;
  const isDashboard = pathname.startsWith('/dashboard');
  const isAuthPage = pathname === '/login' || pathname === '/register';

  if (isDashboard && !sessionToken) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthPage && sessionToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
