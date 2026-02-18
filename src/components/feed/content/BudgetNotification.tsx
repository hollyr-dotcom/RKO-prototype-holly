"use client";

import type { FeedItem } from "@/types/feed";

type BudgetNotificationItem = Extract<FeedItem, { type: "budget-notification" }>;

export function BudgetNotificationContent({ item }: { item: BudgetNotificationItem }) {
  const { category, currentSpend, budget, percentUsed, alert } = item.payload;

  const barColor = percentUsed >= 90 ? "bg-red-500" : percentUsed >= 75 ? "bg-amber-500" : "bg-green-500";
  const textColor = percentUsed >= 90 ? "text-red-600" : percentUsed >= 75 ? "text-amber-600" : "text-green-600";

  return (
    <div className="px-6 pb-6">
      <div className="mt-3 py-6 px-8 rounded-2xl bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-semibold text-gray-900">{category}</div>
          <div className={`text-sm font-bold ${textColor}`}>{percentUsed}%</div>
        </div>

        <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
          <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${Math.min(percentUsed, 100)}%` }} />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{currentSpend} spent</span>
          <span>{budget} budget</span>
        </div>

        {alert && (
          <div className="mt-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-100 text-xs text-amber-700">
            {alert}
          </div>
        )}
      </div>
    </div>
  );
}
