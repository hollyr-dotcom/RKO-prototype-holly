"use client";

import type { FeedItem } from "@/types/feed";

type DecisionItem = Extract<FeedItem, { type: "decision" }>;

export function DecisionContent({ item }: { item: DecisionItem }) {
  const { status, options, chosenOption, deadline, decidedBy } = item.payload;

  return (
    <div className="px-6 pb-6">
      <div className="mt-3 py-6 px-8 rounded-2xl bg-gray-50">
        <div className="flex items-center gap-2 mb-4">
          <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
            status === "needed" ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"
          }`}>
            {status === "needed" ? "Decision needed" : "Decision made"}
          </div>
          {deadline && (
            <span className="text-xs text-gray-400">Due {new Date(deadline).toLocaleDateString("en-GB", { month: "short", day: "numeric" })}</span>
          )}
        </div>

        {options && options.length > 0 && (
          <div className="space-y-2">
            {options.map((option, i) => (
              <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border ${
                chosenOption === option ? "border-green-300 bg-green-50" : "border-gray-200 bg-white"
              }`}>
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                  chosenOption === option ? "border-green-500" : "border-gray-300"
                }`}>
                  {chosenOption === option && <div className="w-2.5 h-2.5 rounded-full bg-green-500" />}
                </div>
                <span className="text-sm text-gray-700">{option}</span>
              </div>
            ))}
          </div>
        )}

        {decidedBy && status === "made" && (
          <div className="mt-3 text-xs text-gray-500">Decided by {decidedBy}</div>
        )}
      </div>
    </div>
  );
}
