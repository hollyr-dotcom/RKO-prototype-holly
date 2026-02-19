# Visual System — Home Feed Previews

Principles for the visual previews that appear inside feed cards on the home screen.

## Core Philosophy

**Apple WatchOS information density.** Only the critical signal. Typography carries the data, visual elements carry the shape. Strip everything else.

## Container Rules

Preview visuals sit **directly on the card's white background** — no gray container, no outline, no extra wrapper chrome. The card itself is the container.

- No `bg-gray-50` or equivalent tinted background around previews
- No border or outline separating the preview from the card body
- Minimal horizontal padding (`px-1`) to keep content from touching card edges
- `mt-3` spacing from the text content above

**Rationale:** Every layer of visual nesting (background, border, padding) adds noise. Feed cards are already bounded — the preview content doesn't need a second frame.

## What to Show

| Element | Guideline |
|---|---|
| **Data content** | Charts, bars, lines, rings — the actual visual signal. Always present. |
| **Labels** | Only where they carry meaning the shape alone can't. Inside bars when wide enough. Abbreviated month headers for timelines. Hero numbers for metrics. |
| **Title** | Small (`text-xs`), gray (`text-gray-500`), `font-medium`. Sits above the visual. Comes from data, not hardcoded. |
| **Today marker** | Single `1px` line, `rgba(0,0,0,0.12)`. No dot, no label. |

## What NOT to Show

- Background containers or outlines around previews
- Axis lines, gridlines, or divider lines
- Borders on chart bars or data elements (exception: timeline bars use FormatPreview-style `1px solid` colored borders for definition)
- "Today" text labels, milestone diamonds, or decorative markers
- Legends or keys (the data labels serve this purpose)
- Any chrome that doesn't directly encode information

## Color Palette for Data Elements

Bars, segments, and data markers use the **FormatPreview pastel palette** — light fills with colored borders and dark text for contrast:

| Track Color | Background | Border | Text |
|---|---|---|---|
| Blue `#4262FF` | `#DBEAFE` | `#4262FF` | `#1E40AF` |
| Green `#10b981` | `#BBF7D0` | `#22C55E` | `#166534` |
| Purple `#8b5cf6` | `#EDE9FE` | `#8b5cf6` | `#4C1D95` |
| Indigo `#6366f1` | `#E0E7FF` | `#6366f1` | `#3730A3` |
| Amber `#f59e0b` | `#FEF9C3` | `#FACC15` | `#854D0E` |
| Red `#ef4444` | `#FEE2E2` | `#F87171` | `#991B1B` |

Unknown colors: auto-generate by mixing 15% color with 85% white for background, original as border, 35% brightness for text.

## Typography Tokens

| Role | Size | Weight | Color |
|---|---|---|---|
| Preview title | `11px` / `text-xs` | 500 | `text-gray-500` |
| Month / axis labels | `11px` | 500 | `text-gray-400` |
| Bar labels (inside bars) | `11px` | 500 | Palette dark text |
| Hero metric numbers | `20-24px` | 700 | `text-gray-900` |
| Metric context labels | `11px` | 400 | `text-gray-500` |

## Migration Status

| Preview Type | Container chrome removed | Notes |
|---|---|---|
| TimelinePreview | Done | Pastel bar palette, no container bg |
| MetricsPreview | Pending | Strip gray container, let numbers breathe |
| LineChartPreview | Pending | Strip container, keep sparkline + axis labels |
| BarChartPreview | Pending | Strip container, apply pastel palette |
| DonutChartPreview | Pending | Strip container |
| HeatmapPreview | Pending | Strip container |
| ProgressBarsPreview | Pending | Strip container |
| All others | Pending | Same principle applies |

## Implementation Reference

- **Component:** `src/components/feed/visuals/GenericVisualPreview.tsx`
- **Color mapping:** `getBarPalette()` function in the same file
- **Data source:** `src/data/feed-items.json` — each item's `visualPreview.data` object
