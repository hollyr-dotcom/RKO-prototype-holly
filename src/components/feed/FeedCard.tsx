"use client";

import { motion } from "framer-motion";
import type { FeedItem } from "@/types/feed";
import { getUser } from "@/lib/users";
import { formatTimeAgo } from "@/lib/formatTimeAgo";
import { FeedSourceIndicator } from "./FeedSourceIndicator";
import { FeedActions } from "./FeedActions";
import { FeedReactions } from "./FeedReactions";
import { AgentOpportunityContent } from "./content/AgentOpportunity";
import { AgentCompletedContent } from "./content/AgentCompleted";
import { CollaborationRequestContent } from "./content/CollaborationRequest";
import { WorkflowChangeContent } from "./content/WorkflowChange";
import { AlertFYIContent } from "./content/AlertFYI";

interface FeedCardProps {
  item: FeedItem;
}

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 30 },
  },
};

function FeedContentRenderer({ item }: { item: FeedItem }) {
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

const REACTABLE_TYPES = new Set(["workflow-change", "agent-completed"]);

export function FeedCard({ item }: FeedCardProps) {
  const user = getUser(item.source.userId);
  const isAgent = item.source.isAgent;
  const showReactions =
    REACTABLE_TYPES.has(item.type) &&
    (item.reactions.length > 0 || (item.viewCount != null && item.viewCount > 0));

  return (
    <motion.div
      variants={staggerItem}
      className="relative rounded-xl overflow-hidden transition-shadow duration-200 hover:shadow-md border border-gray-200 bg-white"
    >
      <div className="relative">
        {/* Avatar + timestamp */}
        <div className="flex items-center justify-between px-6 pt-6 pb-3">
          <FeedSourceIndicator source={item.source} />
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatTimeAgo(item.timestamp)}
            </span>
            {!item.isRead && (
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Heading */}
        <div className="px-6 pb-2">
          <h3 className="text-xl font-semibold text-gray-900">
            {item.title}
          </h3>
        </div>

        {/* Body text */}
        {item.body && (
          <p className="px-6 text-sm text-gray-700 leading-relaxed pb-3">
            {item.body}
          </p>
        )}

        {/* Type-specific content - renderers control their own padding */}
        <FeedContentRenderer item={item} />

        {/* Actions */}
        {item.actions.length > 0 && (
          <div className="px-6 pb-8">
            <FeedActions actions={item.actions} />
          </div>
        )}

        {/* Reactions — only on workflow-change and agent-completed */}
        {showReactions && (
          <div>
            <div className="px-6">
              <div className="border-t border-gray-100" />
            </div>
            <div className="px-6 pt-4 pb-6">
              <FeedReactions
                reactions={item.reactions}
                viewCount={item.viewCount}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
