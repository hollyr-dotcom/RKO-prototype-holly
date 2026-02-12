# Design System

This document defines the visual language of the canvas prototype — components, colours, typography, spacing, and effects.

---

## Component Strategy

### Miro Design System (Selective Use)

Use `@mirohq/design-system` components for foundational UI elements:

- **Button** / **IconButton** — all button interactions
- **Icons** — `@mirohq/design-system-icons` for the icon library
- **Basic inputs** — where Miro DS provides them

### Custom Components (Experience-Specific)

Build custom for anything that defines the canvas experience:

- **Toolbar** — the unified AI + tools toolbar
- **Masthead** — board identity and actions bar
- **Chat Panel** — AI conversation interface
- **Canvas chrome** — zoom controls, starting prompts, overlays
- **Cards** — space cards, canvas cards, AI artifact cards
- **Shapes** — tldraw custom shape UIs (documents, data tables)

### Decision Rule

> If Miro DS has a component that fits, use it. If the component is experience-defining or needs custom motion/behaviour, build custom.

---

## Colour Palette

### Foundation (Miro Brand)

Use Miro's colour system as the base. Key values observed in the codebase:

| Token | Value | Usage |
|-------|-------|-------|
| `gray-50` | `#F9FAFB` | Subtle backgrounds, hover states |
| `gray-100` | `#F3F4F6` | Active nav items, section backgrounds |
| `gray-200` | `#E5E7EB` | Borders, separators |
| `gray-400` | `#9CA3AF` | Muted icons, secondary text |
| `gray-600` | `#4B5563` | Secondary text |
| `gray-900` | `#111827` | Primary text, headings |
| `white` | `#FFFFFF` | Card backgrounds, chrome surfaces |
| `blue-50` | `#EFF6FF` | Active canvas item background |
| `blue-900` | `#1E3A5F` | Active canvas item text |

### AI Palette

Colours specific to AI presence and artifacts (to be refined as AI features develop):

| Token | Usage |
|-------|-------|
| AI accent | AI cursor, AI-generated artifact borders |
| AI subtle | AI suggestion backgrounds |
| AI working | Progress indicators, "working" state |

### Surface Colours

| Surface | Background | Border |
|---------|-----------|--------|
| Chrome bars (masthead, toolbar) | `white` | `gray-200` |
| Sidebar | `white` | `gray-200` (right border) |
| Chat panel | `white` | `gray-200` (left border) |
| Canvas | tldraw default with dot grid |
| Cards | `white` | `gray-200` |

---

## Typography

### Scale

Based on patterns observed in the current codebase:

| Token | Size | Weight | Usage |
|-------|------|--------|-------|
| `text-xs` | 11px | 500 | Badges, labels, metadata |
| `text-sm` | 14px | 400/500/600 | Navigation, sidebar items, body text |
| `text-base` | 16px | 400 | Default body text |
| `text-lg` | 18px | 600 | Section headings |
| `text-xl` | 20px | 600 | Page headings |

### Font

System font stack via Tailwind defaults. No custom fonts.

### Rules

- Use Tailwind's text utilities (`text-sm`, `text-base`, etc.) rather than arbitrary values like `text-[14px]`
- Heading weight: `font-semibold` (600)
- Body weight: `font-normal` (400) or `font-medium` (500)
- Truncate long text with `truncate` class, never let it overflow

---

## Spacing

### Base Unit

**4px** base unit. All spacing should be multiples of 4.

| Token | Value | Common Usage |
|-------|-------|-------------|
| `0.5` | 2px | Tight gaps between inline elements |
| `1` | 4px | Minimum spacing |
| `1.5` | 6px | Compact padding (e.g., sidebar header `px-1.5`) |
| `2` | 8px | Standard small gap |
| `3` | 12px | Standard padding, medium gap |
| `4` | 16px | Section padding |
| `5` | 20px | Separator height |
| `6` | 24px | Large section gap |
| `8` | 32px | Major section spacing |

### Rules

- Use Tailwind spacing utilities (`gap-2`, `px-3`, `py-4`)
- Avoid arbitrary spacing values (`p-[13px]`)
- Consistent padding within chrome surfaces: `p-1.5` for compact, `p-3` for standard

---

## Shadows

### Chrome Bar Shadow

Used on the masthead and toolbar — the floating chrome surfaces:

```css
box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
```

This creates a soft, elevated feel without harsh edges. Use this consistently for all floating chrome.

### Card Shadow

For cards and elevated content areas:

```css
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
```

### Rules

- Floating chrome (masthead, toolbar) uses the chrome bar shadow
- Cards and popovers use the card shadow
- Never use Tailwind's default `shadow-lg` or `shadow-xl` — too harsh for this aesthetic
- Shadows should feel soft and subtle, reinforcing the "invisible interface" principle

---

## Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-full` | pill | Chrome bars (masthead, toolbar), primary buttons |
| `rounded-lg` | 8px | Cards, popovers, sidebar items, shape containers |
| `rounded` | 4px | Small elements, badges |

### Rules

- Chrome surfaces are pills (`rounded-full`)
- Content containers are `rounded-lg`
- Never use sharp corners (no `rounded-none` on visible elements)

---

## Borders

- Default border: `border border-gray-200`
- Subtle border: `border border-gray-200/60`
- Separators: `w-px h-5 bg-gray-200` (vertical) or `border-t border-gray-200` (horizontal)
- Keep borders subtle. They define edges, not draw attention.

---

## Icons

- Source: `@mirohq/design-system-icons`
- Default size: 16px (`css={{ width: 16, height: 16 }}`) for compact contexts, 18px for navigation
- Use `IconButton` from Miro DS for icon-only buttons
- Icon colour follows text colour (inherits from parent)
