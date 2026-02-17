# PRD: Gantt Chart Canvas Format

## Executive Summary

Add a Gantt chart as a new canvas format using `@svar-ui/react-gantt`, following the same pattern as existing custom shapes (Document, DataTable, TaskCard). Users can create Gantt charts from the toolbar or via AI, view them as compact shapes on the canvas, and expand them into a focus-mode overlay for full interactive editing (drag to resize tasks, add dependencies, zoom scales).

### Value Proposition

Project planning is a core use case for the canvas. Currently, users can create task cards, tables, and documents — but there's no way to visualize project timelines with dependencies. A Gantt chart fills this gap, giving users a visual timeline view that integrates naturally with the canvas's AI-first workflow.

### Problem Being Solved

Users working on project plans, roadmaps, or sprint planning need a temporal view of tasks with dependencies, milestones, and progress tracking. Without a Gantt chart, they must leave the canvas to use external tools.

---

## Target Users

- **Product managers** planning roadmaps and quarterly timelines
- **Project managers** tracking task dependencies and milestones
- **Team leads** visualizing sprint plans and resource allocation
- **Anyone** using the AI to generate project plans who needs a visual timeline

---

## Feature Specifications

### Feature 1: Gantt Chart Shape (Canvas Object)

**Description:** A new tldraw custom shape (`ganttchart`) that renders a compact preview of a Gantt chart on the canvas. Shows task bars on a timeline at a glance, with an expand button to enter focus mode.

**User Flow:**
1. User clicks the Gantt chart toolbar button (or AI creates one)
2. A Gantt chart shape appears on the canvas at viewport center
3. The shape shows a compact, read-only preview of the Gantt data
4. The shape is resizable and movable like other canvas objects
5. An expand button (top-right) opens focus mode for full interaction

**Acceptance Criteria:**
- Shape renders on canvas with correct dimensions (default 700x400)
- Shape is resizable via drag handles
- Shape shows a compact preview of the Gantt timeline
- Expand button visible on hover, opens focus mode overlay
- Shape border style matches existing Document/DataTable shapes
- Shape data persists in canvas JSON (tasks, links, scales, columns)

**Priority:** Must-have

### Feature 2: Focus Mode Overlay (Full Interaction)

**Description:** When expanded, the Gantt chart renders in the existing `FocusModeOverlay` at near-fullscreen size. In focus mode, users get the full `@svar-ui/react-gantt` experience: drag to resize tasks, create dependencies, edit task details, zoom in/out, add/delete tasks.

**User Flow:**
1. User clicks expand on a Gantt shape (or double-clicks it)
2. Focus mode overlay appears with backdrop dimming
3. Full interactive Gantt chart fills the overlay
4. User can: drag task bars, resize durations, add/remove tasks, create dependency links, zoom timeline
5. Changes auto-save back to the shape's props
6. User closes with Escape or the close button
7. Canvas shape updates to reflect changes

**Acceptance Criteria:**
- Focus mode overlay opens with spring animation (matching existing pattern)
- Full @svar-ui/react-gantt functionality available (drag, resize, dependencies)
- Toolbar within focus mode for add task, delete task, zoom
- Changes persist to shape props on every edit
- Escape closes overlay, canvas shape reflects latest state
- Overlay size: near-fullscreen (inset 48px on all sides, matching datatable/doc pattern)

**Priority:** Must-have

### Feature 3: Toolbar Icon

**Description:** Add a Gantt chart icon to the canvas toolbar, between the Task Card button and the AI input separator.

**User Flow:**
1. User sees Gantt chart icon in toolbar
2. Clicks it
3. New Gantt chart shape created at viewport center with default data

**Acceptance Criteria:**
- Icon appears in toolbar after Task Card button
- Clicking creates a Gantt chart shape at viewport center
- Uses a bar-chart style icon from Miro design system (IconTimeline or IconBarChart) — if none suitable, use a custom SVG

**Priority:** Must-have

### Feature 4: AI Tool Integration

**Description:** Add a `createGanttChart` tool to the AI agent so it can generate Gantt charts from natural language requests like "Create a project plan for launching a new product."

**User Flow:**
1. User asks AI: "Create a project timeline for the Q2 launch"
2. AI calls `createGanttChart` with tasks, dependencies, and milestones
3. Gantt chart appears on canvas with AI-generated data
4. User can expand and refine

**Acceptance Criteria:**
- AI tool `createGanttChart` available in the agent tool set
- Tool accepts: chart title, array of tasks (with start/end dates, text, progress, parent, type), array of links (dependencies)
- Tool creates the shape on canvas using layout engine for positioning
- AI can generate realistic project timelines with proper dependencies

**Priority:** Must-have

---

## Functional Requirements

### Data Model

The Gantt chart shape stores all data in its tldraw shape props:

```typescript
interface GanttChartShapeProps {
  w: number;          // Width of shape on canvas
  h: number;          // Height of shape on canvas
  title: string;      // Chart title (shown in header)
  tasks: GanttTask[]; // Task data for the Gantt component
  links: GanttLink[]; // Dependency links between tasks
  scales: GanttScale[]; // Timeline scale configuration
  columns: GanttColumn[]; // Left panel column config
}

interface GanttTask {
  id: number;
  text: string;
  start: string;      // ISO date string (serializable)
  end: string;        // ISO date string (serializable)
  progress: number;   // 0-100
  parent: number;     // Parent task ID (0 = root)
  type: string;       // "task" | "summary" | "milestone"
  open: boolean;      // Whether subtasks are expanded
}

interface GanttLink {
  id: number;
  source: number;     // Source task ID
  target: number;     // Target task ID
  type: string;       // "e2s" | "s2s" | "e2e" | "s2e"
}

interface GanttScale {
  unit: string;       // "month" | "week" | "day" | "hour"
  step: number;
  format: string;     // Date format string
}

interface GanttColumn {
  id: string;         // Column identifier
  header: string;     // Column header text
  width: number;      // Column width in pixels
  align?: string;     // "left" | "center" | "right"
}
```

### Default Data

When created from the toolbar, a Gantt chart ships with sensible defaults:
- **Title:** "Project Timeline"
- **Tasks:** 5 sample tasks spanning 4 weeks from today
  - Phase 1: Planning (week 1, summary)
  - Task 1.1: Requirements (3 days)
  - Task 1.2: Design (3 days)
  - Phase 2: Implementation (weeks 2-4, summary)
  - Task 2.1: Development (10 days)
- **Links:** Task 1.1 → Task 1.2 (e2s), Task 1.2 → Task 2.1 (e2s)
- **Scales:** Month + Week (day-level zoom available in focus mode)
- **Columns:** Task name (210px), Start date (106px), Add task button (40px)

### Shape Rendering

**On Canvas (Compact Mode):**
- Renders the `<Gantt>` component inside an HTMLContainer
- Pointer events disabled on the Gantt itself (canvas handles drag/resize)
- Pointer events enabled only on the expand button
- Scale: render at native size, clip to shape bounds
- Title bar at top with chart name + expand button
- Border: 1px solid `rgba(0,0,0,0.08)` with `border-radius: 12px` (matching DataTable/Document)

**In Focus Mode (Full Interaction):**
- Renders inside `FocusModeOverlay` component
- Full pointer interactivity (drag bars, create links, click to edit)
- Toolbar above or integrated for add/delete/zoom
- Title editable in focus mode
- Auto-saves changes to shape props via editor.updateShape()

### Integration Points

**Canvas.tsx:**
- Import `GanttChartShapeUtil` and add to `customShapeUtils` array
- Add `onCreateGanttChart` callback for toolbar
- Add `ganttchart` to `FocusedShape.shapeType` union

**Toolbar.tsx:**
- Add `onCreateGanttChart` prop
- Add toolbar button with icon

**FocusModeOverlay.tsx:**
- Add `ganttchart` case for rendering the interactive Gantt component
- Pass shape props to Gantt component
- Wire up change handlers to update shape

**chat/route.ts (AI Agent):**
- Add `createGanttChart` tool with Zod schema
- Tool creates shape via return value (matching createShape pattern)

---

## Technical Requirements

### Package Installation

```bash
npm install @svar-ui/react-gantt
```

The package is MIT-licensed, supports React 18/19, and has TypeScript definitions.

### CSS Import

The Gantt component requires its CSS:
```typescript
import "@svar-ui/react-gantt/all.css";
```

This must be imported in the component file that renders the Gantt. To prevent CSS conflicts, scope the import to the Gantt shape/focus components.

### Theme Integration

Use CSS variable overrides to match the canvas design system:
```css
.gantt-container {
  --wx-background: #ffffff;
  --wx-color-primary: #4262FF;  /* Miro blue */
  --wx-font-family: inherit;
}
```

### Date Serialization

tldraw shape props must be JSON-serializable. Dates are stored as ISO strings and converted to `Date` objects when passed to the Gantt component:
```typescript
const ganttTasks = props.tasks.map(t => ({
  ...t,
  start: new Date(t.start),
  end: new Date(t.end),
}));
```

### State Architecture

```
Shape Props (source of truth, JSON-serializable)
  ↓ read on render
Gantt Component (renders from props)
  ↓ user edits (drag, resize, add)
API event handlers → update shape props via editor.updateShape()
  ↓ triggers re-render
Shape re-renders with new props
```

### File Structure

```
src/shapes/
  GanttChartShapeUtil.tsx    — Shape definition + compact preview
  GanttChartFocusPanel.tsx   — Focus mode interactive panel
  gantt-theme.css            — CSS variable overrides for Gantt
```

---

## User Flows

### Main Flow: Create from Toolbar
1. Click Gantt chart icon in toolbar
2. Shape appears at viewport center (700x400)
3. Shows default project timeline data
4. Hover reveals expand button (top-right)
5. Click expand → focus mode with full interactivity
6. Edit tasks, drag bars, add dependencies
7. Close → shape updates on canvas

### AI Flow: Generate from Prompt
1. User: "Create a project plan for the mobile app redesign"
2. AI generates tasks with dates, dependencies, milestones
3. AI calls `createGanttChart` tool
4. Gantt shape appears on canvas with AI-generated data
5. User expands to refine

### Edit Flow: Focus Mode Interaction
1. Double-click or expand Gantt shape
2. Focus mode overlay opens (spring animation)
3. Available actions:
   - Drag task bar left/right to change dates
   - Drag task bar edges to resize duration
   - Click empty area to add task
   - Right-click for context menu (add/edit/delete)
   - Drag between tasks to create dependency link
   - Zoom timeline (day/week/month)
   - Edit task name inline
   - Edit title inline
4. All changes auto-save
5. Escape or click backdrop to close

### Error/Edge Cases
- **Empty Gantt:** If all tasks deleted, show "No tasks yet" placeholder with "Add task" button
- **Invalid dates:** Clamp to reasonable range, don't allow end before start
- **Very long projects:** Zoom to fit on open, allow scroll/pan in focus mode
- **Shape too small:** Below minimum size (300x200), show title only + expand hint

---

## Success Metrics

- Gantt chart renders correctly on canvas and in focus mode
- All SVAR Gantt interactive features work in focus mode (drag, resize, dependencies)
- AI can generate meaningful project timelines
- Data persists correctly through canvas save/load cycles
- No CSS conflicts between Gantt styles and existing canvas styles
- Performance: no lag when rendering Gantt chart shapes

---

## Constraints & Considerations

- **CSS Isolation:** The Gantt component's CSS (`all.css`) must not leak into the rest of the app. Use a scoped container class.
- **Pointer Event Management:** On canvas, the Gantt must not capture pointer events (canvas handles drag/select). In focus mode, the Gantt must capture all pointer events.
- **Serialization:** All shape data must be JSON-serializable (no Date objects, functions, or class instances in props).
- **Bundle Size:** @svar-ui/react-gantt adds to the bundle. Use dynamic import (`next/dynamic`) if the shape is not on every canvas.
- **tldraw Compatibility:** The HTMLContainer approach works for embedding React components in shapes (proven by DataTable and Document shapes).

---

## Out of Scope

- **Gantt PRO features:** Auto-scheduling, baselines, critical path, working calendars (these require the paid PRO license)
- **Gantt ↔ TaskCard sync:** Syncing Gantt tasks with TaskCard shapes on the same canvas
- **Multi-user real-time editing:** The Gantt chart within focus mode is single-user; canvas-level collaboration via Liveblocks handles shape-level sync
- **Export to MS Project or PDF:** Not in initial scope
- **Resource management / swimlanes:** Not in initial scope

---

## Validation Plan

### Shape Layer
- Shape creates without errors from toolbar click
- Shape appears at correct position (viewport center)
- Shape is resizable and movable
- Shape renders compact Gantt preview
- Shape data persists through canvas save/load (refresh page, data still there)

### Focus Mode Layer
- Focus overlay opens with animation
- Full Gantt interactivity works (drag, resize, add, delete tasks)
- Dependency links can be created and render correctly
- Timeline zoom works (day/week/month)
- Changes save back to shape props
- Escape closes overlay
- Canvas shape reflects latest state after close

### AI Tool Layer
- AI `createGanttChart` tool appears in tool set
- AI can generate task data from natural language
- Generated Gantt chart renders correctly on canvas
- Generated dependencies are valid (source/target IDs match real tasks)

### Integration Layer
- `npm run build` succeeds (TypeScript compiles)
- `npm run lint` passes
- `npm run dev` starts without errors
- No CSS conflicts (Gantt styles scoped, don't affect toolbar/sidebar/canvas)
- No pointer event conflicts (canvas drag works over Gantt shape, focus mode captures events)

### End-to-End Flow
1. Start dev server
2. Click Gantt icon in toolbar → shape appears
3. Double-click shape → focus mode opens
4. Drag a task bar → duration changes
5. Add a new task → appears in list
6. Create a dependency link → arrow renders
7. Close focus mode → shape updates
8. Refresh page → data persists
9. Ask AI "Create a project timeline" → Gantt chart created with tasks
