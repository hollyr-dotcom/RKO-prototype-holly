# PRD: Tool Overflow Menu

## Executive Summary

Build out the **tool overflow menu** from the canvas toolbar to fully explore and showcase the toolbar's creation capabilities. The current "plus" menu provides basic access to additional tools, but needs to be expanded into a comprehensive, well-organized tool browser that makes discovery delightful and creation effortless.

**Core value proposition:** The toolbar is the primary creation interface alongside the AI prompt. The overflow menu is where users discover what they can create — it should feel like opening a well-organized toolbox, not scrolling through a flat list.

## Target Users

- **Primary:** Users exploring canvas creation capabilities
- **Pain points:** Current plus menu is a flat list of custom shapes and tldraw tools. Hard to discover what's available. No visual previews.
- **Goals:** Quickly find and select the right creation tool. Discover capabilities they didn't know existed. Feel empowered by the range of options.

## Current State

### Toolbar (`src/components/toolbar/Toolbar.tsx`)
- **Primary tools** (7 items): Select, Comment, Pen, Sticky Note, Shapes, Emoji, More (+)
- **Toolbar dimensions:** 60px height, 8px padding, 24px radius
- **Chat input:** 246px unfocused, 404px focused

### Plus Menu (`src/components/toolbar/PlusMenu.tsx`)
Current overflow menu features:
- Triggered by "More" (+) button
- Two groups: "Custom shapes" and "tldraw tools"
- Searchable filter input (sticky at top)
- Max height 380px with scroll
- Spring animation (stiffness: 500, damping: 30)
- Click-outside and Escape to close

### Overflow Menu Items (`src/components/toolbar/toolbar-data.tsx`)
**Custom shapes (7):**
- task-card, slack-card, approve, document, data-table, timeline, kanban

**tldraw tools (4):**
- text, frame, line, eraser

**Total: 11 items** in a flat searchable list.

## Feature Specifications

### Feature 1: Categorized Tool Grid

**Description:** Reorganize the overflow menu from a flat list into a categorized grid with visual previews and clear groupings.

**Proposed categories:**

| Category | Tools | Description |
|----------|-------|-------------|
| **Essentials** | Text, Frame, Line, Eraser, Arrow | Core tldraw creation tools |
| **Cards & Content** | Sticky Note, Document, Task Card, Slack Card | Rich content containers |
| **Data & Visualization** | Data Table, Chart shape, Kanban Board, Gantt Chart/Timeline | Structured data displays |
| **Workflow** | Approve Button, People List, Connector | Process and collaboration elements |
| **Templates** | (Future) Pre-built layouts, frameworks | Ready-made canvas arrangements |

**Grid layout:**
- 3 or 4 columns of tool tiles
- Each tile: icon + label (compact)
- Category headers separate groups
- Search filters across all categories
- Compact view: ~280-320px wide

**Acceptance criteria:**
- [ ] Tools organized into logical categories
- [ ] Grid layout with category headers
- [ ] Each tool shows icon and label
- [ ] Search filters across all categories
- [ ] Category headers collapse/expand (optional)
- [ ] Layout fits comfortably above toolbar

**Priority:** Must-have

### Feature 2: Tool Tile Design

**Description:** Each tool tile in the menu should be visually clear and interactive, showing what it creates at a glance.

**Tile anatomy:**
```
┌─────────────┐
│    [icon]    │  ← 24px icon from Miro Design System
│   Label      │  ← text-xs, font-medium, centered
└─────────────┘
```

**Tile dimensions:**
- Width: ~72px (fits 4 per row in 320px menu)
- Height: ~64px
- Padding: 8px
- Border radius: `rounded-lg` (8px)
- Background: transparent default, `gray-100` on hover

**Tile interactions:**
- Hover: Background highlight + subtle scale (`scalePress` variant)
- Click: Activates tool, closes menu
- Keyboard: Tab between tiles, Enter to select

**Acceptance criteria:**
- [ ] Tiles show icon + label in compact format
- [ ] Hover state with background highlight
- [ ] Click activates the correct tool
- [ ] Keyboard navigation works (Tab + Enter)
- [ ] Animation on hover uses motion tokens (`scalePress` variant)

**Priority:** Must-have

### Feature 3: Enhanced Search Experience

**Description:** Improve the search functionality to feel more intelligent and helpful.

**Enhancements:**
- Search by category name (typing "data" shows Data & Visualization tools)
- Search by tool description (typing "board" finds Kanban Board)
- Highlight matching text in results
- Show "No results" state with suggestion ("Try searching for...")
- Clear button (×) when search has text

**Search behavior:**
- Instant filtering (no debounce needed for this small set)
- When search is active, categories flatten into a single list of results
- When search is cleared, categories re-appear

**Acceptance criteria:**
- [ ] Search matches tool name, category, and description
- [ ] Matching text highlighted in results
- [ ] Empty state shows helpful message
- [ ] Clear button appears when search has text
- [ ] Categories flatten during active search
- [ ] Search input has focus on menu open

**Priority:** Should-have

### Feature 4: Tool Preview Tooltips

**Description:** When hovering over a tool tile, show a brief tooltip with a description of what the tool creates.

**Tooltip content:**
| Tool | Tooltip |
|------|---------|
| Task Card | "Create a trackable task card with status, priority, and assignee" |
| Document | "Create a rich text document with formatting" |
| Data Table | "Create an interactive data table" |
| Kanban Board | "Create a kanban board with columns and cards" |
| Timeline/Gantt | "Create a timeline or Gantt chart" |
| Slack Card | "Create a Slack-style message card" |
| Approve Button | "Create an approval button for workflows" |
| Frame | "Create a container to group shapes" |

**Tooltip behavior:**
- Show after `delay.tooltip` (400ms) hover delay
- Position: above the tile
- Style: Miro DS tooltip or custom with `rounded-lg`, shadow, white background
- Dismiss on mouse leave or menu close

**Acceptance criteria:**
- [ ] Tooltips show on hover after 400ms delay
- [ ] Each tool has a descriptive tooltip
- [ ] Tooltips positioned correctly (above tile, within viewport)
- [ ] Tooltip styling matches design system

**Priority:** Should-have

### Feature 5: Recently Used Section

**Description:** Show a "Recently used" section at the top of the menu with the user's last 3-4 tools for quick access.

**Behavior:**
- Tracks tool usage in session (localStorage for persistence across sessions)
- Shows last 3-4 unique tools used from the overflow menu
- Section only appears if user has used tools before (not on first visit)
- "Recently used" header above the row

**Acceptance criteria:**
- [ ] "Recently used" section shows last 3-4 tools
- [ ] Usage tracked in localStorage
- [ ] Section hidden on first visit (no history)
- [ ] Recently used tools are clickable with same behavior as main grid
- [ ] Section appears above main categories

**Priority:** Nice-to-have

### Feature 6: Menu Animation and Polish

**Description:** The menu open/close animation should feel premium and aligned with the motion system.

**Open animation:**
- Menu slides up from toolbar with `fadeInScale` variant
- Spring: `spring.snappy` (stiffness: 400, damping: 30)
- Category groups stagger in with `delay.stagger` (40ms)
- Origin point: center of the "+" button

**Close animation:**
- Fade out + scale down with `duration.fast` (200ms)
- Easing: `accelerate` (exits are decisive)
- No stagger on exit (all items exit together)

**Acceptance criteria:**
- [ ] Open animation: spring-based scale + fade from toolbar
- [ ] Categories stagger in (40ms delay between groups)
- [ ] Close animation: fast fade + scale
- [ ] `AnimatePresence` for exit animation
- [ ] Animations use motion tokens from `@/lib/motion`
- [ ] Menu feels snappy and responsive (not sluggish)

**Priority:** Must-have

## Technical Requirements

### Key Files to Modify
| File | Changes |
|------|---------|
| `src/components/toolbar/PlusMenu.tsx` | Major rewrite: grid layout, categories, enhanced search |
| `src/components/toolbar/toolbar-data.tsx` | Add categories, descriptions, reorganize tool definitions |
| `src/components/toolbar/ToolbarItem.tsx` | Potentially update for grid tile rendering |
| `src/components/toolbar/toolbar-constants.ts` | Add grid dimensions, category order |

### Key Files to Create
| File | Purpose |
|------|---------|
| `src/components/toolbar/ToolTile.tsx` | Individual tool tile component |
| `src/components/toolbar/ToolCategory.tsx` | Category group component with header |

### Files NOT to Modify
| File | Reason |
|------|--------|
| `src/components/toolbar/Toolbar.tsx` | Primary tools and layout unchanged |
| `src/components/toolbar/ChatInput.tsx` | Chat input unaffected |

### Dependencies
- Framer Motion (existing) — animations
- `@/lib/motion` — motion tokens
- Miro DS Tooltip (existing) — tooltips
- No new dependencies

## Constraints & Considerations

- **Menu positioning:** Menu floats above the toolbar. Must not extend off-screen. If toolbar is near edge, adjust position.
- **Tool activation:** When a tool is selected, it should call `editor.setCurrentTool()` for tldraw tools or trigger custom shape creation for custom shapes (existing behavior in toolbar-data).
- **Keyboard accessibility:** Full keyboard navigation within the menu. Tab moves between tiles, arrow keys navigate the grid, Enter selects, Escape closes.
- **Touch devices:** Tiles should have adequate touch targets (minimum 44px).
- **Tool count:** Currently 11 tools. Design should accommodate growth to 20-30 tools without breaking the layout.

## Out of Scope

- Custom tool creation (users defining their own tools)
- Tool configuration/settings (e.g., changing default sticky note color)
- AI-suggested tools (AI recommending which tool to use)
- Drag-to-canvas from menu (click-to-activate is the pattern)
- Templates tab (listed as "Future" category placeholder)

## Validation Plan

### Build Validation
```bash
npm run build
npm run lint
```

### Visual Validation
- [ ] Menu opens from "+" button with spring animation
- [ ] Categories display with headers and grid tiles
- [ ] Tool tiles show icon + label clearly
- [ ] Hover states work on all tiles
- [ ] Menu fits within viewport (no overflow off-screen)
- [ ] Close animation is fast and decisive

### Interaction Validation
- [ ] Clicking a tool activates it and closes menu
- [ ] Search filters tools across categories
- [ ] Empty search state shows helpful message
- [ ] Keyboard navigation: Tab, Arrow keys, Enter, Escape
- [ ] Tooltips appear after 400ms hover delay
- [ ] Click-outside closes menu

### Tool Activation Validation
- [ ] Each tldraw tool (text, frame, line, eraser) activates via `editor.setCurrentTool()`
- [ ] Each custom shape (task-card, document, data-table, etc.) creates the correct shape
- [ ] Tool activation matches existing behavior (no regressions)
