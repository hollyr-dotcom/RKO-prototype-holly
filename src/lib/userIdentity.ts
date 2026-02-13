import { User } from 'firebase/auth';

export type SessionUser = {
  id: string;
  name: string;
  color: string;
  email: string;
  photoURL: string | null;
};

/** Generate a random UUID, with fallback for insecure contexts (e.g. plain HTTP on LAN). */
export function generateId(): string {
  return (
    crypto.randomUUID?.() ??
    Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
      b.toString(16).padStart(2, "0")
    ).join("")
  );
}

// Hash string to consistent color
function hashStringToColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
}

export function getSessionUser(firebaseUser: User): SessionUser {
  const firstName = firebaseUser.displayName?.split(' ')[0] ||
                     firebaseUser.email?.split('@')[0] ||
                     'User';

  return {
    id: firebaseUser.uid,
    name: firstName,
    color: hashStringToColor(firebaseUser.uid),
    email: firebaseUser.email!,
    photoURL: firebaseUser.photoURL,
  };
}

// Fallback for local dev without Firebase auth
export function getLocalDevUser(): SessionUser {
  return {
    id: 'local-dev',
    name: 'Dev',
    color: '#6366f1',
    email: 'dev@local',
    photoURL: null,
  };
}

// Fallback for server-side contexts
export function getServerSessionUser(): SessionUser {
  return {
    id: 'server',
    name: 'Server',
    color: '#999999',
    email: 'server@internal',
    photoURL: null,
  };
}
