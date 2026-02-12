const COLORS = [
  "#FF6B6B",
  "#4ECDC4",
  "#45B7D1",
  "#96CEB4",
  "#FFEAA7",
  "#DDA0DD",
  "#98D8C8",
  "#FF9F43",
  "#6C5CE7",
  "#A8E6CF",
];

const NAMES = [
  "Fox",
  "Owl",
  "Bear",
  "Deer",
  "Wolf",
  "Hawk",
  "Lynx",
  "Hare",
  "Orca",
  "Wren",
];

/** Generate a random UUID, with fallback for insecure contexts (e.g. plain HTTP on LAN). */
export function generateId(): string {
  return (
    crypto.randomUUID?.() ??
    Array.from(crypto.getRandomValues(new Uint8Array(16)), (b) =>
      b.toString(16).padStart(2, "0")
    ).join("")
  );
}

export type SessionUser = {
  id: string;
  name: string;
  color: string;
};

export function getSessionUser(): SessionUser {
  if (typeof window === "undefined") {
    return { id: "server", name: "Server", color: "#999999" };
  }

  const stored = sessionStorage.getItem("liveblocks-user");
  if (stored) {
    return JSON.parse(stored) as SessionUser;
  }

  const newUser: SessionUser = {
    id: generateId(),
    name: NAMES[Math.floor(Math.random() * NAMES.length)],
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
  };
  sessionStorage.setItem("liveblocks-user", JSON.stringify(newUser));
  return newUser;
}
