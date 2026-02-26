"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FeedItem } from "@/types/feed";
import { FeedCard } from "./FeedCard";
import { SpaceHeader } from "./SpaceHeader";
import { PromptBar } from "@/components/PromptBar";
import {
  GoalsWidget,
  StatsWidget,
  AwaitingDecisionWidget,
} from "@/components/sidebar-widgets";
import {
  CountdownWidget,
  AttendeesWidget,
  StaffWidget,
  VibeCheckWidget,
  RACIWidget,
  MilestoneWidget,
} from "@/components/space-widgets";
import { SIDEBAR_WIDGET_DATA } from "@/data/sidebar-widget-data";
import { FF26_WIDGETS, FIRSTFLEX_WIDGETS } from "@/data/space-widgets-data";
import { getSpaceHue, generateSpaceTheme, spaceThemeToCssVars } from "@/lib/space-theme";

interface SpaceFeedProps {
  spaceId: string;
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

/** Space widget config — maps spaceId → widget data for live widget sidebars */
const SPACE_WIDGETS: Record<string, typeof FF26_WIDGETS> = {
  "space-ff26": FF26_WIDGETS,
};

/** FirstFlex-style widget config — RACI + milestones */
const FIRSTFLEX_SPACE_WIDGETS: Record<string, typeof FIRSTFLEX_WIDGETS> = {
  "space-firstflex": FIRSTFLEX_WIDGETS,
};

export function SpaceFeed({ spaceId }: SpaceFeedProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [space, setSpace] = useState<{
    id: string;
    name: string;
    description?: string;
    emoji?: string;
    color?: string;
  } | null>(null);

  // Fetch space data first, then feed items (so the header renders before the feed)
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setSpace(null);
    setItems([]);

    fetch(`/api/spaces/${spaceId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        if (data) setSpace(data);
        // Now fetch the feed
        return fetch(`/api/spaces/${spaceId}/feed`);
      })
      .then((res) => {
        if (!res || cancelled) return;
        if (!res.ok) throw new Error("Failed to fetch feed");
        return res.json();
      })
      .then((data: FeedItem[] | undefined) => {
        if (!cancelled && data) {
          setItems(data);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [spaceId]);

  const handleNameChange = useCallback(
    (name: string) => {
      fetch(`/api/spaces/${spaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      })
        .then(() => {
          window.dispatchEvent(
            new CustomEvent("space-updated", { detail: { spaceId } })
          );
        })
        .catch(() => {});
    },
    [spaceId]
  );

  const handleDescriptionChange = useCallback(
    (description: string) => {
      fetch(`/api/spaces/${spaceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description }),
      })
        .then(() => {
          window.dispatchEvent(
            new CustomEvent("space-updated", { detail: { spaceId } })
          );
        })
        .catch(() => {});
    },
    [spaceId]
  );

  const spaceWidgets = SPACE_WIDGETS[spaceId];
  const firstflexWidgets = FIRSTFLEX_SPACE_WIDGETS[spaceId];
  const widgetData = SIDEBAR_WIDGET_DATA[spaceId];
  const hasSidebar = !!(spaceWidgets || firstflexWidgets || widgetData);

  const theme = generateSpaceTheme(getSpaceHue(spaceId));
  const cssVars = spaceThemeToCssVars(theme);

  return (
    <div className="h-full relative overflow-hidden" style={{ backgroundColor: theme.bg, ...cssVars } as React.CSSProperties}>
      {/* Single scroll container — header scrolls out, sidebar sticks */}
      <div className="h-full overflow-y-auto">
        {/* Header — scrolls with content, aligned to feed+sidebar width */}
        <div className="flex justify-center px-16">
          <div style={{ width: hasSidebar ? 712 + 48 + 320 : 712 }}>
            {space ? (
              <SpaceHeader
                space={space}
                onNameChange={handleNameChange}
                onDescriptionChange={handleDescriptionChange}
              />
            ) : (
              <div className="animate-pulse mb-6 pt-12 pb-12 flex flex-col gap-3">
                <div className="w-16 h-16 rounded-[20px] bg-white/60" />
                <div className="h-14 w-3/5 bg-white/40 rounded-lg" />
                <div className="h-7 w-4/5 bg-white/30 rounded" />
              </div>
            )}
          </div>
        </div>

        {/* Feed + sidebar row — only render once header data is loaded */}
        {!space ? null : (
        <div className="flex justify-center px-16">
          <div className={`flex ${hasSidebar ? "gap-12" : ""} items-start`}>
            {/* Feed column */}
            <div style={{ width: 712 }}>
              <div className="pb-28">
                {isLoading ? (
                  <div className="flex flex-col gap-4" style={{ width: 712 }}>
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-32 rounded-2xl bg-gray-100 animate-pulse"
                      />
                    ))}
                  </div>
                ) : items.length === 0 ? (
                  <div className="text-center py-16" style={{ width: 712 }}>
                    <p className="text-sm text-gray-400">No items to show</p>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      variants={staggerContainer}
                      initial="hidden"
                      animate="visible"
                      className="flex flex-col gap-4"
                    >
                      {items.map((item) => (
                        <FeedCard key={item.id} item={item} variant="horizontal" />
                      ))}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* FirstFlex widgets sidebar (RACI + milestones) */}
            {firstflexWidgets && (
              <div className="flex flex-col gap-5 flex-shrink-0 sticky" style={{ width: 320, top: 24 }}>
                <RACIWidget {...firstflexWidgets.raci} />
                <MilestoneWidget {...firstflexWidgets.nextMilestone} />
                <MilestoneWidget {...firstflexWidgets.lastMilestone} />
              </div>
            )}

            {/* Space widgets sidebar (FF26 etc.) */}
            {spaceWidgets && (
              <div className="flex flex-col gap-5 flex-shrink-0 sticky" style={{ width: 320, top: 24 }}>
                <CountdownWidget {...spaceWidgets.countdown} />
                <AttendeesWidget {...spaceWidgets.attendees} />
                <StaffWidget {...spaceWidgets.staff} />
                <VibeCheckWidget {...spaceWidgets.vibeCheck} />
              </div>
            )}

            {/* Widget-based sidebar (1:1 spaces) */}
            {widgetData && (
              <div className="flex flex-col gap-6 flex-shrink-0 sticky" style={{ width: 320, top: 24 }}>
                <GoalsWidget goals={widgetData.goals} />
                <StatsWidget stats={widgetData.stats} />
                <AwaitingDecisionWidget
                  decisions={widgetData.decisions}
                  onSeeAll={() => {}}
                />
              </div>
            )}
          </div>
        </div>
        )}
      </div>

      {/* Gradient fade + prompt bar — centered across full content area */}
      <div className="absolute bottom-0 left-0 right-0 z-[19] flex justify-center px-16 pointer-events-none">
        <div className="relative" style={{ width: hasSidebar ? 712 + 48 + 320 : 712 }}>
          {/* Gradient overlay spanning full container */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{
              height: "calc(128px + 2rem)",
              background: `linear-gradient(180deg, hsla(${theme.tintHue},80%,96%,0) 0%, hsla(${theme.tintHue},80%,96%,0.8) 60%, hsla(${theme.tintHue},80%,96%,0.98) 100%)`,
            }}
          />
          {/* Prompt bar — centered */}
          <div className="relative pb-8 flex justify-center pointer-events-auto">
            <div className="w-full max-w-3xl px-6">
              <PromptBar onSubmit={() => {}} inputBg={theme.bg} />
            </div>
          </div>
        </div>
      </div>

      {/* Global shimmer keyframes for AI avatars */}
      <style jsx global>{`
        @keyframes feed-shimmer {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
      `}</style>
    </div>
  );
}
