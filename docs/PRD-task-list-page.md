# PRD: Task List Page

## Executive Summary

Build a dedicated **Task List page** inspired by Todoist, providing a focused task management surface within the canvas prototype. This surfaces tasks from across all spaces in a single, scannable list view — complementing the spatial canvas view where tasks exist as shape objects.

The page leverages interaction patterns from the interaction sandbox and integrates with the existing `TaskCardShapeUtil` data model to provide a list-view counterpart to on-canvas task cards.

**Core value proposition:** Users need a linear, focused view of all their tasks — something the infinite canvas doesn't optimize for. This page gives them Todoist-level task management without leaving the app.

## Target Users

- **Primary:** Knowledge workers managing tasks across multiple spaces/canvases
- **Pain points:** Tasks scattered across canvases are hard to see holistically. Need a "what do I need to do today?" view.
- **Goals:** See all tasks in one place, quickly update status, filter by priority/space/date, feel productive

## Current State

- **Task Card Shape** (`TaskCardShapeUtil`) exists on canvas with: title, status (Not Started / In Progress / Complete), priority (Low / Medium / High), assignee, due date, tags
- **Plan/Task Execution UI** (`TaskList.tsx`) exists but is a runtime plan execution component, not a persistent task list
- **Navigation** already has a "Tasks" nav item in both `PrimaryRail.tsx` and `ExpandedPrimaryPanel.tsx`
- **No dedicated task list page exists** — the nav item currently links to `/tasks` but the route is not implemented

## Feature Specifications

### Feature 1: Task List Page Route

**Description:** Create a new page at `/tasks` within the `(home)` route group that displays all tasks in a linear list format.

**User flow:**
1. User clicks "Tasks" in the navigation rail or expanded panel
2. Page transitions in following "Seamless Surface" principles (no hard page load)
3. Task list renders with all tasks grouped by section (Today, Upcoming, Overdue, Completed)
4. User can interact with tasks inline

**Acceptance criteria:**
- [ ] `/tasks` route exists and renders the task list page
- [ ] Page is accessible from navigation rail and expanded panel
- [ ] Page transition follows surface architecture guidelines (spring-based, directional)
- [ ] Page renders within the existing layout structure (sidebar + content area)

**Priority:** Must-have

### Feature 2: Task List View

**Description:** A Todoist-inspired vertical list of tasks with inline editing, status toggling, and metadata display.

**List structure:**
```
─── Today (3) ────────────────────────────────
☐  Review Q4 budget proposal          High  ·  FlexFund  ·  Due today
☐  Approve marketing assets           Med   ·  Brand     ·  Due today
☐  Respond to client feedback          Low   ·  FlexFund  ·  Due today

─── Upcoming (5) ─────────────────────────────
☐  Prepare board presentation          High  ·  FlexFund  ·  Feb 28
☐  Review competitor analysis          Med   ·  Strategy  ·  Mar 1
...

─── Completed (12) ───────────────────────────
☑  Finalize Q3 report                  Med   ·  FlexFund  ·  Completed yesterday
```

**Each task row shows:**
- Checkbox (toggles status: Not Started ↔ Complete)
- Title (inline editable on click)
- Priority badge (colored: red=High, yellow=Medium, gray=Low)
- Space name (links to space)
- Due date or completion date
- Assignee avatar (if assigned)

**Interactions:**
- Click checkbox: Toggle complete/incomplete with satisfying animation
- Click title: Inline edit mode
- Click row (not checkbox/title): Expand to show details panel
- Hover: Reveal action icons (edit, move to space, delete)
- Drag: Reorder within section

**Acceptance criteria:**
- [ ] Tasks displayed in sectioned list (Today, Upcoming, Overdue, Completed)
- [ ] Each task shows: checkbox, title, priority, space, due date
- [ ] Checkbox toggles task status with animation
- [ ] Title is inline editable
- [ ] Row hover reveals action icons
- [ ] Completed section is collapsible
- [ ] Empty state shows encouraging message with "Create task" prompt

**Priority:** Must-have

### Feature 3: Task Filtering and Sorting

**Description:** Filter bar at top of task list allowing users to narrow down visible tasks.

**Filters:**
- **Space:** Dropdown to filter by space (All / specific space)
- **Priority:** Toggle chips (High / Medium / Low)
- **Status:** Toggle chips (Active / Completed)
- **Assignee:** Dropdown (Me / All / specific person)

**Sorting:**
- Due date (default)
- Priority
- Recently created
- Alphabetical

**Acceptance criteria:**
- [ ] Filter bar renders above task list
- [ ] Space filter shows all spaces from Supabase
- [ ] Priority filter toggles visibility of priority levels
- [ ] Filters animate in/out using motion tokens
- [ ] Active filter count shown on filter bar
- [ ] Filters persist during session (reset on page reload)

**Priority:** Should-have

### Feature 4: Task Creation

**Description:** Quick-add task input at the top of the list, similar to Todoist's "Add task" field.

**User flow:**
1. User clicks "+" button or presses keyboard shortcut
2. Inline input appears at top of current section
3. User types title, optionally sets priority/due date via quick commands
4. Press Enter to create, Escape to cancel
5. Task appears in list with `fadeInUp` animation

**Acceptance criteria:**
- [ ] Quick-add input at top of task list
- [ ] Task created with title (required), default status "Not Started"
- [ ] Priority and due date settable inline or via follow-up
- [ ] New task animates in using `fadeInUp` with `spring.snappy`
- [ ] Task syncs to relevant canvas as a TaskCard shape (if space selected)

**Priority:** Should-have

### Feature 5: Task-Canvas Integration

**Description:** Tasks in the list view are linked to their canvas representation. Users can navigate between list and canvas views.

**Interactions:**
- "View on canvas" action on each task → navigates to canvas and zooms to the task card shape
- Creating a task in the list with a space selected also creates a `TaskCard` shape on the space's default canvas
- Status changes in list view propagate to canvas shape and vice versa

**Acceptance criteria:**
- [ ] Tasks link to their canvas shape (if one exists)
- [ ] "View on canvas" navigates and zooms to the shape
- [ ] Status changes sync bidirectionally between list and canvas
- [ ] Tasks without a canvas shape show "Add to canvas" action

**Priority:** Nice-to-have

## Functional Requirements

### Data Model
Tasks need a persistent data model. Options:

**Option A: Supabase table (recommended)**
```sql
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'not_started', -- not_started, in_progress, complete
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
  due_date TIMESTAMPTZ,
  assignee_id TEXT,
  space_id UUID REFERENCES spaces(id),
  canvas_id UUID REFERENCES canvases(id),
  canvas_shape_id TEXT, -- tldraw shape ID if linked to canvas
  tags TEXT[],
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

**Option B: Extend existing feed items**
Not recommended — feed items are read-only display items, not mutable tasks.

### API Routes
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/tasks` | List all tasks (with filters) |
| POST | `/api/tasks` | Create a task |
| PUT | `/api/tasks/[taskId]` | Update a task |
| DELETE | `/api/tasks/[taskId]` | Delete a task |
| PATCH | `/api/tasks/reorder` | Reorder tasks |

All routes must follow the `requireAuth()` pattern from CLAUDE.md.

### State Management
- Tasks loaded via `useTasks()` custom hook (fetch on mount, optimistic updates)
- Task mutations use optimistic UI pattern (update locally, sync to server)
- No global state library — React hooks + context if needed

## Technical Requirements

### Key Files to Create
| File | Purpose |
|------|---------|
| `src/app/(home)/tasks/page.tsx` | Task list page |
| `src/components/tasks/TaskListView.tsx` | Main task list component |
| `src/components/tasks/TaskRow.tsx` | Individual task row |
| `src/components/tasks/TaskFilters.tsx` | Filter bar component |
| `src/components/tasks/TaskQuickAdd.tsx` | Quick-add input |
| `src/hooks/useTasks.ts` | Task data hook |
| `src/app/api/tasks/route.ts` | Tasks CRUD API |
| `src/app/api/tasks/[taskId]/route.ts` | Single task API |

### Key Files to Modify
| File | Changes |
|------|---------|
| `src/components/PrimaryRail.tsx` | Ensure Tasks nav item links to `/tasks` |
| `src/components/ExpandedPrimaryPanel.tsx` | Ensure Tasks nav item links to `/tasks` |

### Dependencies
- Framer Motion (existing) — animations
- `@/lib/motion` — motion tokens
- Supabase (existing) — data persistence
- No new dependencies expected

## Constraints & Considerations

- **Demo data:** For prototype purposes, task data can be seeded from a JSON file (like feed items) with an option to use Supabase for persistence.
- **Performance:** List should handle 100+ tasks without jank. Use virtualization if needed (but likely not for prototype).
- **Accessibility:** Tasks must be keyboard navigable. Checkbox, edit, and action operations accessible via keyboard.
- **Interaction sandbox:** Check the interaction sandbox for task list interaction patterns to port.

## Out of Scope

- Task notifications/reminders
- Recurring tasks
- Task comments/threads
- Task dependencies (blocked by)
- Mobile-optimized layout
- Real-time collaborative task editing

## Validation Plan

### Build Validation
```bash
npm run build
npm run lint
```

### API Validation
```bash
# Tasks CRUD
curl -X POST /api/tasks -d '{"title": "Test task", "priority": "high"}'
curl -X GET /api/tasks
curl -X PUT /api/tasks/{id} -d '{"status": "complete"}'
curl -X DELETE /api/tasks/{id}
```

### Visual Validation
- [ ] Task list page renders at `/tasks` route
- [ ] Tasks grouped correctly (Today, Upcoming, Overdue, Completed)
- [ ] Checkbox animation is satisfying (check appears with spring)
- [ ] Inline editing works (click title, edit, press Enter)
- [ ] Hover actions appear smoothly
- [ ] Empty state renders when no tasks exist
- [ ] Filter bar works and animates

### Integration Validation
- [ ] Navigation "Tasks" link works from rail and expanded panel
- [ ] Page transition follows seamless surface principles
- [ ] Creating a task persists across page reload
