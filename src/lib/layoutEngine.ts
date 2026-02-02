import type { Editor } from "tldraw";
import {
  LayoutType,
  LayoutItem,
  LayoutOptions,
  LayoutResult,
  Position,
  Arrow,
  SPACING,
  ITEM_SIZES,
} from "@/types/layout";

/**
 * Find empty space on the canvas for new content.
 * Scans existing shapes and finds a position that doesn't overlap.
 */
export function findEmptyCanvasSpace(
  editor: Editor,
  width: number,
  height: number
): { x: number; y: number } {
  const shapes = editor.getCurrentPageShapes();

  if (shapes.length === 0) {
    // Empty canvas - start at origin
    return { x: 0, y: 0 };
  }

  // Find bounding box of all existing content
  let maxX = -Infinity;
  let maxY = -Infinity;
  let minY = Infinity;

  shapes.forEach((shape) => {
    const bounds = editor.getShapeGeometry(shape.id).bounds;
    maxX = Math.max(maxX, shape.x + bounds.width);
    maxY = Math.max(maxY, shape.y + bounds.height);
    minY = Math.min(minY, shape.y);
  });

  // Place to the right of existing content, aligned with top
  return {
    x: maxX + 100,
    y: Math.max(0, minY),
  };
}

/**
 * Calculate grid layout positions.
 * Arranges items in rows and columns within a frame.
 */
export function calculateGridLayout(
  items: LayoutItem[],
  options?: LayoutOptions
): LayoutResult {
  const columns = options?.columns ?? 3;
  const spacingKey = options?.spacing ?? "normal";
  const spacing = SPACING[spacingKey];

  // Calculate item dimensions (use sticky size as default)
  const itemWidth = ITEM_SIZES.sticky.width;
  const itemHeight = ITEM_SIZES.sticky.height;

  // Calculate grid dimensions
  const rows = Math.ceil(items.length / columns);
  const actualColumns = Math.min(columns, items.length);

  // Calculate frame size
  const frameWidth =
    spacing.padding * 2 + actualColumns * itemWidth + (actualColumns - 1) * spacing.itemGap;
  const frameHeight =
    spacing.padding + 40 + rows * itemHeight + (rows - 1) * spacing.itemGap + spacing.padding;

  // Calculate positions for each item
  const itemPositions: Array<{ item: LayoutItem; position: Position }> = [];

  items.forEach((item, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    const x = spacing.padding + col * (itemWidth + spacing.itemGap);
    const y = spacing.padding + 40 + row * (itemHeight + spacing.itemGap); // 40px for frame label

    const size = ITEM_SIZES[item.type] || ITEM_SIZES.sticky;

    itemPositions.push({
      item,
      position: {
        x,
        y,
        width: size.width,
        height: size.height,
      },
    });
  });

  return {
    frame: {
      x: 0, // Will be set by findEmptyCanvasSpace
      y: 0,
      width: frameWidth,
      height: frameHeight,
      name: "", // Will be set by caller
    },
    items: itemPositions,
    arrows: [],
  };
}

/**
 * Calculate hierarchy layout positions.
 * Arranges items in a tree structure with parent-child relationships.
 */
export function calculateHierarchyLayout(
  items: LayoutItem[],
  options?: LayoutOptions
): LayoutResult {
  const direction = options?.direction ?? "down";
  const spacingKey = options?.spacing ?? "normal";
  const spacing = SPACING[spacingKey];

  // Use shape size for hierarchy items
  const itemWidth = ITEM_SIZES.shape.width;
  const itemHeight = ITEM_SIZES.shape.height;

  // Build tree structure from parentIndex
  interface TreeNode {
    item: LayoutItem;
    index: number;
    children: TreeNode[];
    level: number;
    x: number;
    y: number;
  }

  // Create nodes
  const nodes: TreeNode[] = items.map((item, index) => ({
    item,
    index,
    children: [],
    level: 0,
    x: 0,
    y: 0,
  }));

  // Build tree relationships
  const roots: TreeNode[] = [];
  nodes.forEach((node) => {
    const parentIndex = node.item.parentIndex;
    if (parentIndex !== undefined && parentIndex >= 0 && parentIndex < nodes.length) {
      nodes[parentIndex].children.push(node);
    } else {
      roots.push(node);
    }
  });

  // If no explicit tree structure, treat as flat list (first item is root, rest are children)
  if (roots.length === items.length && items.length > 1) {
    roots.length = 0;
    roots.push(nodes[0]);
    for (let i = 1; i < nodes.length; i++) {
      nodes[0].children.push(nodes[i]);
    }
  }

  // Calculate levels
  function setLevels(node: TreeNode, level: number) {
    node.level = level;
    node.children.forEach((child) => setLevels(child, level + 1));
  }
  roots.forEach((root) => setLevels(root, 0));

  // Group nodes by level
  const levels: TreeNode[][] = [];
  nodes.forEach((node) => {
    if (!levels[node.level]) levels[node.level] = [];
    levels[node.level].push(node);
  });

  // Calculate positions based on direction
  const isVertical = direction === "down";
  const levelSpacing = spacing.levelGap;
  const siblingSpacing = itemWidth + spacing.itemGap;

  // Calculate width needed for each level
  let maxLevelWidth = 0;
  levels.forEach((level) => {
    const levelWidth = level.length * siblingSpacing - spacing.itemGap;
    maxLevelWidth = Math.max(maxLevelWidth, levelWidth);
  });

  // Position nodes
  levels.forEach((level, levelIndex) => {
    const levelWidth = level.length * siblingSpacing - spacing.itemGap;
    const startX = (maxLevelWidth - levelWidth) / 2;

    level.forEach((node, nodeIndex) => {
      if (isVertical) {
        node.x = spacing.padding + startX + nodeIndex * siblingSpacing;
        node.y = spacing.padding + 40 + levelIndex * levelSpacing;
      } else {
        node.x = spacing.padding + levelIndex * levelSpacing;
        node.y = spacing.padding + 40 + startX + nodeIndex * siblingSpacing;
      }
    });
  });

  // Create arrows from parents to children
  const arrows: Arrow[] = [];
  nodes.forEach((node) => {
    node.children.forEach((child) => {
      if (isVertical) {
        arrows.push({
          startX: node.x + itemWidth / 2,
          startY: node.y + itemHeight,
          endX: child.x + itemWidth / 2,
          endY: child.y,
        });
      } else {
        arrows.push({
          startX: node.x + itemWidth,
          startY: node.y + itemHeight / 2,
          endX: child.x,
          endY: child.y + itemHeight / 2,
        });
      }
    });
  });

  // Build item positions
  const itemPositions: Array<{ item: LayoutItem; position: Position }> = nodes.map((node) => ({
    item: node.item,
    position: {
      x: node.x,
      y: node.y,
      width: itemWidth,
      height: itemHeight,
    },
  }));

  // Calculate frame size
  const frameWidth = maxLevelWidth + spacing.padding * 2;
  const frameHeight =
    spacing.padding + 40 + levels.length * levelSpacing - (levelSpacing - itemHeight) + spacing.padding;

  return {
    frame: {
      x: 0,
      y: 0,
      width: Math.max(frameWidth, 300),
      height: Math.max(frameHeight, 200),
      name: "",
    },
    items: itemPositions,
    arrows,
  };
}

/**
 * Calculate flow layout positions.
 * Arranges items in a left-to-right sequence with arrows.
 */
export function calculateFlowLayout(
  items: LayoutItem[],
  options?: LayoutOptions
): LayoutResult {
  const spacingKey = options?.spacing ?? "normal";
  const spacing = SPACING[spacingKey];

  // Use shape size for flow items
  const itemWidth = ITEM_SIZES.shape.width;
  const itemHeight = ITEM_SIZES.shape.height;

  // Horizontal spacing between items (includes arrow space)
  const horizontalGap = spacing.itemGap + 50; // Extra space for arrows

  // Calculate positions (single row for now)
  const itemPositions: Array<{ item: LayoutItem; position: Position }> = [];
  const arrows: Arrow[] = [];

  items.forEach((item, index) => {
    const x = spacing.padding + index * (itemWidth + horizontalGap);
    const y = spacing.padding + 40;

    itemPositions.push({
      item,
      position: {
        x,
        y,
        width: itemWidth,
        height: itemHeight,
      },
    });

    // Add arrow to next item (except for last)
    if (index < items.length - 1) {
      arrows.push({
        startX: x + itemWidth,
        startY: y + itemHeight / 2,
        endX: x + itemWidth + horizontalGap,
        endY: y + itemHeight / 2,
      });
    }
  });

  // Calculate frame size
  const frameWidth =
    spacing.padding * 2 + items.length * itemWidth + (items.length - 1) * horizontalGap;
  const frameHeight = spacing.padding * 2 + 40 + itemHeight;

  return {
    frame: {
      x: 0,
      y: 0,
      width: frameWidth,
      height: Math.max(frameHeight, 200),
      name: "",
    },
    items: itemPositions,
    arrows,
  };
}

/**
 * Main entry point - calculate layout based on type.
 */
export function calculateLayout(
  type: LayoutType,
  items: LayoutItem[],
  options?: LayoutOptions
): LayoutResult {
  switch (type) {
    case "grid":
      return calculateGridLayout(items, options);
    case "hierarchy":
      return calculateHierarchyLayout(items, options);
    case "flow":
      return calculateFlowLayout(items, options);
    default:
      return calculateGridLayout(items, options);
  }
}
