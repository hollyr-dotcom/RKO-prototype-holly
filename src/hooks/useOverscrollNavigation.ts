"use client";

import { useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { setPageTransitionDirection } from "@/lib/page-transition";

const THRESHOLD = 100;

interface UseOverscrollNavigationOptions {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  direction: "down" | "up";
  targetPath: string;
  enabled?: boolean;
}

/**
 * Detects overscroll (wheel events past scroll boundary) and triggers
 * an animated page transition to the target route.
 */
export function useOverscrollNavigation({
  scrollRef,
  direction,
  targetPath,
  enabled = true,
}: UseOverscrollNavigationOptions) {
  const router = useRouter();
  const accumulatorRef = useRef(0);
  const navigatingRef = useRef(false);

  // Prefetch target route
  useEffect(() => {
    router.prefetch(targetPath);
  }, [router, targetPath]);

  const handleWheel = useCallback(
    (e: WheelEvent) => {
      if (!enabled || navigatingRef.current) return;

      const el = scrollRef.current;
      if (!el) return;

      if (direction === "down") {
        const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 1;
        if (atBottom && e.deltaY > 0) {
          accumulatorRef.current += e.deltaY;
          if (accumulatorRef.current > THRESHOLD) {
            navigatingRef.current = true;
            setPageTransitionDirection(1);
            router.push(targetPath);
          }
        } else {
          accumulatorRef.current = 0;
        }
      } else {
        const atTop = el.scrollTop < 1;
        if (atTop && e.deltaY < 0) {
          accumulatorRef.current += Math.abs(e.deltaY);
          if (accumulatorRef.current > THRESHOLD) {
            navigatingRef.current = true;
            setPageTransitionDirection(-1);
            router.push(targetPath);
          }
        } else {
          accumulatorRef.current = 0;
        }
      }
    },
    [enabled, direction, targetPath, router, scrollRef]
  );

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("wheel", handleWheel, { passive: true });
    return () => el.removeEventListener("wheel", handleWheel);
  }, [scrollRef, handleWheel]);

  // Reset navigating flag when enabled changes (e.g., navigated back)
  useEffect(() => {
    navigatingRef.current = false;
    accumulatorRef.current = 0;
  }, [enabled]);
}
