"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { IconArrowsInSimple } from "@mirohq/design-system-icons";
import { DataTableEditor } from "./DataTableEditor";
import { setPortalTarget } from "@/lib/focusModeStore";

export interface FocusedShape {
  shapeType: "document" | "datatable";
  docId?: string;
  tableId?: string;
  title: string;
}

interface FocusModeOverlayProps {
  shape: FocusedShape;
  onClose: () => void;
}

const contentVariants = {
  hidden: { opacity: 0, scale: 0.98 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: { type: "tween", ease: [0.3, 0, 1, 1], duration: 0.2 },
  },
};

export function FocusModeOverlay({ shape, onClose }: FocusModeOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  // Measure container (used by DataTableEditor)
  useEffect(() => {
    if (!containerRef.current) return;
    const measure = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      setSize({ w: rect.width, h: rect.height });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // For documents: register this container as the portal target.
  // The on-canvas DocumentEditor will portal its content here.
  useEffect(() => {
    if (shape.shapeType === "document" && containerRef.current) {
      setPortalTarget(containerRef.current);
    }
    return () => {
      if (shape.shapeType === "document") {
        setPortalTarget(null);
      }
    };
  }, [shape.shapeType]);

  // Escape key closes
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [handleKeyDown]);

  return (
    <motion.div
      className="absolute inset-0 z-[500] bg-white flex flex-col overflow-hidden"
      variants={contentVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* Collapse button */}
      <button
        onClick={onClose}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          top: 7,
          right: 8,
          zIndex: 510,
          width: 28,
          height: 28,
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          padding: 0,
        }}
      >
        <IconArrowsInSimple css={{ width: 14, height: 14, color: "#6b7280" }} />
      </button>

      {/* Editor container — fills entire space */}
      {/* Documents: content arrives via React portal from the on-canvas editor */}
      {/* Tables: rendered directly here (LiveMap handles dual connections fine) */}
      <div ref={containerRef} className="flex-1 overflow-hidden">
        {shape.shapeType === "datatable" && shape.tableId && (
          <DataTableEditor
            tableId={shape.tableId}
            title={shape.title}
            isEditing={true}
            tldrawEditor={undefined}
            w={size.w}
            h={size.h}
            onEscape={onClose}
          />
        )}
      </div>
    </motion.div>
  );
}
