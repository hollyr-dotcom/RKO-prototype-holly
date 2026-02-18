"use client";

import type { FeedItem } from "@/types/feed";

type ApprovalItem = Extract<FeedItem, { type: "approval" }>;

export function ApprovalContent({ item }: { item: ApprovalItem }) {
  const { status, approver, subject, conditions } = item.payload;

  const statusConfig = {
    needed: { label: "Approval needed", bg: "bg-amber-100", text: "text-amber-700", icon: "?" },
    given: { label: "Approved", bg: "bg-green-100", text: "text-green-700", icon: "\u2713" },
    rejected: { label: "Rejected", bg: "bg-red-100", text: "text-red-700", icon: "\u2717" },
  };

  const config = statusConfig[status];

  return (
    <div className="px-6 pb-6">
      <div className="mt-3 py-6 px-8 rounded-2xl bg-gray-50">
        <div className="flex items-center gap-4">
          <div className={`w-12 h-12 rounded-xl ${config.bg} flex items-center justify-center`}>
            <span className={`text-xl font-bold ${config.text}`}>{config.icon}</span>
          </div>
          <div className="flex-1">
            <div className={`text-xs font-semibold ${config.text} mb-1`}>{config.label}</div>
            <div className="text-sm font-medium text-gray-900">{subject}</div>
            {approver && <div className="text-xs text-gray-500 mt-0.5">{approver}</div>}
          </div>
        </div>

        {conditions && conditions.length > 0 && (
          <div className="mt-4 space-y-1.5">
            {conditions.map((condition, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-gray-600">
                <span className="text-gray-400 mt-0.5">&#x2022;</span>
                <span>{condition}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
