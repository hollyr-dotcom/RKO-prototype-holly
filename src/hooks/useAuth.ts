'use client';

import { useSession, signIn, signOut } from 'next-auth/react';

export type AuthUser = {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
};

const isConfigured = process.env.NEXT_PUBLIC_AUTH_CONFIGURED === 'true';

export function useAuth() {
  const { data: session, status } = useSession();

  const loading = isConfigured && status === 'loading';

  const user: AuthUser | null =
    session?.user?.email
      ? {
          uid: session.user.id ?? session.user.email,
          email: session.user.email,
          displayName: session.user.name ?? null,
          photoURL: session.user.image ?? null,
        }
      : null;

  const signInWithGoogle = async () => {
    await signIn('google');
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return {
    user,
    loading,
    error: null as string | null,
    signInWithGoogle,
    signOut: handleSignOut,
    isConfigured,
  };
}
