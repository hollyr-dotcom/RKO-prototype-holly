"use client";

import { useEffect, useState, useRef } from "react";
import { Editor } from "tldraw";
import type { AICursorState, AICursorTarget } from "@/lib/ai-presence";
import { duration } from "@/lib/motion";

interface AICursorHighlightProps {
  editor: Editor | null;
  cursorState: AICursorState;
  target: AICursorTarget | null;
}

/**
 * Renders a soft blue glow highlight ring around the shape the AI cursor
 * is pointing at. The overlay is positioned over the canvas and does not
 * modify shape data.
 *
 * Appears when cursorState is "pointing" and target is a shape.
 * Animates in with duration.fast, fades out with duration.normal.
 */
export function AICursorHighlight({
  editor,
  cursorState,
  target,
}: AICursorHighlightProps) {
  const [bounds, setBounds] = useState<{
    x: number;
    y: number;
    w: number;
    h: number;
  } | null>(null);
  const [visible, setVisible] = useState(false);
  const fadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editor) {
      setVisible(false);
      return;
    }

    const shouldHighlight =
      cursorState === "pointing" && target?.type === "shape" && target.shapeId;

    if (!shouldHighlight) {
      // Fade out
      setVisible(false);
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
      fadeTimeoutRef.current = setTimeout(() => {
        setBounds(null);
      }, duration.normal * 1000);
      return;
    }

    // Resolve shape bounds in screen coordinates
    try {
      const pageBounds = editor.getShapePageBounds(target.shapeId! as any);
      if (!pageBounds) {
        setVisible(false);
        return;
      }

      // Convert page bounds to screen coordinates
      const topLeft = editor.pageToViewport({ x: pageBounds.x, y: pageBounds.y });
      const bottomRight = editor.pageToViewport({
        x: pageBounds.maxX,
        y: pageBounds.maxY,
      });

      setBounds({
        x: topLeft.x,
        y: topLeft.y,
        w: bottomRight.x - topLeft.x,
        h: bottomRight.y - topLeft.y,
      });

      // Animate in
      requestAnimationFrame(() => {
        setVisible(true);
      });
    } catch {
      setVisible(false);
    }

    return () => {
      if (fadeTimeoutRef.current) clearTimeout(fadeTimeoutRef.current);
    };
  }, [editor, cursorState, target]);

  if (!bounds) return null;

  const padding = 6;

  return (
    <div
      style={{
        position: "absolute",
        left: bounds.x - padding,
        top: bounds.y - padding,
        width: bounds.w + padding * 2,
        height: bounds.h + padding * 2,
        borderRadius: 8,
        boxShadow: visible
          ? "0 0 12px rgba(37, 99, 235, 0.3), 0 0 4px rgba(37, 99, 235, 0.2)"
          : "none",
        border: visible
          ? "2px solid rgba(37, 99, 235, 0.25)"
          : "2px solid transparent",
        opacity: visible ? 1 : 0,
        transition: visible
          ? `opacity ${duration.fast}s ease-out, box-shadow ${duration.fast}s ease-out, border-color ${duration.fast}s ease-out`
          : `opacity ${duration.normal}s ease-out, box-shadow ${duration.normal}s ease-out, border-color ${duration.normal}s ease-out`,
        pointerEvents: "none",
        zIndex: 999,
      }}
    />
  );
}
