import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/adminApp';
import { AUTH_COOKIE_NAME } from './constants';
import { isAllowedEmail } from './validation';

export type AuthenticatedUser = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
};

export async function getAuthenticatedUser(): Promise<AuthenticatedUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;

  if (!token) return null;

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);

    if (!isAllowedEmail(decodedToken.email)) {
      return null;
    }

    return {
      uid: decodedToken.uid,
      email: decodedToken.email!,
      displayName: decodedToken.name || null,
      photoURL: decodedToken.picture || null,
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export async function requireAuth(): Promise<AuthenticatedUser> {
  const user = await getAuthenticatedUser();
  if (!user) {
    throw new Error('Unauthorized');
  }
  return user;
}
