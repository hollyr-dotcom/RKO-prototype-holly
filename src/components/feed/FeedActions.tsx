"use client";

import type { FeedAction } from "@/types/feed";

interface FeedActionsProps {
  actions: FeedAction[];
  size?: "default" | "large";
  fill?: boolean;
  onDark?: boolean;
}

const variantStyles: Record<FeedAction["variant"], string> = {
  primary:
    "bg-gray-900 text-white hover:bg-gray-800",
  secondary:
    "border border-gray-200 text-gray-700 hover:bg-gray-50",
  ghost:
    "text-gray-500 hover:bg-gray-100",
};

const variantStylesDark: Record<FeedAction["variant"], string> = {
  primary:
    "bg-gray-900 text-white hover:bg-gray-800",
  secondary:
    "border border-white/40 text-white hover:bg-white/10",
  ghost:
    "text-white/70 hover:bg-white/10",
};

export function FeedActions({ actions, size = "default", fill = false, onDark = false }: FeedActionsProps) {
  if (actions.length === 0) return null;

  const styles = onDark ? variantStylesDark : variantStyles;
  const btnClass = size === "large"
    ? "px-5 h-12 rounded-[24px] text-sm font-medium"
    : "px-3 py-1.5 rounded-full text-xs font-medium";

  return (
    <div className={`flex items-center gap-2 ${fill ? "w-full" : "flex-wrap"}`}>
      {actions.map((action) => (
        <button
          key={action.id}
          className={`${btnClass} whitespace-nowrap transition-all duration-200 active:scale-[0.97] ${styles[action.variant]} ${fill ? "flex-1 text-center" : ""}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
