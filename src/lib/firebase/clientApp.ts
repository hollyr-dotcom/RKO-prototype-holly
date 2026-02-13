import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Skip Firebase init when keys aren't configured (local dev without Firebase)
const isConfigured = !!firebaseConfig.apiKey;

let _app: FirebaseApp | null = null;
let _auth: Auth | null = null;

function getFirebaseApp(): FirebaseApp | null {
  if (_app) return _app;

  if (!isConfigured) {
    return null;
  }

  const apps = getApps();
  _app = apps.length > 0 ? apps[0] : initializeApp(firebaseConfig);
  return _app;
}

export function getFirebaseAuth(): Auth | null {
  if (_auth) return _auth;
  const app = getFirebaseApp();
  if (!app) return null;
  _auth = getAuth(app);
  return _auth;
}

/** Lazy-initialized auth — returns null when Firebase isn't configured */
export const auth: Auth | null = isConfigured
  ? new Proxy({} as Auth, {
      get(_target, prop, receiver) {
        const realAuth = getFirebaseAuth();
        if (!realAuth) return undefined;
        return Reflect.get(realAuth, prop, receiver);
      },
    })
  : null;
