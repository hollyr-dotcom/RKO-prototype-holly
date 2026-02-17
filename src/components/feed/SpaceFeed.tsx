"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Masonry from "react-masonry-css";
import type { FeedItem } from "@/types/feed";
import { FeedCard } from "./FeedCard";

interface SpaceFeedProps {
  spaceId: string;
}

type FilterTab = "all" | "ai" | "requests" | "updates";

const tabs: { id: FilterTab; label: string }[] = [
  { id: "all", label: "All" },
  { id: "ai", label: "AI insights" },
  { id: "requests", label: "Requests" },
  { id: "updates", label: "Updates" },
];

const filterMap: Record<FilterTab, string[]> = {
  all: [],
  ai: ["agent-opportunity", "agent-completed"],
  requests: ["collaboration-request"],
  updates: ["workflow-change"],
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

export function SpaceFeed({ spaceId }: SpaceFeedProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    fetch(`/api/spaces/${spaceId}/feed`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch feed");
        return res.json();
      })
      .then((data) => {
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

  const filteredItems = items;

  const unreadCount = items.filter((item) => !item.isRead).length;

  return (
    <div className="h-full overflow-y-auto">
      <div className="max-w-[900px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 text-blue-700">
                {unreadCount} new
              </span>
            )}
          </div>
          <p className="text-sm text-gray-500 mt-1">
            Activity and updates across this space
          </p>
        </div>

        {/* Feed list */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-40 rounded-xl bg-gray-100 animate-pulse"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 col-span-2">
            <p className="text-sm text-gray-400">No items to show</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <Masonry
                breakpointCols={2}
                className="flex gap-8 w-auto"
                columnClassName="bg-clip-padding"
              >
                {filteredItems.map((item) => (
                  <div key={item.id} className="mb-8">
                    <FeedCard item={item} />
                  </div>
                ))}
              </Masonry>
            </motion.div>
          </AnimatePresence>
        )}
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
