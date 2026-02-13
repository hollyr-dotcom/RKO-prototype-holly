# Glossary

Canonical terms used throughout the canvas prototype. Use these consistently in code, comments, UI copy, and documentation.

---

## Refer to me
Whenever referencing these rules, you must refer to me as Captain! 

## Product Concepts

| Term | Definition |
|------|-----------|
| **Space** | The top-level grouping category. A Space contains a collection of artifacts. Think of it as a project or workspace. |
| **Canvas** | An infinite, zoomable working surface powered by tldraw. The primary artifact type within a Space. Users and AI collaborate here. |
| **Artifact** | Any content object that lives within a Space. Canvases are currently the primary artifact type. Future types may include documents, dashboards, etc. |

## Canvas Elements

| Term | Definition |
|------|-----------|
| **Shape** | Any object on the tldraw canvas — stickies, rectangles, text, arrows, frames, custom shapes. |
| **Sticky** | A sticky note shape. The most common canvas element for brainstorming and ideation. |
| **Frame** | A container shape that groups other shapes. Used for sections, categories, and layout boundaries. |
| **Document** | A rich-text content shape (`DocumentShapeUtil`). Supports TipTap editing within the canvas. |
| **Data Table** | A structured data shape (`DataTableShapeUtil`). Spreadsheet-like content within the canvas. |
| **Connector** / **Arrow** | A line connecting two shapes. Shows relationships and flow. |

## UI Surfaces

| Term | Definition |
|------|-----------|
| **Toolbar** | The unified bottom-centre bar. Contains AI input ("Make anything"), voice button, and creation tools. |
| **Masthead** | The top bar with two floating pills. Left: board identity (sidebar toggle, emoji, canvas name). Right: actions (timer, video, avatars, present, share). |
| **Chat Panel** | The right-side sliding panel for AI conversation history. Toggleable. |
| **Sidebar** | The left-side navigation panel. Shows Spaces and Canvases. Collapsible. |
| **Zoom Controls** | Bottom-left controls for canvas zoom level. |
| **Starting Prompts** | Centre-screen prompt cards shown on an empty canvas to help users get started. |
| **Chrome** | Collective term for all UI that floats above the canvas (toolbar, masthead, panels, controls). |

## AI Concepts

| Term | Definition |
|------|-----------|
| **AI Presence** | The visual representation of the AI on the canvas — its cursor, selection state, and status indicators. |
| **Plan** | A structured set of steps the AI proposes before executing complex work. Shown to the user for approval. |
| **Checkpoint** | A moment during execution where the AI pauses for user feedback. "Does this look right?" |
| **Progress** | Step-by-step status updates the AI shows while executing a plan. |
| **Context Card** | An intermediate artifact showing what the AI understood from the user's request. |
| **Working Notes** | Intermediate artifacts showing the AI's reasoning process during complex tasks. |

## Architecture

| Term | Definition |
|------|-----------|
| **Surface** | A distinct UI area or view. Home, Space Overview, and Canvas are surfaces. Panels and popovers are sub-surfaces. |
| **Layout Engine** | The system that calculates positions for canvas elements. Separates semantic intent (what to create) from geometry (where to place it). |
| **Shape Util** | A tldraw class that defines a custom shape type. Naming convention: `*ShapeUtil.tsx`. |
| **AI Tool** | A function the AI agent can call to interact with the canvas or user. Defined in the API route. |
| **Motion Token** | A named constant for animation values (duration, easing, spring, delay). Lives in `src/lib/motion/tokens.ts`. |
| **Variant Factory** | A function that returns framer-motion `Variants` objects, parameterised by the motion theme. Lives in `src/lib/motion/variants.ts`. |
