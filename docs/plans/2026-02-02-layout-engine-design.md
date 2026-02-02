# Layout Engine Design - AI Canvas Collaboration

**Date:** 2026-02-02
**Status:** Approved
**Extends:** [AI Canvas Collaboration Design](./2026-02-01-ai-canvas-collaboration-design.md)

## Problem

The current implementation has the AI agent specify pixel coordinates for canvas items. This leads to:
- Stickies overlapping or placed outside frames
- Content cut off and unreadable
- Janky, unprofessional layouts
- Agent instructions full of complex coordinate formulas that it doesn't follow

**Research findings:**
- [DiagrammerGPT](https://arxiv.org/abs/2310.12128) - LLMs need a planning stage before rendering
- [LaySPA (2025)](https://arxiv.org/abs/2509.16891) - LLMs are poor at spatial reasoning; need explicit geometric constraints
- [tldraw agent kit](https://tldraw.dev/starter-kits/agent) - Has built-in align, distribute, stack operations

## Solution

**Separate "what" from "where":**
- Agent specifies *intent* (semantic structure)
- Layout Engine calculates *geometry* (pixel positions)

## Architecture

### Fits Into Original Vision

From the original design doc: *"The AI works visibly on the canvas like a human collaborator"*

This enhancement:
- **Keeps:** All existing tools, agentic flow, chat panel, checkpoints
- **Adds:** Layout Engine that auto-arranges items
- **Enhances:** Agent specifies intent, engine handles geometry

### Two Layers

```
┌─────────────────────────────────────────┐
│           SEMANTIC LAYER (Agent)        │
│  "Create a grid of 6 stickies in a     │
│   frame called 'Key Assumptions'"       │
└─────────────────┬───────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│         LAYOUT ENGINE (Client)          │
│  - Finds empty canvas space             │
│  - Calculates frame size                │
│  - Positions items in grid pattern      │
│  - Validates everything fits            │
└─────────────────────────────────────────┘
```

## New Tool: createLayout()

```typescript
createLayout({
  type: "grid" | "hierarchy" | "flow",
  frameName: string,
  items: [
    { type: "sticky", text: "Item 1", color: "yellow" },
    { type: "sticky", text: "Item 2", color: "blue" },
    // ...
  ],
  options?: {
    columns?: number,      // for grid (default: 3)
    direction?: "down" | "right",  // for hierarchy
    spacing?: "compact" | "normal" | "spacious"
  }
})
```

## Layout Types

### Grid Layout
Best for: Brainstorms, feature lists, pros/cons, comparisons

```
┌─────────────────────────────┐
│  Frame: "Key Assumptions"   │
├─────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │  1  │ │  2  │ │  3  │   │  Row 1
│  └─────┘ └─────┘ └─────┘   │
│  ┌─────┐ ┌─────┐ ┌─────┐   │
│  │  4  │ │  5  │ │  6  │   │  Row 2
│  └─────┘ └─────┘ └─────┘   │
└─────────────────────────────┘
```

**Algorithm:**
- Sticky size: 200×180px
- Gap between items: 30px
- Padding from frame: 40px top/sides
- `x = frameX + 40 + (col × 230)`
- `y = frameY + 60 + (row × 210)`
- Frame auto-sizes to fit content

### Hierarchy Layout
Best for: Org charts, taxonomies, decision trees

```
┌─────────────────────────────┐
│     Frame: "Org Chart"      │
├─────────────────────────────┤
│          ┌─────┐            │
│          │ CEO │            │  Level 0
│          └──┬──┘            │
│      ┌──────┼──────┐        │
│   ┌──┴──┐ ┌─┴─┐ ┌──┴──┐    │
│   │ CTO │ │CPO│ │ CFO │    │  Level 1
│   └─────┘ └───┘ └─────┘    │
└─────────────────────────────┘
```

**Algorithm:**
- Shape size: 150×80px
- Level spacing: 150px vertical
- Sibling spacing: 180px horizontal
- Center parent above children
- Auto-draw arrows from parent to children

### Flow Layout
Best for: Processes, user journeys, workflows

```
┌─────────────────────────────────────────┐
│        Frame: "User Journey"            │
├─────────────────────────────────────────┤
│  ┌─────┐    ┌─────┐    ┌─────┐         │
│  │Start│───→│Step1│───→│Step2│───→ ... │
│  └─────┘    └─────┘    └─────┘         │
└─────────────────────────────────────────┘
```

**Algorithm:**
- Shape size: 150×80px
- Horizontal spacing: 200px
- Auto-draw arrows between sequential items
- Wrap to new row if exceeds max width

## Implementation

### New Files

| File | Purpose |
|------|---------|
| `src/lib/layoutEngine.ts` | Layout calculation logic |
| `src/types/layout.ts` | TypeScript types |

### Modified Files

| File | Changes |
|------|---------|
| `src/app/api/chat/route.ts` | Add `createLayout` tool, simplify instructions |
| `src/components/Canvas.tsx` | Integrate layout engine |

### Layout Engine API

```typescript
// src/lib/layoutEngine.ts

interface LayoutItem {
  type: "sticky" | "shape" | "text";
  text: string;
  color?: string;
}

interface LayoutResult {
  frameSize: { width: number; height: number };
  positions: Array<{ x: number; y: number; width: number; height: number }>;
  arrows?: Array<{ startX: number; startY: number; endX: number; endY: number }>;
}

// Find empty space on canvas for new content
function findEmptyCanvasSpace(
  editor: Editor,
  width: number,
  height: number
): { x: number; y: number };

// Calculate grid layout
function calculateGridLayout(
  items: LayoutItem[],
  options?: { columns?: number; spacing?: string }
): LayoutResult;

// Calculate hierarchy layout
function calculateHierarchyLayout(
  items: LayoutItem[],
  options?: { direction?: "down" | "right" }
): LayoutResult;

// Calculate flow layout
function calculateFlowLayout(
  items: LayoutItem[],
  options?: { maxWidth?: number }
): LayoutResult;
```

### Agent Instructions (Simplified)

```
FOR ORGANIZED CONTENT - Use createLayout():
- "grid" for brainstorms, lists, comparisons
- "hierarchy" for org charts, taxonomies (auto-draws arrows)
- "flow" for processes, journeys (auto-draws arrows)

FOR SINGLE ITEMS - Use createSticky/createShape:
- Items auto-place in empty canvas space

DON'T specify pixel coordinates - the layout engine handles positioning.
```

## Backwards Compatibility

- Existing `createSticky`, `createShape`, `createFrame` still work
- They auto-position using layout engine (ignore agent coordinates)
- `createLayout` is preferred for multiple related items

## Success Criteria

1. **No overlapping content** - Items never overlap
2. **Readable layouts** - Content fits within frames, text not cut off
3. **Professional appearance** - Consistent spacing, alignment
4. **Simpler agent instructions** - No coordinate formulas
5. **Works with existing flow** - Integrates with checkpoints, progress tracking

## References

- [DiagrammerGPT: LLM Planning for Diagrams](https://arxiv.org/abs/2310.12128)
- [LaySPA: Spatial Reasoning in LLMs](https://arxiv.org/abs/2509.16891)
- [tldraw Agent Starter Kit](https://tldraw.dev/starter-kits/agent)
- [Atlassian Whiteboard Best Practices](https://www.atlassian.com/software/confluence/resources/guides/best-practices/whiteboards-best-practices)
