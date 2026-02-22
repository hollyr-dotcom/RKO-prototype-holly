"use client";

import { useOthers, useSelf } from "@/liveblocks.config";
import { IconChevronDown } from "@mirohq/design-system-icons";
import { getCursorColorByFill } from "@/lib/userIdentity";

// ─── Shared hook for extracting user data ──────────────────────

function useAvatarUsers() {
  const others = useOthers();
  const self = useSelf();

  const otherUsers = others
    .map((other) => {
      const presence = other.presence as Record<string, unknown> | undefined;
      const p = presence?.presence as
        | { userName?: string; color?: string }
        | null
        | undefined;
      const info = other.info as { name?: string; avatar?: string } | undefined;
      return {
        connectionId: other.connectionId,
        name: p?.userName || info?.name || `User ${other.connectionId}`,
        color: p?.color || "#999",
        avatar: info?.avatar || null,
      };
    })
    .filter(Boolean);

  const selfUser = self
    ? (() => {
        const presence = self.presence as Record<string, unknown> | undefined;
        const p = presence?.presence as
          | { userName?: string; color?: string }
          | null
          | undefined;
        const info = self.info as { name?: string; avatar?: string } | undefined;
        return {
          connectionId: self.connectionId,
          name: p?.userName || info?.name || "You",
          color: p?.color || "#4f46e5",
          avatar: info?.avatar || null,
        };
      })()
    : null;

  return { otherUsers, selfUser, totalCount: otherUsers.length + (selfUser ? 1 : 0) };
}


// ─── Original standalone Avatars (preserved for any other use) ─

export function Avatars() {
  const { otherUsers } = useAvatarUsers();

  if (otherUsers.length === 0) return null;

  return (
    <div className="absolute top-4 right-20 z-[500] flex items-center gap-1">
      {otherUsers.map((user) => (
        <div
          key={user.connectionId}
          className="relative group"
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium shadow-md border-2 border-white"
            style={{ backgroundColor: user.color, color: getCursorColorByFill(user.color)?.text || "#fff" }}
            title={user.name}
          >
            {user.name.slice(0, 2).toUpperCase()}
          </div>
          {/* Tooltip */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {user.name}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Masthead Avatars (Miro-style overlapping + count pill) ────

export function MastheadAvatars() {
  const { otherUsers, selfUser, totalCount } = useAvatarUsers();

  // Combine self + others for display; self avatar shown last (rightmost, on top)
  const allUsers = [...otherUsers, ...(selfUser ? [selfUser] : [])];
  const maxVisible = 5;
  const visibleUsers = allUsers.slice(0, maxVisible);

  return (
    <div className="flex items-center">
      {/* Avatar pill — wraps avatar(s) + chevron in a single rounded container */}
      <div className="flex items-center bg-gray-100 rounded-full p-0.5 gap-0.5">
        {/* Stacked avatars */}
        <div className="flex items-center">
          {visibleUsers.map((user, index) => (
            <div
              key={user.connectionId}
              className="relative group"
              style={{
                marginLeft: index === 0 ? 0 : -6,
                zIndex: index,
              }}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-7 h-7 rounded-full object-cover"
                  title={user.name}
                />
              ) : (
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold"
                  style={{ backgroundColor: user.color, color: getCursorColorByFill(user.color)?.text || "#fff" }}
                  title={user.name}
                >
                  {user.name.slice(0, 2).toUpperCase()}
                </div>
              )}
              {/* Tooltip */}
              <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                {user.name}
              </div>
            </div>
          ))}
        </div>

        {/* Chevron */}
        <button className="h-7 w-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition-colors text-gray-500">
          <IconChevronDown css={{ width: 14, height: 14 }} />
        </button>
      </div>
    </div>
  );
}
