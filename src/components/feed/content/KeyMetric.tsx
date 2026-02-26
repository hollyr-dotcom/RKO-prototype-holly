"use client";

import type { FeedItem } from "@/types/feed";

type KeyMetricItem = Extract<FeedItem, { type: "key-metric" }>;

function TrendArrow({ trend, changePercent }: { trend: "up" | "down" | "flat"; changePercent: number }) {
  const color = trend === "up" ? "#10b981" : trend === "down" ? "#ef4444" : "var(--color-gray-500)";
  const sign = trend === "up" ? "+" : trend === "down" ? "-" : "";

  return (
    <div className="flex items-center gap-1.5">
      {trend === "up" && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 3L13 8L11 8L11 13L5 13L5 8L3 8L8 3Z" fill={color} />
        </svg>
      )}
      {trend === "down" && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <path d="M8 13L3 8L5 8L5 3L11 3L11 8L13 8L8 13Z" fill={color} />
        </svg>
      )}
      {trend === "flat" && (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
          <line x1="3" y1="8" x2="13" y2="8" stroke={color} strokeWidth="2" strokeLinecap="round" />
        </svg>
      )}
      <span className="text-sm font-semibold" style={{ color }}>
        {sign}{Math.abs(changePercent)}%
      </span>
    </div>
  );
}

export function KeyMetricContent({ item }: { item: KeyMetricItem }) {
  const { metric, value, trend, changePercent, period } = item.payload;

  return (
    <div className="px-6 pb-6">
      <div className="mt-3 py-8 px-10 rounded-2xl bg-gray-50">
        <div className="text-center">
          <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">{metric}</div>
          <div className="text-5xl font-bold text-gray-900 mb-3">{value}</div>
          <div className="flex items-center justify-center gap-3">
            <TrendArrow trend={trend} changePercent={changePercent} />
            <span className="text-xs text-gray-400">{period}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
