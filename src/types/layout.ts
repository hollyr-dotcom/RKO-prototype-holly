// Layout Engine Types

export type LayoutType = "grid" | "hierarchy" | "flow";

export type ItemType = "sticky" | "shape" | "text";

export interface LayoutItem {
  type: ItemType;
  text: string;
  color?: string;
  // For hierarchy: specify parent index to create tree structure
  parentIndex?: number;
}

export interface LayoutOptions {
  // Grid options
  columns?: number; // default: 3

  // Hierarchy options
  direction?: "down" | "right"; // default: "down"

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
}

// Spacing constants
export const SPACING = {
  compact: {
    itemGap: 20,
    padding: 30,
    levelGap: 120,
  },
  normal: {
    itemGap: 30,
    padding: 40,
    levelGap: 150,
  },
  spacious: {
    itemGap: 50,
    padding: 60,
    levelGap: 200,
  },
} as const;

// Item size defaults
export const ITEM_SIZES = {
  sticky: { width: 200, height: 180 },
  shape: { width: 150, height: 80 },
  text: { width: 150, height: 40 },
} as const;
