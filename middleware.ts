import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const acceptHeader = request.headers.get('accept');
  if (acceptHeader && acceptHeader.includes('text/x-component')) {
    return NextResponse.next();
  }

  // Redirect root path to /chat
  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/chat', request.url));
  }

  // Add a new header x-current-path which passes the path to downstream components
  const headers = new Headers(request.headers);
  headers.set('x-current-path', request.nextUrl.pathname);
  return NextResponse.next({ headers });
}

export const config = {
  matcher: [
    // match all routes except static files and APIs
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
