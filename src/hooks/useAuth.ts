'use client';

import { useState, useEffect } from 'react';
import { User, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase/clientApp';
import { isAllowedEmail } from '@/lib/auth/validation';
import { ALLOWED_EMAIL_DOMAIN, AUTH_COOKIE_MAX_AGE } from '@/lib/auth/constants';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        if (isAllowedEmail(firebaseUser.email)) {
          setUser(firebaseUser);
          // Set auth cookie for server-side validation
          const token = await firebaseUser.getIdToken();
          document.cookie = `auth-token=${token}; path=/; max-age=${AUTH_COOKIE_MAX_AGE}; samesite=strict; secure`;
        } else {
          await firebaseSignOut(auth);
          setError(`Only @${ALLOWED_EMAIL_DOMAIN} email addresses are allowed`);
          setUser(null);
        }
      } else {
        setUser(null);
        document.cookie = 'auth-token=; path=/; max-age=0';
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ hd: ALLOWED_EMAIL_DOMAIN });
      await signInWithPopup(auth, provider);
    } catch (err: any) {
      setError(err.message || 'Sign-in failed');
      throw err;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return { user, loading, error, signInWithGoogle, signOut };
}
