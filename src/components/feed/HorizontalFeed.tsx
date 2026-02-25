"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { WheelGesturesPlugin } from "embla-carousel-wheel-gestures";
import type { FeedItem } from "@/types/feed";
import { selectDeskPile } from "@/lib/selectDeskPile";
import { ScrollFeedCard } from "./ScrollFeedCard";

const CARD_WIDTH = 360;
const HERO_CARD_WIDTH = 396;
const EDGE_PADDING = `calc(50% - ${CARD_WIDTH / 2}px)`;

export function HorizontalFeed() {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [keyboardActive, setKeyboardActive] = useState(false);
  const lastMousePos = useRef<{ x: number; y: number } | null>(null);

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
  const hoveredIndexRef = useRef<number | null>(null);
  const keyboardActiveRef = useRef(false);
  const selectedIndexRef = useRef(0);

  // Update opacity of each slide based on distance from center
  // Hovered or keyboard-active cards always get full opacity
  const updateOpacity = useCallback(() => {
    if (!emblaApi) return;
    const snapList = emblaApi.scrollSnapList();
    const progress = emblaApi.scrollProgress();

    slideRefs.current.forEach((el, i) => {
      if (!el) return;
      // Hovered or keyboard-active card always gets full opacity
      if (i === hoveredIndexRef.current || (keyboardActiveRef.current && i === selectedIndexRef.current)) {
        el.style.opacity = "1";
        return;
      }
      const snapPos = snapList[i] ?? 0;
      const distance = Math.abs(progress - snapPos);
      const opacity = Math.max(0.45, 1 - distance * 1.8);
      el.style.opacity = String(opacity);
    });
  }, [emblaApi]);

  // Track selected index and opacity on scroll
  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => {
      const idx = emblaApi.selectedScrollSnap();
      selectedIndexRef.current = idx;
      setSelectedIndex(idx);
    };
    const onScroll = () => {
      updateOpacity();
    };

    const onPointerDown = () => {
      keyboardActiveRef.current = false;
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
        keyboardActiveRef.current = true;
        setKeyboardActive(true);
        emblaApi.scrollPrev();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        keyboardActiveRef.current = true;
        setKeyboardActive(true);
        emblaApi.scrollNext();
      } else if (e.key === "Enter" && keyboardActiveRef.current) {
        // Trigger primary action on focused card
        e.preventDefault();
        const activeEl = slideRefs.current[selectedIndexRef.current];
        if (activeEl) {
          const primaryBtn = activeEl.querySelector<HTMLButtonElement>("button");
          primaryBtn?.click();
        }
      } else if (e.key === "Escape" && keyboardActiveRef.current) {
        // Defocus carousel
        e.preventDefault();
        keyboardActiveRef.current = false;
        setKeyboardActive(false);
        updateOpacity();
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

  if (items.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ paddingTop: 48, paddingBottom: 48 }}>
        <div className="flex flex-col items-center gap-3 text-center max-w-xs">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-gray-300">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="1.5" fill="none" />
            <path d="M16 28c2-3 5-4 8-4s6 1 8 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" fill="none" />
            <circle cx="18" cy="20" r="1.5" fill="currentColor" />
            <circle cx="30" cy="20" r="1.5" fill="currentColor" />
          </svg>
          <p className="text-base font-medium text-gray-500">Nothing here yet</p>
          <p className="text-sm text-gray-400">Your AI assistant will surface important items as you work</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="embla__viewport"
      ref={emblaRef}
      style={{ paddingTop: 24, paddingBottom: 40 }}
      onMouseMove={(e) => {
        const prev = lastMousePos.current;
        lastMousePos.current = { x: e.clientX, y: e.clientY };
        // Only clear keyboard focus when mouse actually moved (not just DOM shifting under cursor)
        if (keyboardActive && prev && (Math.abs(e.clientX - prev.x) > 2 || Math.abs(e.clientY - prev.y) > 2)) {
          keyboardActiveRef.current = false;
          setKeyboardActive(false);
        }
      }}
    >
      <div
        className="flex gap-8"
        style={{
          paddingLeft: EDGE_PADDING,
          paddingRight: EDGE_PADDING,
        }}
      >
        {items.map((item, i) => {
          const isHero = i === 0;
          return (
            <div
              key={item.id}
              ref={(el) => { slideRefs.current[i] = el; }}
              className="flex-shrink-0"
              style={{ width: isHero ? HERO_CARD_WIDTH : CARD_WIDTH, transition: "opacity 150ms ease-out" }}
              onMouseEnter={() => {
                hoveredIndexRef.current = i;
                const el = slideRefs.current[i];
                if (el) el.style.opacity = "1";
              }}
              onMouseLeave={() => {
                if (hoveredIndexRef.current === i) hoveredIndexRef.current = null;
                updateOpacity();
              }}
            >
              <ScrollFeedCard item={item} isActive={keyboardActive && i === selectedIndex} suppressHover={keyboardActive} isHero={isHero} />
            </div>
          );
        })}
      </div>
    </div>
  );
}
