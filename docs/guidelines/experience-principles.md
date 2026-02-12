# Experience Principles

These are the non-negotiable principles that govern every design and engineering decision in the canvas prototype. Every new surface, component, interaction, and AI behaviour must be measured against these.

---

## 1. Seamless Surface

The product is a work OS. All flows happen on a single, mutable surface that morphs and transitions depending on what the user is doing.

- **No hard page transitions.** Moving between Home, Spaces, and Canvases should feel like navigating a desktop OS, not clicking between web pages.
- **Surfaces morph.** When context changes, the UI reshapes itself — panels slide, toolbars reconfigure, content areas expand and contract.
- **Transient UI.** Interface elements appear and disappear contextually. Popovers, suggestion cards, and action menus emerge when needed and dissolve when done.
- **Spatial continuity.** The user should always feel oriented. Transitions communicate where things came from and where they went.

**Test:** If a transition feels like a "page load," it violates this principle.

---

## 2. AI-Led

AI inputs come first. Traditional tools come second. The interface is designed around AI collaboration, not around manual tooling with AI bolted on.

- **AI is the primary input.** The "Make anything" prompt is the central interaction, not a sidebar feature.
- **Contextual, in-the-moment UI.** AI interactions spawn transient interface elements — reply cards, suggestion chips, follow-up actions, progress indicators — that appear where and when they're relevant.
- **Multi-step processes surface a plan.** When the AI undertakes complex work, it shows its plan, progress, and checkpoints visibly on the canvas.
- **Proactive and reactive.** The AI sometimes drives (suggesting next steps, noticing patterns) and sometimes waits (responding to explicit requests). Context determines which mode.

**Test:** If the AI feels like a chatbot in a sidebar rather than a collaborator on the canvas, it violates this principle.

---

## 3. Invisible Interface

The interface should melt into the background. Users focus on their content, not on chrome.

- **Stripped back and minimalist.** Every element must earn its place. Remove anything that doesn't directly serve the current task.
- **No harsh or overdeveloped UI.** Borders should be subtle, shadows soft, colours restrained. The content is the hero.
- **Progressive disclosure.** Show only what's needed now. Advanced options, secondary actions, and configuration surfaces reveal themselves contextually.
- **Quiet confidence.** The interface should feel assured and calm, never busy or anxious. Whitespace is a feature.

**Test:** If you notice the interface before you notice your content, it violates this principle.

---

## 4. Motion as Language

Motion is a core design element, not decoration. It communicates meaning, creates continuity, and establishes personality.

- **Every surface and component considers motion.** Entry, exit, and interaction states are part of the design, not an afterthought.
- **Snappy with playful bounce.** The default feel is efficient and responsive, with spring-based animations that have a subtle, satisfying overshoot.
- **Motion tokens, not magic numbers.** All durations, easings, and springs come from the centralised token system (`src/lib/motion/`). Never hardcode animation values.
- **SVG morphs for depth.** Shape transitions use smooth morphing to create organic, blob-like effects that add dimensionality.
- **Performance-first.** Animate `transform` and `opacity`. Avoid layout-triggering properties. Motion should feel effortless, never janky.

**Test:** If a new component appears or disappears without animation, it violates this principle.

---

## 5. Built to Endure

This is a prototype, but it must support multiple designers building on top of it over time. Prototype-grade speed, production-grade structure.

- **Clean architecture.** Clear separation between data, logic, and presentation. Components are composable and self-contained.
- **Good abstraction layers.** Data sources, hooks, components, surfaces, and routes each have their place. Don't leak concerns across boundaries.
- **Well-organised files.** Follow established directory conventions. New files go where existing patterns dictate.
- **Readable code.** Favour clarity over cleverness. Name things well. Comment intent, not implementation.
- **Modern and industry-leading.** The aesthetic, patterns, and tooling should reflect current best practices, not legacy approaches.

**Test:** If a new contributor can't understand where to add their work within 5 minutes, it violates this principle.
