"use client";

import type { Reaction } from "@/types/feed";

interface FeedReactionsProps {
  reactions: Reaction[];
  viewCount?: number;
}

export function FeedReactions({ reactions, viewCount }: FeedReactionsProps) {
  if (reactions.length === 0 && !viewCount) return null;

  return (
    <div className="flex items-center gap-2">
      {reactions.map((reaction, i) => (
        <button
          key={i}
          className="flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-xs hover:bg-gray-200 transition-colors duration-150"
        >
          <span>{reaction.emoji}</span>
          <span className="text-gray-600">{reaction.count}</span>
        </button>
      ))}
      {viewCount != null && viewCount > 0 && (
        <span className="text-xs text-gray-400 ml-auto">
          {viewCount} views
        </span>
      )}
    </div>
  );
}
