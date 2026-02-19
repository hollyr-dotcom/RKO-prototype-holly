"use client";

import type { FeedItem } from "@/types/feed";
import { formatTimeAgo } from "@/lib/formatTimeAgo";
import { FeedActions } from "./FeedActions";
import { AgentOpportunityContent } from "./content/AgentOpportunity";
import { AgentCompletedContent } from "./content/AgentCompleted";
import { CollaborationRequestContent } from "./content/CollaborationRequest";
import { WorkflowChangeContent } from "./content/WorkflowChange";
import { AlertFYIContent } from "./content/AlertFYI";

function CardVisual({ item }: { item: FeedItem }) {
  switch (item.type) {
    case "agent-opportunity":
      return <AgentOpportunityContent item={item} />;
    case "agent-completed":
      return <AgentCompletedContent item={item} />;
    case "collaboration-request":
      return <CollaborationRequestContent item={item} />;
    case "workflow-change":
      return <WorkflowChangeContent item={item} />;
    case "alert-fyi":
      return <AlertFYIContent item={item} />;
    default:
      return null;
  }
}

export function ScrollFeedCard({ item }: { item: FeedItem }) {
  return (
    <div
      className="relative flex-shrink-0 group rounded-3xl hover:shadow-[0_8px_28px_rgba(0,0,0,0.10)] hover:scale-[1.03] transition-[transform,box-shadow] duration-500"
      style={{ scrollSnapAlign: "center", scrollSnapStop: "always", transitionTimingFunction: "cubic-bezier(0.34, 1.56, 0.64, 1)" }}
    >
      {/* Gradient border — fades in on hover, replacing the default neutral border */}
      <div
        className="absolute -inset-[1px] rounded-[25px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none"
        style={{
          background: "linear-gradient(135deg, #818cf8, #a78bfa, #c084fc)",
        }}
      />

      {/* Card */}
      <div className="relative w-[360px] h-[480px] bg-white rounded-3xl overflow-hidden flex flex-col border border-neutral-200 group-hover:border-transparent transition-[border-color] duration-200">
        {/* Title + meta */}
        <div className="px-8 pt-8 pb-0">
          <h3 className="text-xl font-semibold tracking-tight text-gray-900 leading-snug mb-1">
            {item.title}
          </h3>
          <p className="text-xs text-gray-400">
            {item.spaceName && (
              <>
                {item.spaceName}
                <span className="mx-1.5 opacity-40">·</span>
              </>
            )}
            {formatTimeAgo(item.timestamp)}
          </p>
        </div>

        {/* Visual area */}
        <div className="mx-8 mt-4 h-[180px] rounded-2xl bg-gray-100 flex-shrink-0" />

        {/* Body */}
        <div className="px-8 pt-4 pb-2 flex-1">
          {item.body && (
            <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
              {item.body}
            </p>
          )}
        </div>

        {/* Actions */}
        {item.actions.length > 0 && (
          <div className="px-8 pb-8 mt-auto pt-2">
            <FeedActions actions={item.actions} size="large" />
          </div>
        )}
      </div>
    </div>
  );
}
