// Layout Engine Types

export type LayoutType = "grid" | "hierarchy" | "flow" | "timeline";

export type ItemType = "sticky" | "shape" | "text";

export interface LayoutItem {
  type: ItemType;
  text: string;
  color?: string;
  // For hierarchy: specify parent index to create tree structure
  parentIndex?: number;
  // For timeline: which time period column this item belongs to (0-based index into timeLabels)
  column?: number;
  // Pre-measured dimensions from tldraw's actual text measurement (pixel-perfect)
  measuredWidth?: number;
  measuredHeight?: number;
}

export interface LayoutOptions {
  // Grid options
  columns?: number; // default: 3

  // Hierarchy options
  direction?: "down" | "right"; // default: "down"

  // Timeline options
  timeLabels?: string[]; // e.g. ["Q1 2024", "Q2 2024", "Q3 2024"]

  // General options
  spacing?: "compact" | "normal" | "spacious"; // default: "normal"
}

export interface LayoutRequest {
  type: LayoutType;
  frameName: string;
  items: LayoutItem[];
  options?: LayoutOptions;
}

export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Arrow {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

// Visual decorations (labels, bars) — not interactive items
export type LayoutDecoration =
  | { type: "text"; text: string; x: number; y: number; width: number; height: number }
  | { type: "bar"; x: number; y: number; width: number; height: number }
  | { type: "dot"; x: number; y: number; radius: number };

export interface LayoutResult {
  frame: {
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
  };
  items: Array<{
    item: LayoutItem;
    position: Position;
  }>;
  arrows: Arrow[];
  decorations?: LayoutDecoration[];
}

// Spacing constants - generous to prevent overlaps
export const SPACING = {
  compact: {
    itemGap: 30,
    padding: 50,
    levelGap: 100,
  },
  normal: {
    itemGap: 40,
    padding: 60,
    levelGap: 120,
  },
  spacious: {
    itemGap: 60,
    padding: 80,
    levelGap: 160,
  },
} as const;

// Item size defaults - GENEROUS sizes to prevent overlaps
// tldraw stickies auto-size, so we estimate conservatively
export const ITEM_SIZES = {
  sticky: { width: 220, height: 200, minWidth: 220, minHeight: 200 },
  shape: { width: 180, height: 140, minWidth: 180, minHeight: 140 },
  text: { width: 180, height: 50, minWidth: 100, minHeight: 30 },
} as const;

// Helper to calculate dynamic width based on text
export function calculateTextWidth(text: string, type: ItemType): number {
  const sizes = ITEM_SIZES[type];

  // For shapes in grids, use consistent width for alignment
  if (type === "shape") {
    // Base width on longest word to avoid mid-word breaks
    const words = text.split(/\s+/);
    const longestWord = Math.max(...words.map(w => w.length));
    const minForWord = longestWord * 10 + 40; // 10px per char + padding
    return Math.max(sizes.minWidth, Math.min(minForWord, 200));
  }

  // Stickies use fixed width for consistent grids
  return sizes.width;
}

// Helper to calculate dynamic height based on text and width
export function calculateTextHeight(text: string, width: number, type: ItemType): number {
  const sizes = ITEM_SIZES[type];
  const lineHeight = type === "sticky" ? 24 : 22;
  const padding = type === "sticky" ? 60 : 50;
  // tldraw handwriting font is wider than monospace — ~11px per char for shapes
  const charWidth = type === "sticky" ? 9 : 11;

  // Estimate characters per line (conservative)
  const effectiveWidth = width - padding;
  const charsPerLine = Math.floor(effectiveWidth / charWidth);
  const lines = Math.ceil(text.length / Math.max(charsPerLine, 8));

  // Calculate height with 50% buffer to ensure arrows reach actual bottom
  const calculatedHeight = (lines * lineHeight + padding) * 1.5;

  return Math.max(sizes.minHeight, calculatedHeight);
}
