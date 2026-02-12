# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Guidelines

All rules, context, and behavioural guidelines for this project live in:

**`docs/guidelines/`**

Read every file in that directory before starting any work. The key files are:

- `docs/guidelines/experience-principles.md` — The five non-negotiable design principles. Every change must respect these.
- `docs/guidelines/ai-behaviour.md` — How the AI collaborator behaves, communicates, and presents itself on the canvas.
- `docs/guidelines/motion-system.md` — Motion tokens, springs, easings, and animation conventions. Never hardcode values.
- `docs/guidelines/surface-architecture.md` — How surfaces, panels, and navigation are structured.
- `docs/guidelines/design-system.md` — Visual design tokens, colour, typography, and spacing.
- `docs/guidelines/glossary.md` — Shared vocabulary. Use these terms consistently.
- `docs/guidelines/agent-workflow.mdc` — The mandatory plan-execute-test workflow for bugs and tasks.

## Rules

1. **Read before you write.** Always read the relevant guideline files before making changes. If unsure which apply, read all of them.
2. **Guidelines are authoritative.** If your instinct conflicts with a guideline, follow the guideline. If you believe a guideline is wrong, flag it — do not silently override it.
3. **Work log workflow is mandatory.** When picking up items from `_work-log/bugs.md` or `_work-log/tasks.md`, follow the three-phase workflow (Plan, Execute, Test) defined in `docs/guidelines/agent-workflow.mdc`. No exceptions.
4. **Keep guidelines up to date.** If your work introduces new conventions or changes existing ones, update the relevant guideline file as part of your work.

---

## Development Commands

```bash
# Development (runs on http://0.0.0.0:5000)
bun dev

# Clean rebuild (if CSS issues)
bun run dev:clean

# Production build
bun run build

# Lint
bun run lint

# Deploy to Firebase
bun run deploy              # Production
bun run deploy:preview      # Preview channel
```

**Note**: This project uses Bun as the package manager. Always use `bun install` instead of `npm install`.

## Authentication Architecture

**Firebase Authentication with Google OAuth restricted to @miro.com emails only.**

### Multi-layer Email Domain Restriction

1. **Client hint**: Google OAuth `hd=miro.com` parameter
2. **Post-auth validation**: Immediate sign-out if email domain doesn't match
3. **Server middleware**: Validates auth cookie on every request
4. **API guards**: All API routes require authenticated @miro.com user

### Key Files

- `src/lib/auth/serverAuth.ts` — Server-side auth utilities (`requireAuth()`, `getAuthenticatedUser()`)
- `src/lib/auth/validation.ts` — Email domain validation (`isAllowedEmail()`)
- `src/lib/auth/constants.ts` — Auth configuration (allowed domain, cookie name)
- `src/hooks/useAuth.ts` — Client-side auth hook
- `src/components/AuthGate.tsx` — Auth UI overlay (wraps entire app in `layout.tsx`)
- `src/middleware.ts` — Route protection middleware

### API Route Pattern

**Every API route MUST follow this pattern:**

```typescript
import { requireAuth } from '@/lib/auth/serverAuth';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const user = await requireAuth(); // Throws if not authenticated
    // ... use user.uid, user.email
  } catch (error) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}
```

**Critical**: All route handlers (GET, POST, PUT, DELETE, PATCH) must call `requireAuth()` at the start and wrap in try-catch.

## AI Agent System

Built on **OpenAI Agents SDK** (`@openai/agents`).

### Architecture

- **Agent definition**: `src/app/api/chat/route.ts` — Main chat endpoint with tools
- **Tools pattern**: Each tool is defined with name, description, parameters (Zod schema), and execute function
- **Streaming**: Agent streams responses back to client with tool calls and results
- **Canvas awareness**: Agent receives canvas state as context (shapes, frames, connections)

### Key Tools

- `askUser` — Ask 1-3 questions with clickable button suggestions
- `confirmPlan` — Propose multi-step plan before executing (for substantial work)
- `showProgress` — Show current step progress during plan execution
- `requestFeedback` — Pause for user input during execution
- `createShape` — Create shapes on canvas (sticky notes, frames, shapes, arrows)
- `updateShape` — Modify existing shapes
- `webSearch` — Search the web via Tavily API

**Pattern**: Tools return JSON strings that get parsed by the client and trigger UI updates.

## Canvas Architecture

Built on **tldraw** (`tldraw` package).

### Core Integration

- `src/components/Canvas.tsx` — Main canvas component with tldraw editor
- Custom shapes registered via `shapeUtils` prop:
  - `DocumentShapeUtil` — Rich text documents
  - `DataTableShapeUtil` — Interactive tables
  - `CommentShapeUtil` — Comment threads

### Canvas State Management

- Editor instance stored in ref: `editorRef.current`
- Shape creation: `editor.createShape()` with `createShapeId()`
- Canvas snapshot: `editor.getCurrentPageShapes()` for AI context
- Layout engine: `src/lib/layoutEngine.ts` — Grid, hierarchy, flow layouts

### Custom Hooks

- `useChat()` — Manages chat messages and agent streaming
- `useRealtimeVoice()` — OpenAI Realtime API for voice mode
- `useStorageStore()` — Manages spaces and canvases (JSON file storage)
- `useSidebar()` — Global sidebar state
- `useAuth()` — Firebase authentication state

## Storage

**File-based storage using JSON files (no database).**

- **Spaces**: `spaces/` directory — Each space is a folder
- **Canvases**: `spaces/{spaceId}/{canvasId}.json` — tldraw snapshots
- **Metadata**: `spaces/{spaceId}/metadata.json` — Space name, created date, canvases list

API routes in `src/app/api/spaces/` and `src/app/api/canvases/` handle CRUD operations.

## Deployment

**Firebase App Hosting** with GitHub Actions.

### Environment Variables

Production secrets stored in GitHub repository secrets:
- `OPENAI_API_KEY`
- `TAVILY_API_KEY`
- `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY`
- Firebase client config (all `NEXT_PUBLIC_FIREBASE_*`)
- Firebase Admin SDK credentials (`FIREBASE_ADMIN_*`)
- `FIREBASE_SERVICE_ACCOUNT` (for deployment)

### Pipeline

- **PR**: Deploys preview to Firebase preview channel (expires in 7 days)
- **Main branch**: Deploys to production (`rko-project-2026.web.app`)
- **Manual**: Workflow dispatch available for any branch

Workflow file: `.github/workflows/deploy.yml`

## Tech Stack Overview

- **Framework**: Next.js 15 (App Router, React Server Components)
- **Canvas**: tldraw 4.x
- **AI**: OpenAI Agents SDK, OpenAI Realtime API
- **Auth**: Firebase Authentication + Firebase Admin SDK
- **Styling**: Tailwind CSS 4, Miro Design System
- **Animation**: Framer Motion
- **State**: React hooks, no global state library
- **Storage**: JSON files (no database)

## Key Patterns

### AI Agent Response Flow

1. User sends message → `useChat()` hook → POST to `/api/chat`
2. Agent processes with tools → Streams back tool calls and results
3. Client receives stream → Updates UI (chat messages, canvas shapes, progress indicators)
4. Tool responses trigger UI changes (questions, plans, progress bars)

### Canvas Update Flow

1. AI calls `createShape` or `updateShape` tool
2. Tool returns shape data as JSON
3. Client receives tool call → Calls `editor.createShape()` or `editor.updateShape()`
4. tldraw updates canvas immediately
5. Canvas state saved to JSON file via `/api/canvases/[canvasId]`

### Authentication Flow

1. User visits app → `AuthGate` component checks `useAuth()` hook
2. If not authenticated → Show sign-in overlay with Google button
3. User signs in → Firebase verifies email ends with @miro.com
4. If valid → Set auth cookie, dismiss overlay, show app
5. If invalid → Sign out immediately, show error
6. All API calls → Middleware checks cookie → Server verifies with Firebase Admin SDK

---

**Project**: Canvas Prototype — AI-powered interactive canvas with voice and chat
**Last Updated**: 2026-02-12
