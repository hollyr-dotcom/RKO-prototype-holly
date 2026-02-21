"use client";

import { useState, useEffect, useRef } from "react";
import type { FeedItem } from "@/types/feed";
import { selectDeskPile } from "@/lib/selectDeskPile";
import { ScrollFeedCard } from "./ScrollFeedCard";

const CARD_WIDTH = 360;
// Padding that centers the first (and last) card in the viewport
const EDGE_PADDING = `calc(50% - ${CARD_WIDTH / 2}px)`;

export function HorizontalFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Redirect vertical wheel scroll to horizontal
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        e.preventDefault();
        el.scrollLeft += e.deltaY;
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/feed")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch feed");
        return res.json();
      })
      .then((data: FeedItem[]) => {
        if (!cancelled) {
          const pile = selectDeskPile(data);
          // Append extra cards at the end
          for (const id of ["feed-ff-youth-04", "feed-ff-05", "feed-cross-06"]) {
            const card = data.find((i) => i.id === id);
            if (card && !pile.some((i) => i.id === card.id)) {
              pile.push(card);
            }
          }
          setItems(pile);
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

  if (isLoading) {
    return (
      <div
        ref={scrollRef}
        className="flex gap-8 overflow-x-auto"
        style={{
          paddingLeft: EDGE_PADDING,
          paddingRight: EDGE_PADDING,
          paddingTop: 24,
          paddingBottom: 40,
          scrollbarWidth: "none",
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="flex-shrink-0 rounded-3xl bg-gray-100 animate-pulse"
            style={{ width: CARD_WIDTH, height: 480 }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      ref={scrollRef}
      className="horizontal-feed flex gap-8 overflow-x-auto w-full"
      style={{
        paddingLeft: EDGE_PADDING,
        paddingRight: EDGE_PADDING,
        paddingTop: 24,
        paddingBottom: 40,
        scrollSnapType: "x mandatory",
        scrollbarWidth: "none",
      }}
    >
      {items.map((item) => (
        <ScrollFeedCard key={item.id} item={item} />
      ))}
    </div>
  );
}
