"use client";

import {
  Geometry2d,
  RecordProps,
  Rectangle2d,
  ShapeUtil,
  T,
  TLShape,
  TLShapeId,
  Editor,
  createShapePropsMigrationSequence,
  createShapePropsMigrationIds,
} from "tldraw";

export const CONNECTOR_LINE_SHAPE_TYPE = "connector-line" as const;

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    [CONNECTOR_LINE_SHAPE_TYPE]: {
      w: number;
      h: number;
      /** SVG path data for the cubic bezier (coordinates relative to shape origin) */
      path: string;
      /** tldraw shape ID of the source shape */
      fromId: string;
      /** tldraw shape ID of the target shape */
      toId: string;
    };
  }
}

type IConnectorLineShape = TLShape<typeof CONNECTOR_LINE_SHAPE_TYPE>;

const CONNECTOR_COLOR = "#7C3AED"; // purple-600

/**
 * Given two shape bounds, compute a cubic bezier path that exits/enters at
 * the nearest edge midpoints with 90° tangents.
 *
 * Returns `null` if either shape is missing, otherwise returns the
 * shape x/y, w/h, and SVG path string.
 */
export function computeConnectorPath(
  editor: Editor,
  fromId: string,
  toId: string
): { x: number; y: number; w: number; h: number; path: string } | null {
  const sourceBounds = editor.getShapePageBounds(fromId as TLShapeId);
  const targetBounds = editor.getShapePageBounds(toId as TLShapeId);
  if (!sourceBounds || !targetBounds) return null;

  const dx = targetBounds.midX - sourceBounds.midX;
  const dy = targetBounds.midY - sourceBounds.midY;

  let startX: number, startY: number, startNx: number, startNy: number;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      startX = sourceBounds.maxX; startY = sourceBounds.midY; startNx = 1; startNy = 0;
    } else {
      startX = sourceBounds.minX; startY = sourceBounds.midY; startNx = -1; startNy = 0;
    }
  } else {
    if (dy > 0) {
      startX = sourceBounds.midX; startY = sourceBounds.maxY; startNx = 0; startNy = 1;
    } else {
      startX = sourceBounds.midX; startY = sourceBounds.minY; startNx = 0; startNy = -1;
    }
  }

  let endX: number, endY: number, endNx: number, endNy: number;
  if (Math.abs(dx) > Math.abs(dy)) {
    if (dx > 0) {
      endX = targetBounds.minX; endY = targetBounds.midY; endNx = -1; endNy = 0;
    } else {
      endX = targetBounds.maxX; endY = targetBounds.midY; endNx = 1; endNy = 0;
    }
  } else {
    if (dy > 0) {
      endX = targetBounds.midX; endY = targetBounds.minY; endNx = 0; endNy = -1;
    } else {
      endX = targetBounds.midX; endY = targetBounds.maxY; endNx = 0; endNy = 1;
    }
  }

  const dist = Math.sqrt((endX - startX) ** 2 + (endY - startY) ** 2);
  const cpOffset = Math.max(60, dist * 0.4);

  const cp1x = startX + startNx * cpOffset;
  const cp1y = startY + startNy * cpOffset;
  const cp2x = endX + endNx * cpOffset;
  const cp2y = endY + endNy * cpOffset;

  const PAD = 8;
  const allX = [startX, cp1x, cp2x, endX];
  const allY = [startY, cp1y, cp2y, endY];
  const minX = Math.min(...allX) - PAD;
  const minY = Math.min(...allY) - PAD;
  const maxX = Math.max(...allX) + PAD;
  const maxY = Math.max(...allY) + PAD;
  const w = maxX - minX;
  const h = maxY - minY;

  const lx = (v: number) => v - minX;
  const ly = (v: number) => v - minY;
  const path = `M ${lx(startX)} ${ly(startY)} C ${lx(cp1x)} ${ly(cp1y)}, ${lx(cp2x)} ${ly(cp2y)}, ${lx(endX)} ${ly(endY)}`;

  return { x: minX, y: minY, w, h, path };
}

// ── Migration: add fromId/toId props to existing connector-line shapes ──

const connectorVersions = createShapePropsMigrationIds(CONNECTOR_LINE_SHAPE_TYPE, {
  AddFromToIds: 1,
});

const connectorMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: connectorVersions.AddFromToIds,
      up(props: Record<string, unknown>) {
        props.fromId = props.fromId ?? "";
        props.toId = props.toId ?? "";
      },
    },
  ],
});

export class ConnectorLineShapeUtil extends ShapeUtil<IConnectorLineShape> {
  static override type = CONNECTOR_LINE_SHAPE_TYPE;
  static override migrations = connectorMigrations;
  static override props: RecordProps<IConnectorLineShape> = {
    w: T.number,
    h: T.number,
    path: T.string,
    fromId: T.string,
    toId: T.string,
  };

  getDefaultProps(): IConnectorLineShape["props"] {
    return { w: 100, h: 100, path: "", fromId: "", toId: "" };
  }

  override canEdit() { return false; }
  override canResize() { return false; }
  override canBind() { return false; }
  override hideSelectionBoundsBg() { return true; }
  override hideSelectionBoundsFg() { return true; }

  getGeometry(shape: IConnectorLineShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: false,
    });
  }

  component(shape: IConnectorLineShape) {
    const { w, h, path } = shape.props;

    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        style={{ overflow: "visible", pointerEvents: "none" }}
      >
        {/* Subtle glow underneath */}
        <path
          d={path}
          fill="none"
          stroke={CONNECTOR_COLOR}
          strokeWidth={4}
          strokeOpacity={0.15}
          strokeLinecap="round"
        />
        {/* Main stroke */}
        <path
          d={path}
          fill="none"
          stroke={CONNECTOR_COLOR}
          strokeWidth={1.5}
          strokeLinecap="round"
        />
      </svg>
    );
  }

  indicator(shape: IConnectorLineShape) {
    return (
      <path
        d={shape.props.path}
        fill="none"
        stroke="currentColor"
        strokeWidth={1.5}
      />
    );
  }
}
