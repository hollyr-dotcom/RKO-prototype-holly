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
5. **npm only.** This project uses npm exclusively. Never suggest, reference, or use `bun`, `yarn`, or `pnpm` commands. Always use `npm install`, `npm run dev`, etc. If you see `bun.lock` or `yarn.lock` files, flag them as errors.
6. **Verify git hooks installed.** At the start of any session where you'll be making commits, check if the pre-commit hook exists at `.git/hooks/pre-commit`. If it doesn't exist or isn't executable, remind the user to run `./scripts/setup-hooks.sh` to install git hooks that prevent accidental non-npm lockfile commits.
7. **Ticket workflow via Miro MCP.** The todo list of work is provided by the Miro MCP board: `https://miro.com/app/board/uXjVG_KZlFg=/`. Look at the **todo column** for tickets assigned to **Mark Boyes-Smith**. When a ticket's work is complete, update its status in Miro.
8. **Branch-per-ticket.** Work from each ticket must be done on a branch of the same name as the ticket. Before starting work, create or checkout the branch, rebase it on the latest `main`, and push to GitHub when the work is complete.

---

## Development Commands

```bash
# Development (runs on http://0.0.0.0:5000)
npm run dev

# Clean rebuild (if CSS issues)
npm run dev:clean

# Production build
npm run build

# Lint
npm run lint

# Deploy to Vercel
npm run deploy:vercel       # Production
npm run deploy:vercel:preview  # Preview
```

**Note**: This project uses npm as the package manager. Always use `npm install`.

## Authentication Architecture

**Auth.js v5 (NextAuth.js) with Google OAuth restricted to @miro.com emails only.**

### Multi-layer Email Domain Restriction

1. **Provider hint**: Google OAuth `hd=miro.com` parameter
2. **signIn callback**: Auth.js rejects non-miro.com emails at sign-in time
3. **Server middleware**: Auth.js middleware runs on every request
4. **API guards**: All API routes require authenticated @miro.com user via `requireAuth()`

### Key Files

- `src/lib/auth/auth.ts` — Auth.js config (Google provider, callbacks, domain restriction)
- `src/app/api/auth/[...nextauth]/route.ts` — Auth.js route handler
- `src/lib/auth/serverAuth.ts` — Server-side auth utilities (`requireAuth()`, `getAuthenticatedUser()`)
- `src/lib/auth/validation.ts` — Email domain validation (`isAllowedEmail()`)
- `src/lib/auth/constants.ts` — Auth configuration (allowed domain)
- `src/hooks/useAuth.ts` — Client-side auth hook (wraps `useSession()`)
- `src/components/AuthGate.tsx` — Auth UI overlay (wraps entire app in `layout.tsx`)
- `src/middleware.ts` — Auth.js middleware export

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
- `useStorageStore()` — Manages spaces and canvases (Supabase via API routes)
- `useSidebar()` — Global sidebar state
- `useAuth()` — Auth.js authentication state

## Storage

**Supabase PostgreSQL for spaces/canvases metadata. Liveblocks for canvas content (tldraw shapes).**

- **Spaces table**: `id`, `name`, `description`, `created_at`, `updated_at`, `order`
- **Canvases table**: `id`, `space_id`, `name`, `emoji`, `created_at`, `updated_at`, `order`
- **Canvas content**: Stored in Liveblocks (not in Supabase)
- **Read-only demo data**: `src/data/` JSON files (connectors, web search results, etc.) — still file-based

### Key Files

- `src/lib/supabase.ts` — Server-side Supabase client (service role key, bypasses RLS)
- `src/lib/supabase-types.ts` — `SpaceRow`, `CanvasRow` types + `spaceRowToApi()`, `canvasRowToApi()` helpers (snake_case DB → camelCase API)
- `scripts/migrate-to-supabase.ts` — One-time migration script to seed data from JSON files

API routes in `src/app/api/spaces/` and `src/app/api/canvases/` handle CRUD operations via Supabase queries.

## Deployment

### Vercel

GitHub Actions workflow: `.github/workflows/deploy-vercel.yml`

- **PR**: Deploys preview with URL commented on PR
- **Main branch**: Deploys to production
- **Manual**: Workflow dispatch available for any branch

GitHub secrets required: `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`, plus all env vars below.

### Environment Variables

- `OPENAI_API_KEY`
- `TAVILY_API_KEY`
- `LIVEBLOCKS_SECRET_KEY` — Liveblocks secret key (server-only, no `NEXT_PUBLIC_` prefix)
- `AUTH_SECRET` — Auth.js session secret (generate with `openssl rand -base64 32`)
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
- `NEXT_PUBLIC_AUTH_CONFIGURED=true` — Enables the auth gate client-side
- `SUPABASE_URL` — Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key (server-side only, bypasses RLS)

## Tech Stack Overview

- **Framework**: Next.js 15 (App Router, React Server Components)
- **Canvas**: tldraw 4.x
- **AI**: OpenAI Agents SDK, OpenAI Realtime API
- **Auth**: Auth.js v5 (NextAuth.js) with Google OAuth
- **Styling**: Tailwind CSS 4, Miro Design System
- **Animation**: Framer Motion
- **State**: React hooks, no global state library
- **Storage**: Supabase PostgreSQL (spaces/canvases metadata), Liveblocks (canvas content)

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
5. Canvas metadata saved to Supabase via `/api/canvases/[canvasId]`

### Authentication Flow

1. User visits app → `AuthGate` component checks `useAuth()` hook (wraps `useSession()`)
2. If not authenticated → Show sign-in overlay with Google button
3. User clicks sign in → Auth.js redirects to Google OAuth
4. Auth.js `signIn` callback verifies email ends with @miro.com
5. If valid → Session created, user redirected back, auth gate dismissed
6. If invalid → Sign-in rejected, error shown
7. All API calls → `requireAuth()` calls `auth()` to get session from Auth.js

---

**Project**: Canvas Prototype — AI-powered interactive canvas with voice and chat
**Last Updated**: 2026-02-17
