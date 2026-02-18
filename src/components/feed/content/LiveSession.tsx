"use client";

import type { FeedItem } from "@/types/feed";

type LiveSessionItem = Extract<FeedItem, { type: "live-session" }>;

function PulsingDot() {
  return (
    <span className="relative flex h-3 w-3">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500" />
    </span>
  );
}

export function LiveSessionContent({ item }: { item: LiveSessionItem }) {
  const { sessionType, participants, startedAt } = item.payload;

  const typeLabels: Record<string, string> = {
    workshop: "Workshop",
    review: "Review",
    standup: "Standup",
    brainstorm: "Brainstorm",
  };

  const startTime = new Date(startedAt);
  const minutesAgo = Math.max(0, Math.floor((Date.now() - startTime.getTime()) / 60000));

  return (
    <div className="px-6 pb-6">
      <div className="mt-3 py-6 px-8 rounded-2xl bg-gray-50 border border-red-100">
        <div className="flex items-center gap-3 mb-4">
          <PulsingDot />
          <span className="text-sm font-semibold text-red-600">Live now</span>
          <span className="text-xs text-gray-400">{typeLabels[sessionType] || sessionType}</span>
          {minutesAgo > 0 && (
            <span className="text-xs text-gray-400 ml-auto">{minutesAgo}m ago</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {participants.slice(0, 5).map((name, i) => (
            <div key={i} className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-semibold text-gray-600 border-2 border-white"
              style={{ marginLeft: i > 0 ? "-6px" : 0 }}>
              {name.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
          ))}
          {participants.length > 5 && (
            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-500 border-2 border-white"
              style={{ marginLeft: "-6px" }}>
              +{participants.length - 5}
            </div>
          )}
          <span className="text-xs text-gray-500 ml-2">{participants.length} participants</span>
        </div>
      </div>
    </div>
  );
}
