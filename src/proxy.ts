import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Protect /admin and all sub-paths
  if (pathname.startsWith('/admin')) {
    const userRole = request.cookies.get('user_role')?.value;

    // No valid role cookie → redirect to /login
    if (!userRole) {
      const loginUrl = new URL('/login', request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  // Match /admin and all sub-paths
  matcher: ['/admin/:path*'],
};
