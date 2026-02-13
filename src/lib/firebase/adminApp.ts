import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

const isConfigured = !!process.env.FIREBASE_ADMIN_PROJECT_ID;

let adminAuth: Auth | null = null;

if (isConfigured) {
  const apps = getApps();
  const app = apps.length === 0
    ? initializeApp({
        credential: cert({
          projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
          clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
          privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        }),
      })
    : apps[0];

  adminAuth = getAuth(app);
}

export { adminAuth };
