import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Note: Firebase Admin SDK doesn't work in Edge runtime
// This middleware performs basic cookie checks
// Full verification happens in API routes and server components

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;

  // If no token, let client-side AuthGate handle redirect
  if (!token) {
    return NextResponse.next();
  }

  // Token exists, proceed (full verification in API routes)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
