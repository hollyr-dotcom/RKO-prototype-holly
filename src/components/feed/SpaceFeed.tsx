"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

/** Simple seeded PRNG (mulberry32) for deterministic shuffle per space. */
function seededRng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return h;
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  const rng = seededRng(seed);
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

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

  // Fetch all feed items and shuffle deterministically per spaceId
  useEffect(() => {
    let cancelled = false;

    setIsLoading(true);
    fetch("/api/feed")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch feed");
        return res.json();
      })
      .then((data: FeedItem[]) => {
        if (!cancelled) {
          setItems(seededShuffle(data, hashString(spaceId)));
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

  return (
    <div className="h-full relative">
      {/* Scrollable content */}
      <div className="h-full overflow-y-auto">
        {/* Space header — full width with 16px padding */}
        <div className="px-4 pt-4 sticky top-0 z-10">
          {space && (
            <SpaceHeader
              space={space}
              onNameChange={handleNameChange}
              onDescriptionChange={handleDescriptionChange}
            />
          )}
        </div>

        {/* Vertical feed — single column, centered */}
        <div className="flex flex-col items-center pb-28 px-6">
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
            <div className="text-center py-16">
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

      {/* Prompt bar — anchored to bottom of right panel */}
      <div className="absolute bottom-8 left-6 right-6 z-20">
        <HomePromptInput onSubmit={() => {}} isLoading={false} />
      </div>
    </div>
  );
}
