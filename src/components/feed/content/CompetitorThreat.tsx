"use client";

import type { FeedItem } from "@/types/feed";

type CompetitorThreatItem = Extract<FeedItem, { type: "competitor-threat" }>;

export function CompetitorThreatContent({ item }: { item: CompetitorThreatItem }) {
  const { competitor, threatLevel, summary } = item.payload;

  const levelConfig = {
    high: { label: "High threat", bg: "bg-red-100", text: "text-red-700", bar: "bg-red-500" },
    medium: { label: "Medium threat", bg: "bg-amber-100", text: "text-amber-700", bar: "bg-amber-500" },
    low: { label: "Low threat", bg: "bg-gray-100", text: "text-gray-600", bar: "bg-gray-400" },
  };

  const config = levelConfig[threatLevel];

  return (
    <div className="px-6 pb-6">
      <div className="mt-3 py-6 px-8 rounded-2xl bg-gray-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2L18 17H2L10 2Z" stroke="var(--color-gray-500)" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
              <line x1="10" y1="8" x2="10" y2="12" stroke="var(--color-gray-500)" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="10" cy="14.5" r="0.8" fill="var(--color-gray-500)" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-base font-semibold text-gray-900">{competitor}</div>
            <div className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold mt-1 ${config.bg} ${config.text}`}>
              {config.label}
            </div>
          </div>
        </div>

        <p className="text-sm text-gray-600 leading-relaxed">{summary}</p>

        <div className="mt-4 flex gap-1">
          {[1, 2, 3].map((i) => (
            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= (threatLevel === "high" ? 3 : threatLevel === "medium" ? 2 : 1) ? config.bar : "bg-gray-200"}`} />
          ))}
        </div>
      </div>
    </div>
  );
}
