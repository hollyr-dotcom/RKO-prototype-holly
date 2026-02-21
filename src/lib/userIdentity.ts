import type { AuthUser } from '@/hooks/useAuth';

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

// Miro DS cursor color palette (10 colors from Canvas design system)
export const CURSOR_COLORS = [
  { name: "coral",    fill: "#FFB4B4", stroke: "#C52C2C", text: "#600000" },
  { name: "orange",   fill: "#FFC795", stroke: "#D76F1A", text: "#5C2000" },
  { name: "sunshine", fill: "#FFF09A", stroke: "#E2BC1A", text: "#503A03" },
  { name: "lime",     fill: "#C6EF88", stroke: "#759F38", text: "#21370B" },
  { name: "moss",     fill: "#8AE9A8", stroke: "#069330", text: "#02400F" },
  { name: "teal",     fill: "#A8F7F0", stroke: "#0A9285", text: "#0E4343" },
  { name: "cyan",     fill: "#B5ECFF", stroke: "#049BCD", text: "#003E57" },
  { name: "ocean",    fill: "#A7C9FC", stroke: "#4978C0", text: "#001D66" },
  { name: "lilac",    fill: "#BBB4FF", stroke: "#7C59DF", text: "#20084F" },
  { name: "pink",     fill: "#FBBEEA", stroke: "#C851C3", text: "#55055C" },
] as const;

export type CursorColor = (typeof CURSOR_COLORS)[number];

/** Look up the full color object from a fill hex value */
export function getCursorColorByFill(fill: string): CursorColor | undefined {
  return CURSOR_COLORS.find(c => c.fill === fill);
}

// ── Color assignment: round-robin without repeats ──
// Tracks which color indices have been used. Resets when all are exhausted.
const usedColorIndices = new Set<number>();

function getNextColorIndex(): number {
  // If all colors used, reset
  if (usedColorIndices.size >= CURSOR_COLORS.length) {
    usedColorIndices.clear();
  }
  // Pick a random unused index
  const available = Array.from({ length: CURSOR_COLORS.length }, (_, i) => i)
    .filter(i => !usedColorIndices.has(i));
  const idx = available[Math.floor(Math.random() * available.length)];
  usedColorIndices.add(idx);
  return idx;
}

// Hash string to pick a cursor color from the palette (for authenticated users)
function hashStringToColorIndex(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash % CURSOR_COLORS.length);
}

export function getSessionUser(authUser: AuthUser): SessionUser {
  const firstName = authUser.displayName?.split(' ')[0] ||
                     authUser.email?.split('@')[0] ||
                     'User';

  return {
    id: authUser.uid,
    name: firstName,
    color: CURSOR_COLORS[hashStringToColorIndex(authUser.uid)].fill,
    email: authUser.email!,
    photoURL: authUser.photoURL,
  };
}

// Fallback for local dev without auth — each session gets a unique ID & unique color
export function getLocalDevUser(): SessionUser {
  const id = generateId();
  const colorIdx = getNextColorIndex();
  return {
    id,
    name: 'Dev',
    color: CURSOR_COLORS[colorIdx].fill,
    email: 'dev@local',
    photoURL: null,
  };
}

// Fallback for server-side contexts
export function getServerSessionUser(): SessionUser {
  return {
    id: 'server',
    name: 'Server',
    color: CURSOR_COLORS[hashStringToColorIndex('server')].fill,
    email: 'server@internal',
    photoURL: null,
  };
}
