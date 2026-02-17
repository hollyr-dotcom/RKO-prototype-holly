"use client";

import { getUser, getInitials, getUserColor } from "@/lib/users";
import type { FeedSource } from "@/types/feed";
import { IconSingleSparksFilled } from "@mirohq/design-system-icons";

interface FeedSourceIndicatorProps {
  source: FeedSource;
}

export function FeedSourceIndicator({ source }: FeedSourceIndicatorProps) {
  const user = getUser(source.userId);

  if (source.isAgent) {
    return (
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: '#1e293b' }}
      >
        <IconSingleSparksFilled css={{ width: 16, height: 16, color: 'white' }} />
      </div>
    );
  }

  const name = user?.name ?? "Unknown";
  const color = getUserColor(source.userId);

  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ backgroundColor: color }}
    >
      <span className="text-white text-xs font-semibold">
        {getInitials(name)}
      </span>
    </div>
  );
}
