# Surface Architecture

This document defines the hierarchy of surfaces in the canvas prototype, what each surface contains, and how users move between them.

---

## Surface Hierarchy

```
Home
└── Space Overview
    └── Canvas
        ├── Toolbar (bottom centre)
        ├── Masthead (top bar)
        ├── Chat Panel (right side, toggleable)
        ├── Zoom Controls (bottom left)
        ├── Starting Prompt Cards (centre, empty state)
        └── Expanded Artifacts (documents, data tables)
```

---

## Navigation System

Navigation uses a two-panel model that collapses to a compact trigger bar.

### Expanded State — Home (No Space Selected)

When the user is NOT inside a space, the primary navigation shows an expanded panel with labeled nav items and a spaces list.

```
┌──────────────┬──────────────────────────────────────┐
│ Expanded     │                                      │
│ Primary      │         Content Surface               │
│  304px       │         (white, rounded-l)            │
│              │                                      │
│ Logo         │                                      │
│ 🏠 Home     │                                      │
│ 💬 Chat     │                                      │
│ ✅ Tasks    │                                      │
│ 🔍 Search   │                                      │
│ ──────────  │                                      │
│ SPACES  [+] │                                      │
│  P Product   │                                      │
│  B Brand     │                                      │
│  U User Res  │                                      │
└──────────────┴──────────────────────────────────────┘
```

#### Expanded Primary Panel

Appears when the user is on the home route or any non-space route.

- **Width:** 304px (`EXPANDED_PRIMARY_WIDTH`)
- **Background:** `navPalette.base` (customisable — see `src/lib/nav-palette.ts`)
- **Key components:** `ExpandedPrimaryPanel`
- **Contents:**
  - Brand icon (24px) inside a `rounded-lg` container with `navPalette.logoContainer` background
  - Nav items with icon (20px) + label — Home, Chat, Tasks, Search
  - Divider (`navPalette.divider`)
  - "Spaces" section header + plus button
  - Spaces list fetched from `/api/spaces`, each with initial thumbnail + name
- **Active nav item:** `navPalette.indicator` background (animated via `layoutId`), `navPalette.textPrimary font-medium`
- **Inactive nav item:** ghost (no background), `navPalette.iconDefault` icon, `navPalette.textSecondary` label
- **Hover:** animated indicator slides to hovered item, `cubic-bezier(0.65, 0, 0.31, 1)` at 350ms
- **Space items:** ghost default, `navPalette.hoverBg` on hover, `navPalette.textSecondary`

### Expanded State — Inside a Space

When the user is inside a space, the expanded primary collapses to a 64px icon-only rail and a 240px secondary panel slides in.

```
┌────┬──────────┬──────────────────────────────────────┐
│Rail│ Secondary │                                      │
│64px│  240px    │         Content Surface               │
│    │           │         (white, rounded-l)            │
│Logo│ Space hdr │                                      │
│Home│ Overview  │                                      │
│Chat│ Agenda    │                                      │
│Task│ Attendees │                                      │
│Srch│ ...       │                                      │
│    │ Boards    │                                      │
│    │  📋 Board │                                      │
└────┴──────────┴──────────────────────────────────────┘
```

Both configurations total 304px, making navigation transitions seamless.

#### Primary Rail

The icon-only navigation rail shown when inside a space.

- **Width:** 64px (`RAIL_WIDTH`)
- **Background:** `navPalette.base` (customisable — see `src/lib/nav-palette.ts`)
- **Key components:** `PrimaryRail`
- **Contents:** Brand icon (24px) inside a `rounded-lg` container with `navPalette.logoContainer` background, then vertically stacked icon buttons — Home, Chat, Tasks, Search (40×40, 4px gap)
- **Active state:** `navPalette.indicator` background (animated via `layoutId`), `navPalette.iconActive`
- **Inactive state:** ghost (no background), `navPalette.iconDefault`

#### Secondary Panel

Appears when the user is inside a Space (route matches `/space/[spaceId]/*`).

- **Width:** 240px (`SECONDARY_WIDTH`)
- **Background:** `#f8f9fa`
- **Border-radius:** `40px` left corners (`2.5rem`)
- **Shadow:** `0px 12px 32px rgba(34,36,40,0.1)` (`shadow-surface-nav`)
- **Key components:** `SecondaryPanel`
- **Contents:**
  - Space header (name + collapse toggle)
  - Capabilities/pages list (Overview, Agenda, etc.)
  - Boards section (emoji + board name)
- **Selected item:** `bg-gray-100 text-gray-900 font-medium`
- **Unselected item:** ghost, `text-gray-600`, `hover:bg-gray-100`

### Collapsed State

Both panels fully hidden. A compact horizontal bar appears in the top-left.

- **Key components:** `CollapsedBar`
- **Contents:** Hamburger icon + Brand icon + "miro" logotype
- **Style:** White pill with subtle shadow, `border-radius: full`
- Clicking expands the full navigation

### State Management

- **Provider:** `SidebarProvider` in `src/providers/SidebarProvider.tsx`
- **Hook:** `useSidebar()` returns `{ isCollapsed, toggleSidebar, showSecondary, navWidth, navPalette }`
- **Props:** `SidebarProvider` accepts an optional `navColor` prop (hex string, defaults to `#18f9e3`)
- **Constants:** `RAIL_WIDTH = 64`, `SECONDARY_WIDTH = 240`, `EXPANDED_PRIMARY_WIDTH = 304`
- **`showSecondary`** is derived from the route — `true` when pathname starts with `/space/`
- **`navWidth`** is computed: collapsed = 0, space view = `RAIL_WIDTH + SECONDARY_WIDTH`, home = `EXPANDED_PRIMARY_WIDTH`
- **`navPalette`** is generated from `navColor` via `generateNavPalette()` in `src/lib/nav-palette.ts`. It provides all tonal colors for the primary navigation surfaces.

---

## Surfaces

### Home

The entry point. Displays a listing of Spaces the user belongs to.

- **Route:** `/`
- **Layout:** Primary Rail + content area (no secondary panel)
- **Key components:** `SpaceCard`, `HomePromptInput`, `TopBar`

### Space Overview

Shows the artifacts within a Space. Currently, Canvases are the primary artifact type.

- **Route:** `/space/[spaceId]`
- **Layout:** Primary Rail + Secondary Panel + content area
- **Key components:** `CanvasCard`, `TopBar`

### Canvas

The core working surface. A tldraw infinite canvas with custom chrome layered on top.

- **Route:** `/space/[spaceId]/canvas/[canvasId]`
- **Layout:** Primary Rail + Secondary Panel + full viewport with floating chrome
- **Key components:** `Canvas` (tldraw), `Toolbar`, `CanvasMasthead`, `ChatPanel`, `ZoomToolbar`, `StartingPromptCards`

### Canvas Chrome (Sub-surfaces)

These are persistent or toggleable UI layers that float above the canvas:

| Surface | Position | Behaviour |
|---------|----------|-----------|
| **Toolbar** | Bottom centre | Always visible. AI input + creation tools. |
| **Masthead** | Top | Always visible. Board identity (left), actions + presence (right). |
| **Chat Panel** | Right side | Toggleable slide-in panel. AI conversation history. |
| **Zoom Controls** | Bottom left | Always visible. Zoom in/out/fit. |
| **Starting Prompts** | Centre | Visible only on empty canvas. Disappears after first interaction. |

### Content Surface

The main content area to the right of the navigation.

- **Background:** `#FFFFFF`
- **Border-radius:** `40px 0 0 40px` when navigation is expanded (Figma: elevation-300 surface)
- **Shadow:** `0px 0px 8px rgba(34,36,40,0.06), 0px 6px 16px rgba(34,36,40,0.12)` (elevation-300)

### Expanded Artifacts

Documents, Data Tables, and other rich content types that can be expanded from their canvas shape into a larger editing view.

- **Behaviour:** Expand in-place or to a predefined layout width
- **Key shapes:** `DocumentShapeUtil`, `DataTableShapeUtil`

---

## Transition Model

### Surface-Level Transitions (Home <-> Space <-> Canvas)

These are the most significant transitions. They should feel fluid and spatial, never like a page load.

- **Direction:** Use directional motion to communicate hierarchy. Drilling into a Space or Canvas moves "forward" (content slides in from right or scales up). Going back moves "backward" (content slides out to right or scales down).
- **Animation:** Spring-based with the default theme spring. Fade + directional slide.
- **Duration:** `duration.normal` to `duration.slow` range.

### Navigation Transitions (Expand / Collapse)

The navigation panels expand and collapse together.

- **Animation:** Width animates with `0.25s cubic-bezier(0.25, 0.1, 0.25, 1)`
- **Collapse:** Both panels hide, collapsed bar fades in
- **Expand:** Collapsed bar disappears, both panels animate to full width

### Panel Transitions (Chat Panel)

Secondary surfaces that slide in and out alongside the canvas.

- **Animation:** Spring-based slide (`slideIn` variant). The canvas content area resizes to accommodate.
- **Spring:** `spring.snappy` for responsive feel.
- **Direction:** Chat Panel slides from right.

### Transient UI (Popovers, Tooltips, AI Suggestions)

Contextual UI that appears and disappears in response to user actions or AI events.

- **Animation:** `fadeInScale` variant. Quick fade with subtle scale from 0.95.
- **Duration:** `duration.fast` for snappy appearance.
- **Exit:** Faster than enter. `duration.instant` to `duration.fast`.

### Canvas Element Transitions

tldraw shape animations (creating, moving, deleting shapes) are handled by tldraw's own animation system. These are separate from the UI chrome animations above.

---

## Spatial Model

The mental model is a single continuous workspace:

```
┌────┬──────────┬─────────────────────────────────────────┐
│    │          │  ┌─── Masthead ──────────────────────┐  │
│ R  │ Secondary│  │                                   │  │
│ a  │  Panel   │  │                                   │  │
│ i  │          │  │       Canvas (tldraw)              │  │ Chat
│ l  │ Space    │  │                                   │  │ Panel
│    │ Nav      │  │                                   │  │
│    │          │  └───────────────────────────────────┘  │
│    │          │          ┌── Toolbar ──┐                │
│    │          │          │  AI + Tools │                │
│    │          │          └─────────────┘                │
└────┴──────────┴─────────────────────────────────────────┘
```

The primary rail provides persistent top-level navigation. The secondary panel provides space-level navigation when inside a space. The content surface is the primary workspace. Chrome elements float above it. Everything feels like one surface that reshapes itself.
