"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, type Variants } from "framer-motion";
import { IconArrowsInSimple } from "@mirohq/design-system-icons";
import { DataTableEditor } from "./DataTableEditor";
import { TaskCardFocusPanel } from "@/shapes/TaskCardPanel";
import { GanttChartFocusPanel } from "@/shapes/GanttChartFocusPanel";
import { KanbanBoardFocusPanel } from "@/shapes/KanbanBoardFocusPanel";
import { setPortalTarget } from "@/lib/focusModeStore";
import type { Editor } from "tldraw";

export interface FocusedShape {
  shapeType: "document" | "datatable" | "taskcard" | "ganttchart" | "kanbanboard";
  docId?: string;
  tableId?: string;
  taskId?: string;
  ganttId?: string;
  kanbanId?: string;
  title: string;
}

interface FocusModeOverlayProps {
  shape: FocusedShape;
  onClose: () => void;
  editor: Editor | null;
}

const contentVariants: Variants = {
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

const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

const floatingCardVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95, y: 20 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: "spring", stiffness: 400, damping: 30 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: 10,
    transition: { type: "tween", ease: [0.3, 0, 1, 1], duration: 0.2 },
  },
};

export function FocusModeOverlay({ shape, onClose, editor }: FocusModeOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });
  const isGanttChart = shape.shapeType === "ganttchart";
  const isKanbanBoard = shape.shapeType === "kanbanboard";
  const isTaskCard = shape.shapeType === "taskcard";

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

  // Gantt charts: full-screen overlay (like documents/tables)
  if (isGanttChart) {
    return (
      <motion.div
        className="absolute inset-0 z-[500] bg-white flex flex-col overflow-hidden"
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
        {/* Close button */}
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
            border: "1px solid var(--color-gray-200)",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            padding: 0,
          }}
        >
          <IconArrowsInSimple css={{ width: 14, height: 14, color: "var(--color-gray-500)" }} />
        </button>

        {/* Gantt chart container */}
        <div style={{ flex: 1, overflow: "hidden" }}>
          {shape.ganttId && editor && (
            <GanttChartFocusPanel
              shapeId={shape.ganttId}
              editor={editor}
            />
          )}
        </div>
      </motion.div>
    );
  }

  // Kanban boards: full-screen overlay (like gantt charts)
  if (isKanbanBoard) {
    return (
      <motion.div
        className="absolute inset-0 z-[500] bg-white flex flex-col overflow-hidden"
        variants={contentVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
      >
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
            border: "1px solid var(--color-gray-200)",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            padding: 0,
          }}
        >
          <IconArrowsInSimple css={{ width: 14, height: 14, color: "var(--color-gray-500)" }} />
        </button>
        <div style={{ flex: 1, overflow: "hidden" }}>
          {shape.kanbanId && editor && (
            <KanbanBoardFocusPanel
              shapeId={shape.kanbanId}
              editor={editor}
            />
          )}
        </div>
      </motion.div>
    );
  }

  // Task cards: floating card with backdrop
  if (isTaskCard) {
    return (
      <>
        {/* Dim backdrop — click to close */}
        <motion.div
          className="absolute inset-0 z-[500]"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        />
        {/* Floating card — centered via flexbox */}
        <motion.div
          className="absolute inset-0 z-[501] flex items-center justify-center pointer-events-none"
          variants={floatingCardVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="pointer-events-auto"
            style={{
              width: 480,
              maxHeight: "80vh",
              background: "#ffffff",
              borderRadius: 16,
              boxShadow: "0 16px 48px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.08)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              position: "relative",
            }}
          >
            {/* Close button */}
            <button
              onClick={onClose}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                zIndex: 510,
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "1px solid var(--color-gray-200)",
                background: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
                padding: 0,
              }}
            >
              <IconArrowsInSimple css={{ width: 14, height: 14, color: "var(--color-gray-500)" }} />
            </button>
            <div style={{ flex: 1, overflowY: "auto" }}>
              {shape.taskId && editor && (
                <TaskCardFocusPanel
                  shapeId={shape.taskId}
                  editor={editor}
                />
              )}
            </div>
          </div>
        </motion.div>
      </>
    );
  }

  // Documents + tables: full-screen overlay
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
          border: "1px solid var(--color-gray-200)",
          background: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
          padding: 0,
        }}
      >
        <IconArrowsInSimple css={{ width: 14, height: 14, color: "var(--color-gray-500)" }} />
      </button>

      {/* Editor container */}
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
