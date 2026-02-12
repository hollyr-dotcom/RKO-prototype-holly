# Motion System

Motion is a core design language in the canvas prototype. This document defines the philosophy, token system, and usage guidelines for all animation and transition work.

---

## Philosophy

### Snappy with Playful Bounce

The default motion personality is **efficient and responsive** with a **subtle, satisfying overshoot**. Think of it as confident and decisive, with just enough playfulness to feel alive.

- **Springs for enters and interactions.** When things appear or respond to user input, use spring physics. The slight bounce communicates energy and responsiveness.
- **Cubic easings for exits.** When things leave, use clean cubic-bezier curves. Exits should be swift and decisive, not bouncy.
- **Never sluggish.** If motion feels slow or heavy, it's wrong. Tighten the spring or shorten the duration.
- **Never jarring.** If motion feels abrupt or mechanical, it's wrong. Add a spring or soften the easing.

### SVG Morphs for Depth

Shape transitions use smooth SVG morphing to create organic, blob-like effects. This adds dimensionality and reinforces the "seamless surface" principle where UI elements transform rather than swap.

---

## Token System

All motion values live in `src/lib/motion/`. Import from `@/lib/motion`.

### Durations (`tokens.ts`)

| Token | Value | Usage |
|-------|-------|-------|
| `instant` | 100ms | Micro-interactions, instant feedback |
| `fast` | 200ms | Quick transitions, exits, hover states |
| `normal` | 350ms | Standard transitions, panel slides |
| `slow` | 500ms | Surface-level transitions, dramatic reveals |
| `glacial` | 800ms | Reserved for very deliberate, hero animations |

### Easings (`tokens.ts`)

| Token | Curve | Usage |
|-------|-------|-------|
| `standard` | `(0.2, 0, 0, 1)` | General purpose, balanced |
| `decelerate` | `(0, 0, 0, 1)` | Entering elements, settling in |
| `accelerate` | `(0.3, 0, 1, 1)` | Exiting elements, picking up speed |
| `sharp` | `(0.4, 0, 0.2, 1)` | Quick decisive motion, toolbar interactions |
| `emphasized` | `(0.2, 0, 0, 1)` | Hero transitions, dramatic moments |
| `ios` | `(0.25, 0.1, 0.25, 1)` | iOS-like spring approximation |
| `linear` | `(0, 0, 1, 1)` | Progress bars, constant velocity |

### Springs (`tokens.ts`)

| Token | Stiffness | Damping | Mass | Usage |
|-------|-----------|---------|------|-------|
| `gentle` | 120 | 20 | 1 | Calm, relaxed motion |
| `default` | 200 | 24 | 1 | Balanced everyday spring |
| `snappy` | 400 | 30 | 1 | Quick, responsive feedback (project default) |
| `stiff` | 600 | 35 | 1 | Very quick, minimal overshoot |
| `bouncy` | 300 | 15 | 1 | Playful, noticeable overshoot |
| `soft` | 80 | 18 | 1.2 | Slow, elegant, luxurious |

### Delays (`tokens.ts`)

| Token | Value | Usage |
|-------|-------|-------|
| `stagger` | 40ms | Between siblings in a list |
| `sequence` | 120ms | Sequential step delay |
| `cascade` | 80ms | Longer stagger for dramatic reveals |
| `tooltip` | 400ms | Tooltip show delay |
| `none` | 0ms | No delay |

---

## Theme

The project uses a single motion theme defined in `themes.ts`:

```typescript
import { motionTheme } from "@/lib/motion";
```

The theme maps tokens to semantic roles:
- `motionTheme.duration.fast/normal/slow` — duration scale
- `motionTheme.easing.default/enter/exit` — easing by purpose
- `motionTheme.spring.default/responsive` — spring configs
- `motionTheme.stagger` — default stagger delay

---

## Variant Factories

Pre-built variant factories in `variants.ts` cover the most common patterns. Use these before creating custom variants.

| Factory | States | Usage |
|---------|--------|-------|
| `fadeIn` | hidden/visible/exit | Simple opacity transition |
| `fadeInUp` | hidden/visible/exit | Fade + upward slide (popovers, tooltips) |
| `fadeInScale` | hidden/visible/exit | Fade + scale (transient UI, modals) |
| `slideIn` | hidden/visible/exit | Directional slide (panels, drawers) |
| `scalePress` | rest/hover/press | Button press feedback |
| `staggerContainer` | hidden/visible/exit | Parent container for staggered children |
| `staggerItem` | hidden/visible/exit | Child item in a staggered list |
| `expandCollapse` | collapsed/expanded | Height animation (accordions, sections) |

### Usage

```typescript
import { fadeInScale, motionTheme } from "@/lib/motion";

const variants = fadeInScale(motionTheme);

<motion.div
  variants={variants}
  initial="hidden"
  animate="visible"
  exit="exit"
>
  {content}
</motion.div>
```

---

## Rules

### Always

- Import motion values from `@/lib/motion` — never hardcode durations, easings, or spring configs
- Use `AnimatePresence` for exit animations
- Use variant factories for common patterns before creating custom variants
- Stagger children in lists and grids
- Animate `transform` and `opacity` only — avoid animating `width`, `height`, `top`, `left`, or other layout-triggering properties
- Test motion at 0.25x speed (browser DevTools) to verify it feels right

### Never

- Skip motion on new UI — if it appears or disappears, it animates
- Use Tailwind's `transition-*` utilities for complex animations (use framer-motion instead)
- Use `duration.glacial` without a strong reason — it's reserved for hero moments
- Create springs with damping < 10 (too bouncy) or stiffness > 800 (too stiff)

### Tailwind Transitions (Simple Cases)

For simple hover/focus state changes (colour, opacity, background), Tailwind's `transition-colors`, `transition-opacity` are fine. Use `duration-200` as the default.

For anything involving movement, scale, or complex choreography, use framer-motion with tokens.

---

## tldraw Shape Animations

tldraw has its own animation system for canvas shapes (creating, moving, deleting, resizing). These are **separate** from the UI chrome animations.

- Don't try to animate tldraw shapes with framer-motion
- Use tldraw's `editor.animateShape()` and related APIs for shape animations
- The motion token system applies to **UI chrome only** (toolbar, panels, popovers, overlays)
