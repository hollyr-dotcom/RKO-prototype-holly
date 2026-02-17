"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";
import type { FeedItem } from "@/types/feed";
import { FeedCard } from "./FeedCard";

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.04 },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 400, damping: 30 },
  },
};

function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let parent = el?.parentElement ?? null;
  while (parent) {
    const style = getComputedStyle(parent);
    if (/(auto|scroll)/.test(style.overflow + style.overflowY)) return parent;
    parent = parent.parentElement;
  }
  return null;
}

export function HomeFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const scrollY = useMotionValue(0);
  const leftOffset = useTransform(scrollY, (v) => v * 0.1);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/feed")
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
  }, []);

  useEffect(() => {
    const scrollParent = getScrollParent(wrapperRef.current);
    if (!scrollParent) return;

    const handleScroll = () => {
      scrollY.set(scrollParent.scrollTop);
    };

    scrollParent.addEventListener("scroll", handleScroll, { passive: true });
    return () => scrollParent.removeEventListener("scroll", handleScroll);
  }, [scrollY]);

  const leftItems = items.filter((_, i) => i % 2 === 0);
  const rightItems = items.filter((_, i) => i % 2 === 1);

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 gap-4 mt-6 w-full max-w-[1200px] px-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="h-40 rounded-xl bg-gray-100 animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16 w-full max-w-[1200px] px-6">
        <p className="text-sm text-gray-400">No items to show</p>
      </div>
    );
  }

  return (
    <div ref={wrapperRef} className="w-full max-w-[1200px] px-6 mt-6">
      <AnimatePresence mode="wait">
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="flex gap-4"
        >
          {/* Left column — scrolls 10% slower */}
          <motion.div className="flex-1 flex flex-col gap-4" style={{ y: leftOffset }}>
            {leftItems.map((item) => (
              <motion.div key={item.id} variants={staggerItem}>
                <FeedCard item={item} spaceName={item.spaceName} />
              </motion.div>
            ))}
          </motion.div>

          {/* Right column — scrolls at normal speed */}
          <div className="flex-1 flex flex-col gap-4">
            {rightItems.map((item) => (
              <motion.div key={item.id} variants={staggerItem}>
                <FeedCard item={item} spaceName={item.spaceName} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

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
