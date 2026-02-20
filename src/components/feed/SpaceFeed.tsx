"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { FeedItem } from "@/types/feed";
import { ScrollFeedCard } from "./ScrollFeedCard";
import { SpaceHeader } from "./SpaceHeader";
import { HomePromptInput } from "@/components/HomePromptInput";
import { selectDeskPile } from "@/lib/selectDeskPile";

interface SpaceFeedProps {
  spaceId: string;
}

const CARD_WIDTH = 360;

/** Derive a stable hue (0–359) from a string (must match SpaceHeader). */
function hueFromId(id: string): number {
  let sum = 0;
  for (let i = 0; i < id.length; i++) {
    sum += id.charCodeAt(i);
  }
  return sum % 360;
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Redirect vertical wheel scroll to horizontal on the card strip
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

  // Fetch space data
  useEffect(() => {
    fetch(`/api/spaces/${spaceId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setSpace(data);
      })
      .catch(() => {});
  }, [spaceId]);

  // Fetch feed items — use global feed as placeholder (same cards as Home)
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
          setItems(selectDeskPile(data));
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

  // Derive panel bg from the header gradient's right stop hue, but at ~10% saturation
  const hue = hueFromId(spaceId);
  const panelBg = `hsl(${hue + 12}, 10%, 93%)`;

  return (
    <div className="h-full relative flex flex-col overflow-hidden">
      {/* Space header — full width with 16px padding */}
      <div className="px-4 pt-4 flex-shrink-0">
        {space && (
          <SpaceHeader
            space={space}
            onNameChange={handleNameChange}
            onDescriptionChange={handleDescriptionChange}
          />
        )}
      </div>

      {/* Card strip area — fills remaining height, clipped to viewport */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        {/* Horizontal scrolling cards — only this div scrolls */}
        <div
          ref={scrollRef}
          className="absolute inset-0 flex items-start gap-8 overflow-x-auto"
          style={{
            paddingLeft: 16,
            paddingTop: 24,
            paddingBottom: 40,
            scrollSnapType: "x mandatory",
            scrollbarWidth: "none",
          }}
        >
          {isLoading
            ? [0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="flex-shrink-0 rounded-3xl bg-gray-100 animate-pulse"
                  style={{ width: CARD_WIDTH, height: 480 }}
                />
              ))
            : items.map((item) => (
                <ScrollFeedCard key={item.id} item={item} />
              ))}
          {/* Spacer so last card doesn't hide under the overlay */}
          <div className="flex-shrink-0" style={{ width: 500 }} />
        </div>

        {/* Right gradient overlay — 500px, full height, floats above cards */}
        <div
          className="absolute top-0 right-0 bottom-0 pointer-events-none z-10"
          style={{ width: 500 }}
        >
          {/* Gradient fade from transparent to white */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.6) 25%, rgba(255,255,255,0.95) 50%, white 65%)",
            }}
          />

          {/* Panel container — 316×512, anchored top-right */}
          <div
            className="absolute top-6 right-4 pointer-events-auto flex flex-col gap-4"
            style={{ width: 316, height: 512 }}
          >
            {/* Panel 1 */}
            <div
              className="flex-1 rounded-2xl"
              style={{ backgroundColor: panelBg }}
            />

            {/* Panel 2 */}
            <div
              className="flex-1 rounded-2xl"
              style={{ backgroundColor: panelBg }}
            />
          </div>
        </div>
      </div>

      {/* Prompt bar — anchored to bottom of right panel */}
      <div className="absolute bottom-8 left-6 right-6 z-20">
        <HomePromptInput onSubmit={() => {}} isLoading={false} />
      </div>
    </div>
  );
}
