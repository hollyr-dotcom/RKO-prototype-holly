import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isAuthConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.AUTH_SECRET);

export async function middleware(req: NextRequest) {
  if (!isAuthConfigured) {
    return NextResponse.next();
  }

  const { auth } = await import('@/lib/auth/auth');
  return (auth as unknown as (req: NextRequest) => Promise<NextResponse>)(req);
}

export const config = {
  matcher: [
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
