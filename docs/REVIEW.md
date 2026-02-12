# Rules Branch Review & Recommendations

## Executive Summary

The new guidelines in the `rules` branch represent a **massive upgrade** in clarity, actionability, and strategic alignment. This is production-quality documentation that transforms vague principles into concrete, enforceable rules.

**Overall Grade: A**

The work is exceptional. My criticisms below are refinements, not fundamental flaws.

---

## What's Exceptional

### 1. **Experience Principles** ✨

**Strengths:**
- **"Seamless Surface"** - Brilliant. The OS metaphor is perfect. "If it feels like a page load, it violates this principle" is a razor-sharp test.
- **"AI-Led"** - Love the inversion: "AI inputs first, traditional tools second." This is differentiated positioning.
- **"Motion as Language"** - Making motion a first-class design element (not decoration) elevates the entire prototype.
- **"Built to Endure"** - Acknowledging this is a prototype but architecting for handoff is wise.
- **"Invisible Interface"** - Progressive disclosure section (line 39) is perfect.

**Critical Test Questions** (consider adding these):
- Seamless Surface: "Can I orient myself after a transition?"
- AI-Led: "Would this work if I removed the chatbot entirely?"
- Invisible Interface: "Am I fighting the UI or focusing on my work?"
- Motion as Language: "Does this motion communicate intent, or just exist?"

### 2. **AI Behaviour** 🤖

**Strengths:**
- **Voice examples table** - chef's kiss. This is how you teach tone.
- **Driver vs Sidekick modes** - clear mental model with clear triggers.
- **Complexity assessment** - the "Just Do It" vs "Agentic Flow" split is exactly right.

**Refinement Needed:**
The **checkpoint/feedback strategy** should emphasize AI judgment over rigid rules. Right now it says "pause at natural breakpoints" but could be clearer about the principle:

```markdown
### Checkpoint Strategy (Agentic)

The AI should judge when to checkpoint based on context, not formulas. Give principles, not prescriptions:

**Checkpoint when:**
- The user might want to course-correct before you continue
- You're about to switch contexts or directions
- The work so far is substantial enough to review
- You're uncertain about the direction

**Don't checkpoint when:**
- You're mid-flow on a coherent task
- The next step is obvious and connected
- You're just narrating progress

**Meta-principle:** The AI should ask itself "Does the user NEED to see this before I continue?" Trust the AI's judgment based on context, not rigid formulas.

❌ Avoid: "Checkpoint every 3 steps" or "checkpoint after 5 shapes"
✅ Better: "Checkpoint when context shifts, uncertainty emerges, or you're about to commit to a major direction"
```

**Minor Addition:**
The "AI Presence on Canvas" table (lines 89-98) describes visual states but doesn't explain **where** the cursor should be. Consider adding:
- "Working state cursor stays near the content being created (not off-screen)"
- "Asking state appears centered or near last interaction point"

### 3. **Surface Architecture** 🏗️

**Strengths:**
- **ASCII diagram** (lines 109-123) - instantly clarifying
- **Transition model** - directional motion rules are spot-on
- **Chrome definition** - naming the floating UI "chrome" is perfect

**Optional Addition:**
**State persistence rules** could help future contributors:
```markdown
### State Persistence

| Surface | Persists | Resets On |
|---------|----------|-----------|
| Sidebar collapsed/expanded | Across navigation | Never (localStorage) |
| Chat panel open/closed | Within canvas | Canvas switch |
| Zoom level | Within canvas | Canvas switch |
| Selected shapes | Never | Any navigation |
```

### 4. **Design System** 🎨

**Strengths:**
- **Component strategy** - "If Miro DS fits, use it. If experience-defining, build custom." Clear decision rule.
- **Shadow definitions** - specific values prevent visual drift
- **No arbitrary values** rule - this keeps the system honest

**Refinements:**
- **AI Palette** (lines 52-60) is a placeholder. Either define it now or remove the section. Placeholder tokens create confusion.
- **Typography scale** - consider adding `text-2xl` (24px) for hero headings (Home page "Welcome back, Andy")

### 5. **Motion System** 🎬

**Strengths:**
- **"Snappy with playful bounce"** - this is a personality, not just a spec
- **Token system** - comprehensive and well-organized
- **Variant factories** - pre-built patterns prevent reinventing motion

**Consider Adding:**
A **debugging section** for common motion issues:
```markdown
## Debugging Motion

### Common Issues

| Problem | Cause | Fix |
|---------|-------|-----|
| Motion feels sluggish | Duration too long or spring too soft | Use `fast` duration or `snappy` spring |
| Motion feels jarring | No easing or instant snap | Add `decelerate` easing for enters |
| Motion causes layout shift | Animating width/height | Animate `transform: scale()` instead |

### Testing Checklist
- [ ] Test at 0.25x speed (DevTools)
- [ ] Verify no layout thrashing (Performance tab)
- [ ] Check that motion serves purpose, not decoration
```

### 6. **Glossary** 📖

**Strengths:**
- **Comprehensive** - covers product, canvas, UI, AI, and architecture terms
- **Consistent naming** - enforces vocabulary across team

**Optional Addition:**
A **"Don't Use"** section to prevent bad habits:
```markdown
## Terms to Avoid

| ❌ Don't Use | ✅ Use Instead | Why |
|-------------|---------------|-----|
| "Board" | "Canvas" | "Board" is Miro's term for static boards; this is an AI canvas |
| "Sidebar chat" | "Chat Panel" | It's a panel, not part of the sidebar |
| "Popup" | "Popover" | Popups are aggressive; popovers are contextual |
| "Modal" | "Dialog" or "Overlay" | Modals block everything; we prefer less intrusive patterns |
| "Loading spinner" | "Progress indicator" | More precise |
```

---

## Major Gaps

### 1. **Error Handling & Edge Cases**

None of the docs address:
- What happens when AI fails mid-plan?
- What if the canvas API is slow?
- What if Liveblocks disconnects?
- What if the user closes the tab during AI work?

**Recommendation:** Add `docs/guidelines/error-states.md`:
```markdown
# Error States & Recovery

## AI Failures

Let the AI handle failures gracefully through natural language, not rigid error codes.

**Mid-plan failure:**
- ✅ "Hmm, that didn't work. Let me try a different approach."
- ❌ "Error: Tool execution failed. Code 500."

**Timeout/Slow Operations:**
- ✅ "This is taking longer than expected. Still working..."
- ❌ Show endless spinner with no communication

**Principle:** The AI should narrate problems like a collaborator would, not throw exceptions at the user.

## Network Issues
- **Canvas save failure:** Yellow banner: "Changes not saved. Reconnecting..."
- **Liveblocks disconnect:** Presence indicators fade, banner appears
- **Recovery:** Auto-retry with exponential backoff (no user action needed)

## User Actions During AI Work
- **Close tab:** Warn if AI is mid-execution
- **Navigate away:** "AI is still working. Leave anyway?"
- **Edit during AI work:** AI yields: "I'll wait while you edit"

**Principle:** Prevent data loss, but don't be annoying. One confirmation is enough.
```

### 2. **Performance Budgets**

Motion system is great, but there's no guidance on **when to skip motion** for performance.

**Recommendation:** Add to motion-system.md:
```markdown
## Performance Budgets

### When to Skip Animation

Let the AI and components decide based on context:
- Creating many shapes at once → fade in as group, don't animate individually
- Rapid-fire tool calls → batch and show result
- Complex operations → simplify motion to maintain responsiveness

### Detection

```typescript
// Respect user motion preferences
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
```

**Principle:** Favor responsiveness over fancy motion. If animating slows things down, skip it. Trust implementation to make smart choices.
```

### 3. **AI Prompting Philosophy**

The docs say **what** the AI should do, but not **how to encode these principles** in a way that lets the AI exercise judgment.

**Recommendation:** Add `docs/guidelines/ai-prompting.md`:
```markdown
# AI Agent Prompting Philosophy

## Core Principle: Agentic, Not Scripted

The AI is a **capable model** that should exercise judgment, not follow rigid scripts. Give principles and judgment criteria, not formulas.

❌ **Avoid rigid rules:**
- "Checkpoint every 3 steps"
- "If 8 steps and 4 done, show progress"
- "Always ask exactly 2 questions"

✅ **Give judgment criteria:**
- "Checkpoint when the user needs to course-correct"
- "Show progress when it helps the user understand where you are"
- "Ask questions when you're uncertain, not to fill a quota"

## System Prompt Structure

### 1. Role & Principles
- "You're a canvas AI collaborator..."
- Reference experience-principles.md
- Emphasize: warm, efficient, decisive

### 2. Core Behaviors
- **Simple tasks:** Just do them. No plan, no ceremony.
- **Complex tasks:** Assess → Plan (if uncertain) → Execute → Checkpoint (if user needs to see)
- **Uncertainty:** Ask questions, but batch them

### 3. Tone & Voice
Reference ai-behaviour.md voice examples. Show good/bad pairs.

### 4. Tools & Capabilities
List available tools with **purpose**, not just mechanics:
- `createLayout` - for organized content (let the layout engine position)
- `askUser` - when you need input (batch questions)
- `confirmPlan` - when work is substantial and user should approve direction
- `checkpoint` - when user needs to see progress before you continue

### 5. Self-Reflective Tests

Before acting, the AI should ask itself:
- "Does this feel like a collaborator or a chatbot?" (collaborator wins)
- "Am I using judgment or following a formula?" (judgment wins)
- "Does the user NEED this interaction, or am I just being thorough?" (need wins)
- "Am I creating value or creating friction?" (value wins)

## What NOT to Prompt

Don't prescribe:
- Exact number of steps in a plan
- Exact phrasing for every situation
- Rigid checkpoint intervals
- Specific layouts or visual details (let the AI design)

**Trust the model.** It's smarter than our rules. Give it principles, judgment criteria, and examples. Let it figure out the details.

## Examples Over Rules

Instead of "always do X," show examples:

**Situation:** User asks to "create a roadmap"

❌ **Bad response:**
"Great question! I'd be happy to help you create a roadmap! Let me ask you some questions first:
1. How many phases?
2. What timeframe?
3. Should I include milestones?
4. What about dependencies?
5. Any specific format?"

✅ **Good response:**
"Creating a roadmap. What timeframe should this cover? (Q1, full year, 18 months?)"

**Why it's good:**
- Warm but not chatty
- Asks one clear question (not a quiz)
- Moves forward decisively

## Updating Prompts

When the AI makes bad decisions:
1. **Don't add more rules.** Ask: "What principle was violated?"
2. **Make the principle clearer.** Add an example showing good vs bad.
3. **Add a self-reflective test.** Help the AI catch itself.

The goal is a **smart collaborator**, not a rule-following automaton.
```

---

## Conflicts & Contradictions

### 1. **"Invisible Interface" vs "Motion as Language"**

- **Invisible Interface** says: "melt into the background"
- **Motion as Language** says: "motion is a core design element"

These can conflict. If motion is too prominent, it violates invisible interface.

**Resolution:** Add to experience-principles.md:
```markdown
### Resolving Invisible Interface + Motion as Language

Motion should be **felt, not seen**. It guides attention and creates continuity, but it shouldn't be distracting.

**Good motion:** Panels slide smoothly. You notice the content arriving, not the animation.
**Bad motion:** Exaggerated bounces, long durations, motion that draws attention to itself.

**Test:** If someone says "wow, cool animation," it's probably too much. If they say "that felt smooth," you nailed it.
```

### 2. **"Stripped back" vs "Proactive AI"**

- **Invisible Interface** wants minimal UI
- **AI-Led** wants proactive suggestions and visible presence

How do you be proactive without cluttering?

**Resolution:** Add to ai-behaviour.md:
```markdown
### Balancing Proactivity & Minimalism

AI suggestions should be:
1. **Contextual** - appear only when relevant
2. **Dismissible** - easy to ignore/close
3. **Lightweight** - small chips, not big modals
4. **Transient** - fade after a few seconds if not interacted with

**Bad:** Persistent "Try this!" banners
**Good:** Subtle chip near relevant content that fades in 5s
```

---

## Structure & Discoverability

### Current Structure
```
docs/
├── guidelines/
│   ├── experience-principles.md ⭐
│   ├── ai-behaviour.md ⭐
│   ├── surface-architecture.md ⭐
│   ├── design-system.md ⭐
│   ├── motion-system.md ⭐
│   └── glossary.md ⭐
└── plans/
    ├── 2026-02-02-layout-engine-design.md
    └── 2026-02-01-ai-canvas-collaboration-design.md
```

**Issues:**
1. **No entry point** - where do I start?
2. **No hierarchy** - which docs are most important?
3. **No linking** - docs don't reference each other

**Recommendation:** Add `docs/README.md`:
```markdown
# Canvas Prototype Documentation

## Start Here

New to the project? Read in this order:
1. [Experience Principles](guidelines/experience-principles.md) - Core philosophy
2. [Glossary](guidelines/glossary.md) - Learn the vocabulary
3. [Surface Architecture](guidelines/surface-architecture.md) - Understand the structure

## For Designers

- [Design System](guidelines/design-system.md)
- [Motion System](guidelines/motion-system.md)

## For Engineers

- [AI Behaviour](guidelines/ai-behaviour.md)
- [AI Prompting Philosophy](guidelines/ai-prompting.md) *(to be created)*
- [Surface Architecture](guidelines/surface-architecture.md)

## Historical Context

- [Plans](plans/) - Design documents and decisions
```

---

## Actionable Next Steps

### Priority 1: Fill Critical Gaps
1. ✅ Add **checkpoint strategy** with agentic principles to ai-behaviour.md
2. 🔴 Add **error states** document emphasizing AI judgment
3. 🔴 Add **AI prompting philosophy** document
4. 🟡 Add **performance budgets** to motion-system.md

### Priority 2: Resolve Conflicts
1. 🟡 Add **conflict resolution** sections to experience-principles.md
2. 🟡 Clarify **when motion is too much**
3. 🟡 Define **proactive AI boundaries**

### Priority 3: Improve Discoverability
1. 🔴 Create `docs/README.md` entry point
2. 🟡 Add **cross-links** between related docs
3. 🟡 Add **"See also"** sections at end of each doc

### Priority 4: Operationalize
1. 🔴 Create **AI system prompt** that embeds these principles (not rules)
2. 🟡 Create **PR checklist** that references these docs
3. 🟡 Create **design review template** based on experience principles

### Not Prioritizing (By Design)
- ⚪ Accessibility guidelines - not a focus for this prototype phase

---

## Final Thoughts

This is **world-class documentation**. It's clear, opinionated, and actionable. Most design systems are vague ("be consistent"). Yours has teeth ("If it feels like a page load, it violates this principle").

The gaps I identified are:
1. **Error handling** - what happens when things break?
2. **Performance** - when do we skip fancy stuff?
3. **AI prompting philosophy** - how do we encode these principles while keeping the AI agentic?

Fill those, and you'll have a complete, production-ready system.

**The most important refinement:** Lean harder into **agentic AI**. Don't prescribe formulas. Give the model principles, judgment criteria, and examples. Trust it to make smart decisions. Your "Motion as Language" principle already does this well - apply that same philosophy to AI behavior.

**Grade: A** (would be A+ with the gaps filled)

You should be proud of this work. It's rare to see prototype docs this thorough.
