# Local Development Setup

## Quick Start (Zero Auth Setup)

```bash
git clone <repository-url>
npm install
./scripts/setup-hooks.sh  # Install git hooks (prevents accidental bun/yarn usage)
cp .env.example .env.local
# Edit .env.local and add only the required API keys (see below)
npm run dev
```

The app will run at `http://localhost:5000` with authentication **automatically bypassed**.

---

## Package Manager: npm Only

**This project uses npm exclusively.** Do not use `bun`, `yarn`, or `pnpm`.

The git hooks (installed via `./scripts/setup-hooks.sh`) will:
- Block commits containing `bun.lock` or `yarn.lock`
- Warn if these files appear in your working directory

If you accidentally run `bun install` or `yarn install`:
```bash
rm bun.lock yarn.lock
npm install
```

---

## Required Environment Variables

You only need these three variables for local development:

```bash
# .env.local
OPENAI_API_KEY=sk-your-key-here
TAVILY_API_KEY=tvly-your-key-here
NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY=pk_dev_your-key-here
```

**Get your keys from:**
- OpenAI: https://platform.openai.com/api-keys
- Tavily: https://tavily.com
- Liveblocks: https://liveblocks.io/dashboard/apikeys

---

## Authentication (Optional)

**You do NOT need auth credentials to develop locally.**

The app automatically detects missing auth configuration and:
- Bypasses the sign-in screen
- Creates a mock user: `{ uid: 'local', email: 'dev@local' }`
- Allows all API calls without authentication checks

### When to Add Auth

Only add auth credentials if you're specifically working on authentication features:

1. **Client-side auth UI** (sign-in flow, email validation)
2. **Server-side auth middleware** (session verification)
3. **SSO integration testing**

If you need auth, add these variables to `.env.local`:

```bash
# Auth.js secret — generate with: openssl rand -base64 32
AUTH_SECRET=your-generated-secret

# Google OAuth credentials from Google Cloud Console
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret

# Enables the auth gate on the client
NEXT_PUBLIC_AUTH_CONFIGURED=true
```

You'll also need to add `http://localhost:5000/api/auth/callback/google` as an authorized redirect URI in your Google Cloud Console OAuth client.

---

## How Auth Bypass Works

The codebase is designed to gracefully degrade when auth isn't configured:

1. **Client-side** (`src/components/AuthGate.tsx`)
   - Checks if `NEXT_PUBLIC_AUTH_CONFIGURED` is set to `"true"`
   - If missing, renders children immediately without auth gate

2. **Server-side** (`src/lib/auth/serverAuth.ts`)
   - Checks if `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, and `AUTH_SECRET` exist
   - If missing, `requireAuth()` returns mock user instead of throwing

This means **zero setup required** for most development work.

---

## Troubleshooting

### Port already in use
```bash
# Kill existing process
lsof -ti:5000 | xargs kill -9
npm run dev
```

### CSS not updating
```bash
npm run dev:clean
```

### API calls returning 401
- Check that you're not accidentally setting partial auth env vars
- Verify `.env.local` has either all auth vars or none (all-or-nothing)

### "Module not found" errors
```bash
rm -rf node_modules .next
npm install
npm run dev
```

---

## Development Commands

```bash
npm run dev              # Start dev server (http://localhost:5000)
npm run build        # Production build
npm run lint         # Run ESLint
npm run dev:clean    # Clean rebuild (nukes .next + public/dist)
```

---

## Need Help?

- Check CLAUDE.md for full project documentation
- Read `docs/guidelines/` for architecture and patterns
- Ask in your team's Slack channel
