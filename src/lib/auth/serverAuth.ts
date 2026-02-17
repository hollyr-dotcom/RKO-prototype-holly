import { auth } from './auth';
import { isAllowedEmail } from './validation';

export type AuthenticatedUser = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
};

const isConfigured = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.AUTH_SECRET);

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  if (!isConfigured) return null;

  const session = await auth();
  if (!session?.user?.email) return null;

  if (!isAllowedEmail(session.user.email)) {
    return null;
  }

  return {
    uid: session.user.id,
    email: session.user.email,
    displayName: session.user.name || null,
    photoURL: session.user.image || null,
  };
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  // Skip auth when Auth.js isn't configured (local dev)
  if (!isConfigured) return { uid: 'local', email: 'dev@local', displayName: 'Local Dev', photoURL: null };

  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
