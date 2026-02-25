# Macro Build Plan

Six PRDs, three phases, maximum parallelism.

---

## Dependency Graph

```
Phase 1 (Foundation)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Tailwind Token + Visual Overhaul
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    │
                    ▼
Phase 2 (Parallel Build)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Stream A           Stream B         Stream C
  ──────────         ──────────       ──────────
  Homepage Exp.      Cursor Presence  Tool Menu
  Task List Page     Camera Tracking
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                    │
                    ▼
Phase 3 (Integration)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Merge all → Full validation → Deploy
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Phase 1 — Foundation

**What:** Tailwind Token + Visual Overhaul
**Branch:** `tailwind-token-overhaul`
**PRD:** `docs/PRD-tailwind-token-visual-overhaul.md`

### Why first
Every downstream PRD creates or modifies UI components. If tokens aren't in place, every team will hardcode values that need replacing later. Do this once, up front.

### Team: 2 agents
| Agent | Owns | Does NOT touch |
|-------|------|----------------|
| **tokens** | `globals.css` `@theme` block, shadow/radius/spacing tokens | Component files |
| **audit** | All component files — applies tokens, removes hardcoded values | `globals.css` `@theme` definitions |

### Contract
`tokens` agent defines the `@theme` block and publishes a reference table of every token name → value. `audit` agent uses only those token names when updating components.

### Sequence
1. `tokens` reads Figma MCP (or falls back to `design-system.md`) → writes `@theme` block → publishes token reference
2. `audit` waits for token reference → sweeps all components → replaces hardcoded values with token classes

### Exit criteria
- `npm run build` passes
- `npm run lint` passes
- Zero hardcoded hex colors in component files (outside `globals.css` and `nav-palette.ts`)
- All non-primary surfaces are white
- Shadows are soft and consistent

### Merge
Merge to `main` before Phase 2 begins.

---

## Phase 2 — Parallel Build

Three independent streams launch simultaneously after Phase 1 merges.

---

### Stream A — Pages (Homepage + Task List)

**Branch:** `homepage-experience` then `task-list-page`
**PRDs:** `docs/PRD-homepage-experience.md`, `docs/PRD-task-list-page.md`

#### Why grouped
Both are page-level surfaces in the `(home)` route group. Same layout system, same navigation integration, same design tokens. One team builds both sequentially.

#### Team: 3 agents
| Agent | Owns | Does NOT touch |
|-------|------|----------------|
| **home-ui** | `src/app/(home)/page.tsx`, `src/components/feed/*` | API routes, tasks components |
| **tasks-ui** | `src/app/(home)/tasks/page.tsx`, `src/components/tasks/*` | Feed components, home page |
| **tasks-api** | `src/app/api/tasks/*`, `src/hooks/useTasks.ts`, Supabase migration | UI components |

#### Contract
- `tasks-api` publishes API contract first: exact routes, request/response shapes, status codes
- `tasks-ui` builds against that contract
- `home-ui` starts immediately (no dependency on tasks work)

#### Sequence
1. All three agents start in parallel
2. `home-ui` works on homepage experience independently
3. `tasks-api` defines and builds the tasks API → publishes contract
4. `tasks-ui` builds task list page against API contract
5. Integration test: task list page calls live API

#### Exit criteria per PRD

**Homepage Experience:**
- Feed carousel renders with interaction patterns
- Tab switching is animated
- Cards respond to hover, click, keyboard
- `npm run build` passes

**Task List Page:**
- `/tasks` route renders task list
- CRUD operations work via API
- Tasks grouped by Today / Upcoming / Completed
- Navigation links to `/tasks` from rail and expanded panel
- `npm run build` passes

---

### Stream B — AI Canvas Features (Cursor + Camera)

**Branch:** `cursor-presence` then `camera-tracking`
**PRDs:** `docs/PRD-cursor-presence.md`, `docs/PRD-camera-tracking.md`

#### Why sequential within stream
Camera Tracking listens to cursor position events. The cursor state machine must exist before camera can subscribe to it. These two PRDs share `useAICursor.ts` and `Canvas.tsx`.

#### Team: 2 agents (sequential handoff)
| Agent | Owns | Does NOT touch |
|-------|------|----------------|
| **cursor** | `src/hooks/useAICursor.ts`, `src/lib/ai-presence.ts`, `src/components/canvas/AICursorHighlight.tsx`, `Canvas.tsx` (cursor sections only) | Toolbar, homepage, tasks |
| **camera** | `src/hooks/useCameraTracking.ts`, `src/components/canvas/FollowModeIndicator.tsx`, `Canvas.tsx` (camera sections only) | Toolbar, homepage, tasks, cursor state machine internals |

#### Contract
`cursor` agent exports from `useAICursor.ts`:
```typescript
// Events that camera tracking subscribes to
onTargetChange(callback: (target: CameraTarget) => void): () => void;
getCurrentState(): AICursorState;
```

`camera` agent consumes this interface — does not modify the cursor state machine.

#### Sequence
1. `cursor` agent builds the full AI presence state machine + pointing behavior
2. `cursor` agent validates and reports done
3. `camera` agent picks up, integrates camera tracking on top of cursor events
4. `camera` agent validates end-to-end (cursor + camera together)

#### Exit criteria

**Cursor Presence:**
- AI cursor moves to referenced shapes during AI responses
- 6 presence states implemented (idle, listening, working, pointing, asking, waiting)
- Spring animations from `@/lib/motion`
- `npm run build` passes

**Camera Tracking:**
- Follow mode tracks AI cursor across canvas
- User pan/zoom pauses follow mode
- Bird's eye transitions for distant moves
- Follow mode indicator in zoom controls
- `npm run build` passes

---

### Stream C — Tool Menu

**Branch:** `tool-menu`
**PRD:** `docs/PRD-tool-menu.md`

#### Why independent
Modifies only toolbar components. Zero overlap with homepage, tasks, cursor, or camera files.

#### Team: 1 agent
| Agent | Owns | Does NOT touch |
|-------|------|----------------|
| **toolbar** | `src/components/toolbar/PlusMenu.tsx`, `src/components/toolbar/toolbar-data.tsx`, new `ToolTile.tsx`, new `ToolCategory.tsx` | `Toolbar.tsx` layout (primary tools), Canvas.tsx, homepage, tasks |

#### Sequence
1. Reorganize `toolbar-data.tsx` with categories and descriptions
2. Rebuild `PlusMenu.tsx` as categorized grid
3. Add tile components, search, tooltips
4. Polish animations

#### Exit criteria
- Menu opens with categorized grid layout
- Search filters across categories
- All existing tools still activate correctly
- Keyboard navigation works
- `npm run build` passes

---

## Phase 3 — Integration

**Branch:** `main`

### Merge order
1. Stream C (Tool Menu) — smallest surface area, lowest risk
2. Stream A (Homepage + Task List) — page-level, no canvas conflicts
3. Stream B (Cursor + Camera) — canvas-level, most complex integration

### Validation checklist
After all merges:

```bash
npm run build          # Build succeeds
npm run lint           # No lint errors
npm run dev            # Dev server starts
```

Manual validation:
- [ ] Home page renders with updated tokens and interactions
- [ ] Task list page at `/tasks` works end-to-end
- [ ] Canvas toolbar overflow menu opens with categories
- [ ] AI cursor points at shapes during AI responses
- [ ] Camera follows AI cursor in follow mode
- [ ] All navigation transitions are smooth (no page-load feel)
- [ ] No visual regressions on existing surfaces

---

## Conflict Zones

Files touched by multiple streams — requires merge-order discipline:

| File | Touched By | Resolution |
|------|-----------|------------|
| `src/components/Canvas.tsx` | Stream B only (cursor + camera) | Sequential within stream, no conflict |
| `src/hooks/useAICursor.ts` | Stream B only | Sequential within stream, no conflict |
| `src/app/(home)/page.tsx` | Stream A only (home-ui agent) | Single owner, no conflict |
| `src/components/toolbar/Toolbar.tsx` | Stream C only | Single owner, no conflict |
| `src/app/globals.css` | Phase 1 only | Done before Phase 2, no conflict |

No cross-stream file conflicts exist. This is by design.

---

## Summary

| Phase | Streams | Agents | Blocking? |
|-------|---------|--------|-----------|
| 1 — Foundation | 1 (Tailwind Tokens) | 2 | Blocks Phase 2 |
| 2A — Pages | 1 (Homepage + Tasks) | 3 | Independent |
| 2B — AI Canvas | 1 (Cursor → Camera) | 2 (sequential) | Internal dependency |
| 2C — Tool Menu | 1 (Toolbar) | 1 | Independent |
| 3 — Integration | Merge + validate | Lead only | After all Phase 2 |

**Total agents across all phases:** 8 (not all concurrent)
**Max concurrent agents:** 6 (Phase 2: 3 + 2 + 1)
