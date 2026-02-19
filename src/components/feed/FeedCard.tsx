"use client";

import { motion } from "framer-motion";
import type { FeedItem } from "@/types/feed";
import { getUser } from "@/lib/users";
import { formatTimeAgo } from "@/lib/formatTimeAgo";
import { FeedSourceIndicator } from "./FeedSourceIndicator";
import { FeedActions } from "./FeedActions";
import { FeedReactions } from "./FeedReactions";
import { GenericVisualPreview } from "./visuals/GenericVisualPreview";
import { AgentOpportunityContent } from "./content/AgentOpportunity";
import { AgentCompletedContent } from "./content/AgentCompleted";
import { CollaborationRequestContent } from "./content/CollaborationRequest";
import { WorkflowChangeContent } from "./content/WorkflowChange";
import { AlertFYIContent } from "./content/AlertFYI";
import { KeyMetricContent } from "./content/KeyMetric";
import { ChartContent } from "./content/Chart";
import { DecisionContent } from "./content/Decision";
import { ApprovalContent } from "./content/Approval";
import { TeamAnnouncementContent } from "./content/TeamAnnouncement";
import { LiveSessionContent } from "./content/LiveSession";
import { CompetitorThreatContent } from "./content/CompetitorThreat";
import { FeedbackRequestContent } from "./content/FeedbackRequest";
import { BudgetRequestContent } from "./content/BudgetRequest";
import { BudgetNotificationContent } from "./content/BudgetNotification";

interface FeedCardProps {
  item: FeedItem;
  spaceName?: string;
  variant?: "default" | "stack";
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
    case "key-metric":
      return <KeyMetricContent item={item} />;
    case "chart":
      return <ChartContent item={item} />;
    case "decision":
      return <DecisionContent item={item} />;
    case "approval":
      return <ApprovalContent item={item} />;
    case "team-announcement":
      return <TeamAnnouncementContent item={item} />;
    case "live-session":
      return <LiveSessionContent item={item} />;
    case "competitor-threat":
      return <CompetitorThreatContent item={item} />;
    case "feedback-request":
      return <FeedbackRequestContent item={item} />;
    case "budget-request":
      return <BudgetRequestContent item={item} />;
    case "budget-notification":
      return <BudgetNotificationContent item={item} />;
    default:
      return null;
  }
}

const REACTABLE_TYPES = new Set([
  "workflow-change",
  "agent-completed",
  "key-metric",
  "approval",
  "team-announcement",
  "decision",
  "budget-notification",
]);

export function FeedCard({ item, spaceName, variant = "default" }: FeedCardProps) {
  const user = getUser(item.source.userId);
  const isAgent = item.source.isAgent;
  const showReactions =
    REACTABLE_TYPES.has(item.type) &&
    (item.reactions.length > 0 || (item.viewCount != null && item.viewCount > 0));

  const isStack = variant === "stack";
  const px = isStack ? "px-8" : "px-6";
  const pt = isStack ? "pt-8" : "pt-6";
  const pbActions = isStack ? "pb-10" : "pb-8";

  return (
    <motion.div
      variants={staggerItem}
      className={
        isStack
          ? "relative overflow-hidden bg-white h-full flex flex-col"
          : "relative rounded-xl overflow-hidden transition-shadow duration-200 hover:shadow-md border border-gray-200 bg-white"
      }
    >
      <div className={isStack ? "relative flex flex-col flex-1" : "relative"}>
        {/* Avatar + timestamp */}
        <div className={`flex items-center justify-between ${px} ${pt} pb-3`}>
          <FeedSourceIndicator source={item.source} />
          <div className="flex items-center gap-2">
            {spaceName && (
              <>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {spaceName}
                </span>
                <span className="text-gray-300">&middot;</span>
              </>
            )}
            <span className="text-xs text-gray-400 flex-shrink-0">
              {formatTimeAgo(item.timestamp)}
            </span>
            {!item.isRead && (
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
            )}
          </div>
        </div>

        {/* Heading */}
        <div className={`${px} pb-2`}>
          <h3 className="text-xl font-semibold text-gray-900">
            {item.title}
          </h3>
        </div>

        {/* Body text */}
        {item.body && (
          <p className={`${px} text-sm text-gray-700 leading-relaxed pb-3`}>
            {item.body}
          </p>
        )}

        {/* Type-specific content - renderers control their own padding */}
        <FeedContentRenderer item={item} />

        {/* Visual preview fallback — show if item has visualPreview and type-specific renderer didn't handle it */}
        {item.visualPreview && (
          <div className="px-6 pb-4">
            <GenericVisualPreview type={item.visualPreview.type} data={item.visualPreview.data} />
          </div>
        )}

        {/* Actions */}
        {item.actions.length > 0 && (
          <div className={`${px} ${pbActions}${isStack ? " mt-auto" : ""}`}>
            <FeedActions actions={item.actions} size={isStack ? "large" : "default"} />
          </div>
        )}

        {/* Reactions — only on certain types */}
        {showReactions && (
          <div>
            <div className={px}>
              <div className="border-t border-gray-100" />
            </div>
            <div className={`${px} pt-4 pb-6`}>
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
