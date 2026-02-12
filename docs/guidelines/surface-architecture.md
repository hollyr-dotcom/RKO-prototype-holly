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
        ├── Sidebar (left, collapsible)
        ├── Zoom Controls (bottom left)
        ├── Starting Prompt Cards (centre, empty state)
        └── Expanded Artifacts (documents, data tables)
```

---

## Surfaces

### Home

The entry point. Displays a listing of Spaces the user belongs to.

- **Route:** `/`
- **Layout:** App shell with sidebar + main content area
- **Key components:** `SpaceCard`, `HomePromptInput`, `TopBar`

### Space Overview

Shows the artifacts within a Space. Currently, Canvases are the primary artifact type.

- **Route:** `/space/[spaceId]`
- **Layout:** App shell with sidebar + main content area
- **Key components:** `CanvasCard`, `TopBar`

### Canvas

The core working surface. A tldraw infinite canvas with custom chrome layered on top.

- **Route:** `/space/[spaceId]/canvas/[canvasId]`
- **Layout:** Full viewport with floating chrome
- **Key components:** `Canvas` (tldraw), `Toolbar`, `CanvasMasthead`, `ChatPanel`, `ZoomToolbar`, `StartingPromptCards`

### Canvas Chrome (Sub-surfaces)

These are persistent or toggleable UI layers that float above the canvas:

| Surface | Position | Behaviour |
|---------|----------|-----------|
| **Toolbar** | Bottom centre | Always visible. AI input + creation tools. |
| **Masthead** | Top | Always visible. Board identity (left), actions + presence (right). |
| **Chat Panel** | Right side | Toggleable slide-in panel. AI conversation history. |
| **Sidebar** | Left | Collapsible. Navigation between spaces and canvases. |
| **Zoom Controls** | Bottom left | Always visible. Zoom in/out/fit. |
| **Starting Prompts** | Centre | Visible only on empty canvas. Disappears after first interaction. |

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

### Panel Transitions (Sidebar, Chat Panel)

Secondary surfaces that slide in and out alongside the canvas.

- **Animation:** Spring-based slide (`slideIn` variant). The canvas content area resizes to accommodate.
- **Spring:** `spring.snappy` for responsive feel.
- **Direction:** Sidebar slides from left, Chat Panel slides from right.

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
┌─────────────────────────────────────────────────────────┐
│  Sidebar  │                                             │
│           │  ┌─── Masthead ──────────────────────────┐  │
│  Spaces   │  │                                       │  │
│  Canvases │  │                                       │  │
│           │  │         Canvas (tldraw)                │  │ Chat
│           │  │                                       │  │ Panel
│           │  │                                       │  │
│           │  │                                       │  │
│           │  └───────────────────────────────────────┘  │
│           │          ┌── Toolbar ──┐                    │
│           │          │  AI + Tools │                    │
│           │          └─────────────┘                    │
└─────────────────────────────────────────────────────────┘
```

The sidebar provides persistent navigation. The canvas is the primary workspace. Chrome elements float above it. Everything feels like one surface that reshapes itself.
