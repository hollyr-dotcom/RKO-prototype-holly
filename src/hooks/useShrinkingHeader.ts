import { useState, useEffect, useCallback, RefObject } from "react";

interface UseShrinkingHeaderOptions {
  scrollRef: RefObject<HTMLElement | null>;
  maxSize?: number;
  minSize?: number;
  shrinkDistance?: number;
}

export function useShrinkingHeader({
  scrollRef,
  maxSize = 80,
  minSize = 18,
  shrinkDistance = 200,
}: UseShrinkingHeaderOptions) {
  const [fontSize, setFontSize] = useState(maxSize);
  const [isSticky, setIsSticky] = useState(false);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const scrollTop = el.scrollTop;
    const progress = Math.min(Math.max(scrollTop / shrinkDistance, 0), 1);
    const size = maxSize - progress * (maxSize - minSize);

    setFontSize(size);
    setIsSticky(progress >= 1);
  }, [scrollRef, maxSize, minSize, shrinkDistance]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    el.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll(); // sync initial state

    return () => el.removeEventListener("scroll", handleScroll);
  }, [scrollRef, handleScroll]);

  return { fontSize, isSticky };
}
