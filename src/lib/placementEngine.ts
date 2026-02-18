import type { Editor } from "tldraw";

// Placement categories based on tool name
export type PlacementCategory = "format" | "widget" | "decorative";

export interface PlacementRequest {
  category: PlacementCategory;
  width: number;
  height: number;
  /** For replaceFrame: place at exact position of the replaced frame */
  replacePosition?: { x: number; y: number };
}

export interface PlacementResult {
  x: number;
  y: number;
}

export interface PlacedItem {
  id: string;
  category: PlacementCategory;
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Zone placement engine for placing content INSIDE a frame using relative coordinates.
 *
 * - **format** items (docs, tables, layouts) flow left→right, wrapping to next row
 * - **widget** items (stickies, shapes) flow left→right below the last format item
 * - **decorative** items (stickers) go on corners/edges of the frame with jitter
 *
 * All coordinates returned are RELATIVE to the frame's origin (0,0 = top-left of frame).
 * The frame auto-grows vertically as items are added — `recordPlacement` returns the
 * new frame height if content exceeded the current frame bounds.
 */
export class ZonePlacementEngine {
  private frameId: string;
  private frameWidth: number;
  private frameHeight: number;

  // Layout constants
  private padding = 24;
  private titleSpace = 40;
  private gap = 20;

  // Cursor for format row-based flow (relative to frame origin)
  private cursorX: number;
  private cursorY: number;
  private currentRowHeight = 0;

  // Widget cursor (flows left→right below last format)
  private widgetCursorX = 0;
  private widgetCursorY = 0;
  private widgetRowHeight = 0;
  private widgetRowStarted = false;

  // Track placed items
  private placedItems: PlacedItem[] = [];
  private lastFormat: PlacedItem | null = null;

  constructor(frameId: string, frameWidth: number, frameHeight: number) {
    this.frameId = frameId;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;

    // Start cursor at top-left content area (after padding + title space)
    this.cursorX = this.padding;
    this.cursorY = this.padding + this.titleSpace;
  }

  /** Get the frame ID this engine manages */
  getFrameId(): string {
    return this.frameId;
  }

  /** Get current frame height (may have grown from original) */
  getFrameHeight(): number {
    return this.frameHeight;
  }

  /** Get placement position for a new item inside the frame (relative coords) */
  place(request: PlacementRequest): PlacementResult {
    if (request.replacePosition) {
      return { x: request.replacePosition.x, y: request.replacePosition.y };
    }

    switch (request.category) {
      case "format":
        return this.placeFormat(request);
      case "widget":
        return this.placeWidget(request);
      case "decorative":
        return this.placeDecorative(request);
      default:
        return this.placeFormat(request);
    }
  }

  /**
   * Record a placed item and return the new frame height if it grew.
   * Returns `undefined` if the frame didn't need to grow.
   */
  recordPlacement(
    id: string,
    request: PlacementRequest,
    result: PlacementResult
  ): number | undefined {
    const item: PlacedItem = {
      id,
      category: request.category,
      x: result.x,
      y: result.y,
      width: request.width,
      height: request.height,
    };
    this.placedItems.push(item);

    if (request.category === "format") {
      this.lastFormat = item;
      // Reset widget cursor when a new format item is placed
      this.widgetRowStarted = false;
    }

    // Check if the item extends beyond the current frame height
    const itemBottom = result.y + request.height + this.padding;
    if (itemBottom > this.frameHeight) {
      this.frameHeight = itemBottom;
      return this.frameHeight;
    }

    return undefined;
  }

  // ─── Format placement: row-based flow inside frame ──────────────

  private placeFormat(request: PlacementRequest): PlacementResult {
    const { width, height } = request;

    // Check if item fits in current row
    const wouldEnd = this.cursorX + width;
    const rowTooWide =
      wouldEnd > this.frameWidth - this.padding && this.cursorX > this.padding;

    if (rowTooWide) {
      // Wrap to next row
      this.cursorX = this.padding;
      this.cursorY += this.currentRowHeight + this.gap;
      this.currentRowHeight = 0;
    }

    const result: PlacementResult = {
      x: this.cursorX,
      y: this.cursorY,
    };

    // Advance cursor
    this.cursorX += width + this.gap;

    // Track row height (tallest item in row)
    if (height > this.currentRowHeight) {
      this.currentRowHeight = height;
    }

    return result;
  }

  // ─── Widget placement: cluster below last format ────────────────

  private placeWidget(request: PlacementRequest): PlacementResult {
    const { width, height } = request;

    if (!this.lastFormat) {
      // No format placed yet — use format flow
      return this.placeFormat(request);
    }

    const fmt = this.lastFormat;

    if (!this.widgetRowStarted) {
      // Start widget row below the last format item
      this.widgetCursorX = fmt.x;
      this.widgetCursorY = fmt.y + fmt.height + this.gap;
      this.widgetRowHeight = 0;
      this.widgetRowStarted = true;
    }

    // Check if widget fits within the format's width footprint
    const fmtRight = fmt.x + fmt.width;
    if (this.widgetCursorX + width > fmtRight && this.widgetCursorX > fmt.x) {
      // Wrap to next widget row
      this.widgetCursorX = fmt.x;
      this.widgetCursorY += this.widgetRowHeight + this.gap;
      this.widgetRowHeight = 0;
    }

    const result: PlacementResult = {
      x: this.widgetCursorX,
      y: this.widgetCursorY,
    };

    this.widgetCursorX += width + this.gap;
    if (height > this.widgetRowHeight) {
      this.widgetRowHeight = height;
    }

    return result;
  }

  // ─── Decorative placement: inside frame corners ─────────────────

  private placeDecorative(request: PlacementRequest): PlacementResult {
    const { width, height } = request;

    const fw = this.frameWidth;
    const fh = this.frameHeight;
    const margin = 12;

    // Keep stickers INSIDE frame bounds — tldraw clips children outside
    const positions = [
      { x: fw - width - margin, y: fh - height - margin },       // bottom-right (most natural)
      { x: fw - width - margin, y: this.titleSpace + margin },   // top-right
      { x: margin, y: fh - height - margin },                     // bottom-left
      { x: fw - width - margin, y: fh / 2 - height / 2 },       // right-center
    ];

    // Pick based on how many decoratives have been placed (deterministic spread)
    const decoCount = this.placedItems.filter(i => i.category === "decorative").length;
    const pick = positions[decoCount % positions.length];

    // Small jitter for organic feel (±8px)
    const jitterX = (Math.random() - 0.5) * 16;
    const jitterY = (Math.random() - 0.5) * 16;

    return {
      x: Math.max(margin, Math.min(fw - width - margin, pick.x + jitterX)),
      y: Math.max(this.titleSpace + margin, Math.min(fh - height - margin, pick.y + jitterY)),
    };
  }
}

/**
 * Smart placement engine that arranges content like a human would on a whiteboard.
 *
 * - **format** items (documents, tables, frames, layouts, sources) flow left→right
 *   in rows, wrapping to new rows when too wide — like a newspaper.
 * - **widget** items (stickies, shapes, text, task cards, working notes) cluster
 *   below the last format item.
 * - **decorative** items (stickers) sit on edges of nearby content with organic jitter.
 */
export class PlacementEngine {
  private editor: Editor;

  // Origin point (top-left of where we start placing)
  private originX = 100;
  private originY = 100;

  // Cursor for format row-based flow
  private cursorX = 100;
  private cursorY = 100;
  private currentRowHeight = 0;
  private currentRowBottom = 100;

  // Max row width before wrapping
  private maxRowWidth = 7500;
  private formatGapX = 80;
  private formatGapY = 100;

  // Track placed items for widget/decorative positioning
  private placedItems: PlacedItem[] = [];
  private lastFormat: PlacedItem | null = null;

  // Zone engines for placing content inside frames
  private zoneEngines = new Map<string, ZonePlacementEngine>();

  // Widget cursor (flows left→right below last format)
  private widgetCursorX = 0;
  private widgetCursorY = 0;
  private widgetRowHeight = 0;
  private widgetRowStarted = false;

  constructor(editor: Editor) {
    this.editor = editor;
  }

  /** Get (or create) a zone engine for placing content inside a specific frame */
  getZoneEngine(
    frameId: string,
    frameWidth: number,
    frameHeight: number
  ): ZonePlacementEngine {
    if (!this.zoneEngines.has(frameId)) {
      this.zoneEngines.set(
        frameId,
        new ZonePlacementEngine(frameId, frameWidth, frameHeight)
      );
    }
    return this.zoneEngines.get(frameId)!;
  }

  /** Scan existing canvas content and set origin + cursor */
  initialize(): void {
    const shapes = this.editor.getCurrentPageShapes();
    const pageId = this.editor.getCurrentPageId();
    const rootShapes = shapes.filter((s) => s.parentId === pageId);

    this.placedItems = [];
    this.lastFormat = null;
    this.widgetRowStarted = false;

    if (rootShapes.length === 0) {
      this.originX = 100;
      this.originY = 100;
      this.cursorX = 100;
      this.cursorY = 100;
      this.currentRowHeight = 0;
      this.currentRowBottom = 100;
      return;
    }

    // Find bounding box of all existing content
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    rootShapes.forEach((shape) => {
      const bounds = this.editor.getShapePageBounds(shape.id);
      if (!bounds) return;
      if (shape.x < minX) minX = shape.x;
      if (shape.y < minY) minY = shape.y;
      if (shape.x + bounds.width > maxX) maxX = shape.x + bounds.width;
      if (shape.y + bounds.height > maxY) maxY = shape.y + bounds.height;

      // Register existing shapes so overlap detection works
      this.placedItems.push({
        id: shape.id as string,
        category: "format", // treat existing as format for overlap purposes
        x: shape.x,
        y: shape.y,
        width: bounds.width,
        height: bounds.height,
      });
    });

    const existingWidth = maxX - minX;
    const halfMax = this.maxRowWidth / 2;

    if (existingWidth < halfMax) {
      // Existing content is narrow → continue to the right in same row
      this.originX = minX;
      this.originY = minY;
      this.cursorX = maxX + this.formatGapX;
      this.cursorY = minY;
      this.currentRowHeight = maxY - minY;
      this.currentRowBottom = maxY;
    } else {
      // Existing content is wide → start a new row below
      this.originX = minX;
      this.originY = maxY + this.formatGapY;
      this.cursorX = minX;
      this.cursorY = maxY + this.formatGapY;
      this.currentRowHeight = 0;
      this.currentRowBottom = maxY + this.formatGapY;
    }
  }

  /** Get placement position for a new shape */
  place(request: PlacementRequest): PlacementResult {
    // If replacing a frame, use its exact position
    if (request.replacePosition) {
      return { x: request.replacePosition.x, y: request.replacePosition.y };
    }

    switch (request.category) {
      case "format":
        return this.placeFormat(request);
      case "widget":
        return this.placeWidget(request);
      case "decorative":
        return this.placeDecorative(request);
      default:
        return this.placeFormat(request);
    }
  }

  /** Record a placed item so future placements account for it */
  recordPlacement(
    id: string,
    request: PlacementRequest,
    result: PlacementResult
  ): void {
    const item: PlacedItem = {
      id,
      category: request.category,
      x: result.x,
      y: result.y,
      width: request.width,
      height: request.height,
    };
    this.placedItems.push(item);

    if (request.category === "format") {
      this.lastFormat = item;
      // Reset widget cursor when a new format is placed
      this.widgetRowStarted = false;
    }
  }

  // ─── Format placement: row-based flow ───────────────────────────

  private placeFormat(request: PlacementRequest): PlacementResult {
    const { width, height } = request;

    // Check if item fits in current row
    const wouldEnd = this.cursorX + width;
    const rowTooWide =
      wouldEnd - this.originX > this.maxRowWidth && this.cursorX > this.originX;

    if (rowTooWide) {
      // Wrap to new row
      this.cursorX = this.originX;
      this.cursorY = this.currentRowBottom + this.formatGapY;
      this.currentRowHeight = 0;
      this.currentRowBottom = this.cursorY;
    }

    const result: PlacementResult = {
      x: this.cursorX,
      y: this.cursorY,
    };

    // Advance cursor
    this.cursorX += width + this.formatGapX;

    // Track row height (top-aligned, so we track the tallest item)
    if (height > this.currentRowHeight) {
      this.currentRowHeight = height;
      this.currentRowBottom = this.cursorY + height;
    }

    return result;
  }

  // ─── Widget placement: cluster below last format ────────────────

  private placeWidget(request: PlacementRequest): PlacementResult {
    const { width, height } = request;
    const gap = 40;

    if (!this.lastFormat) {
      // No format placed yet — fall back to format placement
      return this.placeFormat(request);
    }

    const fmt = this.lastFormat;

    if (!this.widgetRowStarted) {
      // Start a new widget row below the last format
      this.widgetCursorX = fmt.x;
      this.widgetCursorY = fmt.y + fmt.height + gap;
      this.widgetRowHeight = 0;
      this.widgetRowStarted = true;
    }

    // Check if widget fits within the format's width footprint
    const fmtRight = fmt.x + fmt.width;
    if (this.widgetCursorX + width > fmtRight && this.widgetCursorX > fmt.x) {
      // Wrap to next widget row
      this.widgetCursorX = fmt.x;
      this.widgetCursorY += this.widgetRowHeight + gap;
      this.widgetRowHeight = 0;
    }

    const result: PlacementResult = {
      x: this.widgetCursorX,
      y: this.widgetCursorY,
    };

    this.widgetCursorX += width + gap;
    if (height > this.widgetRowHeight) {
      this.widgetRowHeight = height;
    }

    return result;
  }

  // ─── Decorative placement: organic edges ────────────────────────

  private placeDecorative(request: PlacementRequest): PlacementResult {
    const { width, height } = request;

    // Find the last format (or any recent content) to attach to
    const target = this.lastFormat || this.placedItems[this.placedItems.length - 1];

    if (!target) {
      // Nothing on canvas — just place at origin
      return { x: this.originX, y: this.originY };
    }

    // Pick a random corner/edge position (corners weighted 2x)
    // overlap: 30% of the sticker sits ON the target edge
    const overlap = 0.3;
    const overlapX = width * overlap;
    const overlapY = height * overlap;

    const positions = [
      // Corners (weighted 2x — appear twice)
      { x: target.x - width + overlapX, y: target.y - height + overlapY }, // top-left
      { x: target.x - width + overlapX, y: target.y - height + overlapY }, // top-left (2x)
      {
        x: target.x + target.width - overlapX,
        y: target.y - height + overlapY,
      }, // top-right
      {
        x: target.x + target.width - overlapX,
        y: target.y - height + overlapY,
      }, // top-right (2x)
      {
        x: target.x - width + overlapX,
        y: target.y + target.height - overlapY,
      }, // bottom-left
      {
        x: target.x - width + overlapX,
        y: target.y + target.height - overlapY,
      }, // bottom-left (2x)
      {
        x: target.x + target.width - overlapX,
        y: target.y + target.height - overlapY,
      }, // bottom-right
      {
        x: target.x + target.width - overlapX,
        y: target.y + target.height - overlapY,
      }, // bottom-right (2x)
      // Edge midpoints (weighted 1x)
      {
        x: target.x + target.width / 2 - width / 2,
        y: target.y - height + overlapY,
      }, // top-center
      {
        x: target.x + target.width / 2 - width / 2,
        y: target.y + target.height - overlapY,
      }, // bottom-center
      { x: target.x - width + overlapX, y: target.y + target.height / 2 - height / 2 }, // left-center
      {
        x: target.x + target.width - overlapX,
        y: target.y + target.height / 2 - height / 2,
      }, // right-center
    ];

    const pick = positions[Math.floor(Math.random() * positions.length)];

    // Add random jitter (±15–30px) for organic feel
    const jitterX = (Math.random() - 0.5) * 2 * (15 + Math.random() * 15);
    const jitterY = (Math.random() - 0.5) * 2 * (15 + Math.random() * 15);

    return {
      x: pick.x + jitterX,
      y: pick.y + jitterY,
    };
  }
}

// ─── Helper: map tool name to placement category ────────────────

const CATEGORY_MAP: Record<string, PlacementCategory> = {
  createDocument: "format",
  createDataTable: "format",
  createFrame: "format",
  createLayout: "format",
  createSources: "format",
  organizeIntoFrame: "format",
  createGanttChart: "format",
  createKanbanBoard: "format",
  createZone: "format",

  createSticky: "widget",
  createShape: "widget",
  createText: "widget",
  createTaskCard: "widget",
  createWorkingNote: "widget",

  createSticker_result: "decorative",
};

export function getCategoryForTool(toolName: string): PlacementCategory {
  return CATEGORY_MAP[toolName] || "format";
}
