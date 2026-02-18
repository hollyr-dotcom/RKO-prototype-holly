"use client";

import type { FeedItem } from "@/types/feed";

type TeamAnnouncementItem = Extract<FeedItem, { type: "team-announcement" }>;

export function TeamAnnouncementContent({ item }: { item: TeamAnnouncementItem }) {
  const { person, announcementType } = item.payload;

  const typeConfig = {
    "new-hire": { label: "New hire", color: "bg-blue-100 text-blue-700", accent: "#3b82f6" },
    "promotion": { label: "Promotion", color: "bg-purple-100 text-purple-700", accent: "#8b5cf6" },
    "departure": { label: "Departure", color: "bg-gray-100 text-gray-600", accent: "#6b7280" },
  };

  const config = typeConfig[announcementType];

  return (
    <div className="px-6 pb-6">
      <div className="mt-3 py-6 px-8 rounded-2xl bg-gray-50">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-white text-lg font-bold"
            style={{ backgroundColor: config.accent }}>
            {person.name.split(" ").map(n => n[0]).join("").slice(0, 2)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-base font-semibold text-gray-900">{person.name}</span>
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${config.color}`}>{config.label}</span>
            </div>
            <div className="text-sm text-gray-600">{person.role}</div>
            <div className="text-xs text-gray-400 mt-0.5">{person.department}</div>
            {person.startDate && (
              <div className="text-xs text-gray-400 mt-0.5">
                Starts {new Date(person.startDate).toLocaleDateString("en-GB", { month: "short", day: "numeric", year: "numeric" })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
