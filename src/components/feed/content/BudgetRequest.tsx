"use client";

import type { FeedItem } from "@/types/feed";

type BudgetRequestItem = Extract<FeedItem, { type: "budget-request" }>;

export function BudgetRequestContent({ item }: { item: BudgetRequestItem }) {
  const { amount, category, status, requestedBy } = item.payload;

  const statusConfig = {
    pending: { label: "Pending", bg: "bg-amber-100", text: "text-amber-700" },
    approved: { label: "Approved", bg: "bg-green-100", text: "text-green-700" },
    rejected: { label: "Rejected", bg: "bg-red-100", text: "text-red-700" },
  };

  const config = statusConfig[status];

  return (
    <div className="px-6 pb-6">
      <div className="mt-3 py-6 px-8 rounded-2xl bg-gray-50">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-3xl font-bold text-gray-900">{amount}</div>
            <div className="text-xs text-gray-500 mt-1">{category}</div>
          </div>
          <div className={`px-3 py-1.5 rounded-full text-xs font-semibold ${config.bg} ${config.text}`}>
            {config.label}
          </div>
        </div>

        <div className="text-xs text-gray-400">Requested by {requestedBy}</div>
      </div>
    </div>
  );
}
