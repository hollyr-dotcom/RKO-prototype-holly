# PRD: Tailwind Token + Holistic Visual Overhaul

## Executive Summary

Overhaul the visual foundation of the canvas prototype by pulling design tokens directly from the Figma design system and applying them across all surfaces. This covers box shadows, backgrounds, borders, spacing, typography settings, and colors — establishing a single source of truth from Figma that flows through Tailwind CSS v4 into every component.

**Core rule:** Any surface that is NOT the primary surface (the topmost one) — excluding panels, cards, and buttons — must be white.

**Core value proposition:** The prototype's visual language currently relies on ad-hoc Tailwind defaults and hardcoded values. This overhaul connects every visual property to a deliberate design token, ensuring visual consistency and making future theming changes a single-file operation.

## Figma Source

Design tokens must be extracted from the Figma MCP:
- **File:** `https://www.figma.com/design/rDhGayW2Hvm6fuNQD1nYAy/rko-fy27-design?node-id=1237-3782&m=dev`
- **Node:** `1237-3782` (design tokens / styles page)

Connect to the Figma MCP to read exact values for: color palette, typography scale, spacing scale, shadow definitions, border radius tokens, and border styles.

## Target Users

- **Primary:** Design and engineering team maintaining the prototype
- **Pain points:** Visual inconsistency across surfaces, hardcoded values scattered through components, no single source of truth for design decisions
- **Goals:** Pixel-accurate match to Figma designs, one-file token changes propagate everywhere, clear visual hierarchy between primary and secondary surfaces

## Feature Specifications

### Feature 1: Token Foundation in Tailwind CSS v4

**Description:** Define all design tokens in `globals.css` using Tailwind v4's `@theme` block and CSS custom properties. This replaces any existing ad-hoc values.

**Tokens to define:**

| Category | Examples |
|----------|----------|
| Colors | Gray ramp (50–900), brand primary ramp (12 steps), accent colors, semantic colors (success, warning, error, info) |
| Typography | Font families (Noto Sans body, Roobert PRO headings), font sizes (xs through 2xl), font weights, line heights, letter spacing |
| Spacing | 4px base unit scale (0.5 through 16), component-specific spacing tokens |
| Shadows | Chrome bar shadow, card shadow, elevated shadow, subtle shadow |
| Border radius | `rounded-sm` (2px), `rounded` (4px), `rounded-lg` (8px), `rounded-xl` (12px), `rounded-2xl` (16px), `rounded-full` (pill) |
| Borders | Default border color, subtle border, divider color, border widths |

**User flow:**
1. Engineer connects to Figma MCP and reads token values from node `1237-3782`
2. Tokens are translated into CSS custom properties in `globals.css` `@theme` block
3. Existing Tailwind utility classes automatically pick up new values
4. Components using hardcoded values are updated to use token-based utilities

**Acceptance criteria:**
- [ ] All color tokens from Figma are defined in `globals.css` `@theme` block
- [ ] Typography scale matches Figma (sizes, weights, line heights, families)
- [ ] Spacing scale uses 4px base unit consistent with Figma
- [ ] Shadow tokens defined as CSS custom properties and applied via Tailwind utilities
- [ ] Border radius tokens match Figma definitions
- [ ] No hardcoded color hex values remain in component files (all use Tailwind token classes)

**Priority:** Must-have

### Feature 2: Surface Background Hierarchy

**Description:** Enforce the rule that non-primary surfaces are white. The primary surface (topmost, main content area) retains its designed background. All other surfaces behind or beside it use `#FFFFFF`.

**Surface mapping:**

| Surface | Role | Background |
|---------|------|-----------|
| Canvas viewport | Primary | Existing tldraw background (unchanged) |
| Content area (home, space overview) | Primary | Per-design (may vary) |
| Root/page background | Secondary | `#FFFFFF` |
| Navigation rail | Chrome | Per nav-palette system |
| Secondary panel | Chrome | `#FFFFFF` |
| Chat panel | Chrome | `#FFFFFF` |
| Cards | Content | `#FFFFFF` |
| Modals/popovers | Elevated | `#FFFFFF` + shadow |

**Acceptance criteria:**
- [ ] All non-primary surfaces render with white background
- [ ] Primary surface (topmost content area) retains designed background per route
- [ ] Panels, cards, and buttons are excluded from the white-only rule (they follow design system)
- [ ] No gray backgrounds on secondary surfaces unless explicitly designed

**Priority:** Must-have

### Feature 3: Shadow System Overhaul

**Description:** Replace all shadow usage with the token-based shadow system from Figma. Remove any Tailwind default shadow classes (`shadow-md`, `shadow-lg`, `shadow-xl`) in favor of custom token shadows.

**Shadow tokens (expected from Figma, confirm values via MCP):**

| Token | Expected Use | Current Guideline Value |
|-------|-------------|------------------------|
| `--shadow-chrome` | Floating chrome (masthead, toolbar) | `0 4px 24px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)` |
| `--shadow-card` | Cards, popovers | `0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)` |
| `--shadow-elevated` | Modals, dropdowns | TBD from Figma |
| `--shadow-subtle` | Hover states, focus rings | TBD from Figma |

**Acceptance criteria:**
- [ ] All shadow values sourced from Figma and defined as CSS custom properties
- [ ] Tailwind shadow utilities extended or replaced with token-based classes
- [ ] No Tailwind default `shadow-*` classes remain (all use design-token shadows)
- [ ] Chrome bar shadow, card shadow, and elevated shadow are visually distinct

**Priority:** Must-have

### Feature 4: Typography Audit and Update

**Description:** Audit every text element across all surfaces and ensure they match the Figma typography scale. Update font sizes, weights, line heights, and letter spacing.

**Key areas to audit:**
- Navigation items (sidebar, rail, expanded panel)
- Feed card text (titles, body, metadata, timestamps)
- Page headings (home greeting, space headers)
- Toolbar labels and inputs
- Chat panel messages
- Canvas chrome (masthead, zoom controls)

**Acceptance criteria:**
- [ ] All text elements use Tailwind typography utilities mapped to Figma tokens
- [ ] No arbitrary font sizes (e.g., `text-[14px]`) remain
- [ ] Heading hierarchy is consistent: `text-xl` for page headings, `text-lg` for sections, `text-sm` for body, `text-xs` for metadata
- [ ] Font weight usage is consistent: `font-semibold` for headings, `font-medium` for labels, `font-normal` for body

**Priority:** Must-have

### Feature 5: Border and Spacing Consistency Pass

**Description:** Audit all borders and spacing values. Replace any hardcoded or inconsistent values with token-based equivalents.

**Acceptance criteria:**
- [ ] All borders use `border-gray-200` (or the Figma-specified border color token)
- [ ] Spacing follows 4px grid: no arbitrary values like `p-[13px]`
- [ ] Consistent component padding: `p-1.5` for compact, `p-3` for standard, `p-4` for sections
- [ ] Consistent gaps: `gap-2` for tight, `gap-3` for standard, `gap-4` for sections

**Priority:** Must-have

## Functional Requirements

### Input: Figma MCP Token Extraction
- Connect to Figma MCP at the specified file URL
- Navigate to node `1237-3782` (design tokens page)
- Extract: color palette, typography scale, spacing scale, shadow definitions, border radius, border styles
- Document extracted values in a reference table before applying

### Output: Updated Token System
- All tokens live in `src/app/globals.css` within the `@theme` block
- Components updated to reference tokens via Tailwind utility classes
- No breaking changes to component APIs (only visual changes)

## Technical Requirements

### Architecture
- **Token source of truth:** `src/app/globals.css` `@theme` block
- **No new dependencies** — uses Tailwind CSS v4 native custom property system
- **Backward compatible** — existing Tailwind utility classes continue to work, just with updated values

### Key Files to Modify
| File | Changes |
|------|---------|
| `src/app/globals.css` | Add/update `@theme` block with all design tokens |
| `src/components/feed/FeedCard.tsx` | Update shadow, border, spacing classes |
| `src/components/feed/HorizontalFeed.tsx` | Update spacing, shadows |
| `src/components/toolbar/Toolbar.tsx` | Update shadow, spacing, radius |
| `src/components/AppSidebar.tsx` | Update backgrounds, borders |
| `src/components/PrimaryRail.tsx` | Update backgrounds, spacing |
| `src/components/SecondaryPanel.tsx` | Update backgrounds, borders |
| `src/components/ExpandedPrimaryPanel.tsx` | Update backgrounds, borders |
| `src/components/SpaceCard.tsx` | Update shadow, border, spacing |
| `src/components/CanvasCard.tsx` | Update shadow, border, spacing |
| `src/app/(home)/page.tsx` | Update background, spacing, typography |
| `src/app/space/[spaceId]/page.tsx` | Update background, spacing |

### Files NOT to Modify
- `src/components/Canvas.tsx` — tldraw's internal rendering
- tldraw shape utilities — custom shapes have their own design system
- `src/lib/motion.ts` — motion tokens are separate concern

## Constraints & Considerations

- **Figma MCP dependency:** This work cannot start without Figma MCP access to read token values. If MCP is unavailable, fall back to guideline-documented values in `docs/guidelines/design-system.md`.
- **Tailwind v4:** No `tailwind.config.ts` file — all configuration is CSS-based via `@theme` directive.
- **No visual regressions:** Changes should improve consistency, not break existing layouts. Test all major surfaces visually.
- **Performance:** No runtime computation for tokens — all resolved at build time via CSS custom properties.

## Out of Scope

- Brand color ramp generation (covered by PRD: Brand Overlay)
- Navigation palette system changes (existing `nav-palette.ts` is untouched unless Figma specifies different values)
- Motion token changes (separate system in `src/lib/motion.ts`)
- New component creation — this is a visual audit, not a feature build

## Validation Plan

### Token Validation
```bash
# Build succeeds with updated tokens
npm run build

# Lint passes
npm run lint
```

### Visual Validation
- [ ] Home page: greeting, feed cards, prompt bar match Figma
- [ ] Space overview: header, canvas cards, sidebar match Figma
- [ ] Canvas: toolbar, masthead, chat panel, zoom controls match Figma
- [ ] All non-primary surfaces are white
- [ ] Shadows are soft and consistent (no harsh Tailwind defaults)
- [ ] Typography hierarchy is clear and consistent
- [ ] Spacing follows 4px grid throughout

### Regression Check
- [ ] No layout shifts or broken alignments
- [ ] Animations still work (motion tokens untouched)
- [ ] Dark-on-light contrast ratios meet WCAG AA (4.5:1 for body text)
