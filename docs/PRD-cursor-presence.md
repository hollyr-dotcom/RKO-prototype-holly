# PRD: AI Cursor Presence

## Executive Summary

Implement intelligent **AI cursor movement** that points at relevant areas on the canvas when the AI provides guidance. The AI cursor becomes a visual pointer — like a collaborator pointing at something on a shared whiteboard — directing the user's attention to the specific shapes, regions, or elements being discussed.

**Core value proposition:** The AI stops being a disembodied text voice and becomes a spatial collaborator that can point at things. When the AI says "this sticky note needs updating," its cursor moves to that sticky note. This is the "AI-Led" and "Motion as Language" experience principles in action.

## Target Users

- **Primary:** Users collaborating with AI on canvas content
- **Pain points:** AI references canvas elements by text description but users must visually scan to find what's being discussed. Disconnect between AI's words and the canvas.
- **Goals:** Instantly see what the AI is referring to. Feel like the AI is "present" on the canvas as a collaborator.

## Current State

### Existing AI Cursor (`src/hooks/useAICursor.ts`)
- Creates a fake tldraw presence record using `InstancePresenceRecordType`
- Position calculated from tool call arguments (x/y coords or shape bounds)
- Labels mapped to tool names: "Creating stickies", "Drawing connections", etc.
- Methods: `show()`, `updateForToolCall()`, `hide()`, `scheduleHide()`
- AI cursor color: Blue (`#2563EB`)
- Currently only activates during tool execution (creating/updating shapes)
- **Does not** proactively point at shapes during conversation

### Existing Cursor Rendering
- `CustomCursor` component in `Canvas.tsx` renders SVG arrow + nametag
- Supports `chatMessage` overlay for cursor-attached text
- Position via `useTransform(ref, x, y, 1/zoom)`

### AI Behaviour Guidelines (from `docs/guidelines/ai-behaviour.md`)
AI Presence states:
- **Idle:** Cursor hidden or parked
- **Listening:** Cursor visible with subtle pulse
- **Working:** Cursor moves, selects objects, shows status text
- **Asking:** Cursor chat bubble with options
- **Waiting:** Near checkpoint showing "Waiting for you..."

## Feature Specifications

### Feature 1: Contextual Cursor Pointing

**Description:** When the AI references a specific shape, region, or element in its response, the cursor smoothly animates to that location on the canvas, drawing the user's attention.

**Trigger conditions:**
- AI mentions a shape by ID or description in its response
- AI creates or modifies a shape (existing behavior, enhanced)
- AI suggests changes to specific canvas elements
- AI answers a question about specific content on the canvas

**Cursor movement behavior:**
- Smooth spring animation from current position to target (`spring.snappy`)
- Duration: `normal` (350ms) for standard moves, `fast` (200ms) for nearby moves
- Cursor arrives slightly before the text describing the target (200ms lead time)
- Cursor pauses at target for at least 1 second before moving again
- If multiple targets in sequence: move between them with `delay.sequence` (120ms) gaps

**Target resolution:**
- By shape ID: Move to shape's center point
- By shape type + content: Find matching shape, move to it
- By region description: Move to approximate canvas region
- By group/frame: Move to frame's top-left or center

**Acceptance criteria:**
- [ ] AI cursor moves to referenced shapes during AI responses
- [ ] Movement uses spring animation from `@/lib/motion` (`spring.snappy`)
- [ ] Cursor pauses at targets for at least 1 second
- [ ] Sequential targets animate with staggered timing
- [ ] Cursor returns to idle position (hidden) when AI stops speaking
- [ ] Movement is smooth and doesn't jitter or jump

**Priority:** Must-have

### Feature 2: AI Presence States

**Description:** Implement the full AI presence state machine as defined in the AI behaviour guidelines.

**States:**

| State | Cursor Visual | Behavior |
|-------|--------------|----------|
| `idle` | Hidden | No cursor visible. AI is not actively engaged. |
| `listening` | Visible with subtle pulse | AI is processing/thinking. Cursor at last position or center. Pulse animation: `opacity 0.4 → 1.0` on `duration.slow` loop. |
| `working` | Visible, moving | AI is executing tools. Cursor moves to targets. Status label shown. |
| `pointing` | Visible, stationary at target | AI is referencing something. Cursor at target shape. Optional highlight ring on target. |
| `asking` | Visible with chat bubble | AI is asking a question. Cursor shows bubble with question text. |
| `waiting` | Visible near checkpoint | AI paused for feedback. Cursor shows "Waiting for you..." label. |

**State transitions:**
```
idle → listening (user sends message)
listening → working (AI starts tool execution)
listening → pointing (AI references shapes in response)
listening → asking (AI asks a question)
working → pointing (AI finishes tool, points at result)
working → waiting (AI pauses at checkpoint)
pointing → idle (AI finishes response, 2s delay)
asking → idle (user responds to question)
waiting → working (user gives feedback)
any → idle (conversation ends or timeout after 10s)
```

**Acceptance criteria:**
- [ ] All 6 presence states implemented with correct visuals
- [ ] State transitions are smooth (no flash/pop between states)
- [ ] `listening` state shows subtle pulse animation
- [ ] `pointing` state keeps cursor at target with optional highlight
- [ ] `asking` state renders chat bubble on cursor
- [ ] `waiting` state shows label text
- [ ] Auto-transition to `idle` after 10s of no activity

**Priority:** Must-have

### Feature 3: Target Shape Highlighting

**Description:** When the AI cursor points at a shape, optionally highlight that shape with a subtle visual treatment to further draw attention.

**Highlight options:**
- Soft glow ring around shape (using existing `connected-shape-glow` pattern)
- Subtle background tint behind shape
- Brief scale pulse on shape (1.0 → 1.02 → 1.0)

**Rules:**
- Highlight is temporary (fades after cursor moves away)
- Highlight is non-destructive (doesn't modify shape data)
- Highlight uses motion tokens (`duration.fast` for appear, `duration.normal` for fade)
- Only one shape highlighted at a time

**Acceptance criteria:**
- [ ] Target shape receives visual highlight when AI cursor points at it
- [ ] Highlight fades when cursor moves to new target
- [ ] Highlight animation uses motion tokens
- [ ] Highlight is subtle (not distracting from canvas content)
- [ ] No shape data is modified by highlighting

**Priority:** Should-have

### Feature 4: Cursor Movement Integration with Chat Stream

**Description:** Connect cursor movement to the AI response stream so cursor positioning happens in sync with the text being generated.

**Implementation approach:**
- AI agent includes cursor directives in its response stream (tool calls or metadata)
- Client parses directives and triggers cursor movement
- Cursor arrives at target before or as the relevant text appears in chat
- Movement queued if multiple directives arrive quickly

**New or enhanced tool:**
```typescript
// New tool or enhancement to existing tools
moveCursor: {
  name: "moveCursor",
  description: "Move AI cursor to point at a specific shape or location",
  parameters: z.object({
    targetShapeId: z.string().optional(),
    targetPosition: z.object({ x: z.number(), y: z.number() }).optional(),
    label: z.string().optional(),
    state: z.enum(["pointing", "working", "asking", "waiting"]).optional(),
  }),
}
```

**Acceptance criteria:**
- [ ] Cursor movement triggers are embedded in AI response stream
- [ ] Cursor moves in sync with relevant text (arrives just before)
- [ ] Multiple movement commands queue and execute sequentially
- [ ] Cursor directives work alongside existing tool calls (createShape, updateShape)

**Priority:** Must-have

## Functional Requirements

### Cursor Position Resolution
- Shape ID → `editor.getShape(shapeId)` → calculate center from bounds
- Shape search → `editor.getCurrentPageShapes()` → find by type/content → center
- Coordinates → Direct `{ x, y }` in page space
- Frame/group → `editor.getShapePageBounds(shapeId)` → center or top-left

### Animation System
- Use Framer Motion for cursor position interpolation
- Spring physics: `spring.snappy` (stiffness: 400, damping: 30)
- Position updates via `useTransform` (existing pattern)
- Queued movements with minimum 1s dwell time between moves

### State Machine
- Implement as a React state machine (useReducer or XState if complex)
- State transitions trigger cursor visual changes and position updates
- Timeout-based auto-transitions (e.g., idle after 10s)

## Technical Requirements

### Key Files to Modify
| File | Changes |
|------|---------|
| `src/hooks/useAICursor.ts` | Expand with state machine, pointing behavior, movement queue |
| `src/components/Canvas.tsx` | Update CustomCursor component with presence states |
| `src/app/api/chat/route.ts` | Add `moveCursor` tool or cursor directives in response |

### Key Files to Create
| File | Purpose |
|------|---------|
| `src/lib/ai-presence.ts` | AI presence state machine definition |
| `src/components/canvas/AICursorHighlight.tsx` | Target shape highlight overlay |

### Dependencies
- Framer Motion (existing) — spring animations
- `@/lib/motion` — motion tokens
- tldraw API (existing) — shape queries, bounds calculations
- No new dependencies

## Constraints & Considerations

- **Performance:** Cursor animation must be 60fps. Use `transform` only. Avoid layout-triggering properties.
- **Canvas zoom:** Cursor position must account for current zoom level. Use tldraw's coordinate system (`editor.pageToScreen()`, `editor.screenToPage()`).
- **Viewport bounds:** If target shape is off-screen, consider whether to pan the camera to show it (coordinate with Camera Tracking PRD) or just point in the direction.
- **Multiple users:** AI cursor should be visually distinct from other user cursors (already blue, but ensure it's clear).
- **Chat integration:** Cursor directives in the stream must not break the existing chat/tool-call parsing.

## Out of Scope

- Camera tracking / viewport following (covered by PRD: Camera Tracking)
- AI cursor interacting with shapes (selecting, dragging)
- Voice-triggered cursor movement (future enhancement)
- Multiple AI cursors (one AI = one cursor)

## Validation Plan

### Build Validation
```bash
npm run build
npm run lint
```

### Cursor Movement Validation
- [ ] AI cursor moves to a specific shape when AI references it in chat
- [ ] Movement animation is smooth (spring physics, no jitter)
- [ ] Cursor pauses at target for at least 1 second
- [ ] Sequential targets animate in order with stagger
- [ ] Cursor returns to idle (hidden) when AI stops responding

### Presence State Validation
- [ ] Idle: cursor hidden
- [ ] Listening: cursor visible with pulse
- [ ] Working: cursor moving with status label
- [ ] Pointing: cursor at target, shape highlighted
- [ ] Asking: cursor with chat bubble
- [ ] Waiting: cursor with "Waiting for you..." label
- [ ] Transitions between states are smooth

### Integration Validation
- [ ] Cursor movement works during AI tool execution (existing behavior preserved)
- [ ] Cursor pointing works during AI text responses (new behavior)
- [ ] Cursor directives in stream don't break chat message display
- [ ] Works at different zoom levels
