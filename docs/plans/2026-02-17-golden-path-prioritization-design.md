# Golden Path: Prioritization Comparison Zones — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** When users ask the AI to help prioritize between competing options, create rich side-by-side "zone frames" instead of a linear artifact stream.

**Architecture:** Add `parentFrameId` to creation tools so the AI can nest content inside frames. Add zone-internal placement logic to the placement engine. Update system prompts with the prioritization golden path recipe.

**Tech Stack:** Next.js, tldraw, OpenAI Agents SDK, TypeScript

---

## Task 1: Add `parentFrameId` to creation tools

**Files:**
- Modify: `src/app/api/chat/route.ts` (tool definitions ~lines 100-750)

**Step 1: Add optional parentFrameId to tool schemas**

Add `.optional()` `parentFrameId` parameter to these tools:
- `createStickyTool`
- `createDocumentTool`
- `createDataTableTool`
- `createLayoutTool`
- `createTaskCardTool`
- `createStickerTool`
- `createShapeTool`
- `createTextTool`

For each tool, add to the `parameters` z.object:
```typescript
parentFrameId: z.string().optional().describe("If provided, place this item inside the specified frame"),
```

And pass it through in the execute function's return JSON:
```typescript
execute: async (args) => {
  const id = generateItemId();
  return JSON.stringify({ created: "sticky", id, ...args });
  // parentFrameId is already in args via spread, so it's passed through
},
```

**Step 2: Verify tool results pass parentFrameId**

Since tools use `...args` spread in their JSON.stringify, parentFrameId should flow through automatically. Verify each tool's execute function uses spread.

**Step 3: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: add parentFrameId param to creation tools"
```

---

## Task 2: Add zone placement engine

**Files:**
- Modify: `src/lib/placementEngine.ts`

**Step 1: Add ZonePlacementEngine class**

Create a new class for placing content inside a frame. It arranges items in a composed layout:
- Row of stickies across the top
- Larger format items (tables, documents, layouts) flow below
- Stickers go on edges with jitter (reuse decorative logic)
- Frame auto-grows vertically as content is added

```typescript
export class ZonePlacementEngine {
  private frameId: string;
  private frameWidth: number;
  private frameHeight: number;
  private padding = 40;
  private titleSpace = 50;
  private gap = 30;

  // Cursor for flowing content top-to-bottom, left-to-right
  private cursorX: number;
  private cursorY: number;
  private currentRowHeight = 0;
  private placedItems: PlacedItem[] = [];

  constructor(frameId: string, frameWidth: number, frameHeight: number) {
    this.frameId = frameId;
    this.frameWidth = frameWidth;
    this.frameHeight = frameHeight;
    this.cursorX = this.padding;
    this.cursorY = this.padding + this.titleSpace;
  }

  /** Place an item inside the frame. Returns RELATIVE coordinates. */
  place(request: PlacementRequest): PlacementResult {
    if (request.category === "decorative") {
      return this.placeDecorative(request);
    }
    return this.placeContent(request);
  }

  /** Record placement and return new frame height if it grew */
  recordPlacement(id: string, request: PlacementRequest, result: PlacementResult): number | null {
    this.placedItems.push({ id, category: request.category, x: result.x, y: result.y, width: request.width, height: request.height });

    const bottomEdge = result.y + request.height + this.padding;
    if (bottomEdge > this.frameHeight) {
      this.frameHeight = bottomEdge;
      return this.frameHeight; // Caller should resize frame
    }
    return null;
  }

  private placeContent(request: PlacementRequest): PlacementResult {
    const { width, height } = request;
    const usableWidth = this.frameWidth - 2 * this.padding;

    // Check if item fits in current row
    if (this.cursorX + width > this.frameWidth - this.padding && this.cursorX > this.padding) {
      // Wrap to next row
      this.cursorX = this.padding;
      this.cursorY += this.currentRowHeight + this.gap;
      this.currentRowHeight = 0;
    }

    const result = { x: this.cursorX, y: this.cursorY };

    this.cursorX += width + this.gap;
    if (height > this.currentRowHeight) {
      this.currentRowHeight = height;
    }

    return result;
  }

  private placeDecorative(request: PlacementRequest): PlacementResult {
    // Place on frame edges with jitter, similar to canvas-level decorative placement
    const { width, height } = request;
    const overlap = 0.3;
    const overlapX = width * overlap;
    const overlapY = height * overlap;

    const corners = [
      { x: -width + overlapX, y: -height + overlapY },
      { x: this.frameWidth - overlapX, y: -height + overlapY },
      { x: -width + overlapX, y: this.frameHeight - overlapY },
      { x: this.frameWidth - overlapX, y: this.frameHeight - overlapY },
    ];

    const pick = corners[Math.floor(Math.random() * corners.length)];
    const jitterX = (Math.random() - 0.5) * 30;
    const jitterY = (Math.random() - 0.5) * 30;

    return { x: pick.x + jitterX, y: pick.y + jitterY };
  }
}
```

**Step 2: Add zone engine tracking to PlacementEngine**

Add a `Map<string, ZonePlacementEngine>` to track active zone engines, and a helper to create/get them:

```typescript
// In PlacementEngine class:
private zoneEngines = new Map<string, ZonePlacementEngine>();

getZoneEngine(frameId: string, frameWidth: number, frameHeight: number): ZonePlacementEngine {
  if (!this.zoneEngines.has(frameId)) {
    this.zoneEngines.set(frameId, new ZonePlacementEngine(frameId, frameWidth, frameHeight));
  }
  return this.zoneEngines.get(frameId)!;
}
```

**Step 3: Commit**

```bash
git add src/lib/placementEngine.ts
git commit -m "feat: add ZonePlacementEngine for placing content inside frames"
```

---

## Task 3: Wire up parentFrameId in Canvas.tsx tool handlers

**Files:**
- Modify: `src/components/Canvas.tsx` (handleToolCall function ~line 1166)

**Step 1: Add helper to resolve frame and get zone engine**

Near the top of handleToolCall, add a helper:

```typescript
const getZoneEngineForFrame = (parentFrameId: string) => {
  const frameShape = editor.getShape(parentFrameId as any);
  if (!frameShape) return null;
  const engine = getPlacementEngine();
  const w = (frameShape.props as any).w || 800;
  const h = (frameShape.props as any).h || 600;
  return engine.getZoneEngine(parentFrameId, w, h);
};
```

**Step 2: Update createSticky handler**

When `args.parentFrameId` is present:
- Use zone engine instead of canvas placement engine
- Set `parentId` on the created shape
- Resize frame if needed

```typescript
if (toolName === "createSticky") {
  const { text, color, parentFrameId } = args;

  if (parentFrameId) {
    const zoneEngine = getZoneEngineForFrame(parentFrameId as string);
    if (zoneEngine) {
      const pos = zoneEngine.place({ category: "widget", width: 200, height: 200 });
      shapeId = createShapeId();
      editor.createShape({
        id: shapeId,
        type: "note",
        x: pos.x, y: pos.y,
        parentId: parentFrameId as any,
        props: { richText: toRichText(text), color: colorMap[color] || "yellow" },
        meta: { createdBy: "ai" },
      });
      const newHeight = zoneEngine.recordPlacement(shapeId, { category: "widget", width: 200, height: 200 }, pos);
      if (newHeight) {
        editor.updateShape({ id: parentFrameId as any, type: "frame", props: { h: newHeight } });
      }
    }
  } else {
    // existing logic unchanged
  }
}
```

**Step 3: Apply same pattern to other handlers**

Apply the parentFrameId pattern to:
- `createDocument` — use zone engine, set parentId, category "format"
- `createDataTable` — use zone engine, set parentId, category "format"
- `createLayout` — use zone engine for the outer frame placement, set parentId (layout's own frame becomes a child)
- `createShape` / `createText` — use zone engine, set parentId
- `createSticker` (via createSticker_result) — use zone engine with "decorative" category, set parentId

Each follows the same pattern: check parentFrameId → get zone engine → place → create with parentId → record → resize if needed.

**Step 4: Handle streaming tools with parentFrameId**

For `_streaming_start` events on createLayout, createDocument, createDataTable:
- Check if args contain parentFrameId
- If so, use zone engine for initial placement and set parentId on the container shape

**Step 5: Commit**

```bash
git add src/components/Canvas.tsx
git commit -m "feat: wire up parentFrameId for nesting content inside zone frames"
```

---

## Task 4: Update planning agent system prompt

**Files:**
- Modify: `src/app/api/chat/route.ts` (planning agent instructions ~lines 781-1051)

**Step 1: Add prioritization golden path to planning agent**

Add this section after the existing "PRIORITISATION / TRADE-OFF" block (around line 830):

```
🏗️ PRIORITISATION GOLDEN PATH — ZONE LAYOUT:
When you create a plan for prioritization/trade-off questions, structure it as ZONES:

The plan should follow this arc:
1. "Gather internal data" — queryConnectors broadly to understand both options
2. "Research [external context if needed]" — webSearch for market data
3. "Frame the decision" — Overview frame: exec summary document explaining the tension, why it matters, what's at stake
4. "Deep dive: [Option A name]" — Create a ZONE FRAME for option A:
   - First: createFrame(name: "[Option A]", width: 900, height: 1200) → get frameId
   - Then inside that frame (using parentFrameId):
     - 2-3 description stickies (what is this, key thesis)
     - Stakeholder/team layout (who's involved, who cares)
     - KPI table or stickies (key metrics, evidence)
     - Insights from research (real data, not placeholders)
     - 1-2 stickers for visual delight
5. "Deep dive: [Option B name]" — Same zone recipe for option B (placed BESIDE option A)
6. [AI judgment] — Comparison, recommendation, or whatever the context demands

The zone frames should be placed SIDE BY SIDE so the user can visually compare.
Each artifact inside a zone uses parentFrameId to nest inside the frame.
```

**Step 2: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: add prioritization golden path to planning agent prompt"
```

---

## Task 5: Update execution agent system prompt

**Files:**
- Modify: `src/app/api/chat/route.ts` (execution agent instructions ~lines 1084-1479)

**Step 1: Add zone execution recipe**

Add this section to the execution agent instructions:

```
🏗️ ZONE FRAME EXECUTION:
When a plan step says "Deep dive: [Option Name]" or similar zone-building step:

1. Call createFrame({ name: "[Option Name]", width: 900, height: 1200 }) — note the returned ID
2. Using that frame ID as parentFrameId for ALL subsequent items in this step:
   a. createSticky × 2-3: High-level description of this option (blue or green stickies)
   b. createLayout(type:"hierarchy" or "grid"): Stakeholders and teams involved
   c. createDataTable OR createSticky × 3-4: Key metrics and KPIs
   d. createDocument OR createSticky × 2-3: Insights from research data
   e. createSticker × 1-2: Visual delight (pick intents like "rocket", "target", "team", "chart")

ALL items in steps (b)-(e) MUST include parentFrameId from step (1).
The frame auto-resizes as you add content.

For the SECOND zone frame, the placement engine will place it beside the first one automatically.
```

**Step 2: Add parentFrameId reminder to tool choice section**

In the existing tool choice guidance, add a note:

```
⚠️ NESTING IN FRAMES: When building zone frames, ALWAYS pass parentFrameId to nest content inside the frame.
The createFrame tool returns an ID — use it as parentFrameId in all subsequent tool calls for that zone.
```

**Step 3: Commit**

```bash
git add src/app/api/chat/route.ts
git commit -m "feat: add zone execution recipe to execution agent prompt"
```

---

## Task 6: Ensure side-by-side zone placement

**Files:**
- Modify: `src/lib/placementEngine.ts`

**Step 1: Verify format placement handles side-by-side**

The existing `placeFormat` method already places format items left-to-right in rows with 80px gap. Two zone frames (~900px each) = ~1880px total, well under the 3000px row width limit. So zone frames will naturally land side by side.

Verify this works correctly — no code change may be needed. If frames are too wide to fit side by side, reduce the default zone frame width in the system prompt from 900 to 800.

**Step 2: Commit (if changes needed)**

```bash
git add src/lib/placementEngine.ts
git commit -m "fix: adjust placement for side-by-side zone frames"
```

---

## Task 7: Manual testing & polish

**Step 1: Start dev server**

```bash
npm run dev
```

**Step 2: Test the prioritization flow**

Type a prioritization prompt like: "Help me decide between investing in mobile app redesign vs. API platform expansion"

Verify:
- AI asks 1-2 clarifying questions
- AI proposes a plan with zone steps
- Execution creates overview frame first
- Two zone frames appear side by side
- Each zone contains mixed artifacts (stickies, table, layout, stickers)
- Content streams in progressively
- Frame auto-resizes as content is added
- Stickers land on frame edges

**Step 3: Fix any issues found during testing**

**Step 4: Final commit**

```bash
git add -A
git commit -m "polish: golden path prioritization zones"
```
