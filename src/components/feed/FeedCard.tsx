"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import type { FeedItem } from "@/types/feed";
import { getUser } from "@/lib/users";
import { formatTimeAgo } from "@/lib/formatTimeAgo";
import { FeedSourceIndicator } from "./FeedSourceIndicator";
import { FeedActions } from "./FeedActions";
import { FeedReactions } from "./FeedReactions";
import { CardTypeIcon } from "./FeedTypeIcon";
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
  variant?: "default" | "stack" | "horizontal";
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

/** Extract a single action-word from a multi-word label */
function simplifyLabel(label: string): string {
  const first = label.split(/\s+/)[0];
  const verbs = new Set([
    "Review","Join","View","Read","Start","Approve","Dismiss","Open",
    "Explore","Check","Watch","Redesign","Resolve","Ignore","Accept",
    "Reject","Share","Download","Edit","Comment","Assign","Schedule",
    "Plan","Assess","Audit","Evaluate","Investigate","Escalate",
    "Compare","Align","Propose","Draft","Submit","Launch","Deploy",
  ]);
  return verbs.has(first) ? first : first;
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
  const isHorizontal = variant === "horizontal";

  /* ------------------------------------------------------------------ */
  /*  Horizontal variant — side-by-side layout                           */
  /* ------------------------------------------------------------------ */
  if (isHorizontal) {
    const sourceUser = !item.source.isAgent ? getUser(item.source.userId) : undefined;
    const hasVisual = !!item.visualPreview;
    // Show person avatar only when the title explicitly mentions the source user
    const titleMentionsPerson =
      sourceUser && (item.title.includes(sourceUser.name) || item.title.includes(sourceUser.firstName));
    // Items with bespoke illustrations that should use FeedContentRenderer instead of GenericVisualPreview
    const ILLUSTRATION_IDS = new Set(["feed-core-01", "feed-pq3-01", "feed-cross-01", "feed-claims-01", "feed-ff-youth-01"]);
    const hasIllustration = ILLUSTRATION_IDS.has(item.id);
    // Items with image-based illustrations
    const IMAGE_ILLUSTRATIONS: Record<string, string> = {
      "feed-cross-14": "/feed-viz/FirstFlex-Youth-Banking/psd3.png",
      "feed-ff-youth-05": "/feed-viz/FirstFlex-Youth-Banking/Starling.png",
      "feed-ff-03": "/feed-viz/FlexForward-26/venue.png",
    };
    const illustrationImage = IMAGE_ILLUSTRATIONS[item.id];
    // Items with custom inline illustrations in the standard 240x184 frame
    const CUSTOM_ILLUSTRATION_IDS = new Set(["feed-ff-youth-03", "feed-ff-youth-04", "feed-cross-06", "feed-ff26-02", "feed-ff-07", "feed-ff-06"]);
    const hasCustomIllustration = CUSTOM_ILLUSTRATION_IDS.has(item.id);

    return (
      <motion.div
        variants={staggerItem}
        className="group relative rounded-2xl overflow-hidden transition-shadow duration-200 hover:shadow-md border border-gray-200 bg-white"
        style={{ width: 712 }}
      >
        <div className="flex">
          {/* Left: text content */}
          <div className={`flex flex-col flex-1 min-w-0 p-6 ${hasVisual || hasIllustration || illustrationImage || hasCustomIllustration ? "pr-4" : ""}`} style={{ paddingBottom: item.actions.length > 0 ? 104 : 24 }}>
            {/* Icon or avatar + timestamp */}
            <div className="flex items-center gap-3 mb-3">
              {titleMentionsPerson && sourceUser?.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={sourceUser.avatar}
                  alt={sourceUser.name}
                  className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                />
              ) : (
                <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                  <CardTypeIcon itemType={item.type} itemId={item.id} />
                </div>
              )}
              <div className={`flex items-center gap-2 min-w-0 transition-opacity duration-200 ${item.type === "live-session" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
                {titleMentionsPerson && sourceUser && (
                  <span className="text-sm font-medium text-gray-900 truncate">
                    {sourceUser.name}
                  </span>
                )}
                <span className="flex-shrink-0" style={{ fontSize: 14, color: "#656B81" }}>
                  {item.type === "live-session" ? "Now" : formatTimeAgo(item.timestamp)}
                </span>
                {item.type === "live-session" && (
                  <div className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, backgroundColor: "#FF0909" }} />
                )}
              </div>
            </div>

            {/* Title */}
            <h3 className="text-lg font-semibold text-gray-900 leading-snug mb-1">
              {item.title}
            </h3>

            {/* Body */}
            {item.body && (
              <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
                {item.body}
              </p>
            )}

          </div>

          {/* Right: visual preview or bespoke illustration */}
          {hasCustomIllustration ? (
            <div className="w-[280px] flex-shrink-0 p-4 pl-2 flex items-center justify-center">
              <div className="overflow-hidden flex-shrink-0" style={{ width: 240, height: 184, borderRadius: 24 }}>
                {(item.id === "feed-cross-06" || item.id === "feed-ff26-02") && (
                  <div className="w-full h-full flex flex-col justify-center" style={{ padding: 20 }}>
                    <div className="flex gap-1 mb-1.5">
                      {["M", "T", "W", "T", "F"].map((d, i) => (
                        <div key={i} className="flex-1 text-center text-xs text-gray-400">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-5 gap-1">
                      {[...Array(15)].map((_, i) => (
                        <div key={i} className="h-5 rounded-sm" style={{ backgroundColor: i === 7 ? 'var(--space-accent)' : 'var(--space-bg)' }} />
                      ))}
                    </div>
                  </div>
                )}
                {item.id === "feed-ff-youth-04" && (
                  <div className="w-full h-full relative bg-white flex items-center" style={{ padding: '0 24px 0 16px' }}>
                    <svg width="108" height="115" viewBox="0 0 108 115" fill="none" style={{ transform: 'scaleX(-1)' }}>
                      <path d="M54.9697 9.61279C83.9022 9.61279 107.357 33.0671 107.357 61.9995C107.357 90.9321 83.9023 114.387 54.9697 114.387C26.0373 114.387 2.58301 90.932 2.58301 61.9995C2.58305 55.4151 3.79701 49.1141 6.01465 43.3091L52.2568 60.9634C53.566 61.463 54.9697 60.4965 54.9697 59.0952V11.6128C54.9697 10.6157 54.2397 9.79156 53.2852 9.64014C53.8445 9.62246 54.4061 9.6128 54.9697 9.61279Z" style={{ fill: 'var(--space-bg)' }} />
                      <path d="M48.3578 49.4462C48.3578 50.8477 46.9538 51.8145 45.6445 51.3147L1.27256 34.3737C0.240495 33.9797 -0.280194 32.8216 0.153425 31.8055C7.89531 13.6645 25.5783 0.781464 46.3578 0.00137677C47.4616 -0.040061 48.3578 0.859329 48.3578 1.9639V49.4462Z" style={{ fill: 'var(--space-accent)' }} />
                    </svg>
                    <span className="absolute font-semibold" style={{ fontSize: 20, color: '#222428', zIndex: 1, right: 24, top: '50%', transform: 'translateY(-50%)' }}>$ 4.2M</span>
                  </div>
                )}
                {item.id === "feed-ff-07" && (
                  <div className="w-full h-full relative bg-white flex items-center" style={{ padding: '0 24px 0 16px' }}>
                    <svg width="108" height="115" viewBox="0 0 108 115" fill="none" style={{ transform: 'scaleX(-1)' }}>
                      <path d="M54.9697 9.61279C83.9022 9.61279 107.357 33.0671 107.357 61.9995C107.357 90.9321 83.9023 114.387 54.9697 114.387C26.0373 114.387 2.58301 90.932 2.58301 61.9995C2.58305 55.4151 3.79701 49.1141 6.01465 43.3091L52.2568 60.9634C53.566 61.463 54.9697 60.4965 54.9697 59.0952V11.6128C54.9697 10.6157 54.2397 9.79156 53.2852 9.64014C53.8445 9.62246 54.4061 9.6128 54.9697 9.61279Z" style={{ fill: 'var(--space-bg)' }} />
                      <path d="M48.3578 49.4462C48.3578 50.8477 46.9538 51.8145 45.6445 51.3147L1.27256 34.3737C0.240495 33.9797 -0.280194 32.8216 0.153425 31.8055C7.89531 13.6645 25.5783 0.781464 46.3578 0.00137677C47.4616 -0.040061 48.3578 0.859329 48.3578 1.9639V49.4462Z" style={{ fill: 'var(--space-accent)' }} />
                    </svg>
                    <span className="absolute font-semibold" style={{ fontSize: 20, color: '#222428', zIndex: 1, right: 24, top: '50%', transform: 'translateY(-50%)' }}>62%</span>
                  </div>
                )}
                {item.id === "feed-ff-youth-03" && (
                  <div className="w-full h-full flex flex-col justify-end" style={{ backgroundColor: '#e4f9ff', padding: 24 }}>
                    <div className="flex items-center justify-center rounded-lg bg-white" style={{ width: 36, height: 36 }}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <rect x="3" y="1" width="14" height="18" rx="2" fill="#22d3ee" />
                      </svg>
                    </div>
                    <p className="mt-2 text-xl font-semibold" style={{ color: '#001d66' }}>Feature Spec</p>
                  </div>
                )}
                {item.id === "feed-ff-06" && (
                  <div className="w-full h-full bg-white flex items-center justify-center">
                    <div className="flex gap-2">
                      {["keynote-Carla", "keynote-Lisa", "keynote-Nina", "keynote-Tom"].map((name) => (
                        <img
                          key={name}
                          src={`/avatars/${name}.png`}
                          alt=""
                          className="rounded-full object-cover"
                          style={{ width: 54, height: 54 }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : illustrationImage ? (
            <div className="w-[280px] flex-shrink-0 p-4 pl-2 flex items-center justify-center">
              <div className="overflow-hidden flex-shrink-0" style={{ width: 240, height: 184, borderRadius: 24 }}>
                <Image src={illustrationImage} alt="" width={480} height={368} className="w-full h-full object-cover" />
              </div>
            </div>
          ) : hasIllustration ? (
            <div className="w-[280px] flex-shrink-0 p-4 pl-2 flex items-center justify-center">
              <FeedContentRenderer item={item} />
            </div>
          ) : hasVisual && item.visualPreview ? (
            <div className="w-[280px] flex-shrink-0 p-4 pl-2 flex items-center">
              <div className="w-full overflow-hidden p-4">
                <GenericVisualPreview type={item.visualPreview.type} data={item.visualPreview.data} />
              </div>
            </div>
          ) : null}
        </div>

        {/* Hover-reveal actions — bottom-right */}
        {item.actions.length > 0 && (
          <div
            className="absolute bottom-6 left-6 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-[transform,opacity] duration-300 ease-out"
            style={{ width: item.actions.length === 1 ? 194 : 396 }}
          >
            <FeedActions
              actions={item.actions.map((a) => ({ ...a, label: simplifyLabel(a.label) }))}
              size="large"
              fill
            />
          </div>
        )}
      </motion.div>
    );
  }

  /* ------------------------------------------------------------------ */
  /*  Default / stack variants — vertical layout                         */
  /* ------------------------------------------------------------------ */
  const px = isStack ? "px-8" : "px-6";
  const pt = isStack ? "pt-8" : "pt-6";
  const pbActions = isStack ? "pb-[34px]" : "pb-[26px]";

  return (
    <motion.div
      variants={staggerItem}
      className={
        isStack
          ? "group relative overflow-hidden bg-white h-full flex flex-col"
          : "group relative rounded-xl overflow-hidden transition-shadow duration-200 hover:shadow-md border border-gray-200 bg-white"
      }
    >
      <div className={isStack ? "relative flex flex-col flex-1" : "relative"}>
        {/* Avatar + timestamp */}
        <div className={`flex items-center justify-between ${px} ${pt} pb-3`}>
          <FeedSourceIndicator source={item.source} />
          <div className={`flex items-center gap-2 transition-opacity duration-200 ${item.type === "live-session" ? "opacity-100" : "opacity-0 group-hover:opacity-100"}`}>
            {spaceName && (
              <>
                <span className="flex-shrink-0" style={{ fontSize: 14, color: "#656B81" }}>
                  {spaceName}
                </span>
                <span style={{ color: "#656B81" }}>&middot;</span>
              </>
            )}
            <span className="flex-shrink-0" style={{ fontSize: 14, color: "#656B81" }}>
              {item.type === "live-session" ? "Now" : formatTimeAgo(item.timestamp)}
            </span>
            {item.type === "live-session" && (
              <div className="rounded-full flex-shrink-0" style={{ width: 8, height: 8, backgroundColor: "#FF0909" }} />
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
