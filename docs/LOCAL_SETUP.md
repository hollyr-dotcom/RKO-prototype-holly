# Local Development Setup

## Quick Start (Zero Firebase Setup)

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
- ✅ Block commits containing `bun.lock` or `yarn.lock`
- ⚠️ Warn if these files appear in your working directory

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

**You do NOT need Firebase to develop locally.**

The app automatically detects missing Firebase credentials and:
- Bypasses the sign-in screen
- Creates a mock user: `{ uid: 'local', email: 'dev@local' }`
- Allows all API calls without authentication checks

### When to Add Firebase

Only add Firebase if you're specifically working on authentication features:

1. **Client-side auth UI** (sign-in flow, email validation)
2. **Server-side auth middleware** (token verification)
3. **SSO integration testing**

If you need Firebase, add these variables to `.env.local`:

```bash
# Firebase Client (public)
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...

# Firebase Admin (server-side, secret)
FIREBASE_ADMIN_PROJECT_ID=...
FIREBASE_ADMIN_CLIENT_EMAIL=...
FIREBASE_ADMIN_PRIVATE_KEY="..."
```

Ask your team lead for a shared development Firebase project if needed.

---

## How Auth Bypass Works

The codebase is designed to gracefully degrade when Firebase isn't configured:

1. **Client-side** (`src/components/AuthGate.tsx`)
   - Checks if `NEXT_PUBLIC_FIREBASE_API_KEY` exists
   - If missing, renders children immediately without auth gate

2. **Server-side** (`src/lib/auth/serverAuth.ts`)
   - Checks if Firebase Admin env vars exist
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
- Check that you're not accidentally setting Firebase env vars
- Verify `.env.local` doesn't have partial Firebase config (all-or-nothing)

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
