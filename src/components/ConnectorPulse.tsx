"use client";

import { useEditor, useValue, getArrowInfo, TLShapeId } from "tldraw";

/**
 * Renders animated pulsing gradient overlays on user-created connector arrows.
 * Uses SVG stroke-dasharray + animated stroke-dashoffset to create a directional
 * pulse effect flowing from start → end of each connection.
 */

interface ConnectorPath {
  id: TLShapeId;
  d: string;
  ox: number;
  oy: number;
  length: number;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export function ConnectorPulse() {
  const editor = useEditor();

  // Re-render when shapes change
  const shapes = useValue("pageShapes", () => editor.getCurrentPageShapes(), [editor]);

  // Find all user-connector arrows and compute their SVG paths
  const connectors: ConnectorPath[] = [];

  for (const shape of shapes) {
    if (shape.type !== "arrow") continue;
    if ((shape.meta as Record<string, unknown>)?.createdBy !== "user-connector") continue;

    const info = getArrowInfo(editor, shape.id);
    if (!info || !info.isValid) continue;

    // Get shape position in page space
    const transform = editor.getShapePageTransform(shape.id);
    if (!transform) continue;
    const ox = transform.e;
    const oy = transform.f;

    let d: string;
    let pathLength: number;

    if (info.type === "arc") {
      const { bodyArc } = info;
      const startPt = info.start.point;
      const endPt = info.end.point;
      d = `M ${startPt.x} ${startPt.y} A ${bodyArc.radius} ${bodyArc.radius} 0 ${bodyArc.largeArcFlag} ${bodyArc.sweepFlag} ${endPt.x} ${endPt.y}`;
      pathLength = bodyArc.length;
    } else if (info.type === "straight") {
      const startPt = info.start.point;
      const endPt = info.end.point;
      d = `M ${startPt.x} ${startPt.y} L ${endPt.x} ${endPt.y}`;
      pathLength = info.length;
    } else {
      continue;
    }

    const startPt = info.start.point;
    const endPt = info.end.point;

    connectors.push({
      id: shape.id,
      d,
      ox,
      oy,
      length: pathLength,
      startX: startPt.x,
      startY: startPt.y,
      endX: endPt.x,
      endY: endPt.y,
    });
  }

  if (connectors.length === 0) return null;

  return (
    <>
      {/* Shared CSS keyframes for all pulse animations */}
      <style>{`
        @keyframes connector-pulse {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -200; }
        }
      `}</style>

      {connectors.map((conn) => {
        const gradId = `cpulse-${conn.id}`;
        // Gradient direction follows the connection direction (start → end)
        return (
          <svg
            key={`pulse-${conn.id}`}
            style={{
              position: "absolute",
              left: conn.ox,
              top: conn.oy,
              overflow: "visible",
              pointerEvents: "none",
              zIndex: 0,
            }}
            width="1"
            height="1"
          >
            <defs>
              <linearGradient
                id={gradId}
                gradientUnits="userSpaceOnUse"
                x1={conn.startX}
                y1={conn.startY}
                x2={conn.endX}
                y2={conn.endY}
              >
                <stop offset="0%" stopColor="#D4CCFB" stopOpacity="0.3" />
                <stop offset="50%" stopColor="#7C3AED" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#B8ACFB" stopOpacity="0.3" />
              </linearGradient>
            </defs>
            {/* Animated dash creates a pulse flowing along the path */}
            <path
              d={conn.d}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth={3}
              strokeLinecap="round"
              strokeDasharray="40 160"
              style={{
                animation: "connector-pulse 3s linear infinite",
              }}
            />
          </svg>
        );
      })}
    </>
  );
}
