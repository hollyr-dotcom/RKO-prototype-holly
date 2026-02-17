"use client";

import { useRef, useEffect, useCallback } from "react";
import type { Editor, TLShapeId } from "tldraw";

/**
 * Wrapper that observes the actual rendered height of its children
 * and syncs it back to the tldraw shape's `h` prop.
 * This eliminates the "chin" (extra whitespace at the bottom)
 * by making the shape fit its content exactly.
 */
export function AutoSizeWrapper({
  shapeId,
  shapeType,
  shapeH,
  editor,
  children,
}: {
  shapeId: TLShapeId;
  shapeType: string;
  shapeH: number;
  editor: Editor;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const lastHeightRef = useRef(shapeH);

  const syncHeight = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const contentHeight = el.scrollHeight;
    // Only update if difference is meaningful (> 4px) to avoid loops
    if (Math.abs(contentHeight - lastHeightRef.current) > 4) {
      lastHeightRef.current = contentHeight;
      editor.updateShape({
        id: shapeId,
        type: shapeType,
        props: { h: contentHeight },
      });
    }
  }, [shapeId, shapeType, editor]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => syncHeight());
    observer.observe(el);

    // Sync after delays for async data loading (Liveblocks, Tiptap, Suspense)
    const t1 = setTimeout(syncHeight, 300);
    const t2 = setTimeout(syncHeight, 800);
    const t3 = setTimeout(syncHeight, 1500);

    return () => {
      observer.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [syncHeight]);

  return (
    <div ref={contentRef} style={{ display: "flex", flexDirection: "column" }}>
      {children}
    </div>
  );
}
