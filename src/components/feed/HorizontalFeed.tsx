"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import type { FeedItem } from "@/types/feed";
import { selectDeskPile } from "@/lib/selectDeskPile";
import { ScrollFeedCard } from "./ScrollFeedCard";

const CARD_WIDTH = 360;
const EDGE_PADDING = `calc(50% - ${CARD_WIDTH / 2}px)`;

export function HorizontalFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [keyboardActive, setKeyboardActive] = useState(false);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      align: "center",
      containScroll: false,
      dragFree: false,
      skipSnaps: true,
    },
    [WheelGesturesPlugin({ forceWheelAxis: "x" })]
  );

  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  // Update opacity of each slide based on distance from center
  const updateOpacity = useCallback(() => {
    if (!emblaApi) return;
    const snapList = emblaApi.scrollSnapList();
    const progress = emblaApi.scrollProgress();

    slideRefs.current.forEach((el, i) => {
      if (!el) return;
      const snapPos = snapList[i] ?? 0;
      const distance = Math.abs(progress - snapPos);
      // Map distance to opacity: 0 distance = 1.0, far = 0.45
      const opacity = Math.max(0.45, 1 - distance * 1.8);
      el.style.opacity = String(opacity);
    });
  }, [emblaApi]);

  // Track selected index and opacity on scroll
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      setSelectedIndex(emblaApi.selectedScrollSnap());
    };
    const onScroll = () => {
      updateOpacity();
    };

    const onPointerDown = () => {
      setKeyboardActive(false);
    };

    emblaApi.on("select", onSelect);
    emblaApi.on("scroll", onScroll);
    emblaApi.on("pointerDown", onPointerDown);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("reInit", onScroll);

    // Set initial state
    onSelect();
    updateOpacity();

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("scroll", onScroll);
      emblaApi.off("pointerDown", onPointerDown);
      emblaApi.off("reInit", onSelect);
      emblaApi.off("reInit", onScroll);
    };
  }, [emblaApi, updateOpacity]);

  // Keyboard navigation: ArrowLeft / ArrowRight
  useEffect(() => {
    if (!emblaApi) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Skip when focus is in a contenteditable element
      if ((e.target as HTMLElement)?.isContentEditable) return;
      // Skip when focus is in an input/textarea that has text (arrow keys needed for cursor)
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") {
        const value = (e.target as HTMLInputElement | HTMLTextAreaElement).value;
        if (value.length > 0) return;
      }

      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setKeyboardActive(true);
        emblaApi.scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setKeyboardActive(true);
        emblaApi.scrollNext();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [emblaApi]);

  // Fetch feed data
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
      className="embla__viewport"
      ref={emblaRef}
      style={{ paddingTop: 24, paddingBottom: 40 }}
    >
      <div
        className="flex gap-8"
        style={{
          paddingLeft: EDGE_PADDING,
          paddingRight: EDGE_PADDING,
        }}
      >
        {items.map((item, i) => (
          <div
            key={item.id}
            ref={(el) => { slideRefs.current[i] = el; }}
            className="flex-shrink-0"
            style={{ width: CARD_WIDTH }}
          >
            <ScrollFeedCard item={item} isActive={keyboardActive && i === selectedIndex} />
          </div>
        ))}
      </div>
    </div>
  );
}
