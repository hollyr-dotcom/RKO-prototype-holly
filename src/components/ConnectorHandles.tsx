"use client";

import { useEditor, useValue, createShapeId, createBindingId, TLShapeId } from "tldraw";
import { useRef, useCallback, useState } from "react";
import { ConnectorPulse } from "./ConnectorPulse";

// Shape types that should not show connector handles
const NON_BINDABLE_TYPES = new Set(["comment", "approve-button"]);

interface DragState {
  sourceId: TLShapeId;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

/** OnTheCanvas component — renders connector handles + pulse overlay */
export function ConnectorHandles() {
  return (
    <>
      <ConnectorPulse />
      <DiamondHandles />
    </>
  );
}

/** Diamond drag handles for creating connections between shapes */
function DiamondHandles() {
  const editor = useEditor();
  const dragRef = useRef<DragState | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [hoveredTargetId, setHoveredTargetId] = useState<TLShapeId | null>(null);

  // Reactively read selection and editing state from the editor
  const selectedIds = useValue("selectedIds", () => editor.getSelectedShapeIds(), [editor]);
  const editingId = useValue("editingId", () => editor.getEditingShapeId(), [editor]);
  const zoom = useValue("zoom", () => editor.getZoomLevel(), [editor]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent, shapeId: TLShapeId, bounds: { maxX: number; minY: number }) => {
      e.stopPropagation();
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY });
      const state: DragState = {
        sourceId: shapeId,
        startX: bounds.maxX,
        startY: bounds.minY,
        currentX: pagePoint.x,
        currentY: pagePoint.y,
      };
      dragRef.current = state;
      setDragState(state);
    },
    [editor]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      e.stopPropagation();

      const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY });
      const updated = { ...dragRef.current, currentX: pagePoint.x, currentY: pagePoint.y };
      dragRef.current = updated;
      setDragState(updated);

      // Check for target shape under cursor
      const hitShape = editor.getShapeAtPoint(pagePoint, { hitInside: true, margin: 8 });
      if (hitShape && hitShape.id !== dragRef.current.sourceId && !NON_BINDABLE_TYPES.has(hitShape.type)) {
        setHoveredTargetId(hitShape.id);
      } else {
        setHoveredTargetId(null);
      }
    },
    [editor]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      e.stopPropagation();
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);

      const { sourceId, startX, startY } = dragRef.current;
      const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY });

      // Find target shape
      const hitShape = editor.getShapeAtPoint(pagePoint, { hitInside: true, margin: 8 });

      if (hitShape && hitShape.id !== sourceId && !NON_BINDABLE_TYPES.has(hitShape.type)) {
        const targetBounds = editor.getShapePageBounds(hitShape.id);
        if (targetBounds) {
          const endX = targetBounds.midX;
          const endY = targetBounds.midY;

          editor.markHistoryStoppingPoint("connector");

          const arrowId = createShapeId();
          editor.createShape({
            id: arrowId,
            type: "arrow",
            x: startX,
            y: startY,
            props: {
              kind: "arc",
              color: "violet",
              arrowheadStart: "none",
              arrowheadEnd: "none",
              bend: 30,
              start: { x: 0, y: 0 },
              end: { x: endX - startX, y: endY - startY },
            },
            meta: { createdBy: "user-connector" },
          });

          // Bind start terminal to source shape
          editor.createBinding({
            id: createBindingId(),
            type: "arrow",
            fromId: arrowId,
            toId: sourceId,
            props: {
              terminal: "start",
              normalizedAnchor: { x: 0.5, y: 0.5 },
              isExact: false,
              isPrecise: false,
              snap: "none",
            },
          });

          // Bind end terminal to target shape
          editor.createBinding({
            id: createBindingId(),
            type: "arrow",
            fromId: arrowId,
            toId: hitShape.id,
            props: {
              terminal: "end",
              normalizedAnchor: { x: 0.5, y: 0.5 },
              isExact: false,
              isPrecise: false,
              snap: "none",
            },
          });
        }
      }

      dragRef.current = null;
      setDragState(null);
      setHoveredTargetId(null);
    },
    [editor]
  );

  // Don't show handles when editing a shape
  if (editingId) return null;

  // Collect diamond handles for each selected shape
  const handles: Array<{ id: TLShapeId; x: number; y: number }> = [];
  for (const id of selectedIds) {
    const shape = editor.getShape(id);
    if (!shape || NON_BINDABLE_TYPES.has(shape.type)) continue;
    const bounds = editor.getShapePageBounds(id);
    if (!bounds) continue;
    // Offset right of the top-right corner to avoid overlapping resize handles
    const offset = 16 / zoom;
    handles.push({ id, x: bounds.maxX + offset, y: bounds.minY });
  }

  if (handles.length === 0 && !dragState) return null;

  // Diamond size scales inversely with zoom for consistent screen size
  const diamondSize = 12 / zoom;
  const strokeWidth = 1.5 / zoom;

  return (
    <>
      {/* Diamond handles */}
      {handles.map(({ id, x, y }) => (
        <div
          key={`handle-${id}`}
          onPointerDown={(e) => handlePointerDown(e, id, { maxX: x, minY: y })}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          style={{
            position: "absolute",
            left: x - diamondSize / 2,
            top: y - diamondSize / 2,
            width: diamondSize,
            height: diamondSize,
            cursor: "crosshair",
            zIndex: 999,
            pointerEvents: "all",
          }}
        >
          <svg
            width={diamondSize}
            height={diamondSize}
            viewBox="0 0 12 12"
            style={{ overflow: "visible" }}
          >
            <rect
              x="1"
              y="1"
              width="10"
              height="10"
              rx="1.5"
              transform="rotate(45 6 6)"
              fill="#B8ACFB"
              stroke="#7C3AED"
              strokeWidth={(strokeWidth / diamondSize) * 12}
            />
          </svg>
        </div>
      ))}

      {/* Target highlight */}
      {hoveredTargetId && dragState && (() => {
        const targetBounds = editor.getShapePageBounds(hoveredTargetId);
        if (!targetBounds) return null;
        const pad = 4 / zoom;
        return (
          <div
            key="target-highlight"
            style={{
              position: "absolute",
              left: targetBounds.minX - pad,
              top: targetBounds.minY - pad,
              width: targetBounds.width + pad * 2,
              height: targetBounds.height + pad * 2,
              border: `${2 / zoom}px solid #B8ACFB`,
              borderRadius: 8 / zoom,
              boxShadow: `0 0 ${8 / zoom}px rgba(124, 58, 237, 0.3)`,
              pointerEvents: "none",
              zIndex: 998,
            }}
          />
        );
      })()}

      {/* Preview curve during drag */}
      {dragState && (() => {
        const { startX, startY, currentX, currentY } = dragState;
        const dx = currentX - startX;
        const dy = currentY - startY;
        // Horizontal offset for S-curve control points
        const cpOffset = Math.max(Math.abs(dx), Math.abs(dy)) * 0.4;
        const cp1x = startX + cpOffset;
        const cp1y = startY;
        const cp2x = currentX - cpOffset;
        const cp2y = currentY;

        // Compute bounding box for the SVG with padding
        const allX = [startX, cp1x, cp2x, currentX];
        const allY = [startY, cp1y, cp2y, currentY];
        const minX = Math.min(...allX) - 20 / zoom;
        const minY = Math.min(...allY) - 20 / zoom;
        const maxX = Math.max(...allX) + 20 / zoom;
        const maxY = Math.max(...allY) + 20 / zoom;

        return (
          <svg
            key="preview-curve"
            style={{
              position: "absolute",
              left: minX,
              top: minY,
              width: maxX - minX,
              height: maxY - minY,
              pointerEvents: "none",
              overflow: "visible",
              zIndex: 997,
            }}
          >
            <path
              d={`M ${startX - minX} ${startY - minY} C ${cp1x - minX} ${cp1y - minY}, ${cp2x - minX} ${cp2y - minY}, ${currentX - minX} ${currentY - minY}`}
              fill="none"
              stroke="#B8ACFB"
              strokeWidth={2 / zoom}
              strokeDasharray={`${6 / zoom} ${4 / zoom}`}
            />
          </svg>
        );
      })()}
    </>
  );
}
