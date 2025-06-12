import { NextResponse } from 'next/server';

// Public routes that don't need authentication
const publicRoutes = [
  '/',
  '/login',
  '/signup',
  '/unauthorized',
];

export function middleware(request) {
  const path = request.nextUrl.pathname;
  if (publicRoutes.includes(path)) {
    return NextResponse.next();
  }

  // Just check for the presence of a session cookie
  const session = request.cookies.get('session')?.value;
  if (!session) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Optionally, decode the JWT here (but do not verify with firebase-admin)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
}; 