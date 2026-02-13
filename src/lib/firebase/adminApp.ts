import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

function getAdminApp(): App | null {
  const apps = getApps();
  if (apps.length > 0) return apps[0];

  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    // Skip Firebase init when keys aren't configured (local dev without Firebase)
    return null;
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

let _adminAuth: Auth | null = null;

export function getAdminAuth(): Auth | null {
  if (!_adminAuth) {
    const app = getAdminApp();
    if (!app) return null;
    _adminAuth = getAuth(app);
  }
  return _adminAuth;
}

/** @deprecated Use getAdminAuth() instead for lazy initialization */
export const adminAuth: Auth | null = (() => {
  const app = getAdminApp();
  return app ? getAuth(app) : null;
})();
