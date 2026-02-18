"use client";

import type { FeedItem } from "@/types/feed";
import { FeedArtifactPreview } from "../FeedArtifactPreview";

type FeedbackRequestItem = Extract<FeedItem, { type: "feedback-request" }>;

export function FeedbackRequestContent({ item }: { item: FeedbackRequestItem }) {
  const { requestType, artifact, dueDate, from } = item.payload;

  const typeLabels: Record<string, string> = {
    feedback: "Feedback requested",
    review: "Review requested",
    input: "Input requested",
  };

  return (
    <div className="px-6 pb-6">
      <div className="mt-3 py-6 px-8 rounded-2xl bg-gray-50">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 3h12v8H4l-2 2V3z" stroke="#3b82f6" strokeWidth="1.5" fill="none" strokeLinejoin="round" />
              <circle cx="5.5" cy="7" r="0.8" fill="#3b82f6" />
              <circle cx="8" cy="7" r="0.8" fill="#3b82f6" />
              <circle cx="10.5" cy="7" r="0.8" fill="#3b82f6" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-gray-900">{typeLabels[requestType] || "Request"}</div>
            <div className="text-xs text-gray-500">From {from}</div>
          </div>
          {dueDate && (
            <div className="text-xs text-gray-400">
              Due {new Date(dueDate).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}
            </div>
          )}
        </div>
      </div>

      {artifact && (
        <FeedArtifactPreview artifact={artifact} variant="compact" />
      )}
    </div>
  );
}
