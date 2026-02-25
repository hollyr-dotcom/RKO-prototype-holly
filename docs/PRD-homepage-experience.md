# PRD: Homepage Experience

## Executive Summary

Integrate the **Home Cards Prototype** from the interaction sandbox into the main demo application. The homepage is the first surface users see after authentication — it should embody the "Seamless Surface" and "AI-Led" experience principles with a curated, personalized activity feed that guides users into their work.

**Core value proposition:** Transform the homepage from a simple feed display into an intelligent, interactive experience where AI-curated content cards guide users toward their most important work.

## Target Users

- **Primary:** Knowledge workers returning to the app daily
- **Pain points:** Don't know what to focus on first, need to scan multiple tools to find what matters
- **Goals:** See the most important items at a glance, take action directly from the home feed, feel guided by AI toward high-value work

## Current State

The homepage (`src/app/(home)/page.tsx`) currently features:
- User greeting ("Welcome back, {firstName}")
- Two tabs: "For you" and "Recent"
- Horizontal carousel feed (`HorizontalFeed.tsx`) powered by Embla Carousel
- Feed cards with 19 content types, each with bespoke renderers
- Prompt bar at bottom for chat input
- Pre-warming of canvas routes

The existing Home Cards Prototype in the interaction sandbox needs to be identified, evaluated, and its interaction patterns integrated into the production homepage.

## Feature Specifications

### Feature 1: Identify and Evaluate Interaction Sandbox Prototype

**Description:** Locate the Home Cards Prototype in the interaction sandbox, understand its interaction patterns, and determine what to port.

**User flow:**
1. Engineer locates the interaction sandbox (may be a separate branch, repo, or directory)
2. Evaluates the prototype's card interactions, animations, and layout
3. Documents which patterns to port and which to skip
4. Creates integration plan before writing code

**Acceptance criteria:**
- [ ] Interaction sandbox prototype located and documented
- [ ] Interaction patterns catalogued (gestures, animations, transitions, states)
- [ ] Integration plan approved before implementation begins

**Priority:** Must-have (blocking for all other features)

### Feature 2: Card Interaction Patterns

**Description:** Port the prototype's card interaction patterns into the production feed card system. These may include (to be confirmed from prototype):
- Card expand/collapse animations
- Drag-to-act gestures
- Swipe navigation
- Card stacking/deck metaphor
- Focus states with depth (parallax, shadow changes)
- Quick-action overlays on hover/press

**Key integration points:**
- `FeedCard.tsx` — The main card component (supports `horizontal`, `default`, `stack` variants)
- `HorizontalFeed.tsx` — The carousel container
- `ScrollFeedCard.tsx` — Individual carousel items

**Acceptance criteria:**
- [ ] Card interactions from prototype are implemented in production components
- [ ] Animations use motion tokens from `@/lib/motion` (springs, durations, easings)
- [ ] Interactions respect the "Snappy with playful bounce" motion principle
- [ ] Card transitions feel native, not like page loads (Seamless Surface principle)
- [ ] Touch and mouse interactions both work

**Priority:** Must-have

### Feature 3: AI-Curated Feed Intelligence

**Description:** Enhance the feed curation to better surface AI-recommended content. The "For you" tab should feel genuinely personalized, with AI-driven sorting and contextual relevance signals.

**Enhancements:**
- AI-relevance indicators on cards (subtle, not intrusive)
- "Why this matters" context on agent-opportunity and key-metric cards
- Time-sensitive items promoted to front of feed
- Grouping of related items (e.g., all items for one project)

**Acceptance criteria:**
- [ ] "For you" tab shows items ordered by AI-assessed relevance
- [ ] At least one visual indicator of AI curation (subtle badge, priority position)
- [ ] Feed feels curated, not random or purely chronological
- [ ] Feed items can be dismissed/snoozed (progressive disclosure)

**Priority:** Should-have

### Feature 4: Homepage Layout Refinements

**Description:** Refine the homepage layout to better showcase the cards and guide the eye. Potentially include:
- Hero card (featured/urgent item) at increased size
- Transition between "For you" and "Recent" tabs with smooth animation
- Empty state design for new users or quiet days
- Responsive behavior for different viewport sizes

**Acceptance criteria:**
- [ ] Homepage layout feels polished and intentional
- [ ] Tab switching uses motion tokens (no harsh cuts)
- [ ] Empty state provides helpful guidance
- [ ] Layout works at standard desktop viewport sizes (1280px+)

**Priority:** Should-have

## Functional Requirements

### Feed Data Pipeline
- Feed items loaded from `/api/feed` endpoint (currently reads `src/data/feed-items.json`)
- Feed items filtered and sorted (currently by timestamp, enhance with relevance)
- Items selected for carousel via `selectDeskPile()` algorithm (selects 5-8 items)

### Card Component Architecture
- `FeedCard` supports three layout variants: `horizontal`, `default`, `stack`
- Each feed item type has a dedicated content renderer in `src/components/feed/content/`
- `FeedActions` renders action buttons; `FeedReactions` renders emoji reactions
- Card hover states reveal additional actions

### Navigation Integration
- Home is at `/` route within `(home)` route group
- Navigation shows expanded primary panel (228px) on home
- No sidebar secondary panel on home
- Chat prompt at bottom sends to canvas with context

## Technical Requirements

### Key Files to Modify
| File | Changes |
|------|---------|
| `src/app/(home)/page.tsx` | Layout refinements, hero card, tab animations |
| `src/components/feed/HorizontalFeed.tsx` | Updated carousel interactions from prototype |
| `src/components/feed/FeedCard.tsx` | New interaction patterns, animations |
| `src/components/feed/ScrollFeedCard.tsx` | Updated card rendering for carousel |
| `src/components/feed/FeedActions.tsx` | Enhanced action interactions |
| New: `src/components/feed/CardInteractions.tsx` | Shared interaction logic (if needed) |

### Files NOT to Modify
- Feed content renderers (`src/components/feed/content/*`) — only if prototype changes require it
- Feed API (`src/app/api/feed/route.ts`) — data shape unchanged
- Feed types (`src/types/feed.ts`) — extend only if prototype adds new data

### Dependencies
- Framer Motion (existing) — for animations
- Embla Carousel (existing) — for horizontal scroll
- `@/lib/motion` — motion tokens

## Constraints & Considerations

- **Interaction sandbox location:** Must be identified before work begins. May be a separate branch, repo, or directory.
- **Performance:** Card animations must be smooth at 60fps. Use `transform` and `opacity` only.
- **Accessibility:** Cards must be keyboard-navigable. Focus states must be visible.
- **Mobile:** Not required but animations should not break on smaller viewports.

## Out of Scope

- Feed data pipeline changes (backend/API)
- New feed item types
- Feed item creation/editing
- Real-time feed updates (push notifications)

## Validation Plan

### Build Validation
```bash
npm run build
npm run lint
```

### Visual Validation
- [ ] Homepage loads with greeting and feed carousel
- [ ] Cards display all content types correctly
- [ ] Card interactions from prototype work as designed
- [ ] Tab switching between "For you" and "Recent" is smooth
- [ ] Animations use motion tokens (verify in DevTools at 0.25x speed)

### Interaction Validation
- [ ] Cards respond to hover, click, keyboard navigation
- [ ] Carousel scrolls smoothly with mouse wheel and keyboard arrows
- [ ] Card expand/detail interactions work
- [ ] Actions on cards trigger correct behavior
