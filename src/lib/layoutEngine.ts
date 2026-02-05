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
  calculateTextWidth,
  calculateTextHeight,
} from "@/types/layout";

/**
 * Find empty space on the canvas for new content.
 */
export function findEmptyCanvasSpace(
  editor: Editor,
  width: number,
  height: number
): { x: number; y: number } {
  const shapes = editor.getCurrentPageShapes();

  if (shapes.length === 0) {
    return { x: 100, y: 100 };
  }

  let maxX = -Infinity;
  let minY = Infinity;

  shapes.forEach((shape) => {
    const bounds = editor.getShapeGeometry(shape.id).bounds;
    maxX = Math.max(maxX, shape.x + bounds.width);
    minY = Math.min(minY, shape.y);
  });

  return {
    x: maxX + 80,
    y: Math.max(100, minY),
  };
}

/**
 * Calculate grid layout positions.
 * Calculates height based on actual text content to prevent overlaps.
 */
export function calculateGridLayout(
  items: LayoutItem[],
  options?: LayoutOptions
): LayoutResult {
  const columns = options?.columns ?? 3;
  const spacingKey = options?.spacing ?? "normal";
  const spacing = SPACING[spacingKey];

  // Calculate dimensions for each item based on text content
  const itemDimensions = items.map((item) => {
    const sizes = ITEM_SIZES[item.type];
    const width = sizes.width;
    // Calculate height based on text length for stickies
    const textLength = item.text.length;
    const estimatedLines = Math.ceil(textLength / 20); // ~20 chars per line
    const estimatedHeight = Math.max(sizes.height, estimatedLines * 24 + 60);
    return { width, height: estimatedHeight };
  });

  // Find the LARGEST dimensions needed for uniform grid
  const itemWidth = Math.max(...itemDimensions.map(d => d.width));
  const itemHeight = Math.max(...itemDimensions.map(d => d.height));

  const numRows = Math.ceil(items.length / columns);
  const actualColumns = Math.min(columns, items.length);

  // Calculate frame dimensions with generous bottom padding
  const frameWidth =
    spacing.padding * 2 + actualColumns * itemWidth + (actualColumns - 1) * spacing.itemGap;
  const frameHeight =
    spacing.padding * 2 + 60 + numRows * itemHeight + (numRows - 1) * spacing.itemGap + 80; // Extra bottom padding

  // Position each item in a simple grid
  const itemPositions: Array<{ item: LayoutItem; position: Position }> = [];

  items.forEach((item, index) => {
    const col = index % columns;
    const row = Math.floor(index / columns);

    const x = spacing.padding + col * (itemWidth + spacing.itemGap);
    const y = spacing.padding + 60 + row * (itemHeight + spacing.itemGap);

    itemPositions.push({
      item,
      position: {
        x,
        y,
        width: itemWidth,
        height: itemHeight,
      },
    });
  });

  return {
    frame: {
      x: 0,
      y: 0,
      width: Math.max(frameWidth, 400),
      height: Math.max(frameHeight, 300),
      name: "",
    },
    items: itemPositions,
    arrows: [],
  };
}

// Tree node for hierarchy layout
interface TreeNode {
  item: LayoutItem;
  index: number;
  children: TreeNode[];
  width: number;      // Width of this node's box
  height: number;     // Height of this node's box
  subtreeWidth: number;  // Total width needed for this subtree
  x: number;          // Final x position
  y: number;          // Final y position
}

/**
 * Calculate hierarchy layout using proper tree algorithm.
 * Children are positioned centered below their parent.
 */
export function calculateHierarchyLayout(
  items: LayoutItem[],
  options?: LayoutOptions
): LayoutResult {
  const direction = options?.direction ?? "down";
  const spacingKey = options?.spacing ?? "normal";
  const spacing = SPACING[spacingKey];

  const isVertical = direction === "down";

  // Create nodes with dynamic widths and heights
  const nodes: TreeNode[] = items.map((item, index) => {
    const width = calculateTextWidth(item.text, "shape");
    const height = calculateTextHeight(item.text, width, "shape");
    return {
      item,
      index,
      children: [],
      width,
      height,
      subtreeWidth: width,
      x: 0,
      y: 0,
    };
  });

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

  // If no explicit tree structure, make first item root and rest children
  if (roots.length === items.length && items.length > 1) {
    roots.length = 0;
    roots.push(nodes[0]);
    for (let i = 1; i < nodes.length; i++) {
      nodes[0].children.push(nodes[i]);
    }
  }

  // Calculate subtree widths (bottom-up)
  function calculateSubtreeWidth(node: TreeNode): number {
    if (node.children.length === 0) {
      node.subtreeWidth = node.width;
      return node.subtreeWidth;
    }

    const childrenTotalWidth = node.children.reduce((sum, child, i) => {
      const childWidth = calculateSubtreeWidth(child);
      // Add gap between siblings
      return sum + childWidth + (i > 0 ? spacing.itemGap : 0);
    }, 0);

    // Subtree width is max of node width and children's total width
    node.subtreeWidth = Math.max(node.width, childrenTotalWidth);
    return node.subtreeWidth;
  }

  // Position nodes (top-down)
  function positionNode(node: TreeNode, x: number, y: number, level: number) {
    if (isVertical) {
      // Center the node within its subtree space
      node.x = x + (node.subtreeWidth - node.width) / 2;
      node.y = y;

      // Position children below
      let childX = x;
      const childY = y + node.height + spacing.levelGap;

      node.children.forEach((child) => {
        positionNode(child, childX, childY, level + 1);
        childX += child.subtreeWidth + spacing.itemGap;
      });
    } else {
      // Horizontal layout
      node.x = x;
      node.y = y + (node.subtreeWidth - node.height) / 2;

      let childY = y;
      const childX = x + node.width + spacing.levelGap;

      node.children.forEach((child) => {
        positionNode(child, childX, childY, level + 1);
        childY += child.subtreeWidth + spacing.itemGap;
      });
    }
  }

  // Process all roots
  let totalWidth = 0;
  roots.forEach((root) => {
    calculateSubtreeWidth(root);
    totalWidth += root.subtreeWidth;
  });
  totalWidth += (roots.length - 1) * spacing.itemGap;

  // Position roots
  let currentX = spacing.padding;
  const startY = spacing.padding + 50; // Space for frame title

  roots.forEach((root) => {
    if (isVertical) {
      positionNode(root, currentX, startY, 0);
      currentX += root.subtreeWidth + spacing.itemGap;
    } else {
      positionNode(root, startY, currentX, 0);
      currentX += root.subtreeWidth + spacing.itemGap;
    }
  });

  // Calculate bounds from actual positions
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  nodes.forEach((node) => {
    minX = Math.min(minX, node.x);
    maxX = Math.max(maxX, node.x + node.width);
    minY = Math.min(minY, node.y);
    maxY = Math.max(maxY, node.y + node.height);
  });

  // Create arrows from parents to children
  const arrows: Arrow[] = [];
  nodes.forEach((node) => {
    node.children.forEach((child) => {
      if (isVertical) {
        // Arrow goes from bottom center of parent to top center of child
        arrows.push({
          startX: node.x + node.width / 2,
          startY: node.y + node.height,
          endX: child.x + child.width / 2,
          endY: child.y,
        });
      } else {
        // Arrow goes from right center of parent to left center of child
        arrows.push({
          startX: node.x + node.width,
          startY: node.y + node.height / 2,
          endX: child.x,
          endY: child.y + child.height / 2,
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
      width: node.width,
      height: node.height,
    },
  }));

  // Calculate frame size with proper padding on all sides
  const frameWidth = maxX - minX + spacing.padding * 2;
  const frameHeight = maxY - minY + spacing.padding * 2 + 60; // 60 for title area

  // Offset positions so they're relative to frame (adjust for minX/minY)
  const offsetX = spacing.padding - minX;
  const offsetY = spacing.padding + 60 - minY; // 60 for title area

  itemPositions.forEach((pos) => {
    pos.position.x += offsetX;
    pos.position.y += offsetY;
  });

  arrows.forEach((arrow) => {
    arrow.startX += offsetX;
    arrow.startY += offsetY;
    arrow.endX += offsetX;
    arrow.endY += offsetY;
  });

  return {
    frame: {
      x: 0,
      y: 0,
      width: Math.max(frameWidth, 400),
      height: Math.max(frameHeight, 250),
      name: "",
    },
    items: itemPositions,
    arrows,
  };
}

/**
 * Calculate flow layout positions.
 */
export function calculateFlowLayout(
  items: LayoutItem[],
  options?: LayoutOptions
): LayoutResult {
  const spacingKey = options?.spacing ?? "normal";
  const spacing = SPACING[spacingKey];

  const arrowSpace = 60; // Space for arrows between items

  // Calculate dimensions for each item (width first, then height based on text wrapping)
  const itemDimensions = items.map((item) => {
    const width = calculateTextWidth(item.text, "shape");
    const height = calculateTextHeight(item.text, width, "shape");
    return { width, height };
  });

  // Find max height for uniform row height
  const maxHeight = Math.max(...itemDimensions.map((d) => d.height));

  const itemPositions: Array<{ item: LayoutItem; position: Position }> = [];
  const arrows: Arrow[] = [];

  let currentX = spacing.padding;
  const y = spacing.padding + 60; // Space for frame title

  items.forEach((item, index) => {
    const { width } = itemDimensions[index];

    itemPositions.push({
      item,
      position: {
        x: currentX,
        y,
        width,
        height: maxHeight,
      },
    });

    // Add arrow to next item
    if (index < items.length - 1) {
      arrows.push({
        startX: currentX + width,
        startY: y + maxHeight / 2,
        endX: currentX + width + arrowSpace,
        endY: y + maxHeight / 2,
      });
    }

    currentX += width + arrowSpace;
  });

  const frameWidth = currentX - arrowSpace + spacing.padding;
  const frameHeight = spacing.padding * 2 + 60 + maxHeight;

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
