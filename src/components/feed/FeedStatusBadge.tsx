"use client";

interface FeedStatusBadgeProps {
  priority: "high" | "medium" | "low";
}

const priorityStyles: Record<string, string> = {
  high: "bg-red-50 text-red-700",
  medium: "bg-amber-50 text-amber-700",
  low: "bg-gray-100 text-gray-600",
};

const priorityLabels: Record<string, string> = {
  high: "Urgent",
  medium: "Medium",
  low: "Low",
};

export function FeedStatusBadge({ priority }: FeedStatusBadgeProps) {
  return (
    <span
      className={`px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${priorityStyles[priority]}`}
    >
      {priorityLabels[priority]}
    </span>
  );
}
