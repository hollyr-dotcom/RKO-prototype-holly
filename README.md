# Canvas Prototype

An AI-powered interactive canvas where you can create diagrams, brainstorms, flowcharts, and more through natural language — by typing or talking.

Built on [tldraw](https://tldraw.dev) and powered by OpenAI, the AI understands what's on your canvas and can create, organize, and modify visual content based on your requests.

## Features

- **Text Chat** — Type what you want and the AI builds it on the canvas
- **Voice Mode** — Talk to the AI in real-time using OpenAI's Realtime API
- **Smart Layouts** — Automatic grids, hierarchies, and flow diagrams
- **Web Search** — AI can search the web and bring results onto the canvas
- **Plan & Execute** — Complex tasks get broken into steps with progress tracking
- **Canvas Awareness** — AI sees and understands everything on your canvas

### What you can create

- Sticky notes, shapes, frames, and arrows
- Sitemaps, user flows, and wireframe layouts
- Competitive analyses and feature matrices
- Brainstorms and mind maps
- Product roadmaps

## Tech Stack

- **Next.js 15** + **React 19** + **TypeScript**
- **tldraw** — Canvas and diagramming
- **OpenAI Agents SDK** — AI planning and execution
- **Tailwind CSS 4** — Styling
- **Framer Motion** — Animations
- **Miro Design System** — Icons and design tokens

## Getting Started

**Quick start:** [Local Setup Guide](docs/LOCAL_SETUP.md)

### Prerequisites

- [Node.js](https://nodejs.org) 18+ and npm installed
- An [OpenAI API key](https://platform.openai.com/api-keys)
- _(Optional)_ Tavily API key for web search
- _(Optional)_ Liveblocks key for collaboration features
- _(Optional)_ Google OAuth credentials for authentication (see [Local Setup Guide](docs/LOCAL_SETUP.md))

### Setup

```bash
# Install dependencies
npm install

# Set up your environment
cp .env.example .env.local
# Add your API keys to .env.local (see .env.example for details)
```

**Note:** Authentication is **optional** for local development. The app automatically bypasses auth when credentials are missing. See the [Local Setup Guide](docs/LOCAL_SETUP.md) for details.

### Run

```bash
npm run dev
```

Open [http://localhost:5000](http://localhost:5000) in your browser.

If you run into CSS issues after changes, use the clean restart:

```bash
npm run dev:clean
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `TAVILY_API_KEY` | No | Enables web search on the canvas |
| `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` | No | Enables real-time collaboration |
| `AUTH_SECRET` | No | Auth.js session secret (optional for local dev) |
| `GOOGLE_CLIENT_ID` | No | Google OAuth client ID (optional for local dev) |
| `GOOGLE_CLIENT_SECRET` | No | Google OAuth client secret (optional for local dev) |
| `NEXT_PUBLIC_AUTH_CONFIGURED` | No | Set to `true` to enable auth gate |

For full environment setup details, see [Local Setup Guide](docs/LOCAL_SETUP.md).

## How It Works

1. **You ask** — Type or speak what you want to create
2. **AI plans** — For complex tasks, the AI proposes a step-by-step plan for your approval
3. **AI builds** — Shapes, stickies, frames, and arrows appear on the canvas
4. **You edit** — Move things around, change text, adjust colors — the AI tracks your changes
5. **Iterate** — Keep the conversation going to refine and expand

The AI tracks everything on the canvas (frames, shapes, connections) and knows what you've changed, so it can build on top of your work.
