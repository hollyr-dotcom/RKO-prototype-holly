"use client";

import { useRef, useEffect, useCallback } from "react";
import type { Editor, TLShapeId } from "tldraw";

/**
 * Wrapper that observes the actual rendered size of its children
 * and syncs it back to the tldraw shape's `h` (and optionally `w`) prop.
 * This eliminates clipping by making the shape fit its content exactly.
 */
export function AutoSizeWrapper({
  shapeId,
  shapeType,
  shapeH,
  shapeW,
  editor,
  syncWidth = false,
  growOnly = false,
  children,
}: {
  shapeId: TLShapeId;
  shapeType: string;
  shapeH: number;
  shapeW?: number;
  editor: Editor;
  syncWidth?: boolean;
  /** When true, only grow — never shrink below initial size (use for shapes that don't render reliably inside frames) */
  growOnly?: boolean;
  children: React.ReactNode;
}) {
  const contentRef = useRef<HTMLDivElement>(null);
  const lastHeightRef = useRef(shapeH);
  const lastWidthRef = useRef(shapeW ?? 0);

  const syncSize = useCallback(() => {
    const el = contentRef.current;
    if (!el) return;
    const contentHeight = el.scrollHeight;
    const contentWidth = el.scrollWidth;

    // When growOnly, never shrink below initial size (prevents gantt from
    // collapsing to 0 when content hasn't rendered inside frames)
    const effectiveHeight = growOnly ? Math.max(contentHeight, shapeH) : contentHeight;
    const effectiveWidth = growOnly ? Math.max(contentWidth, shapeW ?? 0) : contentWidth;
    const hChanged = Math.abs(effectiveHeight - lastHeightRef.current) > 4;
    const wChanged = syncWidth && Math.abs(effectiveWidth - lastWidthRef.current) > 8;

    if (hChanged || wChanged) {
      const props: Record<string, number> = {};
      if (hChanged) {
        lastHeightRef.current = effectiveHeight;
        props.h = effectiveHeight;
      }
      if (wChanged) {
        lastWidthRef.current = effectiveWidth;
        props.w = effectiveWidth;
      }
      editor.updateShape({
        id: shapeId,
        type: shapeType as any,
        props,
      });
    }
  }, [shapeId, shapeType, shapeH, shapeW, editor, syncWidth, growOnly]);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    const observer = new ResizeObserver(() => syncSize());
    observer.observe(el);

    // Sync after delays for async data loading (Liveblocks, Tiptap, Suspense)
    const t1 = setTimeout(syncSize, 300);
    const t2 = setTimeout(syncSize, 800);
    const t3 = setTimeout(syncSize, 1500);

    return () => {
      observer.disconnect();
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [syncSize]);

  return (
    <div
      ref={contentRef}
      style={{
        display: "flex",
        flexDirection: "column",
        // When syncing width, become a scroll container (overflow: hidden)
        // so scrollWidth captures the true content width from overflowing children.
        // Also flex: 1 so we fill the parent HTMLContainer height.
        ...(syncWidth
          ? { flex: 1, minHeight: 0, overflow: "hidden" }
          : {}),
      }}
    >
      {children}
    </div>
  );
}
