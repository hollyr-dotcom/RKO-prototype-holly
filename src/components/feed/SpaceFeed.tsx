"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import type { FeedItem } from "@/types/feed";
import { FeedCard } from "./FeedCard";
import { SpaceHeader } from "./SpaceHeader";
import { HomePromptInput } from "@/components/HomePromptInput";

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

/** Sidebar panel config — maps spaceId → ordered list of PNG image paths */
const SIDEBAR_PANELS: Record<string, string[]> = {
  "space-firstflex": [
    "/feed-viz/FirstFlex-Youth-Banking/Single number-2.png",
    "/feed-viz/FirstFlex-Youth-Banking/Single number.png",
    "/feed-viz/FirstFlex-Youth-Banking/Single number-1.png",
  ],
  "space-ff26": [
    "/feed-viz/FlexForward-26/Single number.png",
    "/feed-viz/FlexForward-26/Single number-1.png",
    "/feed-viz/FlexForward-26/Single number-2.png",
    "/feed-viz/FlexForward-26/Single number-3.png",
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

  // Fetch space data
  useEffect(() => {
    fetch(`/api/spaces/${spaceId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSpace(data);
      })
      .catch(() => {});
  }, [spaceId]);

  // Fetch feed items for this space
  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    fetch(`/api/spaces/${spaceId}/feed`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch feed");
        return res.json();
      })
      .then((data: FeedItem[]) => {
        if (!cancelled) {
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

  return (
    <div className="h-full relative overflow-hidden">
      {/* Single scroll container — header scrolls out, sidebar sticks */}
      <div className="h-full overflow-y-auto">
        {/* Header — scrolls with content */}
        <div className="px-4 pt-4">
          {space && (
            <SpaceHeader
              space={space}
              onNameChange={handleNameChange}
              onDescriptionChange={handleDescriptionChange}
            />
          )}
        </div>

        {/* Feed + sidebar row */}
        <div className="flex justify-center">
          <div className={`flex ${sidebarPanels ? "gap-12" : ""} items-start`}>
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
              <div className="flex flex-col gap-3 flex-shrink-0 sticky top-0 pt-6" style={{ width: 320 }}>
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
          </div>
        </div>
      </div>

      {/* Prompt bar — anchored to bottom */}
      <div className="absolute bottom-8 left-6 right-6 z-20">
        <HomePromptInput onSubmit={() => {}} isLoading={false} />
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
