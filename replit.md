# My Canvas Prototype

## Overview
A Miro-like canvas collaboration prototype built with Next.js, React 19, tldraw, Liveblocks, and TailwindCSS v4. Features include AI chat, real-time collaboration, document editing, and data table editing.

## Project Architecture
- **Framework**: Next.js 15.5 (App Router) with Turbopack
- **UI**: React 19, TailwindCSS v4, Miro Design System, Framer Motion
- **Canvas**: tldraw v4
- **Real-time**: Liveblocks (collaborative editing, presence)
- **Rich Text**: TipTap with Yjs collaboration
- **AI**: OpenAI API via Vercel AI SDK, OpenAI Agents SDK
- **Search**: Tavily API for voice search

## Key Files
- `next.config.ts` - Next.js configuration (Turbopack, allowed dev origins)
- `package.json` - Dependencies and scripts
- `src/app/` - Next.js App Router pages and API routes
- `src/components/` - React components (Canvas, ChatPanel, Toolbar, etc.)
- `src/hooks/` - Custom React hooks
- `src/providers/` - Context providers
- `src/shapes/` - Custom tldraw shape utilities

## Environment Variables
- `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` - Liveblocks public API key
- `OPENAI_API_KEY` - OpenAI API key (secret)
- `TAVILY_API_KEY` - Tavily search API key (secret)

## Development
- Dev server: `npm run dev` (runs on 0.0.0.0:5000)
- Build: `npm run build`
- Production: `npm run start` (runs on 0.0.0.0:5000)
- Package manager: npm (with --legacy-peer-deps due to React 19 peer dep conflicts)

## Deployment
- Target: Autoscale
- Build: `npm run build`
- Run: `npm run start`
