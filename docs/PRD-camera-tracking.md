# PRD: Camera Tracking

## Executive Summary

Enable the user's viewport to **follow the AI's camera view** across the canvas during guidance and execution. When the AI moves to work on different areas of the canvas, the user's camera smoothly pans and zooms to keep the AI's work in view — like watching a collaborator's screen share on a shared whiteboard.

**Core value proposition:** Without camera tracking, the AI creates shapes off-screen and the user must manually navigate to find them. With camera tracking, the user sees every step of the AI's work unfold spatially, reinforcing the "AI-Led" and "Seamless Surface" experience principles.

## Target Users

- **Primary:** Users watching the AI execute multi-step plans on the canvas
- **Pain points:** AI creates content off-screen. User loses context during AI execution. No sense of spatial narrative.
- **Goals:** See the AI's work as it happens. Understand the spatial layout the AI is building. Stay oriented during complex multi-step operations.

## Current State

### Camera Controls
- tldraw manages camera internally: `editor.getCamera()`, `editor.setCamera()`
- Viewport methods available: `editor.zoomToSelection()`, `editor.zoomToBounds()`, `editor.getViewportScreenCenter()`, `editor.screenToPage()`
- Browser zoom prevention in place (Ctrl+scroll, pinch-to-zoom intercepted)

### AI Shape Placement
- Shapes placed at viewport center via `editor.getViewportScreenCenter()` + `editor.screenToPage()`
- Layout engine (`src/lib/layoutEngine.ts`) calculates grid/hierarchy positions
- Shapes can be created anywhere on the infinite canvas

### AI Cursor
- `useAICursor.ts` tracks AI position but does NOT move the camera
- Cursor position updates via tool call arguments (x/y or shape bounds)

## Feature Specifications

### Feature 1: Follow Mode

**Description:** A toggleable "Follow AI" mode where the user's camera automatically pans and zooms to keep the AI's work area in view.

**Behavior when active:**
- Camera smoothly tracks AI cursor position with spring animation
- Camera adjusts zoom to fit the current work area (shape being created + surrounding context)
- Camera movement has a slight lag (200ms) for a natural "following" feel
- If AI moves to a distant area, camera transitions with `duration.slow` (500ms)
- If AI is working in the current viewport, camera makes micro-adjustments only

**Behavior when inactive:**
- Camera is fully user-controlled (default behavior)
- AI works regardless of where user is looking
- User can manually navigate to AI's work area

**Toggle mechanism:**
- Auto-enabled during AI plan execution (agentic flows)
- Auto-disabled when user manually pans/zooms (takeover detection)
- Manual toggle in UI (button in masthead or zoom controls area)
- Keyboard shortcut (e.g., `F` for "Follow")

**User takeover:**
- If user pans or zooms while follow mode is active, follow mode pauses
- After 3 seconds of no user input, follow mode resumes
- Visual indicator shows follow mode is paused ("Follow paused — click to resume")

**Acceptance criteria:**
- [ ] Follow mode tracks AI cursor position with smooth camera animation
- [ ] Camera zoom adjusts to fit AI's work area
- [ ] Toggle button visible in UI (zoom controls or masthead)
- [ ] Auto-enables during AI plan execution
- [ ] Auto-pauses on user interaction (pan/zoom)
- [ ] Auto-resumes after 3s of no user input
- [ ] Spring animation for camera movement (not linear)
- [ ] Works at all zoom levels

**Priority:** Must-have

### Feature 2: Guided Camera Transitions

**Description:** When the AI moves between distinct work areas (e.g., from one frame to another), the camera performs a cinematic transition that maintains spatial orientation.

**Transition types:**

| Scenario | Camera Behavior |
|----------|----------------|
| AI moves to nearby shape (within 2x viewport) | Smooth pan, no zoom change |
| AI moves to distant shape (outside viewport) | Zoom out → pan → zoom in (bird's eye transition) |
| AI creates new shape at edge of viewport | Subtle pan to center new shape |
| AI works within a frame | Zoom to fit frame bounds with padding |
| AI finishes plan step | Brief pause (500ms) at result before moving |

**Bird's eye transition (distant moves):**
1. Zoom out to show both origin and destination (duration: `normal`)
2. Pan to destination (duration: `fast`)
3. Zoom in to fit destination area (duration: `normal`)
4. Total: ~700ms, feels like a deliberate camera move

**Acceptance criteria:**
- [ ] Nearby moves use smooth pan without zoom change
- [ ] Distant moves use bird's eye zoom-out-pan-zoom-in transition
- [ ] Frame-scoped work zooms to fit frame with padding
- [ ] Transitions use motion tokens (durations, springs from `@/lib/motion`)
- [ ] Camera settles quickly (no oscillation or drift)
- [ ] Transitions feel intentional, not jarring

**Priority:** Must-have

### Feature 3: Camera Movement Queue

**Description:** When the AI makes rapid successive moves, camera transitions are queued and executed smoothly rather than fighting each other.

**Queue behavior:**
- New camera targets enqueue if current transition is in progress
- If queue has multiple items, intermediate targets are skipped (move to latest)
- Minimum dwell time at each target: 800ms (so user can see what's there)
- Queue drains at natural pace, never faster than the AI's actual work

**Acceptance criteria:**
- [ ] Rapid camera targets don't cause jitter or fighting
- [ ] Intermediate targets skipped when appropriate
- [ ] Minimum 800ms at each camera position
- [ ] Queue drains smoothly without rushing

**Priority:** Must-have

### Feature 4: Follow Mode UI Indicator

**Description:** Visual UI element showing the current follow mode state.

**States:**

| State | Indicator |
|-------|-----------|
| Follow active | Eye icon (filled) in zoom controls area + "Following AI" tooltip |
| Follow paused | Eye icon (outline) + "Paused — click to resume" tooltip |
| Follow off | Eye icon (off/crossed) or no indicator |
| AI not active | Indicator hidden |

**Placement:** In the zoom controls area (bottom-left of canvas), near existing zoom buttons.

**Acceptance criteria:**
- [ ] Follow mode indicator visible in zoom controls area
- [ ] Three visual states: active, paused, off
- [ ] Click toggles follow mode
- [ ] Indicator hidden when AI is not actively working
- [ ] Tooltip shows current state on hover
- [ ] Indicator animates between states using motion tokens

**Priority:** Should-have

### Feature 5: Viewport Padding and Framing

**Description:** When the camera follows the AI, maintain appropriate padding around the focused content so it doesn't feel cramped.

**Padding rules:**
- Minimum padding: 80px around focused area (at current zoom)
- If AI is working in a frame: show full frame + 20% padding
- If AI is creating a single shape: center it with 40% viewport padding on each side
- If AI is working across shapes: zoom to fit all involved shapes + 15% padding

**Acceptance criteria:**
- [ ] Focused content never touches viewport edges
- [ ] Padding adapts to content type (frame, single shape, multi-shape)
- [ ] Zoom level stays comfortable (not too zoomed in or out)
- [ ] Padding consistent across different viewport sizes

**Priority:** Should-have

## Functional Requirements

### Camera Control API
```typescript
interface CameraTracker {
  // Enable/disable follow mode
  enable(): void;
  disable(): void;
  toggle(): void;
  isEnabled: boolean;
  isPaused: boolean;

  // Track a target
  trackTarget(target: CameraTarget): void;

  // Clear tracking
  clearTarget(): void;
}

type CameraTarget =
  | { type: "shape"; shapeId: string }
  | { type: "bounds"; bounds: Box }
  | { type: "point"; point: { x: number; y: number }; zoom?: number }
  | { type: "shapes"; shapeIds: string[] };
```

### Integration with AI Cursor
- Camera tracker listens to AI cursor position changes
- When cursor moves to a new target, camera follows
- Camera tracker and cursor are independent systems that coordinate through shared targets

### Integration with tldraw Camera
- Use `editor.animateCamera()` or manual `editor.setCamera()` with interpolation
- Respect tldraw's camera constraints (min/max zoom)
- Don't fight with tldraw's built-in camera animations (e.g., `zoomToSelection`)

## Technical Requirements

### Key Files to Create
| File | Purpose |
|------|---------|
| `src/hooks/useCameraTracking.ts` | Camera tracking hook with follow mode, queue, transitions |
| `src/components/canvas/FollowModeIndicator.tsx` | UI indicator component |

### Key Files to Modify
| File | Changes |
|------|---------|
| `src/components/Canvas.tsx` | Integrate camera tracking hook, add follow indicator to canvas chrome |
| `src/hooks/useAICursor.ts` | Emit target change events for camera tracker to consume |

### Dependencies
- tldraw API (existing) — camera control methods
- Framer Motion (existing) — spring animation for camera
- `@/lib/motion` — motion tokens
- No new dependencies

## Constraints & Considerations

- **User control priority:** User input always takes precedence over AI camera movement. Follow mode pauses instantly on user pan/zoom.
- **Performance:** Camera animations must be 60fps. Use `requestAnimationFrame` for camera interpolation.
- **Coordination with Cursor Presence:** Camera tracking works alongside (not instead of) cursor presence. The cursor shows where the AI is pointing; the camera ensures the user can see it.
- **Zoom limits:** Respect tldraw's zoom bounds. Don't zoom in so far that content is pixelated, or out so far that content is invisible.
- **Multiplayer consideration:** In a multiplayer session, camera tracking follows the AI — not other users. Other users' viewports are independent.

## Out of Scope

- Following other users' cameras (multiplayer follow)
- Camera recording/playback (watching AI work after the fact)
- Minimap showing AI's position on the canvas
- Camera path visualization (showing where the AI has been)

## Validation Plan

### Build Validation
```bash
npm run build
npm run lint
```

### Camera Movement Validation
- [ ] Follow mode tracks AI cursor across canvas
- [ ] Camera animation is smooth (no jitter, no snap)
- [ ] Nearby moves pan without zoom change
- [ ] Distant moves use bird's eye transition
- [ ] Camera respects minimum dwell time (800ms)

### User Interaction Validation
- [ ] Manual pan/zoom pauses follow mode
- [ ] Follow mode resumes after 3s of no user input
- [ ] Toggle button works correctly
- [ ] User never loses control of camera

### Integration Validation
- [ ] Camera follows during AI plan execution
- [ ] Camera moves with cursor pointing (PRD: Cursor Presence)
- [ ] Camera tracking doesn't interfere with tldraw's built-in animations
- [ ] Works at different zoom levels and canvas sizes
