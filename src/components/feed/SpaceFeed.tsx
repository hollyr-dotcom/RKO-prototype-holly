"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Masonry from "react-masonry-css";
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

export function SpaceFeed({ spaceId }: SpaceFeedProps) {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [space, setSpace] = useState<{ id: string; name: string; description?: string; emoji?: string; color?: string } | null>(null);

  // Fetch space data for banner emoji
  useEffect(() => {
    fetch(`/api/spaces/${spaceId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSpace(data);
      })
      .catch(() => {});
  }, [spaceId]);

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

  return (
    <div className="h-full overflow-y-auto relative">
      {/* Space header — full width with 16px padding */}
      <div className="px-4 pt-4">
        {space && (
          <SpaceHeader
            space={space}
            onNameChange={handleNameChange}
            onDescriptionChange={handleDescriptionChange}
          />
        )}
      </div>

      <div className="max-w-[900px] mx-auto px-6 pb-28">
        {/* Feed list */}
        {!isLoading && filteredItems.length > 0 && (
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

      {/* Prompt bar — fixed to viewport bottom */}
      <div className="fixed bottom-8 left-6 right-6 z-20">
        <HomePromptInput onSubmit={() => {}} isLoading={false} />
      </div>
    </div>
  );
}
