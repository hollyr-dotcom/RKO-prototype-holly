"use client";

import type { FeedAction } from "@/types/feed";

interface FeedActionsProps {
  actions: FeedAction[];
  size?: "default" | "large";
  fill?: boolean;
}

const variantStyles: Record<FeedAction["variant"], string> = {
  primary:
    "bg-gray-900 text-white hover:bg-gray-800",
  secondary:
    "border border-gray-200 text-gray-700 hover:bg-gray-50",
  ghost:
    "text-gray-500 hover:bg-gray-100",
};

export function FeedActions({ actions, size = "default", fill = false }: FeedActionsProps) {
  if (actions.length === 0) return null;

  const btnClass = size === "large"
    ? "px-5 py-3 rounded-full text-sm font-medium"
    : "px-3 py-1.5 rounded-full text-xs font-medium";

  return (
    <div className={`flex items-center gap-2 ${fill ? "w-full" : "flex-wrap"}`}>
      {actions.map((action) => (
        <button
          key={action.id}
          className={`${btnClass} whitespace-nowrap transition-all duration-150 active:scale-[0.97] ${variantStyles[action.variant]} ${fill ? "flex-1 text-center" : ""}`}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}
