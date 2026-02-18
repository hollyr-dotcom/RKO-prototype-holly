"use client";

import { useState, useEffect, useCallback } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import type { FeedItem } from "@/types/feed";
import { selectDeskPile } from "@/lib/selectDeskPile";
import { StackFeedCard } from "./StackFeedCard";

// Spring config matching motion-system.md "snappy" preset
const SPRING_SNAPPY = { type: "spring" as const, stiffness: 400, damping: 30 };

const SWIPE_OFFSET_THRESHOLD = 100;
const SWIPE_VELOCITY_THRESHOLD = 500;

// Visual config for each stack position (top → behind)
// x offsets are large enough that each behind card's right edge bleeds past
// the 520px container right edge (overflow-visible lets them show)
const STACK_LAYERS = [
  { scale: 1,    y: 0, x: 0,   rotate: 0,  opacity: 1   },
  { scale: 0.88, y: 4, x: 50,  rotate: 4,  opacity: 0.8 },
  { scale: 0.76, y: 8, x: 100, rotate: 8,  opacity: 0.6 },
] as const;

// ---------- Swipeable top card ----------

interface SwipeableCardProps {
  item: FeedItem;
  onDismiss: (direction: "left" | "right") => void;
}

function SwipeableCard({ item, onDismiss }: SwipeableCardProps) {
  const x = useMotionValue(0);

  // Direction indicator opacities
  const leftOpacity = useTransform(x, [-150, -50, 0], [1, 0, 0]);
  const rightOpacity = useTransform(x, [0, 50, 150], [0, 0, 1]);

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const { offset, velocity } = info;
      const absOffset = Math.abs(offset.x);
      const absVelocity = Math.abs(velocity.x);

      if (
        absOffset > SWIPE_OFFSET_THRESHOLD ||
        absVelocity > SWIPE_VELOCITY_THRESHOLD
      ) {
        onDismiss(offset.x > 0 ? "right" : "left");
      }
    },
    [onDismiss]
  );

  return (
    <motion.div
      style={{ x, zIndex: 3 }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.7}
      onDragEnd={handleDragEnd}
      className="absolute inset-0 flex items-start justify-center cursor-grab active:cursor-grabbing"
      whileTap={{ cursor: "grabbing" }}
    >
      {/* Dismiss indicators */}
      <motion.div
        style={{ opacity: rightOpacity }}
        className="absolute top-6 right-6 z-10 px-3 py-1.5 bg-emerald-500 text-white text-xs font-semibold rounded-full pointer-events-none select-none"
      >
        Done
      </motion.div>
      <motion.div
        style={{ opacity: leftOpacity }}
        className="absolute top-6 left-6 z-10 px-3 py-1.5 bg-gray-400 text-white text-xs font-semibold rounded-full pointer-events-none select-none"
      >
        Later
      </motion.div>

      <StackFeedCard item={item} />
    </motion.div>
  );
}

// ---------- Main CardStack ----------

interface CardStackProps {
  onAllDone?: () => void;
}

export function CardStack({ onAllDone }: CardStackProps) {
  const [allItems, setAllItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [exitDirection, setExitDirection] = useState<"left" | "right" | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    fetch("/api/feed")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch feed");
        return res.json();
      })
      .then((data: FeedItem[]) => {
        if (!cancelled) {
          setAllItems(selectDeskPile(data));
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

  // Compute isDone before the early return so the effect can reference it
  const remaining = allItems.slice(currentIndex);
  const isDone = !isLoading && remaining.length === 0;

  // When all cards are dismissed, wait for the last card's exit animation then signal done
  useEffect(() => {
    if (!isDone) return;
    const t = setTimeout(() => onAllDone?.(), 150);
    return () => clearTimeout(t);
  }, [isDone, onAllDone]);

  const handleDismiss = useCallback(
    (direction: "left" | "right") => {
      setExitDirection(direction);
      setCurrentIndex((i) => i + 1);
    },
    []
  );

  // Keyboard accessibility
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (currentIndex >= allItems.length) return;
      if (e.key === "ArrowRight" || e.key === "Enter") {
        handleDismiss("right");
      } else if (e.key === "ArrowLeft") {
        handleDismiss("left");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [currentIndex, allItems.length, handleDismiss]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center w-full px-6">
        <div className="relative w-full max-w-[520px] h-[560px]">
          {[2, 1, 0].map((i) => (
            <div
              key={i}
              className="absolute inset-0 flex items-start justify-center"
              style={{
                transform: `scale(${STACK_LAYERS[i].scale}) translateY(${STACK_LAYERS[i].y}px)`,
                zIndex: 3 - i,
                opacity: STACK_LAYERS[i].opacity,
              }}
            >
              <div className="w-full max-w-[520px] h-[560px] rounded-xl bg-gray-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // The visible stack: up to 3 cards (current + 2 behind)
  const visibleItems = remaining.slice(0, 3);

  return (
    <div className="flex flex-col items-center w-full px-6 overflow-visible">
      {/* Card stack container — overflow-visible so peeking cards bleed right */}
      <div className="relative w-full max-w-[520px] h-[560px] overflow-visible">
        {/* Cards — hidden once all are dismissed */}
        {!isDone && (
          <AnimatePresence mode="sync" initial={false}>
            {visibleItems.map((item, stackIndex) => {
              const layer = STACK_LAYERS[stackIndex];
              const isTop = stackIndex === 0;

              if (isTop) {
                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 40, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1, rotate: 0, x: 0 }}
                    exit={
                      exitDirection === "right"
                        ? { x: 600, rotate: 15, opacity: 0 }
                        : { x: -600, rotate: -15, opacity: 0 }
                    }
                    transition={SPRING_SNAPPY}
                    className="absolute inset-0 flex items-start justify-center"
                    style={{ zIndex: 3 }}
                  >
                    <SwipeableCard item={item} onDismiss={handleDismiss} />
                  </motion.div>
                );
              }

              return (
                <motion.div
                  key={item.id}
                  animate={{
                    scale: layer.scale,
                    y: layer.y,
                    x: layer.x,
                    rotate: layer.rotate,
                    opacity: layer.opacity,
                  }}
                  transition={{ type: "spring", stiffness: 280, damping: 28 }}
                  className="absolute inset-0 flex items-start justify-center pointer-events-none"
                  style={{ zIndex: 3 - stackIndex }}
                >
                  <StackFeedCard item={item} />
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
