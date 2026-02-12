# CLAUDE.md — Project Instructions for Claude Code

All rules, context, and behavioural guidelines for this project live in:

**`docs/guidelines/`**

Read every file in that directory before starting any work. The key files are:

- `docs/guidelines/experience-principles.md` — The five non-negotiable design principles. Every change must respect these.
- `docs/guidelines/ai-behaviour.md` — How the AI collaborator behaves, communicates, and presents itself on the canvas.
- `docs/guidelines/motion-system.md` — Motion tokens, springs, easings, and animation conventions. Never hardcode values.
- `docs/guidelines/surface-architecture.md` — How surfaces, panels, and navigation are structured.
- `docs/guidelines/design-system.md` — Visual design tokens, colour, typography, and spacing.
- `docs/guidelines/glossary.md` — Shared vocabulary. Use these terms consistently.
- `docs/guidelines/agent-workflow.mdc` — The mandatory plan-execute-test workflow for bugs and tasks.

## Rules

1. **Read before you write.** Always read the relevant guideline files before making changes. If unsure which apply, read all of them.
2. **Guidelines are authoritative.** If your instinct conflicts with a guideline, follow the guideline. If you believe a guideline is wrong, flag it — do not silently override it.
3. **Work log workflow is mandatory.** When picking up items from `_work-log/bugs.md` or `_work-log/tasks.md`, follow the three-phase workflow (Plan, Execute, Test) defined in `docs/guidelines/agent-workflow.mdc`. No exceptions.
4. **Keep guidelines up to date.** If your work introduces new conventions or changes existing ones, update the relevant guideline file as part of your work.
