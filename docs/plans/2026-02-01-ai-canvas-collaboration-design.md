# AI Canvas Collaboration Platform - Design Document

## Vision

A visual collaboration environment where humans and AI agents come together on the same surface to collaborate. The AI works visibly on the canvas like a human collaborator — creating artifacts, showing its thinking, asking questions, and iterating together with users.

**Core principle:** The AI assesses task complexity and responds appropriately:
- **Simple tasks** → Just do it ("Create a table" → table appears)
- **Complex tasks** → Agentic flow (ask → research → confirm → execute → iterate)

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js (App Router) |
| Package Manager | Bun |
| Canvas | tldraw |
| Styling | Tailwind CSS |
| AI Chat | Vercel AI SDK + OpenAI |
| Voice (Phase 4) | OpenAI Whisper + TTS |
| Web Search | Tavily (or similar) |
| Multiplayer (Phase 5) | Liveblocks |

## Key Concepts

### 1. Unified Toolbar

Custom toolbar (not tldraw's default) positioned at bottom center:
- **Left side:** Pointer, comments, AI interaction (thinking/talking)
- **Center:** "Make anything" AI input field + voice button
- **Right side:** Creation tools (pen, sticky, shapes, text, connector, more)

Toolbar connects to tldraw via its API (`editor.setCurrentTool()`).

### 2. AI Works Visibly on Canvas

When AI works on complex tasks, it creates visible artifacts:
- **Context Card** — What AI understood from input
- **Questions Card** — What AI needs to know
- **Research Card** — What AI found from web search
- **Draft Outline** — Proposed structure before execution
- **Working Notes** — AI's reasoning process
- **Checkpoint** — "Does this look right?" moments

All artifacts are editable by both human and AI.

### 3. AI Presence

- **AI Cursor** — Labeled cursor (e.g., "Sidekick") visible on canvas
- **AI Selection** — AI selects objects it's working on
- **Cursor Chat** — Quick questions via bubble near cursor when chat panel minimized

### 4. Bidirectional Collaboration

- Human edits AI artifacts → AI notices and adapts
- AI edits human artifacts → Human can undo/modify
- Canvas is the shared truth

### 5. AI Tools

**Canvas Tools:**
- `createSticky(text, position, color)`
- `createShape(type, position, size)`
- `createTable(rows, cols, data, position)`
- `createDocument(title, content, position)`
- `createImage(prompt, position)` → calls DALL-E
- `updateShape(id, changes)`
- `deleteShape(id)`
- `readCanvas()` → sees what's on canvas

**Research Tools:**
- `webSearch(query)` → real search results
- `fetchUrl(url)` → get content from link

**Interaction Tools:**
- `askUser(question, options?)` → get user input
- `showThinking(status)` → show what AI is doing
- `confirmPlan(plan)` → get approval before big actions

## Implementation Phases

### Phase 1: Foundation
- Next.js + Bun + Tailwind setup
- tldraw canvas integration
- Custom unified toolbar (bottom center)
- Vercel AI SDK + OpenAI connection
- AI creates simple objects (stickies, shapes, text)
- Side chat panel (show/hide)

### Phase 2: Agentic AI
- AI tools: `askUser()`, `showThinking()`, `confirmPlan()`
- Intermediate artifacts (context cards, outlines)
- AI cursor + selection visibility
- Cursor chat for quick questions
- Task complexity assessment
- **Layout Engine** — Auto-positions items, handles geometry ([Layout Engine Design](./2026-02-02-layout-engine-design.md))
- **`createLayout()` tool** — Semantic layouts (grid, hierarchy, flow) with auto-arrangement

### Phase 3: Research & Rich Artifacts
- Web search API integration
- `webSearch()`, `fetchUrl()` tools
- Custom tldraw shapes: tables, documents
- `readCanvas()` functionality
- Bidirectional editing detection

### Phase 4: Voice
- OpenAI Whisper (speech-to-text)
- OpenAI TTS (text-to-speech)
- Voice mode UI (minimal, toast-based)

### Phase 5: Multiplayer
- Liveblocks integration
- Multiple user cursors
- Real-time sync
- AI as participant

## Jobs to Be Done (Target Use Cases)

| Domain | Job |
|--------|-----|
| Product | Connected Roadmapping, OKR Planning |
| Leadership | Org Design, Capacity Planning, Decision-Making Hubs |
| Engineering | Dependency Mapping, Architectural Iteration |
| Design | Research Synthesis, Prototyping |

## UI Components

### Canvas Page Layout
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│   ┌─────────────────────────────────────────┬───────────────┐   │
│   │                                          │               │   │
│   │                                          │  Side Chat    │   │
│   │           tldraw Canvas                  │  Panel        │   │
│   │                                          │  (toggleable) │   │
│   │                                          │               │   │
│   │                                          │               │   │
│   └─────────────────────────────────────────┴───────────────┘   │
│                                                                  │
│            ┌─────────────────────────────────────┐               │
│            │  ↖ 💬 │ Make anything [+🎤] │ Tools │               │
│            └─────────────────────────────────────┘               │
│                     (Custom Toolbar)                             │
└─────────────────────────────────────────────────────────────────┘
```

### AI Presence States
| State | Visual |
|-------|--------|
| Idle | Cursor hidden or parked |
| Listening | Cursor visible, subtle pulse |
| Working | Cursor moves, selects objects, status text |
| Asking | Cursor chat bubble with options |
| Waiting | Near checkpoint, "Waiting for you..." |

---

*Design approved: 2026-02-01*
