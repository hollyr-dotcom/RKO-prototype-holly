import usersData from "@/data/users.json";

export type User = (typeof usersData.users)[number];

const usersMap = new Map<string, User>();
for (const user of usersData.users) {
  usersMap.set(user.id, user);
}

export function getUser(userId: string): User | undefined {
  return usersMap.get(userId);
}

export function getUsersMap(): Map<string, User> {
  return usersMap;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

const AVATAR_COLORS = [
  "#6366f1",
  "#8b5cf6",
  "#ec4899",
  "#f43f5e",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#06b6d4",
  "#3b82f6",
];

export function getUserColor(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}
