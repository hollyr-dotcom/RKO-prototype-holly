# PRD: Task Card Shape

## Executive Summary

Add a **task card** as a new custom shape on the tldraw canvas. On-canvas, it renders as a compact media card showing title, status, priority, and assignee metadata. When expanded (via click or AI action), it opens a side panel with full task details and editing capabilities.

This gives users and the AI collaborator a first-class way to represent units of work on the canvas — bridging planning artifacts (sticky notes, documents) with actionable, trackable tasks.

**Core value proposition:** Tasks become spatial, visible objects on the canvas that the AI can create, update, and reason about — not hidden in a separate tool.

## Target Users

- **Primary:** Knowledge workers using the canvas prototype to plan and execute projects with AI assistance
- **Pain points:** Tasks live in external tools (Jira, Linear) disconnected from the canvas where planning happens. Sticky notes are too simple to represent real work items.
- **Goals:** See task status at a glance on the canvas. Edit task details without leaving the canvas. Let the AI create and manage tasks as part of collaborative workflows.

## Feature Specifications

### Feature 1: Task Card Shape (on-canvas)

**Description:** A new tldraw custom shape (`TaskCardShapeUtil`) that renders as a compact card on the canvas, showing key metadata at a glance.

**On-canvas card displays:**
- Title (primary text, truncated to 2 lines)
- Status badge (Not Started / In Progress / Complete)
- Priority indicator (Low / Medium / High)
- Assignee avatar or initials
- Due date (if set)
- Tag chips (up to 3 visible, "+N" overflow)

**Card dimensions:**
- Default width: 280px
- Height: auto-sized to content (minimum ~120px, maximum ~200px)
- Resizable: width only (height follows content)

**User flow:**
1. User (or AI) creates a task card on the canvas
2. Card appears with `fadeInScale` animation using `duration.fast` and `spring.snappy`
3. Card shows compact metadata view
4. User can drag, select, and connect cards with arrows like any canvas shape

**Acceptance criteria:**
- [ ] Task card renders on canvas with title, status, priority, assignee, due date, and tags
- [ ] Card uses design system tokens (white bg, `rounded-lg`, subtle border and shadow)
- [ ] Card entry animation uses `fadeInScale` with motion tokens from `@/lib/motion`
- [ ] Card is draggable, selectable, and connectable (arrows)
- [ ] Card width is resizable; height auto-sizes to content
- [ ] Long titles truncate at 2 lines with ellipsis
- [ ] Tags overflow with "+N" indicator after 3 visible

**Priority:** Must-have

### Feature 2: Task Card Side Panel (expanded view)

**Description:** When a task card is expanded (double-click or expand button), a side panel slides in from the right showing full task details with inline editing.

**Side panel displays (all editable):**
- Title (editable heading)
- Description (rich text, Tiptap editor)
- Status dropdown (Not Started / In Progress / Complete)
- Priority dropdown (Low / Medium / High)
- Assignee field
- Due date picker
- Tags (add/remove)
- Subtasks checklist (add, check off, reorder)
- Activity log (creation time, status changes)

**User flow:**
1. User double-clicks a task card (or clicks expand button when selected)
2. Side panel slides in from the right using `slideIn` with `spring.snappy`
3. User edits any field inline — changes sync immediately to the on-canvas card
4. User closes panel via Escape key, close button, or clicking outside
5. Panel exit uses `duration.fast`

**Acceptance criteria:**
- [ ] Double-click or expand button opens side panel
- [ ] Side panel slides in from right with spring animation
- [ ] All fields are editable inline
- [ ] Changes sync immediately to the on-canvas card representation
- [ ] Escape key or close button dismisses the panel
- [ ] Panel width: 400px (consistent with existing expanded artifact pattern)
- [ ] Subtasks support add, check off, delete, and drag-to-reorder

**Priority:** Must-have

### Feature 3: AI Agent Tools

**Description:** New agent tools (`createTaskCard`, `updateTaskCard`) so the AI can create and manage task cards during conversations.

**createTaskCard parameters:**
- `title` (string, required)
- `description` (string, optional — HTML content)
- `status` (enum: "not_started" | "in_progress" | "complete", default: "not_started")
- `priority` (enum: "low" | "medium" | "high", default: "medium")
- `assignee` (string, optional)
- `dueDate` (string, optional — ISO date)
- `tags` (string[], optional)
- `subtasks` (array of {title, completed}, optional)
- `x` (number, required)
- `y` (number, required)

**updateTaskCard parameters:**
- `id` (string, required — existing shape ID)
- All fields from createTaskCard (optional — only update provided fields)

**User flow:**
1. User asks AI to "break this document into tasks" or "create a task for the auth work"
2. AI calls `createTaskCard` with appropriate parameters
3. Task card appears on canvas with animation
4. AI can later call `updateTaskCard` to change status, add subtasks, etc.

**Acceptance criteria:**
- [ ] `createTaskCard` tool creates a task card at specified coordinates
- [ ] `updateTaskCard` tool modifies existing task card fields
- [ ] AI receives task card data in canvas context (ID, title, status, priority)
- [ ] Tools follow existing naming conventions (verb-first camelCase)
- [ ] Tool return JSON matches existing pattern (`{ created: "taskcard", id, ...args }`)

**Priority:** Must-have

### Feature 4: Canvas Context for AI

**Description:** Task cards appear in the AI's canvas context so it can reference and reason about existing tasks.

**Context format:**
```
- [ID: taskcard-abc] "Implement auth flow" (taskcard, status:in_progress, priority:high, assignee:Mark)
```

**Acceptance criteria:**
- [ ] Task cards appear in the structured canvas state sent to the AI
- [ ] Context includes: ID, title, status, priority, assignee
- [ ] AI can reference task cards by ID for updates

**Priority:** Must-have

## Functional Requirements

### Data Model

```typescript
// Task card shape props (stored in tldraw shape)
interface TaskCardProps {
  w: number;              // Width (resizable)
  h: number;              // Height (auto-calculated)
  title: string;
  description: string;    // HTML content
  status: "not_started" | "in_progress" | "complete";
  priority: "low" | "medium" | "high";
  assignee: string;
  dueDate: string;        // ISO date string or empty
  tags: string[];
  subtasks: Array<{
    id: string;
    title: string;
    completed: boolean;
  }>;
}
```

### Shape Registration

- Define `TaskCardShapeUtil` extending `ShapeUtil<ITaskCardShape>`
- Register in `Canvas.tsx` alongside existing custom shapes
- Type: `"taskcard"` (following existing convention: `"document"`, `"datatable"`)

### Side Panel Integration

- Dispatch `shape:focus` custom event with `shapeType: "taskcard"`
- Extend `FocusedShape` interface to include `taskcard` type
- Create `TaskCardPanel` component rendered in the focus mode overlay or as a right-side panel
- Panel receives shape data and provides inline editing
- Edits call `editor.updateShape()` to sync back to canvas

### Storage

- Task card data is stored within the tldraw shape props (same as documents and tables)
- Canvas snapshot serialization handles task cards automatically
- No separate database or API routes needed — piggyback on existing canvas save/load

## User Flows

### Main Flow: Create and Edit

1. AI creates task card via `createTaskCard` tool (or user creates via future UI)
2. Card appears on canvas with animation
3. User scans card metadata at a glance
4. User double-clicks to expand into side panel
5. User edits fields (status, description, subtasks)
6. Changes reflect immediately on the canvas card
7. User closes panel, continues working

### Alternative Flow: AI Updates Tasks

1. AI notices a task is complete based on conversation context
2. AI calls `updateTaskCard` to change status to "complete"
3. On-canvas card updates with status badge change
4. User sees the update reflected immediately

### Alternative Flow: Batch Task Creation

1. User asks AI to "break this plan into tasks"
2. AI reads the document/plan on canvas
3. AI calls `createTaskCard` multiple times with layout engine positioning
4. Cards appear in a grid or flow layout, connected to the source document

### Error/Edge Cases

- **Missing fields:** Default values applied (status: not_started, priority: medium, empty description)
- **Long titles:** Truncated to 2 lines on-canvas, full title in side panel
- **Many tags:** Show first 3, "+N" overflow badge
- **Panel open + canvas interaction:** Panel closes when user starts interacting with canvas elsewhere
- **Concurrent AI update while panel open:** Panel reflects changes in real-time

## Technical Requirements

### Architecture

Follow existing patterns exactly:

| Concern | Pattern | Reference |
|---------|---------|-----------|
| Shape definition | `ShapeUtil` subclass | `DocumentShapeUtil.tsx` |
| Type augmentation | `TLGlobalShapePropsMap` module augment | `DocumentShapeUtil.tsx` |
| Props schema | Zod `T.*` types | `DocumentShapeUtil.tsx` |
| Shape registration | `shapeUtils` array in `Canvas.tsx` | `Canvas.tsx:815` |
| Expand interaction | `shape:focus` CustomEvent dispatch | `DocumentShapeUtil.tsx:107` |
| AI tools | `tool()` from `@openai/agents` with Zod params | `chat/route.ts` |
| Canvas context | `ShapeInfo` type in canvas state builder | `chat/route.ts` |
| Motion | Import from `@/lib/motion` | `motion-system.md` |
| Design tokens | Tailwind utilities, Miro DS components | `design-system.md` |

### File Structure

```
src/
  shapes/
    TaskCardShapeUtil.tsx          # Shape definition + on-canvas render
    TaskCardPanel.tsx              # Side panel component (expanded view)
  components/
    Canvas.tsx                     # Register TaskCardShapeUtil (modify)
    FocusModeOverlay.tsx           # Handle taskcard focus type (modify)
  app/
    api/
      chat/
        route.ts                  # Add createTaskCard + updateTaskCard tools (modify)
```

### Performance

- On-canvas card should render with minimal React re-renders (memo components)
- Side panel lazy-loads Tiptap editor only when opened
- Card height auto-sizing uses `AutoSizeWrapper` pattern (ResizeObserver)

### Browser Support

Same as existing app — modern browsers (Chrome, Firefox, Safari, Edge).

### Accessibility

- Card: role="button" with aria-label including title and status
- Side panel: focus trapped when open, Escape to close
- Status and priority: visible labels (not color-only)
- Subtask checkboxes: proper label associations

## Success Metrics

- **Functional:** All acceptance criteria pass
- **Performance:** Task cards render without jank; side panel opens within 200ms
- **Integration:** AI can create/update task cards and they appear in canvas context
- **Consistency:** Task card visual style is indistinguishable from the rest of the design system

## Constraints and Considerations

- **No external integrations.** Task cards are canvas-native. No Jira/Linear sync in this iteration.
- **No database.** Task data lives in tldraw shape props, saved with the canvas JSON.
- **No real-time collaboration for subtasks.** Unlike documents (which use Liveblocks/Tiptap), subtask editing is local. This is acceptable for v1.
- **Layout engine.** When AI creates multiple task cards, use the layout engine for positioning — never hardcode coordinates.

## Out of Scope

- Drag-and-drop between task cards (Kanban board mode)
- Task card templates or presets
- External tool integrations (Jira, Linear, Asana)
- Task dependencies / blocking relationships
- Time tracking or effort estimation
- Notifications or reminders
- Collaborative real-time subtask editing (Liveblocks)
- User-facing "create task card" button (AI-only creation for v1)

## Validation Plan

### Frontend Validation

```bash
# TypeScript compiles
npx tsc --noEmit

# Build succeeds
npm run build

# Lint passes
npm run lint

# Dev server starts without errors
npm run dev
```

### Shape Validation

- Create a task card via AI chat: "Create a task card for implementing user authentication"
- Verify card appears on canvas with correct metadata
- Verify card is draggable and selectable
- Verify card connects with arrows to other shapes
- Verify card resizes (width) correctly

### Side Panel Validation

- Double-click task card to open panel
- Edit title, description, status, priority, assignee, due date
- Verify changes reflect on canvas card immediately
- Close panel with Escape key
- Close panel with close button
- Verify panel animation matches spring tokens

### AI Tool Validation

- Ask AI: "Create a task card for auth work, high priority, assign to Mark"
- Verify `createTaskCard` tool fires with correct params
- Ask AI: "Mark that task as complete"
- Verify `updateTaskCard` tool fires with status change
- Ask AI: "What tasks are on the canvas?"
- Verify AI can see task card in context

### Motion Validation

- Slow animations to 0.25x in DevTools
- Verify card entry uses `fadeInScale` (subtle scale from 0.95 + fade)
- Verify panel slides in with spring physics (slight overshoot)
- Verify panel exit is snappy (`duration.fast`)

### Regression Testing

- Verify existing document shapes still work (create, edit, focus mode)
- Verify existing data table shapes still work
- Verify canvas save/load includes task card data
- Verify AI context includes task cards alongside other shapes
