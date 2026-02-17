import type { Editor } from "tldraw";
import {
  LayoutType,
  LayoutItem,
  LayoutOptions,
  LayoutResult,
  LayoutDecoration,
  Position,
  Arrow,
  SPACING,
  ITEM_SIZES,
  calculateTextWidth,
  calculateTextHeight,
} from "@/types/layout";

/**
 * Find empty space on the canvas for new content.
 * Places frames side-by-side horizontally at the same Y level.
 */
export function findEmptyCanvasSpace(
  editor: Editor,
  width: number,
  height: number
): { x: number; y: number } {
  const shapes = editor.getCurrentPageShapes();

  if (shapes.length === 0) {
    console.log("[LAYOUT] No shapes, starting at (100, 100)");
    return { x: 100, y: 100 };
  }

  // Find all large standalone items (frames, documents, tables)
  const largeTypes = ["frame", "document", "datatable", "ganttchart"];
  const largeItems = shapes.filter(s => largeTypes.includes(s.type));

  if (largeItems.length === 0) {
    console.log("[LAYOUT] No large items found, starting at (100, 100)");
    return { x: 100, y: 100 };
  }

  // Find the rightmost edge and topmost Y across ALL large items for alignment
  let maxRight = -Infinity;
  let minY = Infinity;

  largeItems.forEach((shape) => {
    const bounds = editor.getShapeGeometry(shape.id).bounds;
    const shapeRight = shape.x + bounds.width;
    maxRight = Math.max(maxRight, shapeRight);
    minY = Math.min(minY, shape.y); // Use minimum Y to top-align
  });

  const result = {
    x: maxRight + 100, // 100px gap to the right of everything
    y: minY, // Align with topmost item
  };

  console.log(`[LAYOUT] Found ${largeItems.length} large items, placing next at`, result);
  return result;
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

  // Create nodes with dimensions — use pre-measured if available, otherwise estimate
  const nodes: TreeNode[] = items.map((item, index) => {
    const width = item.measuredWidth ?? calculateTextWidth(item.text, "shape");
    const height = item.measuredHeight ?? calculateTextHeight(item.text, width, "shape");
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

  // Calculate subtree span (bottom-up)
  // In vertical mode: span = horizontal width needed for subtree
  // In horizontal mode: span = vertical height needed for subtree
  function calculateSubtreeSpan(node: TreeNode): number {
    // The node's own span in the cross-axis direction
    const nodeSpan = isVertical ? node.width : node.height;

    if (node.children.length === 0) {
      node.subtreeWidth = nodeSpan;
      return node.subtreeWidth;
    }

    const childrenTotalSpan = node.children.reduce((sum, child, i) => {
      const childSpan = calculateSubtreeSpan(child);
      return sum + childSpan + (i > 0 ? spacing.itemGap : 0);
    }, 0);

    node.subtreeWidth = Math.max(nodeSpan, childrenTotalSpan);
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

  // Process all roots — use larger gap between root groups for visual separation
  const rootGap = spacing.itemGap * 2; // 2x sibling gap between root subtrees
  let totalWidth = 0;
  roots.forEach((root) => {
    calculateSubtreeSpan(root);
    totalWidth += root.subtreeWidth;
  });
  totalWidth += (roots.length - 1) * rootGap;

  // Position roots
  let currentX = spacing.padding;
  const startY = spacing.padding + 50; // Space for frame title

  roots.forEach((root) => {
    if (isVertical) {
      positionNode(root, currentX, startY, 0);
      currentX += root.subtreeWidth + rootGap;
    } else {
      positionNode(root, startY, currentX, 0);
      currentX += root.subtreeWidth + rootGap;
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
  const frameHeight = maxY - minY + spacing.padding * 2 + 60 + 100; // 60 for title, 100 extra bottom padding

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

  // Calculate dimensions — use pre-measured if available, otherwise estimate
  const itemDimensions = items.map((item) => {
    const width = item.measuredWidth ?? calculateTextWidth(item.text, "shape");
    const height = item.measuredHeight ?? calculateTextHeight(item.text, width, "shape");
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
 * Calculate timeline layout — VERTICAL. Time periods stack top-to-bottom,
 * with a vertical bar + dots on the left and items flowing to the right of each period.
 *
 *   ● Period 1
 *   │  ┌────┐ ┌────┐
 *   │  │    │ │    │
 *   │  └────┘ └────┘
 *   │
 *   ● Period 2
 *   │  ┌────┐
 *   │  │    │
 *   │  └────┘
 */
export function calculateTimelineLayout(
  items: LayoutItem[],
  options?: LayoutOptions
): LayoutResult {
  const spacingKey = options?.spacing ?? "normal";
  const spacing = SPACING[spacingKey];
  const timeLabels = options?.timeLabels ?? [];

  // Determine number of periods
  const numPeriods = Math.max(
    timeLabels.length,
    ...items.map((item) => (item.column ?? 0) + 1),
    1
  );

  // Fill in default labels
  const labels: string[] = [];
  for (let i = 0; i < numPeriods; i++) {
    labels.push(timeLabels[i] ?? `Phase ${i + 1}`);
  }

  // Group items by period
  const periods: LayoutItem[][] = Array.from({ length: numPeriods }, () => []);
  const hasColumnAssignment = items.some((item) => item.column !== undefined && item.column >= 0);

  if (hasColumnAssignment) {
    items.forEach((item) => {
      const col = Math.min(Math.max(item.column ?? 0, 0), numPeriods - 1);
      periods[col].push(item);
    });
  } else {
    items.forEach((item, i) => {
      periods[i % numPeriods].push(item);
    });
  }

  // Layout constants
  const titleArea = 60;
  const dotRadius = 8;
  const dotX = spacing.padding + 15;           // X center of vertical bar / dots
  const labelX = dotX + dotRadius + 20;         // Where label text starts
  const labelHeight = 35;
  const itemIndentX = labelX;                   // Items align with label
  const itemWidth = 200;
  const itemGapX = spacing.itemGap;             // Horizontal gap between items in same row
  const itemGapY = spacing.itemGap;             // Vertical gap between item rows
  const periodGap = spacing.levelGap;           // Vertical gap between periods
  const maxItemsPerRow = 3;
  const labelToItemGap = 12;                    // Gap between label and first item row

  const decorations: LayoutDecoration[] = [];
  const itemPositions: Array<{ item: LayoutItem; position: Position }> = [];
  const dotPositions: { x: number; y: number }[] = [];

  let currentY = spacing.padding + titleArea;

  labels.forEach((label, periodIndex) => {
    const periodItems = periods[periodIndex];

    // Dot center Y aligns with the middle of the label
    const dotCenterY = currentY + labelHeight / 2;
    dotPositions.push({ x: dotX, y: dotCenterY });

    // Dot decoration
    decorations.push({
      type: "dot",
      x: dotX,
      y: dotCenterY,
      radius: dotRadius,
    });

    // Label text
    decorations.push({
      type: "text",
      text: label,
      x: labelX,
      y: currentY,
      width: 350,
      height: labelHeight,
    });

    currentY += labelHeight + labelToItemGap;

    // Position items in rows (max maxItemsPerRow per row)
    if (periodItems.length > 0) {
      let itemIndex = 0;
      while (itemIndex < periodItems.length) {
        const rowItems = periodItems.slice(itemIndex, itemIndex + maxItemsPerRow);
        let maxRowHeight = 0;

        rowItems.forEach((item, i) => {
          const height = item.measuredHeight ?? calculateTextHeight(item.text, itemWidth, item.type);
          maxRowHeight = Math.max(maxRowHeight, height);

          itemPositions.push({
            item,
            position: {
              x: itemIndentX + i * (itemWidth + itemGapX),
              y: currentY,
              width: item.measuredWidth ?? itemWidth,
              height,
            },
          });
        });

        currentY += maxRowHeight + itemGapY;
        itemIndex += maxItemsPerRow;
      }
    }

    currentY += periodGap;
  });

  // Vertical connecting bar from first dot to last dot
  if (dotPositions.length > 1) {
    const firstDot = dotPositions[0];
    const lastDot = dotPositions[dotPositions.length - 1];
    decorations.push({
      type: "bar",
      x: dotX - 2,
      y: firstDot.y,
      width: 4,
      height: lastDot.y - firstDot.y,
    });
  }

  // Frame dimensions
  const maxItemRight = itemPositions.length > 0
    ? Math.max(...itemPositions.map(({ position }) => position.x + position.width))
    : labelX + 350;

  const frameWidth = maxItemRight + spacing.padding;
  const frameHeight = currentY + spacing.padding;

  return {
    frame: {
      x: 0,
      y: 0,
      width: Math.max(frameWidth, 500),
      height: Math.max(frameHeight, 300),
      name: "",
    },
    items: itemPositions,
    arrows: [],
    decorations,
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
    case "timeline":
      return calculateTimelineLayout(items, options);
    default:
      return calculateGridLayout(items, options);
  }
}
