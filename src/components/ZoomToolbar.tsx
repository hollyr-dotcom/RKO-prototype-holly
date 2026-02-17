"use client";

import { Editor } from "tldraw";
import { useState, useEffect, useCallback } from "react";
import {
  IconMinus,
  IconPlus,
  IconArrowsOutSimple,
} from "@mirohq/design-system-icons";

interface ZoomToolbarProps {
  editor: Editor | null;
}

export function ZoomToolbar({ editor }: ZoomToolbarProps) {
  const [zoomLevel, setZoomLevel] = useState(1);

  // Subscribe to camera changes to keep zoom level reactive
  useEffect(() => {
    if (!editor) return;

    setZoomLevel(editor.getZoomLevel());

    const unsub = editor.store.listen(
      () => {
        setZoomLevel(editor.getZoomLevel());
      },
      { source: "all", scope: "session" }
    );

    return unsub;
  }, [editor]);

  const handleZoomIn = useCallback(() => {
    if (!editor) return;
    editor.zoomIn(editor.getViewportScreenCenter(), {
      animation: { duration: 200 },
    });
  }, [editor]);

  const handleZoomOut = useCallback(() => {
    if (!editor) return;
    editor.zoomOut(editor.getViewportScreenCenter(), {
      animation: { duration: 200 },
    });
  }, [editor]);

  const handleResetZoom = useCallback(() => {
    if (!editor) return;
    editor.resetZoom(editor.getViewportScreenCenter(), {
      animation: { duration: 200 },
    });
  }, [editor]);

  const handleZoomToFit = useCallback(() => {
    if (!editor) return;
    editor.zoomToFit({ animation: { duration: 200 } });
  }, [editor]);

  const zoomPercent = Math.round(zoomLevel * 100);

  return (
    <div className="absolute bottom-6 right-6 z-[70]" onWheel={(e) => e.stopPropagation()}>
      <div
        className="flex items-center bg-white rounded-full border border-gray-200 p-1.5"
        style={{
          boxShadow:
            "0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)",
        }}
      >
        {/* Zoom out */}
        <button
          onClick={handleZoomOut}
          title="Zoom out"
          className="p-2 rounded-full transition-all duration-200 text-black flex items-center justify-center hover:bg-gray-100"
        >
          <IconMinus css={{ width: 16, height: 16 }} />
        </button>

        {/* Zoom percentage - click to reset to 100% */}
        <button
          onClick={handleResetZoom}
          title="Reset zoom to 100%"
          className="px-1 py-1 rounded-full transition-all duration-200 text-gray-600 hover:bg-gray-100 hover:text-black text-sm font-medium min-w-[40px] text-center"
        >
          {zoomPercent}%
        </button>

        {/* Zoom in */}
        <button
          onClick={handleZoomIn}
          title="Zoom in"
          className="p-2 rounded-full transition-all duration-200 text-black flex items-center justify-center hover:bg-gray-100"
        >
          <IconPlus css={{ width: 16, height: 16 }} />
        </button>

        {/* Separator */}
        <div className="w-px bg-gray-200 mx-1 self-stretch my-1" />

        {/* Zoom to fit */}
        <button
          onClick={handleZoomToFit}
          title="Zoom to fit"
          className="p-2 rounded-full transition-all duration-200 text-black flex items-center justify-center hover:bg-gray-100"
        >
          <IconArrowsOutSimple css={{ width: 16, height: 16 }} />
        </button>
      </div>
    </div>
  );
}
