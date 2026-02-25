"use client";

import type { FeedAction } from "@/types/feed";

interface FeedActionsProps {
  actions: FeedAction[];
  size?: "default" | "large";
  fill?: boolean;
  onDark?: boolean;
}

const variantStyles: Record<FeedAction["variant"], { className: string; style?: React.CSSProperties }> = {
  primary: {
    className: "text-white hover:brightness-110",
    style: {
      backgroundColor: "var(--space-accent, #1a1b1e)",
      boxShadow: "0px 12px 32px 0px rgba(34,36,40,0.2), 0px 0px 8px 0px rgba(34,36,40,0.06)",
    },
  },
  secondary: {
    className: "border border-gray-200 text-gray-700 hover:bg-gray-50",
  },
  ghost: {
    className: "text-gray-500 hover:bg-gray-100",
  },
};

const variantStylesDark: Record<FeedAction["variant"], { className: string; style?: React.CSSProperties }> = {
  primary: {
    className: "text-white hover:brightness-110",
    style: {
      backgroundColor: "var(--space-accent, #1a1b1e)",
      boxShadow: "0px 12px 32px 0px rgba(34,36,40,0.2), 0px 0px 8px 0px rgba(34,36,40,0.06)",
    },
  },
  secondary: {
    className: "border border-white/40 text-white hover:bg-white/10",
  },
  ghost: {
    className: "text-white/70 hover:bg-white/10",
  },
};

export function FeedActions({ actions, size = "default", fill = false, onDark = false }: FeedActionsProps) {
  if (actions.length === 0) return null;

  const styles = onDark ? variantStylesDark : variantStyles;
  const btnClass = size === "large"
    ? "px-5 h-9 rounded-[18px] text-sm font-medium"
    : "px-3 py-1.5 rounded-full text-xs font-medium";

  return (
    <div className={`flex items-center gap-2 ${fill ? "w-full" : "flex-wrap"}`}>
      {actions.map((action) => {
        const v = styles[action.variant];
        return (
          <button
            key={action.id}
            className={`${btnClass} whitespace-nowrap transition-all duration-200 active:scale-[0.97] ${v.className} ${fill ? "flex-1 text-center" : ""}`}
            style={v.style}
          >
            {action.label}
          </button>
        );
      })}
    </div>
  );
}
