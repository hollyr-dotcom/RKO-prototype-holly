"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { FeedItem } from "@/types/feed";
import { FeedCard } from "./FeedCard";
import { SpaceHeader } from "./SpaceHeader";
import { PromptBar } from "@/components/PromptBar";
import {
  GoalsWidget,
  StatsWidget,
  AwaitingDecisionWidget,
} from "@/components/sidebar-widgets";
import { SIDEBAR_WIDGET_DATA } from "@/data/sidebar-widget-data";

interface SpaceFeedProps {
  spaceId: string;
}

/** Derive a stable hue (0–359) from a string by summing char codes. */
function hueFromId(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) sum += id.charCodeAt(i);
  return sum % 360;
}

/** Hue overrides for spaces with branded header gradients */
const SPACE_HUES: Record<string, number> = {
  "space-firstflex": 184,
  "space-ff26": 268,
  "space-1on1-james": 263,
  "space-1on1-amara": 202,
  "space-1on1-daniel": 212,
};

/** Get the light surface tint hue for a space */
function getSpaceHue(spaceId: string): number {
  return SPACE_HUES[spaceId] ?? hueFromId(spaceId);
}

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

/** Sidebar panel config — maps spaceId → ordered list of PNG image paths */
const SIDEBAR_PANELS: Record<string, string[]> = {
  "space-firstflex": [
    "/feed-viz/FirstFlex-Youth-Banking/Single%20number-2.png",
    "/feed-viz/FirstFlex-Youth-Banking/Single%20number.png",
    "/feed-viz/FirstFlex-Youth-Banking/Single%20number-1.png",
  ],
  "space-ff26": [
    "/feed-viz/FlexForward-26/Single%20number.png",
    "/feed-viz/FlexForward-26/Single%20number-1.png",
    "/feed-viz/FlexForward-26/Single%20number-2.png",
    "/feed-viz/FlexForward-26/Single%20number-3.png",
  ],
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

  const sidebarPanels = SIDEBAR_PANELS[spaceId];
  const widgetData = SIDEBAR_WIDGET_DATA[spaceId];
  const hasSidebar = !!(sidebarPanels || widgetData);

  const surfaceHue = getSpaceHue(spaceId);
  const surfaceBg = `hsl(${surfaceHue}, 35%, 96%)`;

  return (
    <div className="h-full relative overflow-hidden" style={{ backgroundColor: surfaceBg }}>
      {/* Single scroll container — header scrolls out, sidebar sticks */}
      <div className="h-full overflow-y-auto">
        {/* Header — scrolls with content, aligned to feed+sidebar width */}
        <div className="flex justify-center px-4">
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
        <div className="flex justify-center px-4">
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

            {/* Sidebar panels — sticky to viewport top */}
            {sidebarPanels && (
              <div className="flex flex-col gap-6 flex-shrink-0 sticky" style={{ width: 320, top: 24 }}>
                {sidebarPanels.map((src, i) => (
                  <Image
                    key={i}
                    src={src}
                    alt=""
                    width={480}
                    height={480}
                    className="w-full h-auto rounded-xl"
                    priority={i === 0}
                  />
                ))}
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

      {/* Gradient fade + prompt bar — aligned to feed column via same flex layout */}
      <div className="absolute bottom-0 left-0 right-0 z-[19] flex justify-center px-4 pointer-events-none">
        <div className={`flex ${hasSidebar ? "gap-12" : ""} items-end`}>
          <div style={{ width: 712 }}>
            {/* Gradient overlay */}
            <div
              className="absolute bottom-0 pointer-events-none"
              style={{
                width: 712,
                height: "calc(128px + 2rem)",
                background: `linear-gradient(180deg, hsla(${surfaceHue},35%,96%,0) 0%, hsla(${surfaceHue},35%,96%,0.8) 60%, hsla(${surfaceHue},35%,96%,0.98) 100%)`,
              }}
            />
            {/* Prompt bar */}
            <div className="relative pb-8 pointer-events-auto">
              <div className="mx-auto max-w-3xl px-6">
                <PromptBar onSubmit={() => {}} inputBg={surfaceBg} />
              </div>
            </div>
          </div>
          {/* Invisible spacer matching sidebar width so feed column stays aligned */}
          {hasSidebar && <div style={{ width: 320 }} className="flex-shrink-0" />}
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
