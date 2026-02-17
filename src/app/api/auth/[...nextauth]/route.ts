import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const isAuthConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.AUTH_SECRET);

async function getHandlers() {
  const { handlers } = await import('@/lib/auth/auth');
  return handlers;
}

export async function GET(req: NextRequest) {
  if (!isAuthConfigured) {
    return NextResponse.json({});
  }
  const handlers = await getHandlers();
  return handlers.GET(req);
}

export async function POST(req: NextRequest) {
  if (!isAuthConfigured) {
    return NextResponse.json({});
  }
  const handlers = await getHandlers();
  return handlers.POST(req);
}
